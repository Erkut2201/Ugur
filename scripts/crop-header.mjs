import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mupdf = await import("mupdf");

const data = readFileSync(path.join(__dirname, "../attachments/Briefkopf.pdf"));
const doc = mupdf.Document.openDocument(data, "application/pdf");
const page = doc.loadPage(0);
const scale = 3;
const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
const w = pixmap.getWidth();
const h = pixmap.getHeight();

// 17% = logo + company info + gray address strip + separator + contact strip (phone/email/web)
const cropH = Math.floor(h * 0.17);
const rowBytes = w * 3;
const pixels = pixmap.getPixels();
const cp = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, [0, 0, w, cropH], false);
cp.setResolution(pixmap.getXResolution(), pixmap.getYResolution());
cp.getPixels().set(pixels.slice(0, cropH * rowBytes));
const jpeg = cp.asJPEG(92, false);
writeFileSync(path.join(__dirname, "../attachments/header.jpg"), jpeg);
console.log(`header.jpg: ${w}x${cropH}px`);
