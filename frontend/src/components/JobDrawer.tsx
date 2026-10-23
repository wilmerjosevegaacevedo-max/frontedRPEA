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
      <aside className="xl:col-span-4 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center text-center gap-space-sm sticky top-20 min-h-[240px]">
        <span className="material-symbols-outlined text-on-surface-variant text-[32px]">touch_app</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Selecciona un lote de la tabla para ver su trazabilidad.
        </p>
      </aside>
    );
  }

  const grupo = grupoEstado(job.estado);
  const pasoActual = grupo === "proceso" ? 1 : grupo === "exito" || grupo === "fallo" ? 2 : 0;

  return (
    <aside className="xl:col-span-4 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md sticky top-20">
      <div className="flex items-start justify-between pb-space-xs border-b border-surface-container">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Detalle de Trazabilidad</h3>
          </div>
          <div className="flex items-center gap-space-xs mt-1">
            <span className="font-code-sm text-code-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
              {job.id}
            </span>
            <button
              type="button"
              onClick={copiarFolio}
              title="Copiar identificador de lote"
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copiado ? "done" : "content_copy"}
              </span>
            </button>
            <span className="font-label-sm text-label-sm text-on-surface-variant">({job.cliente.toUpperCase()})</span>
          </div>
        </div>
        <button
          aria-label="Cerrar panel de inspección"
          className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Cerrar panel de inspección"
          type="button"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-space-sm p-space-sm rounded-lg bg-surface-container-low text-body-xs font-body-xs">
        <div>
          <span className="text-on-surface-variant block">Archivo:</span>
          <span className="font-semibold text-on-surface break-all">{job.nombreArchivo}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">Tamaño:</span>
          <span className="font-semibold text-on-surface">{formatBytes(job.tamanoBytes)}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">Estado:</span>
          <span className="font-semibold text-on-surface">{job.estado}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">Creado:</span>
          <span className="font-code-sm text-on-surface">{formatDateTime(job.creadoEn?.toDate())}</span>
        </div>
      </div>

      <div className="flex flex-col gap-space-sm pt-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          Progreso del Lote
        </span>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
          {PASOS.map((paso, index) => {
            const completado = index < pasoActual || (index === pasoActual && grupo !== "proceso" && grupo !== "otro");
            const enCurso = index === pasoActual && (grupo === "proceso" || grupo === "otro");
            const esFalloFinal = index === 2 && grupo === "fallo";
            return (
              <div key={paso.key} className={`relative flex flex-col gap-0.5 ${index > pasoActual ? "opacity-40" : ""}`}>
                <span
                  className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest ${
                    esFalloFinal
                      ? "bg-red-500"
                      : completado
                        ? "bg-emerald-500"
                        : enCurso
                          ? "bg-amber-500 animate-pulse"
                          : "bg-surface-variant"
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">{paso.icon}</span>
                  <p className="font-body-sm text-body-sm text-on-surface">{paso.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {job.error && (
        <div className="flex flex-col gap-space-xs pt-space-xs">
          <span className="font-label-sm text-label-sm text-error uppercase tracking-wider">Mensaje de Error</span>
          <div className="bg-red-50 text-red-800 p-space-sm rounded-lg font-body-sm text-body-sm">{job.error}</div>
        </div>
      )}

      <div className="flex flex-col gap-space-sm pt-space-sm">
        <button
          type="button"
          onClick={descargarReporteLoteExcel}
          className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2 bg-surface-container-high hover:bg-surface-container text-primary font-semibold text-xs rounded-lg transition-colors border border-surface-container"
        >
          <span className="material-symbols-outlined text-[16px]">description</span>
          <span>Descargar Resumen del Lote (.xlsx)</span>
        </button>

        {job.archivoSalida && (
          <a
            href={downloadUrl ?? undefined}
            className={`w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2 font-label-md text-label-md rounded-lg shadow-sm transition-colors ${
              downloadUrl
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-surface-container-low text-on-surface-variant pointer-events-none"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{downloadUrl ? "Descargar ZIP de Resultado" : "Preparando enlace de descarga..."}</span>
          </a>
        )}
        {grupo === "fallo" && (
          <button
            className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2 bg-primary/10 text-primary hover:bg-primary/20 font-label-md text-label-md rounded-lg transition-colors disabled:opacity-60"
            type="button"
            disabled={reintentando}
            onClick={() => onReintentar(job.id)}
          >
            <span className={`material-symbols-outlined text-[18px] ${reintentando ? "animate-spin" : ""}`}>
              {reintentando ? "sync" : "cached"}
            </span>
            <span>{reintentando ? "Reintentando..." : "Reintentar Lote"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
