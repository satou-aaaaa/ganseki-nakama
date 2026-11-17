// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、縞のある岩石。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <path d="M14 78 L30 40 L52 30 L78 42 L88 74 Z" fill="#8a7f72" stroke="#fffdf7" stroke-width="3" stroke-linejoin="round"/>
      <g stroke="#f6d77a" stroke-width="4" stroke-linecap="round"><line x1="24" y1="60" x2="80" y2="56"/><line x1="30" y1="48" x2="76" y2="46"/><line x1="20" y1="70" x2="84" y2="66"/></g></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
