import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Inquiry {
  id: number;
  type: "contact" | "offer";
  product: string | null;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  message: string;
  consentAccepted: boolean;
  fileCount: number;
  uploadedFilesJson: string;
  createdAt: string;
}

function typeBadge(type: string) {
  return type === "offer"
    ? "bg-amber-900/50 text-amber-300"
    : "bg-blue-900/50 text-blue-300";
}

export default function InquiriesPage() {
  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    queryFn: () => api.get("/api/inquiries"),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Anfragen</h1>
      <p className="text-sm text-gray-500 mb-8">
        Kontakt- und Angebotsanfragen von der öffentlichen Website.
      </p>

      {isLoading && (
        <div className="text-gray-400 text-sm">Wird geladen...</div>
      )}

      {!isLoading && inquiries.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">
          Noch keine Anfragen eingegangen.
        </div>
      )}

      {!isLoading && inquiries.length > 0 && (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            let files: Array<{ originalname: string; mimetype: string; size: number; storageKey?: string }> = [];
            try {
              files = JSON.parse(inquiry.uploadedFilesJson);
            } catch {}

            return (
              <article key={inquiry.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeBadge(inquiry.type)}`}>
                      {inquiry.type === "offer" ? "Angebotsanfrage" : "Kontaktanfrage"}
                    </span>
                    {inquiry.product && (
                      <span className="text-sm text-gray-300 font-medium">{inquiry.product}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(inquiry.createdAt).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{inquiry.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">E-Mail</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${inquiry.email}`} className="hover:text-brand-gold">{inquiry.email}</a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Telefon</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${inquiry.phone}`} className="hover:text-brand-gold">{inquiry.phone}</a>
                    </dd>
                  </div>
                  {inquiry.address && (
                    <div>
                      <dt className="text-xs text-gray-400 uppercase tracking-wide">Adresse</dt>
                      <dd className="mt-1 text-sm text-gray-900">{inquiry.address}</dd>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Nachricht</dt>
                  <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-6">{inquiry.message}</dd>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <dt className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      Uploads ({files.length})
                    </dt>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <span
                          key={index}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                          title={`${file.mimetype} – ${(file.size / 1024).toFixed(1)} KB`}
                        >
                          {file.originalname}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
