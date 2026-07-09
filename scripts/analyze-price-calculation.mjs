// scripts/analyze-price-calculation.mjs
// Analysiert die Preiskalkulation und Abhängigkeiten in der Excel-Datei
import XLSX from "xlsx";

const wb = XLSX.readFile("./client/example/APT_KubiQ_Preiskalkulator.xlsx");

console.log("=== ALLE SHEETS ===");
console.log(wb.SheetNames);
console.log("");

// Funktion um Sheet-Daten anzuzeigen
function analyzeSheet(sheetName, maxRows = 50) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`SHEET: ${sheetName}`);
  console.log("=".repeat(80));
  
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.log("  (Sheet nicht gefunden)");
    return;
  }
  
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  console.log(`Anzahl Zeilen: ${data.length}`);
  
  // Erste Zeilen anzeigen
  data.slice(0, maxRows).forEach((row, idx) => {
    if (row.some(cell => cell !== "")) {
      console.log(`${String(idx).padStart(3, " ")}: ${JSON.stringify(row)}`);
    }
  });
  
  // Wenn es mehr Zeilen gibt, letzte paar auch anzeigen
  if (data.length > maxRows) {
    console.log(`\n... (${data.length - maxRows} Zeilen übersprungen) ...\n`);
    data.slice(-5).forEach((row, idx) => {
      const actualIdx = data.length - 5 + idx;
      if (row.some(cell => cell !== "")) {
        console.log(`${String(actualIdx).padStart(3, " ")}: ${JSON.stringify(row)}`);
      }
    });
  }
}

// Alle Sheets analysieren
for (const sheetName of wb.SheetNames) {
  analyzeSheet(sheetName, 30);
}

console.log("\n" + "=".repeat(80));
console.log("ANALYSE ABGESCHLOSSEN");
console.log("=".repeat(80));
