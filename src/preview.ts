// 本脚本在 Markdown 预览的 webview 上下文中执行，每次预览渲染或内容变化时会被加载。
// 作用：为预览中的每个代码块（pre > code）右上角挂载一个"复制"按钮。

function addCopyButtons(): void {
    const codeBlocks = document.querySelectorAll<HTMLPreElement>("pre > code");
    for (const code of codeBlocks) {
        const pre = code.parentElement as HTMLPreElement | null;
        // 跳过无 pre 容器或已挂载按钮的代码块，避免重复添加
        if (!pre || pre.querySelector(".copy-button")) {
            continue;
        }

        const button = document.createElement("button");
        button.className = "copy-button";

        // 图标走官方 codicon 字体（currentColor 继承按钮 color），不硬编码 SVG，无文字故无需 i18n
        const icon = document.createElement("span");
        icon.className = "codicon codicon-copy";
        button.appendChild(icon);

        button.addEventListener("click", () => {
            const text = code.textContent ?? "";
            copyText(text).then((ok) => {
                if (ok) {
                    icon.className = "codicon codicon-check";
                    button.classList.add("copied");
                }
                window.setTimeout(() => {
                    icon.className = "codicon codicon-copy";
                    button.classList.remove("copied");
                }, 1500);
            });
        });

        pre.appendChild(button);
    }
}

async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // 降级：部分 webview 环境无 clipboard API，使用临时 textarea + execCommand
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
    }
}

addCopyButtons();

// 预览内容更新时重新挂载按钮（脚本重载会丢弃旧 observer，故直接新建即可）
new MutationObserver(() => addCopyButtons()).observe(document.body, {
    childList: true,
    subtree: true,
});
