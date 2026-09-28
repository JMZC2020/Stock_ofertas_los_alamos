import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

// Datos de ejemplo de Figma removidos — se conectarán a la API real en el Sprint 5 (Dashboard)
type KpiCard = { label: string; value: string; sub: string; color: string; textColor: string; subColor: string; alert?: boolean; warn?: boolean };
const kpiCards: KpiCard[] = [];

const salesData: { day: string; ventas: number }[] = [];

const topProducts: { name: string; ventas: number }[] = [];

const categoryData: { name: string; value: number; color: string }[] = [];

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-[#8891b0] text-center px-4">
    {text}
  </div>
);

const formatCLP = (v: number) => `$${(v / 1000).toFixed(0)}K`;

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Dashboard Principal</h1>
        <p className="text-sm text-[#8891b0] mt-0.5">Resumen del sistema · actualizado ahora</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.length === 0 && (
          <div className="col-span-2 lg:col-span-4 bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
            <EmptyState text="Aún no hay datos de inventario ni ventas registrados." />
          </div>
        )}
        {kpiCards.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 shadow-sm border border-[#dde2ef] ${k.color}`}>
            <p className={`text-xs font-500 uppercase tracking-wider mb-2 ${k.alert ? "text-red-200" : k.warn ? "text-orange-200" : k.color === "bg-white" ? "text-[#8891b0]" : "text-[#a8bde8]"}`} style={{ fontWeight: 500 }}>
              {k.label}
            </p>
            <p className={`text-3xl font-800 font-mono leading-none mb-1 ${k.textColor}`} style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
              {k.value}
            </p>
            <p className={`text-xs ${k.subColor}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales trend — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Tendencia de ventas diarias</h2>
              <p className="text-xs text-[#8891b0]">Última semana</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#e8f8ef] text-[#1a7a4a] font-600" style={{ fontWeight: 600 }}>+8.3%</span>
          </div>
          {salesData.length === 0 ? (
            <div style={{ height: 200 }}><EmptyState text="Sin ventas registradas todavía." /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCLP} tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toLocaleString("es-CL")}`, "Ventas"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="ventas" stroke="#1e2d5a" strokeWidth={2.5} dot={{ r: 4, fill: "#1e2d5a", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3554a5" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
          <h2 className="text-sm font-600 text-[#0d1530] mb-1" style={{ fontWeight: 600 }}>Distribución por categoría</h2>
          <p className="text-xs text-[#8891b0] mb-3">% del total de productos</p>
          {categoryData.length === 0 ? (
            <div style={{ height: 160 }}><EmptyState text="Sin productos categorizados aún." /></div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v)}%`, ""]} contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                  <span className="text-[#4a5580]">{c.name}</span>
                </div>
                <span className="font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 products bar chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-[#dde2ef]">
        <div className="mb-4">
          <h2 className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Top 10 productos más vendidos</h2>
          <p className="text-xs text-[#8891b0]">Unidades vendidas · mes actual</p>
        </div>
        {topProducts.length === 0 ? (
          <div style={{ height: 220 }}><EmptyState text="Aún no hay ventas registradas para mostrar un ranking." /></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4a5580" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(v) => [Number(v), "Unidades"]} contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }} />
              <Bar dataKey="ventas" fill="#1e2d5a" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
