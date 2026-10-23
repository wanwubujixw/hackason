# 队友 E：收藏/反馈 + 测试（操作指南）

> 你是团队的质量守门员！负责确认整个项目能跑、数据安全、收藏反馈正常工作。

---

## 你需要准备的

1. **VS Code** → https://code.visualstudio.com/
2. 一个 **AI 助手**：TRAE / Cursor / VS Code Copilot

---

## 步骤 1：下载项目 zip 包

负责人发你 `hackason.zip`，解压到 **D:\hackason**。

---

## 步骤 2：先测一遍 storage.js（5 分钟）

storage.js 是**唯一已经完整写好**的模块，你先确认它能不能跑：

### 手动测试方法：
1. 用 VS Code 打开 `D:\hackason`
2. 右键 index.html → Open with Live Server（先装 Live Server 插件，或者直接双击打开也行）
3. 浏览器打开后按 **F12** → 切到 Console 标签
4. 粘贴这段代码按回车：

```js
(async () => {
  const s = await import("./src/utils/storage.js");
  console.log("=== 测试 storage.js ===");
  
  // 测试收藏
  s.addFavorite({ sceneId: "scene-001", letterContent: "今天辛苦了..." });
  console.log("getFavorites:", s.getFavorites());
  console.log("isFavorite scene-001:", s.isFavorite("scene-001"));  // 应该是 true
  
  // 测试反馈
  s.submitFeedback("scene-001", "good");
  
  // 测试取消收藏
  s.removeFavorite("scene-001");
  console.log("isFavorite after remove:", s.isFavorite("scene-001"));  // 应该是 false
  
  // 清理
  s.clearAll();
  console.log("✅ storage.js 全部函数测试通过！");
})();
```

5. 如果看到最后那句"测试通过"，storage.js 没问题 → 继续
6. 如果有红色报错 → 把错误截图发给负责人

---

## 步骤 3：让 AI 帮你检查并完善 storage.js（如果需要）

如果刚才测试有问题，或者你想让 AI 帮忙优化，打开 AI 助手粘贴：

```
我是大一学生，完全不会写代码。请帮我检查 src/utils/storage.js 有没有问题。

功能要求：
- getFavorites() 读取收藏列表
- addFavorite({ sceneId, letterContent }) 添加收藏
- removeFavorite(sceneId) 取消收藏
- isFavorite(sceneId) 判断是否已收藏
- submitFeedback(sceneId, "good" / "bad") 提交反馈
- clearAll() 清空所有数据

用的是 localStorage（浏览器本地存储）。
如果代码没有问题就告诉我"没问题不用改"。
如果有问题就帮我改好，不要改文件结构和 export。
```

---

## 步骤 4：写测试报告和演示脚本

这两个文件是**纯文字**，不用代码基础就能写。打开 AI 助手粘贴：

```
请帮我写两个 Markdown 文档，用中文。

第一个：docs/TESTING.md（测试报告）
内容：
- 测试环境（Chrome 最新版）
- 测试清单（我从仓库里已经有的模板上填，覆盖这些：
  1. 项目能启动
  2. 首页能打开
  3. 心情按钮 6 个都能点
  4. 选完时间能显示
  5. 点"寄出心情"能看到回信卡
  6. 点收藏按钮后再刷新还能看到
  7. 点反馈按钮不报错
  8. 手机屏幕（375px）不溢出
- 每个测试项写"测试通过 ✅"或"待测试 ⏳"
- 写一段关于 localStorage 限制的说明：数据存在浏览器本地、清缓存会丢、换电脑看不到

第二个：docs/DEMO_SCRIPT.md（演示脚本）
内容：
- 3~5 分钟黑客松现场演示脚本
- 分开场、演示核心流程（首页→选心情→选时间→寄出→回信卡→收藏）、创新点、收尾
- 口语化一点，适合现场念
- 不要太正式

两个文件都是纯文字 Markdown，不用写代码。
```

---

## 步骤 5：保存并全部测试一遍（等其他队友做完代码）

等 B、C、D 模块都发回代码后，负责人会合并。那时候你：

1. 打开 `D:\hackason\index.html`
2. **完整走一遍 MVP 流程**：
   - 首页能看到 6 个心情按钮吗？
   - 点一个心情，能选时间吗？
   - 点"寄出心情"，能看到回信卡吗？
   - 回信卡有安慰文案、地点、行动建议吗？
   - 点收藏按钮 → 刷新 → 还在吗？
   - 手机屏幕（F12 切移动设备视图）不溢出？
3. 每个问题都记录下来，发给负责人

---

## 步骤 6：把文件发回负责人

如果你改了 storage.js、docs/TESTING.md、docs/DEMO_SCRIPT.md，都发回去。

---

## ⚠️ 重要规则

- **storage.js 如果没问题就别改**，你主要负责测试和文档
- **TESTING.md 要诚实**，通过了就是 ✅，没通过就是 ❌，不要假装都过了
- **DEMO_SCRIPT.md 要口语化**，演讲时照着念就行，别写得像报告
