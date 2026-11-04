/**
 * 回信生成服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义回信生成函数的签名和注释，
 *  具体的回信模板和文案组合逻辑由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 *
 * 【本版回信结构】分三段生成，拼接进 Letter.content：
 *   1) 首段：根据心情回应用户（OPENINGS）
 *   2) 中段：按场景 type 生成场景化描写；若场景还带有其它心情标签，
 *            再融合一句"两种情绪并不冲突"的内容（SCENE_BODIES / EXTRA_MOOD_SENTENCES）
 *   3) 尾段：按心情给出勉励 + 名言诗词（CLOSINGS）
 *  Letter 的其余字段（place / reason / smallAction / ending）不变。
 */

// 心情中文名（用于中段融合"当前心情 + 场景其它心情"）
// 与 moods.js 中的 label 保持一致，修改时请同步
const MOOD_LABELS = {
  tired: "疲惫",
  irritated: "烦躁",
  down: "低落",
  lonely: "孤独",
  confused: "迷茫",
  peaceful: "平静"
};

// 心情关联表（与 matcher.js 保持一致），用于从场景的其它标签中
// 挑选"最值得被融合进中段"的那一条
const MOOD_AFFINITY = {
  tired:     { down: 1, peaceful: 0.5, irritated: 0.5, confused: 0.5, lonely: 0.5 },
  irritated: { peaceful: 1, tired: 0.5, down: 0.5, confused: 0.5 },
  down:      { lonely: 1, tired: 1, irritated: 0.5, confused: 0.5 },
  lonely:    { down: 1, peaceful: 0.5, tired: 0.5 },
  confused:  { peaceful: 1, tired: 0.5, down: 0.5 },
  peaceful:  { tired: 0.5, irritated: 1, lonely: 0.5, confused: 0.5 }
};

// 首段：按心情回应用户（随机挑一句）
const OPENINGS = {
  tired: [
    "今天辛苦了，真的。",
    "能撑到现在已经很不容易了，先允许自己停一停。",
    "累的时候，连呼吸都会觉得沉，这很正常。"
  ],
  irritated: [
    "先深呼吸，让心里那团火慢一点烧。",
    "烦的时候，不是你的错，也不是你不够好。",
    "那些让你烦躁的事，可以先放在一边，不用现在就去解决。"
  ],
  down: [
    "心情不好的时候，不用急着振作。",
    "低落不是软弱，是你撑得太久了。",
    "难过就难过一会儿吧，天不会因为你低落就不亮。"
  ],
  lonely: [
    "一个人待着的时候，时间好像会变得很长。",
    "孤独这件事，谁都会有，你不是一个人在面对它。",
    "想让心暖一点，是很正常的愿望。"
  ],
  confused: [
    "迷茫的时候，先别急着做决定。",
    "不知道方向也没关系，路不是一次就能看全的。",
    "停下来不是退步，是在给自己重新看路的机会。"
  ],
  peaceful: [
    "心情不错的时候，更要认真享受它。",
    "平静是很珍贵的，别急着让它过去。",
    "这样安静的好心情，值得被好好记住。"
  ]
};

// 中段：按场景类型生成场景化描写（{place} 会替换为场景名）
const SCENE_BODIES = {
  "图书馆": [
    "「{place}」是一个能把时间放慢的地方。书架间的安静是有重量的，坐下来翻几页书，脑子里的杂音会一点点退潮。"
  ],
  "咖啡馆": [
    "「{place}」的灯光和桌椅都带着一种不打扰人的温柔，坐进那个角落，很容易就把自己还给自己。"
  ],
  "自然": [
    "「{place}」有绿、有风、有光，站在这里，身体会先于脑子放松下来。听一会儿树叶响，呼吸也会跟着慢。",
    "「{place}」的草木不着急，风也不着急，它们只会安静地把你接住。"
  ],
  "道路": [
    "沿着「{place}」慢慢走一段，脚步会比脑子更早把情绪理顺。"
  ],
  "操场": [
    "在「{place}」，身体动起来，情绪就有了出口。跑两圈、投几个球，汗出来，心也会轻一点。",
    "「{place}」的空间很大，大到可以装下你今天所有的不顺。"
  ],
  "广场": [
    "「{place}」开阔而干净，站在这里，视野一宽，心里的结好像也松了一点。"
  ],
  "食堂": [
    "「{place}」里的饭菜香是实实在在的，热气一腾，胃暖了，人也就不那么飘了。",
    "在「{place}」坐下来吃一顿热饭，是一天里最踏实的十分钟。"
  ],
  "生活": [
    "「{place}」是那种能让人安静下来的空间，坐下就好，不用说话也不用做事。"
  ],
  "历史建筑": [
    "「{place}」在这里已经站了很多年，看到它，会觉得眼下的时间其实没那么急。"
  ]
};

const DEFAULT_SCENE_BODY = "「{place}」是一个安静、舒服的角落，坐下来待一会儿就好。";

// 当场景还带有"其它心情标签"时，融合一句"两种情绪并不冲突"
const EXTRA_MOOD_SENTENCES = [
  "而这里除了接住你的{currentMood}，也带着一点{extraMood}的气质，两种情绪在这里并不冲突。",
  "「{place}」这样的角落，容得下{currentMood}，也容得下{extraMood}，不用非选一种。",
  "这里不只有一种气氛，{currentMood}和{extraMood}都能在这里找到落脚的地方。"
];

// 尾段：按心情的勉励语 + 名言诗词
const CLOSINGS = {
  tired: {
    encourage: [
      "休息不是浪费时间，是为了走更长的路。",
      "允许自己慢下来，也是一种能力。"
    ],
    quotes: [
      { text: "行到水穷处，坐看云起时。", from: "王维" },
      { text: "莫听穿林打叶声，何妨吟啸且徐行。", from: "苏轼" }
    ]
  },
  irritated: {
    encourage: [
      "情绪不是敌人，它只是提醒你该喘口气了。",
      "再大的风浪，也有过去的时候。"
    ],
    quotes: [
      { text: "回首向来萧瑟处，归去，也无风雨也无晴。", from: "苏轼" },
      { text: "长风破浪会有时，直挂云帆济沧海。", from: "李白" }
    ]
  },
  down: {
    encourage: [
      "低落会过去，而你比想象中更有力量。",
      "天总会亮的，哪怕慢一点。"
    ],
    quotes: [
      { text: "沉舟侧畔千帆过，病树前头万木春。", from: "刘禹锡" },
      { text: "山重水复疑无路，柳暗花明又一村。", from: "陆游" }
    ]
  },
  lonely: {
    encourage: [
      "一个人也可以很好，只是需要一点温度。",
      "孤独是暂时的，温暖会慢慢靠近你。"
    ],
    quotes: [
      { text: "海内存知己，天涯若比邻。", from: "王勃" },
      { text: "人生如逆旅，我亦是行人。", from: "苏轼" }
    ]
  },
  confused: {
    encourage: [
      "不知道方向也没关系，谁都是一边走一边找路。",
      "此刻的困惑，总有一天会变成你脚下的路。"
    ],
    quotes: [
      { text: "路漫漫其修远兮，吾将上下而求索。", from: "屈原" },
      { text: "不畏浮云遮望眼，自缘身在最高层。", from: "王安石" }
    ]
  },
  peaceful: {
    encourage: [
      "好心情值得被认真对待，也值得被好好记住。",
      "平静是很珍贵的礼物，愿你多留一会儿。"
    ],
    quotes: [
      { text: "采菊东篱下，悠然见南山。", from: "陶渊明" },
      { text: "人间有味是清欢。", from: "苏轼" }
    ]
  }
};

// 温柔结束语池，随机选一句
const ENDINGS = [
  "慢慢来，一切都还来得及。💌",
  "不管怎样，记得照顾好自己。💛",
  "今天也要对自己温柔一点。🌸",
  "你值得所有的好。✨",
  "下一次，也要好好抱抱自己。🫂",
  "如果累了，就再来这里坐坐。🍃"
];

// ---------- 内部工具函数 ----------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 安全替换 {xxx} 占位（避免 String.replace 对 $ 的特殊处理）
function fill(template, dict) {
  let out = template;
  for (const key of Object.keys(dict)) {
    const val = dict[key];
    out = out.split(`{${key}}`).join(val == null ? "" : String(val));
  }
  return out;
}

// 从场景的其它心情标签中，挑一个与当前心情关联度最高的（无则返回 null）
function pickExtraMood(scene, mood) {
  if (!scene || !Array.isArray(scene.tags)) return null;
  const affinity = MOOD_AFFINITY[mood] || {};
  let best = null;
  let bestWeight = -1;
  for (const tag of scene.tags) {
    if (tag === mood) continue;
    if (!MOOD_LABELS[tag]) continue;
    const w = affinity[tag] || 0;
    if (w > bestWeight) {
      bestWeight = w;
      best = tag;
    }
  }
  return best;
}

function buildOpening(mood) {
  const pool = OPENINGS[mood] || OPENINGS.tired;
  return pick(pool);
}

function buildBody(scene, mood) {
  const pool = SCENE_BODIES[scene.type];
  const template = pool && pool.length ? pick(pool) : DEFAULT_SCENE_BODY;
  let body = fill(template, { place: scene.name });

  const extraMoodKey = pickExtraMood(scene, mood);
  if (extraMoodKey) {
    const extraSentence = fill(pick(EXTRA_MOOD_SENTENCES), {
      place: scene.name,
      currentMood: MOOD_LABELS[mood] || "",
      extraMood: MOOD_LABELS[extraMoodKey]
    });
    body = `${body}${extraSentence}`;
  }
  return body;
}

function buildClosing(mood) {
  const config = CLOSINGS[mood] || CLOSINGS.tired;
  const encourage = pick(config.encourage);
  const quote = pick(config.quotes);
  return `${encourage}\n——「${quote.text}」· ${quote.from}`;
}

// ---------- 对外接口 ----------

/**
 * 根据用户选择和匹配到的场景，生成一张完整的校园回信卡内容
 *
 * @param {Object} params - 生成回信需要的输入
 * @param {Object} params.userSelection - 用户的原始选择（同 matchScenes 的入参）
 * @param {Scene}  params.matchedScene   - 匹配到的单个场景（取 matchScenes 返回的第一条即可）
 *
 * @returns {Letter} 回信卡内容对象（content 由三段拼接而成，含换行）
 */
function generateLetter({ userSelection, matchedScene }) {
  if (!matchedScene) {
    throw new Error("matchedScene 为空，请使用 generateLetterSafe");
  }

  const rawMood = userSelection && userSelection.mood;
  const mood = MOOD_LABELS[rawMood] ? rawMood : "tired";

  const opening = buildOpening(mood);
  const body = buildBody(matchedScene, mood);
  const closing = buildClosing(mood);
  const content = [opening, body, closing].filter(Boolean).join("\n\n");

  return {
    content,
    place: matchedScene.name,
    reason: matchedScene.reason,
    smallAction: matchedScene.smallAction,
    ending: pick(ENDINGS)
  };
}

/**
 * 对回信文案进行简单的异常处理（比如 matchedScene 为空时的兜底）
 */
function generateLetterSafe({ userSelection, matchedScene }) {
  if (!matchedScene) {
    return {
      content:
        "看来暂时没有找到完全合适的地方，也许你可以先去操场走一圈。\n\n别急，校园里总有一个角落在等你，只是还没遇上。\n\n慢慢来，一切都还来得及。",
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