import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("eggroll-markdown-enhancer.showPreview", () =>
            vscode.commands.executeCommand("markdown.showPreview")
        )
    );
}

export function deactivate() {}
