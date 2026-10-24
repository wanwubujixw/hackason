/**
 * 首页逻辑（B 模块）
 *
 * 负责：视图切换（首页 → 偏好 → 推荐 → 回信卡 → 收藏）、收集用户的选择，
 *      以及调用 D 模块的匹配/回信服务和 E 模块的本地存储工具。
 *
 * 本文件只改界面和交互，不改数据、匹配规则和存储实现。
 */

import { MOODS } from "../data/moods.js";
import { matchScenes, getFallbackScenes } from "../services/matcher.js";
import { generateLetterSafe } from "../services/letterGenerator.js";
import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
  submitFeedback
} from "../utils/storage.js";
import { renderSceneList, renderLetterCard } from "./result.js";
import { renderFavorites } from "./favorites.js";

/** 可用时长（对应 ARCHITECTURE.md 3.5 节：5 / 15 / 30） */
const TIME_OPTIONS = [
  { value: 5, label: "⏱️ 5 分钟" },
  { value: 15, label: "⏱️ 15 分钟" },
  { value: 30, label: "⏱️ 30 分钟" }
];

/** 场景偏好（可多选） */
const PREFERENCE_OPTIONS = [
  { value: "quiet", label: "安静" },
  { value: "nature", label: "自然" },
  { value: "walkable", label: "适合散步" },
  { value: "warm", label: "有生活气息" },
  { value: "food", label: "有食物" }
];

/** 社交舒适度（单选） */
const SOCIAL_OPTIONS = [
  { value: "alone", label: "希望独处" },
  { value: "small", label: "可以接触少量人" },
  { value: "crowded", label: "希望热闹一点" }
];

const VIEWS = ["home", "prefs", "result", "letter", "favorites"];

/** 用户当前选择（UserSelection） */
const state = {
  mood: null,
  availableMinutes: null,
  preferences: [],
  socialComfort: null
};

let currentScene = null;      // 当前回信卡对应的场景
let currentLetter = null;     // 当前回信卡内容
let currentFeedback = null;   // "good" | "bad" | null
let lastView = "home";        // 从收藏页返回时回到这里

function $(id) {
  return document.getElementById(id);
}

/** 返回一份干净的 UserSelection（避免外部改动内部状态） */
function getSelection() {
  return {
    mood: state.mood,
    availableMinutes: state.availableMinutes,
    preferences: state.preferences.slice(),
    socialComfort: state.socialComfort
  };
}

/* ============================================================
 * 视图切换
 * ============================================================ */

function setView(name) {
  VIEWS.forEach(view => {
    $(`view-${view}`).classList.toggle("is-active", view === name);
  });
  if (name !== "favorites") {
    lastView = name;
  }
  window.scrollTo(0, 0);
}

/* ============================================================
 * 第 1 步：心情选择
 * ============================================================ */

function renderMoods() {
  $("mood-list").innerHTML = MOODS.map(mood => {
    const selected = state.mood === mood.key;
    return `
      <button type="button" class="mood-btn${selected ? " is-selected" : ""}"
              data-mood="${mood.key}" aria-pressed="${selected}">
        <span class="mood-emoji" aria-hidden="true">${mood.emoji}</span>
        <span class="mood-label">${mood.label}</span>
        <span class="mood-desc">${mood.description}</span>
      </button>`;
  }).join("");
}

function onMoodSelect(moodKey) {
  if (!MOODS.some(mood => mood.key === moodKey)) {
    return;
  }
  state.mood = moodKey;
  renderMoods();
  renderPrefs();
  $("prefs-hint").textContent = "";
  setView("prefs");
}

/* ============================================================
 * 第 2 步：时间 / 偏好 / 社交舒适度
 * ============================================================ */

function renderChips(container, options, isSelected) {
  container.innerHTML = options.map(option => {
    const selected = isSelected(option.value);
    return `
      <button type="button" class="chip${selected ? " is-selected" : ""}"
              data-value="${option.value}" aria-pressed="${selected}">${option.label}</button>`;
  }).join("");
}

function renderPrefs() {
  renderChips($("time-list"), TIME_OPTIONS, value => state.availableMinutes === value);
  renderChips($("preference-list"), PREFERENCE_OPTIONS, value => state.preferences.includes(value));
  renderChips($("social-list"), SOCIAL_OPTIONS, value => state.socialComfort === value);
}

function onGenerate() {
  const hint = $("prefs-hint");

  if (!state.mood) {
    hint.textContent = "先回到第 1 步选一个此刻的心情吧。";
    return;
  }
  if (!state.availableMinutes) {
    hint.textContent = "请选择一个你现在能用的时长。";
    return;
  }
  if (!state.socialComfort) {
    hint.textContent = "请选择此刻想怎么和人相处。";
    return;
  }

  hint.textContent = "";
  showRecommendations();
}

/* ============================================================
 * 第 3 步：推荐结果
 * ============================================================ */

function showRecommendations() {
  const notice = $("result-notice");
  let scenes = matchScenes(getSelection());

  if (!Array.isArray(scenes)) {
    scenes = [];
  }

  if (scenes.length === 0) {
    scenes = getFallbackScenes();
    notice.textContent = "没有找到完全合适的地点，为你推荐以下默认选项。";
    notice.hidden = false;
  } else {
    notice.textContent = "";
    notice.hidden = true;
  }

  renderSceneList($("scene-list"), scenes, onSceneSelect);
  setView("result");
}

function onSceneSelect(scene) {
  currentScene = scene;
  currentLetter = generateLetterSafe({
    userSelection: getSelection(),
    matchedScene: scene
  });
  currentFeedback = null;

  renderLetterCard($("letter-card"), currentLetter);
  updateFavoriteButton();
  updateFeedbackButtons();
  setView("letter");
}

/* ============================================================
 * 回信卡：收藏 / 反馈
 * ============================================================ */

function updateFavoriteButton() {
  const button = $("btn-fav");
  const favorited = currentScene ? isFavorite(currentScene.id) : false;
  button.textContent = favorited ? "💌 已收藏（点击取消）" : "✉️ 收藏这封回信";
  button.classList.toggle("is-selected", favorited);
}

function toggleFavorite() {
  if (!currentScene || !currentLetter) {
    return;
  }

  if (isFavorite(currentScene.id)) {
    removeFavorite(currentScene.id);
  } else {
    addFavorite({
      sceneId: currentScene.id,
      letterContent: currentLetter.content,
      place: currentLetter.place,
      mood: state.mood
    });
  }
  updateFavoriteButton();
}

function updateFeedbackButtons() {
  const good = $("btn-fb-good");
  const bad = $("btn-fb-bad");
  const submitted = currentFeedback !== null;

  good.textContent = currentFeedback === "good" ? "👍 已收到，谢谢你" : "👍 适合我";
  bad.textContent = currentFeedback === "bad" ? "👎 已收到，谢谢你" : "👎 不太适合我";
  good.classList.toggle("is-selected", currentFeedback === "good");
  bad.classList.toggle("is-selected", currentFeedback === "bad");
  good.disabled = submitted;
  bad.disabled = submitted;
}

function sendFeedback(kind) {
  if (!currentScene || currentFeedback !== null) {
    return;
  }
  if (submitFeedback(currentScene.id, kind)) {
    currentFeedback = kind;
    updateFeedbackButtons();
  }
}

/* ============================================================
 * 收藏列表
 * ============================================================ */

function openFavorites() {
  renderFavorites($("favorites-list"), getFavorites(), item => {
    removeFavorite(item.sceneId);
    openFavorites();
  });
  setView("favorites");
}

/* ============================================================
 * 事件绑定与初始化
 * ============================================================ */

function bindEvents() {
  // 第 1 步
  $("mood-list").addEventListener("click", event => {
    const button = event.target.closest(".mood-btn");
    if (button) {
      onMoodSelect(button.dataset.mood);
    }
  });

  // 第 2 步
  $("time-list").addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) {
      return;
    }
    state.availableMinutes = Number(chip.dataset.value);
    renderPrefs();
  });

  $("preference-list").addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) {
      return;
    }
    const value = chip.dataset.value;
    const index = state.preferences.indexOf(value);
    if (index >= 0) {
      state.preferences.splice(index, 1);
    } else {
      state.preferences.push(value);
    }
    renderPrefs();
  });

  $("social-list").addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) {
      return;
    }
    state.socialComfort = chip.dataset.value;
    renderPrefs();
  });

  $("btn-generate").addEventListener("click", onGenerate);
  $("btn-prefs-back").addEventListener("click", () => setView("home"));

  // 第 3 步
  $("btn-result-back").addEventListener("click", () => setView("prefs"));

  // 回信卡
  $("btn-fav").addEventListener("click", toggleFavorite);
  $("btn-fb-good").addEventListener("click", () => sendFeedback("good"));
  $("btn-fb-bad").addEventListener("click", () => sendFeedback("bad"));
  $("btn-letter-back").addEventListener("click", () => setView("result"));
  $("btn-letter-home").addEventListener("click", () => setView("home"));

  // 收藏
  $("btn-open-favorites").addEventListener("click", openFavorites);
  $("btn-fav-back").addEventListener("click", () => {
    // 收藏页里可能取消过当前这封回信的收藏，返回时同步按钮状态
    if (currentScene) {
      updateFavoriteButton();
    }
    setView(lastView);
  });
}

/**
 * 首页入口函数：渲染心情按钮并绑定全部交互
 */
function initHomePage() {
  renderMoods();
  renderPrefs();
  bindEvents();
  setView("home");
}

// 页面加载完成后自动执行 initHomePage
document.addEventListener("DOMContentLoaded", initHomePage);

export { initHomePage, onMoodSelect };
