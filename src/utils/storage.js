/**
 * 本地存储工具（E 模块负责）
 * 负责收藏和反馈的本地持久化，只依赖浏览器 localStorage。
 * 注意：数据只存在当前浏览器，清缓存会丢，换设备看不到。
 */

const FAVORITES_KEY = "jyo_favorites";
const FEEDBACK_KEY = "jyo_feedbacks";

/**
 * 读取收藏列表
 * @returns {Array} 收藏数组，出错返回空数组
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("读取收藏失败：", e);
    return [];
  }
}

/**
 * 收藏一条回信，新收藏排在最前面
 * @param {{sceneId: string, letterContent: string}} item
 * @returns {boolean} 是否收藏成功（已收藏过也算成功）
 */
export function addFavorite(item) {
  try {
    const sceneId = item && item.sceneId;
    if (!sceneId) return false;

    const list = getFavorites();
    if (list.some(f => f.sceneId === sceneId)) return true;

    list.unshift({
      sceneId: sceneId,
      letterContent: (item && item.letterContent) || "",
      savedAt: new Date().toISOString()
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
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
export function removeFavorite(sceneId) {
  try {
    if (!sceneId) return false;
    const list = getFavorites().filter(f => f.sceneId !== sceneId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
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
export function isFavorite(sceneId) {
  if (!sceneId) return false;
  return getFavorites().some(f => f.sceneId === sceneId);
}

/**
 * 提交反馈
 * @param {string} sceneId
 * @param {"good" | "bad"} feedback
 * @returns {boolean}
 */
export function submitFeedback(sceneId, feedback) {
  if (!sceneId) return false;
  if (feedback !== "good" && feedback !== "bad") return false;

  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    list.push({
      sceneId: sceneId,
      feedback: feedback,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("提交反馈失败：", e);
    return false;
  }
}

/**
 * 清空收藏和反馈（测试 / 重置演示用）
 */
export function clearAll() {
  localStorage.removeItem(FAVORITES_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}
