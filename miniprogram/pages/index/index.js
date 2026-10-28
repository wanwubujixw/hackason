/**
 * 解忧慢递邮局 · 小程序单页版主流程
 *
 * 迁移自原网页 src/pages/home.js，业务逻辑保持一致：
 * 心情选择 → 时间/偏好/社交选择 → 场景匹配 → 回信卡。
 * 差异只在于用 setData 驱动 WXML 渲染，不再操作 DOM。
 * 收藏与反馈复用原网页 src/utils/storage.js 的数据结构与交互逻辑，
 * 只把 localStorage 换成微信小程序本地存储。
 */

const { MOODS } = require("../../data/moods.js");
const { matchScenes, getFallbackScenes } = require("../../services/matcher.js");
const { generateLetterSafe } = require("../../services/letterGenerator.js");
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  submitFeedback
} = require("../../utils/storage.js");

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

/** 反馈说明文案（未提交时展示，明确告知只保存在本机） */
const FEEDBACK_NOTE = "反馈只保存在本机微信中，暂不具备多用户汇总能力。";

/** 把 ISO 时间格式化成 "2026/10/23 14:05"（同原网页 favorites.js） */
function formatSavedAt(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return "";
  }
  const pad = function (value) {
    return value < 10 ? "0" + value : "" + value;
  };
  return date.getFullYear() + "/" + pad(date.getMonth() + 1) + "/" + pad(date.getDate())
    + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

/** 把选项数组转成带 selected 标记的数组，供 WXML 渲染选中态 */
function markSelected(options, isSelected) {
  return options.map(function (option) {
    return {
      value: option.value,
      label: option.label,
      selected: isSelected(option.value)
    };
  });
}

Page({
  data: {
    view: "home",              // home / prefs / result / letter
    moods: MOODS,
    timeOptions: TIME_OPTIONS,
    preferenceOptions: PREFERENCE_OPTIONS,
    socialOptions: SOCIAL_OPTIONS,

    // 用户选择（UserSelection）
    mood: "",
    availableMinutes: 0,
    preferences: [],
    socialComfort: "",

    hint: "",                  // 表单校验提示
    notice: "",                // 无匹配时的兜底提示
    scenes: [],                // matchScenes / getFallbackScenes 的结果
    letter: null,              // 当前回信卡

    // 收藏与反馈（对应当前回信卡）
    currentSceneId: "",        // 当前回信对应的场景 ID
    favoriteActive: false,     // 当前场景是否已收藏
    feedback: "",              // "" / "good" / "bad"
    feedbackTip: FEEDBACK_NOTE, // 反馈状态提示
    favorites: []              // 收藏列表（页面展示用，已格式化）
  },

  onLoad() {
    this.lastView = "home";    // 从收藏页返回时回到这里
    this.syncSelectionView();
  },

  /** 把当前选择同步成按钮的选中态 */
  syncSelectionView() {
    const mood = this.data.mood;
    const availableMinutes = this.data.availableMinutes;
    const preferences = this.data.preferences;
    const socialComfort = this.data.socialComfort;

    this.setData({
      moods: MOODS.map(function (item) {
        return Object.assign({}, item, { selected: item.key === mood });
      }),
      timeOptions: markSelected(TIME_OPTIONS, function (value) {
        return availableMinutes === value;
      }),
      preferenceOptions: markSelected(PREFERENCE_OPTIONS, function (value) {
        return preferences.indexOf(value) >= 0;
      }),
      socialOptions: markSelected(SOCIAL_OPTIONS, function (value) {
        return socialComfort === value;
      })
    });
  },

  /** 返回一份干净的 UserSelection，避免外部改动内部状态 */
  getSelection() {
    return {
      mood: this.data.mood,
      availableMinutes: this.data.availableMinutes,
      preferences: this.data.preferences.slice(),
      socialComfort: this.data.socialComfort
    };
  },

  /** 切换视图并回到页面顶部 */
  switchView(view) {
    if (view !== "favorites") {
      this.lastView = view;
    }
    this.setData({ view: view }, function () {
      wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    });
  },

  /* ============================================================
   * 第 1 步：心情选择
   * ============================================================ */
  onMoodTap(event) {
    const moodKey = event.currentTarget.dataset.key;
    const exists = MOODS.some(function (item) {
      return item.key === moodKey;
    });
    if (!exists) {
      return;
    }
    this.setData({ mood: moodKey, hint: "" });
    this.syncSelectionView();
    this.switchView("prefs");
  },

  /* ============================================================
   * 第 2 步：时间 / 偏好 / 社交舒适度
   * ============================================================ */
  onTimeTap(event) {
    const value = Number(event.currentTarget.dataset.value);
    this.setData({ availableMinutes: value });
    this.syncSelectionView();
  },

  onPreferenceTap(event) {
    const value = event.currentTarget.dataset.value;
    const preferences = this.data.preferences.slice();
    const index = preferences.indexOf(value);
    if (index >= 0) {
      preferences.splice(index, 1);
    } else {
      preferences.push(value);
    }
    this.setData({ preferences: preferences });
    this.syncSelectionView();
  },

  onSocialTap(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ socialComfort: value });
    this.syncSelectionView();
  },

  onBackToHome() {
    this.switchView("home");
  },

  /* ============================================================
   * 生成推荐
   * ============================================================ */
  onGenerate() {
    if (!this.data.mood) {
      this.setData({ hint: "先回到第 1 步选一个此刻的心情吧。" });
      return;
    }
    if (!this.data.availableMinutes) {
      this.setData({ hint: "请选择一个你现在能用的时长。" });
      return;
    }
    if (!this.data.socialComfort) {
      this.setData({ hint: "请选择此刻想怎么和人相处。" });
      return;
    }

    let scenes = matchScenes(this.getSelection());
    if (!Array.isArray(scenes)) {
      scenes = [];
    }

    let notice = "";
    if (scenes.length === 0) {
      scenes = getFallbackScenes();
      notice = "没有找到完全合适的地点，为你推荐以下默认选项。";
    }

    this.setData({ hint: "", notice: notice, scenes: scenes });
    this.switchView("result");
  },

  /* ============================================================
   * 第 3 步：推荐结果 → 回信卡
   * ============================================================ */
  onSceneTap(event) {
    const sceneId = event.currentTarget.dataset.id;
    const scene = this.data.scenes.find(function (item) {
      return item.id === sceneId;
    });
    if (!scene) {
      return;
    }

    const letter = generateLetterSafe({
      userSelection: this.getSelection(),
      matchedScene: scene
    });

    this.setData({
      letter: letter,
      currentSceneId: scene.id,
      favoriteActive: isFavorite(scene.id),
      feedback: "",
      feedbackTip: FEEDBACK_NOTE
    });
    this.switchView("letter");
  },

  onBackToPrefs() {
    this.switchView("prefs");
  },

  onLetterBack() {
    this.switchView("result");
  },

  onLetterHome() {
    this.switchView("home");
  },

  /* ============================================================
   * 回信卡：收藏 / 反馈
   * ============================================================ */
  refreshFavoriteState(sceneId) {
    this.setData({
      favoriteActive: sceneId ? isFavorite(sceneId) : false
    });
  },

  onToggleFavorite() {
    const sceneId = this.data.currentSceneId;
    const letter = this.data.letter;
    if (!sceneId || !letter) {
      return;
    }

    let ok = false;
    if (isFavorite(sceneId)) {
      ok = removeFavorite(sceneId);
    } else {
      ok = addFavorite({
        sceneId: sceneId,
        letterContent: letter.content,
        place: letter.place,
        mood: this.data.mood
      });
    }

    this.refreshFavoriteState(sceneId);
    wx.showToast({
      title: ok ? (this.data.favoriteActive ? "已收藏" : "已取消收藏") : "操作失败，请重试",
      icon: "none"
    });
  },

  onFeedbackTap(event) {
    const kind = event.currentTarget.dataset.kind;
    const sceneId = this.data.currentSceneId;
    if (!sceneId || this.data.feedback) {
      return;
    }
    if (kind !== "good" && kind !== "bad") {
      return;
    }

    if (submitFeedback(sceneId, kind)) {
      this.setData({
        feedback: kind,
        feedbackTip: "已收到你的反馈，谢谢你。反馈只保存在本机微信中。"
      });
      wx.showToast({ title: "反馈已提交", icon: "none" });
    } else {
      this.setData({ feedbackTip: "提交失败，请稍后再试。" });
      wx.showToast({ title: "提交失败，请重试", icon: "none" });
    }
  },

  /* ============================================================
   * 收藏列表
   * ============================================================ */
  renderFavorites() {
    const favorites = getFavorites().map(function (item) {
      return {
        sceneId: item.sceneId,
        placeLabel: item.place ? "📍 " + item.place : "💌 校园回信",
        savedAtText: formatSavedAt(item.savedAt),
        letterContent: item.letterContent || ""
      };
    });
    this.setData({ favorites: favorites });
  },

  onOpenFavorites() {
    this.renderFavorites();
    this.switchView("favorites");
  },

  onFavoritesBack() {
    // 收藏页里可能取消过当前这封回信的收藏，返回时同步按钮状态
    this.refreshFavoriteState(this.data.currentSceneId);
    this.switchView(this.lastView || "home");
  },

  onRemoveFavorite(event) {
    const sceneId = event.currentTarget.dataset.sceneId;
    if (!sceneId) {
      return;
    }
    if (removeFavorite(sceneId)) {
      this.renderFavorites();
      if (sceneId === this.data.currentSceneId) {
        this.refreshFavoriteState(sceneId);
      }
    }
  }
});
