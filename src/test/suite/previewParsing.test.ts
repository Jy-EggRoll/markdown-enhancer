import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CALLOUT_TYPES,
  calloutType,
  codeLanguage,
  stripCalloutMarker,
} from "../../previewParsing";

/**
 * previewParsing 单元测试。
 *
 * 这些是 preview.ts 里最容易出错、又最难靠肉眼发现的部分：语言名正则、
 * callout 类型识别、标记剔除。它们原先散落在 webview 脚本里、顶部还有
 * `addEnhancements()` 副作用，无法直接测；现拆成不依赖 DOM 的模块后在此锁定行为。
 *
 * 注意：CALLOUT_RE 由 CALLOUT_TYPES 派生，所以「类型清单」与「识别结果」
 * 必须始终一致——最后一组用例专门守住这条。
 */

describe("codeLanguage：从 <code> 的 className 取语言名", () => {
  test("单个 language- 类", () => {
    assert.equal(codeLanguage("language-ts"), "ts");
  });

  test("多个类名时仍能取到", () => {
    assert.equal(codeLanguage("hljs language-js"), "js");
    assert.equal(codeLanguage("language-x extra-class"), "x");
  });

  test("语言名允许包含 + 与 -", () => {
    assert.equal(codeLanguage("language-c++"), "c++");
    assert.equal(codeLanguage("language-objective-c"), "objective-c");
  });

  test("没有 language- 前缀时为 null", () => {
    assert.equal(codeLanguage(""), null);
    assert.equal(codeLanguage("hljs"), null);
    // "no-language" 里的 language- 前面是 "-" 而非空白/行首，不应命中
    assert.equal(codeLanguage("no-language"), null);
  });

  test("只有前缀、没有语言名时为 null", () => {
    assert.equal(codeLanguage("language-"), null);
  });
});

describe("calloutType：识别 GitHub alert 类型", () => {
  test("五种类型均可识别", () => {
    assert.equal(calloutType("[!NOTE]"), "note");
    assert.equal(calloutType("[!TIP]"), "tip");
    assert.equal(calloutType("[!IMPORTANT]"), "important");
    assert.equal(calloutType("[!WARNING]"), "warning");
    assert.equal(calloutType("[!CAUTION]"), "caution");
  });

  test("大小写不敏感，允许前导空白", () => {
    assert.equal(calloutType("  [!tip] body"), "tip");
    assert.equal(calloutType("[!Caution] body"), "caution");
  });

  test("标记后带正文时仍识别", () => {
    assert.equal(calloutType("[!NOTE] 正文"), "note");
  });

  test("未知类型与普通文本返回 null", () => {
    assert.equal(calloutType("[!UNKNOWN] x"), null);
    assert.equal(calloutType("just text"), null);
    assert.equal(calloutType(""), null);
  });

  test("原型链键名不会被误判为合法类型", () => {
    assert.equal(calloutType("[!toString] x"), null);
    assert.equal(calloutType("[!constructor] x"), null);
  });
});

describe("stripCalloutMarker：剔除 [!TYPE] 标记", () => {
  test("移除标记及其后的空白，保留正文", () => {
    assert.equal(stripCalloutMarker("[!NOTE] hello"), "hello");
    assert.equal(stripCalloutMarker("  [!TIP]   spaced"), "spaced");
  });

  test("标记独占首行时吃掉换行", () => {
    assert.equal(stripCalloutMarker("[!note]\n\nbody"), "body");
  });

  test("标记后无内容时得到空串（由 DOM 层决定删掉空段落）", () => {
    assert.equal(stripCalloutMarker("[!NOTE]"), "");
  });

  test("无标记时原样返回", () => {
    assert.equal(stripCalloutMarker("no marker here"), "no marker here");
  });

  test("未知类型不剔除（剔除同样以已知类型表为准）", () => {
    assert.equal(stripCalloutMarker("[!UNKNOWN] x"), "[!UNKNOWN] x");
  });
});

describe("CALLOUT_TYPES：类型表与识别结果必须一致", () => {
  test("恰为 GitHub 的五种 alert", () => {
    assert.deepEqual(Object.keys(CALLOUT_TYPES).sort(), [
      "caution",
      "important",
      "note",
      "tip",
      "warning",
    ]);
  });

  test("类型到图标/标题的映射（与 GitHub 原生一致）", () => {
    assert.deepEqual(CALLOUT_TYPES.note, {
      icon: "codicon-info",
      label: "Note",
    });
    assert.deepEqual(CALLOUT_TYPES.tip, {
      icon: "codicon-light-bulb",
      label: "Tip",
    });
    assert.deepEqual(CALLOUT_TYPES.important, {
      icon: "codicon-report",
      label: "Important",
    });
    assert.deepEqual(CALLOUT_TYPES.warning, {
      icon: "codicon-warning",
      label: "Warning",
    });
    assert.deepEqual(CALLOUT_TYPES.caution, {
      icon: "codicon-error",
      label: "Caution",
    });
  });

  test("每个类型都能被 calloutType 识别（避免类型表与正则脱节）", () => {
    for (const type of Object.keys(CALLOUT_TYPES)) {
      assert.equal(
        calloutType(`[!${type.toUpperCase()}] x`),
        type,
        `缺少对 ${type} 的识别`,
      );
    }
  });
});
