# 001 拾贝工具箱

纯前端、零依赖、免费部署的小工具合集，是系统的第一个常青数字资产。

## 变现路径

1. **广告**：访问量起来后接入 AdSense 或国内广告联盟。
2. **打赏**：页脚/侧栏提供打赏入口（微信赞赏码）。
3. **源码模板销售**：整套工具站源码 + 部署教程在闲鱼/淘宝售卖。
4. **高级版**：后续增加需要登录/云存储的功能作为付费点。

可直接售卖的源码包：[拾贝工具箱源码包.zip](拾贝工具箱源码包.zip)（由 `pack_source.py` 生成，含部署配置与交付说明）。

## 技术说明

- 单页应用，HTML + CSS + Vanilla JS，无构建步骤
- 所有工具在浏览器本地运行，无后端、无 API Key、无隐私问题
- 打开 `index.html` 即可使用，也可直接部署到 Vercel/Netlify/GitHub Pages

## 部署方式（任选）

- **Vercel**：导入本目录，框架选 Static，零配置
- **Netlify**：Build command 留空，Publish directory 填 `.`
- **GitHub Pages**：把本目录推到仓库根目录，开启 Pages

项目已包含 `vercel.json`、`netlify.toml`、`robots.txt` 和 `sitemap.xml`。

## SEO 内容页

- `seo/json.html`：JSON 格式化工具指南
- `seo/timestamp.html`：时间戳转换工具指南
- `seo/word-counter.html`：字数统计工具指南
- `seo/base64.html`：Base64 编解码工具指南
- `seo/regex.html`：正则测试工具指南
- `seo/color.html`：颜色转换工具指南
- `seo/diff.html`：文本对比工具指南
- `seo/base-convert.html`：进制转换工具指南
- `seo/url-encode.html`：URL 编码解码工具指南
- `seo/json-minify.html`：JSON 压缩工具指南
- `seo/timestamp-ms.html`：毫秒时间戳转换工具指南

每页包含独立标题、描述、FAQ 结构化数据和站内互链，部署后把 `sitemap.xml` 中的示例域名替换为真实域名即可提交收录。

## 上线检查清单

- [ ] 域名解析（或用 `*.vercel.app` / `*.netlify.app` 免费域名）
- [ ] 替换打赏弹窗中的收款码占位
- [ ] 提交站点到 Google Search Console / 百度站长平台
- [ ] 生成并提交 sitemap
