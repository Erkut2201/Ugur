// client/src/components/CustomerQuickCreateModal.tsx
// Lightweight modal to create a new customer from within a form (e.g. quotes/invoices).

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Props {
  onCreated: (customer: { id: number; name: string; company?: string }) => void;
  onClose: () => void;
}

const empty = {
  salutation: "", firstName: "", name: "", company: "", street: "", zip: "", city: "", email: "", phone: "", notes: "",
};

export default function CustomerQuickCreateModal({ onCreated, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post<{ id: number; name: string; company?: string }>("/api/customers", data),
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      onCreated(customer);
    },
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Neuen Kunden anlegen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Intern + Vorname + Nachname */}
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Intern</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={form.salutation}
                onChange={(e) => set("salutation", e.target.value)}
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
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nachname *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Firma</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Straße</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PLZ</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ort</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-Mail</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          {mutation.isError && (
            <div className="col-span-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Fehler beim Speichern. Bitte erneut versuchen.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            disabled={mutation.isPending || !form.name.trim()}
            onClick={() => mutation.mutate(form)}
            className="bg-brand-gold text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? "Speichern..." : "Kunde anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
