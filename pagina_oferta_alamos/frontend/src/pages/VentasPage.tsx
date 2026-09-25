import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// Datos de ejemplo de Figma removidos — se conectarán a la API real en el Sprint 4 (Ventas)
const VENTAS: { id: string; fecha: string; producto: string; cantidad: number; total: number; vendedor: string; metodo: string }[] = [];

const weekData: { day: string; total: number }[] = [];

export default function VentasPage() {
  const [view, setView] = useState<"lista" | "nueva">("lista");
  const [qty, setQty] = useState("");
  const [prod, setProd] = useState("");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Gestión de Ventas</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">Registre y analice las ventas del sistema</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("lista")} className={`px-4 py-2.5 rounded-xl text-sm font-600 transition ${view === "lista" ? "bg-[#1e2d5a] text-white shadow" : "bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5]"}`} style={{ fontWeight: 600 }}>
            Historial
          </button>
          <button onClick={() => setView("nueva")} className={`px-4 py-2.5 rounded-xl text-sm font-600 transition ${view === "nueva" ? "bg-[#1e2d5a] text-white shadow" : "bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5]"}`} style={{ fontWeight: 600 }}>
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ventas hoy", value: "$0", sub: "0 transacciones" },
          { label: "Ventas semana", value: "$0", sub: "Sin datos aún" },
          { label: "Ticket promedio", value: "$0", sub: "por transacción" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-[#dde2ef] shadow-sm">
            <p className="text-xs font-500 text-[#8891b0] uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>{s.label}</p>
            <p className="text-2xl font-800 text-[#0d1530] font-mono" style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            <p className="text-xs text-[#8891b0] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {view === "lista" ? (
        <>
          {/* Chart */}
          <div className="bg-white rounded-xl p-5 border border-[#dde2ef] shadow-sm">
            <h2 className="text-sm font-600 text-[#0d1530] mb-4" style={{ fontWeight: 600 }}>Ventas por día · semana actual</h2>
            {weekData.length === 0 ? (
              <div className="flex items-center justify-center text-sm text-[#8891b0]" style={{ height: 160 }}>
                Sin ventas registradas todavía.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#8891b0" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString("es-CL")}`, "Ventas"]} contentStyle={{ borderRadius: 8, border: "1px solid #dde2ef", fontSize: 12 }} />
                  <Bar dataKey="total" fill="#1e2d5a" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#dde2ef] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#eef1f8]">
              <h2 className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Últimas transacciones</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f7fc] border-b border-[#dde2ef]">
                  {["ID", "Fecha", "Producto", "Cant.", "Total", "Vendedor", "Método"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-600 text-[#8891b0] uppercase tracking-wider" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1f8]">
                {VENTAS.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8891b0]">
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                )}
                {VENTAS.map((v) => (
                  <tr key={v.id} className="hover:bg-[#f5f7fc] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#3554a5] font-600" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{v.id}</td>
                    <td className="px-4 py-3 text-[#8891b0] text-xs">{v.fecha}</td>
                    <td className="px-4 py-3 font-500 text-[#0d1530]" style={{ fontWeight: 500 }}>{v.producto}</td>
                    <td className="px-4 py-3 font-mono text-center text-[#4a5580]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v.cantidad}</td>
                    <td className="px-4 py-3 font-mono font-600 text-[#0d1530]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>${v.total.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 text-[#4a5580]">{v.vendedor}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${v.metodo === "Efectivo" ? "bg-[#e8f8ef] text-[#1a7a4a]" : v.metodo === "Débito" ? "bg-[#f0f4fc] text-[#1e2d5a]" : "bg-[#fdf3e3] text-[#e67e22]"}`} style={{ fontWeight: 600 }}>{v.metodo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-[#dde2ef] shadow-sm p-6 max-w-lg">
          <h2 className="font-700 text-[#0d1530] mb-5" style={{ fontWeight: 700 }}>Registrar nueva venta</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Producto</label>
              <input type="text" placeholder="Buscar producto..." value={prod} onChange={(e) => setProd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Cantidad</label>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Método de pago</label>
                <select className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer">
                  <option>Efectivo</option><option>Débito</option><option>Crédito</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setView("lista")} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm font-600 hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>Cancelar</button>
              <button onClick={() => setView("lista")} className="flex-1 py-3 rounded-xl bg-[#1e2d5a] text-white text-sm font-600 hover:bg-[#152045] transition" style={{ fontWeight: 600 }}>Registrar venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
