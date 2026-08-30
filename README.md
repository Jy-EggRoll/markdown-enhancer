# EggRoll Markdown Enhancer

为 VS Code Markdown 预览中的代码块增强展示：顶部组合标题栏显示语言名，并提供常驻的一键复制按钮。

## 原理

仅通过 `package.json` 的贡献点实现，无需任何扩展宿主逻辑：

- `contributes.markdown.previewScripts` → `dist/preview.js`：在预览 webview 中为每个 `pre > code` 代码块挂载顶部组合标题栏（左侧语言名、右侧复制按钮）。
- `contributes.markdown.previewStyles` → `dist/media/codicon.css`（官方图标字体）、`markdown-theme.css`（自有主题维护入口/ Catppuccin 变量）、`code-block.css`（顶部标题栏、语言名与复制按钮样式）、`callout.css`（GitHub 风格引用块的 callout 样式）。
- `contributes.menus.editor/title` → `markdown.showPreview`：`editorLangId == markdown` 时在编辑器标题栏显示"打开预览"按钮（与内置的"并排打开预览"并存）。

`markdown.previewScripts` / `markdown.previewStyles` 由 VS Code 在渲染 Markdown 预览时自动加载；扩展宿主（`src/extension.ts`）仅把"打开预览"命令转发到 VS Code 内置预览，无额外逻辑。

## 开发

```bash
pnpm install
pnpm compile        # tsc 类型检查 + esbuild 开发构建到 dist/（用于 F5 调试）
pnpm run package    # 生产构建（esbuild --production 压缩），用于本地打 .vsix
```

按 `F5` 启动扩展宿主，打开任意 `.md` 文件预览，即可看到每个代码块顶部的标题栏：左侧为语言名（仅 `lang` 围栏时显示），右侧为常驻的复制按钮。

## 发版

本扩展通过 GitHub Actions 自动构建与发布，流程见 [RELEASE.md](./RELEASE.md)。

## 规范

本仓库脚手架（esbuild / tsconfig / .vscode 调试配置 / .vscodeignore 等）沿用 [tree-enhancer](https://github.com/Jy-EggRoll/tree-enhancer) 的约定。
