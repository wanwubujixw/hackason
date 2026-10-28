/**
 * 本地存储工具（迁移自原网页 src/utils/storage.js）
 *
 * 负责收藏和反馈的本地持久化。
 * 与原网页的唯一差别：localStorage 换成微信小程序本地存储。
 * 键名、数据结构、去重规则、返回值和原网页完全一致，便于对照与跨端排查。
 *
 * 注意：数据只保存在本机微信中，清除小程序缓存或换设备会丢失，也不会上传服务器。
 */

const FAVORITES_KEY = "jyo_favorites";
const FEEDBACK_KEY = "jyo_feedbacks";

/**
 * 读取收藏列表
 * @returns {Array} 收藏数组，出错返回空数组
 */
function getFavorites() {
  try {
    // 无此 key 时 wx.getStorageSync 返回空字符串，交给 Array.isArray 兜住
    const data = wx.getStorageSync(FAVORITES_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("读取收藏失败：", e);
    return [];
  }
}

/**
 * 收藏一条回信，新收藏排在最前面
 * @param {{sceneId: string, letterContent: string, place: string, mood: string}} item
 * @returns {boolean} 是否收藏成功（已收藏过也算成功）
 */
function addFavorite(item) {
  try {
    const sceneId = item && item.sceneId;
    if (!sceneId) {
      return false;
    }

    const list = getFavorites();
    if (list.some(function (f) { return f.sceneId === sceneId; })) {
      return true;
    }

    list.unshift({
      sceneId: sceneId,
      letterContent: (item && item.letterContent) || "",
      place: (item && item.place) || "",
      mood: (item && item.mood) || "",
      savedAt: new Date().toISOString()
    });
    wx.setStorageSync(FAVORITES_KEY, list);
    return true;
  } catch (e) {
    console.error("收藏失败：", e);
    return false;
  }
}

/**
 * 按 sceneId 取消收藏
 * @param {string} sceneId
 * @returns {boolean}
 */
function removeFavorite(sceneId) {
  try {
    if (!sceneId) {
      return false;
    }
    const list = getFavorites().filter(function (f) {
      return f.sceneId !== sceneId;
    });
    wx.setStorageSync(FAVORITES_KEY, list);
    return true;
  } catch (e) {
    console.error("取消收藏失败：", e);
    return false;
  }
}

/**
 * 判断是否已收藏
 * @param {string} sceneId
 * @returns {boolean}
 */
function isFavorite(sceneId) {
  if (!sceneId) {
    return false;
  }
  return getFavorites().some(function (f) {
    return f.sceneId === sceneId;
  });
}

/**
 * 提交反馈
 * @param {string} sceneId
 * @param {"good" | "bad"} feedback
 * @returns {boolean}
 */
function submitFeedback(sceneId, feedback) {
  if (!sceneId) {
    return false;
  }
  if (feedback !== "good" && feedback !== "bad") {
    return false;
  }

  try {
    const raw = wx.getStorageSync(FEEDBACK_KEY);
    const list = Array.isArray(raw) ? raw : [];
    list.push({
      sceneId: sceneId,
      feedback: feedback,
      submittedAt: new Date().toISOString()
    });
    wx.setStorageSync(FEEDBACK_KEY, list);
    return true;
  } catch (e) {
    console.error("提交反馈失败：", e);
    return false;
  }
}

/**
 * 清空收藏和反馈（调试 / 重置演示用）
 */
function clearAll() {
  wx.removeStorageSync(FAVORITES_KEY);
  wx.removeStorageSync(FEEDBACK_KEY);
}

module.exports = {
  getFavorites: getFavorites,
  addFavorite: addFavorite,
  removeFavorite: removeFavorite,
  isFavorite: isFavorite,
  submitFeedback: submitFeedback,
  clearAll: clearAll
};
