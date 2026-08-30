const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * 编译期问题输出插件：在 watch 模式下打印构建开始/结束与错误信息，
 * 与 tree-enhancer 的 esbuild 配置保持一致。
 */
const problemMatcher = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => console.log('[watch] build started'));
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
            });
            console.log('[watch] build finished');
        });
    },
};

async function makeContext(options) {
    const ctx = await esbuild.context({
        bundle: true,
        minify: production,
        sourcemap: true,
        sourcesContent: false,
        logLevel: 'silent',
        plugins: [problemMatcher],
        ...options,
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
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
    await makeContext({
        entryPoints: ['src/extension.ts'],
        platform: 'node',
        format: 'cjs',
        outfile: 'dist/extension.js',
        external: ['vscode'],
    });

    // Markdown 预览注入脚本：运行在预览 webview（浏览器环境），故用 browser/iife。
    await makeContext({
        entryPoints: ['src/preview.ts'],
        platform: 'browser',
        format: 'iife',
        outfile: 'dist/preview.js',
    });

    // 拷贝官方 codicon 资源（css 内 @font-face 用相对 ./codicon.ttf，与 css 同目录即可加载）
    copyCodicon();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
