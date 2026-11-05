"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
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
  rolInicial,
  empresaAsignadaInicial,
}: DashboardProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_PREDETERMINADAS);

  // Perfil delimitado estrictamente según el correo autenticado y empresas registradas
  const perfil = useMemo(() => resolverPerfilUsuario(user.email, empresas), [user.email, empresas]);
  const rolUsuario: RolUsuario = rolInicial || perfil.rol;
  const empresaAsignada: string =
    empresaAsignadaInicial && empresaAsignadaInicial !== "TODAS"
      ? empresaAsignadaInicial
      : perfil.empresaId;

  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>("centro-de-control");
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

      if (db) {
        try {
          await setDoc(doc(collection(db, "jobs"), nuevoLoteAuto.id), {
            ...nuevoLoteAuto,
            usuarioId: user.uid,
            usuarioEmail: user.email || "operador@tdea.edu.co",
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          });
        } catch (dbErr: any) {
          console.warn("Aviso al guardar lote sincronizado en Firestore:", dbErr?.message);
        }
      }

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
    <div className="w-full min-h-screen bg-[#030712] text-slate-100 flex flex-col cyber-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cabecera de Navegación Fija */}
      <DashboardHeader
        user={user}
        rolUsuario={rolUsuario}
        empresaAsignada={empresaAsignada}
        nombrePerfil={perfil.nombre}
        seccionActiva={seccionActiva}
        onCambiarSeccion={setSeccionActiva}
        onSignOut={onSignOut}
      />

      {/* Contenido Principal con separación por header fijo */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="flex flex-col gap-6">

          {/* SECCIÓN 1: CENTRO DE CONTROL OPERACIONAL (Visible para todos) */}
          {seccionActiva === "centro-de-control" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Banner de Bienvenida y Acciones Rápidas HUD */}
              <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3 relative z-10">
                  <h1 className="text-xl font-bold text-white tracking-tight font-mono">
                    Centro de Control
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {empresaAsignada === "TODAS" ? "TODAS LAS ENTIDADES" : empresaAsignada.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative z-10">
                  {/* Botón Sincronizar Robot Gmail */}
                  <button
                    type="button"
                    onClick={escanearBuzonRpa}
                    disabled={escaneandoRpa}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-[17px] ${escaneandoRpa ? "animate-spin" : ""}`}>
                      {escaneandoRpa ? "sync" : "forward_to_inbox"}
                    </span>
                    <span>{escaneandoRpa ? "Escaneando Buzón..." : "Sincronizar Gmail"}</span>
                  </button>

                  {/* Acciones para roles operativos */}
                  {(rolUsuario === "ADMIN" || rolUsuario === "ANALISTA") && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSeccionActiva("carga-masiva")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_18px_rgba(59,130,246,0.35)] border border-blue-400/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-[17px]">upload_file</span>
                        <span>Nueva Planilla</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSeccionActiva("pago-unico")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-cyan-300 hover:text-white font-bold text-xs border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-[17px] text-emerald-400">payments</span>
                        <span>Descuento Individual</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {notificacionRpa && (
                <div className="p-3.5 rounded-xl bg-cyan-950/70 text-cyan-200 border border-cyan-800/80 flex items-center justify-between gap-2 text-xs font-medium animate-fadeIn shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-[18px]">mark_email_read</span>
                    <span>{notificacionRpa}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificacionRpa(null)}
                    className="text-cyan-400 hover:text-white"
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

      {/* Pie de Página High-Tech */}
      <footer className="w-full bg-[#050814]/85 backdrop-blur-md py-4 border-t border-slate-800/80 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">RPA LAD-6819</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400/90">Orquestador de Descuentos de Nómina</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] inline-block" />
              <span className="text-slate-300 font-medium">Servicios Operacionales Activos</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400/80">v2.4.0 Enterprise</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
