// client/src/pages/DashboardPage.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "../lib/api.js";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 text-white ${color}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
    queryFn: () => api.get("/api/quotes"),
  });
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: () => api.get("/api/invoices"),
  });
  const { data: protocols = [] } = useQuery<any[]>({
    queryKey: ["/api/protocols"],
    queryFn: () => api.get("/api/protocols"),
  });
  const { data: inquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/inquiries"],
    queryFn: () => api.get("/api/inquiries"),
  });

  const newInquiries = inquiries.filter((inquiry: any) => {
    const age = Date.now() - new Date(inquiry.createdAt).getTime();
    return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
  });

  const quoteStats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
  };
  const invoiceStats = {
    total: invoices.length,
    open: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  const recentDocs = [
    ...quotes.map((q: any) => ({ type: "Angebot", number: q.quoteNumber, status: q.status, date: q.date })),
    ...invoices.map((i: any) => ({ type: "Rechnung", number: i.invoiceNumber, status: i.status, date: i.date })),
    ...protocols.map((p: any) => ({ type: "Protokoll", number: p.protocolNumber, status: p.status, date: p.date })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const statusLabels: Record<string, string> = {
    draft: "Entwurf",
    sent: "Versendet",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    paid: "Bezahlt",
    overdue: "Überfällig",
    completed: "Abgeschlossen",
    signed: "Unterschrieben",
  };
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    signed: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Angebote gesamt" value={quoteStats.total} color="bg-brand-dark" />
        <StatCard label="Angebote (offen)" value={quoteStats.sent} color="bg-blue-600" />
        <StatCard label="Rechnungen offen" value={invoiceStats.open} color="bg-yellow-500" />
        <StatCard label="Rechnungen bezahlt" value={invoiceStats.paid} color="bg-green-600" />
      </div>

      {/* New inquiries banner */}
      {newInquiries.length > 0 && (
        <Link href="/inquiries">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-xl">📩</span>
              <div>
                <div className="font-semibold text-amber-800">
                  {newInquiries.length} neue Anfrage{newInquiries.length > 1 ? "n" : ""} (letzte 7 Tage)
                </div>
                <div className="text-sm text-amber-700">
                  {newInquiries.filter((i: any) => i.type === "offer").length} Angebotsanfragen ·{" "}
                  {newInquiries.filter((i: any) => i.type === "contact").length} Kontaktanfragen
                </div>
              </div>
            </div>
            <span className="text-amber-500 text-sm font-medium">Alle ansehen →</span>
          </div>
        </Link>
      )}

      {invoiceStats.overdue > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-700">
              {invoiceStats.overdue} überfällige Rechnung{invoiceStats.overdue > 1 ? "n" : ""}
            </div>
            <div className="text-sm text-red-600">Bitte prüfen und nachhaken.</div>
          </div>
        </div>
      )}

      {/* Recent documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Letzte Dokumente</h2>
        </div>
        {recentDocs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Noch keine Dokumente vorhanden.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide">
                <th className="px-6 py-3">Typ</th>
                <th className="px-6 py-3">Nummer</th>
                <th className="px-6 py-3">Datum</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentDocs.map((doc, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{doc.type}</td>
                  <td className="px-6 py-3 text-gray-600 font-mono text-xs">{doc.number}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Intl.DateTimeFormat("de-DE").format(new Date(doc.date))}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[doc.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabels[doc.status] ?? doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
