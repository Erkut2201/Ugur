// scripts/analyze-xlsx-full.mjs — alle relevanten Daten ausgeben
import XLSX from "xlsx";

const wb = XLSX.readFile("./client/example/APT_KubiQ_Preiskalkulator.xlsx");

// Zubehör_Referenz — alle einzigartigen Kategorien
const zubehoer = XLSX.utils.sheet_to_json(wb.Sheets["Zubehör_Referenz"], { header: 1, defval: "" });
const cats = [...new Set(zubehoer.slice(2).map(r => r[0]).filter(Boolean))];
console.log("\nZubehör Kategorien:", cats);
console.log("Zubehör Zeilen:", zubehoer.slice(2).filter(r => r[1]).length);

// Preisdaten — alle einzigartigen Produkte
const preise = XLSX.utils.sheet_to_json(wb.Sheets["Preisdaten"], { header: 1, defval: "" });
const produkte = [...new Set(preise.slice(1).map(r => r[0]).filter(Boolean))];
console.log("\nPreisdaten Produkte:", produkte);
console.log("Preisdaten Zeilen:", preise.slice(1).filter(r => r[0]).length);

// Produktliste
const pliste = XLSX.utils.sheet_to_json(wb.Sheets["Produktliste"], { header: 1, defval: "" });
const alle = pliste.filter(r => r[0]).map(r => r[0]);
console.log("\nProduktliste:", alle);

// Festelemente — Struktur
const fest = XLSX.utils.sheet_to_json(wb.Sheets["Festelemente_Referenz"], { header: 1, defval: "" });
console.log("\nFestelemente (Zeilen 4-40):");
fest.slice(4, 40).forEach((r, i) => { if (r.some(c => c !== "")) console.log(i+4, JSON.stringify(r)); });
