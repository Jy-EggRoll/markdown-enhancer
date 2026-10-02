/**
 * 单元测试运行器。
 *
 * 设计动机：本扩展的源码使用无扩展名的 TS 导入风格，Node 原生 TS 运行时不支持，
 * 因此先用 esbuild 把测试入口与源码打成单个 CJS 文件，再交给 Node 内置测试运行器。
 *
 * 被测的 previewParsing.ts 不依赖 vscode 或 DOM，所以这里无需别名/桩件——
 * 这也是把解析逻辑从 preview.ts 拆出来的原因之一。
 *
 * 全程复用已有依赖（esbuild），不引入额外测试框架，也不修改任何产品代码。
 */
const esbuild = require("esbuild");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "src/test/suite/index.ts");
const outDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "markdown-enhancer-test-"),
);
const outFile = path.join(outDir, "tests.cjs");

function cleanup() {
  fs.rmSync(outDir, { recursive: true, force: true });
}

async function main() {
  if (!fs.existsSync(entry)) {
    console.error(`未找到测试入口: ${entry}`);
    process.exit(1);
  }

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node20",
    outfile: outFile,
    sourcemap: "inline",
    logLevel: "warning",
  });

  const result = spawnSync(process.execPath, ["--test", outFile], {
    stdio: "inherit",
  });

  cleanup();
  process.exit(result.status ?? 1);
}

main().catch((e) => {
  cleanup();
  console.error(e);
  process.exit(1);
});
