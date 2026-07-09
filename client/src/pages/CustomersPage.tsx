// client/src/pages/CustomersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  notes?: string;
}

const empty: Omit<Customer, "id"> = {
  salutation: "", firstName: "", name: "", company: "", street: "", zip: "", city: "", email: "", phone: "", notes: "",
};

export default function CustomersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: () => api.get("/api/customers"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      editing
        ? api.put(`/api/customers/${editing.id}`, data)
        : api.post("/api/customers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditing(null);
      setCreating(false);
      setForm(empty);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/customers"] }),
    onError: (err: any) => alert(err.message ?? "Löschen fehlgeschlagen"),
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.firstName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ salutation: c.salutation ?? "", firstName: c.firstName ?? "", name: c.name, company: c.company ?? "", street: c.street ?? "", zip: c.zip ?? "", city: c.city ?? "", email: c.email ?? "", phone: c.phone ?? "", notes: c.notes ?? "" });
    setCreating(false);
  }

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm(empty);
  }

  const isOpen = editing !== null || creating;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Kunden</h1>
        <button
          onClick={openCreate}
          className="bg-brand-gold text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors"
        >
          + Neuer Kunde
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Keine Kunden gefunden.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="px-6 py-3">Vorname</th>
                  <th className="px-6 py-3">Nachname</th>
                  <th className="px-6 py-3">Firma</th>
                  <th className="px-6 py-3">Ort</th>
                  <th className="px-6 py-3">E-Mail</th>
                  <th className="px-6 py-3">Telefon</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.firstName ?? ""}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-3 text-gray-500">{c.company}</td>
                    <td className="px-6 py-3 text-gray-500">{[c.zip, c.city].filter(Boolean).join(" ")}</td>
                    <td className="px-6 py-3 text-gray-500">{c.email}</td>
                    <td className="px-6 py-3 text-gray-500">{c.phone}</td>
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                      <button onClick={() => { if (confirm(`Kunde "${[c.firstName, c.name].filter(Boolean).join(" ")}" wirklich löschen?`)) deleteMutation.mutate(c.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900">
                        {c.salutation && <span className="text-xs text-gray-500 mr-1">{c.salutation}</span>}
                        {[c.firstName, c.name].filter(Boolean).join(" ")}
                      </div>
                      {c.company && <div className="text-xs text-gray-500">{c.company}</div>}
                      {(c.zip || c.city) && <div className="text-xs text-gray-400">{[c.zip, c.city].filter(Boolean).join(" ")}</div>}
                      {c.email && <div className="text-xs text-gray-500 truncate">{c.email}</div>}
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => openEdit(c)} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => { if (confirm(`Kunde "${[c.firstName, c.name].filter(Boolean).join(" ")}" wirklich löschen?`)) deleteMutation.mutate(c.id); }} className="text-xs text-red-600 hover:underline">Löschen</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-lg">
                {editing ? "Kunde bearbeiten" : "Neuer Kunde"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Anrede + Vorname + Nachname */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Anrede</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.salutation ?? ""}
                    onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                  >
                    <option value="">—</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vorname</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.firstName ?? ""}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nachname *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Firma</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Straße</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PLZ</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ort</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-Mail</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notizen</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setEditing(null); setCreating(false); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                Abbrechen
              </button>
              <button
                disabled={saveMutation.isPending || !form.name}
                onClick={() => saveMutation.mutate(form)}
                className="bg-brand-gold text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
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
