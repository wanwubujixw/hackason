# 队友 D：匹配规则 + 回信生成（操作指南）

> 零代码基础也能完成！你负责写"为什么这个心情适合这个场景"的逻辑，以及安慰人的回信文案。

---

## 你需要准备的

1. **VS Code** → https://code.visualstudio.com/
2. 一个 **AI 助手**：TRAE / Cursor / VS Code Copilot

---

## 步骤 1：下载项目 zip 包

负责人发你 `hackason.zip`，解压到 **D:\hackason**。

---

## 步骤 2：先想一下（5 分钟，微信里打字就行）

### 匹配逻辑你觉得应该怎么做？
> 比如：心情是"疲惫"的人，应该优先推荐有"tired"标签的场景，对不对？
> 时间只有 5 分钟的人，就不要推荐需要 30 分钟的地方……

### 回信文案你觉得应该长什么样？
> 针对不同心情，想 2~3 句温柔的安慰话，比如：
> - 疲惫："今天辛苦了，找个安静的地方歇一歇吧。"
> - 低落："心情不好的时候，风会带走一部分烦恼。"
> - 孤独："一个人也可以很好，去食堂热饮窗口感受一下烟火气吧。"
> - 迷茫："有时候停下来看一看，反而会更清楚自己要什么。"
> - 烦躁："深呼吸三次，找个安静的角落让自己冷静下来。"
> - 平静："既然心情不错，去湖边走一圈，发现校园里的小美好吧。"

把你想的文案**发给负责人**（或直接跟 AI 说）。

---

## 步骤 3：让 AI 帮你写代码

打开 AI 助手，**复制粘贴下面这段**（把你想的文案告诉它）：

```
我是大一学生，完全不会写代码，在参加黑客松比赛。
请你帮我写两个 JavaScript 函数：场景匹配和回信生成。

项目位置：D:\hackason

【文件 1：src/services/matcher.js —— 场景匹配逻辑】

功能：根据用户选择（心情、时间、偏好、社交），从场景库里挑出最合适的。

匹配规则我想这样（你觉得合理就用）：
- 场景的 tags 里包含当前 mood → +3 分
- 场景的 timeRange 里包含当前 availableMinutes → +2 分
- 场景的 socialTags 里包含当前 socialComfort → +2 分
- 如果有 preferences（quiet / nature / walkable / warm / food），场景 type 匹配到 → 每项 +1 分
- 按总分从高到低排序返回前 3 条
- 全部 0 分就返回空数组 []（调用方会用 getFallbackScenes 兜底）

输入格式：
{ mood: "tired", availableMinutes: 15, preferences: ["quiet"], socialComfort: "alone" }

输出格式：Scene 对象数组（按匹配度排序）

注意：import { SCENES } from "../data/scenes.js" 已经在文件顶部了，不要改 import 那一行。
      只把 matchScenes 函数体里的 TODO 替换成真实逻辑。

【文件 2：src/services/letterGenerator.js —— 回信生成】

功能：根据用户心情和匹配到的场景，生成一封温柔的回信卡。

我想好的安慰文案（你可以用这些或改得更好）：
- tired（疲惫）："今天辛苦了，找个安静的地方歇一歇吧。校园里总有一个角落在等你。"
- irritated（烦躁）："深呼吸三次，一切都会慢慢好起来的。给自己 5 分钟，只做自己想做的事。"
- down（低落）："心情不好的时候，风会带走一部分烦恼。找个温暖的角落，让自己静一静。"
- lonely（孤独）："一个人也可以很好。去有烟火气的地方走一圈，感受校园的温度。"
- confused（迷茫）："迷茫的时候，先别急着往前走。停下来想一想，也许答案就在下一个转角。"
- peaceful（平静）："既然心情不错，那就好好享受这份宁静吧。"

生成逻辑：
- 根据 mood 从上面选 1 条文案
- 如果 matchedScene 是空或 null，用 generateLetterSafe 里的兜底内容
- 不要承诺能解决心理疾病，语气要温柔自然
- place 直接用 matchedScene.name
- reason 直接用 matchedScene.reason
- smallAction 直接用 matchedScene.smallAction
- ending 可以从几句温柔话里随机选：
  - "慢慢来，一切都还来得及。💌"
  - "不管怎样，记得照顾好自己。💛"
  - "今天也要对自己温柔一点。🌸"
  - "你值得所有的好。✨"

注意：不要改文件里已有的 import 语句和 export，只替换 TODO 那部分。
不要改 generateLetterSafe 函数，那个已经写好异常处理了。

两个文件都写完告诉我。只改 matcher.js 和 letterGenerator.js 这两个文件。
```

---

## 步骤 4：保存

AI 生成好后，**覆盖保存到**：
- `D:\hackason\src\services\matcher.js`
- `D:\hackason\src\services\letterGenerator.js`

---

## 步骤 5：测试一下（可选）

打开 `D:\hackason\index.html` 双击。首页出来后点几下试试——如果匹配能返回结果、回信卡能出来，就成功了。

---

## 步骤 6：把文件发回负责人

把这两个文件发给负责人：
- `D:\hackason\src\services\matcher.js`
- `D:\hackason\src\services\letterGenerator.js`

说："我是 D，完成了匹配和回信逻辑。"

---

## ⚠️ 重要规则

- **只改这两个文件**：src/services/matcher.js、src/services/letterGenerator.js
- **不要碰** src/data/、src/pages/、src/styles/、src/utils/ 里的任何文件
- **函数签名不要改**（matchScenes 的入参格式、generateLetterSafe 的入参格式），B 模块的 UI 要按这个来调用
- **不要承诺解决心理疾病**，回信文案要温柔自然，不能写"你的抑郁会好的"这种
