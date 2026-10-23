/**
 * 回信生成服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义回信生成函数的签名和注释，
 *  具体的回信模板和文案组合逻辑由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 */

/**
 * 根据用户选择和匹配到的场景，生成一张完整的校园回信卡内容
 *
 * @param {Object} params - 生成回信需要的输入
 * @param {Object} params.userSelection - 用户的原始选择（同 matchScenes 的入参）
 * @param {Scene}  params.matchedScene   - 匹配到的单个场景（取 matchScenes 返回的第一条即可）
 *
 * @returns {Letter} 回信卡内容对象
 *
 * @typedef {Object} Letter
 * @property {string} content       - 安慰文案正文（100~150 字，温柔自然）
 * @property {string} place         - 推荐地点名称（直接用 matchedScene.name）
 * @property {string} reason        - 选择该地点的原因（直接用 matchedScene.reason）
 * @property {string} smallAction   - 立即可以执行的小行动（直接用 matchedScene.smallAction）
 * @property {string} ending        - 温柔的结束语（一句话）
 *
 * @example
 * const letter = generateLetter({
 *   userSelection: { mood: "tired", availableMinutes: 15, ... },
 *   matchedScene: { name: "图书馆三楼窗边阅读区", ... }
 * });
 * // letter => { content: "......", place: "......", ... }
 */
function generateLetter({ userSelection, matchedScene }) {
  // ============================================================
  // TODO：这里写回信生成逻辑（D 模块完成）
  //
  // 简单实现思路（供参考）：
  // 1. 准备几组不同 mood 对应的安慰文案模板（比如 tired 对应 3 条）
  // 2. 随机选一条，把 matchedScene.name 填进去
  // 3. place / reason / smallAction 直接从 matchedScene 取
  // 4. ending 可以是固定的几句温柔的话，随机选一条
  // 5. 不要承诺能解决心理疾病，文案要自然不生硬
  // ============================================================

  // 占位：先返回一个固定的结构，让 B 模块能先渲染 UI
  return {
    content: "今天辛苦了，找个安静的地方歇一歇吧。校园里总有一个角落在等你。",
    place: matchedScene.name,
    reason: matchedScene.reason,
    smallAction: matchedScene.smallAction,
    ending: "慢慢来，一切都还来得及。💌"
  };
}

/**
 * 对回信文案进行简单的异常处理（比如 matchedScene 为空时的兜底）
 */
function generateLetterSafe({ userSelection, matchedScene }) {
  if (!matchedScene) {
    return {
      content: "看来暂时没有找到完全合适的地方，也许你可以先去操场走一圈。",
      place: "校园操场",
      reason: "运动一下能让心情好起来",
      smallAction: "快走 3 分钟",
      ending: "无论如何，别忘记照顾自己。💌"
    };
  }
  try {
    return generateLetter({ userSelection, matchedScene });
  } catch (e) {
    console.error("回信生成失败：", e);
    return {
      content: "遇到了一点小问题，不过没关系，请再试一次吧。",
      place: matchedScene.name,
      reason: matchedScene.reason,
      smallAction: matchedScene.smallAction,
      ending: "慢慢来。💌"
    };
  }
}

export { generateLetter, generateLetterSafe };
