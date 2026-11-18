import { chromium, webkit } from "playwright-core";
import fs from "node:fs";
import assert from "node:assert/strict";
import { silenceTestAudio } from "./silent-audio.mjs";
const name = process.env.ENGINE || "chromium", browser = await { chromium, webkit }[name].launch({ headless: true });
const report = { engine: name, samples: [], errors: [] };
try {
  const p = await browser.newPage({ viewport: { width: 800, height: 1200 } });
  await silenceTestAudio(p);
  p.on("pageerror", (e) => report.errors.push(e.message));
  const fragment = fs.readFileSync("docs/design-prototypes/material3/prototypes.html", "utf8");
  await p.setContent('<!doctype html><html lang=fr><meta charset=utf-8><body style="margin:16px">' + fragment + "</body></html>");
  const f = p;
  await f.locator("#heroes-m3-gallery .hg-device").first().waitFor();
  await p.waitForTimeout(400);
  const scenarios = await f.locator("#heroes-m3-gallery").evaluate((r) => r.prototypeGallery.inventory.flatMap((s) => s.variants.map((v, i) => ({ id: s.id, i, v }))));
  for (const scenario of scenarios) {
    const samples = await f.locator("#heroes-m3-gallery").evaluate((r, scenario2) => {
      const g = r.prototypeGallery, out = [];
      for (const section of r.querySelectorAll("[data-variant]")) section.hidden = false;
      for (const orientation of ["portrait", "landscape"]) for (const size of ["small", "tight"]) {
        Object.assign(g.state, { screen: scenario2.id, variant: scenario2.i, orientation, size });
        g.render();
        for (const d of r.querySelectorAll(".hg-device")) {
          const failures = [], box = d.getBoundingClientRect(), top = d.querySelector("header").getBoundingClientRect(), dock = d.querySelector("footer").getBoundingClientRect(), main = d.querySelector("main"), bounds = main.getBoundingClientRect();
          if (top.bottom > dock.top + 1) failures.push("header / dock overlap");
          if (dock.bottom > box.bottom + 1) failures.push("dock below viewport");
          if (main.scrollWidth > main.clientWidth + 1) failures.push("content horizontal overflow " + main.scrollWidth + "/" + main.clientWidth);
          for (const b of d.querySelectorAll("button")) {
            const r2 = b.getBoundingClientRect();
            if (!r2.width || !r2.height) continue;
            if (r2.height < 47 || r2.width < 47) failures.push("touch target " + b.textContent.trim() + " " + r2.width + "x" + r2.height);
            if (b.scrollWidth > b.clientWidth + 2) failures.push("button text overflow " + b.textContent.trim());
          }
          for (const title of d.querySelectorAll("header h1")) if (title.scrollWidth > title.clientWidth + 1) failures.push("title overflow");
          if (main.classList.contains("armies") && main.scrollHeight > main.clientHeight + 1) failures.push("army slots require vertical scrolling");
          if (main.classList.contains("hero") && scenario2.v === "Armée" && main.scrollHeight > main.clientHeight + 1) failures.push("hero army slots require vertical scrolling");
          if (main.classList.contains("guild") && main.scrollHeight > main.clientHeight + 1) failures.push("guild requires vertical scrolling");
          if (main.classList.contains("hall")) for (const family of d.querySelectorAll(".hg-family")) {
            const fr = family.getBoundingClientRect();
            if (fr.bottom > bounds.bottom + 1) failures.push("hall family not fully visible");
          }
          out.push({ scenario: scenario2.id, variant: scenario2.v, orientation, size, design: d.dataset.design, failures });
        }
      }
      return out;
    }, scenario);
    report.samples.push(...samples);
  }
  await f.locator("#heroes-m3-gallery").evaluate((r) => {
    const g = r.prototypeGallery;
    Object.assign(g.state, { screen: "creature-presentation", variant: 1, orientation: "portrait", size: "small" });
    g.render();
  });
  await p.screenshot({ path: "/tmp/prototype-audit-" + name + ".png" });
  await f.locator("#heroes-m3-gallery").evaluate((r) => {
    Object.assign(r.prototypeGallery.state, { screen: "creature-presentation", variant: 1, orientation: "portrait", size: "small", qty: 3 });
    r.prototypeGallery.render();
  });
  await p.locator(".hg-device").first().locator("[data-action=more]").click();
  assert.equal(await p.locator("#heroes-m3-gallery").evaluate((r) => r.prototypeGallery.state.qty), 4);
  assert.match(await p.locator(".hg-device").first().locator(".hg-context").textContent(), /8\s800/);
  await f.locator("#heroes-m3-gallery").evaluate((r) => {
    Object.assign(r.prototypeGallery.state, { screen: "thieves-guild-view", variant: 1 });
    r.prototypeGallery.render();
  });
  assert.equal(await p.locator(".hg-device").first().locator("tbody tr").count(), 8);
  await p.locator(".hg-device").first().locator("select[aria-label=Renseignement]").selectOption("Or");
  assert.equal(await p.locator(".hg-device").first().locator("select[aria-label=Renseignement]").inputValue(), "Or");
  await f.locator("#heroes-m3-gallery").evaluate((r) => {
    Object.assign(r.prototypeGallery.state, { screen: "spellbook", variant: 0 });
    r.prototypeGallery.render();
  });
  await p.locator(".hg-device").first().locator('[data-spell="2"]').click();
  assert.equal(await p.locator("#heroes-m3-gallery").evaluate((r) => r.prototypeGallery.state.spell), 2);
  await f.locator("#heroes-m3-gallery").evaluate((r) => {
    Object.assign(r.prototypeGallery.state, { screen: "creature-presentation", variant: 1, orientation: "landscape", size: "tight" });
    r.prototypeGallery.render();
  });
  await p.locator(".hg-device").first().locator("[data-action=menu]").click();
  assert.match(await p.locator(".hg-device").first().locator(".hg-popover").textContent(), /Tout recruter/);
  const stress = await f.locator("#heroes-m3-gallery").evaluate((r) => {
    const g = r.prototypeGallery, out = [];
    Object.assign(g.state, { maxResources: true, longText: true, evolutions: "3" });
    for (const screen of g.inventory) for (let variant = 0; variant < screen.variants.length; variant++) for (const orientation of ["portrait", "landscape"]) {
      Object.assign(g.state, { screen: screen.id, variant, orientation, size: "tight" });
      g.render();
      for (const d of r.querySelectorAll(".hg-device")) {
        const main = d.querySelector("main"), bad = [];
        if (main.scrollWidth > main.clientWidth + 1) bad.push("long content overflow");
        const resources = d.querySelector(".hg-resources");
        if (resources && resources.scrollWidth > resources.clientWidth + 1) bad.push("maximum resources overflow");
        for (const cell of resources?.children || []) if (cell.scrollWidth > cell.clientWidth + 1) bad.push("resource amount overflow");
        out.push({ screen: screen.id, variant, orientation, design: d.dataset.design, failures: bad });
      }
    }
    return out;
  });
  report.stress = stress;
  const failed = report.samples.filter((s) => s.failures.length), stressed = stress.filter((s) => s.failures.length);
  fs.writeFileSync("/tmp/prototype-audit-" + name + ".json", JSON.stringify(report, null, 2));
  console.log(name, report.samples.length, "layout cases;", stress.length, "long-text/max-resource cases;", failed.length + stressed.length, "findings");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(failed, []);
  assert.deepEqual(stressed, []);
} finally {
  await browser.close();
}
