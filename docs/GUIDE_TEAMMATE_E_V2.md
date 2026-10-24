# 队友 E 第二轮指南：storage.js 返工 + 后续任务

> 上一版 `GUIDE_TEAMMATE_E.md` 里说"storage.js 没问题就别改"，现在情况变了：
> 收到你的版本后做了代码评审，**功能思路是对的，但有一个会让整个模块加载失败的漏洞，还有几处要和项目骨架统一**。
> 本文件 = 你要改什么 + 改完怎么验证 + 接下来还要做什么。照着做即可，不需要看懂所有原理。

---

## 一、结论先说

| 项目 | 评价 |
|---|---|
| 5 个函数的逻辑 | ✅ 对的，去重、容错、good/bad 校验都没问题 |
| 缺少 clearAll | ❌ 致命：按测试脚本 import 时浏览器会直接报错，**整个 storage.js 都加载不了** |
| 与骨架的一致性 | ⚠️ key 名、返回值、时间戳、排序、反馈结构都和项目现有约定不同，需要统一 |

所以：**不要只补 clearAll，直接按下面第三节的完整代码整份替换**，一次改到位。

---

## 二、必改清单（按优先级）

### P0 必须改，不改就跑不起来

1. **补 `clearAll()`**
   测试脚本里写了 `s.clearAll()`，你的文件没有导出这个名字。ES Module 遇到"导入了不存在的名字"是**整个模块加载失败**，不是单个函数报错——等于 getFavorites、addFavorite 全都用不了。

2. **写 localStorage 的操作要包 try/catch**
   你有 try/catch 的只有"读"（getFavorites）和"反馈"。`addFavorite` / `removeFavorite` 写的时候没有。
   浏览器隐私模式、存储配额满、被禁用 Cookie 时，`localStorage.setItem` 会直接抛异常，导致整个点击事件中断，页面看起来"点了没反应"。

### P1 必须统一，否则 B 的界面会踩坑

3. **三个写函数要有返回值**
   现在返回 `undefined`。项目骨架里约定返回 `true` / `false`，B 可能用返回值判断"要不要弹'收藏成功'"。统一成布尔值。

4. **收藏记录要带时间戳 `savedAt`**
   收藏页如果要显示"收藏于 10 月 24 日"或按时间排序，没有这个字段就没法做。用 `new Date().toISOString()`。

5. **新收藏放最前面（用 `unshift`，不要 `push`）**
   收藏列表的通用习惯是"最近收藏的在最上面"。你现在的 `push` 会让最新的排在最底下。

### P2 建议统一，影响不大但别留坑

6. **localStorage 的 key 改回 `jyo_favorites` / `jyo_feedbacks`**
   你用的是 `slowpost_` 前缀，项目骨架和文档一直用的是 `jyo_`。中途换前缀会让之前测试写入的数据读不到，也容易和 B 的代码对不上。

7. **反馈改成"数组 + 时间戳"，不要用 `{sceneId: "good"}` 对象**
   对象结构同一场景只能存一条，第二次反馈会覆盖第一次，演示时想统计"一共收到几条反馈"也算不出来。改成往数组里 push 一条带 `submittedAt` 的记录。

---

## 三、整份替换代码（已按上面 7 条改好）

打开 `src/utils/storage.js`，**全选删除，把下面这段原样粘进去，保存**。不要改任何字符。

```js
/**
 * 本地存储工具（E 模块负责）
 * 负责收藏和反馈的本地持久化，只依赖浏览器 localStorage。
 * 注意：数据只存在当前浏览器，清缓存会丢，换设备看不到。
 */

const FAVORITES_KEY = "jyo_favorites";
const FEEDBACK_KEY = "jyo_feedbacks";

/**
 * 读取收藏列表
 * @returns {Array} 收藏数组，出错返回空数组
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("读取收藏失败：", e);
    return [];
  }
}

/**
 * 收藏一条回信，新收藏排在最前面
 * @param {{sceneId: string, letterContent: string}} item
 * @returns {boolean} 是否收藏成功（已收藏过也算成功）
 */
export function addFavorite(item) {
  try {
    const sceneId = item && item.sceneId;
    if (!sceneId) return false;

    const list = getFavorites();
    if (list.some(f => f.sceneId === sceneId)) return true;

    list.unshift({
      sceneId: sceneId,
      letterContent: (item && item.letterContent) || "",
      savedAt: new Date().toISOString()
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("收藏失败：", e);
    return false;
  }
}

/**
 * 按 sceneId 取消收藏
 * @param {string} sceneId
 * @returns {boolean}
 */
export function removeFavorite(sceneId) {
  try {
    if (!sceneId) return false;
    const list = getFavorites().filter(f => f.sceneId !== sceneId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("取消收藏失败：", e);
    return false;
  }
}

/**
 * 判断是否已收藏
 * @param {string} sceneId
 * @returns {boolean}
 */
export function isFavorite(sceneId) {
  if (!sceneId) return false;
  return getFavorites().some(f => f.sceneId === sceneId);
}

/**
 * 提交反馈
 * @param {string} sceneId
 * @param {"good" | "bad"} feedback
 * @returns {boolean}
 */
export function submitFeedback(sceneId, feedback) {
  if (!sceneId) return false;
  if (feedback !== "good" && feedback !== "bad") return false;

  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    list.push({
      sceneId: sceneId,
      feedback: feedback,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("提交反馈失败：", e);
    return false;
  }
}

/**
 * 清空收藏和反馈（测试 / 重置演示用）
 */
export function clearAll() {
  localStorage.removeItem(FAVORITES_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}
```

---

## 四、改完怎么验证（3 分钟）

1. 用 VS Code 打开 `D:\hackason`，右键 `index.html` → **Open with Live Server**
   （**不要双击打开**。`file://` 协议下 Chrome 会拦截模块导入，测试脚本一定报错，那不是代码的问题。）
2. 页面打开后按 **F12** → Console 标签 → 粘贴下面这段 → 回车：

```js
(async () => {
  const s = await import("./src/utils/storage.js");
  s.clearAll();
  console.log("空列表:", s.getFavorites());                                    // []
  console.log("收藏:", s.addFavorite({ sceneId: "scene-001", letterContent: "测试" })); // true
  console.log("条数:", s.getFavorites().length);                               // 1
  console.log("有时间戳:", !!s.getFavorites()[0].savedAt);                     // true
  console.log("已收藏:", s.isFavorite("scene-001"));                           // true
  console.log("重复收藏:", s.addFavorite({ sceneId: "scene-001", letterContent: "测试" })); // true，条数仍为 1
  console.log("反馈:", s.submitFeedback("scene-001", "good"));                  // true
  console.log("非法反馈:", s.submitFeedback("scene-001", "maybe"));            // false
  console.log("取消收藏:", s.removeFavorite("scene-001"));                     // true
  console.log("取消后:", s.isFavorite("scene-001"));                           // false
  s.clearAll();
  console.log("清空后条数:", s.getFavorites().length);                         // 0
  console.log("=== storage.js 全部通过 ===");
})();
```

3. **每一行后面注释就是预期结果**。对不上或出现红字，截图发给负责人（截 Console 完整报错，别只截一半）。
4. 全部对上后，把 `storage.js` 文件本身发回负责人（见第六节）。

---

## 五、storage.js 之外，你还要做这些

### 任务 1｜现在就能做：填 `docs/TESTING.md`
- 把"测试环境"改成真实信息：你的 Windows 版本、Chrome 版本号（Chrome 地址栏输 `chrome://version` 可查）
- 第 1~4 行可以先测就先填，**测不了的就留 `⏳ 待测`，不要提前写 ✅**
- 第三节"已知问题"至少写两条真实发现，例如：
  - 双击 `index.html` 打开时模块导入失败（必须用 Live Server）
  - localStorage 清缓存后收藏全丢
- 第四节 localStorage 限制说明保留，README 会引用

### 任务 2｜等负责人合并 B、D 的代码后：做整包验收
拿到合并后的完整项目，用 Live Server 打开，逐条跑 [TESTING.md](TESTING.md) 的 12 个用例，重点是：
- 6 个心情按钮 → 选时间 → 出推荐 → 出回信卡 → 收藏 → 刷新还在 → 反馈不报错
- 无匹配兜底不崩
- 字段为空时（比如不选心情直接点"寄出"）不报错
- F12 切 375px 宽，不横向溢出、按钮能点
- **收藏和反馈真的写进了 localStorage**：F12 → Application → Local Storage，看 `jyo_favorites` / `jyo_feedbacks` 两个 key 的内容
- 结果如实填回 TESTING.md，过了 ✅，没过 ❌ 并写清现象

### 任务 3｜润色 `docs/DEMO_SCRIPT.md`
- 现在还是初稿，改成**口语**、3~5 分钟、能照着念
- 结构：开场一句 → 用户痛点 → 演示完整流程（心情→时间→推荐→回信→收藏）→ 创新点（慢递 / 校园真实地点 / 离线可跑）→ 收尾
- **每个操作步骤写清楚"点什么、说什么"**，比如"点击'有点累' → 说：我今天刚从图书馆出来……"
- 演示前自己掐表读两遍，超时就删内容，不要加

### 任务 4｜演示前准备（容易被忘）
- 用手机或录屏软件录一遍完整流程做备份，现场网络/浏览器出问题时直接放视频
- 演示用的浏览器提前清一次 localStorage，保证从"空收藏"开始
- 检查 375px 视图下按钮没有被遮挡

---

## 六、交付规范（很重要）

1. **直接发原文件**：`storage.js`、`TESTING.md`、`DEMO_SCRIPT.md` 三个文件本身。
   **不要贴进 Word / WPS 再导出**——上次收到的是 Word 导出的 HTML，引号会被替换成中文弯引号、缩进变成特殊空格，粘回项目就是查不出来的语法错误。
2. **只改自己负责的这三个文件**。`index.html`、`src/pages/`、`src/styles/`、`src/services/`、`src/data/` 都不要动。
3. **不用碰 Git**：不用 clone、不用 commit、不用 push。文件发回负责人，由负责人统一提交并用 `--author` 标注你的名字。
4. 每次发回时附一句状态：改了哪个文件、验证到哪一步、哪些还没测。

---

## 七、优先级与验收标准

| 顺序 | 事项 | 完成标志 |
|---|---|---|
| 1 | 整份替换 storage.js | 第四节脚本 12 行输出全部符合预期 |
| 2 | 发回 storage.js + 截图 | 负责人确认无报错 |
| 3 | 填 TESTING.md 的测试环境 | 环境信息真实、无空缺 |
| 4 | 等合并后跑 12 项验收 | 每项有 ✅/❌ 和实际结果 |
| 5 | 润色 DEMO_SCRIPT.md | 掐表 3~5 分钟，口语化 |
| 6 | 录制备份演示视频 | 本地能正常播放 |

**验收底线**：storage.js 能导入、6 个函数全可用；测试报告没有假 ✅；演示脚本能照着念下来。
