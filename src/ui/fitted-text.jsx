import React, { useLayoutEffect, useRef, useState } from "react";
import { Typography } from "./components.mjs";
export function FittedText({ children, maxFont = 12, minFont = 8, sx, ...props }) {
  const ref = useRef(null), [font, setFont] = useState(maxFont), [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    setFont(maxFont);
    const node = ref.current;
    if (!node) return;
    let previous = node.clientWidth;
    const resize = () => {
      if (node.clientWidth === previous) return;
      previous = node.clientWidth;
      setFont(maxFont);
      setWidth(previous);
    };
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children, maxFont]);
  useLayoutEffect(() => {
    const node = ref.current;
    if (node?.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) setFont((current) => Math.max(minFont, Math.min(current, current * node.clientWidth / node.scrollWidth)));
  }, [children, font, width, minFont]);
  return <Typography component="span" variant="caption" ref={ref} {...props} sx={[{ display: "block", width: "100%", minWidth: 0, whiteSpace: "normal", wordBreak: "normal", hyphens: "none", fontSize: font }, sx]}>{children}</Typography>;
}
