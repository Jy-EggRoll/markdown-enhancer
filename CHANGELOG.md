# 更新日志 | Change Log

## 0.0.1

- ✨ feat: 为 Markdown 预览代码块添加一键复制按钮，图标采用官方 `@vscode/codicons`，按钮配色复用 `--vscode-*` 主题变量（无硬编码、无 i18n 文案）| Add copy buttons to Markdown preview code blocks, using official `@vscode/codicons` for the icon and `--vscode-*` theme variables for button colors (no hardcoded colors, no i18n text)
- ✨ feat: 编辑器标题栏为 `.md` 文件新增"打开预览"按钮（调用内置 `markdown.showPreview`，与原地编辑位置打开预览，与内置"并排打开预览"并存）| Add an "Open Preview" button to the editor title bar for `.md` files (calls built-in `markdown.showPreview`, opening the preview in place, alongside the built-in side-by-side preview)
- 🎨 appe: 内置 Catppuccin 主题 `markdown-theme.css` 作为预览主题维护入口，`copy-button.css` 仅负责复制按钮样式，分层清晰 | Bundle a Catppuccin `markdown-theme.css` as the preview theme entrypoint; `copy-button.css` only handles the copy button, keeping a clear layering
