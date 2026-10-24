/**
 * 场景匹配服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义匹配函数的签名和注释，
 *  具体的匹配逻辑（如何根据用户选择筛选场景）由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 */

import { SCENES } from "../data/scenes.js";

// 场景 type → 对应偏好映射（见数据文件顶部 type 对照表）
const TYPE_TO_PREFERENCES = {
  "图书馆": ["quiet"],
  "咖啡馆": ["quiet", "warm"],
  "自然": ["nature"],
  "道路": ["walkable"],
  "操场": ["walkable"],
  "广场": ["walkable"],
  "食堂": ["food", "warm"],
  "生活": ["warm"],
  "历史建筑": ["quiet"]
};

/**
 * 根据用户选择，从校园场景库中筛选出最合适的推荐列表
 *
 * 打分规则：
 *   tags 包含 mood             → +3
 *   timeRange 包含 availableMinutes → +2
 *   socialTags 包含 socialComfort   → +2
 *   type 对应 preferences 每项      → +1
 * 按总分从高到低排序，取前 3 条。全部 0 分返回 []。
 *
 * @param {Object} userSelection - 用户的选择结果
 * @param {string} userSelection.mood              - 心情标识，对应 MOODS 中的 key，例如 "tired"
 * @param {number} userSelection.availableMinutes  - 可用时长（分钟），可选值：5 / 15 / 30
 * @param {string[]} userSelection.preferences     - 场景偏好标签，可选值：quiet / nature / walkable / warm / food
 * @param {string} userSelection.socialComfort     - 社交舒适度，可选值：alone / small / crowded
 *
 * @returns {Scene[]} 匹配到的场景数组，按匹配度从高到低排序。
 *                   如果没有匹配到任何场景，返回空数组 []。
 */
function matchScenes(userSelection) {
  const selection = userSelection || {};
  const mood = selection.mood;
  const availableMinutes = selection.availableMinutes;
  const preferences = Array.isArray(selection.preferences) ? selection.preferences : [];
  const socialComfort = selection.socialComfort;

  const scored = SCENES.map((scene) => {
    let score = 0;

    // 1. 心情匹配 +3
    if (mood && Array.isArray(scene.tags) && scene.tags.includes(mood)) {
      score += 3;
    }

    // 2. 时长匹配 +2
    if (
      availableMinutes &&
      Array.isArray(scene.timeRange) &&
      scene.timeRange.includes(availableMinutes)
    ) {
      score += 2;
    }

    // 3. 社交舒适度匹配 +2
    if (
      socialComfort &&
      Array.isArray(scene.socialTags) &&
      scene.socialTags.includes(socialComfort)
    ) {
      score += 2;
    }

    // 4. 偏好匹配：每个命中的偏好 +1
    const scenePrefs = TYPE_TO_PREFERENCES[scene.type] || [];
    for (const p of preferences) {
      if (scenePrefs.includes(p)) {
        score += 1;
      }
    }

    return { scene, score };
  });

  // 过滤掉 0 分 → 按分数从高到低 → 取前 3 条 → 只返回 scene 对象
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.scene);
}

// 兜底场景 ID：挑两个最通用、最不容易踩雷的地点
// - scene-013 南湖前面的空地：户外自然，散步/发呆/吹风都行，任何心情都不违和
// - scene-002 文学院：室内安静，累了/低落时坐着就好，可以独处
const FALLBACK_SCENE_IDS = ["scene-013", "scene-002"];

/**
 * 获取默认兜底场景（当 matchScenes 返回空数组时使用）
 * 由调用方在"无匹配"界面展示这些兜底选项
 */
function getFallbackScenes() {
  // 按上面的 ID 顺序取出场景（顺序固定，不随 SCENES 数组顺序变）
  const ordered = FALLBACK_SCENE_IDS
    .map((id) => SCENES.find((s) => s.id === id))
    .filter(Boolean);

  // 万一以后数据被改、这两个 ID 找不到了，退回前两条，保证永远有兜底
  return ordered.length > 0 ? ordered : SCENES.slice(0, 2);
}