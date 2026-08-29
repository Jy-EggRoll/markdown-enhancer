# Markdown Enhancer

为 VS Code Markdown 预览中的代码块添加一键复制按钮。

## 原理

仅通过 `package.json` 的贡献点实现，无需任何扩展宿主逻辑：

- `contributes.markdown.previewScripts` → `dist/preview.js`：在预览 webview 中为每个 `pre > code` 代码块挂载复制按钮。
- `contributes.markdown.previewStyles` → `dist/media/codicon.css`（官方图标字体）、`markdown-theme.css`（自有主题维护入口）、`copy-button.css`：复制按钮的显示样式。
- `contributes.menus.editor/title` → `markdown.showPreview`：`editorLangId == markdown` 时在编辑器标题栏显示"打开预览"按钮（与内置的"并排打开预览"并存）。

`markdown.previewScripts` / `markdown.previewStyles` 由 VS Code 在渲染 Markdown 预览时自动加载，因此本扩展的 `activationEvents` 为空数组，宿主入口 `src/extension.ts` 为空实现。

## 开发

```bash
pnpm install
pnpm compile        # tsc 类型检查 + esbuild 打包到 dist/
```

按 `F5` 启动扩展宿主，打开任意 `.md` 文件预览，鼠标悬停代码块即可看到右上角的复制按钮。

## 规范

本仓库脚手架（esbuild / tsconfig / .vscode 调试配置 / .vscodeignore 等）沿用 [tree-enhancer](https://github.com/Jy-EggRoll/tree-enhancer) 的约定。
