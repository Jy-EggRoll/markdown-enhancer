// 本脚本在 Markdown 预览的 webview 上下文中执行，每次预览渲染或内容变化时会被加载。
// 作用：为预览中的每个代码块（pre > code）顶部挂载组合标题栏——
// 左侧显示语言名（仅 ```lang 围栏时有），右侧保留一键复制按钮。

const LANGUAGE_RE = /(?:^|\s)language-([\w+-]+)/;

function buildCopyButton(code: HTMLElement): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "md-enhancer-copy-button";
    button.setAttribute("aria-label", "Copy code");

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

    return button;
}

function enhanceCodeBlock(pre: HTMLPreElement, code: HTMLElement): void {
    // 标题栏已存在则跳过，避免重复增强
    if (pre.querySelector(".md-enhancer-header")) {
        return;
    }

    const header = document.createElement("div");
    header.className = "md-enhancer-header";

    const langMatch = code.className.match(LANGUAGE_RE);
    if (langMatch) {
        const lang = document.createElement("span");
        lang.className = "md-enhancer-lang";
        lang.textContent = langMatch[1];
        header.appendChild(lang);
    }

    header.appendChild(buildCopyButton(code));
    pre.appendChild(header);
}

function addEnhancements(): void {
    const codeBlocks = document.querySelectorAll<HTMLPreElement>("pre > code");
    for (const code of codeBlocks) {
        const pre = code.parentElement as HTMLPreElement | null;
        if (pre) {
            enhanceCodeBlock(pre, code);
        }
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

addEnhancements();

// 预览内容更新时重新挂载（脚本重载会丢弃旧 observer，故直接新建即可）
new MutationObserver(() => addEnhancements()).observe(document.body, {
    childList: true,
    subtree: true,
});
