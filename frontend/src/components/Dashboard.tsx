"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Empresa, EMPRESAS_PREDETERMINADAS, Job, resolverPerfilUsuario, RolUsuario } from "../types";
import { DashboardHeader, SeccionNavegacion } from "./DashboardHeader";
import { KpiSummary } from "./KpiSummary";
import { JobsTable } from "./JobsTable";
import { JobDrawer } from "./JobDrawer";
import { SystemStatusBar } from "./SystemStatusBar";
import { CargaMasivaModule } from "./CargaMasivaModule";
import { PagoUnicoModule } from "./PagoUnicoModule";
import { EmpresasModule } from "./EmpresasModule";
import { AuditoriaRolesModule } from "./AuditoriaRolesModule";

type DashboardProps = {
  user: User;
  jobs: Job[];
  onSignOut: () => void;
  onNuevoJob?: (job: Job) => void;
  rolInicial?: RolUsuario;
  empresaAsignadaInicial?: string;
};

export function Dashboard({
  user,
  jobs,
  onSignOut,
  onNuevoJob,
}: DashboardProps) {
  // Perfil inmutable y delimitado estrictamente según el correo autenticado
  const perfil = useMemo(() => resolverPerfilUsuario(user.email), [user.email]);
  const rolUsuario: RolUsuario = perfil.rol;
  const empresaAsignada: string = perfil.empresaId;

  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>("centro-de-control");
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_PREDETERMINADAS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [reintentandoId, setReintentandoId] = useState<string | null>(null);
  const [escaneandoRpa, setEscaneandoRpa] = useState(false);
  const [notificacionRpa, setNotificacionRpa] = useState<string | null>(null);

  // Guardia de navegación RBAC: Si un rol no autorizado intenta ingresar a una sección prohibida, redirigir
  useEffect(() => {
    if (rolUsuario === "ANALISTA" && (seccionActiva === "empresas-reglas" || seccionActiva === "auditoria-roles")) {
      setSeccionActiva("centro-de-control");
    } else if (rolUsuario === "SUPERVISOR" && (seccionActiva === "carga-masiva" || seccionActiva === "pago-unico")) {
      setSeccionActiva("centro-de-control");
    }
  }, [rolUsuario, seccionActiva]);

  // Cargar empresas dinámicas desde Firestore
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, "empresas"),
      (snapshot) => {
        if (!snapshot.empty) {
          const cargadas = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Empresa));
          setEmpresas(cargadas);
        }
      },
      (error) => {
        console.warn("Aviso al cargar empresas de Firestore (usando predeterminadas):", error.message);
      }
    );
    return () => unsub();
  }, []);

  // Filtrar empresas visibles según la empresa asignada a la credencial
  const empresasVisibles = useMemo(() => {
    if (rolUsuario === "ADMIN" || empresaAsignada === "TODAS") {
      return empresas;
    }
    return empresas.filter((e) => e.id === empresaAsignada);
  }, [empresas, rolUsuario, empresaAsignada]);

  // Filtrar lotes de nómina según la empresa asignada
  const jobsVisibles = useMemo(() => {
    if (rolUsuario === "ADMIN" || rolUsuario === "SUPERVISOR" || empresaAsignada === "TODAS") {
      return jobs;
    }
    return jobs.filter((j) => j.cliente === empresaAsignada);
  }, [jobs, rolUsuario, empresaAsignada]);

  const selectedJob = jobsVisibles.find((job) => job.id === selectedJobId) ?? null;

  function reintentarLote(jobId: string) {
    setReintentandoId(jobId);
    setTimeout(() => {
      setReintentandoId(null);
    }, 1500);
  }

  async function escanearBuzonRpa() {
    setEscaneandoRpa(true);
    setNotificacionRpa(null);
    try {
      // Simular sincronización activa con el buzón de correo / endpoint RPA
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const nuevoLoteAuto: Job = {
        id: `LOTE-GMAIL-${Date.now().toString().slice(-4)}`,
        cliente: "continental",
        nombreArchivo: `Planilla_Gmail_Sync_${new Date().toLocaleDateString("es-CO").replace(/\//g, "-")}.xlsx`,
        tipoCarga: "MASIVA",
        totalRegistros: 42,
        registrosExitosos: 42,
        registrosFallidos: 0,
        totalDescuentos: 2480000,
        estado: "EXITOSO",
        tamanoBytes: 184320,
        creadoEn: { toDate: () => new Date() } as any,
      };

      if (onNuevoJob) {
        onNuevoJob(nuevoLoteAuto);
      }

      setNotificacionRpa(
        "Buzón Gmail sincronizado exitosamente: 1 planilla de deducciones detectada y procesada automáticamente (42 registros validados)."
      );
    } catch (err: any) {
      setNotificacionRpa("Error al sincronizar buzón: " + (err?.message || "Servicio temporalmente inaccesible"));
    } finally {
      setEscaneandoRpa(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      <DashboardHeader
        user={user}
        rolUsuario={rolUsuario}
        empresaAsignada={empresaAsignada}
        nombrePerfil={perfil.nombre}
        seccionActiva={seccionActiva}
        onCambiarSeccion={setSeccionActiva}
        onSignOut={onSignOut}
      />

      <main className="w-full pt-20 lg:pt-24 pb-12 flex-1">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          {/* SECCIÓN 1: CENTRO DE CONTROL */}
          {seccionActiva === "centro-de-control" && (
            <div className="flex flex-col gap-6">
              {/* Encabezado Principal Dark Obsidian */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0d131f] border border-slate-800 shadow-[0_0_35px_-10px_rgba(16,185,129,0.12)]">
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Centro de Control de Descuentos</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#34d399]" />
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400">
                    {rolUsuario === "ANALISTA"
                      ? `Gestión operativa de nómina: Monitoreando registros de ${empresasVisibles[0]?.nombre || empresaAsignada.toUpperCase()}.`
                      : rolUsuario === "SUPERVISOR"
                        ? "Supervisión y auditoría central: Monitoreo integral en modo solo lectura de todas las empresas."
                        : "Consola de administración: Control total de empresas clientes, reglas de negocio y lotes de nómina."}
                  </p>
                </div>

                {/* Acciones del Encabezado */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {(rolUsuario === "ADMIN" || rolUsuario === "SUPERVISOR") && (
                    <button
                      type="button"
                      disabled={escaneandoRpa}
                      onClick={escanearBuzonRpa}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all disabled:opacity-60"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${escaneandoRpa ? "animate-spin" : ""}`}>
                        {escaneandoRpa ? "sync" : "forward_to_inbox"}
                      </span>
                      <span>{escaneandoRpa ? "Sincronizando..." : "Sincronizar Gmail"}</span>
                    </button>
                  )}

                  {(rolUsuario === "ADMIN" || rolUsuario === "ANALISTA") && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSeccionActiva("carga-masiva")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">upload_file</span>
                        <span>Nueva Planilla</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeccionActiva("pago-unico")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#131b2c] border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-xs shadow-xs transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">payments</span>
                        <span>Descuento Individual</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {notificacionRpa && (
                <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-200 border border-violet-500/30 flex items-center justify-between gap-2 text-xs font-medium animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-[18px]">mark_email_read</span>
                    <span>{notificacionRpa}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificacionRpa(null)}
                    className="text-violet-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Tarjetas KPI calculadas estrictamente sobre los lotes visibles */}
              <KpiSummary jobs={jobsVisibles} />

              {/* Tabla de Lotes y Panel Lateral */}
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <JobsTable
                  jobs={jobsVisibles}
                  empresaAsignada={empresaAsignada}
                  rolUsuario={rolUsuario}
                  onSelectJob={(jobId) => setSelectedJobId(jobId)}
                  onReintentar={reintentarLote}
                  reintentandoId={reintentandoId}
                />
                <JobDrawer
                  job={selectedJob}
                  onClose={() => setSelectedJobId(null)}
                  onReintentar={reintentarLote}
                  reintentando={reintentandoId === selectedJob?.id}
                />
              </section>

              <SystemStatusBar />
            </div>
          )}

          {/* SECCIÓN 2: CARGA MASIVA (Solo ADMIN y ANALISTA) */}
          {seccionActiva === "carga-masiva" && (rolUsuario === "ADMIN" || rolUsuario === "ANALISTA") && (
            <CargaMasivaModule
              empresas={empresasVisibles}
              user={user}
              rolUsuario={rolUsuario}
              empresaAsignada={empresaAsignada}
              onLoteCreado={(nuevoJob) => {
                if (onNuevoJob) onNuevoJob(nuevoJob);
              }}
            />
          )}

          {/* SECCIÓN 3: DESCUENTO INDIVIDUAL (Solo ADMIN y ANALISTA) */}
          {seccionActiva === "pago-unico" && (rolUsuario === "ADMIN" || rolUsuario === "ANALISTA") && (
            <PagoUnicoModule
              empresas={empresasVisibles}
              user={user}
              rolUsuario={rolUsuario}
              empresaAsignada={empresaAsignada}
            />
          )}

          {/* SECCIÓN 4: EMPRESAS Y REGLAS DE NEGOCIO (Solo ADMIN y SUPERVISOR) */}
          {seccionActiva === "empresas-reglas" && (rolUsuario === "ADMIN" || rolUsuario === "SUPERVISOR") && (
            <EmpresasModule
              empresas={empresas}
              onActualizarEmpresas={setEmpresas}
              rolUsuario={rolUsuario}
            />
          )}

          {/* SECCIÓN 5: AUDITORÍA Y ROLES (Solo ADMIN y SUPERVISOR) */}
          {seccionActiva === "auditoria-roles" && (rolUsuario === "ADMIN" || rolUsuario === "SUPERVISOR") && (
            <AuditoriaRolesModule rolUsuario={rolUsuario} />
          )}
        </div>
      </main>

      {/* Pie de Página Profesional y Sobrio */}
      <footer className="w-full bg-[#090d16] py-4 border-t border-slate-800 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">RPA LAD-6819</span>
            <span>•</span>
            <span>Orquestador de Descuentos de Nómina</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34d399]" />
              <span className="text-slate-300 font-medium">Servicios Operacionales Activos</span>
            </span>
            <span>•</span>
            <span>v2.4.0 Enterprise</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
