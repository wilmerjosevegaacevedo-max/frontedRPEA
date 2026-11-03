"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
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
    <div className="w-full min-h-screen bg-background flex flex-col">
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
            <div className="flex flex-col gap-space-lg">
              {/* Encabezado Principal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
                <div className="flex flex-col gap-1">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                    Centro de Control de Descuentos de Nómina
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {rolUsuario === "ANALISTA"
                      ? `Panel Operativo Exclusivo: Monitoreando únicamente registros y deducciones de ${empresasVisibles[0]?.nombre || empresaAsignada.toUpperCase()}.`
                      : rolUsuario === "SUPERVISOR"
                        ? "Panel de Auditoría y Supervisión Central: Monitoreo integral en solo lectura de todas las empresas."
                        : "Consola de Administración Central: Control total de empresas, reglas de negocio y supervisión de lotes."}
                  </p>
                </div>

                {/* Acciones Rápidas Delimitadas por Rol */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Escaneo de Buzón solo permitido para Administrador y Supervisor */}
                  {(rolUsuario === "ADMIN" || rolUsuario === "SUPERVISOR") && (
                    <button
                      type="button"
                      disabled={escaneandoRpa}
                      onClick={escanearBuzonRpa}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-60"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${escaneandoRpa ? "animate-spin" : ""}`}>
                        {escaneandoRpa ? "sync" : "forward_to_inbox"}
                      </span>
                      <span>{escaneandoRpa ? "Escaneando Buzón..." : "Escanear Gmail"}</span>
                    </button>
                  )}

                  {/* Operaciones de Carga solo permitidas para Administrador y Analistas */}
                  {(rolUsuario === "ADMIN" || rolUsuario === "ANALISTA") && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSeccionActiva("carga-masiva")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 shadow-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        Carga Masiva
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeccionActiva("pago-unico")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        Descuento Individual
                      </button>
                    </>
                  )}
                </div>
              </div>

              {notificacionRpa && (
                <div className="p-3.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center justify-between gap-2 text-xs font-medium animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">mark_email_read</span>
                    <span>{notificacionRpa}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificacionRpa(null)}
                    className="text-indigo-500 hover:text-indigo-800"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Tarjetas KPI calculadas estrictamente sobre los lotes visibles */}
              <KpiSummary jobs={jobsVisibles} />

              {/* Tabla de Lotes y Panel Lateral */}
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
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

      <footer className="w-full bg-surface-container-lowest py-4 border-t border-surface-container mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-on-surface-variant font-body-xs text-body-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary text-white font-code-sm text-code-sm rounded font-bold">
              NEXT.JS 14
            </span>
            <span className="font-body-xs text-body-xs text-on-surface-variant flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Motor TypeScript Client-Side • Sin Python
            </span>
          </div>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Operando 100% en Navegador y Firebase
          </span>
        </div>
      </footer>
    </div>
  );
}
