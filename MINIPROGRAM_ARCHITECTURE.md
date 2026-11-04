# 解忧慢递邮局 · 微信小程序协作接口协议（v2）

> **本文件是小程序版本的协作"契约"**，适用于 `miniprogram/` 目录下的微信小程序。
> 原网页项目（仓库根目录 `src/`、`index.html` 等）不在本协议范围内，**保持不变**。
> 网页版的旧协议见 `docs/ARCHITECTURE.md`，两份文档并存、互不替代。
>
> 本文所有接口描述均来自对小程序实际代码的逐一核对（2026-10-29，基于 commit 950e531）。
> 如本文与代码不一致，**以实际运行的小程序代码为准**，并通知负责人 A 修订本文。
> 无法确认的地方标注"待确认"，请勿自行编造。
>
> v2 修订：修正过度绝对化表述、修正一处无法通过界面触发的兜底测试示例、
> 新增队员通用 AI 编码提示词、测试流程按"队员可独立完成 / 需开发者工具或 A 协助 /
> A 整体验收"三级拆分、完善交付与整合流程。

---

## 一、项目目录结构与关键文件用途

```
hackason/                         ← 仓库根目录（网页项目，保持原样，不要动）
├── miniprogram/                  ← 【小程序全部代码都在这里面】
│   ├── app.js                    ← 小程序入口：仅 App({})，无全局数据、无登录、无云开发
│   ├── app.json                  ← 全局配置：只注册了 pages/index/index 一个页面
│   ├── app.wxss                  ← 全局样式（邮局主题，导航/背景色 #FAF8F2）
│   ├── project.config.json       ← 微信开发者工具项目配置（含 appid，不要改）
│   ├── sitemap.json              ← 收录规则（默认 allow *，不要改）
│   │
│   ├── data/                     ← 数据层（C 负责）
│   │   ├── moods.js              ← 6 种心情选项 MOODS
│   │   └── scenes.js             ← 15 条华师场景数据 SCENES（scene-001 ~ scene-015）
│   │
│   ├── services/                 ← 业务逻辑层（D 负责）
│   │   ├── matcher.js            ← 场景匹配：matchScenes / getFallbackScenes
│   │   └── letterGenerator.js    ← 回信生成：generateLetter / generateLetterSafe
│   │
│   ├── utils/                    ← 工具层
│   │   ├── storage.js            ← 收藏/反馈的本地存储（E 负责）
│   │   └── util.js               ← formatTime 时间格式化（仅 logs 残留页用，主流程未用）
│   │
│   └── pages/
│       ├── index/                ← 【唯一注册页面】单页五视图，全部交互都在这里（B 负责）
│       │   ├── index.js          ← 页面逻辑：data 状态 + 21 个页面方法
│       │   ├── index.wxml        ← 五个视图的模板（wx:if 切换）
│       │   ├── index.wxss        ← 页面样式
│       │   └── index.json        ← 页面配置（标题"解忧慢递邮局"）
│       └── logs/                 ← ⚠️ 开发者工具模板残留页，未在 app.json 注册，
│                                   不参与任何功能。任何人不要改它，是否清理由 A 决定（待确认）
```

**关键认知：小程序是"单页五视图"结构。** 整个小程序只有一个页面 `pages/index/index`，
通过 `data.view` 的值（`home` / `prefs` / `result` / `letter` / `favorites`）切换显示哪个视图，
不是五个页面。新增视图不需要注册新页面，但新增页面必须改 `app.json`（属于 A 的权限）。

---

## 二、功能现状：已实现 vs 待完善

### ✅ 已实现（代码中真实存在，已核对）

- 完整主流程：选心情 → 选时长/偏好/社交 → 场景匹配 → 推荐列表 → 回信卡 → 收藏/反馈
- 6 种心情（疲惫/烦躁/低落/孤独/迷茫/平静）、3 档时长（5/15/30 分钟）、
  5 个场景偏好（可多选）、3 档社交舒适度（单选）
- 表单校验：漏选心情/时长/社交时，通过 `hint` 字段提示，不会生成结果
- 匹配算法：心情 +3 / 时长 +2 / 社交 +2 / 偏好每项 +1，按总分排序取前 3，0 分不展示
- 无匹配兜底代码：`matchScenes` 返回空时界面改用兜底场景（scene-012 南湖前面的空地、
  scene-002 文学院），并显示提示"没有找到完全合适的地点，为你推荐以下默认选项。"
  ——注意：当前 15 条数据已覆盖全部 6 种心情，**正常操作流程下不会触发空结果**，
  兜底属于防御性代码（详见第九节测试说明）
- 回信卡：6 套心情文案模板（替换 `{place}` 占位符）+ 4 句随机结束语；
  `generateLetterSafe` 对空场景和异常有兜底
- 收藏：按 sceneId 去重、可取消、新收藏排在最前、收藏列表视图可查看和取消
- 反馈：👍/👎 二选一；**同一次回信卡展示内只能提交一次**，提交后按钮置灰。
  如实说明：重新进入回信卡后反馈状态会重置，可再次提交；存储层不去重，
  同一场景可能有多条反馈记录。这是当前代码的真实行为，不是 bug
- 本地存储：收藏与反馈写入微信本地存储（键名 `jyo_favorites` / `jyo_feedbacks`）
- 操作反馈：收藏/取消/反馈成功或失败时 `wx.showToast` 弹提示
- 页脚与反馈区均明确告知"只保存在本机微信中，换设备或清除缓存会丢失"

### 🚧 待完善（代码中确认缺失或未做）

- **场景图片已预留接入位**：`imagePath` 由 `CLOUD_IMAGE_BASE` 生成，当前前缀为空（卡片不显示图）；把 15 张图上传云存储并填写前缀后即可显示
- **真机验证情况：待确认**（已知能在微信开发者工具中运行；真机预览、
  不同屏幕尺寸适配未找到验证记录）
- `pages/logs/` 与 `utils/util.js` 是模板残留，未接入主流程
  （是否删除待 A 确认，任何人暂不要动）

### 🚫 明确不做（本阶段）

- 微信登录、用户系统、网络请求、大模型 API、付费服务、定位 API；云开发仅用于图片存储（可选，不涉及登录与数据库）
- 多用户数据汇总（反馈只存本机，界面上已如实告知用户）

---

## 三、真实数据结构与字段说明

### 3.1 Scene（校园场景，`data/scenes.js` 导出 `SCENES`，当前 15 条）

```js
{
  id: "scene-001",              // string，全局唯一，格式 scene-三位数字，001~015 连续
  name: "老网球场",              // string，地点名称
  type: "操场",                 // string，地点类型，取值见下方对照表，禁止自造
  description: "……",            // string，50~100 字地点描述
  reason: "……",                 // string，推荐理由（为什么适合当前心情）
  tags: ["irritated", "peaceful"], // string[]，心情标签，只能取 6 种 mood key
  timeRange: [15, 30],          // number[]，适合时长，只能取 5 / 15 / 30，可多选
  socialTags: ["small"],        // string[]，只能取 alone / small / crowded
  smallAction: "……",            // string，一句话小行动建议
  imagePath: "",                // string，云存储 fileID；由 CLOUD_IMAGE_BASE 生成，留空则不显示
  dataSource: "已核实"          // string，只能填 "已核实" 或 "演示数据"，按实际情况填写，不许伪装
}
```

**type 与偏好（preferences）的固定映射**（`matcher.js` 中的 `TYPE_TO_PREFERENCES`，改场景 type 必须遵守）：

| type | 对应偏好 |
|---|---|
| 图书馆 | quiet |
| 咖啡馆 | quiet / warm |
| 自然 | nature |
| 道路 | walkable |
| 操场 | walkable |
| 广场 | walkable |
| 食堂 | food / warm |
| 生活 | warm |
| 历史建筑 | quiet |

### 3.2 Mood（心情选项，`data/moods.js` 导出 `MOODS`，当前 6 条）

```js
{
  key: "tired",          // string，英文标识，程序判断用
  label: "疲惫",          // string，中文展示名
  emoji: "😴",            // string，表情
  description: "……"      // string，一句话说明
}
```

当前 6 个 key：`tired` / `irritated` / `down` / `lonely` / `confused` / `peaceful`。
**新增心情必须同步更新：`letterGenerator.js` 的文案模板、`scenes.js` 的 tags 取值范围——属于跨模块改动，必须先经 A 确认。**

### 3.3 UserSelection（用户选择，`index.js` 的 `getSelection()` 产出）

```js
{
  mood: "tired",                    // string，对应 Mood.key；未选时为 ""
  availableMinutes: 15,             // number，5 / 15 / 30；未选时为 0
  preferences: ["quiet", "nature"], // string[]，可多选、可为空数组
  socialComfort: "alone"            // string，alone / small / crowded；未选时为 ""
}
```

### 3.4 Letter（回信卡，`generateLetter` / `generateLetterSafe` 的返回值）

```js
{
  content: "……",       // string，安慰文案正文（模板已替换场景名）
  place: "南湖综合楼水吧", // string，= Scene.name
  reason: "……",        // string，= Scene.reason
  smallAction: "……",   // string，= Scene.smallAction
  ending: "慢慢来，一切都还来得及。💌" // string，4 句结束语中随机一句
}
```

### 3.5 收藏记录（存入 `jyo_favorites`）

```js
{
  sceneId: "scene-001",                  // string，由 addFavorite 入参传入
  letterContent: "……",                  // string，回信正文
  place: "老网球场",                      // string，地点名
  mood: "tired",                         // string，收藏时的心情 key
  savedAt: "2026-10-29T08:00:00.000Z"    // string，ISO 时间，addFavorite 自动生成，不用传
}
```

### 3.6 反馈记录（存入 `jyo_feedbacks`）

```js
{
  sceneId: "scene-001",
  feedback: "good",                      // 只能 "good" 或 "bad"，其他值会被 submitFeedback 拒绝
  submittedAt: "2026-10-29T08:00:00.000Z"
}
// 注意：存储层不去重，同一场景可有多条反馈记录
```

---

## 四、公共函数：参数、返回值与调用示例（全部以实际代码为准）

⚠️ 本项目小程序代码统一使用 **CommonJS**（`require` / `module.exports`）。
新增或修改模块时保持现有模块系统，不要擅自切换成 `import` / `export`。
路径用相对路径：从 `pages/index/` 出发是 `../../`，从 `services/` 出发是 `../`。

### 4.1 匹配服务（`services/matcher.js`，D 负责）

```js
const { matchScenes, getFallbackScenes } = require("../../services/matcher.js");
```

| 函数 | 参数 | 返回值 |
|---|---|---|
| `matchScenes(userSelection)` | UserSelection 对象（可容错：缺字段按未选处理） | Scene 数组，0~3 条，按得分从高到低；全 0 分时返回 `[]` |
| `getFallbackScenes()` | 无 | Scene 数组，固定 2 条兜底场景；极端情况下退化为 SCENES 前 2 条 |

实际调用示例（摘自 `index.js` 的 `onGenerate`）：

```js
let scenes = matchScenes(this.getSelection());
if (!Array.isArray(scenes)) { scenes = []; }
let notice = "";
if (scenes.length === 0) {
  scenes = getFallbackScenes();
  notice = "没有找到完全合适的地点，为你推荐以下默认选项。";
}
this.setData({ hint: "", notice: notice, scenes: scenes });
```

打分规则（改规则 = 改公共行为，必须经 A 确认）：
`tags` 含 mood +3；`timeRange` 含 availableMinutes +2；`socialTags` 含 socialComfort +2；
type 映射的偏好每命中一项 +1。过滤 0 分 → 降序 → 取前 3。同分时按 SCENES 数据中的先后顺序。

### 4.2 回信服务（`services/letterGenerator.js`，D 负责）

```js
const { generateLetterSafe } = require("../../services/letterGenerator.js");
```

| 函数 | 参数 | 返回值 |
|---|---|---|
| `generateLetter({ userSelection, matchedScene })` | matchedScene 为单个 Scene 对象 | Letter 对象 |
| `generateLetterSafe({ userSelection, matchedScene })` | matchedScene **可以传 null** | Letter 对象（空场景时返回"操场"兜底文案；运行异常时返回容错文案） |

**界面层只调用 `generateLetterSafe`**（当前 `index.js` 就是这样做的），不要直接调 `generateLetter`。

实际调用示例（摘自 `index.js` 的 `onSceneTap`）：

```js
const letter = generateLetterSafe({
  userSelection: this.getSelection(),
  matchedScene: scene
});
this.setData({ letter: letter, currentSceneId: scene.id, ... });
```

### 4.3 本地存储（`utils/storage.js`，E 负责）

```js
const {
  getFavorites, addFavorite, removeFavorite, isFavorite, submitFeedback
} = require("../../utils/storage.js");
```

| 函数 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `getFavorites()` | 无 | 收藏数组（出错或无数据时返回 `[]`） | 读取全部收藏 |
| `addFavorite(item)` | `{ sceneId, letterContent, place, mood }` | boolean | 自动补 `savedAt`；按 sceneId 去重，已收藏返回 `true`；缺 sceneId 返回 `false` |
| `removeFavorite(sceneId)` | string | boolean | 按 sceneId 取消收藏 |
| `isFavorite(sceneId)` | string | boolean | 是否已收藏 |
| `submitFeedback(sceneId, feedback)` | string, `"good"`/`"bad"` | boolean | feedback 非法或缺 sceneId 返回 `false`；**存储层不去重**，"只提交一次"由界面层控制 |
| `clearAll()` | 无 | 无 | 清空收藏和反馈（调试/重置演示用） |

存储键名固定：`jyo_favorites`、`jyo_feedbacks`（与网页版一致，便于跨端对照排查，**不得改名**）。

### 4.4 数据模块（C 负责，只导出数据，无函数）

```js
const { MOODS } = require("../../data/moods.js");    // 6 条心情
const { SCENES } = require("../data/scenes.js");     // 15 条场景
```

### 4.5 页面层自有的工具函数（`index.js` 内部，不导出）

`formatSavedAt(isoString)`、`markSelected(options, isSelected)` 仅供页面内部使用，
其他模块不要依赖它们。

---

## 五、模块依赖关系与调用顺序

### 5.1 依赖关系（以实际 require 语句为准）

```
pages/index/index.js（B，唯一页面）
 ├── require ../../data/moods.js          （C）
 ├── require ../../services/matcher.js    （D）
 │      └── require ../data/scenes.js     （C）
 ├── require ../../services/letterGenerator.js（D）
 │      └── 【不 require 任何数据文件】仅通过参数接收 matchedScene
 └── require ../../utils/storage.js       （E，无依赖）

data/moods.js、data/scenes.js（C）── 无任何依赖
utils/storage.js（E）── 无依赖，只调 wx 存储 API
utils/util.js ── 仅被未注册的 logs 残留页引用，主流程不使用
```

⚠️ **与旧协议差异**：旧 `docs/ARCHITECTURE.md` 的依赖图标注"回信服务依赖 C 的 SCENES"，
但小程序版 `letterGenerator.js` 实际**没有** require scenes.js——它只接收调用方传入的
`matchedScene` 参数。以代码为准。

### 5.2 运行时调用顺序（一次完整使用流程）

```
用户点心情     onMoodTap        → setData({mood})，切到 prefs 视图
用户选时长等   onTimeTap / onPreferenceTap / onSocialTap → 更新 data 并同步选中态
用户点生成     onGenerate       → 校验三项 → matchScenes(getSelection())
                                 → 空数组则 getFallbackScenes() 兜底 → 切到 result 视图
用户点场景卡   onSceneTap       → generateLetterSafe({userSelection, matchedScene})
                                 → isFavorite(scene.id) 初始化收藏状态 → 切到 letter 视图
用户点收藏     onToggleFavorite → isFavorite ? removeFavorite : addFavorite → wx.showToast
用户点反馈     onFeedbackTap    → submitFeedback(sceneId, kind) → 按钮置灰
用户进收藏页   onOpenFavorites  → getFavorites() → 格式化后渲染 favorites 视图
```

---

## 六、五人协作的文件修改边界

| 成员 | 允许修改的文件（仅限 miniprogram/ 内） | 不许碰的 |
|---|---|---|
| **A（负责人）** | 根目录文档、`docs/`、本文件、`app.json`、`project.config.json`、`sitemap.json`；负责接收完整文件、整合、运行验证和 Git 提交 | 不代改他人模块的实现细节 |
| **B（界面）** | `pages/index/index.js`、`index.wxml`、`index.wxss`、`index.json`、`app.wxss` | data/、services/、utils/storage.js 的内部实现 |
| **C（数据）** | `data/scenes.js`、`data/moods.js` | 其他一切文件 |
| **D（逻辑）** | `services/matcher.js`、`services/letterGenerator.js` | 其他一切文件 |
| **E（存储/测试）** | `utils/storage.js`、测试用例与测试记录（交给 A 归置） | 其他一切文件 |

**各角色的具体约束：**

- **A**：唯一执行 Git 操作的人。收到队员交付的完整文件后，先备份现有版本，再替换、验证、提交。
- **B**：只能**调用**第四节已经约定的业务接口（matchScenes / generateLetterSafe / storage 的导出函数），
  不得擅自更改 D、E 的函数名、参数或返回值；发现接口不够用时，向 A 提出申请。
- **C**：不得擅自更改字段名称、标签体系（6 个 mood key、type 对照表、各字段取值范围）或公共数据结构；
  新增/修改场景只动数据内容，不动字段结构。
- **D**：不得擅自修改页面（pages/）、存储模块（utils/storage.js）或公共接口；
  优化打分规则、文案模板前必须经 A 确认（属于公共行为变更）。
- **E**：不得擅自修改页面和业务逻辑；storage.js 的函数签名和存储键名不许动，只能改内部实现。

**通用规则：**

1. 队员使用 TRAE 等 AI 工具编码时，**只能修改自己负责的文件**；
   需要跨模块修改时，**先向 A 提出申请，得到确认后再动手**。
2. 仓库根目录的网页项目（`src/`、`index.html`、`tests/` 等）任何人不要动。
3. `pages/logs/`、`utils/util.js` 为模板残留，**任何人不要改、不要删**，处理方式待 A 确认。
4. 文件名、目录结构保持不变；想新建文件先问 A。

---

## 七、微信小程序开发约束（本项目实际使用方式）

1. **模块系统**：本项目所有小程序模块统一使用 CommonJS（`require()` 引入、
   `module.exports = { ... }` 导出）。新增或修改模块时保持现有模块系统，
   不要擅自切换成 `import` / `export`，也不要混用两种写法。
2. **页面写法**：`Page({ data: {...}, 方法名() {...} })`。
   更新界面**只能用 `this.setData({...})`**，直接改 `this.data.xxx` 不会刷新界面。
3. **WXML 绑定**：插值用 `{{变量}}`；列表用 `wx:for` + `wx:key`；条件渲染用 `wx:if`；
   事件用 `bindtap="方法名"`，传参用 `data-xxx="{{值}}"`，
   在方法里通过 `event.currentTarget.dataset.xxx` 读取
   （注意：`data-scene-id` 读取时变成 `dataset.sceneId`，横线转驼峰）。
4. **本项目当前只使用以下 wx API**（新增任何其他 wx API 前需经 A 确认，
   尤其不要引入网络、登录、支付类 API）：
   - `wx.getStorageSync(key)` / `wx.setStorageSync(key, value)` / `wx.removeStorageSync(key)`
     ——注意：key 不存在时 `getStorageSync` 返回**空字符串**，不是 null，需用 `Array.isArray` 兜底
     （`storage.js` 已有此处理，照抄即可）
   - `wx.showToast({ title, icon: "none" })` ——轻提示
   - `wx.pageScrollTo({ scrollTop: 0, duration: 0 })` ——切换视图后回顶部
5. **本地存储即微信本地缓存**：只存本机，清缓存/换设备即丢失，不联服务器。
   涉及用户数据的文案（反馈说明、页脚）必须保持这个如实表述，不要夸大。
6. **`app.json` 高危字段不要动**：`pages` 注册表、`style: "v2"`、
   `componentFramework: "glass-easel"`、`lazyCodeLoading: "requiredComponents"`。
   改错任一字段都可能导致小程序无法启动。确需改动由 A 执行。
7. **`project.config.json` 里的 `appid` 不要改**，否则无法在原项目下预览上传。
8. 开发环境：微信开发者工具打开本项目即可运行；
   不需要 Node.js、npm、任何构建工具，也不要安装任何第三方依赖。

---

## 八、队员通用 AI 编码提示词（复制即用）

队员在 TRAE 等 AI 工具中开始任何修改前，把下面这段完整复制给 AI，
把【】中的内容替换成自己的信息：

```text
你是「解忧慢递邮局」微信小程序项目的协作开发助手。本项目由 5 名零基础队员合作完成，
我是队员【B/C/D/E 之一】，只负责【我负责的文件路径，如 miniprogram/data/scenes.js】。

请严格遵守以下规则：

1. 先阅读仓库根目录的 MINIPROGRAM_ARCHITECTURE.md，再完整阅读我负责的现有文件，
   然后才开始修改。
2. 动手前先列出你计划修改的文件清单。只允许修改我上面列出的负责文件，
   禁止修改任务范围以外的任何文件。
3. 保留现有接口、数据结构和模块调用方式：函数名、参数、返回值、字段名、
   require/module.exports 的写法都不许变。
4. 最小修改：只改完成任务必需的部分，不要重写整个文件，不要重构无关代码，
   不要"顺手优化"。
5. 不使用第三方依赖、付费 API、网络请求或登录功能；不新增 wx API
   （确需新增时停下来先问我）。
6. 修改完成后自行检查：语法是否正确、require 路径是否正确、
   调用的函数签名与 MINIPROGRAM_ARCHITECTURE.md 是否一致。
7. 遇到无法确认的内容，直接问我，不要自行编造或假设。
8. 最后输出报告：修改了哪些文件、每处具体改动、如何自测、自测结果、
   尚未解决的问题。
9. 不执行任何 Git 操作（commit / push / reset 等），不覆盖或删除其他队员的文件。
```

**队员本人同样遵守这 9 条。** AI 给出修改后，队员要核对报告里的文件清单没有越界，
再按第九节自测，最后按第十节交付给 A。

---

## 九、各模块测试与验收（分三级）

**诚实原则：只记录真实执行过的测试。** 没执行的写"未执行"，失败的写"未通过"，
禁止把没跑过的测试写成"通过"。E 汇总测试记录时同样遵守。

### 9.1 第一级：队员可独立完成的测试（只用小程序界面，不需要控制台）

**所有人通用 · 主流程走查**：
打开微信开发者工具 → 编译 → 在模拟器里完整走一遍：
选心情 → 选时长/偏好/社交 → 点「生成我的回信」→ 点一个推荐地点 → 看回信卡 →
点「✉️ 收藏」→ 点「👍 适合我」→ 点顶部「📮 我的收藏」确认收藏在列表里 → 返回。
全程页面不空白、不卡死、按钮都有反应，即通过。

**C（数据）**：
- 逐个选 6 种心情（其他选项任意），每种都能生成推荐结果
  （当前 15 条数据覆盖全部 6 种心情，任一心情选不出推荐即为数据问题）。
- 自查数据规范：tags 只含 6 种 mood key；timeRange 只含 5/15/30；
  socialTags 只含 alone/small/crowded；type 只用对照表 9 种；
  `dataSource` 按实际情况填写，不虚报"已核实"；id 不重复。

**D（匹配/回信）**：以下预期结果按当前代码和数据推导，可作为验收基准；
如运行结果不符，先记录差异并报告 A，不要自行改别人的代码。
- 示例一：选「疲惫 😴」+「15 分钟」+ 偏好勾「安静」+「希望独处」→
  预期第一名是 **scene-008 南湖综合楼水吧**（四项全中，8 分），
  前三名为 scene-008、scene-002 文学院、scene-013 梅园（后两者同分，按数据顺序）。
- 示例二：选「低落 💧」+「15 分钟」+ 偏好勾「自然」+「希望独处」→
  预期前三名为 scene-012 南湖前面的空地、scene-015 外国语学院门口的林荫空地、
  scene-002 文学院。
- 回信卡检查：正文中「」内是所选场景名，没有残留 `{place}` 字样；
  同一心情多点几次生成，正文相同、结尾句可能不同（4 句随机，属正常）。

**E（存储）**：
- 收藏一封信 → 回到首页 → 进「📮 我的收藏」，能看到刚收藏的内容和地点名。
- 对同一场景重复点收藏，收藏列表不出现重复条目。
- 在收藏页点「取消收藏」，条目立即消失。
- 在开发者工具点「编译」重启小程序，之前的收藏仍在；
  点「工具 → 清除缓存」后收藏清空（这是微信本地存储的预期行为，不是 bug）。
- 反馈：👍/👎 点一个后两个按钮都置灰，出现"已收到你的反馈"提示。

**B（界面）**：
- 五个视图切换正常，切换后页面自动回到顶部。
- 漏选校验：不选心情/时长/社交直接点「生成我的回信」，出现对应提示文字且不跳转。
- 收藏按钮文案在「✉️ 收藏 / 💌 已收藏」之间正确切换。
- 改样式后，至少在模拟器 iPhone 尺寸（375 宽）和另一种机型尺寸下各走一遍主流程。

### 9.2 第二级：需要微信开发者工具或由 A 协助完成的测试

- **Console 无红字**：开发者工具 →「调试器」→「Console」面板，
  走一遍主流程，确认没有红色报错。不会看 Console 的队员由 A 协助。
- **存储字段核对（E，A 协助）**：开发者工具 →「调试器」→「Storage」面板，
  应看到 `jyo_favorites`（每条含 sceneId / letterContent / place / mood / savedAt
  五个字段）和 `jyo_feedbacks`（每条含 sceneId / feedback / submittedAt 三个字段）。
- **页面数据核对（可选，A 协助）**：在 Console 输入 `getCurrentPages()[0].data`
  可查看当前页面的选择状态（mood / availableMinutes / preferences / socialComfort）。
- **兜底场景验证**：当前 15 条数据覆盖全部 6 种心情，只要选了心情就必有场景得分 ≥3，
  **正常界面操作无法触发"无匹配兜底"**。要验证兜底代码只能借助控制台直接调函数
  或临时改数据——这属于 A 的操作范围，队员不需要验证此项，
  具体验证方式待确认后由 A 执行并补录结果。
- **真机验证**：微信开发者工具点「预览」生成二维码，手机微信扫码走一遍主流程。
  当前无真机验证记录（待确认），完成后由 A 补录结果。

**队员不要为测试目的临时修改其他模块的文件**（包括在自己文件里加临时打印后忘记删除——
如需临时打印，测试完必须恢复原样再交付）。

### 9.3 第三级：必须由 A 进行的整体验收

- 每次整合队员交付的文件后：编译无错误 → 完整主流程走查 → Console 无红字。
- 涉及公共接口（第十一节清单）的改动：A 逐一核对调用方是否同步更新。
- 真机预览验证与记录补录。
- 确认无误后才执行 Git 提交。

---

## 十、如何向负责人 A 提交修改成果

C、D、E 不需要注册或使用 GitHub，统一由 A 整合提交。

### 10.1 队员交付时必须包含的 5 项内容

1. **修改后的完整文件**（不是片段、不是截图），通过微信/QQ/邮箱发给 A；
2. **文件的准确相对路径**（例如 `miniprogram/data/scenes.js`），文件名保持不变；
3. **修改内容说明**：改了什么、为什么改；
4. **实际执行过的测试及其结果**：按第九节第一级做界面自测，
   如实写明"执行了哪几步、结果如何"；没做的测试不要写；
5. **需要其他模块配合的事项**：例如 C 新增了心情 key，必须说明
   （因为涉及 D 的文案模板和本协议的可选值表），由 A 协调。

### 10.2 A 的整合流程

1. **先备份**：替换前把现有同名文件复制保存一份（或确认 Git 中已有干净版本可回退）；
2. **再替换**：用队员交付的完整文件替换对应路径的文件；
3. **运行验证**：微信开发者工具重新编译，按第 9.3 节做整体验收；
4. **出错时先定位原因**：对照队员的修改说明和报错信息缩小范围，
   只修必要的地方；**不要让 AI 大范围重写项目**；
5. 确认无误后由 A 统一 `git commit` + `git push`，提交信息注明实际作者
   （代上传时在提交信息中标注）。

### 10.3 禁止事项

- 队员不要自行执行任何 Git 操作、不要修改文件名或移动文件、
  不要一次交付多个模块的改动（一次聚焦一个模块）。

---

## 十一、未经负责人 A 确认不得修改的公共接口

以下内容是模块间的"契约"，任何修改都会影响他人代码，**必须先经 A 确认、由 A 通知全体并同步修订本文件**：

1. **全部导出函数的名字、参数、返回值结构**：
   `matchScenes` / `getFallbackScenes` / `generateLetter` / `generateLetterSafe` /
   `getFavorites` / `addFavorite` / `removeFavorite` / `isFavorite` / `submitFeedback` / `clearAll`。
   （函数内部的实现细节可以优化，签名不许动。）
2. **数据结构的字段名**：Scene、Mood、Letter、UserSelection、收藏记录、反馈记录
   的字段名与类型（见第三节）。
3. **可选值集合**：6 个 mood key；时长的 5/15/30；偏好的 quiet/nature/walkable/warm/food；
   社交的 alone/small/crowded；场景 type 与偏好的映射表 `TYPE_TO_PREFERENCES`。
4. **存储键名**：`jyo_favorites`、`jyo_feedbacks`（与网页版保持一致）。
5. **模块系统**：本项目统一 CommonJS（`require`/`module.exports`），不得擅自切换。
6. **`app.json` 的 pages 注册表与窗口配置、`project.config.json` 的 appid**。
7. **单页五视图结构**：`data.view` 的五个取值（home/prefs/result/letter/favorites）
   及切换方法 `switchView`。新增视图属于结构性改动，须 A 同意。

---

## 附：与旧版 `docs/ARCHITECTURE.md`（网页版协议）的差异对照

以实际运行的小程序代码为准，差异如下：

| # | 项目 | 旧协议（网页版） | 小程序现状 |
|---|---|---|---|
| 1 | 模块系统 | ES Module（`import`/`export`） | CommonJS（`require`/`module.exports`） |
| 2 | 文件路径 | `src/data/`、`src/services/`、`src/utils/` | `miniprogram/data/`、`miniprogram/services/`、`miniprogram/utils/` |
| 3 | 本地存储 | 浏览器 `localStorage` | `wx.getStorageSync` 等（键名、数据结构、去重规则一致） |
| 4 | 界面层 | 多文件页面（home.js/result.js/favorites.js），操作 DOM | 单 Page 五视图，`this.setData` 驱动 WXML |
| 5 | 依赖图 | 标注"回信服务依赖 C 的 SCENES" | `letterGenerator.js` 实际不 require 数据文件，仅靠参数接收 matchedScene |
| 6 | `addFavorite` 入参 | 旧示例仅 `{ sceneId, letterContent }` | 实际为 `{ sceneId, letterContent, place, mood }`，`savedAt` 自动生成 |
| 7 | 两端代码一致性 | — | 已用文件比对工具核对 `scenes.js`、`matcher.js`、`letterGenerator.js` 三个文件：除模块导入导出语句及对应注释外，数据内容与逻辑一致。`moods.js`、`storage.js` 两端未做逐行比对（待确认） |

另注：仓库 `README.md` 的"暂不实现"清单中仍列有"微信小程序"，与小程序已存在的事实不符——
README 面向网页版，更新时机由 A 决定，本协议不做改动。

---

> 本协议版本：v2，2026-10-29（基于 commit 950e531 的小程序代码逐一核对）。
> 代码有变动时，由 A 复核本文件是否仍然准确。
