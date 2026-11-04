/**
 * 背景轻音乐控制（B 模块 UI 辅助）
 *
 * 规则：
 * - 按当前本地时间划分清晨 / 白天 / 傍晚 / 夜晚四个时段
 * - 首次播放或一首结束后，从当前时段曲库中随机选一首
 * - 切换页面不影响播放；刷新后只恢复开关偏好，不绕过自动播放限制
 * - 音频均为项目内合成，不依赖外部音乐链接
 */

const PREF_KEY = "jyo_music_pref";
const VOLUME = 0.3;

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

function updateButton(playing) {
  isPlaying = playing;
  button.classList.toggle("is-playing", playing);
  if (playing) {
    button.classList.remove("is-resume");
  }

  const name = currentTrack ? `${currentSlot.label} · ${currentTrack.title}` : "背景音乐";
  const label = playing ? `暂停${name}` : `播放${name}`;
  button.setAttribute("aria-pressed", String(playing));
  button.setAttribute("aria-label", label);
  button.title = label;

  if (tooltip && currentTrack) {
    tooltip.textContent = currentTrack.title;
  }

  announce(playing ? `正在播放：${name}` : "背景音乐已暂停");
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
  audio.loop = false;
  audio.preload = "none";
  audio.volume = VOLUME;
  audio.setAttribute("playsinline", "");

  audio.addEventListener("play", () => updateButton(true));
  audio.addEventListener("pause", () => updateButton(false));
  audio.addEventListener("error", markUnavailable);
  audio.addEventListener("ended", handleTrackEnded);

  return audio;
}

function selectTrack(slot, excludeSrc) {
  const track = chooseTrack(slot, excludeSrc);
  currentTrack = track;
  currentSlot = slot;
  audio.src = track.src;
  button.classList.remove("is-unavailable");
  updateButton(false);
}

async function playSelected() {
  try {
    await audio.play();
    writePreference("on");
  } catch (error) {
    wantPlaying = false;
    updateButton(false);
    if (error && error.name === "NotAllowedError") {
      announce("请再次点击播放背景音乐");
    } else if (error && (error.name === "NotSupportedError" || error.name === "NotReadableError")) {
      markUnavailable();
    }
  }
}

function handleTrackEnded() {
  if (!wantPlaying) {
    return;
  }
  const slot = getTimeSlot(new Date());
  selectTrack(slot, currentTrack ? currentTrack.src : null);
  playSelected();
}

async function toggleMusic() {
  if (button.classList.contains("is-unavailable")) {
    button.classList.remove("is-unavailable");
  }

  const player = ensureAudio();

  if (isPlaying) {
    wantPlaying = false;
    player.pause();
    writePreference("off");
    return;
  }

  wantPlaying = true;
  const slot = getTimeSlot(new Date());

  // 首次播放、时段变化或刚恢复偏好时，重新按时段随机选曲
  if (!currentTrack || !currentSlot || currentSlot.key !== slot.key) {
    selectTrack(slot, currentTrack ? currentTrack.src : null);
  }

  await playSelected();
}

function restorePreference() {
  if (readPreference() !== "on") {
    return;
  }
  const slot = getTimeSlot(new Date());
  button.classList.add("is-resume");
  button.title = `点击继续播放${slot.label}背景音乐`;
  button.setAttribute("aria-label", button.title);
  announce(`上次音乐处于开启状态，点击按钮继续播放${slot.label}背景音乐`);
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
  restorePreference();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMusicPlayer);
} else {
  initMusicPlayer();
}
