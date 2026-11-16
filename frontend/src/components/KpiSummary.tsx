import { CLIENTES, Empresa, Job, grupoEstado } from "../types";
import { esHoy, formatRelativeTime } from "../utils/format";

export function KpiSummary({ jobs, empresas }: { jobs: Job[]; empresas?: Empresa[] }) {
  const lotesHoy = jobs.filter((job) => esHoy(job.creadoEn?.toDate())).length;
  const exitosos = jobs.filter((job) => grupoEstado(job.estado) === "exito").length;
  const fallidos = jobs.filter((job) => grupoEstado(job.estado) === "fallo").length;
  const procesando = jobs.filter((job) => grupoEstado(job.estado) === "proceso").length;
  const total = jobs.length;
  const tasaEfectividad = total > 0 ? (exitosos / total) * 100 : 0;

  const entidadesLista = empresas && empresas.length > 0
    ? empresas.map((e) => ({ id: e.id, label: e.nombre }))
    : CLIENTES;

  const clientesConLotes = new Set(jobs.map((job) => job.cliente.toLowerCase()));

  const ultimoLote = [...jobs].sort((a, b) => {
    const fechaA = a.creadoEn?.toDate()?.getTime() ?? 0;
    const fechaB = b.creadoEn?.toDate()?.getTime() ?? 0;
    return fechaB - fechaA;
  })[0];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* Card 1: Lotes procesados */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-700/80 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Lotes Registrados
            </span>
            <span className="text-3xl font-bold text-white mt-1 font-mono tabular-nums tracking-tight flex items-baseline gap-1.5">
              {total} <span className="text-xs font-normal text-slate-400 uppercase">lotes</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">folder_zip</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{lotesHoy} hoy</span>
            <span>{procesando} en curso</span>
          </div>
          {total > 0 && (
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5 border border-slate-800/60">
              <div className="h-full bg-emerald-500" style={{ width: `${(exitosos / total) * 100}%` }} title={`${exitosos} exitosos`} />
              <div className="h-full bg-amber-400" style={{ width: `${(procesando / total) * 100}%` }} title={`${procesando} en curso`} />
              <div className="h-full bg-red-500" style={{ width: `${(fallidos / total) * 100}%` }} title={`${fallidos} fallidos`} />
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Tasa de efectividad */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-700/80 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Tasa de Efectividad
            </span>
            <span className="text-3xl font-bold text-emerald-400 mt-1 font-mono tabular-nums tracking-tight">
              {total > 0 ? `${tasaEfectividad.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-emerald-500 transition-all duration-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${tasaEfectividad}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="material-symbols-outlined text-[16px] absolute text-emerald-400">check</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1 font-mono border-t border-slate-800/60">
          <span className="text-emerald-400 font-medium">{exitosos} exitosos</span>
          <span className="text-slate-600">•</span>
          <span className="text-red-400 font-medium">{fallidos} fallidos</span>
        </div>
      </div>

      {/* Card 3: Clientes configurados */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-700/80 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Clientes Activos
            </span>
            <span className="text-3xl font-bold text-white mt-1 font-mono tabular-nums tracking-tight flex items-baseline gap-1.5">
              {entidadesLista.length} <span className="text-xs font-normal text-slate-400 uppercase">entidades</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">domain</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {entidadesLista.map((c) => (
            <span
              key={c.id}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-semibold border transition-colors ${
                clientesConLotes.has(c.id.toLowerCase())
                  ? "bg-slate-800 text-slate-200 border-slate-700"
                  : "bg-slate-950/60 text-slate-500 border-slate-800/80"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Card 4: Último lote */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-700/80 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Último Evento
            </span>
            <span className="text-sm font-semibold text-white mt-1 truncate font-mono" title={ultimoLote?.nombreArchivo}>
              {ultimoLote ? ultimoLote.nombreArchivo : "Sin lotes aún"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">history</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/60 pt-1">
          <span>
            {ultimoLote ? formatRelativeTime(ultimoLote.creadoEn?.toDate()) : "—"}
          </span>
          {ultimoLote && (
            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
              {ultimoLote.estado}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
