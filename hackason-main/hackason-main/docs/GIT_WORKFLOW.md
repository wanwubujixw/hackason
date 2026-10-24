# Git 协作完整教程（适合初学者）

> 本文件写给完全不会 Git 的同学。每条命令都有注释，按步骤做就行。

---

## 一、先在电脑上确认 Git 可用

打开终端（PowerShell / CMD / Git Bash），运行：

```bash
git --version
```

如果能看到版本号（比如 `git version 2.56.0.windows.2`），说明 Git 已经装好了。
如果提示找不到命令，去 https://git-scm.com/download/win 下载安装。

第一次用 Git，需要配置一下你的名字和邮箱（用来标记提交的作者）：

```bash
git config --global user.name "你的 GitHub 用户名"
git config --global user.email "你的 GitHub 邮箱"
```

**重要**：这里填的用户名和邮箱要和你 GitHub 账号上的一致，这样提交才会显示在你的 GitHub 贡献记录里。

---

## 二、仓库与分支命名约定

| 类型 | 命名 | 说明 |
|---|---|---|
| 仓库 | `hackason` | 已经由 A（项目负责人）创建在 GitHub 上 |
| main 分支 | `main` | A 维护，所有人的代码最终合并到这里 |
| B 的分支 | `feat/home-ui` | 首页 UI 相关改动 |
| C 的分支 | `feat/campus-data` | 校园场景数据相关改动 |
| D 的分支 | `feat/matcher-letter` | 匹配规则 + 回信模板 |
| E 的分支 | `feat/favorites-feedback` | 收藏/反馈 + 测试 |
| A 的分支 | `feat/project-integration` | 最终整合 |

**每个人只在自己的分支上开发，不要直接推 main。**

---

## 三、从零开始克隆仓库（每个人第一次做）

```bash
# 1. 找 A 要仓库地址，然后克隆（把 URL 换成真实地址）
git clone https://github.com/你的GitHub用户名/hackason.git

# 2. 进入项目目录
cd hackason

# 3. 建自己的开发分支（以 B 为例）
git checkout -b feat/home-ui
# 以后每次打开终端，先运行 git checkout feat/home-ui 切回自己的分支
```

---

## 四、日常提交（每次改完代码都做）

```bash
# 1. 看看哪些文件被改了（可选，但推荐）
git status

# 2. 把你改过的文件加到暂存区（把具体文件名换成你改的）
git add src/pages/home.js src/styles/global.css

# 3. 提交（写清楚这次改了什么）
git commit -m "feat: add mood selection buttons to home page"

# 4. 推送到远程（第一次需要加 -u，之后可以省略）
git push -u origin feat/home-ui
```

**Commit 规范**（照着写就行）：

```
feat: 新功能        比如 feat: add campus scene data
fix: 修 bug         比如 fix: handle empty matching results
docs: 文档改动      比如 docs: update architecture.md
style: 样式调整     比如 style: improve mobile layout
refactor: 重构      比如 refactor: simplify matching logic
test: 测试代码      比如 test: add storage utility tests
chore: 杂项         比如 chore: update gitignore
```

**每次 commit 只做一件事**。比如不要一次 commit 里既有场景数据又有回信模板，分开两次 commit。

---

## 五、推送后怎么让 A 合并（Pull Request）

1. 你 push 之后，打开 GitHub 仓库页面，会看到一个黄色提示："Compare & pull request"
2. 点进去，写一下你改了什么（简单几句）
3. 点 "Create pull request"
4. A 会收到通知，检查你的代码后合并到 main
5. 合并完成后，**拉一下最新代码**：
   ```bash
   git checkout main
   git pull origin main
   # 然后切回自己的分支继续开发
   git checkout feat/home-ui
   ```

---

## 六、如果 main 已经有新代码了，怎么同步到自己的分支

A 可能已经合并了其他人的 PR，你的分支需要跟上：

```bash
# 先切到 main
git checkout main
# 拉最新
git pull origin main
# 切回自己的分支
git checkout feat/home-ui
# 把 main 的新代码合并到自己的分支
git merge main
# 如果有冲突，手动解决后 commit + push（找 A 帮忙）
```

---

## 七、如果遇到冲突（两个人改了同一个文件）

Git 会在文件里标这样的东西：

```
<<<<<<< HEAD
  你写的内容
=======
  队友写的内容
>>>>>>> feat/campus-data
```

处理方法：
1. 打开这个文件，手动把冲突区域改成正确的内容（保留需要的，删除标记线）
2. 保存文件
3. 运行：
   ```bash
   git add 冲突的文件名
   git commit -m "fix: resolve merge conflicts"
   git push
   ```
4. 实在搞不定，找 A 来处理

---

## 八、查看提交记录（验证比赛时间范围内的贡献）

```bash
# 查看所有提交记录（一行一条，简洁）
git log --oneline --decorate --all

# 查看指定时间范围内的提交（黑客松比赛时间：2026-10-23 00:00 到 2026-10-25 20:00）
git log --since="2026-10-23 00:00:00" --until="2026-10-25 20:00:00" --all --date=local

# 查看某个文件是谁改的（比如 scenes.js）
git log -p -- src/data/scenes.js
```

**不要做的事情**：
- ❌ 不要通过修改电脑时间来影响 Git 记录
- ❌ 不要伪造作者（比如用 --author 参数改提交人）
- ❌ 不要把几天的工作压缩成一条 commit 然后在最后一秒提交
- ❌ 不要 force push 到 main 分支
- ❌ 不要用别人的账号提交

**要做的事情**：
- ✅ 每次完成一个小目标就 commit 一次（比如写完 5 条场景就 commit，再写 5 条再 commit）
- ✅ commit 信息真实描述改动内容
- ✅ 保持 commit 频率（一天至少 3~5 条）

---

## 九、常见问题速查

| 问题 | 解决方法 |
|---|---|
| 克隆时提示 "Permission denied" | 找 A 把你加为仓库 Collaborator（GitHub 仓库 Settings → Collaborators） |
| `git push` 提示拒绝 | 你可能在推 main 分支，切回自己的分支再 push：`git checkout feat/home-ui` |
| 忘记 commit 了怎么办 | 直接 `git add . && git commit -m "..." && git push`，哪怕内容多也比没记录好 |
| 想撤销刚刚的 commit | 用 `git reset --soft HEAD~1` （把最后一次提交撤回来，但保留改动） |
| 文件改乱了想恢复 | 用 `git checkout -- 文件名` （把文件恢复到最后一次 commit 的状态，谨慎！） |
