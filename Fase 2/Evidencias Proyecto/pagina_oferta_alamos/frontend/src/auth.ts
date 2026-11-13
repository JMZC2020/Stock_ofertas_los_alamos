/**
 * Manejo de sesión.
 *
 * - Guarda el token JWT en localStorage.
 * - Envía "Authorization: Bearer <token>" automáticamente en TODAS las peticiones al backend,
 *   así las páginas (Productos, Ventas, etc.) siguen usando fetch() sin cambios.
 * - Si el backend responde 401 (token vencido o inválido), borra la sesión y avisa a la app
 *   para volver al login.
 */
const API_BASE = "http://localhost:8000";
const TOKEN_KEY = "access_token";
export const SESSION_EXPIRED_EVENT = "auth:expired";


const RUTAS_PUBLICAS = ["/usuarios/login", "/usuarios/reset-password/"];

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sin acceso a localStorage */
  }
}

/** True si hay token y todavía no vence (se lee el campo "exp" del JWT; el backend igual lo valida). */
export function haySesionValida(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function cerrarSesion(): void {
  clearToken();
}

let instalado = false;


export function instalarAuthFetch(): void {
  if (instalado) return;
  instalado = true;
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const esDelBackend = url.startsWith(API_BASE);
    const esPublica = RUTAS_PUBLICAS.some((r) => url.startsWith(`${API_BASE}${r}`));

    if (esDelBackend && !esPublica) {
      const token = getToken();
      if (token) {
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${token}`);
        init = { ...init, headers };
      }
    }

    const res = await fetchOriginal(input, init);

    if (esDelBackend && !esPublica && res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return res;
  };
}