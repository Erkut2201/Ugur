// client/src/components/DocumentForm.tsx
// Shared form component for quotes and invoices.
// Handles line items with position/description/quantity/unit/unitPrice/total.

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import CustomerQuickCreateModal from "./CustomerQuickCreateModal.js";
import ConfiguratorWizard from "./ConfiguratorWizard.js";
import { useUnits } from "../hooks/useUnits.js";



export interface LineItem {
  position: number;
  description: string;
  manufacturer?: string;
  productCategoryId?: number | null;
  productInfoTitle?: string | null;
  productInfoText?: string | null;
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
  downPaymentPercent?: number;
  notes?: string;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  billingName?: string | null;
  billingStreet?: string | null;
  billingZip?: string | null;
  billingCity?: string | null;
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
  return {
    position: pos,
    description: "",
    manufacturer: "",
    productCategoryId: null,
    productInfoTitle: null,
    productInfoText: null,
    quantity: 1,
    unit: "Stk",
    unitPrice: 0,
    total: 0,
  };
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
  const [downPaymentPercent, setDownPaymentPercent] = useState(Number(initial?.downPaymentPercent ?? 50));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [vatRate, setVatRate] = useState(Number(initial?.vatRate ?? 19));

  // Abweichende Rechnungsadresse
  const [diffBilling, setDiffBilling] = useState<boolean>(
    !!(initial?.billingName || initial?.billingStreet || initial?.billingZip || initial?.billingCity)
  );
  const [billingName, setBillingName]     = useState(initial?.billingName   ?? "");
  const [billingStreet, setBillingStreet] = useState(initial?.billingStreet ?? "");
  const [billingZip, setBillingZip]       = useState(initial?.billingZip    ?? "");
  const [billingCity, setBillingCity]     = useState(initial?.billingCity   ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length
      ? initial.items.map((it: any) => ({
          ...it,
          manufacturer: it.manufacturer ?? "",
          productCategoryId: it.productCategoryId ?? null,
          productInfoTitle: it.productInfoTitle ?? null,
          productInfoText: it.productInfoText ?? null,
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

  // Produktkatalog-Modal
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [productCatalogTargetRow, setProductCatalogTargetRow] = useState<number | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
    queryFn: () => api.get("/api/services"),
  });

  const { data: catalogCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/catalog/categories"],
    queryFn: () => api.get("/api/catalog/categories"),
    enabled: showProductCatalog,
  });

  const { data: catalogManufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/catalog/manufacturers"],
    queryFn: () => api.get("/api/catalog/manufacturers"),
    enabled: showProductCatalog,
  });

  const { data: catalogItems = [] } = useQuery<any[]>({
    queryKey: ["/api/catalog/items", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      // Hole alle Items der gewählten Kategorie
      const items = await api.get(`/api/catalog/items?categoryId=${selectedCategoryId}`);
      // Hole auch Items aller Unterkategorien (rekursiv)
      const subs = subCategories(selectedCategoryId);
      if (subs.length > 0) {
        const subItems = await Promise.all(
          subs.map((sub: any) => api.get(`/api/catalog/items?categoryId=${sub.id}`))
        );
        return [...items, ...subItems.flat()];
      }
      return items;
    },
    enabled: showProductCatalog && selectedCategoryId !== null,
  });

  const { data: allCatalogItems = [] } = useQuery<any[]>({
    queryKey: ["/api/catalog/items"],
    queryFn: () => api.get("/api/catalog/items"),
    enabled: showProductCatalog && productSearch.trim().length > 0,
  });

  const productSearchResults = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return [];
    return allCatalogItems.filter(
      (it) =>
        it.name.toLowerCase().includes(term) ||
        (it.articleNumber ?? "").toLowerCase().includes(term) ||
        (it.description ?? "").toLowerCase().includes(term)
    );
  }, [allCatalogItems, productSearch]);

  // Kategoriebaum: Nur Top-Level (parentId null)
  const topLevelCategories = useMemo(
    () => catalogCategories.filter((c: any) => !c.parentId),
    [catalogCategories]
  );
  const subCategories = useMemo(
    () => (parentId: number) => catalogCategories.filter((c: any) => c.parentId === parentId),
    [catalogCategories]
  );

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

  function formatImportedLines(...lines: Array<string | null | undefined>) {
    return lines
      .map((line) => line?.trim())
      .filter(Boolean)
      .join("\n");
  }

  function formatImportedItem(name: string, description?: string | null, prefix?: string | null, heading?: string | null) {
    return formatImportedLines(heading, name, prefix, description) || name;
  }

  function getCatalogCategoryLabel(categoryId: number | null | undefined) {
    if (!categoryId) return "";

    const current = catalogCategories.find((c: any) => c.id === categoryId) ?? null;
    return String(current?.name ?? "").trim();
  }

  function addFromService(s: any) {
    const price = Number(s.unitPrice);
    const label = formatImportedItem(s.name, s.description);
    if (catalogTargetRow !== null) {
      updateItem(catalogTargetRow, {
        description: label,
        productCategoryId: null,
        productInfoTitle: null,
        productInfoText: null,
        unit: s.unit,
        unitPrice: price,
        total: Math.round(items[catalogTargetRow].quantity * price * 100) / 100,
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          position: prev.length + 1,
          description: label,
          productCategoryId: null,
          productInfoTitle: null,
          productInfoText: null,
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

  function addFromConfigurator(lines: { description: string; manufacturer?: string; productCategoryId?: number | null; productInfoTitle?: string | null; productInfoText?: string | null; quantity: number; unit: string; unitPrice: number }[]) {
    setItems((prev) => {
      const base = prev.filter((it) => it.description.trim() !== "").length > 0 ? prev : [];
      const startPos = base.length + 1;
      const newLines = lines.map((l, i) => ({
        position: startPos + i,
        description: l.description,
        manufacturer: l.manufacturer ?? "",
        productCategoryId: l.productCategoryId ?? null,
        productInfoTitle: l.productInfoTitle ?? null,
        productInfoText: l.productInfoText ?? null,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        total: Math.round(l.quantity * l.unitPrice * 100) / 100,
      }));
      return [...base, ...newLines].map((it, i) => ({ ...it, position: i + 1 }));
    });
    setShowConfigurator(false);
  }

  function addFromCatalogItem(item: any) {
    const ekPrice = Number(item.unitPrice);
    // Aufschlag des Herstellers berechnen
    const cat = catalogCategories.find((c: any) => c.id === item.categoryId);
    const mfr = cat ? catalogManufacturers.find((m: any) => m.id === cat.manufacturerId) : undefined;
    const markup = Number(mfr?.markupPercent ?? 0);
    const price = Math.round(ekPrice * (1 + markup / 100) * 100) / 100;
    const categoryLabel = getCatalogCategoryLabel(item.categoryId);
    const label = formatImportedItem(
      item.name,
      item.description,
      item.articleNumber ? `[${item.articleNumber}]` : null,
      categoryLabel || null,
    );
    const manufacturer = mfr?.name ?? "";
    const infoTitle = categoryLabel || item.name;
    const infoText = cat?.productInfoText ? String(cat.productInfoText).trim() : null;
    if (productCatalogTargetRow !== null) {
      updateItem(productCatalogTargetRow, {
        description: label,
        manufacturer,
        productCategoryId: cat?.id ?? null,
        productInfoTitle: infoText ? infoTitle : null,
        productInfoText: infoText,
        unit: item.unit,
        unitPrice: price,
        total: Math.round(items[productCatalogTargetRow].quantity * price * 100) / 100,
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          position: prev.length + 1,
          description: label,
          manufacturer,
          productCategoryId: cat?.id ?? null,
          productInfoTitle: infoText ? infoTitle : null,
          productInfoText: infoText,
          quantity: 1,
          unit: item.unit,
          unitPrice: price,
          total: Math.round(price * 100) / 100,
        },
      ]);
    }
    setShowProductCatalog(false);
    setProductSearch("");
    setSelectedCategoryId(null);
    setProductCatalogTargetRow(null);
  }

  function handleSubmit() {
    onSubmit({
      customerId: customerId || null,
      date,
      validUntil: validUntil || undefined,
      dueDate: dueDate || undefined,
      projectDescription: projectDescription || undefined,
      paymentTerms: paymentTerms || undefined,
      downPaymentPercent: docType === "quote" ? downPaymentPercent : undefined,
      notes: notes || undefined,
      vatRate,
      subtotal,
      vatAmount,
      total,
      billingName:   diffBilling ? billingName   || null : null,
      billingStreet: diffBilling ? billingStreet || null : null,
      billingZip:    diffBilling ? billingZip    || null : null,
      billingCity:   diffBilling ? billingCity   || null : null,
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
              className="text-sm text-brand-gold hover:underline font-medium"
            >
              + Neuer Kunde
            </button>
          </div>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {docType === "quote" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gültig bis</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Projektbeschreibung</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Zahlungsbedingungen</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
            value={paymentTerms}
            placeholder="z.B. 14 Tage netto"
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </div>
        {docType === "quote" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Anzahlung in %</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
              value={downPaymentPercent}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">MwSt. %</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
            value={vatRate}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setVatRate(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Abweichende Rechnungsadresse */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setDiffBilling((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <span className={`inline-block w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${diffBilling ? "bg-brand-gold border-brand-gold" : "border-gray-400"}`}>
              {diffBilling && (
                <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
                  <polyline points="3,8 6.5,11.5 13,5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            Abweichende Rechnungsadresse
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${diffBilling ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {diffBilling && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/30 border-t border-gray-200">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name / Firma</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Abweichender Name oder Firma"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Straße</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Straße und Hausnummer"
                value={billingStreet}
                onChange={(e) => setBillingStreet(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PLZ</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="PLZ"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stadt</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Stadt"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Positionen</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfigurator(true)}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              🔧 Konfigurator
            </button>
            <button
              onClick={() => { setProductCatalogTargetRow(null); setShowProductCatalog(true); setProductSearch(""); setSelectedCategoryId(null); }}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              🏷️ Produkt
            </button>
            <button
              onClick={() => { setCatalogTargetRow(null); setShowCatalog(true); setCatalogSearch(""); }}
              className="text-xs bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              📋 Leistung
            </button>
            <button
              onClick={addItem}
              className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
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
                <tr key={i} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs">{item.position}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0 space-y-2">
                        {item.manufacturer && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                            {item.manufacturer}
                          </span>
                        )}
                        <textarea
                          rows={Math.max(2, String(item.description ?? "").split(/\r?\n/).length)}
                          className="w-full resize-y border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-gold rounded px-1 py-0.5 text-sm text-gray-800 leading-5"
                          value={item.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                          placeholder="Leistungsbeschreibung..."
                        />
                      </div>
                      <button
                        type="button"
                        title="Aus Leistungskatalog wählen"
                        onClick={() => { setCatalogTargetRow(i); setShowCatalog(true); setCatalogSearch(""); }}
                        className="shrink-0 text-gray-300 hover:text-brand-gold transition-colors text-base leading-none mt-1"
                      >📋</button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} step={0.01}
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-gold rounded px-1 py-0.5 text-sm text-right text-gray-800"
                      value={item.quantity} onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      list="units-datalist"
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-gold rounded px-1 py-0.5 text-sm text-gray-800"
                      value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" step={0.01}
                      className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-gold rounded px-1 py-0.5 text-sm text-right text-gray-800"
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
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs">{item.position}</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</span>
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    title="Aus Katalog"
                    onClick={() => { setCatalogTargetRow(i); setShowCatalog(true); setCatalogSearch(""); }}
                    className="text-gray-300 hover:text-brand-gold text-base transition-colors"
                  >📋</button>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 text-xl leading-none font-bold"
                    title="Entfernen"
                  >×</button>
                </div>
              </div>
              <div className="space-y-2">
                {item.manufacturer && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                    {item.manufacturer}
                  </span>
                )}
                <textarea
                  rows={Math.max(3, String(item.description ?? "").split(/\r?\n/).length)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-brand-gold resize-y"
                  value={item.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  placeholder="Leistungsbeschreibung..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Menge</label>
                  <input type="number" min={0} step={0.01}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={item.quantity} onFocus={(e) => e.target.select()}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Einheit</label>
                  <input
                    list="units-datalist"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">EP (€)</label>
                  <input type="number" step={0.01}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors"
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
          <div className="flex justify-between font-black text-brand-gold text-base border-t border-gray-300 pt-1.5">
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
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
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
          className="bg-brand-gold text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Speichern..." : "Speichern"}
        </button>
      </div>

      {/* Konfigurator-Wizard */}
      {showConfigurator && (
        <ConfiguratorWizard
          onAccept={addFromConfigurator}
          onClose={() => setShowConfigurator(false)}
        />
      )}

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

      {/* Produktkatalog-Modal */}
      {showProductCatalog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Produkt aus Katalog wählen</h2>
              <button
                onClick={() => { setShowProductCatalog(false); setSelectedCategoryId(null); setProductSearch(""); }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >×</button>
            </div>
            <div className="px-4 pt-3">
              <input
                autoFocus
                type="text"
                placeholder="Produktname oder Artikelnummer suchen..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {productSearch.trim() ? (
              /* Suchergebnisse */
              <div className="overflow-y-auto flex-1 p-4 space-y-1">
                {productSearchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Keine Produkte gefunden.</div>
                ) : productSearchResults.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => addFromCatalogItem(item)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {item.articleNumber && (
                          <div className="text-xs text-gray-400 font-mono mb-0.5">{item.articleNumber}</div>
                        )}
                        <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Kategorie-Browser */
              <div className="flex flex-1 overflow-hidden">
                {/* Linke Spalte: Kategorien */}
                <div className="w-56 border-r border-gray-100 overflow-y-auto p-3 space-y-2 shrink-0">
                  {topLevelCategories.length === 0 && (
                    <div className="text-xs text-gray-400 p-2">Keine Kategorien vorhanden.</div>
                  )}
                  {topLevelCategories.map((cat: any) => {
                    const subs = subCategories(cat.id);
                    const hasChildren = subs.length > 0;
                    
                    return (
                      <div key={cat.id}>
                        {hasChildren ? (
                          /* Hauptkategorie als Header (nicht klickbar, wenn Unterkategorien vorhanden) */
                          <div className="px-2 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                            {cat.name}
                          </div>
                        ) : (
                          /* Hauptkategorie ohne Unterkategorien → klickbar */
                          <button
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedCategoryId === cat.id
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {cat.name}
                          </button>
                        )}
                        {/* Unterkategorien */}
                        <div className="space-y-0.5">
                          {subs.map((sub: any) => (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedCategoryId(sub.id)}
                              className={`w-full text-left pl-4 pr-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedCategoryId === sub.id
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Rechte Spalte: Artikel */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {!selectedCategoryId ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400 text-sm">
                        <div className="text-2xl mb-2">👈</div>
                        Kategorie auswählen
                      </div>
                    </div>
                  ) : catalogItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Keine Artikel in dieser Kategorie.</div>
                  ) : (() => {
                    // Gruppiere Artikel nach Unterkategorie
                    const subs = subCategories(selectedCategoryId!);
                    const catMap = new Map<number, string>(
                      [...subs, ...catalogCategories.filter((c: any) => c.id === selectedCategoryId)]
                        .map((c: any) => [c.id, c.name])
                    );
                    // Artikel ohne Gruppe (direkt in Hauptkategorie)
                    const directItems = catalogItems.filter(
                      (it: any) => it.categoryId === selectedCategoryId
                    );
                    // Artikel je Unterkategorie
                    const groups = subs.map((sub: any) => ({
                      sub,
                      items: catalogItems.filter((it: any) => it.categoryId === sub.id),
                    })).filter((g) => g.items.length > 0);

                    function renderItem(item: any) {
                      return (
                        <button
                          key={item.id}
                          onClick={() => addFromCatalogItem(item)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              {item.articleNumber && (
                                <div className="text-xs text-gray-400 font-mono mb-0.5">{item.articleNumber}</div>
                              )}
                              <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <>
                        {directItems.map(renderItem)}
                        {groups.map(({ sub, items }) => (
                          <div key={sub.id}>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 pt-3 pb-1 border-t border-gray-100 mt-1">
                              {sub.name}
                            </div>
                            {items.map(renderItem)}
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-gold/5 border border-transparent hover:border-brand-gold/20 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900 group-hover:text-brand-gold">{s.name}</div>
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
