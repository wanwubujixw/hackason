# 五人团队分工指南

> 本文件是全体成员的"工作说明书"。每个人的职责、文件范围、交付标准都明确写在这里。
> **如果你不知道自己该做什么，看这里。如果和队友有冲突，也看这里。**

---

## 快速速查表

| 编号 | 角色 | 负责人 | 主要文件 | 最先做什么 |
|---|---|---|---|---|
| A | 项目负责人（用户） | **你** | README、docs/*、Git 管理 | 建仓库、分配任务、把这个文档发给队友 |
| B | 首页 + UI 设计 | 队友 B | index.html、src/pages/*.js、src/styles/global.css | 把心情按钮渲染到首页上 |
| C | 校园场景数据 | 队友 C | src/data/scenes.js、src/data/moods.js | 找真实校园地点，填到 scenes.js 里 |
| D | 匹配规则 + 回信 | 队友 D | src/services/matcher.js、src/services/letterGenerator.js | 读 ARCHITECTURE.md，开始写 matchScenes |
| E | 收藏/反馈 + 测试 | 队友 E | src/utils/storage.js、docs/TESTING.md | 测试 storage.js，然后写测试计划 |

---

## 详细分工

---

### 🅰️ A 角色（项目负责人 = 你）

**你的职责**：
- 创建和维护 GitHub 仓库 `hackason`
- 负责项目骨架（你现在就在做这个）
- 维护 `main` 分支，负责最终整合
- 检查队友的代码、处理冲突、合并 PR
- 最终打包、演示、提交

**你负责的文件**：
- ✅ README.md（已写好初稿，后续更新）
- ✅ docs/ 下所有文档（已写好初稿）
- ✅ .gitignore、LICENSE、CHANGELOG.md（已完成）
- ✅ 全部 src/ 骨架（已完成，留给队友填）
- ❑ 最终整合队友的代码、调试、修复

**你的交付标准**：
- 项目可以克隆、可以双击打开 index.html
- README 里的所有命令和项目实际一致
- 五个人都能按分工开始工作
- 两天结束时，main 分支上有完整可运行的项目
- Git 记录真实、连续、可追溯

**你的第一天做什么**：
1. 创建 GitHub 仓库 `hackason`（网页操作，1 分钟）
2. 把本地代码推上去（按 GIT_WORKFLOW.md 的命令）
3. 邀请另外 4 位队友为仓库 collaborator
4. 把这个 TEAM_DIVISION.md 发给每个人，确认他们看懂自己的任务
5. 把 docs/ARCHITECTURE.md 也发给大家，让所有人统一接口

---

### 🅱️ B 角色（首页 + UI 设计）

**你的职责**：
- 完整的用户界面：首页、心情选择、时间/偏好选择、结果页（回信卡）、收藏列表页
- 按钮、卡片、颜色、字体、响应式布局（手机也能用）
- 让整个界面看起来像"温暖的邮局信纸"

**你负责的文件**：
- `index.html` —— 页面骨架（A 已经写了初稿，你在此基础上填充完整 UI）
- `src/pages/home.js` —— 首页逻辑（A 已经写了 initHomePage 骨架，你填充实现）
- `src/styles/global.css` —— 全局样式主题变量 + 所有页面组件样式（A 已经写了基础变量和通用样式，你继续补充）
- 如果需要更多页面，可以在 `src/pages/` 下新建（比如 `result.js`、`favorites.js`）

**你需要从其他模块拿到**：
- 从 **C 模块** 拿：MOODS 数组、SCENES 数组（用来渲染心情按钮、场景卡片）
- 从 **D 模块** 拿：matchScenes()、generateLetterSafe()（用来调用匹配和回信）
- 从 **E 模块** 拿：getFavorites()、addFavorite() 等（用来渲染收藏列表）

**你的交付标准**：
- ✅ 首页能展示 6 个心情按钮，每个都有 emoji 和中文名
- ✅ 点心情按钮后，能选择可用时长（5/15/30 分钟）
- ✅ 选完偏好后，能调用 matchScenes 拿到推荐结果
- ✅ 能调用 generateLetterSafe 生成回信卡并展示
- ✅ 回信卡有 "收藏" 和 "反馈（适合/不适合）" 按钮
- ✅ 有一个收藏列表入口，能查看已收藏的回信
- ✅ 手机宽度（375px）下界面不溢出、按钮可点

**你的第一天做什么**：
1. 克隆仓库：`git clone <你的 GitHub 仓库地址>`（找 A 要地址）
2. 建自己的分支：`git checkout -b feat/home-ui`
3. 打开 index.html，把 `#mood-list` 区域用真实的心情按钮填上（参考 src/data/moods.js 里的 MOODS）
4. 打开 src/pages/home.js，在 `initHomePage` 里写渲染心情按钮的代码
5. 双击 index.html 看效果，能看到按钮就算今天达标
6. commit 并 push：
   ```bash
   git add .
   git commit -m "feat: render mood selection buttons on home page"
   git push -u origin feat/home-ui
   ```

**如果没做完，谁来接手**：A（项目负责人）可以帮你把 UI 骨架拼上，或者找 C 帮忙写一些简单的 HTML 结构。

---

### 🅲️ C 角色（校园场景数据）

**你的职责**：
- 整理真实校园里的场景（图书馆座位、湖边长椅、食堂热饮窗口……）
- 为每个场景填写完整的数据字段（参考 docs/ARCHITECTURE.md 里的 Scene 结构）
- 确保 tags、timeRange、socialTags 的值都是规定的可选值（看 ARCHITECTURE.md 3.5 节）
- 如果场景是你编的（没实地去看过），dataSource 写"演示数据"；如果真去看过，写"已核实"

**你负责的文件**：
- `src/data/scenes.js` —— 把现在的 3 条演示数据替换成真实校园场景（至少 10 条，覆盖所有心情标签）
- `src/data/moods.js` —— 如果要新增心情选项，修改这里（但要先和大家说）

**你不需要动的文件**：
- ❌ 不要改 src/services/ 下的文件（那是 D 的活）
- ❌ 不要改 src/pages/ 下的文件（那是 B 的活）
- ❌ 不要改 docs/ 下的文件（除非你发现有错误告诉 A）

**你提供给其他模块**：
- 给 **D 模块**：SCENES 数组（他们的匹配逻辑全靠你填的数据）
- 给 **B 模块**：SCENES 数组（他们要渲染场景卡片）

**你的交付标准**：
- ✅ src/data/scenes.js 里至少有 10 条真实（或标注为演示）的校园场景
- ✅ 每条场景都有完整的字段（id、name、type、description、reason、tags、timeRange、socialTags、smallAction、imagePath、dataSource）
- ✅ tags 覆盖全部 6 种心情（tired / irritated / down / lonely / confused / peaceful）
- ✅ timeRange 覆盖 5 / 15 / 30 三个时长范围
- ✅ 没有编造真实地点（如果是编的，必须写 dataSource: "演示数据"）

**你的第一天做什么**：
1. 克隆仓库：`git clone <你的 GitHub 仓库地址>`
2. 建自己的分支：`git checkout -b feat/campus-data`
3. 打开 src/data/scenes.js，把里面的 3 条演示数据作为模板
4. 花 1 小时想一下你常去的校园地方（图书馆、食堂、操场、湖边、教九楼走廊……）
5. 先填 5 条你最熟悉的，每条写清楚描述、推荐理由、小行动
6. commit 并 push：
   ```bash
   git add src/data/scenes.js
   git commit -m "feat: add first 5 campus scene entries"
   git push -u origin feat/campus-data
   ```

**如果没做完，谁来接手**：A 可以帮你补几条，或者 D 可以帮你写 tags 和匹配相关的字段。

---

### 🅳️ D 角色（匹配规则 + 回信模板）

**你的职责**：
- 实现 `matchScenes()` 函数：根据用户选择筛选合适的校园场景
- 实现 `generateLetter()` 函数：根据用户选择 + 匹配场景生成回信卡
- 处理无匹配结果、空输入等异常情况

**你负责的文件**：
- `src/services/matcher.js` —— 把 `matchScenes` 里的 TODO 替换成真实匹配逻辑
- `src/services/letterGenerator.js` —— 把 `generateLetter` 里的 TODO 替换成真实回信生成
- 如果需要回信模板，可以在 src/data/ 下新建 letterTemplates.js（里面放几组文案模板）

**你依赖的模块**：
- 依赖 **C 模块** 的 src/data/scenes.js（SCENES 数组，匹配逻辑全靠它）
- 建议你等 C 写完至少 5 条场景后再开始，不然没法调试验证

**你提供给其他模块**：
- 给 **B 模块**：matchScenes()、matchScenes 的返回值格式（Scene 数组）、generateLetterSafe()、回信卡格式（Letter 对象）
- 给 **A 模块**：匹配逻辑的核心思路（写在注释里就行，比赛答辩会用到）

**你的交付标准**：
- ✅ matchScenes 能根据 mood + timeRange + socialTags + preferences 筛选出合适场景
- ✅ 按匹配度从高到低排序（匹配分高的排前面）
- ✅ 无匹配时返回空数组，调用方可以用 getFallbackScenes() 兜底
- ✅ generateLetter 能根据用户心情生成不同风格的安慰文案
- ✅ 回信不承诺解决心理疾病，文案自然不生硬
- ✅ generateLetterSafe 能处理 matchedScene 为空或 null 的情况

**你的第一天做什么**：
1. 克隆仓库：`git clone <你的 GitHub 仓库地址>`
2. 建自己的分支：`git checkout -b feat/matcher-letter`
3. 读 docs/ARCHITECTURE.md 的第四节（核心函数签名）
4. 先简单做一个"能跑就行"的版本：
   - 在 matchScenes 里先只按 mood 匹配（tags 是否包含当前 mood）
   - 在 generateLetter 里先固定 2~3 组文案，随机选一组
5. 在浏览器控制台测试（可以临时写个 HTML 测，或者直接在 console 里 import）
6. commit 并 push：
   ```bash
   git add src/services/matcher.js src/services/letterGenerator.js
   git commit -m "feat: implement basic scene matching and letter generation"
   git push -u origin feat/matcher-letter
   ```

**如果没做完，谁来接手**：A 可以帮你把匹配逻辑写得更复杂（比如加时间匹配、偏好匹配），或者 B 可以帮你测试结果是否合理。

---

### 🅴️ E 角色（收藏 / 反馈 + 测试 + 演示）

**你的职责**：
- 确保收藏和反馈功能正常
- 测试整个 MVP 流程（首页 → 选择 → 推荐 → 回信 → 收藏/反馈）
- 整理测试记录和演示脚本

**你负责的文件**：
- `src/utils/storage.js` —— A 已经写好了基础实现，你测试一下能不能跑，有问题改
- `docs/TESTING.md` —— 写测试计划和测试结果（A 已经写了模板，你填内容）
- `docs/DEMO_SCRIPT.md` —— 写现场演示脚本（A 已经写了初稿，你调整得更自然）

**你依赖的模块**：
- 依赖 **D 模块** 的匹配和回信（你要测完整流程）
- 依赖 **B 模块** 的 UI（你要在实际界面上测）
- 不过 storage.js 本身不依赖其他模块，你可以最先开始测

**你提供给其他模块**：
- 给 **B 模块**：storage.js 的所有函数签名（他们要用 addFavorite、isFavorite 这些）
- 给 **A 模块**：测试报告（哪些功能过了，哪些没）、演示脚本

**你的交付标准**：
- ✅ 测试 storage.js 的每个函数都能正常运行
- ✅ 在浏览器控制台手动测试 getFavorites / addFavorite / isFavorite / submitFeedback
- ✅ 完整走通一次 MVP 流程（首页 → 选择 → 回信 → 收藏），记录每个步骤是否正常
- ✅ docs/TESTING.md 里填好测试结果（过了的标 ✅，没的标 ❌，要诚实）
- ✅ docs/DEMO_SCRIPT.md 里有一份流畅的 3~5 分钟演示脚本

**你的第一天做什么**：
1. 克隆仓库：`git clone <你的 GitHub 仓库地址>`
2. 建自己的分支：`git checkout -b feat/favorites-feedback`
3. 打开 src/utils/storage.js，在浏览器控制台手动测试：
   ```js
   // 临时在一个 HTML 里 import storage 模块，或者用 console 手动测
   import { addFavorite, getFavorites, isFavorite, submitFeedback, clearAll } from "./src/utils/storage.js";
   addFavorite({ sceneId: "scene-001", letterContent: "今天辛苦了" });
   getFavorites();
   isFavorite("scene-001");   // 应该是 true
   submitFeedback("scene-001", "good");
   clearAll();
   ```
4. 确保每个函数都能跑，有问题就改 storage.js
5. commit 并 push：
   ```bash
   git add src/utils/storage.js
   git commit -m "feat: verify and finalize local storage utilities"
   git push -u origin feat/favorites-feedback
   ```

**如果没做完，谁来接手**：A 可以帮你写测试计划，或者 B 可以帮你在 UI 上跑收藏按钮的测试。

---

## 协作节奏建议（两天内）

| 时间 | 目标 | 谁来做 |
|---|---|---|
| 第一天上午 | 克隆仓库、建分支、理解自己的任务 | 全员 |
| 第一天中午 | C 先把场景数据填 5 条、E 先测 storage 工具 | C、E |
| 第一天下午 | B 渲染心情按钮、D 写基础匹配和回信 | B、D |
| 第一天晚上 | 第一次整合：A 把所有人的代码合到 main，跑一遍完整流程 | A |
| 第二天上午 | 修 bug、补数据、优化界面 | 全员（看哪里有问题） |
| 第二天下午 | 写测试报告、准备演示脚本、最终优化 | E、A |
| 第二天晚上（18:00 前） | 停止写功能，最后测试，准备提交 | 全员 |

---

## 遇到冲突怎么办

**最重要的一条**：**每个人只改自己负责的文件**。B 不应该去动 scenes.js，C 不应该去改 matcher.js。这样 Git 几乎不会有冲突。

如果真的冲突了：
1. 先备份自己的文件（复制一份出来）
2. 用 `git pull` 拉最新代码
3. 手动对比冲突部分，保留正确的内容
4. 实在搞不定，找 A（项目负责人）来解决

## 遇到别人没做完怎么办

1. 先检查自己能不能先在本地 mock 一下（比如 B 可以先用假的 SCENES 数组测试界面）
2. 不要卡住自己的进度，继续做自己模块能独立做的部分
3. 实在等不了，找 A 协调
