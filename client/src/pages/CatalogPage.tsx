// client/src/pages/CatalogPage.tsx
// Produktkatalog-Verwaltung: Hersteller (oben) → Kategoriebaum (links) → Artikel (rechts)
// Vollständiges CRUD für Hersteller, Kategorien und Artikel

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Manufacturer {
  id: number;
  name: string;
  description?: string;
  website?: string;
  contactInfo?: string;
  markupPercent: number;
  sortOrder: number;
}

interface Category {
  id: number;
  manufacturerId: number;
  name: string;
  description?: string;
  productInfoText?: string;
  parentId?: number | null;
  sortOrder: number;
}

interface CatalogItem {
  id: number;
  categoryId: number;
  articleNumber?: string;
  name: string;
  description?: string;
  productDescription?: string;
  unit: string;
  unitPrice: number;
  notes?: string;
  sortOrder: number;
}

interface ManufacturerColor {
  id: number;
  manufacturerId: number;
  ral: string;
  name: string;
  hex: string;
  sortOrder: number;
}

const emptyManufacturer = (): Omit<Manufacturer, "id"> => ({
  name: "",
  description: "",
  website: "",
  contactInfo: "",
  markupPercent: 0,
  sortOrder: 0,
});

const emptyCategory = (manufacturerId: number): Omit<Category, "id"> => ({
  manufacturerId,
  name: "",
  description: "",
  productInfoText: "",
  parentId: null,
  sortOrder: 0,
});

const emptyItem = (categoryId: number): Omit<CatalogItem, "id"> => ({
  categoryId,
  articleNumber: "",
  name: "",
  description: "",
  productDescription: "",
  unit: "Stk",
  unitPrice: 0,
  notes: "",
  sortOrder: 0,
});

export default function CatalogPage() {
  const qc = useQueryClient();

  // ── Selected state ───────────────────────────────────────────────────────
  const [selectedMfrId, setSelectedMfrId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const searchTerm = search.trim().toLowerCase();

  // ── Manufacturer modal ───────────────────────────────────────────────────
  const [showMfrModal, setShowMfrModal] = useState(false);
  const [editingMfr, setEditingMfr] = useState<Manufacturer | null>(null);
  const [mfrForm, setMfrForm] = useState(emptyManufacturer());

  // ── Category modal ───────────────────────────────────────────────────────
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCategory(0));

  // ── Item modal ───────────────────────────────────────────────────────────
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItem(0));

  // ── Inline price edit ────────────────────────────────────────────────────
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlinePrice, setInlinePrice] = useState("");

  // ── Color modal ──────────────────────────────────────────────────────────
  const [showColorModal, setShowColorModal] = useState(false);
  const [editingColor, setEditingColor] = useState<ManufacturerColor | null>(null);
  const [colorForm, setColorForm] = useState({ ral: "", name: "", hex: "#cccccc", sortOrder: 0 });
  const [showColorsPanel, setShowColorsPanel] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: manufacturers = [], isLoading: mfrsLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/catalog/manufacturers"],
    queryFn: () => api.get("/api/catalog/manufacturers"),
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["/api/catalog/categories", selectedMfrId],
    queryFn: () =>
      selectedMfrId
        ? api.get(`/api/catalog/categories?manufacturerId=${selectedMfrId}`)
        : Promise.resolve([]),
    enabled: selectedMfrId !== null,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog/items", selectedCategoryId],
    queryFn: () =>
      selectedCategoryId
        ? api.get(`/api/catalog/items?categoryId=${selectedCategoryId}`)
        : Promise.resolve([]),
    enabled: selectedCategoryId !== null && !searchTerm,
  });

  const { data: allItems = [], isLoading: allItemsLoading } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog/items"],
    queryFn: () => api.get("/api/catalog/items"),
    enabled: searchTerm.length > 0,
    staleTime: 60_000,
  });

  const { data: colors = [] } = useQuery<ManufacturerColor[]>({
    queryKey: ["/api/catalog/colors", selectedMfrId],
    queryFn: () => api.get(`/api/catalog/colors?manufacturerId=${selectedMfrId}`),
    enabled: selectedMfrId !== null,
  });

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return allItems.filter(
      (it) =>
        it.name.toLowerCase().includes(searchTerm) ||
        (it.articleNumber ?? "").toLowerCase().includes(searchTerm) ||
        (it.description ?? "").toLowerCase().includes(searchTerm)
    );
  }, [allItems, searchTerm]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // ── Manufacturer mutations ────────────────────────────────────────────────
  const saveMfrMutation = useMutation({
    mutationFn: (data: typeof mfrForm) =>
      editingMfr
        ? api.put(`/api/catalog/manufacturers/${editingMfr.id}`, data)
        : api.post("/api/catalog/manufacturers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/manufacturers"] });
      setShowMfrModal(false);
      setEditingMfr(null);
      setMfrForm(emptyManufacturer());
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const deleteMfrMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/catalog/manufacturers/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/manufacturers"] });
      if (selectedMfrId === id) {
        setSelectedMfrId(null);
        setSelectedCategoryId(null);
      }
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  // ── Category mutations ────────────────────────────────────────────────────
  const saveCatMutation = useMutation({
    mutationFn: (data: typeof catForm) =>
      editingCat
        ? api.put(`/api/catalog/categories/${editingCat.id}`, data)
        : api.post("/api/catalog/categories", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/categories", selectedMfrId] });
      setShowCatModal(false);
      setEditingCat(null);
      setCatForm(emptyCategory(selectedMfrId ?? 0));
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/catalog/categories/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/categories", selectedMfrId] });
      if (selectedCategoryId === id) setSelectedCategoryId(null);
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  // ── Item mutations ────────────────────────────────────────────────────────
  const saveItemMutation = useMutation({
    mutationFn: (data: typeof itemForm) =>
      editingItem
        ? api.put(`/api/catalog/items/${editingItem.id}`, data)
        : api.post("/api/catalog/items", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/items", selectedCategoryId] });
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm(emptyItem(selectedCategoryId ?? 0));
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/catalog/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/catalog/items", selectedCategoryId] }),
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const patchPriceMutation = useMutation({
    mutationFn: ({ id, unitPrice }: { id: number; unitPrice: number }) =>
      api.patch(`/api/catalog/items/${id}`, { unitPrice }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/items", selectedCategoryId] });
      setInlineEditId(null);
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const saveColorMutation = useMutation({
    mutationFn: (data: { ral: string; name: string; hex: string; sortOrder: number }) =>
      editingColor
        ? api.put(`/api/catalog/colors/${editingColor.id}`, { ...data, manufacturerId: selectedMfrId })
        : api.post("/api/catalog/colors", { ...data, manufacturerId: selectedMfrId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/catalog/colors", selectedMfrId] });
      setShowColorModal(false);
      setEditingColor(null);
      setColorForm({ ral: "", name: "", hex: "#cccccc", sortOrder: 0 });
    },
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  const deleteColorMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/catalog/colors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/catalog/colors", selectedMfrId] }),
    onError: (err: any) => alert("Fehler: " + (err.message ?? err)),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openCreateMfr() {
    setEditingMfr(null);
    setMfrForm(emptyManufacturer());
    setShowMfrModal(true);
  }

  function openEditMfr(mfr: Manufacturer) {
    setEditingMfr(mfr);
    setMfrForm({ name: mfr.name, description: mfr.description ?? "", website: mfr.website ?? "", contactInfo: mfr.contactInfo ?? "", markupPercent: Number(mfr.markupPercent ?? 0), sortOrder: mfr.sortOrder });
    setShowMfrModal(true);
  }

  function openCreateCat() {
    if (!selectedMfrId) return;
    setEditingCat(null);
    setCatForm(emptyCategory(selectedMfrId));
    setShowCatModal(true);
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat);
    setCatForm({ manufacturerId: cat.manufacturerId, name: cat.name, description: cat.description ?? "", productInfoText: cat.productInfoText ?? "", parentId: cat.parentId ?? null, sortOrder: cat.sortOrder });
    setShowCatModal(true);
  }

  function openCreateItem() {
    if (!selectedCategoryId) return;
    setEditingItem(null);
    setItemForm(emptyItem(selectedCategoryId));
    setShowItemModal(true);
  }

  function openEditItem(item: CatalogItem) {
    setEditingItem(item);
    setItemForm({
      categoryId: item.categoryId,
      articleNumber: item.articleNumber ?? "",
      name: item.name,
      description: item.description ?? "",
      productDescription: item.productDescription ?? "",
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      notes: item.notes ?? "",
      sortOrder: item.sortOrder,
    });
    setShowItemModal(true);
  }

  function startInlinePrice(item: CatalogItem) {
    setInlineEditId(item.id);
    setInlinePrice(Number(item.unitPrice).toFixed(2));
  }

  function commitInlinePrice(id: number) {
    const val = parseFloat(inlinePrice.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      patchPriceMutation.mutate({ id, unitPrice: val });
    } else {
      setInlineEditId(null);
    }
  }

  const rootCategories = categories.filter((c) => !c.parentId);
  const childCategories = (parentId: number) => categories.filter((c) => c.parentId === parentId);

  function renderCategoryTree(cats: Category[], depth = 0): React.ReactNode {
    return cats.map((cat) => {
      const children = childCategories(cat.id);
      return (
        <li key={cat.id}>
          <CategoryRow
            cat={cat}
            depth={depth}
            selected={selectedCategoryId === cat.id}
            onSelect={() => setSelectedCategoryId(cat.id)}
            onEdit={() => openEditCat(cat)}
            onDelete={() => {
              if (confirm(`Kategorie "${cat.name}" löschen?`))
                deleteCatMutation.mutate(cat.id);
            }}
          />
          {children.length > 0 && (
            <ul>{renderCategoryTree(children, depth + 1)}</ul>
          )}
        </li>
      );
    });
  }
  const selectedCat = categories.find((c) => c.id === selectedCategoryId);
  const selectedMfr = manufacturers.find((m) => m.id === selectedMfrId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Hersteller-Auswahl (neue oberste Ebene) ── */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Hersteller:</span>
        <select
          value={selectedMfrId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            setSelectedMfrId(id);
            setSelectedCategoryId(null);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold min-w-[200px]"
        >
          <option value="">— Hersteller wählen —</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button
          onClick={openCreateMfr}
          className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:opacity-90"
        >
          + Neuer Hersteller
        </button>
        {selectedMfr && (
          <>
            <button
              onClick={() => openEditMfr(selectedMfr)}
              className="text-xs text-blue-600 hover:underline px-2"
            >
              Bearbeiten
            </button>
            <button
              onClick={() => setShowColorsPanel((v) => !v)}
              className="text-xs text-purple-600 hover:underline px-2"
            >
              🎨 Farben ({colors.length})
            </button>
            <button
              onClick={() => {
                if (confirm(`Hersteller "${selectedMfr.name}" und alle Kategorien/Artikel löschen?`))
                  deleteMfrMutation.mutate(selectedMfr.id);
              }}
              className="text-xs text-red-500 hover:underline px-2"
            >
              Löschen
            </button>
          </>
        )}
      </div>

      {/* ── Header mit Suche ── */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex-shrink-0">Produktkatalog</h1>
        <div className="flex-1 relative max-w-lg">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Artikel, Artikelnummer oder Beschreibung suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <span className="text-sm text-gray-500 flex-shrink-0">
            {allItemsLoading ? "Suche…" : `${searchResults.length} Treffer`}
          </span>
        )}
      </div>

      {/* ── Suchergebnisse (overlay über normalen View) ── */}
      {searchTerm ? (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-700 text-sm">
              Suchergebnisse für &ldquo;{search}&rdquo;
            </span>
          </div>
          {allItemsLoading ? (
            <div className="p-6 text-sm text-gray-400">Suche…</div>
          ) : searchResults.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Keine Artikel gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left font-medium w-24">Art.-Nr.</th>
                    <th className="px-4 py-2 text-left font-medium">Bezeichnung</th>
                    <th className="px-4 py-2 text-left font-medium">Kategorie</th>
                    <th className="px-4 py-2 text-left font-medium w-20">Einheit</th>
                    <th className="px-4 py-2 text-right font-medium w-32">EK (€)</th>
                    <th className="px-4 py-2 text-right font-medium w-32">VK (€)</th>
                    <th className="px-4 py-2 text-right font-medium w-24">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((item) => {
                    const cat = categoryById.get(item.categoryId);
                    // find the manufacturer for this item via its category
                    const itemMfr = cat
                      ? manufacturers.find((m) => m.id === cat.manufacturerId)
                      : undefined;
                    const markup = Number(itemMfr?.markupPercent ?? 0);
                    const vkPrice = Number(item.unitPrice) * (1 + markup / 100);
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                          {item.articleNumber || "—"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">
                            <HighlightText text={item.name} term={searchTerm} />
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              <HighlightText text={item.description} term={searchTerm} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {cat ? (
                            <button
                              onClick={() => { setSelectedCategoryId(cat.id); setSearch(""); }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {cat.name}
                            </button>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{item.unit}</td>
                        <td className="px-4 py-2 text-right">
                          {inlineEditId === item.id ? (
                            <input
                              autoFocus
                              type="number" step="0.01" min="0"
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(e.target.value)}
                              onBlur={() => commitInlinePrice(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitInlinePrice(item.id);
                                if (e.key === "Escape") setInlineEditId(null);
                              }}
                              className="w-24 text-right border border-brand-gold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                          ) : (
                            <button
                              onClick={() => startInlinePrice(item)}
                              className="text-gray-500 hover:text-brand-gold hover:underline cursor-pointer"
                              title="Klicken zum Bearbeiten"
                            >
                              {Number(item.unitPrice).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="font-semibold text-gray-900">
                            {vkPrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {itemMfr && markup > 0 && (
                              <span className="ml-1 text-xs text-gray-400 font-normal">
                                +{markup.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditItem(item)}
                              className="text-xs text-blue-600 hover:underline px-1"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Artikel "${item.name}" löschen?`))
                                  deleteItemMutation.mutate(item.id);
                              }}
                              className="text-xs text-red-500 hover:underline px-1"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
      <div className="flex gap-6" style={{ minHeight: "70vh" }}>
        {/* ── Kategoriebaum ── */}
        <aside className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-700 text-sm">Kategorien</span>
              <button
                onClick={openCreateCat}
                className="text-xs bg-brand-gold text-white px-2 py-1 rounded hover:opacity-90"
              >
                + Neu
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 48px)" }}>
              {!selectedMfrId ? (
                <div className="p-4 text-sm text-gray-400">Bitte Hersteller wählen</div>
              ) : catsLoading ? (
                <div className="p-4 text-sm text-gray-400">Laden…</div>
              ) : rootCategories.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">Keine Kategorien vorhanden</div>
              ) : (
                <ul className="py-2">
                  {renderCategoryTree(rootCategories)}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* ── Artikeltabelle ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-700 text-sm">
                {selectedCat ? selectedCat.name : "← Kategorie auswählen"}
              </span>
              {selectedCategoryId && (
                <button
                  onClick={openCreateItem}
                  className="text-xs bg-brand-gold text-white px-2 py-1 rounded hover:opacity-90"
                >
                  + Artikel
                </button>
              )}
            </div>

            {!selectedCategoryId ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Bitte eine Kategorie auswählen
              </div>
            ) : itemsLoading ? (
              <div className="p-6 text-sm text-gray-400">Laden…</div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Keine Artikel in dieser Kategorie
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2 text-left font-medium w-24">Art.-Nr.</th>
                      <th className="px-4 py-2 text-left font-medium">Bezeichnung</th>
                      <th className="px-4 py-2 text-left font-medium w-20">Einheit</th>
                      <th className="px-4 py-2 text-right font-medium w-32">EK (€)</th>
                      <th className="px-4 py-2 text-right font-medium w-36">
                        VK (€)
                        {selectedMfr && Number(selectedMfr.markupPercent) > 0 && (
                          <span className="ml-1 text-gray-400 normal-case font-normal">
                            +{Number(selectedMfr.markupPercent).toLocaleString("de-DE", { maximumFractionDigits: 1 })}%
                          </span>
                        )}
                      </th>
                      <th className="px-4 py-2 text-right font-medium w-24">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const markup = Number(selectedMfr?.markupPercent ?? 0);
                      const vkPrice = Number(item.unitPrice) * (1 + markup / 100);
                      return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                          {item.articleNumber || "—"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{item.unit}</td>
                        <td className="px-4 py-2 text-right">
                          {inlineEditId === item.id ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              min="0"
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(e.target.value)}
                              onBlur={() => commitInlinePrice(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitInlinePrice(item.id);
                                if (e.key === "Escape") setInlineEditId(null);
                              }}
                              className="w-24 text-right border border-brand-gold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                          ) : (
                            <button
                              onClick={() => startInlinePrice(item)}
                              className="text-gray-500 hover:text-brand-gold hover:underline cursor-pointer"
                              title="Klicken zum Bearbeiten"
                            >
                              {Number(item.unitPrice).toLocaleString("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="font-semibold text-gray-900">
                            {vkPrice.toLocaleString("de-DE", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditItem(item)}
                              className="text-xs text-blue-600 hover:underline px-1"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Artikel "${item.name}" löschen?`))
                                  deleteItemMutation.mutate(item.id);
                              }}
                              className="text-xs text-red-500 hover:underline px-1"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      )} {/* end searchTerm ternary */}

      {/* ── Farben-Panel ── */}
      {showColorsPanel && selectedMfrId && (
        <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-700 text-sm">🎨 Farben für {selectedMfr?.name}</span>
            <button
              onClick={() => {
                setEditingColor(null);
                setColorForm({ ral: "", name: "", hex: "#cccccc", sortOrder: 0 });
                setShowColorModal(true);
              }}
              className="text-xs bg-brand-gold text-white px-3 py-1 rounded hover:opacity-90"
            >
              + Neue Farbe
            </button>
          </div>
          {colors.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">Keine Farben hinterlegt.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
              {colors.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1 group">
                  <div
                    className="w-10 h-10 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-medium text-gray-800 text-center">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.ral}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingColor(c);
                        setColorForm({ ral: c.ral, name: c.name, hex: c.hex, sortOrder: c.sortOrder });
                        setShowColorModal(true);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >✏️</button>
                    <button
                      onClick={() => {
                        if (confirm(`Farbe "${c.name}" löschen?`)) deleteColorMutation.mutate(c.id);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Hersteller-Modal ── */}
      {showMfrModal && (
        <Modal title={editingMfr ? "Hersteller bearbeiten" : "Neuer Hersteller"} onClose={() => setShowMfrModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung *</label>
              <input
                autoFocus
                type="text"
                value={mfrForm.name}
                onChange={(e) => setMfrForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input
                type="text"
                value={mfrForm.description ?? ""}
                onChange={(e) => setMfrForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={mfrForm.website ?? ""}
                onChange={(e) => setMfrForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktinfo</label>
              <input
                type="text"
                value={mfrForm.contactInfo ?? ""}
                onChange={(e) => setMfrForm((f) => ({ ...f, contactInfo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aufschlag auf EK (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="999"
                  step="0.1"
                  value={mfrForm.markupPercent}
                  onChange={(e) => setMfrForm((f) => ({ ...f, markupPercent: Number(e.target.value) }))}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <span className="text-sm text-gray-500">%</span>
                {mfrForm.markupPercent > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    → EK × {(1 + mfrForm.markupPercent / 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} = VK
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Der VK-Preis wird automatisch aus EK + diesem Aufschlag berechnet.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowMfrModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              disabled={!mfrForm.name.trim() || saveMfrMutation.isPending}
              onClick={() => saveMfrMutation.mutate(mfrForm)}
              className="px-4 py-2 text-sm text-white bg-brand-gold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saveMfrMutation.isPending ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Kategorie-Modal ── */}
      {showCatModal && (
        <Modal title={editingCat ? "Kategorie bearbeiten" : "Neue Kategorie"} onClose={() => setShowCatModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung *</label>
              <input
                autoFocus
                type="text"
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input
                type="text"
                value={catForm.description ?? ""}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produkttext für PDF</label>
              <textarea
                rows={6}
                value={catForm.productInfoText ?? ""}
                onChange={(e) => setCatForm((f) => ({ ...f, productInfoText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Übergeordnete Kategorie</label>
              <select
                value={catForm.parentId ?? ""}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, parentId: e.target.value ? Number(e.target.value) : null }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="">— Keine (Hauptkategorie) —</option>
                {rootCategories
                  .filter((c) => c.id !== editingCat?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reihenfolge</label>
              <input
                type="number"
                min="0"
                value={catForm.sortOrder}
                onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowCatModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              disabled={!catForm.name.trim() || saveCatMutation.isPending}
              onClick={() => saveCatMutation.mutate(catForm)}
              className="px-4 py-2 text-sm text-white bg-brand-gold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saveCatMutation.isPending ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Farben-Modal ── */}
      {showColorModal && (
        <Modal title={editingColor ? "Farbe bearbeiten" : "Neue Farbe"} onClose={() => setShowColorModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RAL-Code / Bezeichnung *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="z.B. 7016ST"
                  value={colorForm.ral}
                  onChange={(e) => setColorForm((f) => ({ ...f, ral: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farbname *</label>
                <input
                  type="text"
                  placeholder="z.B. Anthrazit"
                  value={colorForm.name}
                  onChange={(e) => setColorForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farbe (HEX)</label>
                <input
                  type="color"
                  value={colorForm.hex}
                  onChange={(e) => setColorForm((f) => ({ ...f, hex: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">HEX-Wert</label>
                <input
                  type="text"
                  value={colorForm.hex}
                  onChange={(e) => setColorForm((f) => ({ ...f, hex: e.target.value }))}
                  placeholder="#cccccc"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reihenfolge</label>
                <input
                  type="number"
                  min="0"
                  value={colorForm.sortOrder}
                  onChange={(e) => setColorForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-10 h-10 rounded-full border border-black/10 shadow-sm flex-shrink-0"
                style={{ backgroundColor: colorForm.hex }}
              />
              <span className="text-sm text-gray-700">{colorForm.name || "Vorschau"} ({colorForm.ral || "—"})</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowColorModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              disabled={!colorForm.ral.trim() || !colorForm.name.trim() || saveColorMutation.isPending}
              onClick={() => saveColorMutation.mutate(colorForm)}
              className="px-4 py-2 text-sm text-white bg-brand-gold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saveColorMutation.isPending ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Artikel-Modal ── */}
      {showItemModal && (
        <Modal title={editingItem ? "Artikel bearbeiten" : "Neuer Artikel"} onClose={() => setShowItemModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artikelnummer</label>
                <input
                  type="text"
                  value={itemForm.articleNumber ?? ""}
                  onChange={(e) => setItemForm((f) => ({ ...f, articleNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Einheit *</label>
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  {["Stk", "m", "m²", "lfm", "Pauschal", "h", "kg"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung *</label>
              <input
                autoFocus
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input
                type="text"
                value={itemForm.description ?? ""}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produktbeschreibung (PDF)</label>
              <textarea
                rows={4}
                value={itemForm.productDescription ?? ""}
                onChange={(e) => setItemForm((f) => ({ ...f, productDescription: e.target.value }))}
                placeholder="Individuelle Beschreibung für Angebote und Rechnungen…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.unitPrice}
                  onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reihenfolge</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.sortOrder}
                  onChange={(e) => setItemForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea
                value={itemForm.notes ?? ""}
                onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowItemModal(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              disabled={!itemForm.name.trim() || saveItemMutation.isPending}
              onClick={() => saveItemMutation.mutate(itemForm)}
              className="px-4 py-2 text-sm text-white bg-brand-gold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saveItemMutation.isPending ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Small reusable components ──────────────────────────────────────────────

function CategoryRow({
  cat,
  selected,
  depth = 0,
  onSelect,
  onEdit,
  onDelete,
}: {
  cat: Category;
  selected: boolean;
  depth?: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const paddingLeft = 12 + depth * 16;
  return (
    <li
      style={{ paddingLeft }}
      className={`flex items-center justify-between pr-3 py-2 cursor-pointer group text-sm transition-colors ${
        selected ? "bg-brand-gold/10 text-brand-gold font-medium" : "hover:bg-gray-50 text-gray-700"
      }`}
      onClick={onSelect}
    >
      <span className="truncate flex-1">{cat.name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-xs text-blue-500 hover:text-blue-700 px-1"
          title="Bearbeiten"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-400 hover:text-red-600 px-1"
          title="Löschen"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Highlights matching term in text
function HighlightText({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}
