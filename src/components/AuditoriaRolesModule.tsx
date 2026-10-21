"use client";

import { RolUsuario, ROLES_CONFIG } from "../types";

export function AuditoriaRolesModule({ rolUsuario }: { rolUsuario: RolUsuario }) {
  const matrizPermisos = [
    {
      funcionalidad: "Registrar Empresa & Configurar Reglas de Negocio",
      descripcion: "Crear empresas y ajustar % de Vida, GMM, Costos, Topes y Columnas Requeridas.",
      admin: true,
      supervisor: "Solo Lectura",
      analista: false,
    },
    {
      funcionalidad: "Carga Masiva de Planillas (Excel / CSV)",
      descripcion: "Procesamiento client-side en TypeScript, validación de esquemas y liquidación masiva.",
      admin: true,
      supervisor: false,
      analista: true,
    },
    {
      funcionalidad: "Cargar un Único Pago (Pago Individual)",
      descripcion: "Asentar deducciones unitarias con verificación paramétrica de sobregiro y tope.",
      admin: true,
      supervisor: false,
      analista: true,
    },
    {
      funcionalidad: "Monitoreo de Lotes y KPIs en Tiempo Real",
      descripcion: "Visualización de estado de lotes, tasas de éxito, fallos y tiempos de procesamiento.",
      admin: true,
      supervisor: true,
      analista: "Solo Lotes Propios",
    },
    {
      funcionalidad: "Exportar Liquidaciones en Excel (XLSX)",
      descripcion: "Descarga de archivos consolidados con desglose de pólizas y resumen de auditoría.",
      admin: true,
      supervisor: true,
      analista: true,
    },
    {
      funcionalidad: "Gestión de Roles y Auditoría de Seguridad",
      descripcion: "Inspección de perfiles de usuario, roles RBAC y trazabilidad de operaciones.",
      admin: true,
      supervisor: true,
      analista: false,
    },
  ];

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">security</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Auditoría y Control de Acceso Basado en Roles (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              Frontend RBAC Guard
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Matriz de gobierno y segregación de funciones entre Administrador, Supervisor y Analista de Nómina.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">Tu rol activo actual:</span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${ROLES_CONFIG[rolUsuario].badgeBg}`}>
            {ROLES_CONFIG[rolUsuario].label}
          </span>
        </div>
      </div>

      {/* Tarjetas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {(["ADMIN", "SUPERVISOR", "ANALISTA"] as RolUsuario[]).map((rol) => {
          const cfg = ROLES_CONFIG[rol];
          const esElMio = rol === rolUsuario;
          return (
            <div
              key={rol}
              className={`p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3 border ${
                esElMio ? "border-primary ring-2 ring-primary/20" : "border-surface-container"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${cfg.badgeBg}`}>
                    {cfg.label}
                  </span>
                  {esElMio && (
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{cfg.descripcion}</p>
              </div>

              <div className="pt-2 border-t border-surface-container text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>Nivel de Acceso: {rol === "ADMIN" ? "Nivel 3 (Total)" : rol === "SUPERVISOR" ? "Nivel 2 (Auditor)" : "Nivel 1 (Operativo)"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz de Permisos */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center gap-2 pb-space-sm border-b border-surface-container">
          <span className="material-symbols-outlined text-primary">table_chart</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Matriz de Segregación de Funcionalidades por Rol
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="py-3 px-3">Funcionalidad del Sistema</th>
                <th className="py-3 px-3">Descripción de Negocio</th>
                <th className="py-3 px-3 text-center">ADMIN</th>
                <th className="py-3 px-3 text-center">SUPERVISOR</th>
                <th className="py-3 px-3 text-center">ANALISTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {matrizPermisos.map((p, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-3 font-semibold text-on-surface">{p.funcionalidad}</td>
                  <td className="py-3 px-3 text-on-surface-variant">{p.descripcion}</td>

                  {/* ADMIN */}
                  <td className="py-3 px-3 text-center">
                    {p.admin === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">{p.admin}</span>
                    )}
                  </td>

                  {/* SUPERVISOR */}
                  <td className="py-3 px-3 text-center">
                    {p.supervisor === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : p.supervisor === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">close</span> DENEGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold text-[10px]">
                        {p.supervisor}
                      </span>
                    )}
                  </td>

                  {/* ANALISTA */}
                  <td className="py-3 px-3 text-center">
                    {p.analista === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : p.analista === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">close</span> DENEGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold text-[10px]">
                        {p.analista}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjeta de Arquitectura Técnica */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">code</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface">Arquitectura Fullstack Next.js + TypeScript (No Python)</span>
            <span className="text-[11px] text-on-surface-variant">
              Toda la lógica de parsing de planillas, validación de reglas de negocio y cálculo financiero se ejecuta en JavaScript / TypeScript.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-white border border-surface-container-highest font-bold text-primary">
            Next.js 14
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-surface-container-highest font-bold text-primary">
            SheetJS XLSX
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-surface-container-highest font-bold text-primary">
            Firebase 10
          </span>
        </div>
      </div>
    </div>
  );
}
