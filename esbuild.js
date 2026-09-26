const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");

/** 两个入口共用同一份构建配置，差异只在各自的 entry/platform/format */
async function build(options) {
  await esbuild.build({
    bundle: true,
    minify: production,
    sourcemap: true,
    sourcesContent: false,
    ...options,
  });
}

/**
 * 把官方 @vscode/codicons 的样式与字体拷贝到 dist/media，
 * 供 Markdown 预览 webview 通过 markdown.previewStyles 注入。
 * 直接复用官方资源，避免硬编码 SVG / 手动同步图标更新。
 */
function copyCodicon() {
  const src = path.dirname(require.resolve("@vscode/codicons/package.json"));
  const dest = path.join(__dirname, "dist", "media");
  fs.mkdirSync(dest, { recursive: true });
  for (const file of ["codicon.css", "codicon.ttf"]) {
    fs.copyFileSync(path.join(src, "dist", file), path.join(dest, file));
  }
}

async function main() {
  // 每次构建前清理 dist，防止旧产物残留
  fs.rmSync(path.join(__dirname, "dist"), { recursive: true, force: true });

  // 扩展宿主脚本：node/cjs，仅占位（本扩展无宿主逻辑），供 VSCode 加载。
  await build({
    entryPoints: ["src/extension.ts"],
    platform: "node",
    format: "cjs",
    outfile: "dist/extension.js",
    external: ["vscode"],
  });

  // Markdown 预览注入脚本：运行在预览 webview（浏览器环境），故用 browser/iife。
  await build({
    entryPoints: ["src/preview.ts"],
    platform: "browser",
    format: "iife",
    outfile: "dist/preview.js",
  });

  // 拷贝官方 codicon 资源（css 内 @font-face 用相对 ./codicon.ttf，与 css 同目录即可加载）
  copyCodicon();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
