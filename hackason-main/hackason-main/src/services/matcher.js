/**
 * 场景匹配服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义匹配函数的签名和注释，
 *  具体的匹配逻辑（如何根据用户选择筛选场景）由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 */

import { SCENES } from "../data/scenes.js";

/**
 * 根据用户选择，从校园场景库中筛选出最合适的推荐列表
 *
 * @param {Object} userSelection - 用户的选择结果
 * @param {string} userSelection.mood              - 心情标识，对应 MOODS 中的 key，例如 "tired"
 * @param {number} userSelection.availableMinutes  - 可用时长（分钟），可选值：5 / 15 / 30
 * @param {string[]} userSelection.preferences     - 场景偏好标签，可选值：quiet / nature / walkable / warm / food
 * @param {string} userSelection.socialComfort     - 社交舒适度，可选值：alone / small / crowded
 *
 * @returns {Scene[]} 匹配到的场景数组，按匹配度从高到低排序。
 *                   如果没有匹配到任何场景，返回空数组 []。
 *
 * @example
 * // 示例：疲惫 + 15 分钟 + 安静自然 + 想独处
 * const results = matchScenes({
 *   mood: "tired",
 *   availableMinutes: 15,
 *   preferences: ["quiet", "nature"],
 *   socialComfort: "alone"
 * });
 * // results => [Scene{...}, Scene{...}]
 */
function matchScenes(userSelection) {
  // ============================================================
  // TODO：这里写匹配逻辑（D 模块完成）
  //
  // 简单实现思路（供参考，可自行调整）：
  // 1. 从 SCENES 中过滤掉不匹配 timeRange 的场景
  // 2. 对剩余场景计算匹配分数：
  //    - tags 是否包含当前 mood         +3 分
  //    - socialTags 是否包含 socialComfort +2 分
  //    - 是否满足 preferences 偏好        每项 +1 分
  // 3. 按分数从高到低排序，取前 3 条返回
  // 4. 如果全部过滤后为空，返回空数组（调用方会提示"暂无匹配"）
  // ============================================================

  // 暂时返回全部场景作为占位，让 B/E 模块能先跑通 UI
  // D 模块写完匹配逻辑后，把下面这行替换掉就行
  return SCENES.slice();
}

/**
 * 获取默认兜底场景（当 matchScenes 返回空数组时使用）
 * 由调用方在"无匹配"界面展示这些兜底选项
 */
function getFallbackScenes() {
  return SCENES.slice(0, 2); // 暂时返回前 2 条作为兜底，可自行调整
}

export { matchScenes, getFallbackScenes };
