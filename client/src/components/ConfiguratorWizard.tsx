// client/src/components/ConfiguratorWizard.tsx
// Schritt-für-Schritt Konfigurator für Angebote:
// Schritt 1: Hersteller wählen
// Schritt 2: Produkt wählen
// Schritt 3: Maße eingeben (Breite × Tiefe) → Preis live
// Schritt 4: Zubehör auswählen
// Schritt 5: Übernehmen → Positionen ins Angebot

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export interface ConfiguratorItem {
  description: string;
  manufacturer?: string;
  productCategoryId?: number | null;
  productInfoTitle?: string | null;
  productInfoText?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Props {
  onAccept: (items: ConfiguratorItem[]) => void;
  onClose: () => void;
}

// ── Typen ─────────────────────────────────────────────────────────────────────

interface Manufacturer { id: number; name: string; description?: string; markupPercent?: number; }

interface ColorOption { id: number; ral: string; name: string; hex: string; }

interface GlassVariant {
  id: number;
  name: string;
  unitPrice: number;
  unit: string;
}

interface ConfigProduct {
  id: number;
  name: string;
  description?: string;
  productCategoryId?: number | null;
  productInfoTitle?: string | null;
  productInfoText?: string | null;
  availableWidths: number[];
  availableDepths: number[];
  glassVariants: GlassVariant[];
}

interface AccessoryItem {
  id: number;
  category: string;
  name: string;
  priceNet: number;
  unit: string;
}

interface CalcResult {
  inputWidth: number;
  inputDepth: number;
  chosenWidth: number;
  chosenDepth: number;
  basePrice: number;
  accessoryLines: {
    id: number; name: string; category: string;
    unit: string; priceNet: number; quantity: number; total: number;
  }[];
  accessoryTotal: number;
  totalNet: number;
}

function parseConfiguratorProductLabel(name: string) {
  const segments = name
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    return {
      heading: segments[segments.length - 2],
      productName: segments[segments.length - 1],
    };
  }

  return {
    heading: "",
    productName: name.trim(),
  };
}

function formatDimensionLabel(width: number, depth: number) {
  return `Breite ${Math.round(width * 1000)}mm × Tiefe/Höhe ${Math.round(depth * 1000)}mm`;
}

// ── Hauptkomponent ────────────────────────────────────────────────────────────

export default function ConfiguratorWizard({ onAccept, onClose }: Props) {
  const [step, setStep] = useState(1);

  // Schritt 1 — Hersteller
  const [selectedMfrId, setSelectedMfrId] = useState<number | null>(null);

  // Schritt 2 — Farbe
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [customColorInput, setCustomColorInput] = useState("");

  // Schritt 3 — Produkt
  const [selectedProduct, setSelectedProduct] = useState<ConfigProduct | null>(null);

  // Schritt 4 — Verglasung
  const [selectedVariant, setSelectedVariant] = useState<GlassVariant | null>(null);

  // Schritt 5 — Maße
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Schritt 5 — Zubehör
  const [accessoryQty, setAccessoryQty] = useState<Record<number, string>>({}); // id → qty string
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // ── Daten laden ──────────────────────────────────────────────────────────
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/catalog/manufacturers"],
    queryFn: () => api.get("/api/catalog/manufacturers"),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ConfigProduct[]>({
    queryKey: ["/api/configurator/products", selectedMfrId],
    queryFn: () => api.get(`/api/configurator/products?manufacturerId=${selectedMfrId}`),
    enabled: selectedMfrId !== null,
  });

  const { data: mfrColors = [] } = useQuery<ColorOption[]>({
    queryKey: ["/api/catalog/colors", selectedMfrId],
    queryFn: () => api.get(`/api/catalog/colors?manufacturerId=${selectedMfrId}`),
    enabled: selectedMfrId !== null,
  });

  const { data: accessoriesGrouped = {}, isLoading: accessoriesLoading } =
    useQuery<Record<string, AccessoryItem[]>>({
      queryKey: ["/api/configurator/accessories", selectedMfrId],
      queryFn: () => api.get(`/api/configurator/accessories?manufacturerId=${selectedMfrId}`),
      enabled: selectedMfrId !== null,
    });

  // Alle Zubehör-Artikel flach für Abfragen
  const allAccessories = useMemo(
    () => Object.values(accessoriesGrouped).flat(),
    [accessoriesGrouped]
  );

  // ── Hersteller-Aufschlag ─────────────────────────────────────────────────
  const selectedMfr = manufacturers.find((m) => m.id === selectedMfrId);
  const markup = Number(selectedMfr?.markupPercent ?? 0);
  const applyMarkup = (ek: number) => Math.round(ek * (1 + markup / 100) * 100) / 100;

  // ── Preisberechnung ──────────────────────────────────────────────────────
  async function calculate(): Promise<CalcResult | null> {
    if (!selectedProduct || !width || !depth) return null;
    setCalcError("");
    setIsCalculating(true);
    try {
      const accessories = Object.entries(accessoryQty)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([id, qty]) => ({ id: Number(id), quantity: Number(qty) }));

      const result = await api.post("/api/configurator/calculate", {
        productId: selectedProduct.id,
        width: parseFloat(width.replace(",", ".")),
        depth: parseFloat(depth.replace(",", ".")),
        accessories,
      });
      setCalcResult(result);
      return result;
    } catch (err: any) {
      setCalcError(err.message ?? "Berechnungsfehler");
      return null;
    } finally {
      setIsCalculating(false);
    }
  }

  // ── Ins Angebot übernehmen ───────────────────────────────────────────────
  async function handleAccept() {
    if (!selectedProduct) return;
    // Auto-recalculate mit aktuellen Zubehör-Mengen falls noch kein Ergebnis
    const result = calcResult ?? await calculate();
    if (!result) return;

    const lines: ConfiguratorItem[] = [];

    // Hauptprodukt
    const colorLabel = selectedColor
      ? `${selectedColor.name}${selectedColor.ral ? ` (${selectedColor.ral})` : ""}`
      : "";
    const { heading, productName } = parseConfiguratorProductLabel(selectedProduct.name);
    const manufacturer = selectedMfr?.name ?? "";

    lines.push({
      description: [
        heading,
        productName,
        formatDimensionLabel(result.chosenWidth, result.chosenDepth),
        colorLabel ? `• Gestellfarbe: ${colorLabel}` : "",
      ].filter(Boolean).join("\n"),
      manufacturer,
      productCategoryId: selectedProduct.productCategoryId ?? null,
      productInfoTitle: selectedProduct.productInfoTitle ?? heading ?? productName,
      productInfoText: selectedProduct.productInfoText ?? null,
      quantity: 1,
      unit: "Pauschal",
      unitPrice: applyMarkup(result.basePrice),
    });

    // Verglasung / Plattentyp
    if (selectedVariant) {
      const sqm = Math.round(result.chosenWidth * result.chosenDepth * 100) / 100;
      lines.push({
        description: ["Verglasung", selectedVariant.name].join("\n"),
        manufacturer,
        productCategoryId: null,
        productInfoTitle: null,
        productInfoText: null,
        quantity: sqm,
        unit: selectedVariant.unit || "m²",
        unitPrice: applyMarkup(selectedVariant.unitPrice),
      });
    }

    // Zubehör
    for (const acc of result.accessoryLines) {
      lines.push({
        description: [acc.category, acc.name].filter(Boolean).join("\n"),
        manufacturer,
        productCategoryId: null,
        productInfoTitle: null,
        productInfoText: null,
        quantity: acc.quantity,
        unit: acc.unit,
        unitPrice: applyMarkup(acc.priceNet),
      });
    }

    onAccept(lines);
  }

  // ── Schritt-Navigation ───────────────────────────────────────────────────
  const hasFarbe = mfrColors.length > 0;

  const productVariants: GlassVariant[] = selectedProduct?.glassVariants ?? [];
  const hasVariant = productVariants.length > 0;

  const totalSteps = 6;
  const stepLabels = ["", "Hersteller", "Farbe", "Produkt", "Verglasung", "Maße & Preis", "Zubehör"];

  const canNext1 = selectedMfrId !== null;
  const canNext2 = !hasFarbe || selectedColor !== null;
  const canNext3 = selectedProduct !== null;
  const canNext4 = !hasVariant || selectedVariant !== null;
  const canNext5 = calcResult !== null;

  function goStep(n: number) {
    if (n < step) setCalcResult(null);
    setStep(n);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Produkt-Konfigurator</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Schritt {step} von {totalSteps} — {stepLabels[step]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Fortschrittsbalken */}
        <div className="flex px-6 pt-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand-gold" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Schritt 1: Hersteller ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Welchen Hersteller möchten Sie konfigurieren?</p>
              {manufacturers.length === 0 ? (
                <p className="text-sm text-gray-400">Keine Hersteller vorhanden. Bitte zuerst im Produktkatalog anlegen.</p>
              ) : (
                manufacturers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMfrId(m.id); setSelectedProduct(null); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedMfrId === m.id
                        ? "border-brand-gold bg-brand-gold/5 text-brand-gold font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{m.name}</div>
                    {m.description && <div className="text-xs text-gray-400 mt-0.5">{m.description}</div>}
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Schritt 2: Farbe ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Welche Standardfarbe soll das Produkt haben?</p>
              {mfrColors.length === 0 ? (
                <p className="text-sm text-gray-400">Für diesen Hersteller sind keine Standardfarben hinterlegt.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {mfrColors.map((c) => (
                    <button
                      key={c.ral}
                      onClick={() => { setSelectedColor(c); setCustomColorInput(""); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                        selectedColor?.ral === c.ral
                          ? "border-brand-gold bg-brand-gold/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-full flex-shrink-0 border border-black/10 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div>
                        <div className={`text-sm font-medium ${selectedColor?.ral === c.ral ? "text-brand-gold" : "text-gray-800"}`}>
                          {c.name}
                        </div>
                        <div className="text-xs text-gray-400">{c.ral}</div>
                      </div>
                    </button>
                  ))}

                  {/* Andere Farbe / Sonderfarbe */}
                  <button
                    onClick={() => {
                      setSelectedColor({ ral: "custom", name: customColorInput || "Sonderfarbe", hex: "#cccccc" });
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                      selectedColor?.ral === "custom"
                        ? "border-brand-gold bg-brand-gold/5"
                        : "border-dashed border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg">
                      +
                    </span>
                    <div>
                      <div className={`text-sm font-medium ${selectedColor?.ral === "custom" ? "text-brand-gold" : "text-gray-600"}`}>
                        Andere Farbe
                      </div>
                      <div className="text-xs text-gray-400">Sonderfarbe / RAL</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Eingabefeld für Sonderfarbe */}
              {selectedColor?.ral === "custom" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RAL-Code oder Farbbezeichnung
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. RAL 5010 oder Enzianblau"
                    value={customColorInput}
                    onChange={(e) => {
                      setCustomColorInput(e.target.value);
                      setSelectedColor({ ral: "custom", name: e.target.value || "Sonderfarbe", hex: "#cccccc" });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">Wird als Hinweis in der Angebotsposition eingetragen.</p>
                </div>
              )}

              <p className="text-xs text-gray-400">Sonderfarben (RAL &amp; Tigertöne) auf Anfrage erhältlich.</p>
            </div>
          )}

          {/* ── Schritt 3: Produkt ── */}
          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">Welches Produkt soll konfiguriert werden?</p>
              {productsLoading ? (
                <p className="text-sm text-gray-400">Lade Produkte…</p>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-400">Keine Produkte für diesen Hersteller. Bitte zuerst das Import-Script ausführen.</p>
              ) : (
                products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedProduct?.id === p.id
                        ? "border-brand-gold bg-brand-gold/5 text-brand-gold font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Breiten: {p.availableWidths.join(" | ")} m &nbsp;·&nbsp;
                      Tiefen: {p.availableDepths.join(" | ")} m
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Schritt 4: Verglasung ── */}
          {step === 4 && selectedProduct && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-1">
                Welche Verglasung / Plattenstärke soll verwendet werden?
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Produkt: <span className="font-medium text-gray-700">{selectedProduct.name}</span>
              </p>
              {productVariants.length === 0 ? (
                <p className="text-sm text-gray-400">Keine Verglasung für dieses Produkt erforderlich.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {productVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-center px-3 py-3 rounded-xl border-2 transition-colors ${
                        selectedVariant?.id === v.id
                          ? "border-brand-gold bg-brand-gold/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className={`text-sm font-medium text-center ${
                        selectedVariant?.id === v.id ? "text-brand-gold" : "text-gray-800"
                      }`}>{v.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Schritt 5: Maße & Preis ── */}
          {step === 5 && selectedProduct && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Produkt: <span className="text-brand-gold">{selectedProduct.name}</span></p>
                {selectedColor && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                    <span className="inline-block w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: selectedColor.hex }} />
                    {selectedColor.name} ({selectedColor.ral})
                  </p>
                )}
                {selectedVariant && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Verglasung: <span className="font-medium text-gray-700">{selectedVariant.name}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Verfügbare Breiten: {selectedProduct.availableWidths.join(", ")} m<br />
                  Verfügbare Tiefen: {selectedProduct.availableDepths.join(", ")} m
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breite (m) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder={`z.B. ${selectedProduct.availableWidths[0]}`}
                    value={width}
                    onChange={(e) => { setWidth(e.target.value); setCalcResult(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiefe / Höhe (m) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder={`z.B. ${selectedProduct.availableDepths[0]}`}
                    value={depth}
                    onChange={(e) => { setDepth(e.target.value); setCalcResult(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <button
                disabled={!width || !depth || isCalculating}
                onClick={calculate}
                className="w-full py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                {isCalculating ? "Berechne…" : "Preis berechnen"}
              </button>

              {calcError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{calcError}</p>
              )}

              {calcResult && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {calcResult.chosenWidth !== calcResult.inputWidth || calcResult.chosenDepth !== calcResult.inputDepth ? (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                      ↑ Nächste verfügbare Größe: {calcResult.chosenWidth}m × {calcResult.chosenDepth}m
                    </p>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grundpreis EK ({calcResult.chosenWidth}m × {calcResult.chosenDepth}m)</span>
                    <span className="text-gray-500">{calcResult.basePrice.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                  </div>
                  {markup > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grundpreis VK (+{markup.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%)</span>
                      <span className="font-semibold text-brand-gold">{applyMarkup(calcResult.basePrice).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Schritt 6: Zubehör ── */}
          {step === 6 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Kategorie auswählen und Zubehör hinzufügen:
              </p>
              {accessoriesLoading ? (
                <p className="text-sm text-gray-400">Lade Zubehör…</p>
              ) : Object.keys(accessoriesGrouped).length === 0 ? (
                <p className="text-sm text-gray-400">Kein Zubehör verfügbar.</p>
              ) : (
                Object.entries(accessoriesGrouped).map(([cat, items]) => {
                  const isOpen = expandedCat === cat;
                  const selectedCount = items.filter((it) => Number(accessoryQty[it.id] ?? 0) > 0).length;
                  return (
                    <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Kategorie-Header — klickbar */}
                      <button
                        type="button"
                        onClick={() => setExpandedCat(isOpen ? null : cat)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-gray-800">{cat}</span>
                        <div className="flex items-center gap-2">
                          {selectedCount > 0 && (
                            <span className="text-xs bg-brand-gold text-white rounded-full px-2 py-0.5">
                              {selectedCount}
                            </span>
                          )}
                          <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {/* Artikel — nur wenn offen */}
                      {isOpen && (
                        <div className="divide-y divide-gray-100">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50">
                              <span className="text-sm text-gray-800 flex-1 min-w-0">{item.name}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-400">{item.unit}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={accessoryQty[item.id] ?? ""}
                                  onChange={(e) => {
                                    setAccessoryQty((prev) => ({ ...prev, [item.id]: e.target.value }));
                                  }}
                                  placeholder="0"
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-gold"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

            </div>
          )}

        </div>

        {/* Preisübersicht — fixiert zwischen Body und Footer */}
        {step === 6 && calcResult && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Preisübersicht (netto)
              {markup > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">EK → VK +{markup.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%</span>
              )}
            </p>
            <div className="space-y-0.5 text-sm">
              {(() => {
                const basVk = applyMarkup(calcResult.basePrice);
                const sqm = Math.round(calcResult.chosenWidth * calcResult.chosenDepth * 100) / 100;
                const glasVk = selectedVariant ? applyMarkup(selectedVariant.unitPrice) * sqm : 0;
                const accVk = calcResult.accessoryLines.reduce((s, a) => s + applyMarkup(a.total), 0);
                const gesamtVk = Math.round((basVk + glasVk + accVk) * 100) / 100;
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{selectedProduct?.name} {calcResult.chosenWidth}m × {calcResult.chosenDepth}m</span>
                      <span className="font-medium">{basVk.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                    </div>
                    {selectedVariant && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verglasung: {selectedVariant.name} ({sqm} {selectedVariant.unit || "m²"})</span>
                        <span className="font-medium">{glasVk.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                      </div>
                    )}
                    {calcResult.accessoryLines.map((a) => (
                      <div key={a.id} className="flex justify-between text-gray-500">
                        <span>{a.name} ({a.quantity} {a.unit})</span>
                        <span>{applyMarkup(a.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 mt-0.5 text-brand-gold">
                      <span>Gesamt netto (VK)</span>
                      <span>{gesamtVk.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => step > 1 ? goStep(step - 1) : onClose()}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white"
          >
            {step === 1 ? "Abbrechen" : "← Zurück"}
          </button>

          <div className="flex gap-2">
            {step < 6 && (
              <button
                disabled={
                  (step === 1 && !canNext1) ||
                  (step === 2 && !canNext2) ||
                  (step === 3 && !canNext3) ||
                  (step === 4 && !canNext4) ||
                  (step === 5 && !canNext5)
                }
                onClick={() => {
                  if (step === 5 && !calcResult) { calculate(); return; }
                  goStep(step + 1);
                }}
                className="px-4 py-2 text-sm bg-brand-gold text-white rounded-lg hover:opacity-90 disabled:opacity-40"
              >
                Weiter →
              </button>
            )}
            {step === 6 && (
              <>
                <button
                  onClick={() => { calculate().then(() => {}); }}
                  disabled={isCalculating}
                  className="px-4 py-2 text-sm border border-brand-gold text-brand-gold rounded-lg hover:bg-brand-gold/5 disabled:opacity-40"
                >
                  {isCalculating ? "Berechne…" : "Neu berechnen"}
                </button>
                <button
                  disabled={isCalculating}
                  onClick={handleAccept}
                  className="px-4 py-2 text-sm bg-brand-gold text-white rounded-lg hover:opacity-90 disabled:opacity-40"
                >
                  {isCalculating ? "Berechne…" : "✓ Ins Angebot übernehmen"}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


