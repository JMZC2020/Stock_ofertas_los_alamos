import { useEffect, useState } from "react";
import { subscribeLoading, type LoadingState } from "../auth";

/**
 * Pantalla de carga global con animación orbital multicapa.
 * Se activa automáticamente al iniciar sesión, navegar o ejecutar acciones contra el backend.
 */
export default function LoadingOverlay() {
  const [state, setState] = useState<LoadingState>({ active: false, message: "Cargando…" });

  useEffect(() => {
    return subscribeLoading(setState);
  }, []);

  if (!state.active) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0F2B26]/35 backdrop-blur-xs p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-loader-card relative bg-white/95 border border-[#D3EBE4] shadow-2xl rounded-2xl px-8 py-7 flex flex-col items-center text-center max-w-xs w-full overflow-hidden">
        {/* Spinner orbital multicapa */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-4">
          {/* Halo ambiental suave */}
          <div className="absolute inset-1 rounded-full bg-[#7FF1D2]/20 blur-md animate-pulse-core" />

          {/* Anillo exterior con trazo dinámico (rotación + dash morphing) */}
          <svg className="w-20 h-20 animate-orbit-spin" viewBox="0 0 80 80" fill="none">
            <defs>
              <linearGradient id="alamos-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B6B55" />
                <stop offset="55%" stopColor="#12A582" />
                <stop offset="100%" stopColor="#7FF1D2" />
              </linearGradient>
            </defs>
            {/* Pista base */}
            <circle cx="40" cy="40" r="33" stroke="#E4F5F0" strokeWidth="5" />
            {/* Arco principal animado */}
            <circle
              cx="40"
              cy="40"
              r="33"
              stroke="url(#alamos-orbit-grad)"
              strokeWidth="5"
              strokeLinecap="round"
              className="animate-orbit-dash"
            />
          </svg>

          {/* Anillo interior en contrarrotación */}
          <svg className="absolute w-12 h-12 animate-orbit-reverse" viewBox="0 0 50 50" fill="none">
            <circle
              cx="25"
              cy="25"
              r="19"
              stroke="#7FF1D2"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="36 55"
            />
          </svg>

          {/* Núcleo central pulsante */}
          <div className="absolute w-4 h-4 rounded-full bg-[#0F2B26] shadow-sm flex items-center justify-center animate-pulse-core">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7FF1D2]" />
          </div>
        </div>

        {/* Mensaje contextual de la acción */}
        <p className="text-sm font-700 text-[#0F2B26] tracking-tight" style={{ fontWeight: 700 }}>
          {state.message}
        </p>
        <p className="text-xs text-[#5F7F77] mt-1">
          Oferta de los Álamos
        </p>

        {/* Barra inferior de progreso continuo */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E4F5F0] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#12A582] via-[#7FF1D2] to-[#0B6B55] animate-shimmer-bar" />
        </div>
      </div>
    </div>
  );
}
