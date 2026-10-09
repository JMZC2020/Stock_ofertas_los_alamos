import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

interface Alerta {
  id: string;
  tipo: string;
  prioridad: "critica" | "alta" | "media";
  productoId: number;
  producto: string;
  detalle: string;
  fecha: string;
}

function mapFromApi(a: any): Alerta {
  return {
    id: a.id,
    tipo: a.tipo,
    prioridad: a.prioridad,
    productoId: a.producto_id,
    producto: a.producto,
    detalle: a.detalle,
    fecha: a.fecha,
  };
}

const prioridadConfig = {
  critica: { label: "Crítica", bg: "bg-[#fde8e6]", border: "border-[#e74c3c]/30", text: "text-[#c0392b]", badge: "bg-[#c0392b] text-white" },
  alta: { label: "Alta", bg: "bg-[#fde8e6]", border: "border-[#e74c3c]/20", text: "text-[#c0392b]", badge: "bg-[#e74c3c] text-white" },
  media: { label: "Media", bg: "bg-[#fdf3e3]", border: "border-[#e67e22]/20", text: "text-[#e67e22]", badge: "bg-[#e67e22] text-white" },
};

const tipoIcon = (tipo: string) => tipo === "stock_critico" ? (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
) : (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function AlertaCard({ a }: { a: Alerta }) {
  const cfg = prioridadConfig[a.prioridad];
  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-start gap-4`}>
      <div className={`mt-0.5 ${cfg.text} shrink-0`}>{tipoIcon(a.tipo)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="font-600 text-[#0d1530] text-sm" style={{ fontWeight: 600 }}>{a.producto}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 ${cfg.badge}`} style={{ fontWeight: 700 }}>{cfg.label}</span>
        </div>
        <p className="text-xs text-[#4a5580]">{a.detalle}</p>
        <p className="text-[11px] text-[#8891b0] mt-1">{a.fecha}</p>
      </div>
    </div>
  );
}

type Filtro = "todas" | "sin_stock" | "stock_bajo" | "vencimiento";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "stock_bajo", label: "Stock bajo" },
  { value: "vencimiento", label: "Por vencer" },
];

function coincideFiltro(a: Alerta, filtro: Filtro): boolean {
  if (filtro === "todas") return true;
  if (filtro === "sin_stock") return a.tipo === "stock_critico" && a.prioridad === "critica";
  if (filtro === "stock_bajo") return a.tipo === "stock_critico" && a.prioridad !== "critica";
  if (filtro === "vencimiento") return a.tipo === "vencimiento";
  return true;
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const cargarAlertas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/alertas/`);
      if (!res.ok) throw new Error(`Error ${res.status} al cargar alertas`);
      const data = await res.json();
      setAlertas(data.map(mapFromApi));
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const stockCount = alertas.filter((a) => a.tipo === "stock_critico").length;
  const vencimientoCount = alertas.filter((a) => a.tipo === "vencimiento").length;
  const urgentesCount = alertas.filter((a) => a.prioridad === "critica").length;

  const visibles = alertas.filter((a) => coincideFiltro(a, filtro));
  const criticas = visibles.filter((a) => a.prioridad === "critica" || a.prioridad === "alta");
  const medias = visibles.filter((a) => a.prioridad === "media");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Centro de Alertas</h1>
        <p className="text-sm text-[#8891b0] mt-0.5">
          {loading ? "Cargando..." : `${alertas.length} alertas activas requieren atención`}
        </p>
      </div>

      {error && (
        <div className="bg-[#fde8e6] text-[#c0392b] text-sm rounded-xl p-4 border border-[#f5c6c2]">
          {error} — verifica que el backend esté corriendo en {API_BASE}.
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Stock crítico / bajo", count: stockCount, color: "text-[#c0392b]", bg: "bg-[#fde8e6]" },
          { label: "Por vencer", count: vencimientoCount, color: "text-[#e67e22]", bg: "bg-[#fdf3e3]" },
          { label: "Urgentes (crítica)", count: urgentesCount, color: "text-[#1a7a4a]", bg: "bg-[#e8f8ef]" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <p className="text-xs font-500 text-[#4a5580] uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{s.label}</p>
            <p className={`text-3xl font-800 font-mono ${s.color}`} style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const count = f.value === "todas" ? alertas.length : alertas.filter((a) => coincideFiltro(a, f.value)).length;
          const activo = filtro === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-600 transition ${activo ? "bg-[#1e2d5a] text-white shadow" : "bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5]"}`}
              style={{ fontWeight: 600 }}
            >
              {f.label} <span className={activo ? "opacity-70" : "text-[#8891b0]"}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        <h2 className="text-sm font-600 text-[#0d1530] uppercase tracking-wider" style={{ fontWeight: 600 }}>Prioridad crítica y alta</h2>
        {!loading && criticas.length === 0 && (
          <p className="text-sm text-[#8891b0] py-2">No hay alertas de prioridad crítica o alta por el momento.</p>
        )}
        {criticas.map((a) => <AlertaCard key={a.id} a={a} />)}

        <h2 className="text-sm font-600 text-[#0d1530] uppercase tracking-wider pt-2" style={{ fontWeight: 600 }}>Prioridad media</h2>
        {!loading && medias.length === 0 && (
          <p className="text-sm text-[#8891b0] py-2">No hay alertas de prioridad media por el momento.</p>
        )}
        {medias.map((a) => <AlertaCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}