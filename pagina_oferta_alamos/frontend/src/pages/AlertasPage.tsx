// Datos de ejemplo a traves de las historias de usuario y se conectarán a la API real en el Sprint 6 (Alertas)
const ALERTAS: { id: number; tipo: string; producto: string; detalle: string; fecha: string; prioridad: string }[] = [];

const prioridadConfig = {
  critica: { label: "Crítica", bg: "bg-[#fde8e6]", border: "border-[#e74c3c]/30", dot: "bg-[#c0392b]", text: "text-[#c0392b]", badge: "bg-[#c0392b] text-white" },
  alta: { label: "Alta", bg: "bg-[#fde8e6]", border: "border-[#e74c3c]/20", dot: "bg-[#e74c3c]", text: "text-[#c0392b]", badge: "bg-[#e74c3c] text-white" },
  media: { label: "Media", bg: "bg-[#fdf3e3]", border: "border-[#e67e22]/20", dot: "bg-[#e67e22]", text: "text-[#e67e22]", badge: "bg-[#e67e22] text-white" },
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

export default function AlertasPage() {
  const criticas = ALERTAS.filter((a) => a.prioridad === "critica" || a.prioridad === "alta");
  const medias = ALERTAS.filter((a) => a.prioridad === "media");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Centro de Alertas</h1>
        <p className="text-sm text-[#8891b0] mt-0.5">{ALERTAS.length} alertas activas requieren atención</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Stock crítico", count: ALERTAS.filter((a) => a.tipo === "stock_critico").length, color: "text-[#c0392b]", bg: "bg-[#fde8e6]" },
          { label: "Por vencer", count: ALERTAS.filter((a) => a.tipo === "vencimiento").length, color: "text-[#e67e22]", bg: "bg-[#fdf3e3]" },
          { label: "Atendidas hoy", count: 3, color: "text-[#1a7a4a]", bg: "bg-[#e8f8ef]" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <p className="text-xs font-500 text-[#4a5580] uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{s.label}</p>
            <p className={`text-3xl font-800 font-mono ${s.color}`} style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        <h2 className="text-sm font-600 text-[#0d1530] uppercase tracking-wider" style={{ fontWeight: 600 }}>Prioridad crítica y alta</h2>
        {criticas.length === 0 && (
          <p className="text-sm text-[#8891b0] py-2">No hay alertas de prioridad crítica o alta por el momento.</p>
        )}
        {criticas.map((a) => {
          const cfg = prioridadConfig[a.prioridad as keyof typeof prioridadConfig];
          return (
            <div key={a.id} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-start gap-4`}>
              <div className={`mt-0.5 ${cfg.text} shrink-0`}>{tipoIcon(a.tipo)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-600 text-[#0d1530] text-sm" style={{ fontWeight: 600 }}>{a.producto}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 ${cfg.badge}`} style={{ fontWeight: 700 }}>{cfg.label}</span>
                </div>
                <p className="text-xs text-[#4a5580]">{a.detalle}</p>
                <p className="text-[11px] text-[#8891b0] mt-1">{a.fecha}</p>
              </div>
              <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-600 border border-[#dde2ef] bg-white text-[#4a5580] hover:text-[#1e2d5a] hover:border-[#1e2d5a] transition" style={{ fontWeight: 600 }}>
                Atender
              </button>
            </div>
          );
        })}

        <h2 className="text-sm font-600 text-[#0d1530] uppercase tracking-wider pt-2" style={{ fontWeight: 600 }}>Prioridad media</h2>
        {medias.length === 0 && (
          <p className="text-sm text-[#8891b0] py-2">No hay alertas de prioridad media por el momento.</p>
        )}
        {medias.map((a) => {
          const cfg = prioridadConfig[a.prioridad as keyof typeof prioridadConfig];
          return (
            <div key={a.id} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-start gap-4`}>
              <div className={`mt-0.5 ${cfg.text} shrink-0`}>{tipoIcon(a.tipo)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-600 text-[#0d1530] text-sm" style={{ fontWeight: 600 }}>{a.producto}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 ${cfg.badge}`} style={{ fontWeight: 700 }}>{cfg.label}</span>
                </div>
                <p className="text-xs text-[#4a5580]">{a.detalle}</p>
                <p className="text-[11px] text-[#8891b0] mt-1">{a.fecha}</p>
              </div>
              <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-600 border border-[#dde2ef] bg-white text-[#4a5580] hover:text-[#1e2d5a] hover:border-[#1e2d5a] transition" style={{ fontWeight: 600 }}>
                Atender
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
