/**
 * 校园场景数据（当前为演示数据，非真实校园地点）
 *
 * 【重要】本文件中的所有场景均为演示用虚构内容，
 *  不能在任何正式场合或对外宣传中声称是真实调研结果。
 *  后续由 C 模块（负责场景数据的队友）替换为真实校园地点后，
 *  记得更新本文件顶部的注释说明。
 */

/**
 * 单个场景的数据结构定义
 * @typedef {Object} Scene
 * @property {string} id              - 唯一 ID，全局不重复，例如 "scene-001"
 * @property {string} name            - 地点名称
 * @property {string} type            - 地点类型（图书馆 / 咖啡馆 / 操场 / 湖边 等）
 * @property {string} description     - 地点描述（50~100 字，用于用户了解地点）
 * @property {string} reason          - 推荐理由（为什么适合当前心情）
 * @property {string[]} tags          - 心情标签：tired / down / lonely / confused / peaceful
 * @property {number[]} timeRange     - 适合的可用时长（分钟）：5 / 15 / 30
 * @property {string[]} socialTags    - 社交舒适度：alone（独处）/ small（少量人群）/ crowded（热闹）
 * @property {string} smallAction     - 可立即执行的小行动建议（一句话）
 * @property {string} imagePath       - 图片路径（暂时留空，后续替换为真实图片）
 * @property {string} dataSource      - 数据来源说明（必须注明"演示数据"或"已核实"）
 */

// ============== 演示场景数据（请 C 模块替换为真实校园数据） ==============
const SCENES = [
  {
    id: "scene-001",
    name: "图书馆三楼窗边阅读区",
    type: "图书馆",
    description: "安静的角落，靠窗有自然光，周围只有翻书声，非常适合集中注意力。",
    reason: "当你疲惫或想独处时，这里的安静能让你快速平静下来。",
    tags: ["tired", "peaceful"],
    timeRange: [15, 30],
    socialTags: ["alone"],
    smallAction: "找一本你一直想读但没看的书，翻 5 页。",
    imagePath: "",
    dataSource: "演示数据，非真实调研"
  },
  {
    id: "scene-002",
    name: "校园湖边的长椅",
    type: "自然",
    description: "湖边绿树环绕，偶尔有同学路过但不会打扰你，适合散步或坐一会儿。",
    reason: "感受自然能帮你缓解烦躁和低落的情绪。",
    tags: ["down", "lonely", "peaceful"],
    timeRange: [5, 15, 30],
    socialTags: ["alone", "small"],
    smallAction: "绕湖边走一圈，观察 3 种不同的植物。",
    imagePath: "",
    dataSource: "演示数据，非真实调研"
  },
  {
    id: "scene-003",
    name: "食堂一楼的热饮窗口",
    type: "生活",
    description: "人不多的时候，热饮窗口旁边的小桌子很温馨，有热腾腾的食物香。",
    reason: "孤独或迷茫时，一口热饮能让你感受到校园里的烟火气。",
    tags: ["lonely", "confused"],
    timeRange: [5, 15],
    socialTags: ["small", "crowded"],
    smallAction: "买一杯热奶茶或热豆浆，慢慢喝完。",
    imagePath: "",
    dataSource: "演示数据，非真实调研"
  }
];

// 导出数据，其他模块通过 import { SCENES } from './scenes.js' 使用
export { SCENES };
