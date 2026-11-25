/**
 * Manejo de sesión y estado global de carga.
 *
 * - Guarda el token JWT en localStorage.
 * - Envía "Authorization: Bearer <token>" automáticamente en TODAS las peticiones al backend,
 *   así las páginas (Productos, Ventas, etc.) siguen usando fetch() sin cambios.
 * - Activa automáticamente la pantalla de carga con un mensaje contextual en cada acción
 *   (excepto las consultas silenciosas en segundo plano que envían "X-Silent-Fetch: 1").
 * - Si el backend responde 401 (token vencido o inválido), borra la sesión y avisa a la app
 *   para volver al login.
 */
const API_BASE = "/api";
const TOKEN_KEY = "access_token";
export const SESSION_EXPIRED_EVENT = "auth:expired";
export const SILENT_HEADER = "X-Silent-Fetch";

const RUTAS_PUBLICAS = ["/usuarios/login", "/usuarios/reset-password/"];

export interface LoadingState {
  active: boolean;
  message: string;
}

type LoadingListener = (state: LoadingState) => void;

const listeners = new Set<LoadingListener>();
let activeRequests = 0;
let currentMessage = "Cargando…";
let shownAt = 0;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
const MIN_DISPLAY_MS = 320;

function notifyListeners(active: boolean, message = currentMessage) {
  const state: LoadingState = { active, message };
  listeners.forEach((fn) => fn(state));
}

export function subscribeLoading(listener: LoadingListener): () => void {
  listeners.add(listener);
  listener({ active: activeRequests > 0, message: currentMessage });
  return () => {
    listeners.delete(listener);
  };
}

function startLoading(message: string) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  if (activeRequests === 0) {
    shownAt = Date.now();
    currentMessage = message;
  } else if (message && !message.startsWith("Cargando")) {
    // Priorizar mensajes de acciones específicas sobre cargas genéricas
    currentMessage = message;
  }
  activeRequests += 1;
  notifyListeners(true, currentMessage);
}

function stopLoading() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests > 0) return;

  const elapsed = Date.now() - shownAt;
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

  if (remaining === 0) {
    notifyListeners(false);
  } else {
    hideTimeout = setTimeout(() => {
      hideTimeout = null;
      if (activeRequests === 0) {
        notifyListeners(false);
      }
    }, remaining);
  }
}

/** Permite disparar la animación de carga en transiciones de interfaz (ej. cambio de módulo o cierre de sesión). */
export function triggerLoading(message = "Cargando…", durationMs = 300): void {
  startLoading(message);
  setTimeout(() => {
    stopLoading();
  }, durationMs);
}

function resolverMensajeCarga(url: string, method: string): string {
  const m = method.toUpperCase();
  if (url.includes("/usuarios/login")) return "Iniciando sesión…";
  if (url.includes("/usuarios/reset-password/solicitar")) return "Enviando enlace de recuperación…";
  if (url.includes("/usuarios/reset-password/confirmar")) return "Actualizando contraseña…";
  if (url.includes("/usuarios/me")) return m === "PUT" ? "Guardando perfil…" : "Cargando perfil…";
  if (url.includes("/productos/importar-excel")) return "Importando catálogo desde Excel…";
  if (url.includes("/productos")) {
    if (m === "POST") return "Registrando producto…";
    if (m === "PUT") return "Guardando cambios del producto…";
    if (m === "DELETE") return "Eliminando producto…";
    return "Cargando inventario…";
  }
  if (url.includes("/ventas/importar-excel")) return "Importando cierre de caja…";
  if (url.includes("/ventas")) {
    if (m === "POST") return "Registrando venta…";
    if (m === "PUT") return "Anulando venta…";
    if (m === "DELETE") return "Actualizando historial de ventas…";
    return "Cargando historial de ventas…";
  }
  if (url.includes("/proveedores")) {
    if (m === "POST" || m === "PUT") return "Guardando proveedor…";
    if (m === "DELETE") return "Eliminando proveedor…";
    return "Cargando proveedores…";
  }
  if (url.includes("/clasificacion")) return "Calculando clasificación ABC…";
  if (url.includes("/alertas")) return "Verificando alertas de stock…";
  if (url.includes("/dashboard")) return "Cargando panel principal…";
  return "Procesando…";
}

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

    const headers = new Headers(init?.headers);
    const esSilenciosa = headers.get(SILENT_HEADER) === "1";
    if (esSilenciosa) {
      headers.delete(SILENT_HEADER);
    }

    if (esDelBackend && !esPublica) {
      const token = getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const finalInit: RequestInit = { ...init, headers };
    const method = finalInit.method ?? "GET";

    if (esDelBackend && !esSilenciosa) {
      startLoading(resolverMensajeCarga(url, method));
    }

    try {
      const res = await fetchOriginal(input, finalInit);

      if (esDelBackend && !esPublica && res.status === 401) {
        clearToken();
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      return res;
    } finally {
      if (esDelBackend && !esSilenciosa) {
        stopLoading();
      }
    }
  };
}
