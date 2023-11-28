const path = require("path");

module.exports = {
  reactStrictMode: true,
  // ここにimportするworkspaceパッケージを記述する
  // transpilePackages: ["@repo/ui"],
  output: "standalone",
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};
