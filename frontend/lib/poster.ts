import type { PosterConcept } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Naive char-budget wrap; SVG text does not wrap itself
function wrap(text: string, max: number, maxLines = 3): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, maxLines);
}

// Branded poster template — HTML/CSS-style layout as SVG so text renders perfectly
// (the brief recommends templates over image models). 1080x1350, Instagram portrait.
export function posterSvg(
  poster: PosterConcept,
  profile: { businessName: string; location: string; primaryColor?: string }
): string {
  const accent = /^#[0-9a-fA-F]{6}$/.test(profile.primaryColor ?? "") ? profile.primaryColor : "#20E59A";
  const ink = "#070908";
  const paper = "#F4F5F0";
  const font = "Arial, Helvetica, sans-serif";
  const headLines = wrap(poster.headline, 14);
  const startY = 560 + (3 - headLines.length) * 55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0B5C43"/><stop offset="1" stop-color="${ink}"/>
</linearGradient></defs>
<rect width="1080" height="1350" fill="url(#bg)"/>
<circle cx="920" cy="140" r="280" fill="${accent}" opacity="0.14"/>
<circle cx="140" cy="1250" r="220" fill="${accent}" opacity="0.10"/>
<text x="72" y="140" fill="${paper}" font-family="${font}" font-size="42" font-weight="600">${esc(profile.businessName)}</text>
<text x="72" y="192" fill="${paper}" font-family="${font}" font-size="28" opacity="0.65">${esc(profile.location)}</text>
<rect x="72" y="300" width="88" height="8" rx="4" fill="${accent}"/>
${headLines
  .map(
    (l, i) =>
      `<text x="72" y="${startY + i * 108}" fill="${paper}" font-family="${font}" font-size="92" font-weight="700">${esc(l)}</text>`
  )
  .join("\n")}
<text x="72" y="${startY + headLines.length * 108 + 30}" fill="${paper}" font-family="${font}" font-size="40" opacity="0.75">${esc(poster.subline)}</text>
<rect x="72" y="1120" width="440" height="92" rx="46" fill="${accent}"/>
<text x="292" y="1177" fill="${ink}" font-family="${font}" font-size="34" font-weight="600" text-anchor="middle">${esc(poster.cta)}</text>
</svg>`;
}

export const svgDataUri = (svg: string) =>
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

export function downloadFile(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Rasterize the SVG template to a PNG via canvas — no external deps
export function downloadPosterPng(svg: string, filename: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    canvas.getContext("2d")?.drawImage(img, 0, 0, 1080, 1350);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };
  img.src = url;
}
