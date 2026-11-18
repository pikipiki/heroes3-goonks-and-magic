import React from "react";
import { createTheme } from "@mui/material/styles";
import { Button, IconButton, Box, Typography, TextField, Slider, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableBody, TableRow, TableCell, Accordion, AccordionSummary, AccordionDetails, heroesTheme } from "./components.mjs";
const h = React.createElement;
export const kitColors = { ink: "#fff0c2", muted: "#d5c49c", gold: "#e3bd69", outline: "#a5884b", surface: "#261b10", red: "#791e12" };
const stone = "/web/h3-theme/stone.png";
const bevel = "inset 0 1px 0 #fff2b8, inset 0 0 0 2px #a4772d, inset 0 0 0 3px #f4d58a, 0 2px 0 #0d0805, 0 5px 10px #0009";
const raised = "inset 0 1px 0 #fff7d2, inset 0 0 0 2px #b98a38, inset 0 0 0 3px #ffe4a0, 0 2px 0 #0d0805, 0 6px 14px #000b, 0 0 12px #edc16b30";
const pressed = "inset 0 2px 5px #0009, inset 0 0 0 2px #a4772d, inset 0 0 0 3px #edc977, 0 1px 3px #0009";
const buttonFinish = {
  border: "1px solid #edca84",
  borderImage: "none",
  boxShadow: bevel,
  backgroundColor: "#34200e",
  backgroundImage: `linear-gradient(#533716b8,#231308e8),url(${stone})`,
  textShadow: "0 1px 2px #000",
  "&:hover": { backgroundColor: "#5f3c13", backgroundImage: `linear-gradient(#81571db8,#3d220aeb),url(${stone})`, boxShadow: raised, borderColor: "#ffe9a8" },
  "&:active": { boxShadow: pressed },
  "&.Mui-disabled": { boxShadow: "inset 0 0 0 2px #8b703d, 0 2px 4px #0006", opacity: 0.48, color: "#d5c49c" }
};
export const heroesReferenceTheme = createTheme({
  palette: heroesTheme.palette,
  typography: heroesTheme.typography,
  spacing: 8,
  shape: { borderRadius: 0 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: {
      minHeight: 48,
      minWidth: 48,
      padding: "10px 16px",
      borderRadius: 0,
      color: kitColors.ink,
      textTransform: "none",
      fontSize: 14,
      lineHeight: "20px",
      fontWeight: 600,
      "&.MuiButton-root": buttonFinish,
      "&.MuiButton-contained": { ...buttonFinish, backgroundColor: "#751c0e", backgroundImage: `linear-gradient(#a73a23c9,#64150bec),url(${stone})`, "&:hover": { backgroundColor: "#962b12", backgroundImage: `linear-gradient(#c74a29c9,#7d1c0ced),url(${stone})`, boxShadow: raised, borderColor: "#ffe9a8" } },
      "&:focus-visible": { outline: "3px solid #fff0ab", outlineOffset: 3 }
    } } },
    MuiIconButton: { styleOverrides: { root: { width: 48, height: 48, color: kitColors.ink, borderRadius: 0, "&.MuiIconButton-root": buttonFinish, "&:focus-visible": { outline: "3px solid #fff0ab", outlineOffset: 3 } } } },
    MuiOutlinedInput: { styleOverrides: { root: { minHeight: 56, borderRadius: 0, color: kitColors.ink, background: "#191109", boxShadow: "inset 0 2px 5px #000a, 0 1px 0 #f7d58a33", fontSize: 16, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#edca84" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#ffe59a", borderWidth: 2 } }, notchedOutline: { borderColor: "#c8a560" }, input: { padding: "16px 12px" } } },
    MuiInputLabel: { styleOverrides: { root: { color: kitColors.muted } } },
    MuiMenu: { defaultProps: { transitionDuration: 0 }, styleOverrides: { paper: { background: "#2b1b0e", border: "2px solid #d7b369", borderRadius: 0 } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 48, whiteSpace: "normal", "&:hover": { background: "#72501d" }, "&.Mui-selected": { background: "#791e12", "&:hover": { background: "#9a321c" } } } } },
    MuiCheckbox: { styleOverrides: { root: { padding: 12, color: "#d8b56e", "&:hover": { backgroundColor: "#edca841f" }, "&.Mui-checked": { color: "#ffe19a" } } } },
    MuiRadio: { styleOverrides: { root: { padding: 12, color: "#d8b56e", "&:hover": { backgroundColor: "#edca841f" }, "&.Mui-checked": { color: "#ffe19a" } } } },
    MuiSlider: { styleOverrides: { root: { color: "#e3bd69", height: 8, padding: "20px 0" }, rail: { height: 8, opacity: 1, background: "linear-gradient(#110b05,#4c3417)", border: "1px solid #a18448", boxShadow: "inset 0 2px 4px #000c, 0 1px 0 #ffe7a03d" }, track: { height: 8, border: "1px solid #f4d58a", background: "linear-gradient(#fff1b8,#dca344 50%,#98601d)", boxShadow: "0 1px 3px #0008" }, thumb: { width: 26, height: 26, border: "2px solid #ffedac", background: "linear-gradient(145deg,#fff0b5,#dca343 55%,#8c5416)", boxShadow: "inset 1px 1px 1px #fff4cc, inset -1px -2px 2px #71420e, 0 3px 6px #000a", "&::before": { boxShadow: "none" }, "&:hover, &.Mui-focusVisible": { boxShadow: "inset 1px 1px 1px #fff4cc, 0 3px 6px #000a, 0 0 0 7px #edca8429" }, "&.Mui-active": { boxShadow: "inset 0 2px 4px #744510, 0 0 0 10px #edca8433" } }, valueLabel: { background: "#35210e", border: "1px solid #edca84", color: kitColors.ink } } },
    MuiAccordion: { defaultProps: { disableGutters: true }, styleOverrides: { root: { border: "1px solid #c8a560", background: "#21170e", backgroundImage: `linear-gradient(#24180ee0,#1c120beb),url(${stone})`, boxShadow: "inset 0 1px 0 #f8d68a33, 0 3px 8px #0008", "&::before": { display: "none" }, "&.Mui-expanded": { margin: 0 } } } },
    MuiAccordionSummary: { styleOverrides: { root: { minHeight: 56, color: kitColors.ink, "&:hover": { backgroundColor: "#edca841a" } }, content: { gap: 12, alignItems: "center" }, expandIconWrapper: { color: "#ffe4a0", textShadow: "0 2px 2px #000" } } },
    MuiAccordionDetails: { styleOverrides: { root: { padding: "8px 16px 16px", color: kitColors.muted } } },
    MuiTab: { styleOverrides: { root: { minHeight: 48, color: kitColors.muted, textTransform: "none", fontSize: 14, "&:hover": { background: "#edca841c" }, "&.Mui-selected": { color: "#fff0c2", background: "#691b12" } } } },
    MuiDialog: { styleOverrides: { paper: { color: kitColors.ink, backgroundColor: "#261b10", backgroundImage: `url(${stone})`, border: "12px solid transparent", borderImage: "url(/web/h3-theme/recruit-frame.png) 18 18 28 18 stretch", borderRadius: 0 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: 22, lineHeight: "28px" } } },
    MuiDialogActions: { styleOverrides: { root: { padding: 16, gap: 8, flexWrap: "wrap" } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 0, color: kitColors.ink, background: "#332315", border: "1px solid #a5884b" } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 0, border: "1px solid #a5884b", background: "#382514", color: kitColors.ink } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 0, border: "1px solid #a5884b", background: "#191109", color: kitColors.ink, fontSize: 12 } } },
    MuiTableCell: { styleOverrides: { root: { borderBottom: "1px solid #a5884b", fontSize: 14, padding: "12px 8px", color: kitColors.ink }, head: { background: "#382514", fontWeight: 600 } } }
  }
});
export function HeroesPanel({ children, title, className = "", ornate = false, ...props }) {
  return h(Box, { ...props, className: "hk-panel " + (ornate ? "hk-ornate " : "") + className }, title && h(Typography, { component: "h2", variant: "h3", className: "hk-panel-title" }, title), children);
}
export function HeroesButton({ tone = "secondary", children, ...props }) {
  return h(Button, { variant: tone === "primary" ? "contained" : "outlined", ...props }, children);
}
export function HeroesClose({ label = "Fermer", ...props }) {
  return h(IconButton, { "aria-label": label, ...props }, h("span", { "aria-hidden": true }, "\xD7"));
}
export function ResourceCost({ cost, iconURL, labels = {}, className = "" }) {
  return h("span", { className: "hk-cost " + className }, Object.entries(cost).filter(([, n]) => n !== 0).map(([key, value]) => h("span", { key, className: "hk-cost-item" }, h("img", { src: iconURL(key), alt: labels[key] || key, width: 24, height: 24 }), h("span", null, key === "gold" ? new Intl.NumberFormat("fr-FR").format(value) : String(value)))));
}
export function ResourceStrip({ resources, iconURL, labels }) {
  return h("div", { className: "hk-resource-strip", role: "group", "aria-label": labels?.resources || "Ressources" }, Object.entries(resources).map(([key, value]) => h(ResourceCost, { key, cost: { [key]: value }, iconURL, labels })));
}
export function CreatureArt({ portrait, label, assetURL }) {
  const clip = React.useId();
  return h("svg", { className: "hk-art", viewBox: `0 0 ${portrait.w} ${portrait.h}`, role: "img", "aria-label": label }, h("title", null, label), h("defs", null, h("clipPath", { id: clip }, h("rect", { width: portrait.w, height: portrait.h }))), h("g", { clipPath: `url(#${clip})` }, h("image", { href: assetURL(portrait.file), x: -portrait.x, y: -portrait.y, width: 1536, height: 1024 })));
}
export function EvolutionCard({ name, tier, selected, onClick, children }) {
  return h(Button, { className: "hk-evolution", onClick, "aria-pressed": selected }, children, h("span", { className: "hk-evolution-label" }, h("span", { className: "hk-tier" }, tier), name));
}
export function StatGrid({ stats }) {
  return h("dl", { className: "hk-stats" }, stats.map(({ label, value }) => h("div", { key: label }, h("dt", null, label), h("dd", null, value))));
}
export function QuantityControl({ value, onChange, max, label = "Quantit\xE9" }) {
  const normalize = (n) => Math.max(1, Math.min(Math.max(1, max), Math.trunc(Number(n) || 1)));
  return h("div", { className: "hk-quantity" }, h(TextField, { type: "number", label, value, disabled: max < 1, onChange: (e) => onChange(normalize(e.target.value)), slotProps: { htmlInput: { min: 1, max: Math.max(1, max), step: 1 } } }), h(Slider, { value, min: 1, max: Math.max(2, max), disabled: max < 2, onChange: (_, n) => onChange(n), "aria-label": label }));
}
export function ActionDock({ children }) {
  return h("footer", { className: "hk-actions" }, children);
}
export function ScreenShell({ title, chrome, children, actions, commands, onClose }) {
  return h("section", { className: "hk-screen" }, h("main", { className: "hk-screen-content" }, children), h("aside", { className: "hk-command" }, chrome, h("header", { className: "hk-screen-heading" }, h(Typography, { component: "h1", variant: "h2" }, title), onClose && h(HeroesClose, { onClick: onClose })), h("div", { className: "hk-command-body" }, commands), h(ActionDock, null, actions)));
}
export function PurchaseSummary({ available, cost, quantity, iconURL, labels, onQuantity, stockLabel = "Disponibles", priceLabel = "Prix par unit\xE9", quantityLabel = "Quantit\xE9", totalLabel = "Total" }) {
  return h("div", { className: "hk-purchase" }, h(HeroesPanel, null, h("div", { className: "hk-stock-price" }, h("span", null, stockLabel, h("strong", null, available)), h("span", null, priceLabel, h(ResourceCost, { cost, iconURL, labels })))), h(HeroesPanel, null, h(QuantityControl, { value: quantity, onChange: onQuantity, max: available, label: quantityLabel })), h(HeroesPanel, null, h("div", { className: "hk-total" }, totalLabel, h(ResourceCost, { cost: Object.fromEntries(Object.entries(cost).map(([k, n]) => [k, n * quantity])), iconURL, labels }))));
}
export function ArmySlot({ name, count, selected, onClick, children, emptyLabel = "Libre" }) {
  return h(Button, { className: "hk-army-slot", "aria-pressed": selected, onClick }, children || h("span", { "aria-hidden": true }, "+"), h("span", null, name || emptyLabel), count != null && h("strong", null, count));
}
export function ChoiceTile({ name, subtitle, selected, onClick, children }) {
  return h(Button, { className: "hk-choice-tile", "aria-pressed": selected, onClick }, children, h("span", null, name, subtitle && h("small", null, subtitle)));
}
export function ConfirmDialog({ open, title, children, onClose, onConfirm, cancelLabel = "Retour", confirmLabel = "Confirmer" }) {
  return h(Dialog, { open, onClose, fullWidth: true, maxWidth: "xs" }, h(DialogTitle, null, title), h(DialogContent, null, children), h(DialogActions, null, h(HeroesButton, { onClick: onClose }, cancelLabel), h(HeroesButton, { tone: "primary", onClick: onConfirm }, confirmLabel)));
}
export function HeroesDataTable({ label, columns, rows, rowKey = "id" }) {
  return h("div", { className: "hk-table-scroll", tabIndex: 0, role: "region", "aria-label": label }, h(Table, { "aria-label": label }, h(TableHead, null, h(TableRow, null, columns.map((column) => h(TableCell, { key: column.key, scope: "col" }, column.label)))), h(TableBody, null, rows.map((row) => h(TableRow, { key: row[rowKey] }, columns.map((column, index) => h(TableCell, { key: column.key, component: index === 0 ? "th" : "td", scope: index === 0 ? "row" : void 0 }, row[column.key])))))));
}
export function HeroesAccordion({ title, icon, children, ...props }) {
  const id = React.useId();
  return h(Accordion, props, h(AccordionSummary, { id: id + "-summary", "aria-controls": id + "-content", expandIcon: h("span", { "aria-hidden": true, className: "hk-chevron" }, "\u2304") }, icon, h(Typography, { component: "span", variant: "h3" }, title)), h(AccordionDetails, null, children));
}
