import { useState } from "react";

// Datos de ejemplo de Figma removidos — se conectarán a la API real en el Sprint 3/4 (Proveedores)
const PROVEEDORES: { id: number; nombre: string; rut: string; contacto: string; email: string; telefono: string; categoria: string; activo: boolean; ultimoPedido: string }[] = [];

export default function ProveedorPage() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);

  const filtered = PROVEEDORES.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Proveedores</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">{filtered.length} proveedores registrados</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 shadow transition" style={{ fontWeight: 600 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Nuevo proveedor
        </button>
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8891b0]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input type="text" placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#dde2ef] bg-white text-sm text-[#0d1530] focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="text-sm text-[#8891b0] col-span-full py-6 text-center">Aún no hay proveedores registrados.</p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-[#dde2ef] shadow-sm p-5 hover:border-[#3554a5]/30 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#eef1f8] flex items-center justify-center text-[#1e2d5a] font-700 text-sm" style={{ fontWeight: 700 }}>
                  {p.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-600 text-sm text-[#0d1530]" style={{ fontWeight: 600 }}>{p.nombre}</p>
                  <p className="text-xs text-[#8891b0]">{p.categoria}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${p.activo ? "bg-[#e8f8ef] text-[#1a7a4a]" : "bg-[#fde8e6] text-[#c0392b]"}`} style={{ fontWeight: 600 }}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#4a5580]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {p.contacto}
              </div>
              <div className="flex items-center gap-2 text-[#4a5580]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                {p.email}
              </div>
              <div className="flex items-center gap-2 text-[#4a5580]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.9a16 16 0 0 0 6 6l.27-.34a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" /></svg>
                {p.telefono}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#eef1f8] flex items-center justify-between">
              <span className="text-xs text-[#8891b0]">Último pedido: <span className="text-[#4a5580]">{p.ultimoPedido}</span></span>
              <button className="text-xs text-[#3554a5] hover:text-[#1e2d5a] font-500 transition" style={{ fontWeight: 500 }}>Ver detalle →</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dde2ef] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Nuevo proveedor</h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:bg-[#eef1f8] transition">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              {[["Nombre empresa", "text"], ["RUT", "text"], ["Nombre contacto", "text"], ["Correo", "email"], ["Teléfono", "tel"]].map(([label, type]) => (
                <div key={label}>
                  <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                  <input type={type} className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                </div>
              ))}
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
