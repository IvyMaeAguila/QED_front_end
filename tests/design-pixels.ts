import { expect, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import fs from "node:fs";

const pixelLuminance = (png: PNG, pixel: number) => [0, 1, 2].map(channel => png.data[pixel * 4 + channel] / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total, value, channel) => total + value * [.2126, .7152, .0722][channel], 0);
const distinguishable = (a: PNG, b: PNG, pixel: number) => {
  const first = pixelLuminance(a, pixel), second = pixelLuminance(b, pixel);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05) >= 1.03;
};

/** Sample the rendered center of a text bar against its actual composited surface. */
export async function checkRenderedContrast(shape: Locator, name: string) {
  await shape.scrollIntoViewIfNeeded();
  const clip = (await shape.boundingBox())!;
  const capture = async () => PNG.sync.read(await shape.page().screenshot({ clip }));
  await shape.evaluate(element => { for (const animation of element.getAnimations({ subtree: true })) animation.pause(); });
  const sweep = shape.locator("[data-sk-shimmer]");
  await sweep.evaluate(element => { (element as HTMLElement).style.visibility = "hidden"; });
  const base = await capture();
  await shape.evaluate(element => { (element as HTMLElement).style.visibility = "hidden"; });
  const blank = await capture();
  await shape.evaluate(element => { (element as HTMLElement).style.visibility = ""; });
  await sweep.evaluate(element => { (element as HTMLElement).style.visibility = ""; for (const animation of element.getAnimations()) animation.currentTime = 900; });
  const shine = await capture();
  const pixel = Math.floor(base.height / 2) * base.width + Math.floor(base.width / 2);
  const ratio = (frame: PNG) => {
    const first = pixelLuminance(frame, pixel), second = pixelLuminance(blank, pixel);
    return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
  };
  expect(ratio(base), `${name}: base/surface contrast`).toBeGreaterThanOrEqual(1.1);
  expect(ratio(base), `${name}: base/surface contrast`).toBeLessThanOrEqual(2);
  expect(ratio(shine), `${name}: shine/surface contrast`).toBeGreaterThanOrEqual(1.03);
}

/** Compare rendered shape pixels with its own blank and static-base references. */
export async function checkShimmerPixels(shape: Locator, name: string) {
  await expect(shape).toBeVisible();
  await shape.scrollIntoViewIfNeeded();
  const clip = (await shape.boundingBox())!;
  const capture = () => shape.page().screenshot({ clip });
  await shape.evaluate(element => { for (const animation of element.getAnimations({ subtree: true })) animation.pause(); });
  const sweep = shape.locator("[data-sk-shimmer]");
  await sweep.evaluate(element => { (element as HTMLElement).style.visibility = "hidden"; });
  const base = PNG.sync.read(await capture());
  await shape.evaluate(element => { (element as HTMLElement).style.visibility = "hidden"; });
  const blank = PNG.sync.read(await capture());
  await shape.evaluate(element => { (element as HTMLElement).style.visibility = ""; });
  await sweep.evaluate(element => { (element as HTMLElement).style.visibility = ""; });
  const mask = Array.from({ length: base.width * base.height }, (_, index) => distinguishable(base, blank, index));
  const staticArea = mask.filter(Boolean).length;
  expect(staticArea, `${name}: static shape must be measurable`).toBeGreaterThan(0);
  fs.mkdirSync("loading-screenshots/phases", { recursive: true });
  for (const phase of [0, .25, .5, .75]) {
    await shape.evaluate((element, phase) => { for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = Number(animation.effect!.getTiming().duration) * phase; }, phase);
    const buffer = await capture();
    fs.writeFileSync(`loading-screenshots/phases/${name}-${phase * 100}.png`, buffer);
    const frame = PNG.sync.read(buffer);
    const visibleArea = mask.reduce((sum, included, index) => sum + Number(included && distinguishable(frame, blank, index)), 0);
    expect(visibleArea / staticArea, `${name}: visible area at ${phase * 100}%`).toBeGreaterThanOrEqual(.9);
    // Ignore the outside silhouette; an interior sweep must have feathered edges.
    let maximumJump = 0;
    for (let y = 1; y < frame.height - 1; y++) for (let x = 2; x < frame.width - 2; x++) {
      const index = y * frame.width + x;
      if (![index - 1, index, index + 1].every(pixel => mask[pixel])) continue;
      // Rounded/clip-path antialiasing is part of the static silhouette, not a shimmer edge.
      if ([0, 1, 2].some(channel => Math.abs(base.data[index * 4 + channel] - base.data[(index - 1) * 4 + channel]) > 2)) continue;
      const jump = Math.max(...[0, 1, 2].map(channel => Math.abs(frame.data[index * 4 + channel] - frame.data[(index - 1) * 4 + channel])));
      maximumJump = Math.max(maximumJump, jump);
    }
    expect(maximumJump, `${name}: hard interior sweep edge`).toBeLessThanOrEqual(8);
  }
}

export async function staticText(page: Page) {
  return page.locator("[data-sk-static]").evaluateAll(elements => elements.map(element => {
    const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(" ").replace(/\s+/g, " ").trim();
    const rect = element.getBoundingClientRect();
    return { name: element.getAttribute("data-sk-region"), text, readable: !element.closest('[aria-hidden="true"], .sk-primitive, [data-sk-reserved]:not(.sk-frame)') && getComputedStyle(element).visibility !== "hidden" && rect.width > 0 && rect.height > 0 };
  }).filter(item => item.text));
}

export async function assertNoDataSpinner(page: Page) {
  const failures = await page.evaluate(() => {
    // QedBootstrapLoader is the sole brand-loader exception while the role is unknown.
    const actionable = (element: Element) => !!element.closest('button, [data-upload-progress], [data-sk-region="auth-bootstrap"] [data-bootstrap-loader="QedBootstrapLoader"]');
    const visible = (element: Element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden"; };
    const patterns = [...document.querySelectorAll('[role="progressbar"], .animate-spin, .qed-loader, .qed-spinner, .qed-wrap, .qed-splash, .MuiCircularProgress-root, .ant-spin')].filter(element => visible(element) && !actionable(element));
    const loadingText = [...document.querySelectorAll("body *")].filter(element => visible(element) && !actionable(element) && !element.closest('[role="status"].sk-status') && [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && /^\s*loading(?:\s+[^.]+)?(?:\.{3}|…)\s*$/i.test(node.textContent ?? "")));
    return [...patterns, ...loadingText].map(element => element.outerHTML.slice(0, 240));
  });
  expect(failures, "data-loading spinner/text outside preserved actions").toEqual([]);
}

/** Fixed shapes are compared within the same real region. Its origin can move once
 * when an earlier VARIABLE field resizes; size and internal placement stay strict.
 * Call while pending, then call the returned verifier after the real content settles.
 */
export async function captureFixedOverlay(page: Page, name: string, selectors: string[]) {
  const regions = [];
  for (const selector of selectors) {
    const target = page.locator(selector);
    await expect(target).toHaveCount(1);
    const box = await target.boundingBox();
    expect(box, `${name}: pending fixed region ${selector}`).not.toBeNull();
    regions.push({ selector, box: box! });
  }
  const shapes = page.locator(selectors.map(selector => `${selector} [data-sk-primitive]`).join(", "));
  expect(await shapes.count(), `${name}: fixed-region shapes must exist`).toBeGreaterThan(0);
  await shapes.evaluateAll(elements => { for (const element of elements) for (const animation of element.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 0; } });
  const shapeBoxes = await shapes.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  const pending = PNG.sync.read(await page.screenshot());
  const previousVisibility = await shapes.evaluateAll(elements => elements.map(element => { const old = (element as HTMLElement).style.visibility; (element as HTMLElement).style.visibility = "hidden"; return old; }));
  const blank = PNG.sync.read(await page.screenshot());
  await shapes.evaluateAll((elements, previous) => elements.forEach((element, index) => { (element as HTMLElement).style.visibility = previous[index]; }), previousVisibility);
  const pixels: { x: number; y: number; region: number }[] = [];
  for (let y = 0; y < pending.height; y++) for (let x = 0; x < pending.width; x++) {
    if (!shapeBoxes.some(box => x + .5 >= box.x && x + .5 < box.x + box.width && y + .5 >= box.y && y + .5 < box.y + box.height)) continue;
    if (!distinguishable(pending, blank, y * pending.width + x)) continue;
    // Associate each shape with the nearest selected fixed field, even when a
    // deliberately broken shape extends outside that field (negative control).
    const region = regions.reduce((best, item, index) => {
      const distance = (box: typeof item.box) => Math.max(box.x - x, 0, x - box.x - box.width) ** 2 + Math.max(box.y - y, 0, y - box.y - box.height) ** 2;
      return distance(item.box) < distance(regions[best].box) ? index : best;
    }, 0);
    pixels.push({ x, y, region });
  }
  expect(pixels.length, `${name}: visible fixed shape pixels`).toBeGreaterThan(0);
  return async () => {
    const loadedBoxes = [];
    for (const region of regions) {
      const box = await page.locator(region.selector).boundingBox();
      expect(box, `${name}: loaded matching region ${region.selector}`).not.toBeNull();
      loadedBoxes.push(box!);
    }
    const loaded = PNG.sync.read(await page.screenshot());
    let outside = 0;
    for (const pixel of pixels) {
      const original = regions[pixel.region].box, target = loadedBoxes[pixel.region];
      const x = Math.round(pixel.x - original.x + target.x), y = Math.round(pixel.y - original.y + target.y);
      if (x + .5 < target.x || x + .5 >= target.x + target.width || y + .5 < target.y || y + .5 >= target.y + target.height) outside++;
      if (x < 0 || y < 0 || x >= loaded.width || y >= loaded.height) continue;
      for (let channel = 0; channel < 3; channel++) loaded.data[(y * loaded.width + x) * 4 + channel] = Math.round((loaded.data[(y * loaded.width + x) * 4 + channel] + pending.data[(pixel.y * pending.width + pixel.x) * 4 + channel]) / 2);
    }
    fs.mkdirSync("loading-screenshots/diff", { recursive: true });
    fs.writeFileSync(`loading-screenshots/diff/${name}.png`, PNG.sync.write(loaded));
    fs.writeFileSync(`loading-screenshots/diff/${name}.json`, JSON.stringify({ regions, loadedBoxes, shapePixels: pixels.length, outsidePixels: outside, outsideRatio: outside / pixels.length }, null, 2));
    expect(outside / pixels.length, `${name}: fixed shape pixels outside the matching loaded box`).toBeLessThanOrEqual(.02);
    for (const [index, region] of regions.entries()) for (const dimension of ["width", "height"] as const) expect(Math.abs(region.box[dimension] - loadedBoxes[index][dimension]), `${name}: fixed ${dimension} ${region.selector}`).toBeLessThanOrEqual(1);
  };
}
