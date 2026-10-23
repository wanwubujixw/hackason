# 队友 B：首页 + 全部界面（操作指南）

> 零代码基础也能完成，跟着步骤走就行。你用 AI 帮你写代码，你负责把关和发送。

---

## 你需要准备的

1. **VS Code**（装过了就跳过）→ https://code.visualstudio.com/ 下载安装
2. 一个 **AI 助手**（任选一个）：
   - 方案 A：TRAE（就是这个界面，推荐，让你电脑上直接打开 VS Code + TRAE）
   - 方案 B：Cursor → https://cursor.sh/ 下载（也是 VS Code 内置 AI）
   - 方案 C：VS Code 里装 GitHub Copilot 插件

---

## 步骤 1：下载项目 zip 包

项目负责人会发你一个 `hackason.zip` 文件，下载后解压到 **D:\hackason**（或者任何你能找到的位置）。

---

## 步骤 2：用 VS Code 打开项目

1. 打开 VS Code
2. 菜单 File → Open Folder → 选择 D:\hackason
3. 左边应该能看到 index.html、src/、docs/ 这些文件

---

## 步骤 3：让 AI 帮你写代码（复制粘贴就行）

打开你的 AI 助手（TRAE / Cursor / Copilot），**把下面这段完整复制粘贴给 AI**：

```
我是一个完全不会写代码的大一学生，在参加黑客松比赛。
请你帮我完成一个网页应用的首页 UI 设计。

项目位置：D:\hackason（用 VS Code 打开了）

我负责首页和全部界面。项目框架已经搭好了，你只需要帮我完成下面这几件事：

【必须改的文件】（只有这三个，别碰别的）
1. index.html — 页面入口
2. src/pages/home.js — 首页逻辑
3. src/styles/global.css — 样式文件

【我需要你做的事情】

第一：帮我把 index.html 改好
- 要有一个好看的首页，标题是"✉️ 解忧慢递邮局"
- 下面展示 6 个心情按钮（疲惫😴 / 烦躁😤 / 低落💧 / 孤独🌙 / 迷茫🌫️ / 平静🌸）
- 点任何一个心情按钮后，显示时间选择（5分钟 / 15分钟 / 30分钟）
- 选完时间后显示场景偏好（安静 / 自然 / 散步 / 烟火气）
- 最后显示社交舒适度（独处 / 少量人群 / 热闹）
- 然后有一个"寄出心情"的按钮

第二：帮我把 src/pages/home.js 写好
- 要正确 import 这些：
  import { MOODS } from "../data/moods.js";
  import { matchScenes, getFallbackScenes } from "../services/matcher.js";
  import { generateLetterSafe } from "../services/letterGenerator.js";
  import { addFavorite, isFavorite, submitFeedback } from "../utils/storage.js";
- 点击心情按钮 → 显示时间选择
- 点击时间 → 显示偏好选择
- 点击偏好 → 显示社交选择
- 点击"寄出心情" → 调用 matchScenes → 拿到结果后调用 generateLetterSafe → 渲染回信卡
- 回信卡要有：安慰文案、推荐地点、选择原因、小行动、结束话
- 回信卡下面有两个按钮："收藏这封信"和"适合/不适合"反馈

第三：帮我把 src/styles/global.css 补充好
- 风格是"温暖的邮局信纸"感觉，米白背景、暖棕色主色、圆角卡片
- 心情按钮要大一点、好看一点、hover 有效果
- 回信卡要有信纸的感觉（边框柔和、有一点点手写风）
- 手机屏幕也能正常显示（375px 宽度不溢出）

【重要】
- 所有文件路径都按 src/pages/home.js 这种来，不要写错
- 这是纯静态 Web 应用，用 ES module（script type="module"）
- 写完告诉我"全部完成了"，我来保存文件
- 中文注释可以多写一点，让我能看懂
```

---

## 步骤 4：保存 AI 写的代码

AI 写完后，把它生成的代码**全部保存**到对应文件：
- index.html → 直接覆盖
- src/pages/home.js → 直接覆盖
- src/styles/global.css → 追加或覆盖 AI 写的部分

---

## 步骤 5：测试能不能跑

1. 双击 `D:\hackason\index.html`（或者用 VS Code Live Server）
2. 浏览器打开后，应该能看到首页
3. 点心情按钮、选时间……一路点下去，最后能看到回信卡
4. **如果哪一步报错**，把 F12 控制台的红色错误截图发给负责人

---

## 步骤 6：把文件发回负责人

你改了这三个文件：
- `D:\hackason\index.html`
- `D:\hackason\src\pages\home.js`
- `D:\hackason\src\styles\global.css`

把这三个文件压缩成一个 zip 包，或者逐个发给负责人（微信/QQ/云盘都行）。

**发送时加一句**："我是 B，完成了首页 UI，改了 index.html、home.js、global.css 三个文件"。

---

## ⚠️ 重要规则

- **只改这三个文件**：index.html、src/pages/home.js、src/styles/global.css
- **不要碰**：src/data/scenes.js、src/services/matcher.js、src/utils/storage.js 等其他文件
- **保存前多看一眼**，确认 AI 没有让你改不该改的文件
- **如果 AI 让你改 src/services/ 或 src/data/**，停下来，告诉我，我来处理
