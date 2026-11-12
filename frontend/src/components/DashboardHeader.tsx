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
      roles: ["ADMIN"],
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
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-slate-950/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-b border-slate-800/80">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Marca / Logotipo Corporativo HUD */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer group" 
          onClick={() => onCambiarSeccion("centro-de-control")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300/40 group-hover:shadow-[0_0_28px_rgba(16,185,129,0.7)] transition-all">
            <span className="material-symbols-outlined text-[22px]">smart_toy</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold tracking-tight text-sm md:text-base flex items-center gap-1.5 font-mono">
              RPA LAD-6819
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            </span>
            <span className="text-[11px] text-emerald-400 font-mono tracking-wide">
              Orquestador de Descuentos • Conexión Activa
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación por Rol */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {pestañasVisibles.map((item) => {
            const activo = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCambiarSeccion(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  activo
                    ? "bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] border border-cyan-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-semibold"
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
          {/* Badge de Seguridad y Rol Fijo */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1.5 ${roleCfg.badgeBg}`}>
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
              className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.2)] font-mono"
            >
              {iniciales(user)}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión Segura"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil de navegación */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 gap-1 scrollbar-none">
        {pestañasVisibles.map((item) => {
          const activo = seccionActiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiarSeccion(item.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activo
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
