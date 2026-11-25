import { useEffect, useRef, useState } from "react";

const API_BASE = "/api";

interface Perfil {
  id: number;
  nombre: string;
  email: string;
  foto: string | null;
}

interface Props {
  onLogout: () => void;
}

/** Primer nombre y primer apellido. Con 4 o más palabras ("Margarita Graciela Leon Mallea") el
 *  primer apellido es la tercera; con 2 o 3 palabras se toma la segunda. */
function nombreYApellido(nombre: string): [string, string] {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return ["", ""];
  const apellido = partes.length >= 4 ? partes[2] : (partes[1] ?? "");
  return [partes[0], apellido];
}

/** "Margarita Graciela Leon Mallea" -> "ML" */
function iniciales(nombre: string, email: string): string {
  const [n, a] = nombreYApellido(nombre);
  if (n && a) return (n[0] + a[0]).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

/** "Margarita Graciela Leon Mallea" -> "Margarita L." */
function nombreCorto(nombre: string): string {
  const [n, a] = nombreYApellido(nombre);
  return a ? `${n} ${a[0].toUpperCase()}.` : n;
}

/** Recorta la imagen al centro (cuadrada), la reduce a 256x256 y la devuelve como JPEG (~20-40 KB). */
function procesarImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const lado = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No se pudo procesar la imagen."));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen. Usa un archivo JPG, PNG o WEBP."));
    };
    img.src = url;
  });
}

function Avatar({ perfil, tam }: { perfil: Perfil | null; tam: string }) {
  if (perfil?.foto) {
    return <img src={perfil.foto} alt="Foto de perfil" className={`${tam} rounded-full object-cover bg-[#0F2B26]`} />;
  }
  return (
    <div className={`${tam} rounded-full bg-[#0F2B26] flex items-center justify-center text-[#7FF1D2]`} style={{ fontWeight: 700, fontSize: "0.75em" }}>
      {perfil ? iniciales(perfil.nombre, perfil.email) : "…"}
    </div>
  );
}

export default function UserMenu({ onLogout }: Props) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editando, setEditando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  
  const [nombre, setNombre] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoCambio, setFotoCambio] = useState(false); 
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/usuarios/me`, {
          headers: { "X-Silent-Fetch": "1" },
        });
        if (!res.ok) throw new Error();
        setPerfil(await res.json());
      } catch {
        setErrorCarga(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!menu) return;
    const alClic = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setMenu(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [menu]);

  const abrirEdicion = () => {
    if (!perfil) return;
    setNombre(perfil.nombre);
    setFoto(perfil.foto);
    setFotoCambio(false);
    setErrorForm(null);
    setMenu(false);
    setEditando(true);
  };

  const elegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      setErrorForm("Usa una imagen JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > 8 * 1024 * 1024) {
      setErrorForm("La imagen es demasiado grande (máx. 8 MB).");
      return;
    }
    try {
      setFoto(await procesarImagen(archivo));
      setFotoCambio(true);
      setErrorForm(null);
    } catch (err: any) {
      setErrorForm(err.message);
    }
  };

  const guardar = async () => {
    if (!perfil) return;
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (limpio.length < 2) {
      setErrorForm("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const cuerpo: Record<string, unknown> = { nombre: limpio };
    if (fotoCambio) {
      if (foto) cuerpo.foto = foto;
      else cuerpo.quitar_foto = true;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      const res = await fetch(`${API_BASE}/usuarios/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(typeof detalle?.detail === "string" ? detalle.detail : "No se pudo guardar el perfil");
      }
      setPerfil(await res.json());
      setEditando(false);
    } catch (err: any) {
      setErrorForm(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  const vistaPrevia: Perfil | null = perfil ? { ...perfil, nombre: nombre || perfil.nombre, foto } : null;

  return (
    <>
      <div className="relative" ref={contenedor}>
        <button
          onClick={() => setMenu(!menu)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[#0F2B26]/10 transition"
          aria-expanded={menu}
          aria-label="Menú de usuario"
        >
          <Avatar perfil={perfil} tam="w-8 h-8 text-sm" />
          <span className="text-[#0F2B26] text-sm hidden sm:block">
            {perfil ? nombreCorto(perfil.nombre) : errorCarga ? "Usuario" : ""}
          </span>
        </button>

        {menu && (
          <div className="absolute right-0 top-11 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-[#D3EBE4] z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E4F5F0]">
              <Avatar perfil={perfil} tam="w-11 h-11 text-base" />
              <div className="min-w-0">
                <p className="text-sm text-[#0F2B26] truncate" style={{ fontWeight: 600 }}>{perfil?.nombre ?? "Usuario"}</p>
                <p className="text-xs text-[#5F7F77] truncate">{perfil?.email ?? ""}</p>
              </div>
            </div>
            <button onClick={abrirEdicion} disabled={!perfil} className="w-full text-left px-4 py-3 text-sm text-[#3E5F57] hover:bg-[#F1FAF7] disabled:opacity-50">
              Editar perfil
            </button>
            <button onClick={() => { setMenu(false); onLogout(); }} className="w-full text-left px-4 py-3 text-sm text-[#c0392b] hover:bg-[#fde8e6] border-t border-[#E4F5F0]">
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D3EBE4] w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#0F2B26]" style={{ fontWeight: 700 }}>Editar perfil</h2>
              <button onClick={() => setEditando(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5F7F77] hover:bg-[#E4F5F0] transition" aria-label="Cerrar">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            {errorForm && <div className="mb-4 text-sm text-[#c0392b] bg-[#fde8e6] rounded-lg px-4 py-2.5">{errorForm}</div>}

            <div className="flex items-center gap-4 mb-5">
              <Avatar perfil={vistaPrevia} tam="w-16 h-16 text-xl" />
              <div className="flex flex-col gap-2">
                <label className="px-3 py-2 rounded-lg text-xs border border-[#D3EBE4] text-[#3E5F57] hover:border-[#12A582] cursor-pointer text-center" style={{ fontWeight: 600 }}>
                  Subir foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} className="hidden" />
                </label>
                {foto && (
                  <button onClick={() => { setFoto(null); setFotoCambio(true); }} className="text-xs text-[#c0392b] hover:underline" style={{ fontWeight: 600 }}>
                    Quitar foto
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#F1FAF7] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582]" />
            </div>
            <div className="mb-5">
              <label className="block text-sm text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>Correo</label>
              <input type="text" value={perfil?.email ?? ""} disabled
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3EBE4] bg-[#E4F5F0] text-sm text-[#5F7F77]" />
              <p className="text-xs text-[#5F7F77] mt-1">El correo no se puede cambiar: se usa para recuperar tu contraseña.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditando(false)} className="flex-1 py-3 rounded-xl bg-[#fde8e6] text-[#c0392b] text-sm hover:bg-[#e74c3c] hover:text-white transition" style={{ fontWeight: 600 }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 py-3 rounded-xl bg-[#7FF1D2] text-[#0F2B26] text-sm hover:bg-[#5EE3BE] transition disabled:opacity-50" style={{ fontWeight: 600 }}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
