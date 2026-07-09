// client/src/components/EmailDialog.tsx
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  docType: "quote" | "invoice" | "protocol";
  docId: number;
  docNumber: string;
  onSuccess?: () => void;
}

const DOC_LABELS: Record<string, string> = {
  quote: "Angebot",
  invoice: "Rechnung",
  protocol: "Abnahmeprotokoll",
};

const API_PATHS: Record<string, string> = {
  quote: "quotes",
  invoice: "invoices",
  protocol: "protocols",
};

export default function EmailDialog({ open, onClose, docType, docId, docNumber, onSuccess }: EmailDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data: template, isLoading: tplLoading } = useQuery({
    queryKey: ["/api/email-templates", docType, docId],
    queryFn: () =>
      api.get<{ subject: string; body: string; to: string; signature: string }>(
        `/api/email-templates/${docType}/${docId}`
      ),
    enabled: open,
    staleTime: 30_000,
  });

  // Pre-fill form when template loads
  useEffect(() => {
    if (!open) return;
    if (template) {
      setTo(template.to ?? "");
      setSubject(template.subject ?? "");
      setBody(template.body ?? "");
    }
  }, [open, template]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTo("");
      setSubject("");
      setBody("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/${API_PATHS[docType]}/${docId}/send-email`, { to, subject, message: body }),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => alert("Fehler beim Versand: " + (err.message ?? String(err))),
  });

  if (!open) return null;

  const signaturePreview = template?.signature ?? "";
  const docLabel = DOC_LABELS[docType] ?? docType;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">E-Mail versenden</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {docLabel} <span className="font-semibold text-gray-600">{docNumber}</span> · wird als PDF-Anhang versendet
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none mt-0.5 ml-4"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {tplLoading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Vorlage wird geladen…</div>
        ) : (
          <>
            {/* Form body */}
            <div className="px-6 py-5 space-y-4">
              {/* To */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Empfänger
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
                  placeholder="empfaenger@beispiel.de"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Betreff
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nachricht
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={11}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition resize-y font-mono leading-relaxed"
                />
              </div>

              {/* Signature preview */}
              {signaturePreview && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Automatische E-Mail-Signatur (wird automatisch angehängt)
                  </label>
                  <pre className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 whitespace-pre-wrap font-mono leading-relaxed border border-gray-100 select-none">
                    {signaturePreview}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                {docLabel} <span className="font-medium">{docNumber}</span> wird automatisch als Anhang beigefügt
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={!to.trim() || sendMutation.isPending}
                  className="px-5 py-2 bg-brand-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sendMutation.isPending ? "Wird versendet…" : "E-Mail senden"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
