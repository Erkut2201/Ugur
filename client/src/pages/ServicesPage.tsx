// client/src/pages/ServicesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useUnits } from "../hooks/useUnits.js";

interface Service {
  id: number;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  category?: string;
  notes?: string;
}

const emptyForm = () => ({
  name: "",
  description: "",
  unit: "Stk",
  unitPrice: 0,
  category: "",
  notes: "",
});

export default function ServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [newUnit, setNewUnit] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "units">("services");

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: () => api.get("/api/services"),
  });

  const { units: unitOptions } = useUnits();

  const addUnitMutation = useMutation({
    mutationFn: (name: string) => api.post("/api/units", { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/units"] });
      setNewUnit("");
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/units/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/units"] }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      editing
        ? api.put(`/api/services/${editing.id}`, data)
        : api.post("/api/services", data),
    onSuccess: (_data, data) => {
      // Auto-add unit to catalog if not already there
      if (data.unit.trim() && !unitOptions.some((u) => u.name === data.unit.trim())) {
        api.post("/api/units", { name: data.unit.trim() }).then(() => {
          qc.invalidateQueries({ queryKey: ["/api/units"] });
        });
      }
      qc.invalidateQueries({ queryKey: ["/api/services"] });
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/services"] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description,
      unit: s.unit,
      unitPrice: Number(s.unitPrice),
      category: s.category ?? "",
      notes: s.notes ?? "",
    });
    setShowModal(true);
  }

  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));

  const filtered = services.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || s.category === filterCategory;
    return matchSearch && matchCat;
  });

  const grouped: Record<string, Service[]> = {};
  for (const s of filtered) {
    const cat = s.category || "Ohne Kategorie";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  return (
    <div>
      {/* ── Mobile tab bar ── */}
      <div className="md:hidden flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${activeTab === "services" ? "text-brand-red border-b-2 border-brand-red" : "text-gray-400"}`}
        >
          🔧 Leistungen
        </button>
        <button
          onClick={() => setActiveTab("units")}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${activeTab === "units" ? "text-brand-red border-b-2 border-brand-red" : "text-gray-400"}`}
        >
          📐 Einheiten
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Main: Services list ── */}
        <div className={`flex-1 min-w-0 ${activeTab !== "services" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900">Leistungskatalog</h1>
            <button
              onClick={openCreate}
              className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              + Neue Leistung
            </button>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">Alle Kategorien</option>
                {categories.map((c) => (
                  <option key={c} value={c!}>{c}</option>
                ))}
              </select>
            )}
            <div className="text-sm text-gray-500 self-center">
              {filtered.length} Leistung{filtered.length !== 1 ? "en" : ""}
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <div className="text-gray-500 text-sm">Noch keine Leistungen im Katalog.</div>
              <div className="text-gray-400 text-xs mt-1">
                Füge Leistungen hinzu, um sie schnell in Angeboten und Rechnungen einzusetzen.
              </div>
              <button
                onClick={openCreate}
                className="mt-4 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
              >
                + Erste Leistung anlegen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, "de")).map(([cat, items]) => (
                <div key={cat}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
                    {cat}
                  </h2>

                  {/* Desktop table */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide text-left">
                          <th className="px-5 py-3">Bezeichnung</th>
                          <th className="px-5 py-3">Beschreibungstext</th>
                          <th className="px-5 py-3 w-20 text-center">Einheit</th>
                          <th className="px-5 py-3 w-28 text-right">Einzelpreis</th>
                          <th className="px-5 py-3 w-28"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                            <td className="px-5 py-3 text-gray-500 max-w-xs">
                              <div className="truncate">{s.description || <span className="italic text-gray-300">—</span>}</div>
                              {s.notes && <div className="text-xs text-gray-400 truncate">{s.notes}</div>}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-600">{s.unit}</td>
                            <td className="px-5 py-3 text-right font-medium">
                              {Number(s.unitPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-3 justify-end">
                                <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                                <button onClick={() => { if (confirm(`"${s.name}" aus dem Katalog löschen?`)) deleteMutation.mutate(s.id); }} className="text-xs text-red-500 hover:underline">Löschen</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2">
                    {items.map((s) => (
                      <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                            {s.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</div>}
                            {s.notes && <div className="text-xs text-gray-400 mt-0.5 italic">{s.notes}</div>}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-gray-900">{Number(s.unitPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</div>
                            <div className="text-xs text-gray-400 mt-0.5">pro {s.unit}</div>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-3 pt-2 border-t border-gray-100">
                          <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                          <button onClick={() => { if (confirm(`"${s.name}" löschen?`)) deleteMutation.mutate(s.id); }} className="text-xs text-red-500 hover:underline">Löschen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Units panel: right on desktop, tab on mobile ── */}
        <div className={`md:w-56 md:flex-shrink-0 w-full ${activeTab !== "units" ? "hidden md:block" : ""}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:sticky md:top-4">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Einheiten</h3>
              <span className="text-xs text-gray-400">{unitOptions.length}</span>
            </div>
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {unitOptions.length === 0 && (
                <li className="px-4 py-3 text-xs text-gray-400 italic">Keine Einheiten</li>
              )}
              {unitOptions.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group">
                  <span className="text-sm text-gray-800 font-medium">{u.name}</span>
                  <button
                    onClick={() => { if (confirm(`Einheit "${u.name}" löschen?`)) deleteUnitMutation.mutate(u.id); }}
                    className="text-gray-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-sm leading-none p-1"
                    title="Löschen"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = newUnit.trim();
                if (!trimmed) return;
                addUnitMutation.mutate(trimmed);
              }}
              className="px-3 py-3 border-t border-gray-100 flex gap-2"
            >
              <input
                type="text"
                placeholder="Neue Einheit..."
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
              <button
                type="submit"
                disabled={!newUnit.trim() || addUnitMutation.isPending}
                className="bg-brand-red text-white rounded-lg px-3 py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                +
              </button>
            </form>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Leistung bearbeiten" : "Neue Leistung"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Bezeichnung *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Tischlerarbeit Schrank"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Leistungsbeschreibung (Text für Angebote/Rechnungen)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Vollständige Beschreibung der Leistung..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Einheit *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={unitOptions.some((u) => u.name === form.unit) ? form.unit : "__custom__"}
                    onChange={(e) => {
                      if (e.target.value !== "__custom__") setForm((f) => ({ ...f, unit: e.target.value }));
                    }}
                  >
                    {unitOptions.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    <option value="__custom__" disabled={unitOptions.some((u) => u.name === form.unit)}>
                      {unitOptions.some((u) => u.name === form.unit) ? "" : `✕ "${form.unit}" (nicht im Katalog)`}
                    </option>
                  </select>
                  {/* Free-text fallback for custom units */}
                  <input
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    placeholder="Oder eigene Einheit eingeben (wird zum Katalog hinzugefügt)"
                    value={unitOptions.some((u) => u.name === form.unit) ? "" : form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Einzelpreis (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Kategorie
                </label>
                <input
                  list="categories-list"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="z.B. Tischlerarbeiten, Planungsleistungen..."
                />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c!} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Interne Notizen
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setEditing(null); setForm(emptyForm()); }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900"
              >
                Abbrechen
              </button>
              <button
                disabled={saveMutation.isPending || !form.name.trim() || !form.unit.trim()}
                onClick={() => saveMutation.mutate(form)}
                className="bg-brand-red text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

