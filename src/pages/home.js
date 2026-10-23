/**
 * 首页逻辑骨架（B 模块主要开发内容）
 *
 * 【说明】本文件只写首页需要用到的基础函数签名，
 *  具体的 UI 渲染、事件绑定、DOM 操作由 B 模块完成。
 *  不要在没有 B 模块确认的情况下，直接改函数名字或调用方式。
 */

import { MOODS } from "../data/moods.js";

/**
 * 首页入口函数
 * 作用：B 模块在这个函数里写"首页加载时要做的事情"
 *      比如：把心情选项渲染成按钮、绑定点击事件等
 */
function initHomePage() {
  // ============================================================
  // TODO（B 模块）：把心情选项渲染到页面上
  // 示例：
  // const container = document.getElementById("mood-list");
  // container.innerHTML = MOODS.map(m => `<button data-mood="${m.key}">${m.emoji} ${m.label}</button>`).join("");
  // container.addEventListener("click", onMoodSelect);
  // ============================================================
  console.log("首页初始化（骨架阶段）");
  console.log("心情选项数据：", MOODS);
}

/**
 * 心情选择后的回调（B 模块完成）
 * @param {string} moodKey - 用户选中的心情 key，比如 "tired"
 */
function onMoodSelect(moodKey) {
  // TODO（B 模块）：选中心情后，跳转到"时间/偏好选择页"或者直接渲染下一组选项
  console.log("用户选中了心情：", moodKey);
}

// 页面加载完成后自动执行 initHomePage
document.addEventListener("DOMContentLoaded", initHomePage);

export { initHomePage, onMoodSelect };
