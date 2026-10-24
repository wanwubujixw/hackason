/**
 * 回信生成服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义回信生成函数的签名和注释，
 *  具体的回信模板和文案组合逻辑由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 */

// 各心情对应的安慰文案模板（用 {place} 占位，生成时替换为场景名）
const MOOD_CONTENT = {
  tired:
    "今天辛苦了，找个安静的地方歇一歇吧。校园里总有一个角落在等你——不如就去「{place}」坐一会儿，什么都不用做，发呆也好，闭眼也好。你已经撑了很久，剩下的时间，请允许自己慢下来。",
  irritated:
    "深呼吸三次，一切都会慢慢好起来的。给自己 5 分钟，只做自己想做的事。让烦心的事先放一放，去「{place}」走一走，让风吹一吹脑袋。情绪不是敌人，它只是提醒你：该松一口气了。",
  down:
    "心情不好的时候，风会带走一部分烦恼。找个温暖的角落，让自己静一静，不用急着振作，也不用假装没事。去「{place}」待一会儿吧，低落会过去，而你会比想象中更有力量。",
  lonely:
    "一个人也可以很好。去有烟火气的地方走一圈，感受校园的温度。也许是一杯热奶茶，也许是一段琴声，也许只是陌生人的笑声——去「{place}」吧，这些小小的热闹，会慢慢把你围起来。你不是一个人。",
  confused:
    "迷茫的时候，先别急着往前走。停下来想一想，也许答案就在下一个转角。去「{place}」坐一会儿，不知道方向也没关系，谁都是一边走一边找路。此刻的困惑，总有一天会变成你脚下的路。",
  peaceful:
    "既然心情不错，那就好好享受这份宁静吧。去「{place}」坐一会儿，让这份平静多停留一会儿。好心情值得被认真对待，也值得被好好记住。"
};

// 温柔结束语池，随机选一句
const ENDINGS = [
  "慢慢来，一切都还来得及。💌",
  "不管怎样，记得照顾好自己。💛",
  "今天也要对自己温柔一点。🌸",
  "你值得所有的好。✨"
];

/**
 * 根据用户选择和匹配到的场景，生成一张完整的校园回信卡内容
 *
 * @param {Object} params - 生成回信需要的输入
 * @param {Object} params.userSelection - 用户的原始选择（同 matchScenes 的入参）
 * @param {Scene}  params.matchedScene   - 匹配到的单个场景（取 matchScenes 返回的第一条即可）
 *
 * @returns {Letter} 回信卡内容对象
 */
function generateLetter({ userSelection, matchedScene }) {
  const mood = userSelection && userSelection.mood;

  // 按 mood 选模板；找不到就用 tired 的（保证任何 mood 都有文案）
  const template = MOOD_CONTENT[mood] || MOOD_CONTENT.tired;

  // 把 {place} 替换成场景名
  const content = template.replace("{place}", matchedScene.name);

  // 随机挑一句结束语
  const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];

  return {
    content,
    place: matchedScene.name,
    reason: matchedScene.reason,
    smallAction: matchedScene.smallAction,
    ending
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