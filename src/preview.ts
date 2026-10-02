// 本脚本在 Markdown 预览的 webview 上下文中执行，每次预览渲染或内容变化时会被加载。
// 作用：
//  - 为预览中的每个代码块（pre > code）顶部挂载组合标题栏——左侧语言名（仅 ```lang 围栏时有），右侧复制按钮；
//  - 将 GitHub 风格的特殊引用块（> [!NOTE] 等）转换为带类型色与图标的 callout。
// 解析部分（语言名、callout 类型、标记剔除）在 previewParsing.ts，与 DOM 解耦以便单测。

import {
  CALLOUT_TYPES,
  calloutType,
  codeLanguage,
  stripCalloutMarker,
} from "./previewParsing";

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
    navigator.clipboard
      .writeText(code.textContent ?? "")
      .then(() => {
        icon.className = "codicon codicon-check";
        button.classList.add("copied");
        window.setTimeout(() => {
          icon.className = "codicon codicon-copy";
          button.classList.remove("copied");
          copying = false;
        }, 1000);
      })
      .catch(() => {
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

  const language = codeLanguage(code.className);
  if (language) {
    const lang = document.createElement("span");
    lang.className = "md-enhancer-lang";
    lang.textContent = language;
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

    const type = calloutType(bq.textContent ?? "");
    if (!type) {
      continue;
    }
    const meta = CALLOUT_TYPES[type];

    // 剔除首行的 [!TYPE] 标记文本（保留其余内容）
    removeCalloutMarkerFromDom(bq);

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
function removeCalloutMarkerFromDom(bq: HTMLElement): void {
  const walker = document.createTreeWalker(bq, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const stripped = stripCalloutMarker(textNode.data);
    if (stripped !== textNode.data) {
      textNode.data = stripped;
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
