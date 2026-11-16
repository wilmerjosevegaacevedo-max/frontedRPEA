import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { Job, grupoEstado } from "../types";
import { formatBytes, formatDateTime } from "../utils/format";

type JobDrawerProps = {
  job: Job | null;
  onClose: () => void;
  onReintentar: (jobId: string) => void;
  reintentando: boolean;
};

function useDownloadUrl(path?: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!path || !storage) return;
    let cancelado = false;
    getDownloadURL(ref(storage, path))
      .then((value) => {
        if (!cancelado) setUrl(value);
      })
      .catch(() => {
        if (!cancelado) setUrl(null);
      });
    return () => {
      cancelado = true;
    };
  }, [path]);

  return url;
}

const PASOS = [
  { key: "creado", label: "Lote creado y planilla cargada en el sistema", icon: "cloud_done" },
  { key: "proceso", label: "En procesamiento por motor de cálculo TypeScript (SheetJS)", icon: "speed" },
  { key: "final", label: "Liquidación y auditoría completada", icon: "task_alt" },
] as const;

export function JobDrawer({ job, onClose, onReintentar, reintentando }: JobDrawerProps) {
  const downloadUrl = useDownloadUrl(job?.archivoSalida);
  const [copiado, setCopiado] = useState(false);

  function copiarFolio() {
    if (!job) return;
    navigator.clipboard?.writeText(job.id);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function descargarReporteLoteExcel() {
    if (!job) return;
    const resumen = [
      { Parametro: "Identificador de Lote", Detalle: job.id },
      { Parametro: "Empresa / Cliente", Detalle: job.cliente.toUpperCase() },
      { Parametro: "Archivo Origen", Detalle: job.nombreArchivo },
      { Parametro: "Tipo de Carga", Detalle: job.tipoCarga || "MASIVA" },
      { Parametro: "Estado de Auditoría", Detalle: job.estado },
      { Parametro: "Total Registros Procesados", Detalle: job.totalRegistros ?? 1 },
      { Parametro: "Registros Exitosos", Detalle: job.registrosExitosos ?? 1 },
      { Parametro: "Registros Rechazados", Detalle: job.registrosFallidos ?? 0 },
      { Parametro: "Total Descuentos Liquidado ($)", Detalle: job.totalDescuentos ?? 0 },
      { Parametro: "Fecha de Creación", Detalle: job.creadoEn?.toDate ? job.creadoEn.toDate().toLocaleString("es-CO") : new Date().toLocaleString("es-CO") },
      { Parametro: "Operador Responsable", Detalle: job.usuarioEmail || "analista@nomina.com" },
    ];

    const hoja = XLSX.utils.json_to_sheet(resumen);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja, "Auditoria_Lote");
    XLSX.writeFile(wb, `Reporte_Auditoria_${job.id}.xlsx`);
  }

  if (!job) {
    return (
      <aside className="xl:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col items-center justify-center text-center gap-2 sticky top-20 min-h-[240px] text-slate-400">
        <span className="material-symbols-outlined text-slate-600 text-[32px]">touch_app</span>
        <p className="text-xs font-sans text-slate-400">
          Selecciona un lote de la tabla para ver su trazabilidad y auditoría.
        </p>
      </aside>
    );
  }

  const grupo = grupoEstado(job.estado);
  const pasoActual = grupo === "proceso" ? 1 : grupo === "exito" || grupo === "fallo" ? 2 : 0;

  return (
    <aside className="xl:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col gap-4 sticky top-20 text-slate-100">
      <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[20px]">account_tree</span>
            <h3 className="text-sm font-bold text-white tracking-tight font-mono">Detalle de Trazabilidad</h3>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700 font-bold">
              {job.id}
            </span>
            <button
              type="button"
              onClick={copiarFolio}
              title="Copiar identificador de lote"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copiado ? "done" : "content_copy"}
              </span>
            </button>
            <span className="text-xs text-slate-400 font-mono">({job.cliente.toUpperCase()})</span>
          </div>
        </div>
        <button
          aria-label="Cerrar panel de inspección"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar panel de inspección"
          type="button"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Parámetros del Archivo y Resumen Financiero */}
      <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
        <div className="col-span-2 pb-2 border-b border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Archivo Origen:</span>
          <span className="font-semibold text-slate-200 break-all text-[11px]">{job.nombreArchivo}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Tipo de Carga:</span>
          <span className="font-semibold text-cyan-400 text-[11px]">{job.tipoCarga || "MASIVA"}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Tamaño:</span>
          <span className="font-semibold text-slate-200 text-[11px] tabular-nums">{formatBytes(job.tamanoBytes)}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Registros (OK / Total):</span>
          <span className="font-semibold text-emerald-400 text-[11px] tabular-nums">
            {job.registrosExitosos ?? job.totalRegistros ?? 1} / {job.totalRegistros ?? 1}
            {(job.registrosFallidos ?? 0) > 0 && (
              <span className="text-red-400 ml-1">({job.registrosFallidos} err)</span>
            )}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Total Descontado:</span>
          <span className="font-bold text-cyan-300 text-[11px] tabular-nums">
            ${(job.totalDescuentos ?? 0).toLocaleString("es-CO")} COP
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Operador:</span>
          <span className="text-slate-300 text-[11px] truncate block" title={job.usuarioEmail || "analista@nomina.com"}>
            {job.usuarioEmail || "analista@nomina.com"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Creado:</span>
          <span className="text-slate-200 text-[11px]">{formatDateTime(job.creadoEn?.toDate())}</span>
        </div>
      </div>

      {/* Stepper de Progreso */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Progreso del Lote
        </span>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {PASOS.map((paso, index) => {
            const completado = index < pasoActual || (index === pasoActual && grupo !== "proceso" && grupo !== "otro");
            const enCurso = index === pasoActual && (grupo === "proceso" || grupo === "otro");
            const esFalloFinal = index === 2 && grupo === "fallo";
            return (
              <div key={paso.key} className={`relative flex flex-col gap-0.5 ${index > pasoActual ? "opacity-35" : ""}`}>
                <span
                  className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 ${
                    esFalloFinal
                      ? "bg-red-500"
                      : completado
                        ? "bg-emerald-500"
                        : enCurso
                          ? "bg-amber-400 animate-pulse"
                          : "bg-slate-700"
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">{paso.icon}</span>
                  <p className="text-xs text-slate-200 font-sans">{paso.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {job.error && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-mono">Mensaje de Error</span>
          <div className="bg-red-950/40 border border-red-800/60 text-red-300 p-3 rounded-xl text-xs font-mono">{job.error}</div>
        </div>
      )}

      {/* Acciones del Lote */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={descargarReporteLoteExcel}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px]">description</span>
          <span>Descargar Resumen del Lote (.xlsx)</span>
        </button>

        {job.archivoSalida && (
          <a
            href={downloadUrl ?? undefined}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl transition-all active:scale-[0.98] ${
              downloadUrl
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50"
                : "bg-slate-800/40 text-slate-500 border border-slate-800 pointer-events-none"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>{downloadUrl ? "Descargar ZIP de Resultado" : "Preparando enlace de descarga..."}</span>
          </a>
        )}
        {grupo === "fallo" && (
          <button
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs rounded-xl border border-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-60"
            type="button"
            disabled={reintentando}
            onClick={() => onReintentar(job.id)}
          >
            <span className={`material-symbols-outlined text-[16px] ${reintentando ? "animate-spin" : ""}`}>
              {reintentando ? "sync" : "replay"}
            </span>
            <span>{reintentando ? "Reintentando..." : "Reintentar Lote"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
