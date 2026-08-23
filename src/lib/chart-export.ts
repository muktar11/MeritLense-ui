// Exports a recharts-rendered SVG chart (found inside `container`) as a PNG
// data URL, by serializing the SVG and drawing it onto an offscreen canvas.
// recharts renders plain SVG (not canvas), so there is no built-in
// `.toDataURL()` to call - this is the standard workaround.
// recharts renders more than one <svg class="recharts-surface"> inside the
// container - the actual chart plus one tiny swatch icon per legend entry
// (e.g. a 14x14 solid-color square for each selected candidate). Picking
// the first one in DOM order can grab a legend swatch instead of the real
// chart, exporting a single flat color rather than the chart. The real
// chart SVG is always by far the largest, so pick by rendered area.
function findChartSvg(container: HTMLElement): SVGSVGElement | null {
  const candidates = Array.from(container.querySelectorAll("svg"));
  if (candidates.length === 0) return null;
  return candidates.reduce((largest, svg) =>
    svg.clientWidth * svg.clientHeight > largest.clientWidth * largest.clientHeight ? svg : largest
  );
}

export interface ChartLegendEntry {
  name: string;
  color: string;
}

const LEGEND_ROW_HEIGHT = 28;
const LEGEND_SWATCH_SIZE = 12;
const LEGEND_FONT = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// recharts' <Legend> renders as a plain HTML <div>/<ul> sibling of the
// chart's <svg>, not inside it - so it's invisible to an SVG-only export no
// matter which <svg> gets picked. Rather than trying to rasterize that DOM
// subtree, draw an equivalent legend strip directly onto the export canvas
// from the same name/color data the chart itself was built from - this is
// also more reliable, since it can't drift from what's actually plotted.
function drawLegend(ctx: CanvasRenderingContext2D, legend: ChartLegendEntry[], width: number, y: number) {
  ctx.font = LEGEND_FONT;
  ctx.textBaseline = "middle";

  const gaps = legend.map((entry) => LEGEND_SWATCH_SIZE + 6 + ctx.measureText(entry.name).width);
  const totalWidth = gaps.reduce((sum, w) => sum + w, 0) + (legend.length - 1) * 20;
  let x = Math.max(0, (width - totalWidth) / 2);

  for (let i = 0; i < legend.length; i++) {
    const entry = legend[i];
    ctx.fillStyle = entry.color;
    ctx.fillRect(x, y - LEGEND_SWATCH_SIZE / 2, LEGEND_SWATCH_SIZE, LEGEND_SWATCH_SIZE);
    ctx.fillStyle = "#374151";
    ctx.fillText(entry.name, x + LEGEND_SWATCH_SIZE + 6, y + 1);
    x += gaps[i] + 20;
  }
}

async function svgToPngDataUrl(container: HTMLElement, legend?: ChartLegendEntry[]): Promise<string> {
  const svg = findChartSvg(container);
  if (!svg) {
    throw new Error("No chart SVG found to export");
  }

  const width = svg.clientWidth || svg.viewBox.baseVal.width || 800;
  const height = svg.clientHeight || svg.viewBox.baseVal.height || 500;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to rasterize chart"));
      img.src = url;
    });

    const legendHeight = legend && legend.length > 0 ? LEGEND_ROW_HEIGHT : 0;
    const totalHeight = height + legendHeight;

    const canvas = document.createElement("canvas");
    // 2x scale for a sharper export than the on-screen render.
    canvas.width = width * 2;
    canvas.height = totalHeight * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, totalHeight);
    ctx.drawImage(img, 0, 0, width, height);
    if (legend && legend.length > 0) {
      drawLegend(ctx, legend, width, height + legendHeight / 2);
    }

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportChartAsPng(container: HTMLElement, filename: string, legend?: ChartLegendEntry[]) {
  const dataUrl = await svgToPngDataUrl(container, legend);
  downloadDataUrl(dataUrl, filename);
}

export async function exportChartAsPdf(container: HTMLElement, filename: string, title?: string, legend?: ChartLegendEntry[]) {
  const dataUrl = await svgToPngDataUrl(container, legend);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let cursorY = 15;
  if (title) {
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 10;
  }

  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - cursorY - margin;
  // Preserve the chart's real aspect ratio rather than stretching it.
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = dataUrl;
  });
  const aspect = img.width / img.height;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / aspect;
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * aspect;
  }
  const x = (pageWidth - drawWidth) / 2;

  doc.addImage(dataUrl, "PNG", x, cursorY, drawWidth, drawHeight);
  doc.save(filename);
}
