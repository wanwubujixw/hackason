# 贡献指南

> 本文档面向全体团队成员，说明代码规范、协作规则和原创要求。
> 所有成员提交代码前请先读一遍。

---

## 一、代码规范（JavaScript）

1. **缩进**：2 个空格（不要用 Tab）
2. **变量命名**：用中文注释，英文变量名用 camelCase（比如 `matchScenes`、`userSelection`）
3. **字符串**：统一用单引号 `'` 或双引号 `"` 都可以，但同一个文件内保持一致
4. **函数注释**：所有公共函数必须有 JSDoc 风格的中文注释，说明输入输出
5. **中文注释**：所有文件尽量加适合初学者理解的中文注释
6. **不要留**：`// TODO`、`// 未完成`、`// 假按钮` 之类的标记如果是故意留的，要说明谁来做、什么时候做；如果已经完成就删掉

---

## 二、文件修改边界（绝对不能越界）

| 我负责的模块 | 我能改哪些文件 | 我绝对不能改哪些文件 |
|---|---|---|
| A（项目负责人） | README、docs/*、所有文件（整合时） | — |
| B（首页 UI） | index.html、src/pages/*、src/styles/global.css | src/data/*、src/services/*、src/utils/storage.js |
| C（校园数据） | src/data/scenes.js、src/data/moods.js | src/services/*、src/pages/*、src/styles/* |
| D（匹配 + 回信） | src/services/matcher.js、src/services/letterGenerator.js | src/pages/*、src/styles/*、src/utils/* |
| E（收藏/测试） | src/utils/storage.js、docs/TESTING.md、docs/DEMO_SCRIPT.md | src/pages/*、src/services/matcher.js、src/data/* |

**如果发现负责范围外的文件有问题怎么办？**
→ 告诉对应的负责人，让他自己改。比如 B 发现 matcher.js 有 bug，告诉 D 来修，不要自己直接改。

---

## 三、Commit 规范

```
类型: 简短描述（中文或英文都行，但要清晰）
```

| 类型 | 说明 | 示例 |
|---|---|---|
| `feat:` | 新功能 | `feat: add campus scene data` |
| `fix:` | 修 bug | `fix: handle empty matching results` |
| `docs:` | 文档改动 | `docs: update architecture.md` |
| `style:` | 样式调整 | `style: improve mobile layout` |
| `refactor:` | 重构（不改行为） | `refactor: simplify matching logic` |
| `test:` | 测试代码 | `test: add storage utility tests` |
| `chore:` | 杂项 | `chore: update gitignore` |

**规则**：
- 每次 commit 只做一件事
- commit 信息要真实描述这次改了什么
- 不要把全部改动压缩到最后一次 commit
- 不要伪造历史提交（改时间、改作者、批量制造空 commit）

---

## 四、代码审查与合并

1. 每个人 push 后创建 Pull Request
2. A（项目负责人）负责审查代码
3. 审查通过后合并到 main
4. 合并前 A 要确认项目仍然能运行（双击 index.html 不报错）

如果 A 太忙，队友之间也可以互相 review，但最终合并权在 A。

---

## 五、原创开发要求（非常重要！）

### 必须做到：
1. ✅ **业务逻辑、推荐规则、文案、界面设计全部由团队原创**
2. ✅ 可以参考公开技术文档（MDN、W3Schools 等）学习语法
3. ✅ 使用的第三方库/素材必须在 README 里注明来源和许可证
4. ✅ 如果用了 AI 辅助，要如实说明（比如"本项目部分代码由 AI 辅助生成，经团队审查后使用"）
5. ✅ 场景数据要注明是"已核实"还是"演示数据"

### 绝对禁止：
1. ❌ 复制其他参赛团队的项目或直接搬运成品代码
2. ❌ 盗用来源不明的网络图片（要么用原创、要么用免费可商用的、要么暂时不放）
3. ❌ 把 AI 生成的内容描述为"纯人工原创"（如实披露）
4. ❌ 虚构"已完成的测试结果"、"用户调研数据"、"用户反馈"
5. ❌ 编造校园场景并伪装成真实调研结果（演示数据必须标注清楚）

---

## 六、署名与致谢

- 最终 README 会列出全体成员的贡献
- 如果用了他人的创意或借鉴了某个开源项目，在 README 里致谢
- LICENSE 文件已经是 MIT 许可，意味着代码可以被自由使用，但署名必须保留
