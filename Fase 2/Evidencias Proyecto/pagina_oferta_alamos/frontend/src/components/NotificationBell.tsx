import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:8000";
const REFRESCO_MS = 60_000;

interface Alerta {
  id: string;
  tipo: "stock_critico" | "vencimiento";
  prioridad: "critica" | "alta" | "media";
  producto: string;
  detalle: string;
}

interface Props {
  /** Cambia cuando el usuario navega: se vuelve a consultar para no mostrar datos viejos. */
  refreshKey?: string;
  onVerTodas: () => void;
}

const ORDEN = { critica: 0, alta: 1, media: 2 } as const;
const ESTILO = {
  critica: { punto: "bg-[#e74c3c]", etiqueta: "Crítica", texto: "text-[#c0392b]" },
  alta: { punto: "bg-[#e67e22]", etiqueta: "Alta", texto: "text-[#b9651a]" },
  media: { punto: "bg-[#f1c40f]", etiqueta: "Media", texto: "text-[#8a6d00]" },
} as const;

export default function NotificationBell({ refreshKey, onVerTodas }: Props) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [fallo, setFallo] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alertas/`);
      if (!res.ok) throw new Error();
      setAlertas(await res.json());
      setFallo(false);
    } catch {
      setFallo(true);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargar, refreshKey]);

  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  const ordenadas = [...alertas].sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad]);
  const visibles = ordenadas.slice(0, 6);
  const total = alertas.length;

  return (
    <div className="relative" ref={contenedor}>
      <button
        onClick={() => {
          setAbierto(!abierto);
          if (!abierto) cargar();
        }}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#a8bde8] hover:text-white hover:bg-white/10 transition"
        title={total > 0 ? `${total} alerta(s) pendiente(s)` : "Notificaciones"}
        aria-label={total > 0 ? `Notificaciones: ${total} alertas pendientes` : "Notificaciones"}
        aria-expanded={abierto}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {total > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#e74c3c] text-white text-[9px] flex items-center justify-center" style={{ fontWeight: 700 }}>
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-[#dde2ef] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eef1f8] flex items-center justify-between">
            <span className="text-sm text-[#0d1530]" style={{ fontWeight: 600 }}>Notificaciones</span>
            {total > 0 && <span className="text-xs text-[#8891b0]">{total} pendiente{total === 1 ? "" : "s"}</span>}
          </div>

          {fallo && <p className="px-4 py-3 text-xs text-[#c0392b]">No se pudieron cargar las alertas.</p>}

          {!fallo && total === 0 && (
            <p className="px-4 py-6 text-sm text-center text-[#8891b0]">Sin alertas pendientes. Todo en orden.</p>
          )}

          {visibles.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAbierto(false);
                onVerTodas();
              }}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#f5f7fc] border-b border-[#eef1f8] last:border-0"
            >
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ESTILO[a.prioridad].punto}`} />
              <span className="min-w-0">
                <span className="block text-xs text-[#0d1530] truncate" style={{ fontWeight: 600 }}>{a.producto}</span>
                <span className="block text-xs text-[#4a5580]">{a.detalle}</span>
                <span className={`block text-[10px] uppercase tracking-wider mt-0.5 ${ESTILO[a.prioridad].texto}`} style={{ fontWeight: 600 }}>
                  {a.tipo === "vencimiento" ? "Vencimiento" : "Stock"} · {ESTILO[a.prioridad].etiqueta}
                </span>
              </span>
            </button>
          ))}

          {total > 0 && (
            <button
              onClick={() => {
                setAbierto(false);
                onVerTodas();
              }}
              className="w-full px-4 py-3 text-xs text-[#1e2d5a] bg-[#f5f7fc] hover:bg-[#eef1f8] transition"
              style={{ fontWeight: 600 }}
            >
              {total > visibles.length ? `Ver las ${total} alertas` : "Ver todas las alertas"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}