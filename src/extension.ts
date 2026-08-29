import * as vscode from "vscode";

/**
 * 本扩展仅通过 package.json 的 markdown.previewScripts / markdown.previewStyles
 * 贡献点向 Markdown 预览注入"复制按钮"脚本与样式，扩展宿主侧无需注册任何命令或逻辑，
 * 因此 activate 为空实现，仅保留入口以满足扩展宿主加载规范。
 */
export function activate(context: vscode.ExtensionContext) {}

export function deactivate() {}
