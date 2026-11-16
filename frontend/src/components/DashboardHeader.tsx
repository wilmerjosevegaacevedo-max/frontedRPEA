"use client";

import type { User } from "firebase/auth";
import { RolUsuario, ROLES_CONFIG } from "../types";

export type SeccionNavegacion =
  | "centro-de-control"
  | "carga-masiva"
  | "pago-unico"
  | "empresas-reglas"
  | "auditoria-roles";

type DashboardHeaderProps = {
  user: User;
  rolUsuario: RolUsuario;
  empresaAsignada?: string;
  nombrePerfil?: string;
  seccionActiva: SeccionNavegacion;
  onCambiarSeccion: (seccion: SeccionNavegacion) => void;
  onSignOut: () => void;
};

function iniciales(user: User): string {
  const fuente = user.displayName ?? user.email ?? "?";
  const partes = fuente.split(/[\s@.]+/).filter(Boolean);
  return partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "?";
}

export function DashboardHeader({
  user,
  rolUsuario,
  empresaAsignada,
  nombrePerfil,
  seccionActiva,
  onCambiarSeccion,
  onSignOut,
}: DashboardHeaderProps) {
  const roleCfg = ROLES_CONFIG[rolUsuario];

  // Configuración de pestañas permitidas según RBAC
  const opcionesNavegacion: { id: SeccionNavegacion; label: string; icon: string; roles: RolUsuario[] }[] = [
    {
      id: "centro-de-control",
      label: "Centro de Control",
      icon: "dashboard",
      roles: ["ADMIN", "SUPERVISOR", "ANALISTA"],
    },
    {
      id: "carga-masiva",
      label: "Carga Masiva",
      icon: "cloud_upload",
      roles: ["ADMIN", "ANALISTA"],
    },
    {
      id: "pago-unico",
      label: "Descuento Individual",
      icon: "payments",
      roles: ["ADMIN", "ANALISTA"],
    },
    {
      id: "empresas-reglas",
      label: "Empresas & Reglas",
      icon: "domain",
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      id: "auditoria-roles",
      label: "Auditoría & Roles",
      icon: "admin_panel_settings",
      roles: ["ADMIN", "SUPERVISOR"],
    },
  ];

  const pestañasVisibles = opcionesNavegacion.filter((item) => item.roles.includes(rolUsuario));

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Marca / Logotipo Corporativo HUD */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer group select-none" 
          onClick={() => onCambiarSeccion("centro-de-control")}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 text-emerald-400 flex items-center justify-center shadow-sm group-hover:border-emerald-500/50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold tracking-tight text-sm flex items-center gap-2 font-mono">
              RPA LAD-6819
              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EN LÍNEA
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-sans tracking-tight">
              Orquestador Central de Descuentos
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación Segmentada */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {pestañasVisibles.map((item) => {
            const activo = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCambiarSeccion(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 active:scale-[0.98] ${
                  activo
                    ? "bg-slate-800 text-white font-medium border border-slate-700/70 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-normal"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Perfil de Usuario y Rol Autenticado */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Badge de Seguridad y Rol */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1.5 ${roleCfg.badgeBg}`}>
              <span className="material-symbols-outlined text-[14px]">
                {rolUsuario === "ADMIN" ? "security" : rolUsuario === "SUPERVISOR" ? "policy" : "badge"}
              </span>
              <span>
                {rolUsuario === "ADMIN"
                  ? "Admin Master"
                  : rolUsuario === "SUPERVISOR"
                    ? "Auditor Central"
                    : `Analista • ${empresaAsignada && empresaAsignada !== "TODAS" ? empresaAsignada.toUpperCase() : "Nómina"}`}
              </span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Avatar del Usuario y Salir */}
          <div className="flex items-center gap-2">
            <div
              title={`${nombrePerfil || user.email} (${roleCfg.label})`}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs font-mono"
            >
              {iniciales(user)}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión Segura"
              aria-label="Cerrar Sesión Segura"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil de navegación */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800/80 gap-1.5 scrollbar-none">
        {pestañasVisibles.map((item) => {
          const activo = seccionActiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiarSeccion(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all active:scale-[0.98] ${
                activo
                  ? "bg-slate-800 text-white font-medium border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
