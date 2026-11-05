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
      {/* Card 1: Lotes procesados HUD */}
      <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Lotes Registrados
            </span>
            <span className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight flex items-baseline gap-1.5">
              {total} <span className="text-xs font-normal text-cyan-400/80 uppercase">lotes</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <span className="material-symbols-outlined text-[22px]">folder_zip</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 relative z-10">
          <span className="text-[11px] text-slate-400 font-mono">
            {lotesHoy} hoy · {procesando} en curso
          </span>
          {total > 0 && (
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5 border border-slate-800">
              <div className="h-full bg-emerald-400 shadow-[0_0_6px_#34d399]" style={{ width: `${(exitosos / total) * 100}%` }} />
              <div className="h-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" style={{ width: `${(procesando / total) * 100}%` }} />
              <div className="h-full bg-red-500 shadow-[0_0_6px_#ef4444]" style={{ width: `${(fallidos / total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Tasa de efectividad HUD */}
      <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Tasa de Efectividad
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono tracking-tight shadow-emerald">
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
                className="text-emerald-400"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${tasaEfectividad}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="material-symbols-outlined text-[16px] absolute text-emerald-400">verified</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-1 font-mono relative z-10">
          <span className="text-emerald-400 font-semibold">{exitosos} exitosos</span>
          <span className="text-slate-600">•</span>
          <span className="text-red-400 font-semibold">{fallidos} fallidos</span>
        </div>
      </div>

      {/* Card 3: Clientes configurados HUD */}
      <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/15 transition-all" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Clientes Activos
            </span>
            <span className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight flex items-baseline gap-1.5">
              {CLIENTES.length} <span className="text-xs font-normal text-cyan-400/80 uppercase">entidades</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-blue-800/60 text-cyan-300 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.25)]">
            <span className="material-symbols-outlined text-[22px]">domain</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap relative z-10">
          {CLIENTES.map((c) => (
            <span
              key={c.id}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold border transition-colors ${
                clientesConLotes.has(c.id)
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                  : "bg-slate-950 text-slate-500 border-slate-800"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Card 4: Último lote HUD */}
      <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/15 transition-all" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Último Evento
            </span>
            <span className="text-sm font-bold text-white mt-1 truncate font-mono">
              {ultimoLote ? ultimoLote.nombreArchivo : "Sin lotes aún"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/60 text-purple-300 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <span className="material-symbols-outlined text-[22px]">history</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono relative z-10">
          <span>
            {ultimoLote ? formatRelativeTime(ultimoLote.creadoEn?.toDate()) : "—"}
          </span>
          {ultimoLote && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-800/50">
              {ultimoLote.estado}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
