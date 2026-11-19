// Uses the served release modules; the virtual HTML contains only an isolated test host.
import { chromium, webkit } from "playwright-core";
import fs from "node:fs";
import assert from "node:assert/strict";
const origin = process.env.GOONK_TEST_ORIGIN || "http://127.0.0.1:8996", kind = process.env.TEST_BROWSER || "chromium", browser = await (kind === "webkit" ? webkit : chromium).launch({ headless: true }), page = await browser.newPage({ viewport: { width: 800, height: 600 } }), errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/native-dialog-prototype.html", (r) => r.fulfill({ contentType: "text/html", body: '<!doctype html><html><head><meta charset="utf-8"></head><body><main id="app" style="position:relative;width:780px;height:580px"></main></body></html>' }));
try {
  await page.goto(origin + "/native-dialog-prototype.html");
  const reports = await page.evaluate(async () => {
    const { createMaterialDialogBoundary, createMaterialElement } = await import("/web/ui/mui-runtime.mjs?shim-prototype");
    const { installNativeDialog } = await import("/web/ui/native-dialog.mjs?shim-prototype");
    const tick = () => new Promise((r) => setTimeout(r, 60));
    window.uaModalCalls = 0;
    HTMLDialogElement.prototype.showModal = function() {
      window.uaModalCalls++;
      throw Error("UA showModal must never run");
    };
    const app = document.querySelector("#app"), opener = createMaterialElement("button");
    opener.textContent = "Open";
    app.append(opener);
    const specs = [["game-menu", ""], ["", "session-recovery"], ["hosted-castle-picker", "lobby-picker"], ["", "hosted-delete-dialog"], ["hosted-map-picker", "lobby-picker"], ["", "lobby-picker"], ["", "campaign-media-viewer"]], reports2 = [];
    for (const [id, className] of specs) {
      const dialog = document.createElement("dialog");
      if (id) dialog.id = id;
      dialog.className = className;
      dialog.setAttribute("aria-label", "Native dialog interoperability");
      dialog.style.width = "320px";
      const cancel = createMaterialElement("button"), confirm = createMaterialElement("button");
      cancel.textContent = "Cancel";
      confirm.textContent = "Confirm";
      dialog.append(cancel, confirm);
      app.append(dialog);
      let closeEvents = 0, veto = false;
      dialog.addEventListener("close", () => closeEvents++);
      dialog.addEventListener("cancel", (e) => {
        if (veto) e.preventDefault();
      });
      const boundary = createMaterialDialogBoundary(dialog, { container: app, transitionDuration: 0, onClose: () => {
        const event = new Event("cancel", { cancelable: true });
        if (dialog.dispatchEvent(event)) dialog.close();
      } });
      const binding = installNativeDialog(dialog, boundary);
      opener.focus();
      dialog.showModal();
      await tick();
      if (!dialog.open || dialog.matches(":modal") || !dialog.closest(".MuiDialog-root") || !dialog.classList.contains("MuiDialog-paper")) throw Error("Not a sole MUI dialog: " + id + className);
      if (!dialog.contains(document.activeElement)) throw Error("MUI did not contain focus");
      veto = true;
      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await tick();
      if (!dialog.open) throw Error("Cancelled escape closed a protected native dialog");
      veto = false;
      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await tick();
      if (dialog.open || closeEvents !== 1) throw Error("Escape must close once");
      dialog.showModal();
      await tick();
      dialog.close("accepted");
      dialog.close("duplicate");
      await tick();
      if (dialog.returnValue !== "accepted" || closeEvents !== 2) throw Error("close API lost returnValue or emitted twice");
      dialog.show();
      await tick();
      if (!dialog.open || dialog.matches(":modal")) throw Error("show() not bridged");
      dialog.close();
      await tick();
      if (closeEvents !== 3) throw Error("show/close event mismatch");
      reports2.push({ id, className, mui: true, uaModal: false, cancelVeto: true, escapeClosesOnce: true, returnValue: true, repeatCloseIdempotent: true, closeEvents });
      binding.dispose();
      boundary.dispose();
      dialog.remove();
    }
    return { reports: reports2, uaModalCalls: window.uaModalCalls };
  });
  assert.equal(reports.uaModalCalls, 0);
  assert.equal(reports.reports.length, 7);
  assert.deepEqual(errors, []);
  fs.writeFileSync("/tmp/native-dialog-shim-" + kind + ".json", JSON.stringify({ passed: true, kind, ...reports, errors }, null, 2));
  console.log("PASS", kind, "seven native root types: actual MUI Dialog, zero UA modal calls, cancel veto, Escape, returnValue, close exactly once");
} finally {
  await browser.close();
}
