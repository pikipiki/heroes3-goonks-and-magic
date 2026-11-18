import React, { createContext, useContext } from "react";
import { Box, Typography, Stack, Alert, TextField, MenuItem } from "../components.mjs";
import { HeroesButton, ResourceCost } from "../heroes-kit.mjs";
const Language = createContext("fr");
export function GameUIProvider({ language = "fr", children }) {
  return <Language.Provider value={language}>{children}</Language.Provider>;
}
export function useGameText() {
  const language = useContext(Language);
  return (fr, en) => language === "fr" ? fr : en;
}
export function Picture({ src, alt = "", size = 48, ...props }) {
  return src ? <Box component="img" src={src} alt={alt} sx={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }} {...props} /> : null;
}
export function Cost({ cost, iconURL, labels }) {
  const t = useGameText();
  if (cost == null) return <Typography component="span" variant="body2">{t("Co\xFBt indisponible", "Cost unavailable")}</Typography>;
  return Object.values(cost).some(Number) ? <ResourceCost cost={cost} iconURL={iconURL} labels={labels} /> : <Typography component="span" variant="body2">{t("Gratuit", "Free")}</Typography>;
}
export function Empty({ children }) {
  const t = useGameText();
  return <Alert severity="info">{children || t("Aucun \xE9l\xE9ment disponible.", "No items available.")}</Alert>;
}
export function Status({ busy, error, children }) {
  const t = useGameText();
  return error ? <Alert severity="error">{error}</Alert> : busy ? <Alert severity="info" aria-busy="true">{t("Chargement\u2026", "Loading\u2026")}</Alert> : children;
}
export function Action({ onClick, disabled, children, primary = false, ...props }) {
  return <HeroesButton tone={primary ? "primary" : "secondary"} onClick={onClick} disabled={disabled || !onClick} {...props}>{children}</HeroesButton>;
}
export function SelectField({ label, value, options, onChange, disabled = false }) {
  return <TextField select fullWidth label={label} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled || !onChange}>{options.map((option) => <MenuItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</MenuItem>)}</TextField>;
}
export function Heading({ children }) {
  return <Typography component="h3" variant="h3">{children}</Typography>;
}
export function ItemCopy({ title, description }) {
  return <Stack sx={[{ minWidth: 0 }, { gap: 0.5 }]}><Typography component="span" variant="body1">{title}</Typography>{description && <Typography variant="body2" color="text.secondary">{description}</Typography>}</Stack>;
}
