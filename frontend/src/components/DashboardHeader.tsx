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
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-sm border-b border-surface-container">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Marca / Logotipo */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onCambiarSeccion("centro-de-control")}>
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              RPA LAD-6819
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">
              Orquestador de Descuentos de Nómina
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación por Rol */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-container p-1 rounded-xl">
          {pestañasVisibles.map((item) => {
            const activo = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCambiarSeccion(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activo
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Perfil de Usuario y Rol Autenticado (Inmutable) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Badge de Seguridad y Rol Fijo */}
          <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-surface-container">
            <span className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${roleCfg.badgeBg}`}>
              <span className="material-symbols-outlined text-[14px]">
                {rolUsuario === "ADMIN" ? "security" : rolUsuario === "SUPERVISOR" ? "policy" : "badge"}
              </span>
              <span>
                {rolUsuario === "ADMIN"
                  ? "Administrador Master"
                  : rolUsuario === "SUPERVISOR"
                    ? "Auditor Central"
                    : `Analista • ${empresaAsignada && empresaAsignada !== "TODAS" ? empresaAsignada.toUpperCase() : "Nómina"}`}
              </span>
            </span>
          </div>

          <div className="h-6 w-px bg-surface-container hidden sm:block" />

          {/* Avatar del Usuario y Salir */}
          <div className="flex items-center gap-2">
            <div
              title={`${nombrePerfil || user.email} (${roleCfg.label})`}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs"
            >
              {iniciales(user)}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión Segura"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil de navegación */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-1.5 bg-surface-container-low border-t border-surface-container gap-1 scrollbar-none">
        {pestañasVisibles.map((item) => {
          const activo = seccionActiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiarSeccion(item.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activo ? "bg-primary text-on-primary" : "text-on-surface-variant"
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
