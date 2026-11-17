# Army management

Bulk town/visiting-hero transfers merge creatures by their exact type. Existing destination duplicates are consolidated first, then incoming stacks use matching slots or remaining empty slots. Types that do not fit remain in the source; formations are never exchanged. A source hero retains one creature. The server plans and applies this as one native bulk operation, preserving normal stack experience/artifact handling.

Select a stack and choose **Manage** in the army organizer, or **Manage troop** on the hero's Army tab. The panel offers:

- **Dismiss**: a second screen confirms the permanent loss of the whole selected stack. Cancel is initially focused. The native command checks the visible army, owner, current turn, creature type and count again. The final hero stack and native protected creatures cannot be dismissed.
- **Leave on the map**: opens the WoG quantity/destination panel. It retains a creature with the hero, limits the quantity to the original supported range, excludes protected creatures and war machines, and requires an adjacent empty land tile. The player can allow free retrieval by the original owner. Close the town to use this action from the hero's map army.

The panels use preloaded local icons and French/English labels. Landscape keeps the heading and action rail on the right; the main content scrolls vertically. Polling unchanged state preserves controls, focus and pending confirmations.

Compatible source campaigns retain their existing deployment records and admission rules. Ordinary games store deployment records in a separate `troop-deployment-world-v1` section of the existing saved world field. They do not create or admit a source campaign program. Native encounter handling recognizes either record location. This change uses the save format supplied by main (907 after its Henchmen integration), including backward loading of existing 906 saves.

Checks: `tests/army-transfer.test.mjs`, `tests/army-bulk-native.test.mjs` (2,048 generated formations plus specific full/duplicate cases, with sanitizers), `tests/troop-actions.test.mjs`, `tests/era-campaign-deployment.test.mjs`, `work/browser-tests/troop-actions-layout-e2e.mjs` and `work/browser-tests/army-management-native-e2e.mjs`.

Version 0.4.234 validation: 771 unit tests passed (48 skipped), WebAssembly `ninja -j32 html5`, byte-for-byte catalog verification, 16 Chromium/WebKit layout/language combinations, native Chromium and WebKit transfer/dismissal/deployment/save-reload scenarios, and the existing source-campaign free-return/refusal/flee/last-creature regression. Summary: `outputs/army-management-0.4.234/validation.json`.

The final combined engine also passes the Henchmen core regression (selection, independent battle actor and XP, replacement, save/reload, resurrection, AI selection and disabled-profile baseline). Troop dismissal uses mobile action 113; action 112 remains reserved for Henchmen.
