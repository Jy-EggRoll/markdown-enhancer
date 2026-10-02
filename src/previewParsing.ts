// Markdown 预览增强的纯解析逻辑：只吃字符串、只吐字符串/类型，不碰 DOM，
// 因此可以在扩展宿主之外直接单元测试。DOM 挂载仍留在 preview.ts。

const LANGUAGE_RE = /(?:^|\s)language-([\w+-]+)/;

// GitHub 5 种 alert 类型 → 官方 codicon 图标 + 英文标题（与 GitHub 原生一致）
export const CALLOUT_TYPES = {
  note: { icon: "codicon-info", label: "Note" },
  tip: { icon: "codicon-light-bulb", label: "Tip" },
  important: { icon: "codicon-report", label: "Important" },
  warning: { icon: "codicon-warning", label: "Warning" },
  caution: { icon: "codicon-error", label: "Caution" },
} as const;

export type CalloutType = keyof typeof CALLOUT_TYPES;

// 类型清单由 CALLOUT_TYPES 派生，新增类型只需改上面一处
const CALLOUT_RE = new RegExp(
  `^\\s*\\[!(${Object.keys(CALLOUT_TYPES).join("|")})\\]`,
  "i",
);

function isCalloutType(value: string): value is CalloutType {
  // 用 hasOwn 而非 `in`，避免把原型链上的键（toString 等）当成合法类型
  return Object.hasOwn(CALLOUT_TYPES, value);
}

/** 从 `<code>` 的 className 取语言名；没有 `language-xxx` 时返回 null */
export function codeLanguage(className: string): string | null {
  return className.match(LANGUAGE_RE)?.[1] ?? null;
}

/**
 * 从文本中识别 callout 类型（大小写不敏感，允许前导空白）。
 * 只认 CALLOUT_TYPES 里的类型，其余一律 null。
 */
export function calloutType(text: string): CalloutType | null {
  const match = text.match(CALLOUT_RE);
  if (!match) return null;
  const type = match[1].toLowerCase();
  return isCalloutType(type) ? type : null;
}

/** 剔除文本中的 `[!TYPE]` 标记并吃掉紧随其后的空白，保留其余内容 */
export function stripCalloutMarker(text: string): string {
  const match = text.match(CALLOUT_RE);
  if (!match) return text;
  const marker = match[0];
  const index = text.indexOf(marker);
  const rest = text.slice(index + marker.length).replace(/^\s+/, "");
  return text.slice(0, index) + rest;
}
