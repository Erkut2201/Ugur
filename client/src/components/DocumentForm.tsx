// client/src/components/DocumentForm.tsx
// Shared form component for quotes and invoices.
// Handles line items with position/description/quantity/unit/unitPrice/total.

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import CustomerQuickCreateModal from "./CustomerQuickCreateModal.js";
import { useUnits } from "../hooks/useUnits.js";



export interface LineItem {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface DocumentFormData {
  customerId?: number | null;
  date: string;
  validUntil?: string;
  dueDate?: string;
  projectDescription?: string;
  paymentTerms?: string;
  notes?: string;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  items: LineItem[];
}

interface Props {
  initial?: Partial<DocumentFormData>;
  docType: "quote" | "invoice";
  customers: { id: number; firstName?: string; name: string; company?: string }[];
  onSubmit: (data: DocumentFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

function emptyItem(pos: number): LineItem {
  return { position: pos, description: "", quantity: 1, unit: "Stk", unitPrice: 0, total: 0 };
}

export default function DocumentForm({
  initial,
  docType,
  customers,
  onSubmit,
  onCancel,
  isPending,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [customerId, setCustomerId] = useState<number | null>(initial?.customerId ?? null);
  const [date, setDate] = useState(initial?.date ?? today);
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [projectDescription, setProjectDescription] = useState(initial?.projectDescription ?? "");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [vatRate, setVatRate] = useState(Number(initial?.vatRate ?? 19));
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length
      ? initial.items.map((it: any) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          total: Number(it.total),
        }))
      : [emptyItem(1)]
  );
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTargetRow, setCatalogTargetRow] = useState<number | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
    queryFn: () => api.get("/api/services"),
  });

  const { units: unitOptions } = useUnits();

  // Recalculate totals
  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], ...patch };
      item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      next[index] = item;
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
  }

  function removeItem(index: number) {
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, position: i + 1 }))
    );
  }

  function addFromService(s: any) {
    const price = Number(s.unitPrice);
    if (catalogTargetRow !== null) {
      // Fill existing row
      updateItem(catalogTargetRow, {
        description: s.description || s.name,
        unit: s.unit,
        unitPrice: price,
        total: Math.round(items[catalogTargetRow].quantity * price * 100) / 100,
      });
    } else {
      // Add new row
      setItems((prev) => [
        ...prev,
        {
          position: prev.length + 1,
          description: s.description || s.name,
          quantity: 1,
          unit: s.unit,
          unitPrice: price,
          total: Math.round(price * 100) / 100,
        },
      ]);
    }
    setShowCatalog(false);
    setCatalogSearch("");
    setCatalogTargetRow(null);
  }

  function handleSubmit() {
    onSubmit({
      customerId: customerId || null,
      date,
      validUntil: validUntil || undefined,
      dueDate: dueDate || undefined,
      projectDescription: projectDescription || undefined,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
      vatRate,
      subtotal,
      vatAmount,
      total,
      items,
    });
  }

  return (
    <div className="space-y-6">
      <datalist id="units-datalist">
        {unitOptions.map((u) => <option key={u.id} value={u.name} />)}
      </datalist>
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Kunde</label>
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="text-sm text-brand-red hover:underline font-medium"
            >
              + Neuer Kunde
            </button>
          </div>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={customerId ?? ""}
            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Kein Kunde —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.name].filter(Boolean).join(" ")}{c.company ? ` (${c.company})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum *</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {docType === "quote" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gültig bis</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        )}
        {docType === "invoice" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zahlungsziel</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Projektbeschreibung</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Zahlungsbedingungen</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={paymentTerms}
            placeholder="z.B. 14 Tage netto"
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">MwSt. %</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-red"
            value={vatRate}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setVatRate(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Positionen</h3>
          <div className="flex gap-2">
            <button
              onClick={() => { setCatalogTargetRow(null); setShowCatalog(true); setCatalogSearch(""); }}
              className="text-xs bg-brand-red/10 hover:bg-brand-red/20 text-brand-red px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              📋 Aus Katalog
            </button>
            <button
              onClick={addItem}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Position
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 text-center w-12">Pos.</th>
                <th className="px-4 py-3 text-left">Beschreibung</th>
                <th className="px-4 py-3 text-right w-24">Menge</th>
                <th className="px-4 py-3 text-left w-28">Einheit</th>
                <th className="px-4 py-3 text-right w-28">EP (€)</th>
                <th className="px-4 py-3 text-right w-28">Gesamt (€)</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center text-gray-400 font-medium">{item.position}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1 py-0.5 text-sm"
                        value={item.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        placeholder="Leistungsbeschreibung..."
                      />
                      <button
                        type="button"
                        title="Aus Leistungskatalog wählen"
                        onClick={() => { setCatalogTargetRow(i); setShowCatalog(true); setCatalogSearch(""); }}
                        className="shrink-0 text-gray-300 hover:text-brand-red transition-colors text-base leading-none"
                      >📋</button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} step={0.01}
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1 py-0.5 text-sm text-right"
                      value={item.quantity} onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      list="units-datalist"
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1 py-0.5 text-sm"
                      value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} step={0.01}
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-red rounded px-1 py-0.5 text-sm text-right"
                      value={item.unitPrice} onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {item.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-base leading-none" title="Position entfernen">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile item cards — no horizontal scroll */}
        <div className="md:hidden space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pos. {item.position}</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    title="Aus Katalog"
                    onClick={() => { setCatalogTargetRow(i); setShowCatalog(true); setCatalogSearch(""); }}
                    className="text-gray-300 hover:text-brand-red text-base transition-colors"
                  >📋</button>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 text-xl leading-none font-bold"
                    title="Entfernen"
                  >×</button>
                </div>
              </div>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Leistungsbeschreibung..."
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Menge</label>
                  <input type="number" min={0} step={0.01}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={item.quantity} onFocus={(e) => e.target.select()}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Einheit</label>
                  <input
                    list="units-datalist"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">EP (€)</label>
                  <input type="number" min={0} step={0.01}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                    value={item.unitPrice} onFocus={(e) => e.target.select()}
                    onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Gesamt</label>
                  <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800">
                    {item.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </div>
                </div>
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

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 text-sm space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Netto:</span>
            <span>{subtotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>MwSt. {vatRate} %:</span>
            <span>{vatAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between font-black text-brand-red text-base border-t border-gray-300 pt-1.5">
            <span>Gesamt:</span>
            <span>{total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Anmerkungen</label>
        <textarea
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
        >
          Abbrechen
        </button>
        <button
          disabled={isPending || !date}
          onClick={handleSubmit}
          className="bg-brand-red text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {isPending ? "Speichern..." : "Speichern"}
        </button>
      </div>

      {/* New customer quick-create */}
      {showNewCustomer && (
        <CustomerQuickCreateModal
          onCreated={(c) => {
            setCustomerId(c.id);
            setShowNewCustomer(false);
          }}
          onClose={() => setShowNewCustomer(false)}
        />
      )}

      {/* Catalog picker modal */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Aus Leistungskatalog wählen</h2>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="px-4 pt-3">
              <input
                autoFocus
                type="text"
                placeholder="Suchen..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-1">
              {services
                .filter((s) =>
                  !catalogSearch ||
                  s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  (s.description ?? "").toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  (s.category ?? "").toLowerCase().includes(catalogSearch.toLowerCase())
                )
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addFromService(s)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-red/5 border border-transparent hover:border-brand-red/20 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900 group-hover:text-brand-red">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{s.description}</div>
                        )}
                        {s.category && (
                          <div className="text-xs text-gray-300 mt-0.5">{s.category}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="font-semibold text-sm text-gray-700">
                          {Number(s.unitPrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                        </div>
                        <div className="text-xs text-gray-400">/ {s.unit}</div>
                      </div>
                    </div>
                  </button>
                ))}
              {services.filter((s) =>
                !catalogSearch ||
                s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                (s.description ?? "").toLowerCase().includes(catalogSearch.toLowerCase()) ||
                (s.category ?? "").toLowerCase().includes(catalogSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Keine Leistungen gefunden.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
