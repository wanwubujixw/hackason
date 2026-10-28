/**
 * 心情选项数据
 *
 * 用户选择的心情会传给匹配函数，用于筛选合适的校园场景。
 * 【D 模块注意】匹配逻辑会用到这里的 mood key，
 *  如果要新增心情选项，记得同步更新 src/services/matcher.js 里的匹配规则。
 */

/**
 * 单个心情选项的结构
 * @typedef {Object} Mood
 * @property {string} key          - 心情标识（英文，用于程序判断）
 * @property {string} label        - 中文展示名（用户界面显示）
 * @property {string} emoji        - 对应表情（可选，用于界面装饰）
 * @property {string} description  - 简短描述（帮助用户理解这个心情选项）
 */

const MOODS = [
  {
    key: "tired",
    label: "疲惫",
    emoji: "😴",
    description: "想找个地方安静休息一下"
  },
  {
    key: "irritated",
    label: "烦躁",
    emoji: "😤",
    description: "想远离人群，找个地方冷静"
  },
  {
    key: "down",
    label: "低落",
    emoji: "💧",
    description: "心情不太好，想获得一点安慰"
  },
  {
    key: "lonely",
    label: "孤独",
    emoji: "🌙",
    description: "想感受校园里的温暖和烟火气"
  },
  {
    key: "confused",
    label: "迷茫",
    emoji: "🌫️",
    description: "想暂时理清思绪，换个角度看看"
  },
  {
    key: "peaceful",
    label: "平静",
    emoji: "🌸",
    description: "想发现校园里的小美好"
  }
];

// 小程序原生环境不支持 ES Module，改为 CommonJS 导出
module.exports = { MOODS };
