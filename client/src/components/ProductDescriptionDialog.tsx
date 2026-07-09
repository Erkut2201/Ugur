interface ProductDescriptionDialogProps {
  open: boolean;
  title: string;
  value: string;
  isSaving?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductDescriptionDialog({
  open,
  title,
  value,
  isSaving,
  placeholder,
  onChange,
  onClose,
  onSave,
}: ProductDescriptionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="px-6 py-5">
          <textarea
            autoFocus
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "Produktbeschreibung eingeben..."}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg bg-brand-gold px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
