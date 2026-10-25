/**
 * 校园场景数据（华中师范大学 · 桂子山校区 + 南湖校区真实地点）
 *
 * 【数据说明】
 * - 本文件中的地点均为华中师范大学真实存在的地点，
 *   地点名称与位置依据学校官方公众号「华师地标」系列、华大在线
 *   《南湖校区：亦校亦家》等公开资料与地图地点信息核对后整理。
 * - dataSource 字段按实际情况填写：
 *   "已核实" = 地点真实存在且由 C 模块实地到访确认；
 *   "演示数据" = 地点据公开资料核对真实存在，但尚未实地到访，
 *   实地走访确认后请改为"已核实"。不虚报数据来源。
 * - 如后续改为虚构地点，请同步把 dataSource 改回 "演示数据"，不要伪装。
 *
 * 【字段填写规范（写入新场景前请先看这里）】
 * - tags：只能从 tired / irritated / down / lonely / confused / peaceful 中选
 * - timeRange：只能从 5 / 15 / 30 中选，可多选，例如 [5, 15]
 * - socialTags：只能从 alone / small / crowded 中选
 * - type：请从下面这张表里取，D 模块会用 type 与用户偏好（preferences）做匹配，
 *   不要自己造新类型：
 *     图书馆   → 对应偏好 quiet
 *     咖啡馆   → 对应偏好 quiet / warm
 *     自然     → 对应偏好 nature
 *     道路     → 对应偏好 walkable
 *     操场     → 对应偏好 walkable
 *     广场     → 对应偏好 walkable
 *     食堂     → 对应偏好 food / warm
 *     生活     → 对应偏好 warm
 *     历史建筑 → 对应偏好 quiet
 */

/**
 * 单个场景的数据结构定义
 * @typedef {Object} Scene
 * @property {string} id              - 唯一 ID，全局不重复，例如 "scene-001"
 * @property {string} name            - 地点名称
 * @property {string} type            - 地点类型（取值见上方 type 对照表）
 * @property {string} description     - 地点描述（50~100 字，用于用户了解地点）
 * @property {string} reason          - 推荐理由（为什么适合当前心情）
 * @property {string[]} tags          - 心情标签：tired / irritated / down / lonely / confused / peaceful
 * @property {number[]} timeRange     - 适合的可用时长（分钟）：5 / 15 / 30
 * @property {string[]} socialTags    - 社交舒适度：alone（独处）/ small（少量人群）/ crowded（热闹）
 * @property {string} smallAction     - 可立即执行的小行动建议（一句话）
 * @property {string} imagePath       - 图片路径（暂时留空，后续替换为真实图片）
 * @property {string} dataSource      - 数据来源说明（"已核实" 或 "演示数据"）
 */

const SCENES = [
  {
    id: "scene-001",
    name: "老网球场",
    type: "操场",
    description:
      "老网球场可以随时去打球，场地边还住着一只橘猫，旁边有它自己的小窝。打完球歇下来的时候，猫常在不远处晒太阳。",
    reason: "烦躁的时候来挥拍打几个球，把情绪打出去；打累了就坐下看看橘猫，气会消得特别快。",
    tags: ["irritated", "peaceful"],
    timeRange: [15, 30],
    socialTags: ["small"],
    smallAction: "去打半小时球，休息时看看橘猫在不在窝里。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-002",
    name: "文学院",
    type: "生活",
    description:
      "文学院的楼装修得很漂亮，公共区域对外开放，可以安静自习。在一个漂亮的空间里坐下来看书做事，本身就让人舒服。",
    reason: "心情低落或累到不想动的时候，去一个漂亮的地方坐着就好。看窗外的景色发会儿呆，不用说话也不用做事，情绪自己会缓过来。",
    tags: ["tired", "down"],
    timeRange: [15, 30],
    socialTags: ["alone"],
    smallAction: "挑一个窗边的座位坐下，看窗外的景色发发呆。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-003",
    name: "露天电影场",
    type: "广场",
    description:
      "露天电影场从上世纪五十年代一直用到现在，迎新晚会就在这里举办，晚上灯光亮起时氛围感十足。石阶看台视野开阔，看演出和电影的效果都很好。",
    reason: "一个人待着容易越想越多，来这里坐在人群里看一场演出或电影，孤独会被热闹悄悄稀释。",
    tags: ["lonely", "peaceful"],
    timeRange: [15, 30],
    socialTags: ["crowded", "small"],
    smallAction: "找看台中间的位置坐下，认认真真看完一整场电影。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-004",
    name: "佑铭体育场",
    type: "操场",
    description:
      "佑铭是华师最大的体育场，红色跑道围着草坪。晚上总有一圈接一圈夜跑的人，到了秋天，天高云淡，整个场子漂亮得很。",
    reason: "烦躁的时候脑子停不下来，那就用身体把它耗掉：跟着夜跑的人流跑两圈，情绪会跟着汗一起退下去。",
    tags: ["irritated", "tired"],
    timeRange: [15, 30],
    socialTags: ["small", "crowded"],
    smallAction: "戴上耳机听首歌，跟着节奏沿跑道慢跑一圈。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-005",
    name: "恽代英广场",
    type: "广场",
    description:
      "恽代英广场是学校的标志性地点之一，广场上立着恽代英的雕像，看到它总会生出一种敬畏感。广场不大，石阶干净，平时人不多。",
    reason: "迷茫的时候站到一个有年代感的地方，看看先辈的雕像，会觉得眼前的困惑放在更长的时间里，其实没那么可怕。",
    tags: ["confused", "peaceful"],
    timeRange: [5, 15],
    socialTags: ["alone"],
    smallAction: "在广场边站五分钟，看看来往的人都在忙些什么。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-006",
    name: "沁园春食堂",
    type: "食堂",
    description:
      "沁园春是校园里人比较少的食堂，一楼尤其安静、人少不吵，饭点也不用排长队。可以端着餐盘挑个喜欢的位置，一个人慢慢吃，不用赶也不用拼桌。",
    reason: "低落或孤单的时候，人少的地方没有压力。一个人安静地吃一顿热饭，胃暖了心也会跟着稳下来。",
    tags: ["lonely", "down"],
    timeRange: [5, 15],
    socialTags: ["alone"],
    smallAction: "在一楼挑个靠边的位子，慢慢吃完一整顿饭。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-007",
    name: "桂香园食堂",
    type: "食堂",
    description:
      "桂香园是桂子山上最有烟火气的食堂之一，蓝白色系的装修很漂亮，门口还有一个小花圃。一楼是自助小碗菜区，饭点排队的队伍能拐个弯，热汤和面食一直供应到晚上。",
    reason: "累了一天别糊弄饭。来桂香园吃一顿热乎的，胃暖了，人就缓过来了。",
    tags: ["tired"],
    timeRange: [5, 15],
    socialTags: ["small", "crowded"],
    smallAction: "去一楼自助小碗菜区，拿一个自己没吃过的菜。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-008",
    name: "南湖综合楼水吧",
    type: "咖啡馆",
    description:
      "南湖综合楼的水吧其实是一处公共休息区，一到三楼都有，没有柜台卖东西，桌椅整齐、灯光柔和，气氛很安静，可以坐下来休息，也常有同学在这里沉浸式学习。",
    reason: "静不下心学习的时候，来这个没有干扰、只有书和桌椅的角落坐下，很容易就进入状态。",
    tags: ["tired", "confused"],
    timeRange: [5, 15, 30],
    socialTags: ["alone"],
    smallAction: "给自己定一个小目标，学完就起身休息。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-009",
    name: "文华公书林",
    type: "历史建筑",
    description:
      "文华公书林是华师的老图书馆，门口是「爱我中华」的花圃，内部设计像一座写字楼，明亮规整。社团面试常在这里进行，很多人在这里第一次走进老馆。",
    reason: "焦虑常常来自「来不及」。来看一看这座一百多年的楼，会发现自己其实还有很多时间。",
    tags: ["confused", "peaceful"],
    timeRange: [5, 15],
    socialTags: ["alone", "small"],
    smallAction: "在门口「爱我中华」花圃边站一站，数一数里面种了几种花。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-010",
    name: "南湖食堂",
    type: "食堂",
    description:
      "南湖食堂里有餐台和奶茶档口，二楼还摆着一台公共钢琴，经常有人去弹，尤其是晚上夜宵时段，琴声混着饭菜香气，特别有生活味。",
    reason: "孤独或疲惫时，来这里点一杯奶茶，运气好还能赶上有人弹琴，香气和琴声会把你慢慢接住。",
    tags: ["lonely", "tired"],
    timeRange: [15, 30],
    socialTags: ["small", "crowded"],
    smallAction: "点一杯奶茶，赶上有人弹琴就多坐一会儿。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-011",
    name: "南湖校区篮球场",
    type: "操场",
    description:
      "南湖校区的篮球场几乎每晚都有人打球，运球声和喊声此起彼伏。会打的可以下场组队，不会打的坐在场边看，气氛也很松快。",
    reason: "心情低落到什么都不想干的时候，先让身体动起来。投几个篮、跑动几趟，出了一身汗，坏情绪会跟着散掉。",
    tags: ["down"],
    timeRange: [15, 30],
    socialTags: ["small", "crowded"],
    smallAction: "去场边投十个篮，进几个都算赢。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-012",
    name: "南湖前面的空地",
    type: "自然",
    description:
      "南湖前面有一片空地，木制座椅被藤蔓缠绕着，坐进椅子里一抬眼就是成片的绿。平时在这里散步、吹吹晚风也很舒服，坐在藤椅里发呆更好。",
    reason: "烦躁或心情乱糟糟的时候，来这片绿色里走一走、坐一会儿。晚风一吹，脑子里乱转的念头会跟着散掉。",
    tags: ["irritated", "peaceful", "down"],
    timeRange: [15, 30],
    socialTags: ["alone", "small"],
    smallAction: "坐进藤椅里，抬头数一数能看见几种绿。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-013",
    name: "梅园",
    type: "自然",
    description:
      "梅园的树长得密，石凳散在树荫下，平时人不多。冬天梅花开的时候整片园子都是香的，其他季节也安静，很适合拿本书坐下来慢慢看。",
    reason: "想背书或者一个人歇一会儿的时候，来梅园找张树荫下的石凳坐下。翻几页书、发会儿呆，不用应付任何人，时间会过得慢下来。",
    tags: ["tired", "peaceful"],
    timeRange: [15, 30],
    socialTags: ["alone"],
    smallAction: "找一张树荫下的石凳，把今天要背的内容读出声来。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-014",
    name: "博雅广场",
    type: "广场",
    description:
      "博雅广场采光很好，白天阳光铺满整片草地，广场边的台阶和草坪都能随便坐。天气好的时候，常有同学在草地上聊天、看书、晒太阳，气氛松弛。",
    reason: "累了就来草地上躺着晒晒太阳；心里闷得慌，就约上朋友在草地上聊聊天。光晒在身上，话有人接，情绪会慢慢被烘暖。",
    tags: ["tired", "lonely"],
    timeRange: [15, 30],
    socialTags: ["alone", "small"],
    smallAction: "挑一块有阳光的草地坐下，晒十分钟太阳。",
    imagePath: "",
    dataSource: "已核实"
  },
  {
    id: "scene-015",
    name: "外国语学院门口的林荫空地",
    type: "自然",
    description:
      "外国语学院门口有一片比较偏的林荫空地，树密、人少，平时很安静。往里走几步几乎听不到主路上的声音，是一个可以自己待着、不被注意的角落。",
    reason: "情绪低落、心里堵得慌的时候，来这片偏僻安静的林荫空地走一走。没人经过，不用忍着，想哭想骂都可以，发泄完会轻松一点。",
    tags: ["down"],
    timeRange: [15, 30],
    socialTags: ["alone"],
    smallAction: "沿着林荫道走到最里面，找个没人的角落坐十分钟。",
    imagePath: "",
    dataSource: "已核实"
  }
];

// 导出数据，其他模块通过 import { SCENES } from './scenes.js' 使用
export { SCENES };
