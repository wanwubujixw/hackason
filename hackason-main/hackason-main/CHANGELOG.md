# 变更日志

所有重要变更都会记录在本文件中。

格式参考：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.1.0] - 2026-10-23

### 新增
- 项目基础框架：目录结构、入口 index.html、核心配置文件
- 模块接口规范：`matchScenes()` 场景匹配函数签名、`generateLetter()` 回信生成函数签名
- 校园场景示例数据：src/data/scenes.js（3 条演示数据，标注为非真实）
- 心情选项数据：src/data/moods.js
- 本地存储封装：src/utils/storage.js（收藏 / 反馈的 localStorage 操作）
- 邮局主题基础样式：src/styles/global.css
- 协作文档：README、ARCHITECTURE、TEAM_DIVISION、GIT_WORKFLOW、TESTING、DEMO_SCRIPT、CONTRIBUTING

### 待开发
- [ ] 完整的场景匹配逻辑（D 模块）
- [ ] 回信模板与生成（D 模块）
- [ ] 首页 UI 与心情选择页（B 模块）
- [ ] 结果页与回信卡渲染（B 模块）
- [ ] 收藏列表页（E 模块）
- [ ] 完整的真实校园场景数据（C 模块）
