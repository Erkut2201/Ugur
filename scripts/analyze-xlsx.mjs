// scripts/analyze-xlsx.mjs — einmalig ausführen um Struktur zu sehen
import XLSX from "xlsx";

const wb = XLSX.readFile("./client/example/APT_KubiQ_Preiskalkulator.xlsx");
console.log("Sheets:", wb.SheetNames);

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  console.log(`\n=== Sheet: "${name}" (${data.length} rows) ===`);
  data.slice(0, 12).forEach((row, i) => console.log(i, JSON.stringify(row)));
}
