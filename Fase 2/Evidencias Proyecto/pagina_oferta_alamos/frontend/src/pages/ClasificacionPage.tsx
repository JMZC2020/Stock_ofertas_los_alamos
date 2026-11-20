import { useEffect, useState } from "react";

const API_BASE = "/api";

type Clase = "A" | "B" | "C";

interface ProductoABC {
  posicion: number;
  producto_id: number;
  nombre: string;
  categoria: string;
  unidades: number;
  ingresos: number;
  porcentaje: number;
  porcentaje_acumulado: number;
  clase: Clase;
}
interface ResumenClase {
  clase: Clase;
  productos: number;
  ingresos: number;
  porcentaje_ingresos: number;
  porcentaje_productos: number;
}
interface Clasificacion {
  parametros: { umbral_a: number; umbral_b: number; dias: number };
  total_ingresos: number;
  total_productos: number;
  resumen: ResumenClase[];
  productos: ProductoABC[];
}

const ESTILO: Record<Clase, { barra: string; badge: string; titulo: string; descripcion: string }> = {
  A: { barra: "#0B5A47", badge: "bg-[#0B5A47] text-white", titulo: "Productos estrella", descripcion: "Los que más venden. Que nunca falten en el almacén." },
  B: { barra: "#0E8F72", badge: "bg-[#0E8F72] text-white", titulo: "Productos importantes", descripcion: "Venden bien. Mantén stock suficiente." },
  C: { barra: "#B5EBDD", badge: "bg-[#D3EBE4] text-[#0B6B55]", titulo: "Productos de apoyo", descripcion: "Venden poco o nada. Revisa si conviene seguir comprándolos." },
};


const NIVELES = [
  { id: "estandar", label: "Estándar (recomendado)", a: 80, b: 95, ayuda: "Lo habitual: los productos estrella son los que generan el 80 % de las ventas." },
  { id: "estricto", label: "Estricto: menos productos estrella", a: 70, b: 90, ayuda: "Solo los que más aportan quedan como estrella (70 % de las ventas)." },
  { id: "amplio", label: "Amplio: más productos estrella", a: 90, b: 98, ayuda: "Más productos entran como estrella (90 % de las ventas)." },
  { id: "personalizado", label: "Personalizado", a: 80, b: 95, ayuda: "Tú eliges los porcentajes." },
] as const;
type NivelId = (typeof NIVELES)[number]["id"];

const PERIODOS = [
  { dias: 30, label: "Últimos 30 días" },
  { dias: 90, label: "Últimos 90 días" },
  { dias: 180, label: "Últimos 6 meses" },
  { dias: 365, label: "Último año" },
  { dias: 0, label: "Todo el historial" },
];

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

export default function ClasificacionPage() {
  const [datos, setDatos] = useState<Clasificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [nivel, setNivel] = useState<NivelId>("estandar");
  const [umbralA, setUmbralA] = useState("80");
  const [umbralB, setUmbralB] = useState("95");
  const [dias, setDias] = useState(90);
  const [filtroClase, setFiltroClase] = useState<"todas" | Clase>("todas");
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = async (a: string, b: string, d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/clasificacion/?umbral_a=${a}&umbral_b=${b}&dias=${d}`);
      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(typeof detalle?.detail === "string" ? detalle.detail : `Error ${res.status} al cargar la clasificación`);
      }
      setDatos(await res.json());
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar("80", "95", 90);
  }, []);

  const cambiarNivel = (id: NivelId) => {
    setNivel(id);
    setErrorForm(null);
    if (id === "personalizado") return; 
    const n = NIVELES.find((x) => x.id === id)!;
    setUmbralA(String(n.a));
    setUmbralB(String(n.b));
    cargar(String(n.a), String(n.b), dias);
  };

  const cambiarPeriodo = (d: number) => {
    setDias(d);
    cargar(umbralA, umbralB, d);
  };

  const aplicarPersonalizado = () => {
    const a = Number(umbralA);
    const b = Number(umbralB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b > 100 || a >= b) {
      setErrorForm("El porcentaje de los productos estrella debe ser menor que el de los importantes, y ninguno puede pasar de 100 (ejemplo: 80 y 95).");
      return;
    }
    setErrorForm(null);
    cargar(String(a), String(b), dias);
  };

  const productos = datos?.productos ?? [];
  const visibles = filtroClase === "todas" ? productos : productos.filter((p) => p.clase === filtroClase);
  const sinVentas = productos.filter((p) => p.ingresos === 0).length;
  const sinDatos = !loading && datos !== null && datos.total_ingresos === 0;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-700 text-[#0F2B26]" style={{ fontWeight: 700 }}>Clasificación ABC</h1>
        <p className="text-sm text-[#5F7F77] mt-0.5">
          Descubre qué productos sostienen tu negocio y cuáles venden poco.
        </p>
      </div>

      {/* Parámetros */}
      <div className="bg-white rounded-xl p-5 border border-[#D3EBE4] shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>¿Qué tan exigente quieres ser?</label>
            <select value={nivel} onChange={(e) => cambiarNivel(e.target.value as NivelId)} disabled={loading}
              className="px-3 py-2 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582] cursor-pointer">
              {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Ventas de qué período</label>
            <select value={dias} onChange={(e) => cambiarPeriodo(Number(e.target.value))} disabled={loading}
              className="px-3 py-2 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582] cursor-pointer">
              {PERIODOS.map((p) => <option key={p.dias} value={p.dias}>{p.label}</option>)}
            </select>
          </div>
          {loading && <span className="text-xs text-[#5F7F77] pb-2.5">Calculando...</span>}
        </div>

        <p className="text-xs text-[#5F7F77] mt-3">{NIVELES.find((n) => n.id === nivel)?.ayuda}</p>

        {nivel === "personalizado" && (
          <div className="mt-4 pt-4 border-t border-[#E4F5F0] flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Los productos estrella (A) suman hasta el… % de las ventas</label>
              <input type="number" min={1} max={99} value={umbralA} onChange={(e) => setUmbralA(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
            </div>
            <div>
              <label className="block text-xs text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Con los importantes (B) llegan hasta el… %</label>
              <input type="number" min={2} max={100} value={umbralB} onChange={(e) => setUmbralB(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
            </div>
            <button onClick={aplicarPersonalizado} disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#7FF1D2] hover:bg-[#5EE3BE] text-[#0F2B26] text-sm shadow transition disabled:opacity-50" style={{ fontWeight: 600 }}>
              Aplicar
            </button>
            <p className="text-xs text-[#5F7F77] w-full">Ejemplo: 80 y 95 significa que A cubre el 80 % de las ventas, B el siguiente 15 % y C el 5 % restante.</p>
          </div>
        )}
        {errorForm && <p className="text-sm text-[#c0392b] mt-3">{errorForm}</p>}
      </div>

      {error && (
        <div className="bg-[#fde8e6] text-[#c0392b] text-sm rounded-xl p-4 border border-[#f5c6c2]">
          {error} — verifica que el backend esté corriendo en {API_BASE}.
        </div>
      )}

      {sinDatos && (
        <div className="bg-[#fdf3e3] text-[#8a5a14] text-sm rounded-xl p-4 border border-[#f3dcb3]">
          No hay ventas en el período elegido, así que todos los productos quedan en clase C. Prueba con un período más largo o importa ventas.
        </div>
      )}

      {datos && (
        <>
          {/* Resumen en una frase */}
          {!sinDatos && datos.resumen[0].productos > 0 && (
            <div className="bg-[#E4F5F0] rounded-xl px-5 py-4 text-sm text-[#0F2B26] leading-relaxed">
              Tus <b>{datos.resumen[0].productos} productos estrella</b> ({datos.resumen[0].porcentaje_productos} % de tu catálogo) generan el{" "}
              <b>{datos.resumen[0].porcentaje_ingresos} % de tus ventas</b>. Priorízalos al reponer stock.
            </div>
          )}

          {/* Resumen por clase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {datos.resumen.map((r) => (
              <button key={r.clase} onClick={() => setFiltroClase(filtroClase === r.clase ? "todas" : r.clase)}
                className={`text-left bg-white rounded-xl p-4 border shadow-sm transition ${filtroClase === r.clase ? "border-[#12A582] ring-1 ring-[#12A582]" : "border-[#D3EBE4] hover:border-[#12A582]"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${ESTILO[r.clase].badge}`} style={{ fontWeight: 700 }}>{r.clase}</span>
                  <span className="text-sm text-[#0F2B26]" style={{ fontWeight: 600 }}>{ESTILO[r.clase].titulo}</span>
                </div>
                <p className="text-2xl text-[#0F2B26]" style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                  {r.productos} <span className="text-sm text-[#5F7F77]" style={{ fontWeight: 500 }}>productos ({r.porcentaje_productos}%)</span>
                </p>
                <p className="text-sm text-[#3E5F57] mt-1">
                  {pesos(r.ingresos)} · <b>{r.porcentaje_ingresos}%</b> de las ventas
                </p>
                <p className="text-xs text-[#5F7F77] mt-1.5">{ESTILO[r.clase].descripcion}</p>
              </button>
            ))}
          </div>

          {/* Comparación visual: pocos productos, muchas ventas */}
          {!sinDatos && (
            <div className="bg-white rounded-xl p-5 border border-[#D3EBE4] shadow-sm space-y-4">
              {[
                { titulo: "Productos", valor: (r: ResumenClase) => r.porcentaje_productos, cantidad: (r: ResumenClase) => `${r.productos}` },
                { titulo: "Ventas", valor: (r: ResumenClase) => r.porcentaje_ingresos, cantidad: (r: ResumenClase) => pesos(r.ingresos) },
              ].map((fila) => (
                <div key={fila.titulo} className="flex items-center gap-4">
                  <span className="w-20 shrink-0 text-sm text-[#0F2B26]" style={{ fontWeight: 600 }}>{fila.titulo}</span>
                  <div className="flex-1 flex h-11 gap-0.5 rounded-lg overflow-hidden">
                    {datos.resumen.map((r) => {
                      const pct = fila.valor(r);
                      if (pct <= 0) return null;
                      return (
                        <div
                          key={r.clase}
                          style={{ width: `${pct}%`, background: ESTILO[r.clase].barra }}
                          title={`${ESTILO[r.clase].titulo}: ${fila.cantidad(r)} (${pct}%)`}
                          className={`flex items-center justify-center text-xs overflow-hidden whitespace-nowrap ${r.clase === "C" ? "text-[#0B6B55]" : "text-white"}`}
                          
                        >
                          {pct >= 9 && <span style={{ fontWeight: 700 }}>{r.clase} · {pct}%</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-[#D3EBE4] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E4F5F0] flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-600 text-[#0F2B26]" style={{ fontWeight: 600 }}>
                Detalle por producto {filtroClase !== "todas" && `· clase ${filtroClase}`}
              </h2>
              <p className="text-xs text-[#5F7F77]">
                {visibles.length} de {datos.total_productos} productos · Total {pesos(datos.total_ingresos)}
                {sinVentas > 0 && ` · ${sinVentas} sin ventas en el período`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F1FAF7] border-b border-[#D3EBE4]">
                    {["#", "Producto", "Categoría", "Unidades", "Ventas ($)", "% de las ventas", "% acumulado", "Grupo"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-600 text-[#5F7F77] uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4F5F0]">
                  {visibles.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#5F7F77]">No hay productos para mostrar.</td></tr>
                  )}
                  {visibles.map((p) => (
                    <tr key={p.producto_id} className="hover:bg-[#F1FAF7] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#5F7F77]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.posicion}</td>
                      <td className="px-4 py-3 text-[#0F2B26]" style={{ fontWeight: 500 }}>{p.nombre}</td>
                      <td className="px-4 py-3 text-[#3E5F57]">{p.categoria}</td>
                      <td className="px-4 py-3 text-[#3E5F57]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.unidades}</td>
                      <td className="px-4 py-3 text-[#0F2B26]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{pesos(p.ingresos)}</td>
                      <td className="px-4 py-3 text-[#3E5F57]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.porcentaje}%</td>
                      <td className="px-4 py-3 text-[#3E5F57]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.porcentaje_acumulado}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs ${ESTILO[p.clase].badge}`} style={{ fontWeight: 700 }}>{p.clase}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
