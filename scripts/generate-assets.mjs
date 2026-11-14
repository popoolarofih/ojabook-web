/**
 * Renders the PNG icons and the social sharing image from SVG and HTML using the Chromium that
 * Playwright already provides. Run once with `npm run assets` and commit the output.
 */
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'), 'utf8');
const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
mkdirSync(resolve(root, 'public/icons'), { recursive: true });

// CHROMIUM_PATH lets CI or a dev machine point at its own browser. Default: Playwright's own.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();

async function shot(html, width, height, file) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: resolve(root, file), omitBackground: false });
}

const icon = (size, pad = 0, bg = 'transparent') =>
  `<body style="margin:0;background:${bg}"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center"><img src="${dataUri}" style="width:${size - pad * 2}px;height:${size - pad * 2}px"/></div></body>`;

await shot(icon(192), 192, 192, 'public/icons/icon-192.png');
await shot(icon(512), 512, 512, 'public/icons/icon-512.png');
await shot(icon(180), 180, 180, 'public/icons/apple-touch-icon.png');
// Maskable icons need the artwork inside the safe zone on a solid background.
await shot(icon(512, 96, '#105BFF'), 512, 512, 'public/icons/icon-maskable-512.png');

await shot(
  `<body style="margin:0;width:1200px;height:630px;background:#21232E;font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box;gap:28px">
    <div style="display:flex;align-items:center;gap:16px"><img src="${dataUri}" style="width:56px;height:56px"/><span style="font-size:40px;font-weight:600">OjaBook</span></div>
    <div style="font-size:76px;line-height:1.05;font-weight:600;max-width:900px">Your business. Your numbers. Your control.</div>
    <div style="font-size:30px;color:#B8BCCB;max-width:820px;line-height:1.35">Sales, stock, debts and expenses for Nigerian businesses. Works offline.</div>
    <div style="width:160px;height:8px;border-radius:4px;background:#FE8500"></div>
  </body>`,
  1200, 630, 'public/og.png',
);

await browser.close();
console.log('Assets written to public/');
