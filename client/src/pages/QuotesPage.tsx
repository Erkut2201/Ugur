// client/src/pages/QuotesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../lib/api.js";
import DocumentForm, { DocumentFormData } from "../components/DocumentForm.js";
import EmailDialog from "../components/EmailDialog.js";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf", sent: "Versendet", accepted: "Angenommen", rejected: "Abgelehnt",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function QuotesPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [emailTarget, setEmailTarget] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const { data: quotes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
    queryFn: () => api.get("/api/quotes"),
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
        ? api.put(`/api/quotes/${editing.id}`, { ...data, status: editing.status ?? "draft" })
        : api.post("/api/quotes", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/quotes"] }); setView("list"); setEditing(null); setEditingId(null); },
    onError: (err: any) => alert("Fehler beim Speichern: " + (err.message ?? err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/quotes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/quotes"] }),
    onError: (err: any) => alert(err.message),
  });

  const pdfMutation = useMutation({
    mutationFn: (id: number) => api.post<{ url: string }>(`/api/quotes/${id}/pdf`),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["/api/quotes"] }); window.open(data.url, "_blank"); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/quotes/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/quotes"] }),
  });

  const fromQuoteMutation = useMutation({
    mutationFn: (quoteId: number) => api.post<any>(`/api/invoices/from-quote/${quoteId}`),
    onSuccess: (_data, quoteId) => {
      // Auto-set quote status to "accepted"
      api.patch(`/api/quotes/${quoteId}/status`, { status: "accepted" });
      qc.invalidateQueries({ queryKey: ["/api/quotes"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      // No navigation — user clicks the badge to go to invoices
    },
  });

  const emailMutation = useMutation({
    mutationFn: ({ id, to, message }: { id: number; to: string; message: string }) =>
      api.post(`/api/quotes/${id}/send-email`, { to, message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/quotes"] }); },
  });

  const { data: editingFull, isLoading: editingLoading } = useQuery<any>({
    queryKey: ["/api/quotes", editingId],
    queryFn: () => api.get(`/api/quotes/${editingId}`),
    enabled: editingId !== null,
  });

  function openEdit(q: any) {
    setEditing(q);
    setEditingId(q.id);
    setView("form");
  }

  function openEmail(q: any) {
    setEmailTarget(q);
    setEmailDialogOpen(true);
  }

  if (view === "form") {
    if (editingId !== null && editingLoading) {
      return <div className="text-gray-500 py-8 text-center">Lade Angebot...</div>;
    }
    const initialData = editingId !== null ? (editingFull ?? editing) : null;
    return (
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-6">
          {editing ? `Angebot ${editing.quoteNumber} bearbeiten` : "Neues Angebot"}
        </h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <DocumentForm
            docType="quote"
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
          docType="quote"
          docId={emailTarget.id}
          docNumber={emailTarget.quoteNumber}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/quotes"] })}
        />
      )}
      <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Angebote</h1>
        <button onClick={() => { setEditing(null); setEditingId(null); setView("form"); }} className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
          + Neues Angebot
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Noch keine Angebote.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide text-left">
                  <th className="px-5 py-3">Nummer</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3">Projekt</th>
                  <th className="px-5 py-3 text-right">Gesamt</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-gray-700">{q.quoteNumber}</div>
                      {q.linkedInvoiceNumber && (
                        <button
                          onClick={() => navigate("/invoices")}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                          title={`Zur Rechnung ${q.linkedInvoiceNumber} springen`}
                        >
                          <span>&#8594;</span>
                          <span className="font-mono">{q.linkedInvoiceNumber}</span>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{new Intl.DateTimeFormat("de-DE").format(new Date(q.date))}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{q.projectDescription ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium">{parseFloat(q.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                    <td className="px-5 py-3">
                      <select
                        value={q.status}
                        onChange={(e) => statusMutation.mutate({ id: q.id, status: e.target.value })}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[q.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 flex-wrap justify-end">
                        {["accepted", "rejected"].includes(q.status) ? (
                          <span className="text-xs text-gray-400 italic">🔒 gesperrt</span>
                        ) : (
                          <button onClick={() => openEdit(q)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                        )}
                        <button onClick={() => window.open(`/api/quotes/${q.id}/pdf/${q.quoteNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                        <button onClick={() => openEmail(q)} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                        {q.linkedInvoiceNumber ? (
                          <span className="text-xs text-emerald-600 font-medium cursor-default" title={`Rechnung ${q.linkedInvoiceNumber} bereits erstellt`}>✓ Rechnung</span>
                        ) : (
                          <button onClick={() => { if (confirm("Rechnung aus diesem Angebot erstellen?")) fromQuoteMutation.mutate(q.id); }} className="text-xs text-green-600 hover:underline">→ Rechnung</button>
                        )}
                        {!["accepted", "rejected"].includes(q.status) && (
                          <button onClick={() => { if (confirm(`Angebot ${q.quoteNumber} löschen?`)) deleteMutation.mutate(q.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {quotes.map((q) => (
                <div key={q.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-gray-800">{q.quoteNumber}</div>
                      {q.linkedInvoiceNumber && (
                        <button
                          onClick={() => navigate("/invoices")}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
                        >
                          &#8594; {q.linkedInvoiceNumber}
                        </button>
                      )}
                      <div className="text-sm text-gray-600 mt-0.5 truncate">{q.projectDescription ?? "—"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Intl.DateTimeFormat("de-DE").format(new Date(q.date))}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">{parseFloat(q.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</div>
                      <select
                        value={q.status}
                        onChange={(e) => statusMutation.mutate({ id: q.id, status: e.target.value })}
                        className={`mt-1 text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[q.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap pt-1">
                    {["accepted", "rejected"].includes(q.status) ? (
                      <span className="text-xs text-gray-400 italic">🔒 gesperrt</span>
                    ) : (
                      <button onClick={() => openEdit(q)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                    )}
                    <button onClick={() => window.open(`/api/quotes/${q.id}/pdf/${q.quoteNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                    <button onClick={() => openEmail(q)} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                    {q.linkedInvoiceNumber ? (
                      <span className="text-xs text-emerald-600 font-medium">✓ Rechnung</span>
                    ) : (
                      <button onClick={() => { if (confirm("Rechnung aus diesem Angebot erstellen?")) fromQuoteMutation.mutate(q.id); }} className="text-xs text-green-600 hover:underline">→ Rechnung</button>
                    )}
                    {!["accepted", "rejected"].includes(q.status) && (
                      <button onClick={() => { if (confirm(`Angebot ${q.quoteNumber} löschen?`)) deleteMutation.mutate(q.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
