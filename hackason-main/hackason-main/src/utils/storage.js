/**
 * 本地存储工具（E 模块主要开发内容）
 *
 * 使用浏览器 localStorage 实现收藏和反馈的持久化。
 * 【注意】localStorage 的限制：
 *  1. 同一浏览器同一域名下才能读取
 *  2. 清除浏览器数据会丢失
 *  3. 不能跨设备同步
 *  README 中会如实说明这些限制。
 */

const FAVORITES_KEY = "jyo_favorites";    // 收藏列表的 localStorage key
const FEEDBACK_KEY  = "jyo_feedbacks";    // 反馈数据的 localStorage key

/**
 * 读取收藏列表
 * @returns {Array} 收藏数组，每条包含 sceneId + letterContent + 时间戳
 */
function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("读取收藏失败：", e);
    return [];
  }
}

/**
 * 收藏一条回信
 * @param {Object} item - 要收藏的内容
 * @param {string} item.sceneId        - 对应场景的 id
 * @param {string} item.letterContent - 回信文案（content + place + reason）
 */
function addFavorite(item) {
  try {
    const list = getFavorites();
    const record = {
      ...item,
      savedAt: new Date().toISOString()
    };
    list.unshift(record); // 新收藏放在最前面
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("收藏失败：", e);
    return false;
  }
}

/**
 * 取消收藏（按 sceneId 移除）
 * @param {string} sceneId
 */
function removeFavorite(sceneId) {
  try {
    const list = getFavorites().filter(f => f.sceneId !== sceneId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("取消收藏失败：", e);
    return false;
  }
}

/**
 * 检查某条是否已收藏
 * @param {string} sceneId
 * @returns {boolean}
 */
function isFavorite(sceneId) {
  return getFavorites().some(f => f.sceneId === sceneId);
}

/**
 * 提交一条反馈
 * @param {string} sceneId - 反馈对应的场景 id
 * @param {"good" | "bad"} feedback - 用户反馈：good 表示适合我，bad 表示不太适合我
 */
function submitFeedback(sceneId, feedback) {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ sceneId, feedback, submittedAt: new Date().toISOString() });
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("反馈提交失败：", e);
    return false;
  }
}

/**
 * 清空所有数据（调试用）
 */
function clearAll() {
  localStorage.removeItem(FAVORITES_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}

export { getFavorites, addFavorite, removeFavorite, isFavorite, submitFeedback, clearAll };
