import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** Solo vigila mientras el usuario está dentro del sistema. */
  activo: boolean;
  /** Minutos sin actividad antes de cerrar la sesión. */
  minutosInactividad?: number;
  /** Segundos antes del cierre en los que se muestra el aviso con cuenta regresiva. */
  segundosAviso?: number;
  onExpirar: () => void;
}

const EVENTOS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;

/**
 * Cierre de sesión por inactividad (HU-34).
 * - Se considera "actividad" mover el mouse, escribir, hacer clic, desplazarse o tocar la pantalla.
 * - Faltando `segundosAviso` segundos aparece un aviso con cuenta regresiva y el botón "Seguir en el sistema".
 * - Usa la hora real (Date.now) y no un contador, así que funciona bien aunque la pestaña esté en segundo plano
 *   o el computador haya estado suspendido.
 */
export default function AvisoInactividad({ activo, minutosInactividad = 15, segundosAviso = 60, onExpirar }: Props) {
  const ultimaActividad = useRef(Date.now());
  const avisoVisible = useRef(false);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const alExpirar = useRef(onExpirar);
  alExpirar.current = onExpirar;

  const limiteMs = minutosInactividad * 60_000;

  const reiniciar = useCallback(() => {
    ultimaActividad.current = Date.now();
    avisoVisible.current = false;
    setSegundosRestantes(null);
  }, []);

  useEffect(() => {
    if (!activo) return;
    reiniciar();

    
    const alActividad = () => {
      if (!avisoVisible.current) ultimaActividad.current = Date.now();
    };

    const revisar = () => {
      const inactivo = Date.now() - ultimaActividad.current;
      if (inactivo >= limiteMs) {
        avisoVisible.current = false;
        setSegundosRestantes(null);
        alExpirar.current();
        return;
      }
      const falta = limiteMs - inactivo;
      if (falta <= segundosAviso * 1000) {
        avisoVisible.current = true;
        setSegundosRestantes(Math.ceil(falta / 1000));
      }
    };

    EVENTOS.forEach((e) => window.addEventListener(e, alActividad, { passive: true }));
    document.addEventListener("visibilitychange", revisar);
    const id = setInterval(revisar, 1000);
    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, alActividad));
      document.removeEventListener("visibilitychange", revisar);
      clearInterval(id);
    };
  }, [activo, limiteMs, segundosAviso, reiniciar]);

  if (!activo || segundosRestantes === null) return null;

  const mm = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
  const ss = String(segundosRestantes % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="alertdialog" aria-modal="true" aria-labelledby="titulo-inactividad">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D3EBE4] w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#7FF1D2] text-[#0F2B26] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 id="titulo-inactividad" className="text-[#0F2B26] mb-1" style={{ fontWeight: 700 }}>¿Sigues ahí?</h2>
        <p className="text-sm text-[#3E5F57] mb-4">
          Por seguridad, cerraremos tu sesión por inactividad en
        </p>
        <p className="text-4xl text-[#0F2B26] mb-5" style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }} aria-live="polite">
          {mm}:{ss}
        </p>
        <div className="flex gap-3">
          <button onClick={() => alExpirar.current()} className="flex-1 py-3 rounded-xl bg-white text-[#3E5F57] border border-[#D3EBE4] text-sm hover:border-[#12A582] transition" style={{ fontWeight: 600 }}>
            Cerrar sesión
          </button>
          <button onClick={reiniciar} autoFocus className="flex-1 py-3 rounded-xl bg-[#7FF1D2] hover:bg-[#5EE3BE] text-[#0F2B26] text-sm transition" style={{ fontWeight: 700 }}>
            Seguir en el sistema
          </button>
        </div>
      </div>
    </div>
  );
}