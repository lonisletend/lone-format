# GitHub Workflows 说明

## 📦 Auto Publish and Merge Workflow

### 🎯 工作流程目标
当您在 main 分支合入新特性代码后，手动将 main 分支合入 publish 分支时，自动触发以下操作：

1. **版本升级** - 自动升级 package.json 中的版本号
2. **构建发布** - 执行 `npm run build:lib` 构建库文件
3. **发布到 npm** - 将新版本发布到 npmjs.org
4. **自动合并** - 创建 PR 并自动合并回 main 分支以同步版本号

### 🔧 使用方法

#### 方法一：推送到 publish 分支（推荐）
```bash
# 在 main 分支开发完新功能后
git checkout publish
git merge main  # 合并 main 到 publish
git push origin publish  # 推送触发工作流
```

#### 方法二：手动触发
在 GitHub Actions 页面手动运行 "Auto Publish and Merge" 工作流，可以选择版本升级类型：
- `patch` - 修复版本 (0.1.0 → 0.1.1)
- `minor` - 功能版本 (0.1.0 → 0.2.0) 
- `major` - 重大版本 (0.1.0 → 1.0.0)

### 📋 前置条件

#### 1. NPM_TOKEN Secret
需要在 GitHub 仓库设置中添加 `NPM_TOKEN` secret：
1. 访问 npmjs.com → Account → Access Tokens
2. 创建一个 "Automation" 类型的 token（重要：必须是 Automation 类型，不能是 Publish 类型）
   - Automation tokens 可以绕过 2FA/OTP 要求
   - Publish tokens 在启用 2FA 时会要求 OTP，导致 GitHub Actions 发布失败
3. 在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加 `NPM_TOKEN`

**注意**：工作流使用 `--provenance` 标志发布包，这是 npm 推荐的最佳实践，可以：
- 提供包的来源证明
- 在某些情况下绕过 OTP 要求
- 增强包的安全性和可信度

#### 2. 分支保护规则（可选）
为了确保自动合并正常工作，建议为 main 分支设置适当的保护规则：
- 允许管理员绕过限制
- 允许自动合并

### 🔄 工作流程详细步骤

1. **触发条件检测** - 检测到 publish 分支有新提交
2. **环境准备** - 检出代码、安装依赖、配置 git
3. **版本类型判断** - 根据提交信息或手动输入决定版本升级类型
4. **版本号升级** - 使用 `npm version` 升级版本号
5. **提交版本变更** - 将版本号变更提交到 publish 分支
6. **构建库文件** - 执行 `npm run build:lib` 构建生产版本
7. **发布到 npm** - 使用 npm publish 发布新版本
8. **创建 PR** - 创建从 publish 到 main 的合并请求
9. **自动合并** - 自动合并 PR 以同步版本号到 main

### 🎨 版本自动判断规则

当通过推送触发时，工作流会根据最新提交信息自动判断版本升级类型：
- 包含 `BREAKING CHANGE` 或 `major:` → major 版本升级
- 包含 `feat:` 或 `minor:` → minor 版本升级  
- 其他情况 → patch 版本升级

### ⚠️ 注意事项

1. **NPM_TOKEN 权限** - 确保 token 有发布包的权限
2. **包名唯一性** - 确保 package.json 中的包名在 npm 上是唯一的
3. **构建成功** - 确保 `npm run build:lib` 能正常执行
4. **网络环境** - GitHub Actions 需要能访问 npmjs.org

### 🛠️ 故障排查

#### 发布失败
- 检查 NPM_TOKEN 是否正确设置
- **检查 NPM_TOKEN 类型是否为 "Automation"**（如果是 "Publish" 类型会在启用 2FA 时要求 OTP）
- 检查包名是否已被占用
- 检查构建过程是否有错误

#### EOTP 错误（要求一次性密码）
如果遇到 `npm error code EOTP` 错误：
1. 确认 NPM_TOKEN 是 "Automation" 类型而不是 "Publish" 类型
2. 确认工作流使用了 `--provenance` 标志（已包含在当前配置中）
3. 如果仍有问题，在 npmjs.com 账户设置中检查 2FA 配置

#### 自动合并失败  
- 检查 main 分支保护规则设置
- 检查 GitHub token 权限
- 手动合并 PR

#### 版本冲突
- 确保没有同时进行多个发布流程
- 检查 package.json 版本号是否正确
