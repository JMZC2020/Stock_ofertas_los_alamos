import { useState } from "react";

// Datos de ejemplo de Figma removidos — se conectarán a la API real más adelante
const CATEGORIAS: { id: number; nombre: string; productos: number; descripcion: string; color: string }[] = [];

export default function ClasificacionPage() {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<typeof CATEGORIAS[0] | null>(null);

  const openEdit = (c: typeof CATEGORIAS[0]) => {
    setEditItem(c);
    setModal(true);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Clasificación</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">Administre las categorías de productos</p>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 shadow transition" style={{ fontWeight: 600 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Nueva categoría
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-xl p-5 border border-[#dde2ef] shadow-sm">
        <p className="text-xs font-500 text-[#8891b0] uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>Distribución de productos por categoría</p>
        <div className="flex h-6 rounded-full overflow-hidden gap-px">
          {CATEGORIAS.map((c) => {
            const total = CATEGORIAS.reduce((s, x) => s + x.productos, 0);
            const pct = (c.productos / total) * 100;
            return (
              <div key={c.id} style={{ width: `${pct}%`, background: c.color }} title={`${c.nombre}: ${c.productos}`} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {CATEGORIAS.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 text-xs text-[#4a5580]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
              {c.nombre}
            </div>
          ))}
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CATEGORIAS.length === 0 && (
          <p className="text-sm text-[#8891b0] col-span-full py-6 text-center">Aún no hay categorías registradas.</p>
        )}
        {CATEGORIAS.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-[#dde2ef] shadow-sm p-5 hover:border-[#3554a5]/30 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-700" style={{ background: c.color, fontWeight: 700 }}>
                {c.nombre.slice(0, 2)}
              </div>
              <div>
                <p className="font-600 text-[#0d1530] text-sm" style={{ fontWeight: 600 }}>{c.nombre}</p>
                <p className="text-xs text-[#8891b0]">{c.productos} productos</p>
              </div>
            </div>
            <p className="text-xs text-[#4a5580] leading-relaxed mb-4">{c.descripcion}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="flex-1 py-2 rounded-lg text-xs font-600 border border-[#dde2ef] text-[#4a5580] hover:text-[#1e2d5a] hover:border-[#1e2d5a] transition" style={{ fontWeight: 600 }}>
                Editar
              </button>
              <button className="w-9 h-8 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#c0392b] hover:bg-[#fde8e6] border border-[#dde2ef] hover:border-[#e74c3c]/30 transition">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dde2ef] w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>{editItem ? "Editar categoría" : "Nueva categoría"}</h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:bg-[#eef1f8] transition">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Nombre</label>
                <input type="text" defaultValue={editItem?.nombre} className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Descripción</label>
                <textarea defaultValue={editItem?.descripcion} rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm font-600 hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>Cancelar</button>
                <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl bg-[#1e2d5a] text-white text-sm font-600 hover:bg-[#152045] transition" style={{ fontWeight: 600 }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
