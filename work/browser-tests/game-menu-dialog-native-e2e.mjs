// Real served game; all save bytes belong to this isolated QA session.
import { chromium, webkit } from "playwright-core";
import fs from "node:fs";
import assert from "node:assert/strict";
import { creatureTownFixture } from "./creature-town-fixture.mjs";
import { silenceTestAudio } from "./silent-audio.mjs";
const language = process.env.TEST_LANGUAGE || "fr", kind = process.env.TEST_BROWSER || "chromium", origin = process.env.GOONK_TEST_ORIGIN || "http://127.0.0.1:8996", out = process.env.REVIEW_OUTPUT || "/tmp/goonk-game-menu-dialog-" + language + "-" + kind;
fs.mkdirSync(out, { recursive: true });
const browser = await (kind === "webkit" ? webkit : chromium).launch({ headless: true });
let page = await browser.newPage({ viewport: { width: 360, height: 740 }, hasTouch: true });
await silenceTestAudio(page);
const errors = [], report = [], uaPrompts = [];
page.on("dialog", (dialog) => {
  uaPrompts.push(dialog.type());
  void dialog.dismiss();
});
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => fs.appendFileSync(out + "/console.log", m.text() + "\n"));
await page.addInitScript((language2) => {
  localStorage.setItem("heroes-goonk.language", language2);
  sessionStorage.setItem("heroes-goonk.storage-failed", "true");
}, language);
const wait = (f, arg, t = 12e4) => page.waitForFunction(f, arg, { timeout: t }), cmd = (...a) => page.evaluate((a2) => Module._vcmiMobileCommand(...a2), [...a, ...Array(6 - a.length).fill(0)]);
async function verifyOpen() {
  await wait(() => {
    const d2 = document.querySelector("#game-menu");
    return d2?.open && d2.closest(".MuiDialog-root");
  });
  const d = await page.locator("#game-menu").evaluate((d2) => ({ open: d2.open, uaModal: d2.matches(":modal"), paper: d2.classList.contains("MuiDialog-paper"), container: !!d2.closest(".MuiDialog-container"), backdrop: !!d2.closest(".MuiDialog-root")?.querySelector(".MuiBackdrop-root"), focused: d2.contains(document.activeElement), dialogs: [...document.querySelectorAll(".MuiDialog-root")].filter((n) => n.getClientRects().length && getComputedStyle(n).visibility !== "hidden").length }));
  assert(d.open && d.paper && d.container && d.backdrop && !d.uaModal);
  assert(d.focused);
  return d;
}
try {
  await page.goto(origin + "/game.html?mobile=1");
  await wait(() => window.goonkMobileState?.mode === "menu" && goonkSessionRecovery?.phase === "done");
  await page.evaluate((bytes) => Module.FS.writeFile("/home/web_user/.local/share/vcmi/Maps/003-Goonks-WoG.vmap", new Uint8Array(bytes)), [...creatureTownFixture]);
  await cmd(20, 1);
  await wait(() => goonkMobileState.lobbyReady && goonkMobileState.maps?.some((m) => m.name === "000 - Creature abilities"));
  await cmd(24, await page.evaluate(() => goonkMobileState.maps.find((m) => m.name === "000 - Creature abilities").index));
  await wait(() => goonkMobileState.selectedMap === "000 - Creature abilities");
  await cmd(22);
  await wait(() => goonkMobileState.mode === "map" && goonkMobileState.turn && goonkMobileState.towns?.length === 10);
  await page.evaluate(() => {
    const native = Module._vcmiMobileCommand;
    window.menuObservedCommands = [];
    Module._vcmiMobileCommand = function(...a) {
      menuObservedCommands.push(a[0]);
      return native.apply(this, a);
    };
  });
  for (const [mode, width, height] of [["map", 360, 740], ["town", 716, 279]]) {
    await page.setViewportSize({ width, height });
    if (mode === "town") {
      await cmd(5, 9);
      await wait(() => goonkMobileState.mode === "town");
    }
    const toggle = page.locator("#game-menu-toggle");
    await toggle.focus();
    await toggle.tap();
    const opened = await verifyOpen();
    await page.locator("#game-menu [data-menu=settings]").tap();
    await wait(() => document.querySelector("#game-menu").dataset.page === "settings");
    const combo = page.locator("#game-menu .MuiSelect-select").first();
    await combo.tap();
    await page.getByRole("listbox").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("listbox").waitFor({ state: "hidden" });
    assert(await page.locator("#game-menu").evaluate((d) => d.open), "Escape closes the nested select before its parent");
    await page.locator("#game-menu .game-menu-return [data-menu=back]").tap();
    await wait(() => document.querySelector("#game-menu").dataset.page === "home");
    if (mode === "map") {
      await page.waitForFunction(() => {
        const b = document.querySelector("#game-menu [data-menu=save]");
        return b && !b.disabled;
      });
      await page.locator("#game-menu [data-menu=save]").tap();
      await wait(() => window.goonkAutosaveStatus?.phase === "saved", null, 3e4);
    }
    await page.screenshot({ path: out + "/" + mode + "-" + width + "x" + height + ".png" });
    await page.locator("#game-menu [data-menu=close]").tap();
    await wait(() => !document.querySelector("#game-menu").open);
    await page.waitForTimeout(450);
    assert(await toggle.evaluate((n) => document.activeElement === n));
    assert.equal(await page.locator("#mobile-app").evaluate((n) => !!n.closest("[inert]")), false);
    await toggle.tap();
    await verifyOpen();
    await page.keyboard.press("Escape");
    await wait(() => !document.querySelector("#game-menu").open);
    await page.waitForTimeout(450);
    assert(await toggle.evaluate((n) => document.activeElement === n));
    report.push({ mode, width, height, opened, settingsAndNestedSelect: true, save: mode === "map", buttonCloseRestoresFocus: true, escapeCloseRestoresFocus: true });
    console.log("PASS", mode, width, height);
  }
  const observed = await page.evaluate(() => menuObservedCommands), savedBytes = await page.evaluate(() => Array.from(Module.FS.readFile("/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1")));
  await page.close();
  page = await browser.newPage({ viewport: { width: 360, height: 740 }, hasTouch: true });
  await silenceTestAudio(page);
  page.on("dialog", (dialog) => {
    uaPrompts.push(dialog.type());
    void dialog.dismiss();
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((language2) => {
    localStorage.setItem("heroes-goonk.language", language2);
    sessionStorage.setItem("heroes-goonk.storage-failed", "true");
  }, language);
  await page.goto(origin + "/game.html?mobile=1");
  await wait(() => window.goonkMobileState?.mode === "menu" && goonkSessionRecovery?.phase === "done");
  await page.evaluate((bytes) => {
    const dir = "/home/web_user/.local/share/vcmi/Saves/";
    Module.FS.mkdirTree(dir);
    Module.FS.writeFile(dir + "Goonk-auto.vsgm1", new Uint8Array(bytes));
  }, savedBytes);
  await cmd(23);
  await wait(() => goonkMobileState.mode === "load" && goonkMobileState.lobbyReady && goonkMobileState.maps?.some((m) => /Goonk-auto/i.test(m.file)));
  const saved = await page.evaluate(() => goonkMobileState.maps.find((m) => /Goonk-auto/i.test(m.file)));
  await cmd(27, saved.index);
  await wait((i) => goonkMobileState.selectedIndex === i, saved.index);
  const deleting = page.locator("[data-delete-solo-autosave]");
  await deleting.tap();
  const confirmation = page.getByRole("dialog", { name: language === "fr" ? "Sauvegarde automatique" : "Autosave" });
  await confirmation.waitFor({ state: "visible" });
  assert(await confirmation.evaluate((n) => n.classList.contains("MuiDialog-paper") && !n.matches(":modal")));
  await deleting.evaluate((n) => n.click());
  assert.equal(await page.getByRole("dialog", { name: language === "fr" ? "Sauvegarde automatique" : "Autosave" }).count(), 1);
  await confirmation.getByRole("button", { name: language === "fr" ? "Annuler" : "Cancel", exact: true }).tap();
  await wait(() => !document.querySelector("[data-delete-solo-autosave]").disabled);
  assert(await page.evaluate(() => Module.FS.analyzePath("/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1").exists));
  assert.deepEqual(uaPrompts, []);
  report.push({ autosaveCancel: true, materialDialog: true, noUaPrompt: true, duplicateClickGuard: true, filePreserved: true });
  const actions = observed;
  assert(!actions.some((a) => [29, 53, 71, 122].includes(a)), "No cheat, purchase, new game or upgrade command");
  assert.deepEqual(errors, []);
  fs.writeFileSync(out + "/report.json", JSON.stringify({ passed: true, language, actualDist: true, report, actions, errors }, null, 2));
  console.log("PASS actual MUI game menu Map/Town settings/select/save/close/focus " + language);
} catch (error) {
  fs.writeFileSync(out + "/failure.json", JSON.stringify({ error: error.message, report, errors, state: await page.evaluate(() => ({ mode: window.goonkMobileState?.mode, recovery: window.goonkSessionRecovery, menuOpen: document.querySelector("#game-menu")?.open, dialogs: [...document.querySelectorAll(".MuiDialog-root")].length })).catch(() => null) }, null, 2));
  await page.screenshot({ path: out + "/failure.png" }).catch(() => {
  });
  console.log("FAIL", error.message);
  throw error;
} finally {
  await browser.close();
}
