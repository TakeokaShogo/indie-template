import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePluginNode } from "vite-plugin-node";

export default defineConfig((viteStatus) => {
  return {
    // ...vite configures
    server: {
      // vite server の設定
      // 設定できる値の詳細は https://vitejs.dev/config/#server-host で確認できる
      port: 8000, // この npm run vite 実行時、このポートで Node.js サーバーが立ち上がる
    },
    plugins: [
      ...VitePluginNode({
        // Vite Plugin Node の設定
        // デフォルト値でいい場合は省略して問題ない

        // Node.js Webアプリケーションのフレームワークを利用する場合はここで指定する
        // 現在は 'express', 'nest', 'koa' and 'fastify' を利用できる
        adapter: "fastify",

        // エントリーポイントとなるファイルのパスを指定する
        appPath: "./src/app.ts",

        // エントリーポイントのファイルで export したアプリケーションの export name を指定する
        // デフォルトは 'viteNodeApp'
        exportName: "viteNodeApp",
        // TypeScript のコンパイラを選択できる(esbuild or swc)
        // デフォルトは esbuild
        tsCompiler: "esbuild",
      }),
      // viteはデフォルトでは型チェックを行わないので、プラグインで行うように設定する
      // ファイルの更新があったらその都度型チェックを行いたいため、tsc -w --noEmitは使えない
      // vite buildでは型チェックが失敗してもビルドが行われてしまう
      // そのため、型チェックはvite dev時のみにし、vite buildの前にtsc --noEmit && を実行させる
      viteStatus.command === "serve"
        ? checker({ typescript: true })
        : undefined,
    ],
    define: {
      // commandの値は
      // vite, vite dev, vite serve === "serve"
      // vite build === "build"
      IS_DEVELOPMENT_MODE: viteStatus.command === "serve",
    },
    // top level awaitを使えるように指定
    build: {
      target: "esnext",
    },
  };
});
