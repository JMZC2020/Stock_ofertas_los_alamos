import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE = "http://localhost:8000";

interface Venta {
  id: number;
  fecha: string; // ISO
  productoId: number;
  producto: string;
  cantidad: number;
  total: number;
  metodo: string;
  anulada: boolean;
}

interface ProductoOpcion {
  id: number;
  nombre: string;
  stock: number;
  precioVenta: number;
}

// Convierte lo que devuelve el backend (snake_case, Decimal) al formato de esta pantalla.
function mapFromApi(v: any): Venta {
  return {
    id: v.id,
    fecha: v.fecha,
    productoId: v.producto_id,
    producto: v.producto?.nombre ?? `Producto #${v.producto_id}`,
    cantidad: v.cantidad,
    total: Number(v.total),
    metodo: v.metodo_pago ?? "—",
    anulada: v.anulada,
  };
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<"lista" | "nueva">("lista");
  const [productoId, setProductoId] = useState<string>("");
  const [cantidad, setCantidad] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [importando, setImportando] = useState(false);

  const cargarVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ventas/?solo_vigentes=false`);
      if (!res.ok) throw new Error(`Error ${res.status} al cargar ventas`);
      const data = await res.json();
      setVentas(data.map(mapFromApi));
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_BASE}/productos/`);
      if (!res.ok) return;
      const data = await res.json();
      setProductos(
        data.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          stock: p.stock_actual,
          precioVenta: Number(p.precio_venta),
        }))
      );
    } catch {
      // silencioso: no bloquea el historial de ventas si productos falla
    }
  };

  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, []);

  const vigentes = ventas.filter((v) => !v.anulada);

  const hoy = new Date();
  const esMismoDia = (iso: string, ref: Date) => {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
  };

  const ventasHoy = vigentes.filter((v) => esMismoDia(v.fecha, hoy));
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);

  // Últimos 7 días (incluyendo hoy), para el gráfico y el total semanal.
  const dias7: { fecha: Date; label: string }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - (6 - i));
    return { fecha: d, label: DIAS[d.getDay()] };
  });

  const weekData = dias7.map(({ fecha, label }) => {
    const total = vigentes.filter((v) => esMismoDia(v.fecha, fecha)).reduce((acc, v) => acc + v.total, 0);
    return { day: label, total };
  });

  const totalSemana = weekData.reduce((acc, d) => acc + d.total, 0);
  const ventasSemanaCount = vigentes.filter((v) => dias7.some(({ fecha }) => esMismoDia(v.fecha, fecha))).length;
  const ticketPromedio = ventasSemanaCount > 0 ? totalSemana / ventasSemanaCount : 0;

  const ultimasVentas = [...ventas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 15);

  const productoSeleccionado = productos.find((p) => p.id === +productoId);

  const resetForm = () => {
    setProductoId("");
    setCantidad("");
    setMetodo("Efectivo");
  };

  const handleRegistrar = async () => {
    if (!productoId || !cantidad || +cantidad <= 0) {
      alert("Selecciona un producto e indica una cantidad válida.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/ventas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: +productoId,
          cantidad: +cantidad,
          fecha: new Date().toISOString(),
          metodo_pago: metodo,
        }),
      });

      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? `Error ${res.status} al registrar la venta`);
      }

      await cargarVentas();
      await cargarProductos(); // el stock cambió
      resetForm();
      setView("lista");
    } catch (err: any) {
      alert(err.message ?? "No se pudo registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!archivo) return;

    setImportando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const res = await fetch(`${API_BASE}/ventas/importar-excel`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? `Error ${res.status} al importar`);
      }

      const resumen = await res.json();
      const mensaje = [
        `Filas procesadas: ${resumen.filas_procesadas}`,
        `Ventas importadas: ${resumen.ventas_importadas}`,
        resumen.errores.length > 0
          ? `\nErrores (${resumen.errores.length}):\n` + resumen.errores.slice(0, 10).join("\n") +
            (resumen.errores.length > 10 ? `\n... y ${resumen.errores.length - 10} más` : "")
          : "Sin errores.",
      ].join("\n");
      alert(mensaje);

      await cargarVentas();
      await cargarProductos();
    } catch (err: any) {
      alert(err.message ?? "No se pudo importar el archivo");
    } finally {
      setImportando(false);
    }
  };

  const handleAnular = async (v: Venta) => {
    if (!confirm(`¿Anular la venta #${v.id} de "${v.producto}"? El stock se restituirá automáticamente.`)) return;
    try {
      const res = await fetch(`${API_BASE}/ventas/${v.id}/anular`, { method: "PUT" });
      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? `Error ${res.status} al anular`);
      }
      await cargarVentas();
      await cargarProductos();
    } catch (err: any) {
      alert(err.message ?? "No se pudo anular la venta");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Gestión de Ventas</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">
            {loading ? "Cargando..." : "Registre y analice las ventas del sistema"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("lista")} className={`px-4 py-2.5 rounded-xl text-sm font-600 transition ${view === "lista" ? "bg-[#1e2d5a] text-white shadow" : "bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5]"}`} style={{ fontWeight: 600 }}>
            Historial
          </button>
          <button onClick={() => setView("nueva")} className={`px-4 py-2.5 rounded-xl text-sm font-600 transition ${view === "nueva" ? "bg-[#1e2d5a] text-white shadow" : "bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5]"}`} style={{ fontWeight: 600 }}>
            + Nueva venta
          </button>
          <label className={`px-4 py-2.5 rounded-xl text-sm font-600 transition bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5] cursor-pointer ${importando ? "opacity-50 pointer-events-none" : ""}`} style={{ fontWeight: 600 }}>
            {importando ? "Importando..." : "Importar Excel"}
            <input type="file" accept=".xlsx,.xls" onChange={handleImportarExcel} disabled={importando} className="hidden" />
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-[#fde8e6] text-[#c0392b] text-sm rounded-xl p-4 border border-[#f5c6c2]">
          {error} — verifica que el backend esté corriendo en {API_BASE}.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ventas hoy", value: `$${totalHoy.toLocaleString("es-CL")}`, sub: `${ventasHoy.length} transacciones` },
          { label: "Ventas semana", value: `$${totalSemana.toLocaleString("es-CL")}`, sub: `${ventasSemanaCount} transacciones` },
          { label: "Ticket promedio", value: `$${Math.round(ticketPromedio).toLocaleString("es-CL")}`, sub: "por transacción" },
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
            <h2 className="text-sm font-600 text-[#0d1530] mb-4" style={{ fontWeight: 600 }}>Ventas por día · últimos 7 días</h2>
            {totalSemana === 0 ? (
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
                  {["ID", "Fecha", "Producto", "Cant.", "Total", "Método", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-600 text-[#8891b0] uppercase tracking-wider" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1f8]">
                {!loading && ultimasVentas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#8891b0]">
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                )}
                {ultimasVentas.map((v) => (
                  <tr key={v.id} className={`hover:bg-[#f5f7fc] transition-colors ${v.anulada ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#3554a5] font-600" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{v.id}</td>
                    <td className="px-4 py-3 text-[#8891b0] text-xs">{new Date(v.fecha).toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 font-500 text-[#0d1530]" style={{ fontWeight: 500 }}>{v.producto}</td>
                    <td className="px-4 py-3 font-mono text-center text-[#4a5580]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v.cantidad}</td>
                    <td className="px-4 py-3 font-mono font-600 text-[#0d1530]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>${v.total.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${v.metodo === "Efectivo" ? "bg-[#e8f8ef] text-[#1a7a4a]" : v.metodo === "Débito" ? "bg-[#f0f4fc] text-[#1e2d5a]" : "bg-[#fdf3e3] text-[#e67e22]"}`} style={{ fontWeight: 600 }}>{v.metodo}</span>
                    </td>
                    <td className="px-4 py-3">
                      {v.anulada ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-600 bg-[#fde8e6] text-[#c0392b]" style={{ fontWeight: 600 }}>Anulada</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-600 bg-[#e8f8ef] text-[#1a7a4a]" style={{ fontWeight: 600 }}>Vigente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!v.anulada && (
                        <button onClick={() => handleAnular(v)} className="text-xs font-600 text-[#c0392b] hover:underline" style={{ fontWeight: 600 }}>
                          Anular
                        </button>
                      )}
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
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer"
              >
                <option value="">Selecciona un producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (stock: {p.stock})
                  </option>
                ))}
              </select>
              {productoSeleccionado && (
                <p className="text-xs text-[#8891b0] mt-1.5">
                  Precio de venta: ${productoSeleccionado.precioVenta.toLocaleString("es-CL")} · Stock disponible: {productoSeleccionado.stock}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Cantidad</label>
                <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} min="1"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Método de pago</label>
                <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer">
                  <option>Efectivo</option><option>Débito</option><option>Crédito</option>
                </select>
              </div>
            </div>
            {productoSeleccionado && +cantidad > 0 && (
              <p className="text-sm text-[#4a5580]">
                Total: <span className="font-600" style={{ fontWeight: 600 }}>${(productoSeleccionado.precioVenta * +cantidad).toLocaleString("es-CL")}</span>
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { resetForm(); setView("lista"); }} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm font-600 hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={handleRegistrar} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 transition disabled:opacity-50" style={{ fontWeight: 600 }}>
                {saving ? "Registrando..." : "Registrar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}