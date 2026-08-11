// Exports a recharts-rendered SVG chart (found inside `container`) as a PNG
// data URL, by serializing the SVG and drawing it onto an offscreen canvas.
// recharts renders plain SVG (not canvas), so there is no built-in
// `.toDataURL()` to call - this is the standard workaround.
async function svgToPngDataUrl(container: HTMLElement): Promise<string> {
  const svg = container.querySelector("svg");
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

    const canvas = document.createElement("canvas");
    // 2x scale for a sharper export than the on-screen render.
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

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

export async function exportChartAsPng(container: HTMLElement, filename: string) {
  const dataUrl = await svgToPngDataUrl(container);
  downloadDataUrl(dataUrl, filename);
}

export async function exportChartAsPdf(container: HTMLElement, filename: string, title?: string) {
  const dataUrl = await svgToPngDataUrl(container);
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
