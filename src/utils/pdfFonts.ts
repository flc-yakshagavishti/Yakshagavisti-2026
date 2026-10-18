import type { jsPDF } from "jspdf";

let cachedFonts: { regular: string; bold: string } | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return typeof window !== "undefined"
    ? window.btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
}

/**
 * Loads and registers Noto Sans Kannada (regular and bold) into a jsPDF document.
 * Returns true if font setup succeeded, false if fallback to default font is needed.
 */
export async function setupKannadaFonts(doc: jsPDF): Promise<boolean> {
  try {
    if (!cachedFonts) {
      const [regRes, boldRes] = await Promise.all([
        fetch("/fonts/NotoSansKannada/NotoSansKannada-Regular.ttf"),
        fetch("/fonts/NotoSansKannada/NotoSansKannada-Bold.ttf"),
      ]);

      if (!regRes.ok || !boldRes.ok) {
        console.warn("Could not load Kannada fonts from /fonts/NotoSansKannada/");
        return false;
      }

      const [regBuf, boldBuf] = await Promise.all([
        regRes.arrayBuffer(),
        boldRes.arrayBuffer(),
      ]);

      cachedFonts = {
        regular: arrayBufferToBase64(regBuf),
        bold: arrayBufferToBase64(boldBuf),
      };
    }

    doc.addFileToVFS("NotoSansKannada-Regular.ttf", cachedFonts.regular);
    doc.addFont("NotoSansKannada-Regular.ttf", "NotoSansKannada", "normal");

    doc.addFileToVFS("NotoSansKannada-Bold.ttf", cachedFonts.bold);
    doc.addFont("NotoSansKannada-Bold.ttf", "NotoSansKannada", "bold");

    return true;
  } catch (error) {
    console.warn("Error setting up Kannada fonts in jsPDF:", error);
    return false;
  }
}

/**
 * Normalizes text for PDF export without stripping Unicode / Kannada characters.
 */
export function cleanPdfText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
