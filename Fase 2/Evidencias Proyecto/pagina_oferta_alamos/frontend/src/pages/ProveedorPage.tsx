import { useState, useEffect } from "react";

const API_BASE = "/api";

interface Proveedor {
  id: number;
  nombre: string;
  rut: string;
  contacto: string;
  email: string;
  telefono: string;
  activo: boolean;
}

type ModalMode = null | "add" | "edit";

function mapFromApi(p: any): Proveedor {
  return {
    id: p.id,
    nombre: p.nombre,
    rut: p.rut ?? "",
    contacto: p.contacto ?? "",
    email: p.email ?? "",
    telefono: p.telefono ?? "",
    activo: p.activo,
  };
}

function mapToApi(form: Partial<Proveedor>) {
  return {
    nombre: form.nombre,
    rut: form.rut || null,
    contacto: form.contacto || null,
    email: form.email || null,
    telefono: form.telefono || null,
  };
}

export default function ProveedorPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<Partial<Proveedor>>({});

  const cargarProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/proveedores/`);
      if (!res.ok) throw new Error(`Error ${res.status} al cargar proveedores`);
      const data = await res.json();
      setProveedores(data.map(mapFromApi));
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const filtered = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.contacto.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({});
    setSelected(null);
    setModal("add");
  };

  const openEdit = (p: Proveedor) => {
    setForm({ ...p });
    setSelected(p);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setForm({});
  };

  const handleSave = async () => {
    if (!form.nombre) {
      alert("El nombre de la empresa es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const payload = mapToApi(form);
      const esEdicion = modal === "edit" && selected;
      const url = esEdicion ? `${API_BASE}/proveedores/${selected!.id}` : `${API_BASE}/proveedores/`;
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

      await cargarProveedores();
      closeModal();
    } catch (err: any) {
      alert(err.message ?? "No se pudo guardar el proveedor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Proveedor) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Si tiene productos asociados, se desactivará en vez de borrarse.`)) return;
    try {
      const res = await fetch(`${API_BASE}/proveedores/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar`);
      const data = await res.json();
      alert(data.mensaje);
      await cargarProveedores();
    } catch (err: any) {
      alert(err.message ?? "No se pudo eliminar el proveedor");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-700 text-[#0F2B26]" style={{ fontWeight: 700 }}>Proveedores</h1>
          <p className="text-xs sm:text-sm text-[#5F7F77] mt-0.5">
            {loading ? "Cargando..." : `${filtered.length} proveedores registrados`}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7FF1D2] hover:bg-[#5EE3BE] text-[#0F2B26] text-sm font-600 shadow transition w-full sm:w-auto" style={{ fontWeight: 600 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Nuevo proveedor
        </button>
      </div>

      {error && (
        <div className="bg-[#fde8e6] text-[#c0392b] text-sm rounded-xl p-4 border border-[#f5c6c2]">
          {error} — verifica que el backend esté corriendo en {API_BASE}.
        </div>
      )}

      <div className="relative w-full sm:max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F7F77]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input type="text" placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#D3EBE4] bg-white text-sm text-[#0F2B26] focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582] shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-[#5F7F77] col-span-full py-6 text-center">
            {proveedores.length === 0 ? "Aún no hay proveedores registrados." : "Ningún proveedor calza con la búsqueda."}
          </p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-[#D3EBE4] shadow-sm p-5 hover:border-[#12A582]/30 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E4F5F0] flex items-center justify-center text-[#0B6B55] font-700 text-sm" style={{ fontWeight: 700 }}>
                  {p.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-600 text-sm text-[#0F2B26]" style={{ fontWeight: 600 }}>{p.nombre}</p>
                  <p className="text-xs text-[#5F7F77]">{p.rut || "Sin RUT"}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-600 ${p.activo ? "bg-[#e8f8ef] text-[#1a7a4a]" : "bg-[#fde8e6] text-[#c0392b]"}`} style={{ fontWeight: 600 }}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#3E5F57]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {p.contacto || "—"}
              </div>
              <div className="flex items-center gap-2 text-[#3E5F57]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                {p.email || "—"}
              </div>
              <div className="flex items-center gap-2 text-[#3E5F57]">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.9a16 16 0 0 0 6 6l.27-.34a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" /></svg>
                {p.telefono || "—"}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E4F5F0] flex items-center justify-between">
              <span className="text-xs text-[#5F7F77]">Historial de compras: próximamente</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(p)} className="text-xs text-[#0B6B55] hover:text-[#0B6B55] font-500 transition" style={{ fontWeight: 500 }}>Editar</button>
                <span className="text-[#D3EBE4]">|</span>
                <button onClick={() => handleDelete(p)} className="text-xs text-[#c0392b] hover:text-[#a93226] font-500 transition" style={{ fontWeight: 500 }}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D3EBE4] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-700 text-[#0F2B26]" style={{ fontWeight: 700 }}>
                {modal === "edit" ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5F7F77] hover:bg-[#E4F5F0] transition">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Nombre empresa</label>
                <input type="text" value={form.nombre ?? ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>RUT</label>
                <input type="text" value={form.rut ?? ""} onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Nombre contacto</label>
                <input type="text" value={form.contacto ?? ""} onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Correo</label>
                <input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
              </div>
              <div>
                <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Teléfono</label>
                <input type="tel" value={form.telefono ?? ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm font-600 hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#7FF1D2] text-[#0F2B26] text-sm font-600 hover:bg-[#5EE3BE] transition disabled:opacity-50" style={{ fontWeight: 600 }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
