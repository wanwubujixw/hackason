# 架构设计与模块接口规范

> **本文件是全体协作的"契约"**。所有模块的函数签名、数据结构都在这里定义。
> 任何成员修改这里的接口，必须先通知全体队友，并同步更新本文件。
>
> 五人协作时，如果不知道该怎么调用某个模块，先看这里。

---

## 一、整体架构

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   用户界面   │ ──▶ │   匹配服务    │ ──▶ │   回信生成服务   │
│ (B 模块)    │     │ (D 模块)     │     │   (D 模块)      │
└─────────────┘     └──────┬───────┘     └────────┬───────────┘
                            │                      │
                     ┌──────▼───────┐        ┌─────▼──────────┐
                     │  场景数据     │        │  本地存储工具   │
                     │ (C 模块)     │        │  (E 模块)       │
                     └──────────────┘        └────────────────┘
```

**数据流向**：
1. 用户在界面上选择心情 / 时间 / 偏好 → 界面模块把选择传给匹配服务
2. 匹配服务从场景数据中筛选 → 返回匹配到的场景数组
3. 回信服务根据用户选择 + 匹配到的场景 → 生成回信卡
4. 界面展示回信卡，用户可以收藏或反馈 → 本地存储写入 localStorage

---

## 二、模块清单与职责边界

| 模块 | 负责人 | 负责文件 | 提供什么 | 依赖什么 |
|---|---|---|---|---|
| 数据层 | C | src/data/scenes.js、src/data/moods.js | SCENES 数组、MOODS 数组 | 无 |
| 匹配服务 | D | src/services/matcher.js | matchScenes()、getFallbackScenes() | C 模块的 SCENES |
| 回信服务 | D | src/services/letterGenerator.js | generateLetter()、generateLetterSafe() | C 模块的 SCENES |
| 存储工具 | E | src/utils/storage.js | getFavorites()、addFavorite() 等 | 无 |
| 界面层 | B | index.html、src/pages/*.js、src/styles/global.css | 完整的用户界面 | D 模块的两个服务、E 模块的存储工具 |
| 项目负责人 | 用户（A） | README、docs/*、Git 管理、最终整合 | 完整的项目入口、Git 协作规范 | 所有模块 |

---

## 三、核心数据结构

### 3.1 Scene（校园场景）

```js
/** @typedef {Object} Scene */
{
  id: "scene-001",              // string, 全局唯一 ID
  name: "图书馆三楼窗边阅读区", // string, 地点名称
  type: "图书馆",               // string, 地点类型（分类用）
  description: "安静的角落...",  // string, 50~100 字地点描述
  reason: "当你疲惫时...",      // string, 推荐理由
  tags: ["tired", "peaceful"],  // string[], 心情标签数组
  timeRange: [15, 30],          // number[], 适合的可用时长（分钟）
  socialTags: ["alone"],        // string[], 社交舒适度标签
  smallAction: "找一本书...",    // string, 可执行的小行动
  imagePath: "",                // string, 图片路径（暂时为空）
  dataSource: "演示数据"        // string, 必须注明数据来源
}
```

### 3.2 Mood（心情选项）

```js
/** @typedef {Object} Mood */
{
  key: "tired",            // string, 程序用标识（英文）
  label: "疲惫",           // string, 中文展示名
  emoji: "😴",             // string, 表情装饰
  description: "想休息"    // string, 帮助用户理解
}
```

### 3.3 Letter（回信卡）

```js
/** @typedef {Object} Letter */
{
  content: "今天辛苦了...",  // string, 100~150 字安慰文案
  place: "图书馆三楼",       // string, 推荐地点（直接用 Scene.name）
  reason: "安静能让你...",   // string, 选择理由（直接用 Scene.reason）
  smallAction: "走一圈",     // string, 小行动（直接用 Scene.smallAction）
  ending: "慢慢来..."        // string, 温柔结束语
}
```

### 3.4 UserSelection（用户选择）

```js
/** @typedef {Object} UserSelection */
{
  mood: "tired",                      // string, 对应 Mood.key
  availableMinutes: 15,               // number, 可选值：5 / 15 / 30
  preferences: ["quiet", "nature"],   // string[], 可选值：quiet / nature / walkable / warm / food
  socialComfort: "alone"              // string, 可选值：alone / small / crowded
}
```

### 3.5 可选值对照表（全体成员共享，不要改）

| 字段 | 可选值 | 含义 |
|---|---|---|
| mood | tired / irritated / down / lonely / confused / peaceful | 疲惫 / 烦躁 / 低落 / 孤独 / 迷茫 / 平静 |
| availableMinutes | 5 / 15 / 30 | 5 分钟 / 15 分钟 / 30 分钟 |
| preferences | quiet / nature / walkable / warm / food | 安静 / 自然 / 适合散步 / 有生活气息 / 有食物 |
| socialComfort | alone / small / crowded | 希望独处 / 可以接触少量人群 / 希望热闹 |

---

## 四、核心函数签名（公共接口）

### 4.1 matchScenes() —— 场景匹配

```js
import { matchScenes } from "./services/matcher.js";

/**
 * @param {UserSelection} userSelection
 * @returns {Scene[]} 匹配到的场景数组（按匹配度从高到低排序）
 *                   空数组 [] 表示没有匹配到任何场景
 */
const results = matchScenes(userSelection);
```

**无匹配时的处理**：调用方（B 模块的界面）在收到空数组后，应该提示"没有找到完全合适的地点，为你推荐以下默认选项"，然后调用 `getFallbackScenes()` 展示兜底场景。

### 4.2 generateLetter() —— 回信生成

```js
import { generateLetterSafe } from "./services/letterGenerator.js";

/**
 * @param {Object} params
 * @param {UserSelection} params.userSelection
 * @param {Scene} params.matchedScene    - 取 matchScenes 返回数组的第一条
 * @returns {Letter}
 */
const letter = generateLetterSafe({
  userSelection: userSelection,
  matchedScene: results[0]   // 如果 results 为空，传 null 进去，generateLetterSafe 会兜底
});
```

**建议**：B 模块直接调用 `generateLetterSafe` 而不是 `generateLetter`，因为 Safe 版本会自动处理异常和空输入。

### 4.3 本地存储函数（E 模块提供）

```js
import { getFavorites, addFavorite, removeFavorite, isFavorite, submitFeedback } from "./utils/storage.js";

// 读取收藏列表（数组）
const favs = getFavorites();

// 收藏一条
addFavorite({ sceneId: "scene-001", letterContent: "......" });

// 取消收藏
removeFavorite("scene-001");

// 检查是否已收藏
isFavorite("scene-001"); // true / false

// 提交反馈
submitFeedback("scene-001", "good"); // "good" 或 "bad"
```

---

## 五、模块间依赖关系图

```
B (界面层)
 ├──▶ D.services.matcher.js   ──▶ C.data.scenes.js
 ├──▶ D.services.letterGenerator.js ──▶ C.data.scenes.js
 └──▶ E.utils.storage.js

D (匹配 + 回信)
 └──▶ C.data.scenes.js

C (数据层)     无依赖，最先完成
E (存储工具)   无依赖，最先完成
```

**协作顺序**：C 和 E 可以最先开始写（无依赖）→ D 等 C 写完后写 → B 等 D 和 E 都能跑后写界面。
