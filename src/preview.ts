// 本脚本在 Markdown 预览的 webview 上下文中执行，每次预览渲染或内容变化时会被加载。
// 作用：
//  - 为预览中的每个代码块（pre > code）顶部挂载组合标题栏——左侧语言名（仅 ```lang 围栏时有），右侧复制按钮；
//  - 将 GitHub 风格的特殊引用块（> [!NOTE] 等）转换为带类型色与图标的 callout。

const LANGUAGE_RE = /(?:^|\s)language-([\w+-]+)/;

// GitHub 5 种 alert 类型 → 官方 codicon 图标 + 英文标题（与 GitHub 原生一致）
const CALLOUT_TYPES: Record<string, { icon: string; label: string }> = {
    note: { icon: "codicon-info", label: "Note" },
    tip: { icon: "codicon-light-bulb", label: "Tip" },
    important: { icon: "codicon-report", label: "Important" },
    warning: { icon: "codicon-warning", label: "Warning" },
    caution: { icon: "codicon-error", label: "Caution" },
};

const CALLOUT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

function buildCopyButton(code: HTMLElement): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "md-enhancer-copy-button";
    button.setAttribute("aria-label", "Copy code");

    const icon = document.createElement("span");
    icon.className = "codicon codicon-copy";
    button.appendChild(icon);

    let copying = false;
    button.addEventListener("click", () => {
        if (copying) return;
        copying = true;
        navigator.clipboard.writeText(code.textContent ?? "").then(() => {
            icon.className = "codicon codicon-check";
            button.classList.add("copied");
            window.setTimeout(() => {
                icon.className = "codicon codicon-copy";
                button.classList.remove("copied");
                copying = false;
            }, 1000);
        }).catch(() => {
            copying = false;
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

function enhanceCallouts(): void {
    const quotes = document.querySelectorAll<HTMLQuoteElement>("blockquote");
    for (const bq of quotes) {
        // 已增强则跳过，避免重复
        if (bq.classList.contains("md-enhancer-callout")) {
            continue;
        }

        const match = (bq.textContent ?? "").match(CALLOUT_RE);
        if (!match) {
            continue;
        }
        const type = match[1].toLowerCase();
        const meta = CALLOUT_TYPES[type];
        if (!meta) {
            continue;
        }

        // 剔除首行的 [!TYPE] 标记文本（保留其余内容）
        stripCalloutMarker(bq);

        bq.classList.add("md-enhancer-callout", `md-enhancer-callout-${type}`);

        const title = document.createElement("div");
        title.className = "md-enhancer-callout-title";
        const icon = document.createElement("span");
        icon.className = `codicon ${meta.icon}`;
        const label = document.createElement("span");
        label.className = "md-enhancer-callout-label";
        label.textContent = meta.label;
        title.append(icon, label);
        bq.insertBefore(title, bq.firstChild);
    }
}

// 从 blockquote 文本节点中移除 [!TYPE] 标记；若标记独占一个空段落则一并删去，避免多余空行
function stripCalloutMarker(bq: HTMLElement): void {
    const walker = document.createTreeWalker(bq, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const m = textNode.data.match(CALLOUT_RE);
        if (m) {
            const marker = m[0];
            const idx = textNode.data.indexOf(marker);
            const rest = textNode.data.slice(idx + marker.length).replace(/^\s+/, "");
            textNode.data = textNode.data.slice(0, idx) + rest;
            const parent = textNode.parentElement;
            if (
                parent &&
                parent.tagName === "P" &&
                parent.childNodes.length === 1 &&
                (parent.textContent ?? "").trim() === ""
            ) {
                parent.remove();
            }
            return;
        }
    }
}

function addEnhancements(): void {
    const codeBlocks = document.querySelectorAll<HTMLPreElement>("pre > code");
    for (const code of codeBlocks) {
        const pre = code.parentElement as HTMLPreElement | null;
        if (pre) {
            enhanceCodeBlock(pre, code);
        }
    }
    enhanceCallouts();
}

addEnhancements();

// 预览内容更新时重新挂载（脚本重载会丢弃旧 observer，故直接新建即可）
new MutationObserver(() => addEnhancements()).observe(document.body, {
    childList: true,
    subtree: true,
});
