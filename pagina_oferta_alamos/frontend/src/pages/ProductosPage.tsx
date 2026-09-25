import { useState } from "react";

interface Product {
  id: number;
  nombre: string;
  categoria: string;
  proveedor: string;
  stock: number;
  precio: number;
  estado: "Activo" | "Vence" | "Agotado";
  fechaCaducidad: string;
  ubicacion: string;
}

// Datos de ejemplo de Figma removidos — se conectarán a la API real en el Sprint 3 (Productos)
const PRODUCTS: Product[] = [];

const PAGE_SIZE = 6;

type ModalMode = null | "add" | "edit" | "view";

const estadoBadge = (estado: Product["estado"]) => {
  if (estado === "Activo") return <span className="px-2 py-0.5 rounded-full text-xs font-600 bg-[#e8f8ef] text-[#1a7a4a]" style={{ fontWeight: 600 }}>Activo</span>;
  if (estado === "Vence") return <span className="px-2 py-0.5 rounded-full text-xs font-600 bg-[#fdf3e3] text-[#e67e22]" style={{ fontWeight: 600 }}>Por vencer</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-600 bg-[#fde8e6] text-[#c0392b]" style={{ fontWeight: 600 }}>Agotado</span>;
};

const stockBadge = (stock: number) => {
  if (stock === 0) return <span className="font-mono font-600 text-[#c0392b]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{stock}</span>;
  if (stock <= 5) return <span className="font-mono font-600 text-[#e67e22]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{stock}</span>;
  return <span className="font-mono font-600 text-[#0d1530]" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{stock}</span>;
};

export default function ProductosPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [provFilter, setProvFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  const categories = [...new Set(PRODUCTS.map((p) => p.categoria))];
  const proveedores = [...new Set(PRODUCTS.map((p) => p.proveedor))];

  const filtered = PRODUCTS.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.nombre.toLowerCase().includes(s) || p.categoria.toLowerCase().includes(s)) &&
      (!catFilter || p.categoria === catFilter) &&
      (!provFilter || p.proveedor === provFilter)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm({ estado: "Activo" });
    setSelected(null);
    setModal("add");
  };

  const openEdit = (p: Product) => {
    setForm({ ...p });
    setSelected(p);
    setModal("edit");
  };

  const openView = (p: Product) => {
    setSelected(p);
    setModal("view");
  };

  const closeModal = () => setModal(null);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Listado de Productos</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">{filtered.length} productos encontrados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 shadow transition"
          style={{ fontWeight: 600 }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Agregar producto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-[#dde2ef] shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8891b0]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm text-[#0d1530] focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8891b0] hover:text-[#4a5580]">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer"
          >
            <option value="">Categoría</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={provFilter}
            onChange={(e) => { setProvFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer"
          >
            <option value="">Proveedor</option>
            {proveedores.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#dde2ef] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f5f7fc] border-b border-[#dde2ef]">
              {["Nombre", "Categoría", "Proveedor", "Stock", "Precio", "Estado", "Acciones"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-600 text-[#8891b0] uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef1f8]">
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8891b0]">
                  Aún no hay productos registrados. Usa "Agregar producto" para comenzar.
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.id} className="hover:bg-[#f5f7fc] transition-colors group">
                <td className="px-4 py-3.5 font-500 text-[#0d1530]" style={{ fontWeight: 500 }}>{p.nombre}</td>
                <td className="px-4 py-3.5 text-[#4a5580]">{p.categoria}</td>
                <td className="px-4 py-3.5 text-[#4a5580]">{p.proveedor}</td>
                <td className="px-4 py-3.5">{stockBadge(p.stock)}</td>
                <td className="px-4 py-3.5 font-mono font-500 text-[#0d1530]" style={{ fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                  ${p.precio.toLocaleString("es-CL")}
                </td>
                <td className="px-4 py-3.5">{estadoBadge(p.estado)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openView(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#1e2d5a] hover:bg-[#eef1f8] transition">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#3554a5] hover:bg-[#eef1f8] transition">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#c0392b] hover:bg-[#fde8e6] transition">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#eef1f8]">
          <span className="text-xs text-[#8891b0]">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#1e2d5a] hover:bg-[#eef1f8] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" strokeLinecap="round" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-600 transition ${n === page ? "bg-[#1e2d5a] text-white" : "text-[#4a5580] hover:bg-[#eef1f8]"}`}
                style={{ fontWeight: 600 }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a5580] hover:text-[#1e2d5a] hover:bg-[#eef1f8] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dde2ef] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef1f8]">
              <h2 className="font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>
                {modal === "view" ? "Detalle del producto" : modal === "edit" ? "Editar producto" : "Registrar producto"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:text-[#0d1530] hover:bg-[#eef1f8] transition">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            {modal === "view" && selected ? (
              <div className="px-6 py-5 space-y-3">
                {[
                  ["Nombre", selected.nombre],
                  ["Categoría", selected.categoria],
                  ["Proveedor", selected.proveedor],
                  ["Stock actual", selected.stock],
                  ["Precio venta", `$${selected.precio.toLocaleString("es-CL")}`],
                  ["Estado", selected.estado],
                  ["Fecha caducidad", selected.fechaCaducidad],
                  ["Ubicación", selected.ubicacion],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-2.5 border-b border-[#eef1f8] last:border-0">
                    <span className="text-sm text-[#8891b0]">{label}</span>
                    <span className="text-sm font-500 text-[#0d1530]" style={{ fontWeight: 500 }}>{String(val)}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <button onClick={closeModal} className="w-full py-3 rounded-xl bg-[#f5f7fc] text-[#4a5580] text-sm font-600 hover:bg-[#eef1f8] transition" style={{ fontWeight: 600 }}>
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Nombre</label>
                  <input
                    type="text"
                    value={form.nombre ?? ""}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm text-[#0d1530] focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]"
                    disabled={modal === "view"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Precio de compra</label>
                    <input type="number" value={form.precio ?? ""} onChange={(e) => setForm({ ...form, precio: +e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                  </div>
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Precio venta</label>
                    <input type="number" className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Stock inicial</label>
                    <input type="number" value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: +e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                  </div>
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Categoría</label>
                    <select value={form.categoria ?? ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer">
                      <option value="">Seleccionar...</option>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Proveedor</label>
                    <select value={form.proveedor ?? ""} onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer">
                      <option value="">Seleccionar...</option>
                      {proveedores.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Fecha caducidad</label>
                    <input type="date" value={form.fechaCaducidad ?? ""} onChange={(e) => setForm({ ...form, fechaCaducidad: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Ubicación en el almacén</label>
                  <input type="text" value={form.ubicacion ?? ""} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm font-600 hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>
                    Cancelar
                  </button>
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 transition" style={{ fontWeight: 600 }}>
                    Guardar producto
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
