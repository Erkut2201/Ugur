// client/src/pages/ProtocolsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import EmailDialog from "../components/EmailDialog.js";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf", completed: "Abgeschlossen", signed: "Unterschrieben",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  completed: "bg-green-100 text-green-700",
  signed: "bg-purple-100 text-purple-700",
};

interface ProtocolItem {
  position: number;
  description: string;
  completed: boolean;
  notes: string;
}

export default function ProtocolsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<any>(null);
  const [emailTarget, setEmailTarget] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Form state
  const today = new Date().toISOString().split("T")[0];
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [projectDescription, setProjectDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [defects, setDefects] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<ProtocolItem[]>([{ position: 1, description: "", completed: false, notes: "" }]);

  const { data: protocols = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/protocols"],
    queryFn: () => api.get("/api/protocols"),
  });
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    queryFn: () => api.get("/api/customers"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editing
        ? api.put(`/api/protocols/${editing.id}`, data)
        : api.post("/api/protocols", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/protocols"] }); setView("list"); setEditing(null); resetForm(); },
    onError: (err: any) => alert("Fehler beim Speichern: " + (err.message ?? err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/protocols/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/protocols"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/protocols/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/protocols"] }),
  });

  function resetForm() {
    setDate(today); setCustomerId(null); setProjectDescription(""); setLocation("");
    setNotes(""); setDefects(""); setStatus("draft");
    setItems([{ position: 1, description: "", completed: false, notes: "" }]);
  }

  function openEdit(p: any) {
    setEditing(p);
    setDate(p.date ?? today);
    setCustomerId(p.customerId ?? null);
    setProjectDescription(p.projectDescription ?? "");
    setLocation(p.location ?? "");
    setNotes(p.notes ?? "");
    setDefects(p.defects ?? "");
    setStatus(p.status ?? "draft");
    setItems(p.items?.length
      ? p.items.map((it: any) => ({
          position: it.position,
          description: it.description ?? "",
          completed: Boolean(it.completed),
          notes: it.notes ?? "",
        }))
      : [{ position: 1, description: "", completed: false, notes: "" }]);
    setView("form");
  }

  function openCreate() { setEditing(null); resetForm(); setView("form"); }

  function updateItem(i: number, patch: Partial<ProtocolItem>) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }

  function addItem() {
    setItems((prev) => [...prev, { position: prev.length + 1, description: "", completed: false, notes: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, position: idx + 1 })));
  }

  function handleSubmit() {
    saveMutation.mutate({
      customerId: customerId || null,
      date, projectDescription: projectDescription || undefined,
      location: location || undefined,
      notes: notes || undefined,
      defects: defects || undefined,
      status,
      items,
    });
  }

  if (view === "form") {
    return (
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-6">
          {editing ? `Protokoll ${editing.protocolNumber} bearbeiten` : "Neues Abnahmeprotokoll"}
        </h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kunde</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Kein Kunde —</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{[c.firstName, c.name].filter(Boolean).join(" ")}{c.company ? ` (${c.company})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Datum *</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Projektbeschreibung</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ort / Adresse</label>
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={location} onChange={(e) => setLocation(e.target.value)} />
                {customerId && (() => {
                  const c = customers.find((x: any) => x.id === customerId);
                  const addr = [c?.street, [c?.zip, c?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
                  return addr ? (
                    <button
                      type="button"
                      onClick={() => setLocation(addr)}
                      className="shrink-0 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-600 whitespace-nowrap"
                      title="Adresse des Kunden übernehmen"
                    >
                      ↙ Adresse
                    </button>
                  ) : (
                    <span
                      className="shrink-0 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-400 whitespace-nowrap cursor-default"
                      title="Beim Kunden ist keine Adresse gespeichert"
                    >
                      Keine Adresse
                    </span>
                  );
                })()}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Leistungsübersicht</h3>
              <button onClick={addItem} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium">+ Position</button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="px-3 py-2 w-10 text-center">Pos.</th>
                    <th className="px-3 py-2 text-left">Beschreibung</th>
                    <th className="px-3 py-2 w-20 text-center">Erledigt</th>
                    <th className="px-3 py-2 text-left">Bemerkung</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-center text-gray-400">{item.position}</td>
                      <td className="px-3 py-1.5">
                        <input className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1" value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Beschreibung..." />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <input type="checkbox" className="accent-brand-red" checked={item.completed} onChange={(e) => updateItem(i, { completed: e.target.checked })} />
                      </td>
                      <td className="px-3 py-1.5">
                        <input className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1" value={item.notes} onChange={(e) => updateItem(i, { notes: e.target.value })} placeholder="Bemerkung..." />
                      </td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile item cards */}
            <div className="md:hidden space-y-2">
              {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pos. {item.position}</span>
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xl leading-none font-bold">×</button>
                  </div>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="Beschreibung..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="accent-brand-red w-4 h-4" checked={item.completed} onChange={(e) => updateItem(i, { completed: e.target.checked })} />
                      Erledigt
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Bemerkung</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                      value={item.notes}
                      onChange={(e) => updateItem(i, { notes: e.target.value })}
                      placeholder="Bemerkung..."
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-brand-red hover:text-brand-red transition-colors"
              >
                + Position hinzufügen
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mängel / Nachbesserungen</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" value={defects} onChange={(e) => setDefects(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Anmerkungen</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => { setView("list"); setEditing(null); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">Abbrechen</button>
            <button disabled={saveMutation.isPending || !date} onClick={handleSubmit} className="bg-brand-red text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {saveMutation.isPending ? "Speichern..." : "Speichern"}
            </button>
          </div>
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
          docType="protocol"
          docId={emailTarget.id}
          docNumber={emailTarget.protocolNumber}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/protocols"] })}
        />
      )}
      <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Abnahmeprotokolle</h1>
        <button onClick={openCreate} className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">+ Neues Protokoll</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
        ) : protocols.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Noch keine Protokolle.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide text-left">
                  <th className="px-5 py-3">Nummer</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3">Projekt</th>
                  <th className="px-5 py-3">Ort</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {protocols.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{p.protocolNumber}</td>
                    <td className="px-5 py-3 text-gray-500">{new Intl.DateTimeFormat("de-DE").format(new Date(p.date))}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{p.projectDescription ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{p.location ?? "—"}</td>
                    <td className="px-5 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value })}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                        <button onClick={() => window.open(`/api/protocols/${p.id}/pdf/${p.protocolNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                        <button onClick={() => { setEmailTarget(p); setEmailDialogOpen(true); }} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                        <button onClick={() => { if (confirm(`Protokoll ${p.protocolNumber} löschen?`)) deleteMutation.mutate(p.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {protocols.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-gray-800">{p.protocolNumber}</div>
                      <div className="text-sm text-gray-600 mt-0.5 truncate">{p.projectDescription ?? "—"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Intl.DateTimeFormat("de-DE").format(new Date(p.date))}
                        {p.location && <> · {p.location}</>}
                      </div>
                    </div>
                    <select
                        value={p.status}
                        onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value })}
                        className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                  </div>
                  <div className="flex gap-3 flex-wrap pt-1">
                    <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => window.open(`/api/protocols/${p.id}/pdf/${p.protocolNumber}.pdf`, "_blank")} className="text-xs text-gray-600 hover:underline">PDF</button>
                    <button onClick={() => { setEmailTarget(p); setEmailDialogOpen(true); }} className="text-xs text-gray-600 hover:underline">E-Mail</button>
                    <button onClick={() => { if (confirm(`Protokoll ${p.protocolNumber} löschen?`)) deleteMutation.mutate(p.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
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
