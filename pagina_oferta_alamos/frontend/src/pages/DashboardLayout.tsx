import { useState } from "react";
import React from "react";
import DashboardPage from "./DashboardPage";
import ProductosPage from "./ProductosPage";
import VentasPage from "./VentasPage";
import ProveedorPage from "./ProveedorPage";
import AlertasPage from "./AlertasPage";
import ClasificacionPage from "./ClasificacionPage";

type NavItem = "dashboard" | "productos" | "ventas" | "proveedor" | "alertas" | "clasificacion";

interface Props {
  onLogout: () => void;
}

const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "productos",
    label: "Productos",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "proveedor",
    label: "Proveedor",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "alertas",
    label: "Alertas",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: "clasificacion",
    label: "Clasificación",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ onLogout }: Props) {
  const [active, setActive] = useState<NavItem>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const renderPage = () => {
    switch (active) {
      case "dashboard": return <DashboardPage />;
      case "productos": return <ProductosPage />;
      case "ventas": return <VentasPage />;
      case "proveedor": return <ProveedorPage />;
      case "alertas": return <AlertasPage />;
      case "clasificacion": return <ClasificacionPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4fc]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#0d1530] transition-all duration-300 ${sidebarOpen ? "w-56" : "w-16"} shrink-0`}
        style={{ zIndex: 20 }}
      >
        {/* Brand area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-white font-700 text-sm leading-tight truncate" style={{ fontWeight: 700 }}>Oferta de los</div>
              <div className="text-[#a8bde8] text-xs truncate">Alamos</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group relative ${active === item.id
                ? "bg-[#3554a5]/30 text-white"
                : "text-[#a8bde8] hover:bg-white/5 hover:text-white"
                }`}
            >
              {active === item.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-[#4a6bbf]" />
              )}
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="font-500 truncate" style={{ fontWeight: 500 }}>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex gap-3 text-xs text-[#a8bde8]/60">
              <button className="hover:text-[#a8bde8] transition">Contacto</button>
              <span>·</span>
              <button className="hover:text-[#a8bde8] transition">Redes</button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 h-14 bg-[#152045] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a8bde8] hover:text-white hover:bg-white/10 transition"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-white font-600 text-sm" style={{ fontWeight: 600 }}>
              Oferta de los Alamos
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#a8bde8] hover:text-white hover:bg-white/10 transition"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-[#dde2ef] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#eef1f8]">
                    <span className="text-sm font-600 text-[#0d1530]" style={{ fontWeight: 600 }}>Notificaciones</span>
                  </div>
                  {[
                    { msg: "No hay notificaciones", type: "alert" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#f5f7fc] cursor-pointer border-b border-[#eef1f8] last:border-0">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === "alert" ? "bg-[#e74c3c]" : "bg-[#e67e22]"}`} />
                      <span className="text-xs text-[#4a5580]">{n.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#3554a5] flex items-center justify-center text-white text-xs font-700" style={{ fontWeight: 700 }}>
                ML
              </div>
              {sidebarOpen && (
                <span className="text-[#a8bde8] text-sm hidden sm:block">Margarita L.</span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a8bde8] hover:text-[#e74c3c] hover:bg-white/10 transition"
              title="Cerrar sesión"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
