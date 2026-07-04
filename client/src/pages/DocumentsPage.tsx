// client/src/pages/DocumentsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

const TYPE_LABELS: Record<string, string> = {
  quote: "Angebot",
  invoice: "Rechnung",
  protocol: "Protokoll",
};
const TYPE_COLORS: Record<string, string> = {
  quote: "bg-blue-100 text-blue-700",
  invoice: "bg-yellow-100 text-yellow-700",
  protocol: "bg-green-100 text-green-700",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf", sent: "Versendet", accepted: "Angenommen", rejected: "Abgelehnt",
  paid: "Bezahlt", overdue: "Überfällig", completed: "Abgeschlossen", signed: "Unterschrieben",
};

function apiPathForType(docType: string) {
  if (docType === "quote") return "quotes";
  if (docType === "invoice") return "invoices";
  return "protocols";
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  // Email state
  const [emailTarget, setEmailTarget] = useState<any>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  const { data: docs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/documents", typeFilter],
    queryFn: () => api.get(`/api/documents${typeFilter ? `?type=${typeFilter}` : ""}`),
  });
  const { data: config } = useQuery<{ smtpConfigured: boolean }>({
    queryKey: ["/api/config"],
    queryFn: () => api.get("/api/config"),
    staleTime: Infinity,
  });

  const emailMutation = useMutation({
    mutationFn: ({ doc, to, message }: { doc: any; to: string; message: string }) =>
      api.post(`/api/${apiPathForType(doc.docType)}/${doc.id}/send-email`, { to, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/documents"] });
      setEmailTarget(null);
      alert("E-Mail wurde versendet!");
    },
  });

  const filtered = docs.filter(
    (d) =>
      !search ||
      d.number?.toLowerCase().includes(search.toLowerCase()) ||
      (d.projectDescription ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Email view
  if (emailTarget) {
    const typeLabel = TYPE_LABELS[emailTarget.docType] ?? emailTarget.docType;
    const templates = emailTarget.docType === "invoice"
      ? [
          { id: "intro", label: "Rechnung übersenden", text: `Sehr geehrte Damen und Herren,\n\nanbei finden Sie unsere Rechnung ${emailTarget.number} für die erbrachten Leistungen.\n\nWir bitten um Begleichung innerhalb der vereinbarten Zahlungsfrist.` },
          { id: "reminder", label: "Zahlungserinnerung", text: `Sehr geehrte Damen und Herren,\n\nwir erlauben uns, Sie freundlich an die ausstehende Zahlung unserer Rechnung ${emailTarget.number} zu erinnern.` },
          { id: "greetings", label: "Grußformel", text: `Mit freundlichen Grüßen\n\nPlanungsbüro Ulrich Dietzel\nUlrich Dietzel` },
        ]
      : [
          { id: "intro", label: `${typeLabel} übersenden`, text: `Sehr geehrte Damen und Herren,\n\nanbei finden Sie unser${emailTarget.docType === "quote" ? "" : "e"} ${typeLabel} ${emailTarget.number}.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.` },
          { id: "greetings", label: "Grußformel", text: `Mit freundlichen Grüßen\n\nPlanungsbüro Ulrich Dietzel\nUlrich Dietzel` },
        ];

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEmailTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">←</button>
          <h1 className="text-2xl font-black text-gray-900">{typeLabel} per E-Mail versenden</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{typeLabel}: <span className="font-semibold text-gray-900">{emailTarget.number}</span></span>
              {!config?.smtpConfigured && (
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2.5 py-1 font-medium">⚠ SMTP nicht konfiguriert</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Empfänger *</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nachricht</label>
              <textarea rows={10} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-y" value={emailMsg} onChange={(e) => setEmailMsg(e.target.value)} placeholder={`Sehr geehrte Damen und Herren,\n\nanbei finden Sie ${TYPE_LABELS[emailTarget.docType] ?? ""} ${emailTarget.number}.\n\nMit freundlichen Grüßen`} />
            </div>
            <div className="flex justify-between items-center pt-1 gap-3">
              <button onClick={() => setEmailMsg("")} className="text-xs text-gray-400 hover:text-gray-600">Leeren</button>
              <div className="flex gap-3">
                <button onClick={() => setEmailTarget(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900">Abbrechen</button>
                <button
                  disabled={!emailTo || emailMutation.isPending}
                  onClick={() => emailMutation.mutate({ doc: emailTarget, to: emailTo, message: emailMsg })}
                  className="bg-brand-red text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {emailMutation.isPending ? "Senden..." : "📧 Senden"}
                </button>
              </div>
            </div>
          </div>
          <div className="w-full md:w-60 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Textvorlagen</h3>
                <p className="text-xs text-gray-400 mt-0.5">Klicken zum Einfügen</p>
              </div>
              <div className="divide-y divide-gray-100">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => setEmailMsg((prev) => prev ? prev + "\n\n" + t.text : t.text)} className="w-full text-left px-4 py-3 hover:bg-brand-red/5 group transition-colors">
                    <div className="text-sm font-medium text-gray-800 group-hover:text-brand-red">{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.text.substring(0, 60)}…</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Dokumentenarchiv</h1>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        >
          <option value="">Alle Typen</option>
          <option value="quote">Angebote</option>
          <option value="invoice">Rechnungen</option>
          <option value="protocol">Protokolle</option>
        </select>
        <div className="text-sm text-gray-500 self-center">
          {filtered.length} Dokument{filtered.length !== 1 ? "e" : ""}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Keine Dokumente gefunden.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide text-left">
                  <th className="px-5 py-3">Typ</th>
                  <th className="px-5 py-3">Nummer</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3">Projekt</th>
                  <th className="px-5 py-3 text-right">Betrag</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[doc.docType] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABELS[doc.docType] ?? doc.docType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{doc.number}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Intl.DateTimeFormat("de-DE").format(new Date(doc.date))}
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-[180px] truncate">
                      {doc.projectDescription ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {doc.total != null
                        ? `${parseFloat(doc.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">
                        {STATUS_LABELS[doc.status] ?? doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => window.open(`/api/${apiPathForType(doc.docType)}/${doc.id}/pdf/download`, "_blank")}
                          className="text-xs text-gray-600 hover:underline"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => { setEmailTarget(doc); setEmailTo(""); setEmailMsg(""); }}
                          className="text-xs text-gray-600 hover:underline"
                        >
                          E-Mail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((doc, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[doc.docType] ?? "bg-gray-100 text-gray-600"}`}>
                          {TYPE_LABELS[doc.docType] ?? doc.docType}
                        </span>
                        <span className="font-mono text-xs text-gray-700">{doc.number}</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">{doc.projectDescription ?? "—"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Intl.DateTimeFormat("de-DE").format(new Date(doc.date))}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {doc.total != null && <div className="font-semibold text-sm">{parseFloat(doc.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</div>}
                      <div className="text-xs text-gray-400 mt-0.5">{STATUS_LABELS[doc.status] ?? doc.status}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => window.open(`/api/${apiPathForType(doc.docType)}/${doc.id}/pdf/download`, "_blank")}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => { setEmailTarget(doc); setEmailTo(""); setEmailMsg(""); }}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      E-Mail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


