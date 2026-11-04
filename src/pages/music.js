/**
 * 背景轻音乐控制（B 模块 UI 辅助）
 *
 * 规则：
 * - 每次打开页面时，按当前本地时间划分清晨 / 白天 / 傍晚 / 夜晚四个时段
 * - 从对应时段曲库中随机选一首，之后单曲循环这一首
 * - 默认进入页面即自动播放；浏览器拦截有声自动播放时先静音播放，首次交互后再渐入声音
 * - 音量从 0 缓慢升到 0.3，避免打开页面时突然炸麦
 * - 切换页面不影响播放；用户主动暂停会记住偏好，下次进入不再自动播放
 * - 音频均为项目内合成，不依赖外部音乐链接
 */

const PREF_KEY = "jyo_music_pref";
const VOLUME = 0.3;
const FADE_IN_MS = 4000;

const TIME_SLOTS = [
  {
    key: "morning",
    label: "清晨",
    start: 5,
    end: 9,
    tracks: [
      { src: "assets/music/morning-dew.mp3", title: "晨露" },
      { src: "assets/music/morning-breeze.mp3", title: "林间微风" },
      { src: "assets/music/morning-birds.mp3", title: "鸟鸣渐起" },
    ],
  },
  {
    key: "day",
    label: "白天",
    start: 9,
    end: 17,
    tracks: [
      { src: "assets/music/day-sunlight.mp3", title: "午后阳光" },
      { src: "assets/music/day-window.mp3", title: "窗边绿意" },
      { src: "assets/music/day-playground.mp3", title: "操场微风" },
    ],
  },
  {
    key: "evening",
    label: "傍晚",
    start: 17,
    end: 21,
    tracks: [
      { src: "assets/music/evening-dusk.mp3", title: "暮色" },
      { src: "assets/music/evening-lamplight.mp3", title: "灯下" },
      { src: "assets/music/evening-homeward.mp3", title: "归途" },
    ],
  },
  {
    key: "night",
    label: "夜晚",
    start: 21,
    end: 5,
    tracks: [
      { src: "assets/music/night-stars.mp3", title: "星夜" },
      { src: "assets/music/night-rain.mp3", title: "夜雨" },
      { src: "assets/music/night-radio.mp3", title: "深夜电台" },
    ],
  },
];

let audio = null;
let button = null;
let statusRegion = null;
let tooltip = null;
let currentTrack = null;
let currentSlot = null;
let isPlaying = false;
let wantPlaying = false;
let hasStarted = false;
let silentMode = false;
let unlocking = false;
let gestureBound = false;
let fadeFrame = null;

function getTimeSlot(date) {
  const hour = date.getHours();
  return (
    TIME_SLOTS.find((slot) => {
      if (slot.start < slot.end) {
        return hour >= slot.start && hour < slot.end;
      }
      return hour >= slot.start || hour < slot.end;
    }) || TIME_SLOTS[0]
  );
}

function chooseTrack(slot, excludeSrc) {
  const candidates = slot.tracks.filter((track) => track.src !== excludeSrc);
  const pool = candidates.length > 0 ? candidates : slot.tracks;
  return pool[Math.floor(Math.random() * pool.length)];
}

function readPreference() {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch (e) {
    return null;
  }
}

function writePreference(value) {
  try {
    localStorage.setItem(PREF_KEY, value);
  } catch (e) {
    // 隐私模式下可能不可写，不影响播放
  }
}

function announce(message) {
  if (statusRegion) {
    statusRegion.textContent = message;
  }
}

function updateButton(playing, quiet) {
  isPlaying = playing;
  button.classList.toggle("is-playing", playing);
  button.classList.remove("is-resume");

  const name = currentTrack ? `${currentSlot.label} · ${currentTrack.title}` : "背景音乐";
  let label;
  if (playing) {
    label = silentMode ? `开启声音：${name}` : `暂停：${name}`;
  } else {
    label = `播放：${name}`;
  }
  button.setAttribute("aria-pressed", String(playing));
  button.setAttribute("aria-label", label);
  button.title = label;

  if (tooltip && currentTrack) {
    tooltip.textContent = silentMode ? "点击开启声音" : currentTrack.title;
  }

  if (!quiet) {
    if (!playing) {
      announce("背景音乐已暂停");
    } else if (silentMode) {
      announce("背景音乐正在静音播放，点击页面任意位置开启声音");
    } else {
      announce(`正在播放：${name}`);
    }
  }
}

function markUnavailable() {
  wantPlaying = false;
  updateButton(false);
  button.classList.add("is-unavailable");
  button.setAttribute("aria-label", "背景音乐暂不可用");
  button.title = "音乐文件暂不可用";
  announce("背景音乐文件暂不可用");
}

function ensureAudio() {
  if (audio) {
    return audio;
  }

  audio = document.getElementById("music-audio");
  if (!audio) {
    audio = new Audio();
  }
  audio.loop = true;
  audio.preload = "none";
  audio.volume = 0;
  audio.muted = false;
  audio.setAttribute("playsinline", "");

  audio.addEventListener("play", () => updateButton(true));
  audio.addEventListener("pause", () => {
    updateButton(false);
    cancelFade();
    if (!wantPlaying) {
      return;
    }
    if (unlocking) {
      // 解除静音被浏览器策略打断，退回静音续播并重新等待用户操作
      unlocking = false;
      enterSilentMode();
      return;
    }
    enterSilentMode();
  });
  audio.addEventListener("error", markUnavailable);

  return audio;
}

function cancelFade() {
  if (fadeFrame) {
    cancelAnimationFrame(fadeFrame);
    fadeFrame = null;
  }
}

/**
 * 音量渐变：从当前音量平滑过渡到目标音量，避免突然出声
 * @param {number} target   - 目标音量（0~1）
 * @param {number} duration - 渐变时长（毫秒）
 */
function fadeTo(target, duration) {
  cancelFade();
  const from = audio.volume;
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * progress));
    if (progress < 1) {
      fadeFrame = requestAnimationFrame(step);
    } else {
      fadeFrame = null;
    }
  };

  fadeFrame = requestAnimationFrame(step);
}

function selectTrack(slot, excludeSrc) {
  const track = chooseTrack(slot, excludeSrc);
  currentTrack = track;
  currentSlot = slot;
  audio.src = track.src;
  button.classList.remove("is-unavailable");
  updateButton(false, true);
}

async function playSelected() {
  wantPlaying = true;
  audio.muted = false;
  audio.volume = 0;

  try {
    await audio.play();
    hasStarted = true;
    writePreference("on");
    fadeTo(VOLUME, FADE_IN_MS);
  } catch (error) {
    wantPlaying = false;
    updateButton(false);
    if (error && error.name === "NotAllowedError") {
      await enterSilentMode();
    } else if (error && (error.name === "NotSupportedError" || error.name === "NotReadableError")) {
      markUnavailable();
    }
  }
}

/**
 * 有声自动播放被浏览器拦截时，先静音播放，
 * 等用户第一次点击/按键后再解除静音并渐入音量。
 */
async function enterSilentMode() {
  silentMode = true;
  audio.muted = true;
  audio.volume = 0;

  try {
    await audio.play();
    bindGestureUnlock();
    updateButton(true);
  } catch (e) {
    silentMode = false;
    wantPlaying = false;
    updateButton(false);
    // 连静音播放也被拦截：等用户第一次点击/按键时再启动，无需点音乐按钮
    bindGestureStart();
  }
}

function bindGestureStart() {
  if (gestureBound) {
    return;
  }
  gestureBound = true;

  const start = (event) => {
    if (event && event.target && button.contains(event.target)) {
      return;
    }
    document.removeEventListener("pointerdown", start, true);
    document.removeEventListener("keydown", start, true);
    gestureBound = false;
    if (!wantPlaying && readPreference() !== "off") {
      playSelected();
    }
  };

  document.addEventListener("pointerdown", start, true);
  document.addEventListener("keydown", start, true);
}

function bindGestureUnlock() {
  if (gestureBound) {
    return;
  }
  gestureBound = true;

  const unlock = (event) => {
    // 点击音乐按钮本身交给 toggleMusic 处理，避免刚开启声音又被暂停
    if (event && event.target && button.contains(event.target)) {
      return;
    }
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    gestureBound = false;
    enableSound();
  };

  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
}

function enableSound() {
  if (!silentMode || !audio) {
    return;
  }

  silentMode = false;
  unlocking = true;
  audio.muted = false;
  audio.volume = 0;
  fadeTo(VOLUME, FADE_IN_MS);
  updateButton(true);

  window.setTimeout(() => {
    unlocking = false;
  }, 600);
}

async function toggleMusic() {
  if (button.classList.contains("is-unavailable")) {
    button.classList.remove("is-unavailable");
  }

  const player = ensureAudio();

  // 正在静音播放时，点击按钮只负责把声音渐入
  if (silentMode) {
    enableSound();
    return;
  }

  if (isPlaying) {
    wantPlaying = false;
    player.pause();
    writePreference("off");
    return;
  }

  const slot = getTimeSlot(new Date());

  // 首次播放前若跨了时段，重新按当前时段选曲；播放开始后只循环这一首
  if (!hasStarted && (!currentTrack || !currentSlot || currentSlot.key !== slot.key)) {
    selectTrack(slot, currentTrack ? currentTrack.src : null);
  }

  await playSelected();
}

async function autoplay() {
  const slot = getTimeSlot(new Date());
  if (!currentTrack || !currentSlot || currentSlot.key !== slot.key) {
    selectTrack(slot, null);
  }
  await playSelected();
}

function initMusicPlayer() {
  button = document.getElementById("music-toggle");
  statusRegion = document.getElementById("music-status");
  tooltip = document.querySelector(".music-toggle__tip");
  if (!button) {
    return;
  }

  button.addEventListener("click", toggleMusic);
  ensureAudio();

  // 每次打开页面先按时段随机选好一首
  selectTrack(getTimeSlot(new Date()), null);

  // 默认自动播放；用户上次主动暂停过则保持安静，等其再次点击
  if (readPreference() !== "off") {
    autoplay();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMusicPlayer);
} else {
  initMusicPlayer();
}
