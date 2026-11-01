import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const API_BASE = "http://localhost:8000";


interface DashboardData {
  kpis: {
    productos_activos: number;
    stock_critico: number;
    sin_stock: number;
    por_vencer: number;
    vencidos: number;
    ventas_mes_total: number;
    ventas_mes_unidades: number;
  };
  ventas_diarias: { fecha: string; total: number }[];
  variacion_7d: number | null;
  top_productos: { producto: string; unidades: number; total: number }[];
  metodos_pago: { metodo: string; total: number; porcentaje: number }[];
}

type KpiCard = {
  label: string; value: string; sub: string;
  color: string; textColor: string; subColor: string;
  alert?: boolean; warn?: boolean;
};

const COLORES_PAGO = ["#1e2d5a", "#3554a5", "#7a93d1", "#b9c6e6", "#d9731a"];

const clp = (v: number) => `$${Math.round(v).toLocaleString("es-CL")}`;
const clpCorto = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })}M`
  : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;
const num = (v: number) => v.toLocaleString("es-CL");


const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-[#8891b0] text-center px-4">
    {text}
  </div>
);

function construirKpis(k: DashboardData["kpis"]): KpiCard[] {
  return [
    {
      label: "Productos activos",
      value: num(k.productos_activos),
      sub: "En el catálogo",
      color: "bg-white", textColor: "text-[#0d1530]", subColor: "text-[#8891b0]",
    },
    {
      label: "Stock crítico",
      value: num(k.stock_critico),
      sub: k.stock_critico > 0 ? `${num(k.sin_stock)} sin stock` : "Todo en orden",
      color: k.stock_critico > 0 ? "bg-[#c0392b]" : "bg-white",
      textColor: k.stock_critico > 0 ? "text-white" : "text-[#0d1530]",
      subColor: k.stock_critico > 0 ? "text-red-100" : "text-[#8891b0]",
      alert: k.stock_critico > 0,
    },
    {
      label: "Por vencer",
      value: num(k.por_vencer),
      sub: k.por_vencer > 0 ? `${num(k.vencidos)} ${k.vencidos === 1 ? "ya vencido" : "ya vencidos"}` : "Sin vencimientos cercanos",
      color: k.por_vencer > 0 ? "bg-[#d9731a]" : "bg-white",
      textColor: k.por_vencer > 0 ? "text-white" : "text-[#0d1530]",
      subColor: k.por_vencer > 0 ? "text-orange-100" : "text-[#8891b0]",
      warn: k.por_vencer > 0,
    },
    {
      label: "Ventas del mes",
      value: clp(k.ventas_mes_total),
      sub: `${num(k.ventas_mes_unidades)} unidades vendidas`,
      color: "bg-[#1e2d5a]", textColor: "text-white", subColor: "text-[#a8bde8]",
    },
  ];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dashboard/`);
      if (!res.ok) throw new Error(`Error ${res.status} al consultar el dashboard`);
      setData(await res.json());
      setActualizado(new Date());
    } catch (e: any) {
      setError(e.message?.includes("fetch") ? "Failed to fetch — verifica que el backend esté corriendo." : e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const kpiCards = data ? construirKpis(data.kpis) : [];
  const hayVentas = !!data && data.ventas_diarias.some((d) => d.total > 0);
  const variacion = data?.variacion_7d ?? null;

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Dashboard Principal</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">
            Resumen del sistema
            {actualizado && ` · actualizado ${actualizado.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg border border-[#dde2ef] text-[#4a5580] bg-white hover:bg-[#f4f6fb] disabled:opacity-50"
        >
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!data && (
          <div className="col-span-2 lg:col-span-4 bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
            <EmptyState text={loading ? "Cargando datos…" : "No se pudieron cargar los datos del dashboard."} />
          </div>
        )}
        {kpiCards.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 shadow-sm border border-[#dde2ef] ${k.color}`}>
            <p
              className={`text-xs font-500 uppercase tracking-wider mb-2 ${k.alert ? "text-red-200" : k.warn ? "text-orange-200" : k.color === "bg-white" ? "text-[#8891b0]" : "text-[#a8bde8]"}`}
              style={{ fontWeight: 500 }}
            >
              {k.label}
            </p>
            <p
              className={`text-3xl font-800 font-mono leading-none mb-1 ${k.textColor}`}
              style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {k.value}
            </p>
            <p className={`text-xs ${k.subColor}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {data && (
        <>
          {/* Tendencia + métodos de pago */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Tendencia de ventas diarias</h2>
                  <p className="text-xs text-[#8891b0]">Últimos 30 días</p>
                </div>
                {variacion !== null && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-600 ${variacion >= 0 ? "bg-[#e8f8ef] text-[#1a7a4a]" : "bg-[#fdecea] text-[#b3261e]"}`}
                    style={{ fontWeight: 600 }}
                    title="Últimos 7 días vs. los 7 días anteriores"
                  >
                    {variacion >= 0 ? "+" : ""}{variacion.toLocaleString("es-CL")}% vs semana anterior
                  </span>
                )}
              </div>
              {!hayVentas ? (
                <div style={{ height: 220 }}><EmptyState text="Sin ventas registradas en los últimos 30 días." /></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.ventas_diarias} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" vertical={false} />
                    <XAxis
                      dataKey="fecha" tickFormatter={fechaCorta} interval={4}
                      tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false}
                    />
                    <YAxis tickFormatter={clpCorto} tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      labelFormatter={(l) => fechaCorta(String(l))}
                      formatter={(v) => [clp(Number(v)), "Ventas"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#1e2d5a" strokeWidth={2.5} dot={{ r: 3, fill: "#1e2d5a", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3554a5" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
              <h2 className="text-sm font-600 text-[#0d1530] mb-1" style={{ fontWeight: 600 }}>Ventas por método de pago</h2>
              <p className="text-xs text-[#8891b0] mb-3">Últimos 30 días</p>
              {data.metodos_pago.length === 0 ? (
                <div style={{ height: 160 }}><EmptyState text="Sin ventas para mostrar." /></div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data.metodos_pago} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="total" nameKey="metodo" strokeWidth={0}>
                      {data.metodos_pago.map((_, i) => (
                        <Cell key={i} fill={COLORES_PAGO[i % COLORES_PAGO.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [clp(Number(v)), ""]} contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="space-y-1.5 mt-2">
                {data.metodos_pago.map((m, i) => (
                  <div key={m.metodo} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORES_PAGO[i % COLORES_PAGO.length] }} />
                      <span className="text-[#4a5580]">{m.metodo}</span>
                    </div>
                    <span className="font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>{m.porcentaje.toLocaleString("es-CL")}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
            <div className="mb-4">
              <h2 className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Top 10 productos más vendidos</h2>
              <p className="text-xs text-[#8891b0]">Unidades vendidas · últimos 30 días</p>
            </div>
            {data.top_productos.length === 0 ? (
              <div style={{ height: 220 }}><EmptyState text="Aún no hay ventas registradas para mostrar un ranking." /></div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, data.top_productos.length * 32)}>
                <BarChart data={data.top_productos} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="producto" width={230}
                    tickFormatter={(s: string) => (s.length > 34 ? s.slice(0, 33) + "…" : s)}
                    tick={{ fontSize: 11, fill: "#4a5580" }} axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    formatter={(v, _n, item: any) => [`${num(Number(v))} unidades · ${clp(item.payload.total)}`, ""]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }}
                  />
                  <Bar dataKey="unidades" fill="#1e2d5a" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}