import { CLIENTES, Job, grupoEstado } from "../types";
import { esHoy, formatRelativeTime } from "../utils/format";

export function KpiSummary({ jobs }: { jobs: Job[] }) {
  const lotesHoy = jobs.filter((job) => esHoy(job.creadoEn?.toDate())).length;
  const exitosos = jobs.filter((job) => grupoEstado(job.estado) === "exito").length;
  const fallidos = jobs.filter((job) => grupoEstado(job.estado) === "fallo").length;
  const procesando = jobs.filter((job) => grupoEstado(job.estado) === "proceso").length;
  const total = jobs.length;
  const tasaEfectividad = total > 0 ? (exitosos / total) * 100 : 0;

  const clientesConLotes = new Set(jobs.map((job) => job.cliente.toLowerCase()));

  const ultimoLote = [...jobs].sort((a, b) => {
    const fechaA = a.creadoEn?.toDate()?.getTime() ?? 0;
    const fechaB = b.creadoEn?.toDate()?.getTime() ?? 0;
    return fechaB - fechaA;
  })[0];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* Card 1: Lotes procesados */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lotes Registrados
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {total} <span className="text-sm font-normal text-slate-500">lotes</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">folder_zip</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-slate-500">
            {lotesHoy} registrados hoy · {procesando} en curso
          </span>
          {total > 0 && (
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
              <div className="h-full bg-emerald-500" style={{ width: `${(exitosos / total) * 100}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${(procesando / total) * 100}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${(fallidos / total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Tasa de efectividad */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tasa de Efectividad
            </span>
            <span className="text-3xl font-extrabold text-emerald-700 mt-1">
              {total > 0 ? `${tasaEfectividad.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-emerald-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${tasaEfectividad}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="material-symbols-outlined text-[16px] absolute text-emerald-600">verified</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-emerald-700 font-semibold">{exitosos} exitosos</span>
          <span className="text-slate-400">•</span>
          <span className="text-red-600 font-semibold">{fallidos} fallidos</span>
        </div>
      </div>

      {/* Card 3: Clientes configurados */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Clientes Configurados
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {CLIENTES.length} <span className="text-sm font-normal text-slate-500">empresas</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">apartment</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CLIENTES.map((c) => (
            <span
              key={c.id}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-md font-semibold border ${
                clientesConLotes.has(c.id)
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Card 4: Último lote */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Último Lote
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1 truncate">
              {ultimoLote ? ultimoLote.nombreArchivo : "Sin lotes aún"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">history</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {ultimoLote ? formatRelativeTime(ultimoLote.creadoEn?.toDate()) : "—"}
          </span>
          {ultimoLote && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {ultimoLote.estado}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
