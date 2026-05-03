/**
 * exportBoard.js
 * Exports the whiteboard canvas as PNG or PDF.
 * PDF uses jsPDF — install with: npm install jspdf
 */

/**
 * Export canvas as PNG download.
 * @param {string} canvasId - id of the <canvas> element
 */
export function exportAsPng(canvasId = "canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `sketchboard-${Date.now()}.png`;
  link.click();
}

/**
 * Export canvas as PDF download.
 * Dynamically imports jsPDF so the rest of the app doesn't need it at startup.
 * @param {string} canvasId - id of the <canvas> element
 */
export async function exportAsPdf(canvasId = "canvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Dynamic import — works with CRA, Vite, Next
  let jsPDF;
  try {
    const mod = await import("jspdf");
    jsPDF = mod.jsPDF ?? mod.default;
  } catch {
    alert("PDF export requires jsPDF. Run: npm install jspdf");
    return;
  }

  const imgData   = canvas.toDataURL("image/png");
  const cw        = canvas.width;
  const ch        = canvas.height;

  // Landscape or portrait based on canvas aspect
  const orientation = cw >= ch ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [cw, ch] });

  pdf.addImage(imgData, "PNG", 0, 0, cw, ch);
  pdf.save(`sketchboard-${Date.now()}.pdf`);
}