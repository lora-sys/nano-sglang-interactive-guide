# GitHub Pages 部署

## 自动创建仓库

```bash
gh auth login
bash scripts/publish-github.sh YOUR_GITHUB_USERNAME nano-sglang-interactive-guide
```

## 手动推送

```bash
git init
git branch -M main
git add .
git commit -m "feat: initial nano-sglang interactive guide"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO.git
git push -u origin main
```

进入：`Settings → Pages → Build and deployment → Source → GitHub Actions`。

站点通常会发布到：

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/
```
