# 发布工作流程说明

## 📋 概述

当代码推送到 `main` 分支时，GitHub Actions 会自动执行以下流程：

## 🔄 工作流程

### 1. 触发条件
- **自动触发**: Push 到 `main` 分支
- **手动触发**: 通过 GitHub Actions UI 手动执行（可选择版本类型）

### 2. 执行步骤

#### Step 1: 在 main 分支升级版本
1. Checkout `main` 分支
2. 安装依赖
3. 根据提交信息自动判断版本升级类型：
   - `BREAKING CHANGE` 或 `major:` → major 版本
   - `feat:` 或 `minor:` → minor 版本
   - 其他 → patch 版本
4. 执行 `npm version` 升级版本号
5. 提交版本变更到 `main` 分支（带 `[skip ci]` 避免循环触发）

#### Step 2: 合并到 publish 分支
1. Fetch `publish` 分支（如不存在则创建）
2. 切换到 `publish` 分支
3. 将 `main` 分支合并到 `publish`
4. 推送 `publish` 分支

#### Step 3: 构建和发布
1. 在 `publish` 分支执行 `npm run build:lib`
2. 发布到 npm（使用 NPM_TOKEN secret）
3. 创建 Git Tag（格式：`vX.Y.Z`）
4. 推送 Tag 到远程仓库

### 3. 通知结果
- ✅ 成功：显示发布的版本号
- ❌ 失败：显示错误信息

## 🎯 分支策略

- **main**: 开发主分支，所有功能开发完成后合并到此分支
- **publish**: 发布分支，从 main 合并，用于构建和发布到 npm
- **dev**: 开发分支（可选），用于日常开发

## 📝 提交信息规范

为了自动判断版本升级类型，建议遵循以下提交信息规范：

- `feat: 新功能` → 触发 minor 版本升级
- `fix: 修复bug` → 触发 patch 版本升级
- `BREAKING CHANGE: 重大变更` → 触发 major 版本升级
- `chore: 日常维护` → 触发 patch 版本升级

## ⚙️ 配置要求

### GitHub Secrets
需要在 GitHub 仓库设置中添加以下 Secret：

- `NPM_TOKEN`: npm 发布令牌
  - 获取方式：npm 官网 → Access Tokens → Generate New Token → Automation

### 权限设置
工作流需要以下权限：
- `contents: write` - 写入仓库内容
- `pull-requests: write` - 创建 PR
- `packages: write` - 发布包

## 🚀 使用示例

### 自动发布（推荐）
```bash
# 1. 在 dev 分支开发
git checkout dev
# ... 进行开发 ...

# 2. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin dev

# 3. 合并到 main 分支
git checkout main
git merge dev
git push origin main  # 这会自动触发发布流程
```

### 手动发布
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Auto Publish and Merge" 工作流
4. 点击 "Run workflow"
5. 选择版本类型（patch/minor/major）
6. 点击 "Run workflow" 按钮

## 🔍 监控和调试

### 查看发布状态
1. 访问仓库的 Actions 页面
2. 查看最新的工作流运行记录
3. 点击查看详细日志

### 常见问题

**Q: 发布失败怎么办？**
A: 检查以下几点：
- NPM_TOKEN 是否正确配置
- package.json 中的 name 和 version 是否正确
- 是否有足够的权限发布到 npm

**Q: 如何跳过自动发布？**
A: 在提交信息中添加 `[skip ci]`

**Q: 如何回滚版本？**
A: 需要手动执行：
```bash
npm unpublish <package-name>@<version>
git tag -d v<version>
git push origin :refs/tags/v<version>
```

## 📌 注意事项

1. **避免循环触发**: 版本提交使用 `[skip ci]` 标记
2. **分支保护**: 建议为 `main` 和 `publish` 分支启用保护规则
3. **发布前测试**: 确保在 `dev` 分支充分测试后再合并到 `main`
4. **版本管理**: 遵循语义化版本规范（Semantic Versioning）
