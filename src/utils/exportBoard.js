import html2canvas from "html2canvas";

async function captureFullBoard() {
  const uiSelectors = [
    "[class*='container']",
    "[class*='zoomControls']",
    "[class*='toolHint']",
    "[class*='root']",
    "[class*='layerControls']",
  ];

  const hidden = [];

  uiSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.id !== "canvas") {
        hidden.push({ el, prev: el.style.visibility });
        el.style.visibility = "hidden";
      }
    });
  });

  const snapshot = await html2canvas(document.body, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  hidden.forEach(({ el, prev }) => {
    el.style.visibility = prev;
  });

  return snapshot.toDataURL("image/png");
}

export async function exportAsPng() {
  const dataUrl = await captureFullBoard();

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `sketchboard-${Date.now()}.png`;
  link.click();
}

export async function exportAsPdf() {
  const dataUrl = await captureFullBoard();

  let jsPDF;

  try {
    const mod = await import("jspdf");
    jsPDF = mod.jsPDF ?? mod.default;
  } catch {
    alert("PDF export requires jsPDF. Run: npm install jspdf");
    return;
  }

  const img = new Image();
  img.src = dataUrl;

  await new Promise((res) => {
    img.onload = res;
  });

  const cw = img.width;
  const ch = img.height;

  const orientation = cw >= ch ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [cw, ch],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, cw, ch);
  pdf.save(`sketchboard-${Date.now()}.pdf`);
}