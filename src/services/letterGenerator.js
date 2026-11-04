/**
 * 回信生成服务（D 模块主要开发内容）
 *
 * 【接口规范】本文件只定义回信生成函数的签名和注释，
 *  具体的回信模板和文案组合逻辑由 D 模块实现。
 *  B/C/E 模块不要修改这里的函数签名！
 *
 * 【本版回信结构】五段拼接进 Letter.content（\n\n 分隔），约 380~470 字：
 *   1) 首段：心情回应（OPENINGS）——只随心情
 *   2) 第二段：名人事迹 / 寓言 / 典故（STORIES）——随「心情 + 场景类型」双维度选
 *   3) 第三段：故事呼应，把故事拉回用户自身（REFLECTIONS）——随「心情 + 场景」选
 *   4) 第四段：场景化描写 + 其它心情标签融合（SCENE_BODIES）——随场景
 *   5) 尾段：勉励 + 名言诗词（CLOSINGS）——只随心情
 *
 * 【随机与"换地点换主体"策略】
 *  - 首尾段（opening / closing / quote / ending）用时间种子：同一心情下开头结尾稳定；
 *  - 主体段（story / reflection / body / extraMood）用「scene.id 哈希 + 时间种子」：
 *    同样心情换一个地点，故事、呼应、场景描写必然变化；
 *  - 时间种子每 60 秒换一次；若 userSelection.seed 为有限数字则优先使用，
 *    便于 B 模块做"换一封"或测试（可选扩展字段，不进架构契约）。
 */

// 心情中文名（用于第四段融合"当前心情 + 场景其它心情"）
const MOOD_LABELS = {
  tired: "疲惫",
  irritated: "烦躁",
  down: "低落",
  lonely: "孤独",
  confused: "迷茫",
  peaceful: "平静"
};

// 心情关联表（与 matcher.js 保持一致），用于挑选最值得被融合的其它心情
const MOOD_AFFINITY = {
  tired:     { down: 1, peaceful: 0.5, irritated: 0.5, confused: 0.5, lonely: 0.5 },
  irritated: { peaceful: 1, tired: 0.5, down: 0.5, confused: 0.5 },
  down:      { lonely: 1, tired: 1, irritated: 0.5, confused: 0.5 },
  lonely:    { down: 1, peaceful: 0.5, tired: 0.5 },
  confused:  { peaceful: 1, tired: 0.5, down: 0.5 },
  peaceful:  { tired: 0.5, irritated: 1, lonely: 0.5, confused: 0.5 }
};

// ---------- 第一段：按心情回应用户 ----------
const OPENINGS = {
  tired: [
    "今天辛苦了，真的。能撑到现在已经很不容易，先允许自己停一停。",
    "累的时候，连呼吸都会觉得沉，这很正常，不是你的错。",
    "你不需要一直保持高效，人是需要休息的，不是机器。",
    "身体的疲惫，往往先于心被察觉。你已经很努力了，真的。"
  ],
  irritated: [
    "先深呼吸，让心里那团火慢一点烧。",
    "烦的时候，不是你的错，也不是你不够好。",
    "那些让你烦躁的事，可以先放在一边，不用现在就去解决。",
    "情绪上来的时候，先别急着评判自己，它只是路过。"
  ],
  down: [
    "心情不好的时候，不用急着振作。",
    "低落不是软弱，是你撑得太久了。",
    "难过就难过一会儿吧，天不会因为你低落就不亮。",
    "有些日子就是会这样，不必勉强自己笑。"
  ],
  lonely: [
    "一个人待着的时候，时间好像会变得很长。",
    "孤独这件事，谁都会有，你不是一个人在面对它。",
    "想让心暖一点，是很正常的愿望。",
    "人和人之间隔着一段距离，但这距离不是你的错。"
  ],
  confused: [
    "迷茫的时候，先别急着做决定。",
    "不知道方向也没关系，路不是一次就能看全的。",
    "停下来不是退步，是在给自己重新看路的机会。",
    "雾总会散，只是要等风来。"
  ],
  peaceful: [
    "心情不错的时候，更要认真享受它。",
    "平静是很珍贵的，别急着让它过去。",
    "这样安静的好心情，值得被好好记住。",
    "生活里难得的松弛，是给自己的礼物。"
  ]
};

// ---------- 第二段：名人事迹 / 寓言 / 典故 ----------
// 每条带 sceneTypes：优先从与场景类型匹配的子集中选；无匹配才用全池
const STORIES = {
  tired: [
    {
      text:
        "想起苏轼在黄州的日子。被贬到那个小地方，他没有硬撑。白天开垦东坡、种麦子，累了就在田边坐一坐，看云从山头慢慢爬过来。他不是不苦，只是懂得在苦里给自己留一点喘气的地方。后来他写下「一蓑烟雨任平生」，那股从容，其实是从一次次的休息里攒出来的。",
      sceneTypes: ["自然", "生活", "历史建筑"]
    },
    {
      text:
        "《庄子》里有个故事：一棵树因为长得歪歪扭扭，木匠看不上，反而活了几百年。庄子说，这叫「无用之用」。累到不想动的时候，不妨也做一会儿那棵歪树——不急着被谁需要，只是安静地站着、长着，就已经很好了。",
      sceneTypes: ["自然"]
    },
    {
      text:
        "孟浩然一辈子求官不成，干脆回襄阳隐居，常常睡到日上三竿。有人笑他懒散，他只写「春眠不觉晓，处处闻啼鸟」。累了就睡，醒了就听鸟，日子过得比谁都明白。",
      sceneTypes: ["生活", "自然"]
    },
    {
      text:
        "陶渊明辞官回家后写过「息交游闲业，卧起弄书琴」——不跟人应酬了，睡醒就翻翻书、拨拨琴。他不是没本事做事，是懂得把力气收回来给自己。累的时候，把门轻轻关上，世界不会因此停转。",
      sceneTypes: ["生活", "图书馆"]
    },
    {
      text:
        "梭罗在瓦尔登湖边住了两年多，自己搭木屋、种豆子。他说自己不是逃避，是「想把生活逼到墙角，看它到底能给出什么」。他每天做的事不多：走路、看湖、记笔记。慢下来以后，他反而看见了很多以前看不见的东西。",
      sceneTypes: ["自然", "道路"]
    }
  ],
  irritated: [
    {
      text:
        "苏轼有回打坐，自觉定力够了，写诗给佛印：「八风吹不动，端坐紫金莲。」佛印只批了两个字：放屁。苏轼气得连夜过江去理论。佛印笑他：「八风吹不动，一屁过江来。」你看，连大文豪也压不住火。所以烦躁来了别自责，它会来，也总会走。",
      sceneTypes: ["历史建筑", "生活"]
    },
    {
      text:
        "林肯做总统时，每次被激怒，就写一封措辞激烈的信，写完不寄，锁进抽屉。他说：「写信的时候我已经消了气，寄出去就只剩后悔。」烦躁的时候，不妨也给自己一个「写完不寄」的缓冲。",
      sceneTypes: ["生活", "图书馆"]
    },
    {
      text:
        "清代张英收到家书，说邻居砌墙占了地界。他回信：「千里修书只为墙，让他三尺又何妨。万里长城今犹在，不见当年秦始皇。」家人让出三尺，邻居惭愧也让三尺，于是有了「六尺巷」。烦躁时退的那一步，往往不是认输。",
      sceneTypes: ["广场", "道路"]
    },
    {
      text:
        "韩信年轻时被街头混混拦住，要他要么拔剑、要么从胯下钻过去。他看了很久，最后俯身钻了过去。后来他成了大将军，回来没有报复那个人。那一刻他忍下的，不是懦弱，是知道自己要去更远的地方。",
      sceneTypes: ["道路", "广场"]
    },
    {
      text:
        "曼德拉被关在罗本岛十八年，每天在石灰石场凿石头。出狱后有人问他恨不恨，他说：「当我走出监狱大门，我就知道，如果我不把悲伤和怨恨留在身后，那我其实还在监狱里。」烦躁的时候，先把自己从情绪里放出来。",
      sceneTypes: ["图书馆", "生活"]
    }
  ],
  down: [
    {
      text:
        "史铁生二十一岁瘫痪，很长一段时间想不明白为什么是自己。后来他摇着轮椅进了地坛，在那里一坐一整天，看蚂蚁、看落日、看四季。他写过：死是一件不必急于求成的事，那就在生里，慢慢把日子过出光来。低落不可怕，怕的是不肯等一等。",
      sceneTypes: ["自然", "历史建筑"]
    },
    {
      text:
        "贝多芬三十二岁开始耳聋，对一个音乐家来说，几乎等于世界塌了。他躲到维也纳郊外的小镇，写下《海利根施塔特遗书》，几次想结束一切。可最后他还是回到琴前，用牙齿咬住木棍抵住琴箱，靠震动去「听」。他后来说：「我要扼住命运的咽喉。」低落的时候，命运未必能立刻变好，但你可以先不认输。",
      sceneTypes: ["生活", "图书馆"]
    },
    {
      text:
        "霍金二十一岁被诊断出渐冻症，医生说大概只剩两年。他后来活到七十六岁，还写出《时间简史》。有人问他怎么熬过来的，他说：「记住仰望星空，不要低头看脚下。」低落的时候，抬一次头，天就在那儿。",
      sceneTypes: ["自然", "广场"]
    },
    {
      text:
        "苏轼因乌台诗案下狱一百三十天，差点丢了命。出狱后被贬黄州，他写「拣尽寒枝不肯栖，寂寞沙洲冷」。可就在那几年，他写出了《赤壁赋》。有些低谷不是终点，是转折点，只是当时不知道。",
      sceneTypes: ["历史建筑", "自然"]
    },
    {
      text:
        "丘吉尔说过一句话：「成功不是终点，失败也不是终结，唯有前进的勇气才是永恒。」他一生起伏极大，被骂过、被赶下台过，可每次都能重新站起来。低落的时候，先不急着评价这一页，书还没翻完。",
      sceneTypes: ["生活", "图书馆"]
    }
  ],
  lonely: [
    {
      text:
        "苏轼被贬密州那年的中秋，一个人喝酒到天亮，想起了七年没见的弟弟苏辙。他写下「人有悲欢离合，月有阴晴圆缺，此事古难全」，最后一句是「但愿人长久，千里共婵娟」。你看，孤独这件事，一千年前也有人一个人扛过——而他在孤独里，给所有后来的人留了一轮月亮。",
      sceneTypes: ["广场", "自然"]
    },
    {
      text:
        "梵高生前几乎没人理解他，画卖不出去，靠弟弟提奥接济。他给提奥写了六百多封信，信里说的常常是今天看到了什么颜色的天空。他在最孤独的时候，画出了《星空》。孤独不是你的错，它有时只是一个人还没被认出来的样子。",
      sceneTypes: ["生活", "咖啡馆"]
    },
    {
      text:
        "鲁迅在绍兴会馆抄了很多年古碑，一个人住，一个人吃饭。后来钱玄同来找他，才有了《狂人日记》。那些年他不是白待的，孤独里也在悄悄攒着力气。",
      sceneTypes: ["图书馆", "生活"]
    },
    {
      text:
        "王维十七岁写下「独在异乡为异客，每逢佳节倍思亲」。那时他一个人在长安，举目无亲。可他后来把这份孤独写进了诗里，反而让无数后来的人觉得被理解。一个人的时候，你不是没被看见，只是看见你的人还在路上。",
      sceneTypes: ["道路", "广场"]
    },
    {
      text:
        "梭罗在瓦尔登湖独居两年，他说自己「从未感到过孤独，哪怕一秒钟」。不是因为他不需要人，而是他学会了和湖水、和风声、和自己相处。孤独有时不是缺人，是还没学会陪自己。",
      sceneTypes: ["自然"]
    }
  ],
  confused: [
    {
      text:
        "乔布斯在斯坦福的演讲里讲过一件事：他大学辍学后，跑去旁听一门书法课，纯粹因为喜欢，当时看起来毫无用处。十年后做 Mac，他把那门课上学到的字体全用上了。他说：「你无法在向前看的时候把点连起来，只有在回头看的时候才能。」所以此刻的迷茫，也许只是那个点还没连上。",
      sceneTypes: ["图书馆", "咖啡馆"]
    },
    {
      text:
        "鲁迅年轻时去日本学医，想的是治病救人。可有一次看幻灯片，看到中国人围观同胞被杀却面无表情，他忽然明白：身体再健康，精神麻木也是没用的。于是他弃医从文，拿起了笔。他后来说：「其实地上本没有路，走的人多了，也便成了路。」迷茫的时候，路往往不是想出来的，是走出来的。",
      sceneTypes: ["历史建筑", "生活"]
    },
    {
      text:
        "齐白石五十七岁到北京卖画，没人买。他干脆关门变法，一改几十年画风，十年后终成大家。迷茫的时候，推倒重来也是一种走法。",
      sceneTypes: ["生活", "咖啡馆"]
    },
    {
      text:
        "玄奘西行取经，出发时没有通关文牒，也不知道前面是沙漠还是雪山。他走了一年多才到天竺，路上几次差点渴死。他后来在《大唐西域记》里写的，全是走过的路。方向不是出发前想清楚的，是一步一步走出来的。",
      sceneTypes: ["道路", "自然"]
    },
    {
      text:
        "爱迪生试灯丝材料，失败了几千次。有人问他是不是白费了，他说：「我没有失败，我只是发现了几千种不适合做灯丝的材料。」迷茫的时候，排除本身也是前进。",
      sceneTypes: ["图书馆", "生活"]
    }
  ],
  peaceful: [
    {
      text:
        "陶渊明做了八十多天彭泽县令，不愿为五斗米折腰，辞官回家。他在门前种了五棵柳树，自号「五柳先生」，每天读书、喝酒、看山。他写「采菊东篱下，悠然见南山」，那份平静不是天上掉下来的，是他主动选的。好心情也一样——不是等来的，是你此刻认真在过的。",
      sceneTypes: ["自然"]
    },
    {
      text:
        "林语堂在《生活的艺术》里说，他最享受的时刻，是躺在椅子上，抽一斗烟，听窗外下雨。他说：「享受悠闲生活当然比享受奢侈生活便宜得多。」平静是件很便宜的事，今天这份心情，值得你多坐一会儿。",
      sceneTypes: ["生活", "咖啡馆"]
    },
    {
      text:
        "丰子恺一生画小人物、小场景，他写「不乱于心，不困于情，不畏将来，不念过往，如此，安好」。平静不是世界不出事，是他选择用这样的眼睛看世界。",
      sceneTypes: ["生活", "自然"]
    },
    {
      text:
        "王维晚年住在辋川，写「明月松间照，清泉石上流」。他每天做的事很普通：看山、听泉、等月亮。可正是这些普通的事，让他把日子过成了一幅画。平静的时候，连寻常景色都会发光。",
      sceneTypes: ["自然", "历史建筑"]
    },
    {
      text:
        "汪曾祺写吃、写花、写寻常日子，他说：「如果你来访我，我不在，请和我门外的花坐一会儿。」平静的人，连花都愿意陪。今天这份闲心，值得你多留一会儿。",
      sceneTypes: ["食堂", "生活"]
    }
  ]
};

// ---------- 第三段：故事呼应——把故事拉回用户自身 ----------
const REFLECTIONS = {
  tired: [
    "说这些，不是要你也去种地或隐居，只是想告诉你：休息不是偷懒，是让身体和心都喘口气，然后再往前走。",
    "你不需要像谁一样坚强，此刻愿意停下来，本身就是一种清醒。",
    "那些看起来“什么都没做”的时刻，其实也在悄悄把你补回来。"
  ],
  irritated: [
    "所以你看，连这些厉害的人也压不住火。烦躁来了就来了，不必羞于承认，也不必急着赶它走。",
    "发火不是修养不够，只是你太久没被好好照顾了。",
    "把气理顺，再回头看那些事，多半没有那么严重。"
  ],
  down: [
    "所以你看，那些后来被记住的人，也都有过低到尘埃里的时刻。低落不是你一个人的错，也不是终点。",
    "难过的时候不必逞强，慢慢来，时间会陪你走一段。",
    "你现在觉得过不去的，往后看，也许只是长长路上的一小段。"
  ],
  lonely: [
    "所以你看，孤独从来不是你的专属。它只是一个人还没被认出来的样子，或者一段还没走完的夜路。",
    "一个人待着的时候，不妨想想这些同样孤独过的人，他们也曾和你望着同一片天。",
    "被理解需要一点时间，但它在来的路上。"
  ],
  confused: [
    "所以你看，那些后来找到路的人，当时也并不知道路在哪。他们只是一步一步地走，走着走着，回头看，才发现那些点连成了线。",
    "迷茫不是停滞，是你在重新校准方向。",
    "先做眼前能做的下一件小事，答案会自己浮上来。"
  ],
  peaceful: [
    "所以你看，平静不是躲开世界，而是在世界里面给自己留一块干净的地方。",
    "这份好心情，值得你多握一会儿，也值得你好好记住它长什么样。",
    "能感知到美的人，日子通常不会太坏。"
  ]
};

// ---------- 第四段：按场景类型生成场景化描写 ----------
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

const EXTRA_MOOD_SENTENCES = [
  "而这里除了接住你的{currentMood}，也带着一点{extraMood}的气质，两种情绪在这里并不冲突。",
  "「{place}」这样的角落，容得下{currentMood}，也容得下{extraMood}，不用非选一种。",
  "这里不只有一种气氛，{currentMood}和{extraMood}都能在这里找到落脚的地方。"
];

// ---------- 第五段：勉励 + 名言诗词 ----------
const CLOSINGS = {
  tired: {
    encourage: [
      "休息不是浪费时间，是为了走更长的路。",
      "允许自己慢下来，也是一种能力。",
      "今天能把自己照顾好，就已经很了不起了。"
    ],
    quotes: [
      { text: "行到水穷处，坐看云起时。", from: "王维" },
      { text: "莫听穿林打叶声，何妨吟啸且徐行。", from: "苏轼" },
      { text: "春有百花秋有月，夏有凉风冬有雪。若无闲事挂心头，便是人间好时节。", from: "无门慧开" },
      { text: "闲看庭前花开花落，漫随天外云卷云舒。", from: "《菜根谭》" }
    ]
  },
  irritated: {
    encourage: [
      "情绪不是敌人，它只是提醒你该喘口气了。",
      "再大的风浪，也有过去的时候。",
      "先把气理顺，再去处理那些事，效果会好得多。"
    ],
    quotes: [
      { text: "回首向来萧瑟处，归去，也无风雨也无晴。", from: "苏轼" },
      { text: "长风破浪会有时，直挂云帆济沧海。", from: "李白" },
      { text: "千里修书只为墙，让他三尺又何妨。", from: "张英" },
      { text: "牢骚太盛防肠断，风物长宜放眼量。", from: "毛泽东" }
    ]
  },
  down: {
    encourage: [
      "低落会过去，而你比想象中更有力量。",
      "天总会亮的，哪怕慢一点。",
      "难过的时候不假装，是对自己最大的诚实。"
    ],
    quotes: [
      { text: "沉舟侧畔千帆过，病树前头万木春。", from: "刘禹锡" },
      { text: "山重水复疑无路，柳暗花明又一村。", from: "陆游" },
      { text: "天生我材必有用，千金散尽还复来。", from: "李白" },
      { text: "冬天来了，春天还会远吗？", from: "雪莱" },
      { text: "黑夜给了我黑色的眼睛，我却用它寻找光明。", from: "顾城" }
    ]
  },
  lonely: {
    encourage: [
      "一个人也可以很好，只是需要一点温度。",
      "孤独是暂时的，温暖会慢慢靠近你。",
      "被理解需要时间，但值得等。"
    ],
    quotes: [
      { text: "海内存知己，天涯若比邻。", from: "王勃" },
      { text: "人生如逆旅，我亦是行人。", from: "苏轼" },
      { text: "但愿人长久，千里共婵娟。", from: "苏轼" },
      { text: "莫愁前路无知己，天下谁人不识君。", from: "高适" },
      { text: "相看两不厌，只有敬亭山。", from: "李白" }
    ]
  },
  confused: {
    encourage: [
      "不知道方向也没关系，谁都是一边走一边找路。",
      "此刻的困惑，总有一天会变成你脚下的路。",
      "先做眼前能做的事，答案会自己浮上来。"
    ],
    quotes: [
      { text: "路漫漫其修远兮，吾将上下而求索。", from: "屈原" },
      { text: "不畏浮云遮望眼，自缘身在最高层。", from: "王安石" },
      { text: "纸上得来终觉浅，绝知此事要躬行。", from: "陆游" },
      { text: "欲穷千里目，更上一层楼。", from: "王之涣" }
    ]
  },
  peaceful: {
    encourage: [
      "好心情值得被认真对待，也值得被好好记住。",
      "平静是很珍贵的礼物，愿你多留一会儿。",
      "能感知到美的人，日子不会太坏。"
    ],
    quotes: [
      { text: "采菊东篱下，悠然见南山。", from: "陶渊明" },
      { text: "人间有味是清欢。", from: "苏轼" },
      { text: "明月松间照，清泉石上流。", from: "王维" },
      { text: "晴空一鹤排云上，便引诗情到碧霄。", from: "刘禹锡" },
      { text: "春有百花秋有月，夏有凉风冬有雪。", from: "无门慧开" }
    ]
  }
};

const ENDINGS = [
  "慢慢来，一切都还来得及。💌",
  "不管怎样，记得照顾好自己。💛",
  "今天也要对自己温柔一点。🌸",
  "你值得所有的好。✨",
  "下一次，也要好好抱抱自己。🫂",
  "如果累了，就再来这里坐坐。🍃"
];

// ---------- 随机工具 ----------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getTimeSeed() {
  return Math.floor(Date.now() / 60000) >>> 0;
}

/** FNV-1a 字符串哈希：把 scene.id 转成稳定整数 */
function hashString(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SEED_OFFSET = {
  opening: 1,
  closing: 2,
  quote: 3,
  ending: 4,
  story: 11,
  reflection: 12,
  body: 13,
  extraMood: 14
};

function makeRng(seed, key) {
  const offset = SEED_OFFSET[key] || 0;
  return mulberry32((seed + offset) >>> 0);
}

function pick(arr, rng) {
  const r = rng ? rng() : Math.random();
  return arr[Math.floor(r * arr.length)];
}

/**
 * 场景感知取值：用 (sceneHash + seed + offset) % pool.length 取条目
 * - 同地点、同分钟稳定
 * - 换地点必变（scene.id 不同 → hash 不同）
 * - 跨分钟也会变
 */
function pickByScene(pool, seed, sceneKey, key) {
  const offset = SEED_OFFSET[key] || 0;
  const idx =
    ((hashString(sceneKey) >>> 0) + ((seed + offset) >>> 0)) % pool.length;
  return pool[idx];
}

function fill(template, dict) {
  let out = template;
  for (const key of Object.keys(dict)) {
    const val = dict[key];
    out = out.split(`{${key}}`).join(val == null ? "" : String(val));
  }
  return out;
}

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

// ---------- 段落构建 ----------

function buildOpening(mood, rng) {
  return pick(OPENINGS[mood] || OPENINGS.tired, rng);
}

/**
 * 选故事：优先从与场景 type 匹配的子集中选，无匹配则退回全池。
 * 无论走哪条分支，都用 pickByScene 保证「换地点换故事」。
 */
function buildStory(mood, scene, seed) {
  const pool = STORIES[mood] || STORIES.tired;
  const sceneType = scene && scene.type;
  const preferred = pool.filter(
    (s) => Array.isArray(s.sceneTypes) && s.sceneTypes.includes(sceneType)
  );
  const candidates = preferred.length ? preferred : pool;
  return pickByScene(candidates, seed, scene.id, "story").text;
}

function buildReflection(mood, scene, seed) {
  const pool = REFLECTIONS[mood] || REFLECTIONS.tired;
  return pickByScene(pool, seed, scene.id, "reflection");
}

function buildBody(scene, mood, seed) {
  const pool = SCENE_BODIES[scene.type];
  const template =
    pool && pool.length
      ? pickByScene(pool, seed, scene.id, "body")
      : DEFAULT_SCENE_BODY;
  let body = fill(template, { place: scene.name });

  const extraMoodKey = pickExtraMood(scene, mood);
  if (extraMoodKey) {
    const extraSentence = fill(
      pickByScene(EXTRA_MOOD_SENTENCES, seed, scene.id, "extraMood"),
      {
        place: scene.name,
        currentMood: MOOD_LABELS[mood] || "",
        extraMood: MOOD_LABELS[extraMoodKey]
      }
    );
    body = `${body}${extraSentence}`;
  }
  return body;
}

function buildClosing(mood, rngEncourage, rngQuote) {
  const config = CLOSINGS[mood] || CLOSINGS.tired;
  const encourage = pick(config.encourage, rngEncourage);
  const quote = pick(config.quotes, rngQuote);
  return `${encourage}\n——「${quote.text}」· ${quote.from}`;
}

// ---------- 对外接口 ----------

/**
 * 根据用户选择和匹配到的场景，生成一张完整的校园回信卡内容
 *
 * 同心情下换一个地点（matchedScene 不同），故事、呼应、场景描写必然变化。
 *
 * @param {Object} params
 * @param {Object} params.userSelection - 同 matchScenes 入参；可选扩展字段 seed(number)
 * @param {Scene}  params.matchedScene   - 取 matchScenes 返回数组的第一条
 * @returns {Letter}
 */
function generateLetter({ userSelection, matchedScene }) {
  if (!matchedScene) {
    throw new Error("matchedScene 为空，请使用 generateLetterSafe");
  }

  const rawMood = userSelection && userSelection.mood;
  const mood = MOOD_LABELS[rawMood] ? rawMood : "tired";

  const seed =
    userSelection && Number.isFinite(userSelection.seed)
      ? userSelection.seed >>> 0
      : getTimeSeed();

  // 首尾：只随心情（时间种子）
  const opening = buildOpening(mood, makeRng(seed, "opening"));
  const closing = buildClosing(
    mood,
    makeRng(seed, "closing"),
    makeRng(seed, "quote")
  );
  const ending = pick(ENDINGS, makeRng(seed, "ending"));

  // 主体：随「心情 + 场景」——换地点必变
  const story = buildStory(mood, matchedScene, seed);
  const reflection = buildReflection(mood, matchedScene, seed);
  const body = buildBody(matchedScene, mood, seed);

  const content = [opening, story, reflection, body, closing]
    .filter(Boolean)
    .join("\n\n");

  return {
    content,
    place: matchedScene.name,
    reason: matchedScene.reason,
    smallAction: matchedScene.smallAction,
    ending
  };
}

function generateLetterSafe({ userSelection, matchedScene }) {
  if (!matchedScene) {
    return {
      content:
        "看来暂时没有找到完全合适的地方，也许你可以先去操场走一圈。\n\n" +
        "别急，校园里总有一个角落在等你，只是还没遇上。\n\n" +
        "慢慢来，一切都还来得及。",
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