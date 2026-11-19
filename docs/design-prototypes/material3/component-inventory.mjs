import React, { useState } from "react";
import { TextField, Typography, Chip, Box, Link } from "../../../src/ui/components.mjs";
import { HeroesPanel, HeroesButton } from "../../../src/ui/heroes-kit.mjs";
import report from "../../ui-audit/component-needs.json";
const h = React.createElement;
export function ComponentInventory({ language, navigation }) {
  const t = (fr, en) => language === "fr" ? fr : en, [query, setQuery] = useState(""), [selected, setSelected] = useState("mobile");
  const filtered = report.screens.filter((screen2) => [screen2.id, screen2.category, ...screen2.variants, ...screen2.variantsEn].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const screen = filtered.find((s) => s.id === selected) || filtered[0];
  const statuses = { available: t("Disponible dans la biblioth\xE8que", "Available in the library"), mui: t("Composant MUI", "MUI component"), compose: t("Composition \xE0 cr\xE9er", "Composition needed"), engine: t("Rendu du jeu \xE0 conserver", "Keep game rendering") };
  return h(
    Box,
    { component: "div", className: "ds-catalogue ds-inventory" },
    h(Box, { component: "header", className: "ds-intro" }, h(Box, { component: "div" }, h(Typography, { component: "h1", variant: "h1" }, t("\xC9crans et composants n\xE9cessaires", "Screens and required components")), h(Box, { component: "p", className: "ds-note" }, `${report.screenCount} ${t("modules", "modules")} \xB7 ${report.variantCount} ${t("variantes", "variants")} \xB7 ${report.components.length} ${t("familles de composants", "component families")}`)), navigation),
    h(HeroesPanel, null, h(Box, { component: "p" }, t("Revue des sources et des dispositions existantes. Les douze \xE9crans captur\xE9s ne constituent pas une validation visuelle de toutes les variantes.", "Review of sources and existing layouts. The twelve captured screens are not visual validation of every variant.")), h(Box, { component: "div", className: "ds-review-statuses" }, Object.entries(statuses).map(([status, label]) => h(Chip, { key: status, label: `${report.components.filter((c) => c.status === status).length} \xB7 ${label}` })))),
    h(
      Box,
      { component: "div", className: "ds-review-layout" },
      h(HeroesPanel, { className: "ds-review-picker" }, h(TextField, { label: t("Rechercher un \xE9cran", "Search screens"), value: query, onChange: (e) => setQuery(e.target.value), fullWidth: true }), h(Box, { component: "p", className: "ds-note" }, filtered.length + " " + t("modules affich\xE9s", "modules shown")), h(Box, { component: "nav", "aria-label": t("\xC9crans du jeu", "Game screens"), className: "ds-review-list" }, filtered.map((s) => h(HeroesButton, { key: s.id, tone: s.id === screen?.id ? "primary" : "secondary", onClick: () => setSelected(s.id), "data-screen-id": s.id, "aria-current": s.id === screen?.id ? "page" : void 0 }, h(Box, { component: "span" }, (language === "fr" ? s.variants : s.variantsEn)[0], h(Box, { component: "small" }, s.id)))))),
      screen ? h(HeroesPanel, { className: "ds-review-details", "data-reviewed-screen": screen.id }, h(Typography, { component: "h2", variant: "h2" }, (language === "fr" ? screen.variants : screen.variantsEn)[0]), h(Link, { href: "https://github.com/pikipiki/heroes3-goonks-and-magic/blob/main/" + screen.source, rel: "noreferrer", target: "_blank" }, screen.source), h(Box, { component: "h3" }, t("Variantes \xE0 couvrir", "Variants to cover")), h(Box, { component: "ul" }, (language === "fr" ? screen.variants : screen.variantsEn).map((variant) => h(Box, { component: "li", key: variant }, variant))), h(Box, { component: "h3" }, t("Composants n\xE9cessaires", "Required components")), h(Box, { component: "div", className: "ds-review-needs" }, screen.needs.map((id) => {
        const component = report.components.find((c) => c.id === id);
        return h(Box, { component: "div", key: id }, h(Box, { component: "strong" }, language === "fr" ? component.fr : component.en), h(Chip, { size: "small", label: statuses[component.status] }), h(Box, { component: "p", className: "ds-note" }, language === "fr" ? component.implementation : component.implementationEn));
      })), h(Box, { component: "h3" }, t("V\xE9rifications communes", "Shared checks")), h(Box, { component: "p" }, t("Fran\xE7ais et anglais ; petit portrait et paysage ; noms entiers ; actions accessibles ; \xE9tats vide, chargement, erreur, d\xE9sactiv\xE9 et s\xE9lectionn\xE9 ; rotation et mouvements r\xE9duits.", "French and English; small portrait and landscape; complete names; reachable actions; empty, loading, error, disabled and selected states; rotation and reduced motion."))) : h(HeroesPanel, null, t("Aucun \xE9cran correspondant.", "No matching screen."))
    )
  );
}
