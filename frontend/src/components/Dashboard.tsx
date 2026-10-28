"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { Empresa, EMPRESAS_PREDETERMINADAS, Job, RolUsuario } from "../types";
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
};

export function Dashboard({ user, jobs, onSignOut, onNuevoJob }: DashboardProps) {
  // Rol de usuario (por defecto ADMIN para pruebas completas, configurable en la cabecera)
  const [rolUsuario, setRolUsuario] = useState<RolUsuario>("ADMIN");
  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>("centro-de-control");
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_PREDETERMINADAS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [reintentandoId, setReintentandoId] = useState<string | null>(null);

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

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  function reintentarLote(jobId: string) {
    setReintentandoId(jobId);
    setTimeout(() => {
      setReintentandoId(null);
    }, 1500);
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <DashboardHeader
        user={user}
        rolUsuario={rolUsuario}
        onCambiarRol={setRolUsuario}
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
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary text-white font-code-sm text-code-sm rounded font-bold">
                      NEXT.JS 14
                    </span>
                    <span className="font-body-xs text-body-xs text-on-surface-variant flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Motor TypeScript Client-Side • Sin Python
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                    Centro de Control de Descuentos de Nómina
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Monitoreo en tiempo real de lotes masivos, pagos individuales y auditoría de reglas de negocio por cliente.
                  </p>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-2 shrink-0">
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
                </div>
              </div>

              {/* Tarjetas KPI */}
              <KpiSummary jobs={jobs} />

              {/* Tabla de Lotes y Panel Lateral */}
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
                <JobsTable
                  jobs={jobs}
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

          {/* SECCIÓN 2: CARGA MASIVA */}
          {seccionActiva === "carga-masiva" && (
            <CargaMasivaModule
              empresas={empresas}
              user={user}
              rolUsuario={rolUsuario}
              onLoteCreado={(nuevoJob) => {
                if (onNuevoJob) onNuevoJob(nuevoJob);
              }}
            />
          )}

          {/* SECCIÓN 3: PAGO ÚNICO */}
          {seccionActiva === "pago-unico" && (
            <PagoUnicoModule
              empresas={empresas}
              user={user}
              rolUsuario={rolUsuario}
            />
          )}

          {/* SECCIÓN 4: EMPRESAS Y REGLAS DE NEGOCIO */}
          {seccionActiva === "empresas-reglas" && (
            <EmpresasModule
              empresas={empresas}
              onActualizarEmpresas={setEmpresas}
              rolUsuario={rolUsuario}
            />
          )}

          {/* SECCIÓN 5: AUDITORÍA Y ROLES */}
          {seccionActiva === "auditoria-roles" && (
            <AuditoriaRolesModule rolUsuario={rolUsuario} onCambiarRol={setRolUsuario} />
          )}
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest py-4 border-t border-surface-container mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant font-body-xs text-body-xs">
          <span>Orquestador RPA LAD-6819 • Next.js + TypeScript Fullstack</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Operando 100% en Navegador y Firebase
          </span>
        </div>
      </footer>
    </div>
  );
}
