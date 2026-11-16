"use client";

import { RolUsuario, ROLES_CONFIG } from "../types";

export function AuditoriaRolesModule({
  rolUsuario,
}: {
  rolUsuario: RolUsuario;
}) {
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
      funcionalidad: "Cargar Descuento Individual",
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
    <div className="flex flex-col gap-6 w-full text-slate-100">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[24px]">security</span>
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">
              Auditoría y Control de Acceso Basado en Roles (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              RBAC Guard Activo
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Matriz de gobierno y segregación de funciones entre Administrador, Supervisor y Analista de Nómina.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-xs text-slate-400 font-medium">Tu rol activo:</span>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${ROLES_CONFIG[rolUsuario].badgeBg}`}>
            {ROLES_CONFIG[rolUsuario].label}
          </span>
        </div>
      </div>

      {/* Tarjetas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(["ADMIN", "SUPERVISOR", "ANALISTA"] as RolUsuario[]).map((rol) => {
          const cfg = ROLES_CONFIG[rol];
          const esElMio = rol === rolUsuario;
          return (
            <div
              key={rol}
              className={`p-5 rounded-2xl bg-slate-900/90 shadow-sm flex flex-col justify-between gap-4 border transition-all ${
                esElMio ? "border-cyan-500/60 ring-1 ring-cyan-500/30" : "border-slate-800/80"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${cfg.badgeBg}`}>
                    {cfg.label}
                  </span>
                  {esElMio && (
                    <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Sesión Activa
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{cfg.descripcion}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <span className="material-symbols-outlined text-[15px] text-cyan-400">shield</span>
                  <span>{rol === "ADMIN" ? "Nivel 3 (Total)" : rol === "SUPERVISOR" ? "Nivel 2 (Auditor)" : "Nivel 1 (Operativo)"}</span>
                </div>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  esElMio ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" : "bg-slate-950 text-slate-500 border border-slate-800"
                }`}>
                  {esElMio ? "Rol Activo" : "Bloqueado"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz de Permisos */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">table_chart</span>
          <h3 className="text-sm font-bold text-white tracking-tight font-mono">
            Matriz de Segregación de Funcionalidades por Rol
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Funcionalidad del Sistema</th>
                <th className="py-3 px-4">Descripción de Negocio</th>
                <th className="py-3 px-4 text-center">ADMIN</th>
                <th className="py-3 px-4 text-center">SUPERVISOR</th>
                <th className="py-3 px-4 text-center">ANALISTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {matrizPermisos.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white font-mono">{p.funcionalidad}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{p.descripcion}</td>

                  {/* ADMIN */}
                  <td className="py-3 px-4 text-center font-mono">
                    {p.admin === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : (
                      <span className="text-slate-500">{p.admin}</span>
                    )}
                  </td>

                  {/* SUPERVISOR */}
                  <td className="py-3 px-4 text-center font-mono">
                    {p.supervisor === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : p.supervisor === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">close</span> DENEGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[10px]">
                        {p.supervisor}
                      </span>
                    )}
                  </td>

                  {/* ANALISTA */}
                  <td className="py-3 px-4 text-center font-mono">
                    {p.analista === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                      </span>
                    ) : p.analista === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[12px]">close</span> DENEGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[10px]">
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
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">code</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-white font-mono">Arquitectura Fullstack TypeScript Puro (Cero Python)</span>
            <span className="text-xs text-slate-400 font-sans mt-0.5">
              Toda la lógica de parsing de planillas, validación de reglas de negocio y cálculo financiero se ejecuta en JavaScript / TypeScript.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-cyan-400">
            Next.js 14
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-emerald-400">
            SheetJS XLSX
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-amber-400">
            Firebase 10
          </span>
        </div>
      </div>
    </div>
  );
}
