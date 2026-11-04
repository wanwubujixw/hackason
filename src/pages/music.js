/**
 * 背景轻音乐控制（B 模块 UI 辅助）
 *
 * 独立于首页、匹配、回信、收藏和反馈逻辑，只负责右下角音乐按钮。
 * 音频文件为项目内合成的轻音乐循环，不依赖任何外部链接。
 */

const MUSIC_SRC = "assets/music/ambient-loop.mp3";
const PREF_KEY = "jyo_music_pref";
const VOLUME = 0.3;

let audio = null;
let button = null;
let statusRegion = null;
let isPlaying = false;

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
  button.setAttribute("aria-pressed", String(playing));
  const label = playing ? "暂停背景音乐" : "播放背景音乐";
  button.setAttribute("aria-label", label);
  button.title = label;
  announce(playing ? "背景音乐已开始播放" : "背景音乐已暂停");
}

function markUnavailable() {
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
    audio.src = MUSIC_SRC;
  }
  audio.loop = true;
  audio.preload = "none";
  audio.volume = VOLUME;
  audio.setAttribute("playsinline", "");

  audio.addEventListener("play", () => updateButton(true));
  audio.addEventListener("pause", () => updateButton(false));
  audio.addEventListener("error", markUnavailable);

  return audio;
}

async function toggleMusic() {
  if (button.classList.contains("is-unavailable")) {
    return;
  }

  const player = ensureAudio();

  if (isPlaying) {
    player.pause();
    writePreference("off");
    return;
  }

  try {
    await player.play();
    writePreference("on");
  } catch (error) {
    updateButton(false);
    if (error && error.name === "NotAllowedError") {
      announce("请再次点击播放背景音乐");
    } else if (error && (error.name === "NotSupportedError" || error.name === "NotReadableError")) {
      markUnavailable();
    }
  }
}

function restorePreference() {
  if (readPreference() !== "on") {
    return;
  }
  button.classList.add("is-resume");
  button.title = "点击继续播放背景音乐";
  button.setAttribute("aria-label", "点击继续播放背景音乐");
  announce("上次音乐处于开启状态，点击按钮继续播放");
}

function initMusicPlayer() {
  button = document.getElementById("music-toggle");
  statusRegion = document.getElementById("music-status");
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
