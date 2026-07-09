// client/src/pages/InvoicesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../lib/api.js";
import DocumentForm, { DocumentFormData } from "../components/DocumentForm.js";
import EmailDialog from "../components/EmailDialog.js";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf", sent: "Versendet", paid: "Bezahlt", overdue: "Überfällig",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-orange-100 text-orange-700",
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [emailTarget, setEmailTarget] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: () => api.get("/api/invoices"),
  });
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    queryFn: () => api.get("/api/customers"),
  });
  const { data: config } = useQuery<{ smtpConfigured: boolean }>({
    queryKey: ["/api/config"],
    queryFn: () => api.get("/api/config"),
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (data: DocumentFormData) =>
      editing
        ? api.put(`/api/invoices/${editing.id}`, { ...data, status: editing.status ?? "draft" })
        : api.post("/api/invoices", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); setView("list"); setEditing(null); setEditingId(null); },
    onError: (err: any) => alert("Fehler beim Speichern: " + (err.message ?? err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/invoices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/invoices"] }),
    onError: (err: any) => alert(err.message),
  });

  const pdfMutation = useMutation({
    mutationFn: (id: number) => api.post<{ url: string }>(`/api/invoices/${id}/pdf`),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); window.open(data.url, "_blank"); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/invoices/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/invoices"] }),
  });

  const fromInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => api.post(`/api/protocols/from-invoice/${invoiceId}`),
    onSuccess: (_data, invoiceId) => {
      // Auto-set invoice status to "sent" when protocol is created
      api.patch(`/api/invoices/${invoiceId}/status`, { status: "sent" });
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/protocols"] });
      // No navigation — user clicks the badge to go to protocols
    },
  });

  const emailMutation = useMutation({
    mutationFn: ({ id, to, message }: { id: number; to: string; message: string }) =>
      api.post(`/api/invoices/${id}/send-email`, { to, message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); },
  });

  function openEdit(inv: any) { setEditing(inv); setEditingId(inv.id); setView("form"); }

  function openEmail(inv: any) {
    setEmailTarget(inv);
    setEmailDialogOpen(true);
  }

  const { data: editingFull, isLoading: editingLoading } = useQuery<any>({
    queryKey: ["/api/invoices", editingId],
    queryFn: () => api.get(`/api/invoices/${editingId}`),
    enabled: editingId !== null,
  });

  if (view === "form") {
    if (editingId !== null && editingLoading) {
      return <div className="text-gray-500 py-8 text-center">Lade Rechnung...</div>;
    }
    const initialData = editingId !== null ? (editingFull ?? editing) : null;
    return (
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-6">
          {editing ? `Rechnung ${editing.invoiceNumber} bearbeiten` : "Neue Rechnung"}
        </h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <DocumentForm
            docType="invoice"
            customers={customers}
            initial={initialData}
            onSubmit={(data) => saveMutation.mutate(data)}
            onCancel={() => { setView("list"); setEditing(null); setEditingId(null); }}
            isPending={saveMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {emailTarget && (
        <EmailDialog
          open={emailDialogOpen}
          onClose={() => { setEmailDialogOpen(false); setEmailTarget(null); }}
          docType="invoice"
          docId={emailTarget.id}
          docNumber={emailTarget.invoiceNumber}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/invoices"] })}
        />
      )}
      <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">Rechnungen</h1>
        <button onClick={() => { setEditing(null); setEditingId(null); setView("form"); }} className="bg-brand-gold text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          + Neue Rechnung
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Suchen nach Nummer, Projekt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Noch keine Rechnungen.</div>
        ) : (() => {
          const sl = search.toLowerCase();
          const filtered = search
            ? invoices.filter((inv) =>
                inv.invoiceNumber?.toLowerCase().includes(sl) ||
                inv.projectDescription?.toLowerCase().includes(sl)
              )
            : invoices;
          if (filtered.length === 0) return (
            <div className="p-8 text-center text-gray-400 text-sm">Keine Treffer für „{search}".</div>
          );
          return (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide text-left">
                  <th className="px-5 py-3">Nummer</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3">Zahlungsziel</th>
                  <th className="px-5 py-3 text-right">Gesamt</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-gray-700">{inv.invoiceNumber}</div>
                      <div className="mt-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {inv.invoiceType === "down_payment" ? "Anzahlungsrechnung" : inv.invoiceType === "final" ? "Finale Rechnung" : "Standardrechnung"}
                      </div>
                      {inv.linkedProtocolNumber && (
                        <button
                          onClick={() => navigate("/protocols")}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                          title={`Zum Protokoll ${inv.linkedProtocolNumber} springen`}
                        >
                          <span>&#8594;</span>
                          <span className="font-mono">{inv.linkedProtocolNumber}</span>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{new Intl.DateTimeFormat("de-DE").format(new Date(inv.date))}</td>
                    <td className="px-5 py-3 text-gray-500">{inv.dueDate ? new Intl.DateTimeFormat("de-DE").format(new Date(inv.dueDate)) : "—"}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{parseFloat(inv.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                    <td className="px-5 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => statusMutation.mutate({ id: inv.id, status: e.target.value })}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 flex-wrap justify-end">
                        {["sent", "paid", "overdue"].includes(inv.status) ? (
                          <span className="text-xs text-gray-400 italic">🔒 gesperrt</span>
                        ) : (
                          <button onClick={() => openEdit(inv)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                        )}
                        <button onClick={() => window.open(`/api/invoices/${inv.id}/pdf/${inv.invoiceNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                        <button onClick={() => openEmail(inv)} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                        {inv.canCreateProtocol ? (
                          inv.linkedProtocolNumber ? (
                            <span className="text-xs text-emerald-600 font-medium cursor-default" title={`Protokoll ${inv.linkedProtocolNumber} bereits erstellt`}>✓ Protokoll</span>
                          ) : (
                            <button onClick={() => { if (confirm("Abnahmeprotokoll aus dieser Rechnung erstellen?")) fromInvoiceMutation.mutate(inv.id); }} className="text-xs text-green-600 hover:underline">→ Protokoll</button>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 italic">kein Protokoll</span>
                        )}
                        {! ["sent", "paid", "overdue"].includes(inv.status) && (
                          <button onClick={() => { if (confirm(`Rechnung ${inv.invoiceNumber} löschen?`)) deleteMutation.mutate(inv.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-gray-800">{inv.invoiceNumber}</div>
                      <div className="mt-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {inv.invoiceType === "down_payment" ? "Anzahlungsrechnung" : inv.invoiceType === "final" ? "Finale Rechnung" : "Standardrechnung"}
                      </div>
                      {inv.linkedProtocolNumber && (
                        <button
                          onClick={() => navigate("/protocols")}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
                        >
                          &#8594; {inv.linkedProtocolNumber}
                        </button>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Intl.DateTimeFormat("de-DE").format(new Date(inv.date))}
                        {inv.dueDate && <> · fällig {new Intl.DateTimeFormat("de-DE").format(new Date(inv.dueDate))}</>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">{parseFloat(inv.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</div>
                      <select
                        value={inv.status}
                        onChange={(e) => statusMutation.mutate({ id: inv.id, status: e.target.value })}
                        className={`mt-1 text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap pt-1">
                    {["sent", "paid", "overdue"].includes(inv.status) ? (
                      <span className="text-xs text-gray-400 italic">🔒 gesperrt</span>
                    ) : (
                      <button onClick={() => openEdit(inv)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                    )}
                    <button onClick={() => window.open(`/api/invoices/${inv.id}/pdf/${inv.invoiceNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                    <button onClick={() => openEmail(inv)} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                    {inv.canCreateProtocol ? (
                      inv.linkedProtocolNumber ? (
                        <span className="text-xs text-emerald-600 font-medium">✓ Protokoll</span>
                      ) : (
                        <button onClick={() => { if (confirm("Abnahmeprotokoll aus dieser Rechnung erstellen?")) fromInvoiceMutation.mutate(inv.id); }} className="text-xs text-green-600 hover:underline">→ Protokoll</button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 italic">kein Protokoll</span>
                    )}
                    {! ["sent", "paid", "overdue"].includes(inv.status) && (
                      <button onClick={() => { if (confirm(`Rechnung ${inv.invoiceNumber} löschen?`)) deleteMutation.mutate(inv.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
          );
        })()}
      </div>
    </div>
    </>
  );
}
