import React, { useState, useRef, useEffect } from "react";
import { Box, Stack, Typography, TextField, MenuItem, Tabs, Tab, List, ListItem, ListItemText, Alert, Chip, LinearProgress, FormControlLabel, Checkbox, Radio, RadioGroup, FormControl, FormLabel, Slider, Input } from "../components.mjs";
import { HeroesPanel, HeroesButton, QuantityControl, ConfirmDialog, ActionDock } from "../heroes-kit.mjs";
import { useGameText, Picture, Cost, Empty, Action, SelectField, Heading } from "./shared.jsx";
export function MarketTradePanel({ resources, value, onChange, quote, iconURL, labels, max = 1, onTrade, busy = false }) {
  const t = useGameText(), [confirm, setConfirm] = useState(false), set = (key, next) => onChange?.({ ...value, [key]: next });
  const options = (opposite) => resources.map((resource) => ({ value: resource.id, label: resource.name + " \xB7 " + resource.balance, disabled: resource.id === opposite }));
  return <Stack data-game-component="trade" sx={{ gap: 2 }}><Box className="gx-form-grid"><SelectField label={t("Vous donnez", "You give")} value={value.give} options={options(value.receive)} disabled={busy} onChange={(id) => set("give", id)} /><SelectField label={t("Vous recevez", "You receive")} value={value.receive} options={options(value.give)} disabled={busy} onChange={(id) => set("receive", id)} /></Box><QuantityControl value={value.amount} onChange={(amount) => set("amount", amount)} max={max} label={t("Quantit\xE9", "Quantity")} disabled={busy || !onChange} />{quote && <HeroesPanel><Stack sx={{ gap: 1 }}><Stack direction="row" sx={{ gap: 2, alignItems: "center", flexWrap: "wrap" }}><Cost cost={quote.giveCost} iconURL={iconURL} labels={labels} /><Typography component="span" aria-label={t("contre", "for")}>→</Typography><Cost cost={quote.receiveCost} iconURL={iconURL} labels={labels} /></Stack>{quote.reason && <Alert severity="warning">{quote.reason}</Alert>}</Stack></HeroesPanel>}<Action primary onClick={() => setConfirm(true)} disabled={!onTrade || busy || !quote?.canTrade || value.give === value.receive}>{t("\xC9changer", "Exchange")}</Action><ConfirmDialog open={confirm} title={t("Confirmer l\u2019\xE9change", "Confirm exchange")} onClose={() => setConfirm(false)} onConfirm={() => {
    setConfirm(false);
    onTrade?.(value);
  }} cancelLabel={t("Retour", "Back")} confirmLabel={t("\xC9changer", "Exchange")}><Stack sx={{ gap: 1 }}><Cost cost={quote?.giveCost} iconURL={iconURL} labels={labels} /><Cost cost={quote?.receiveCost} iconURL={iconURL} labels={labels} /></Stack></ConfirmDialog></Stack>;
}
export function KingdomRanking({ players, metrics, selectedMetric, onMetric, selectedPlayer, onPlayer, details = [], height = 360 }) {
  const t = useGameText(), metric = metrics.find((item) => item.id === selectedMetric) || metrics[0];
  return <Stack data-game-component="ranking" sx={{ gap: 1.5 }}><Tabs value={metric?.id ?? false} onChange={(_, id) => onMetric?.(id)} variant="scrollable" aria-label={t("Classements", "Rankings")}>{metrics.map((item) => <Tab key={item.id} label={item.name} value={item.id} disabled={!onMetric} />)}</Tabs><Box sx={{ maxHeight: height, overflow: "auto" }}>{metric ? <List disablePadding>{metric.entries.map((entry) => {
    const player = players.find((item) => item.id === entry.playerId);
    return <ListItem key={entry.playerId} disableGutters sx={{ gap: 1, borderBottom: "1px solid #a5884b" }}><Chip label={entry.known === false ? "\u2014" : entry.rank} /><Picture src={player?.flag} size={24} /><ListItemText primary={player?.name} /><Typography variant="body2">{entry.known === false ? t("Inconnu", "Unknown") : entry.value}</Typography></ListItem>;
  })}</List> : <Empty />}</Box><SelectField label={t("Renseignements du joueur", "Player intelligence")} value={selectedPlayer} options={players.map((player) => ({ value: player.id, label: player.name }))} onChange={onPlayer} /><List disablePadding>{details.map((item) => <ListItem key={item.id} disableGutters><ListItemText primary={item.label} secondary={item.known === false ? t("Inconnu", "Unknown") : item.value} /></ListItem>)}</List></Stack>;
}
export function SaveRecoveryPanel({ saves, onResume, onExport, onDelete, onImport, busy = false, error }) {
  const t = useGameText(), [deleting, setDeleting] = useState(null);
  return <Stack data-game-component="save" sx={{ gap: 1.5 }}>{error && <Alert severity="error">{error}</Alert>}{saves.length ? <List disablePadding>{saves.map((save) => <ListItem key={save.id} disableGutters sx={{ display: "block" }}><HeroesPanel><Stack sx={{ gap: 1 }}><Heading>{save.name}</Heading><Typography variant="body2">{save.description}</Typography><Typography variant="caption">{save.dateLabel}</Typography><Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}><Action primary onClick={() => onResume?.(save.id)} disabled={busy || !onResume}>{t("Reprendre", "Resume")}</Action><Action onClick={() => onExport?.(save.id)} disabled={busy || !onExport}>{t("Exporter", "Export")}</Action><Action onClick={() => setDeleting(save)} disabled={busy || !onDelete}>{t("Supprimer", "Delete")}</Action></Stack></Stack></HeroesPanel></ListItem>)}</List> : <Empty>{t("Aucune sauvegarde trouv\xE9e.", "No saves found.")}</Empty>}{onImport && <HeroesButton component="label" disabled={busy}>{t("Importer une sauvegarde", "Import a save")}<Input type="file" sx={{ display: "none" }} onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = "";
  }} /></HeroesButton>}<ConfirmDialog open={Boolean(deleting)} title={t("Supprimer cette sauvegarde ?", "Delete this save?")} onClose={() => setDeleting(null)} onConfirm={() => {
    if (deleting) onDelete?.(deleting.id);
    setDeleting(null);
  }} cancelLabel={t("Retour", "Back")} confirmLabel={t("Supprimer", "Delete")}><Typography>{deleting?.name}</Typography></ConfirmDialog></Stack>;
}
export function StorageUsage({ used, total, downloadProgress, busy = false, offlineReady, onDownload, onRepair, error }) {
  const t = useGameText(), format = (bytes) => new Intl.NumberFormat(t("fr-FR", "en-US"), { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024) + " " + t("Mo", "MB"), percent = total > 0 ? Math.max(0, Math.min(100, used / total * 100)) : 0;
  return <Stack data-game-component="storage" sx={{ gap: 1.5 }}><Typography>{t("Stockage utilis\xE9", "Storage used")} : {format(used)}{total > 0 && " / " + format(total)}</Typography><LinearProgress variant="determinate" value={percent} aria-label={t("Occupation du stockage", "Storage usage")} /><Chip label={offlineReady ? t("Disponible hors ligne", "Available offline") : t("Connexion n\xE9cessaire", "Connection required")} />{downloadProgress != null && <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, downloadProgress))} aria-label={t("T\xE9l\xE9chargement", "Download")} />}<Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}><Action primary onClick={onDownload} disabled={busy}>{t("T\xE9l\xE9charger", "Download")}</Action><Action onClick={onRepair} disabled={busy}>{t("V\xE9rifier les fichiers", "Verify files")}</Action></Stack>{error && <Alert severity="error">{error}</Alert>}</Stack>;
}
export function RuleOptionRow({ label, description, checked, onChange, options, value, disabled = false, reason }) {
  const t = useGameText();
  return <Stack data-game-component="rules" sx={{ gap: 0.5 }}>{options ? <SelectField label={label} value={value} options={options} onChange={onChange} disabled={disabled} /> : <FormControlLabel control={<Checkbox checked={Boolean(checked)} disabled={disabled || !onChange} onChange={(e) => onChange?.(e.target.checked)} />} label={label} />}<Typography variant="body2" color="text.secondary">{description}</Typography>{reason && <Chip size="small" label={t("Indisponible", "Unavailable") + " \xB7 " + reason} />}</Stack>;
}
export function CopyCodeField({ code, onCopy }) {
  const t = useGameText(), input = useRef(null), [state, setState] = useState("idle");
  async function copy() {
    try {
      if (onCopy) await onCopy(code);
      else if (globalThis.navigator?.clipboard) await navigator.clipboard.writeText(code);
      else throw Error("clipboard unavailable");
      setState("copied");
    } catch {
      input.current?.focus();
      input.current?.select();
      setState("failed");
    }
  }
  return <Stack data-game-component="copy" sx={{ gap: 1 }}><TextField label={t("Code d\u2019invitation", "Invitation code")} value={code} inputRef={input} slotProps={{ input: { readOnly: true } }} /><Action onClick={copy}>{t("Copier le code", "Copy code")}</Action>{state !== "idle" && <Alert role="status" severity={state === "copied" ? "success" : "warning"}>{state === "copied" ? t("Code copi\xE9.", "Code copied.") : t("Copie automatique indisponible. S\xE9lectionne et copie le code.", "Automatic copy unavailable. Select and copy the code.")}</Alert>}</Stack>;
}
function fieldValid(field, value) {
  if (field.options && value != null && value !== "" && field.type !== "multiple" && !field.options.some((option) => option.value === value && !option.disabled)) return false;
  if (field.type === "multiple" && Array.isArray(value) && value.some((item) => !field.options.some((option) => option.value === item && !option.disabled))) return false;
  if (field.required && (value == null || value === "" || Array.isArray(value) && !value.length || field.type === "checkbox" && !value)) return false;
  if (field.type === "number" && value !== "") {
    const number = Number(value);
    return Number.isFinite(number) && (field.min == null || number >= field.min) && (field.max == null || number <= field.max);
  }
  return true;
}
export function NativeDialogForm({ fields, values, onChange, onSubmit, onCancel, busy = false, submitLabel }) {
  const t = useGameText(), formId = React.useId(), valid = fields.every((field) => field.disabled || fieldValid(field, values[field.id])), set = (id, value) => onChange?.({ ...values, [id]: value });
  return <Stack component="form" data-game-component="dynamic" onSubmit={(event) => {
    event.preventDefault();
    if (valid && !busy) onSubmit?.(values);
  }} sx={{ gap: 2 }}>{fields.map((field) => {
    const value = values[field.id], disabled = busy || field.disabled || !onChange;
    if (field.type === "checkbox") return <FormControlLabel key={field.id} label={field.label} control={<Checkbox checked={Boolean(value)} disabled={disabled} onChange={(e) => set(field.id, e.target.checked)} />} />;
    if (field.type === "radio" || field.type === "multiple") return <FormControl component="fieldset" key={field.id} disabled={disabled} required={field.required}><FormLabel component="legend">{field.label}</FormLabel>{field.type === "radio" ? <RadioGroup value={value ?? ""} onChange={(e) => set(field.id, field.options.find((option) => String(option.value) === e.target.value)?.value ?? e.target.value)}>{field.options.map((option) => <FormControlLabel key={option.value} value={option.value} label={option.label} disabled={disabled || option.disabled} control={<Radio />} />)}</RadioGroup> : <Stack>{field.options.map((option) => <FormControlLabel key={option.value} label={option.label} control={<Checkbox disabled={disabled || option.disabled} checked={(value || []).includes(option.value)} onChange={(e) => set(field.id, e.target.checked ? [...value || [], option.value] : (value || []).filter((v) => v !== option.value))} />} />)}</Stack>}</FormControl>;
    const inputId = formId + "-" + field.id;
    return <FormControl key={field.id} fullWidth required={field.required} disabled={disabled} sx={{ gap: 1 }}><FormLabel id={inputId + "-label"} htmlFor={inputId}>{field.label}</FormLabel><TextField id={inputId} select={field.type === "select"} type={field.type === "number" ? "number" : "text"} value={value ?? ""} onChange={(e) => set(field.id, field.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} disabled={disabled} required={field.required} error={value != null && !fieldValid(field, value)} helperText={field.help} slotProps={{ select: { "aria-labelledby": inputId + "-label" }, htmlInput: { min: field.min, max: field.max, "aria-label": field.label } }}>{field.type === "select" ? field.options.map((option) => <MenuItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</MenuItem>) : void 0}</TextField></FormControl>;
  })}<ActionDock>{onCancel && <Action onClick={onCancel} disabled={busy}>{t("Retour", "Back")}</Action>}<HeroesButton type="submit" tone="primary" disabled={busy || !valid || !onSubmit}>{submitLabel || t("Confirmer", "Confirm")}</HeroesButton></ActionDock></Stack>;
}
export function MediaViewer({ src, kind = "image", title, caption, onClose }) {
  const t = useGameText(), video = useRef(null), [playing, setPlaying] = useState(false), [muted, setMuted] = useState(false), [duration, setDuration] = useState(0), [time, setTime] = useState(0), [error, setError] = useState(false);
  useEffect(() => {
    setError(false);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, [src]);
  async function toggle() {
    try {
      if (video.current.paused) await video.current.play();
      else video.current.pause();
    } catch {
      setError(true);
    }
  }
  return <Stack data-game-component="media" sx={{ gap: 1.5 }}><Heading>{title}</Heading>{error ? <Alert severity="error">{t("Impossible de lire ce m\xE9dia.", "Unable to play this media.")}</Alert> : kind === "video" ? <Box component="video" ref={video} src={src} playsInline muted={muted} preload="metadata" controls={false} aria-label={title} className="gx-media" onLoadedMetadata={(e) => setDuration(Number.isFinite(e.target.duration) ? e.target.duration : 0)} onTimeUpdate={(e) => setTime(e.target.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} /> : <Box component="img" src={src} alt={title} className="gx-media" onError={() => setError(true)} />}<Typography variant="body2">{caption}</Typography>{kind === "video" && <Stack sx={{ gap: 1 }}><Slider aria-label={t("Position de la vid\xE9o", "Video position")} min={0} max={duration || 1} value={Math.min(time, duration || 1)} disabled={!duration || error} onChange={(_, value) => {
    if (video.current) {
      video.current.currentTime = value;
      setTime(value);
    }
  }} /><Stack direction="row" sx={{ gap: 1 }}><Action onClick={toggle} disabled={error}>{playing ? t("Pause", "Pause") : t("Lire", "Play")}</Action><Action onClick={() => setMuted(!muted)}>{muted ? t("Activer le son", "Enable sound") : t("Couper le son", "Mute")}</Action></Stack></Stack>}{onClose && <Action onClick={onClose}>{t("Retour", "Back")}</Action>}</Stack>;
}
export function ConsequenceSummary({ items, cost, recovered, iconURL, labels, warning, acknowledged = false, onAcknowledge, onConfirm, disabled = false }) {
  const t = useGameText();
  return <Stack data-game-component="consequences" sx={{ gap: 1.5 }}>{warning && <Alert severity="warning">{warning}</Alert>}<List disablePadding>{items.map((item) => <ListItem key={item.id} disableGutters><ListItemText primary={item.label} secondary={item.description} /></ListItem>)}</List>{cost && <Stack direction="row" sx={{ gap: 1, justifyContent: "space-between" }}><Typography>{t("Co\xFBt", "Cost")}</Typography><Cost cost={cost} iconURL={iconURL} labels={labels} /></Stack>}{recovered && <Stack direction="row" sx={{ gap: 1, justifyContent: "space-between" }}><Typography>{t("R\xE9cup\xE9ration", "Recovered")}</Typography><Cost cost={recovered} iconURL={iconURL} labels={labels} /></Stack>}{onAcknowledge && <FormControlLabel control={<Checkbox checked={acknowledged} onChange={(e) => onAcknowledge(e.target.checked)} />} label={t("J\u2019ai v\xE9rifi\xE9 les cons\xE9quences.", "I have reviewed the consequences.")} />}<Action primary onClick={onConfirm} disabled={disabled || Boolean(onAcknowledge) && !acknowledged}>{t("Confirmer", "Confirm")}</Action></Stack>;
}
