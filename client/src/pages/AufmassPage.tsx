// client/src/pages/AufmassPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Customer {
  id: number;
  salutation?: string;
  firstName?: string;
  name: string;
  company?: string;
  street?: string;
  zip?: string;
  city?: string;
  email?: string;
  phone?: string;
}

const SYSTEMS = [
  "Überdach mit Polycarbon",
  "Überdach mit Glas",
  "Lamellendach",
  "Guillotine-Glassysteme",
  "Glas-Schiebesysteme",
  "Senkrechtmarkisen",
  "Unterglasmarkise",
];

function today() {
  return new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AufmassPage() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: () => api.get("/api/customers"),
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [form, setForm] = useState({ name: "", zip: "", city: "", street: "", phone: "", email: "" });
  const [systems, setSystems] = useState<Record<string, boolean>>(
    Object.fromEntries(SYSTEMS.map((s) => [s, false]))
  );
  const [notes, setNotes] = useState("");
  const [date] = useState(today());

  function handleCustomerSelect(id: string) {
    setSelectedCustomerId(id);
    if (!id) {
      setForm({ name: "", zip: "", city: "", street: "", phone: "", email: "" });
      return;
    }
    const c = customers.find((c) => String(c.id) === id);
    if (!c) return;
    setForm({
      name: [c.salutation, c.firstName, c.name].filter(Boolean).join(" "),
      zip: c.zip ?? "",
      city: c.city ?? "",
      street: c.street ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
    });
  }

  function handlePrint() {
    const logoUrl = window.location.origin + "/images/Logo/schwarz_weiß.png";
    const sysRows = SYSTEMS.map((s) => {
      const on = systems[s];
      return `<div class="sys-item">
        <div class="cb${on ? " on" : ""}"><span>${on ? "&#10003;" : ""}</span></div>
        <span>${s}</span>
      </div>`;
    }).join("");

    const esc = (t: string) => t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"/>
<title>Aufmaßblatt</title>
<style>
  @page{size:A4 portrait;margin:16mm 16mm 16mm 16mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111}
  .hdr{display:flex;justify-content:space-between;align-items:center;
       border-bottom:2.5px solid #111;padding-bottom:10px;margin-bottom:14px}
  .logo{height:50px;width:auto}
  .hdr-right{text-align:right}
  .title{font-size:17pt;font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .date-line{font-size:9pt;color:#555;margin-top:3px}
  .date-line b{color:#111}
  .main{display:flex;gap:16px}
  .col-l{flex:0 0 44%}
  .col-r{flex:1}
  .sec-title{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;
             color:#888;border-bottom:1px solid #ddd;padding-bottom:3px;margin-bottom:9px}
  .fld{margin-bottom:8px}
  .fld-lbl{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
            color:#777;margin-bottom:2px}
  .fld-val{border-bottom:1.5px solid #bbb;padding:2px 3px;min-height:18px;font-size:10.5pt}
  .fld-row{display:flex;gap:7px}
  .fld-row .fld{flex:1}
  .fld-row .fld.plz{flex:0 0 68px}
  .sys-sec{margin-top:14px}
  .sys-grid{display:flex;flex-direction:column;gap:6px;margin-top:5px}
  .sys-item{display:flex;align-items:center;gap:8px;font-size:10pt}
  .cb{width:13px;height:13px;border:1.5px solid #555;display:flex;
      align-items:center;justify-content:center;flex-shrink:0;background:#fff}
  .cb.on{background:#111;border-color:#111}
  .cb.on span{color:#fff;font-size:9pt;line-height:1}
  .notes-box{border:1.5px solid #bbb;min-height:280px;padding:9px;
             font-size:10pt;white-space:pre-wrap;word-break:break-word;color:#222}
  .footer{margin-top:22px;padding-top:9px;border-top:1px solid #ddd;
          display:flex;justify-content:space-between;font-size:8pt;color:#777}
  .sig-line{border-bottom:1px solid #aaa;width:150px;margin-bottom:3px;height:22px}
</style></head><body>
<div class="hdr">
  <img class="logo" src="${logoUrl}"/>
  <div class="hdr-right">
    <div class="title">Aufma&#223;blatt</div>
    <div class="date-line">Datum: <b>${date}</b></div>
  </div>
</div>
<div class="main">
  <div class="col-l">
    <div class="sec-title">Kundendaten</div>
    <div class="fld"><div class="fld-lbl">Kundenname</div><div class="fld-val">${esc(form.name)}</div></div>
    <div class="fld-row">
      <div class="fld plz"><div class="fld-lbl">PLZ</div><div class="fld-val">${esc(form.zip)}</div></div>
      <div class="fld"><div class="fld-lbl">Ort</div><div class="fld-val">${esc(form.city)}</div></div>
    </div>
    <div class="fld"><div class="fld-lbl">Stra&#223;e</div><div class="fld-val">${esc(form.street)}</div></div>
    <div class="fld"><div class="fld-lbl">Telefon</div><div class="fld-val">${esc(form.phone)}</div></div>
    <div class="fld"><div class="fld-lbl">E-Mail</div><div class="fld-val">${esc(form.email)}</div></div>
    <div class="sys-sec">
      <div class="sec-title">System</div>
      <div class="sys-grid">${sysRows}</div>
    </div>
  </div>
  <div class="col-r">
    <div class="sec-title">Skizze / Notizen</div>
    <div class="notes-box">${esc(notes)}</div>
  </div>
</div>
<div class="footer">
  <div><div class="sig-line"></div>Unterschrift Kunde</div>
  <div><div class="sig-line"></div>Unterschrift Mitarbeiter</div>
  <div style="align-self:flex-end;color:#ccc">AC Premium Bau</div>
</div>
</body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open(); doc.write(html); doc.close();
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toolbar */}
      <div className="max-w-5xl mx-auto mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aufmaßblatt</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kunde wählen · ausfüllen · drucken</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCustomerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="">— Kunde auswählen —</option>
            {customers.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {[c.salutation, c.firstName, c.name].filter(Boolean).join(" ")}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors shadow"
          >
            🖨️ Drucken / PDF
          </button>
        </div>
      </div>

      {/* Karte */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Karten-Header */}
        <div className="bg-gray-900 px-8 py-5 flex items-center justify-between">
          <img src="/images/Logo/schwarz_weiß.png" alt="Logo" className="h-12 object-contain" />
          <div className="text-right">
            <div className="text-white font-bold text-lg uppercase tracking-widest">Aufmaßblatt</div>
            <div className="text-gray-400 text-sm mt-0.5">Datum: {date}</div>
          </div>
        </div>

        <div className="p-8 flex gap-8">
          {/* Linke Spalte */}
          <div className="w-72 shrink-0 space-y-5">
            <div>
              <SectionTitle>Kundendaten</SectionTitle>
              <div className="space-y-3 mt-3">
                <Field label="Kundenname" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <div className="flex gap-2">
                  <Field label="PLZ" value={form.zip} onChange={(v) => setForm((f) => ({ ...f, zip: v }))} className="w-24" />
                  <Field label="Ort" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} className="flex-1" />
                </div>
                <Field label="Straße" value={form.street} onChange={(v) => setForm((f) => ({ ...f, street: v }))} />
                <Field label="Telefon" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <Field label="E-Mail" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              </div>
            </div>
            <div>
              <SectionTitle>System</SectionTitle>
              <div className="space-y-2 mt-3">
                {SYSTEMS.map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setSystems((p) => ({ ...p, [s]: !p[s] }))}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        systems[s] ? "bg-gray-900 border-gray-900" : "border-gray-300 group-hover:border-gray-500"
                      }`}
                    >
                      {systems[s] && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="flex-1 flex flex-col">
            <SectionTitle>Skizze / Notizen</SectionTitle>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Maße, Skizzen-Beschreibung, Besonderheiten …"
              className="flex-1 mt-3 w-full border-2 border-gray-100 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-300 transition-colors bg-gray-50"
              style={{ minHeight: "380px" }}
            />
          </div>
        </div>

        {/* Unterschriften */}
        <div className="px-8 pb-8 pt-0 flex gap-6">
          {["Unterschrift Kunde", "Unterschrift Mitarbeiter"].map((lbl) => (
            <div key={lbl} className="flex-1">
              <div className="border-b-2 border-gray-200 h-10 mb-1" />
              <p className="text-xs text-gray-400">{lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
      {children}
    </h3>
  );
}

function Field({
  label, value, onChange, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b-2 border-gray-200 focus:border-gray-500 outline-none py-1 text-sm text-gray-800 bg-transparent transition-colors"
      />
    </div>
  );
}
