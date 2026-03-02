"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface MermaidChartProps {
  chart: string;
  className?: string;
}

export function MermaidChart({ chart, className = "" }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#f5f0eb",
          primaryTextColor: "#3d3529",
          primaryBorderColor: "#c9a96e",
          lineColor: "#8b7355",
          secondaryColor: "#f0ebe5",
          tertiaryColor: "#e8e0d4",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
          edgeLabelBackground: "#faf6f1",
          clusterBkg: "transparent",
          clusterBorder: "#d4c8b8",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 16,
          nodeSpacing: 40,
          rankSpacing: 60,
          useMaxWidth: true,
        },
      });

      if (cancelled || !containerRef.current) return;

      const id = `mermaid-${Date.now()}`;
      const { svg } = await mermaid.render(id, chart);
      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = svg;

      // Style the rendered SVG
      const svgEl = containerRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.maxWidth = "100%";
        svgEl.style.height = "auto";
      }

      setRendered(true);
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: rendered ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full overflow-x-auto ${className}`}
      ref={containerRef}
    />
  );
}
