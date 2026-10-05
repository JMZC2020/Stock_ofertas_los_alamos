import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

interface Product {
  id: number;
  nombre: string;
  categoria: string;
  proveedor: string;
  proveedorId: number | null;
  stock: number;
  precioCompra: number;
  precio: number; // precio de venta
  estado: "Activo" | "Vence" | "Agotado";
  fechaCaducidad: string;
  ubicacion: string;
}

interface ProveedorOpcion {
  id: number;
  nombre: string;
}

const PAGE_SIZE = 6;

type ModalMode = null | "add" | "edit" | "view";

// Convierte lo que devuelve el backend (nombres en snake_case, tipos Decimal)
// al formato que usa esta pantalla.
function mapFromApi(p: any): Product {
  let estado: Product["estado"] = "Activo";
  if (p.stock_actual === 0) {
    estado = "Agotado";
  } else if (p.fecha_caducidad) {
    const dias = Math.ceil(
      (new Date(p.fecha_caducidad).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (dias <= (p.dias_alerta_vencimiento ?? 7)) estado = "Vence";
  }

  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    proveedor: p.proveedor?.nombre ?? "",
    proveedorId: p.proveedor?.id ?? null,
    stock: p.stock_actual,
    precioCompra: Number(p.precio_compra),
    precio: Number(p.precio_venta),
    estado,
    fechaCaducidad: p.fecha_caducidad ?? "",
    ubicacion: p.ubicacion ?? "",
  };
}

// Convierte el formulario de esta pantalla al formato que espera el backend.
function mapToApi(form: Partial<Product>) {
  return {
    nombre: form.nombre,
    categoria: form.categoria,
    precio_compra: form.precioCompra,
    precio_venta: form.precio,
    stock_actual: form.stock,
    fecha_caducidad: form.fechaCaducidad || null,
    ubicacion: form.ubicacion || null,
    proveedor_id: form.proveedorId || null,
  };
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [proveedorOpciones, setProveedorOpciones] = useState<ProveedorOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [provFilter, setProvFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [importando, setImportando] = useState(false);

  const cargarProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/productos/`);
      if (!res.ok) throw new Error(`Error ${res.status} al cargar productos`);
      const data = await res.json();
      setProducts(data.map(mapFromApi));
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await fetch(`${API_BASE}/proveedores/`);
      if (!res.ok) return; // si falla, el selector simplemente queda vacío
      const data = await res.json();
      setProveedorOpciones(data.map((p: any) => ({ id: p.id, nombre: p.nombre })));
    } catch {
      // silencioso: no bloquea el CRUD de productos si proveedores falla
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarProveedores();
  }, []);

  const categories = [...new Set(products.map((p) => p.categoria))];
  const proveedores = [...new Set(products.map((p) => p.proveedor).filter(Boolean))];

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.nombre.toLowerCase().includes(s) || p.categoria.toLowerCase().includes(s)) &&
      (!catFilter || p.categoria === catFilter) &&
      (!provFilter || p.proveedor === provFilter)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm({});
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

  const closeModal = () => {
    setModal(null);
    setForm({});
  };

  const handleSave = async () => {
    if (!form.nombre || !form.categoria || form.precioCompra == null || form.precio == null) {
      alert("Nombre, categoría, precio de compra y precio de venta son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload = mapToApi(form);
      const esEdicion = modal === "edit" && selected;
      const url = esEdicion ? `${API_BASE}/productos/${selected!.id}` : `${API_BASE}/productos/`;
      const method = esEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? `Error ${res.status} al guardar`);
      }

      await cargarProductos();
      closeModal();
    } catch (err: any) {
      alert(err.message ?? "No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setImportando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const res = await fetch(`${API_BASE}/productos/importar-excel`, {
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
        `Productos importados: ${resumen.productos_importados}`,
        `Omitidos (duplicados): ${resumen.productos_omitidos}`,
        resumen.errores.length > 0
          ? `\nDetalle (${resumen.errores.length}):\n` + resumen.errores.slice(0, 10).join("\n") +
            (resumen.errores.length > 10 ? `\n... y ${resumen.errores.length - 10} más` : "")
          : "",
      ].join("\n");
      alert(mensaje);

      await cargarProductos();
    } catch (err: any) {
      alert(err.message ?? "No se pudo importar el archivo");
    } finally {
      setImportando(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Si tiene ventas asociadas, se desactivará en vez de borrarse.`)) return;
    try {
      const res = await fetch(`${API_BASE}/productos/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar`);
      const data = await res.json();
      alert(data.mensaje);
      await cargarProductos();
    } catch (err: any) {
      alert(err.message ?? "No se pudo eliminar el producto");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Listado de Productos</h1>
          <p className="text-sm text-[#8891b0] mt-0.5">
            {loading ? "Cargando..." : `${filtered.length} productos encontrados`}
          </p>
        </div>
        <div className="flex gap-2">
          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#4a5580] border border-[#dde2ef] hover:border-[#3554a5] text-sm font-600 transition cursor-pointer ${importando ? "opacity-50 pointer-events-none" : ""}`} style={{ fontWeight: 600 }}>
            {importando ? "Importando..." : "Importar Excel (POS)"}
            <input type="file" accept=".xlsx,.xls" onChange={handleImportarExcel} disabled={importando} className="hidden" />
          </label>
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
      </div>

      {error && (
        <div className="bg-[#fde8e6] text-[#c0392b] text-sm rounded-xl p-4 border border-[#f5c6c2]">
          {error} — verifica que el backend esté corriendo en {API_BASE}.
        </div>
      )}

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
            <tr className="bg-[#f5f7fc] text-left text-xs text-[#8891b0] uppercase tracking-wider">
              <th className="px-4 py-3 font-600" style={{ fontWeight: 600 }}>Nombre</th>
              <th className="px-4 py-3 font-600" style={{ fontWeight: 600 }}>Categoría</th>
              <th className="px-4 py-3 font-600" style={{ fontWeight: 600 }}>Proveedor</th>
              <th className="px-4 py-3 font-600 text-right" style={{ fontWeight: 600 }}>Stock</th>
              <th className="px-4 py-3 font-600 text-right" style={{ fontWeight: 600 }}>Precio</th>
              <th className="px-4 py-3 font-600" style={{ fontWeight: 600 }}>Estado</th>
              <th className="px-4 py-3 font-600 text-right" style={{ fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef1f8]">
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8891b0]">
                  {products.length === 0
                    ? 'Aún no hay productos registrados. Usa "Agregar producto" para comenzar.'
                    : "No hay productos que calcen con la búsqueda/filtros."}
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.id} className="hover:bg-[#f9fafd]">
                <td className="px-4 py-3 font-500 text-[#0d1530]" style={{ fontWeight: 500 }}>{p.nombre}</td>
                <td className="px-4 py-3 text-[#4a5580]">{p.categoria}</td>
                <td className="px-4 py-3 text-[#4a5580]">{p.proveedor || "—"}</td>
                <td className="px-4 py-3 text-right">{stockBadge(p.stock)}</td>
                <td className="px-4 py-3 text-right text-[#0d1530]">${p.precio.toLocaleString("es-CL")}</td>
                <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openView(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:text-[#1e2d5a] hover:bg-[#eef1f8] transition" title="Ver detalle">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:text-[#3554a5] hover:bg-[#eef1f8] transition" title="Editar">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8891b0] hover:text-[#c0392b] hover:bg-[#fde8e6] transition" title="Eliminar">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
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
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
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
                  ["Proveedor", selected.proveedor || "Sin asignar"],
                  ["Stock actual", selected.stock],
                  ["Precio compra", `$${selected.precioCompra.toLocaleString("es-CL")}`],
                  ["Precio venta", `$${selected.precio.toLocaleString("es-CL")}`],
                  ["Estado", selected.estado],
                  ["Fecha caducidad", selected.fechaCaducidad || "—"],
                  ["Ubicación", selected.ubicacion || "—"],
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Precio de compra</label>
                    <input type="number" value={form.precioCompra ?? ""} onChange={(e) => setForm({ ...form, precioCompra: +e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                  </div>
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Precio venta</label>
                    <input type="number" value={form.precio ?? ""} onChange={(e) => setForm({ ...form, precio: +e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
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
                    <input type="text" value={form.categoria ?? ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      list="categorias-existentes"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5]" />
                    <datalist id="categorias-existentes">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>Proveedor</label>
                    <select
                      value={form.proveedorId ?? ""}
                      onChange={(e) => setForm({ ...form, proveedorId: e.target.value ? +e.target.value : null })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#dde2ef] bg-[#f5f7fc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] cursor-pointer"
                    >
                      <option value="">Sin asignar</option>
                      {proveedorOpciones.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
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
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white text-sm font-600 transition disabled:opacity-50" style={{ fontWeight: 600 }}>
                    {saving ? "Guardando..." : "Guardar producto"}
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