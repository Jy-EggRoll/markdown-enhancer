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

// 复制结果（成功/失败）反馈状态的可见时长，统一在此调整
const COPY_FEEDBACK_MS = 1000;

// 复制兜底：选中代码后调用 execCommand('copy')。该 API 虽已废弃，但不受剪贴板权限模型约束，
// 是 VS Code 内置预览在 clipboard 写入被拒时使用的降级路径，故沿用同一策略以提高成功率
function legacyCopy(code: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection) return false;
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(code);
  selection.addRange(range);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    selection.removeAllRanges();
  }
}

function buildCopyButton(code: HTMLElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "md-enhancer-copy-button";
  button.setAttribute("aria-label", "Copy code");

  const icon = document.createElement("span");
  icon.className = "codicon codicon-copy";
  button.appendChild(icon);

  let busy = false;

  // 复制结果反馈：图标与按钮状态短暂切换后复原；成功与失败共用同一段收尾逻辑
  const flash = (stateClass: string, iconClass: string): void => {
    icon.className = `codicon ${iconClass}`;
    button.classList.add(stateClass);
    window.setTimeout(() => {
      icon.className = "codicon codicon-copy";
      button.classList.remove(stateClass);
      busy = false;
    }, COPY_FEEDBACK_MS);
  };

  const succeed = (): void => flash("copied", "codicon-check");
  const fail = (): void => flash("failed", "codicon-error");

  button.addEventListener("click", () => {
    if (busy) return;
    busy = true;

    // 剪贴板 API 可能整体缺失（webview 权限被拒 / 非安全上下文）。此时访问 writeText
    // 会同步抛错，Promise 链上的 catch 捕不到，busy 会永久卡在 true 导致此后点击全失效；
    // 故先显式探测，缺失时直接走兜底
    if (!navigator.clipboard?.writeText) {
      legacyCopy(code) ? succeed() : fail();
      return;
    }

    navigator.clipboard
      .writeText(code.textContent ?? "")
      .then(succeed)
      // 写入被拒时退回 execCommand 兜底（与 VS Code 内置预览同策略）；两条路径都失败才报错
      .catch(() => (legacyCopy(code) ? succeed() : fail()));
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
