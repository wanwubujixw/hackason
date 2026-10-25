# 变更日志

所有重要变更都会记录在本文件中。

格式参考：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.2.2] - 2026-10-25

### 新增
- 校园场景数据新增 3 条：梅园（`scene-013`）、博雅广场（`scene-014`）、外国语学院门口的林荫空地（`scene-015`），均按「一个人放松」场景填写心情标签、时长与社交标签

### 移除
- 校园场景数据移除沁园春食堂（`scene-006`）与桂香园食堂（`scene-007`），编号保留不复用，避免与历史收藏记录冲突

### 变更
- 场景总数由 12 条调整为 13 条，同步更新 README、TESTING、DEMO_SCRIPT 中的数量与推荐示例

---

## [0.2.1] - 2026-10-25

### 新增
- storage 模块自动化回归测试页 `tests/storage-test.html`，直接 `import` 真实模块，覆盖 10 项用例
- GitHub Pages 在线部署（`.nojekyll`），线上地址 https://wanwubujixw.github.io/hackason/
- README 增加在线体验入口、自动化测试页入口与代上传说明

### 修复
- `docs/DEMO_SCRIPT.md` 按真实界面与数据重写：删除「双击 index.html」「图书馆三楼窗边」等与实现不符的表述
- `CONTRIBUTING.md` 合并前检查项改为双击「启动本地预览.bat」，避免 `file://` 白屏误判
- `docs/TESTING.md` 补充 375×812 宽度渲染验证结果

### 变更
- 开发期功能分支（`feat/campus-data`、`feat/integrate-ui`、`feat/favorites-feedback`、`chore/pages-deploy`、`chore/storage-test-page`）合并后清理，远端仅保留 `main`

---

## [0.2.0] - 2026-10-24

### 新增
- 完整界面层：首页心情选择、偏好设置、推荐结果、回信卡、收藏列表
- 12 条华中师范大学真实校园场景数据（桂子山校区 + 南湖校区）
- 场景匹配算法：心情 / 时长 / 社交舒适度 / 偏好加权打分，取前 3 条并附兜底场景
- 回信生成：6 种心情模板、4 句随机结束语、异常兜底
- 收藏与反馈：收藏去重、取消收藏、反馈提交后不可重复提交
- 零依赖本地预览服务器：`serve.ps1` / `启动本地预览.bat`
- 队友 E 第二轮改造指南：`docs/GUIDE_TEAMMATE_E_V2.md`

### 修复
- `matcher.js` 缺少 `export` 导致 ES Module 加载失败、整页空白
- 兜底场景 ID 由不存在的 `scene-013` 改为 `scene-012`
- 收藏记录补充 `place` / `mood` 字段，收藏页可显示地点名

### 变更
- 将嵌套目录 `hackason-main/hackason-main/` 中的完整 UI 合并到仓库根目录
- 更新 README 的功能列表、启动方式、运行示例、测试状态与已知限制
- 回填 `docs/TESTING.md` 的 2026-10-24 实测结果

### 移除
- 重复目录 `hackason-main/hackason-main/`

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
