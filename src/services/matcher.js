/**
 * 场景匹配服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义匹配函数的签名和注释，
 *  具体的匹配逻辑（如何根据用户选择筛选场景）由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 *
 * 【本版匹配策略】
 * - 主心情命中：+3（用户此刻最直接的情绪）
 * - 关联心情命中：按 MOOD_AFFINITY 权重累加，封顶 +2
 *   → 实现"多项心情组合匹配"：场景的其它心情标签若与当前心情语义相近，
 *     说明它更贴合用户此刻的复合情绪。
 * - 时长命中：+2
 * - 社交舒适度命中：+2；若用户明确选了 socialComfort 而场景完全不包含：-1
 * - 偏好命中：每项 +1
 * - 心情完全无关：得分 ×0.6（温和衰减，避免"只要时长/偏好对上就列出"）
 * - 分档阈值：心情相关场景 ≥3 分，心情无关场景 ≥4.5 分
 * - 同 type 最多出现 2 条，最终最多 3 条
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
 * 心情关联表：定义不同心情之间的"语义亲近度"。
 * 用途一：场景的次要心情标签若与当前心情接近，给额外加分（组合匹配）。
 * 用途二：letterGenerator.js 里也用同一张表挑选"最值得融合"的其它心情，
 *         修改时请两边保持同步。
 */
const MOOD_AFFINITY = {
  tired:     { down: 1, peaceful: 0.5, irritated: 0.5, confused: 0.5, lonely: 0.5 },
  irritated: { peaceful: 1, tired: 0.5, down: 0.5, confused: 0.5 },
  down:      { lonely: 1, tired: 1, irritated: 0.5, confused: 0.5 },
  lonely:    { down: 1, peaceful: 0.5, tired: 0.5 },
  confused:  { peaceful: 1, tired: 0.5, down: 0.5 },
  peaceful:  { tired: 0.5, irritated: 1, lonely: 0.5, confused: 0.5 }
};

const MAX_AFFINITY_BONUS = 2;       // 关联心情加分上限
const MIN_SCORE_RELEVANT = 3;       // 心情相关场景的最低入选分
const MIN_SCORE_OTHER = 4.5;        // 心情无关场景的最低入选分（衰减后）
const UNRELATED_PENALTY = 0.6;      // 心情完全无关的衰减系数
const SOCIAL_CONFLICT_PENALTY = 1;  // 社交完全不匹配的扣分
const MAX_RESULTS = 3;              // 最多返回条数
const MAX_PER_TYPE = 2;             // 同类型场景最多出现次数

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
 */
function matchScenes(userSelection) {
  const selection = userSelection || {};
  const mood = selection.mood;
  const availableMinutes = selection.availableMinutes;
  const preferences = Array.isArray(selection.preferences) ? selection.preferences : [];
  const socialComfort = selection.socialComfort;
  const affinityMap = (mood && MOOD_AFFINITY[mood]) || {};

  const scored = SCENES.map((scene) => {
    const tags = Array.isArray(scene.tags) ? scene.tags : [];
    const socials = Array.isArray(scene.socialTags) ? scene.socialTags : [];
    let score = 0;
    let moodRelevant = false;

    // 1. 主心情命中：+3
    if (mood && tags.includes(mood)) {
      score += 3;
      moodRelevant = true;
    }

    // 2. 关联心情命中：多项组合，累加权重，封顶 +2
    if (mood) {
      let affinitySum = 0;
      for (const t of tags) {
        if (t !== mood && affinityMap[t]) {
          affinitySum += affinityMap[t];
          moodRelevant = true;
        }
      }
      if (affinitySum > 0) {
        score += Math.min(affinitySum, MAX_AFFINITY_BONUS);
      }
    }

    // 3. 时长命中：+2
    if (
      availableMinutes &&
      Array.isArray(scene.timeRange) &&
      scene.timeRange.includes(availableMinutes)
    ) {
      score += 2;
    }

    // 4. 社交舒适度：命中 +2，明确不匹配 -1
    if (socialComfort) {
      if (socials.includes(socialComfort)) {
        score += 2;
      } else if (socials.length > 0) {
        score -= SOCIAL_CONFLICT_PENALTY;
      }
    }

    // 5. 偏好命中：每个 +1
    const scenePrefs = TYPE_TO_PREFERENCES[scene.type] || [];
    for (const p of preferences) {
      if (scenePrefs.includes(p)) {
        score += 1;
      }
    }

    // 6. 心情完全无关：温和衰减（避免"时长/偏好对上就凑数"）
    if (mood && !moodRelevant) {
      score *= UNRELATED_PENALTY;
    }

    return { scene, score, moodRelevant };
  });

  // 分档阈值过滤 → 按分数从高到低排序
  const ranked = scored
    .filter((item) =>
      item.score >= (item.moodRelevant ? MIN_SCORE_RELEVANT : MIN_SCORE_OTHER)
    )
    .sort((a, b) => b.score - a.score);

  // 控制每 type 出现次数，避免前 3 条全是同类型
  const typeCount = new Map();
  const picked = [];
  for (const item of ranked) {
    if (picked.length >= MAX_RESULTS) break;
    const type = item.scene.type;
    const used = typeCount.get(type) || 0;
    if (used >= MAX_PER_TYPE) continue;
    typeCount.set(type, used + 1);
    picked.push(item.scene);
  }

  return picked;
}

// 兜底场景 ID：挑两个最通用、最不容易踩雷的地点
// - scene-012 南湖前面的空地：户外自然，散步/发呆/吹风都行，任何心情都不违和
// - scene-002 文学院：室内安静，累了/低落时坐着就好，可以独处
const FALLBACK_SCENE_IDS = ["scene-012", "scene-002"];

/**
 * 获取默认兜底场景（当 matchScenes 返回空数组时使用）
 * 由调用方在"无匹配"界面展示这些兜底选项
 */
function getFallbackScenes() {
  const ordered = FALLBACK_SCENE_IDS
    .map((id) => SCENES.find((s) => s.id === id))
    .filter(Boolean);

  return ordered.length > 0 ? ordered : SCENES.slice(0, 2);
}

export { matchScenes, getFallbackScenes };