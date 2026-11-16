import { useMemo, useState } from "react";
import { CLIENTES, Empresa, Job, grupoEstado, RolUsuario } from "../types";
import { formatRelativeTime } from "../utils/format";

type FiltroEstado = "todos" | "proceso" | "exito" | "fallo";

type JobsTableProps = {
  jobs: Job[];
  empresas?: Empresa[];
  onSelectJob: (jobId: string) => void;
  onReintentar: (jobId: string) => void;
  reintentandoId: string | null;
  empresaAsignada?: string;
  rolUsuario?: RolUsuario;
};

function badgeEstado(job: Job) {
  const grupo = grupoEstado(job.estado);
  if (grupo === "proceso") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        {job.estado.toUpperCase()}
      </span>
    );
  }
  if (grupo === "exito") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {job.estado.toUpperCase()}
      </span>
    );
  }
  if (grupo === "fallo") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        {job.estado.toUpperCase()}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
      {job.estado.toUpperCase()}
    </span>
  );
}

export function JobsTable({
  jobs,
  empresas,
  onSelectJob,
  onReintentar,
  reintentandoId,
  empresaAsignada,
}: JobsTableProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const esDelimitado = Boolean(empresaAsignada && empresaAsignada !== "TODAS");
  const opcionesClientes = empresas && empresas.length > 0
    ? empresas.map((e) => ({ id: e.id, label: e.nombre }))
    : CLIENTES;

  const conteos = useMemo(
    () => ({
      todos: jobs.length,
      proceso: jobs.filter((j) => grupoEstado(j.estado) === "proceso").length,
      exito: jobs.filter((j) => grupoEstado(j.estado) === "exito").length,
      fallo: jobs.filter((j) => grupoEstado(j.estado) === "fallo").length,
    }),
    [jobs],
  );

  const jobsFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return jobs.filter((job) => {
      // Si el analista está delimitado a una empresa, rechazar lotes ajenos
      if (esDelimitado && job.cliente.toLowerCase() !== empresaAsignada!.toLowerCase()) {
        return false;
      }
      if (filtroEstado !== "todos" && grupoEstado(job.estado) !== filtroEstado) return false;
      if (!esDelimitado && filtroCliente && job.cliente.toLowerCase() !== filtroCliente.toLowerCase()) return false;
      if (
        termino &&
        !job.id.toLowerCase().includes(termino) &&
        !job.nombreArchivo.toLowerCase().includes(termino) &&
        !job.cliente.toLowerCase().includes(termino)
      ) {
        return false;
      }
      return true;
    });
  }, [jobs, filtroEstado, filtroCliente, busqueda, esDelimitado, empresaAsignada]);

  return (
    <div className="xl:col-span-8 flex flex-col gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm text-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[22px]">hub</span>
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">Monitor en Vivo de Lotes RPA</h2>
          </div>
          <span className="text-xs text-slate-400 font-sans mt-0.5">
            Sincronizado vía Firestore onSnapshot en tiempo real
          </span>
        </div>

        {/* Segmented Control de Filtros */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 flex-wrap">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all active:scale-[0.98] ${
              filtroEstado === "todos"
                ? "bg-slate-800 text-white border border-slate-700/80 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            type="button"
          >
            Todos ({conteos.todos})
          </button>
          <button
            onClick={() => setFiltroEstado("proceso")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] ${
              filtroEstado === "proceso"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                : "text-slate-400 hover:text-amber-400"
            }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PROCESANDO ({conteos.proceso})
          </button>
          <button
            onClick={() => setFiltroEstado("exito")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] ${
              filtroEstado === "exito"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                : "text-slate-400 hover:text-emerald-400"
            }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            EXITOSO ({conteos.exito})
          </button>
          <button
            onClick={() => setFiltroEstado("fallo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] ${
              filtroEstado === "fallo"
                ? "bg-red-500/20 text-red-300 border border-red-500/40 font-semibold"
                : "text-slate-400 hover:text-red-400"
            }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            FALLIDO ({conteos.fallo})
          </button>
        </div>
      </div>

        {/* Barra de Búsqueda y Filtro de Entidad */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
            search
          </span>
          <input
            aria-label="Buscar por Batch ID, archivo o cliente"
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors font-mono"
            placeholder="Buscar por Batch ID, archivo o cliente..."
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
        {esDelimitado ? (
          <div className="w-full sm:w-auto px-3 py-2 bg-slate-950/80 border border-slate-800 text-cyan-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[16px] text-cyan-400">apartment</span>
            <span>EMPRESA: {empresaAsignada?.toUpperCase()}</span>
          </div>
        ) : (
          <select
            aria-label="Filtrar por Cliente"
            className="w-full sm:w-48 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
            value={filtroCliente}
            onChange={(event) => setFiltroCliente(event.target.value)}
          >
            <option value="">Cliente: Todos</option>
            {opcionesClientes.map((c) => (
              <option key={c.id} value={c.id}>
                Cliente: {c.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla de Lotes */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[11px] tracking-wider border-b border-slate-800/80">
              <th className="py-3 px-4">Batch ID</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Archivo Origen</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
            {jobsFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-600 text-[28px]">search_off</span>
                    <span>No se encontraron lotes para este filtro.</span>
                  </div>
                </td>
              </tr>
            )}
            {jobsFiltrados.map((job) => {
              const grupo = grupoEstado(job.estado);
              return (
                <tr
                  key={job.id}
                  className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                    grupo === "proceso" ? "bg-amber-500/5" : grupo === "fallo" ? "bg-red-500/5" : ""
                  }`}
                  onClick={() => onSelectJob(job.id)}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono tabular-nums text-xs font-semibold text-cyan-400">{job.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px] rounded font-bold">
                      {job.cliente.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[200px] block" title={job.nombreArchivo}>
                      {job.nombreArchivo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {badgeEstado(job)}
                      {job.error && (
                        <span className="font-mono text-[11px] text-red-400 truncate max-w-[210px]" title={job.error}>
                          {job.error}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-400 font-mono">
                      {formatRelativeTime(job.creadoEn?.toDate())}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      {job.archivoSalida && (
                        <button
                          type="button"
                          onClick={() => onSelectJob(job.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 rounded-md text-xs font-mono font-medium border border-emerald-700/60 transition-all active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>ZIP</span>
                        </button>
                      )}
                      {grupo === "fallo" && (
                        <button
                          type="button"
                          disabled={reintentandoId === job.id}
                          onClick={() => onReintentar(job.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/80 hover:bg-red-900/80 text-red-300 rounded-md text-xs font-mono font-medium border border-red-700/60 transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                          <span className={`material-symbols-outlined text-[14px] ${reintentandoId === job.id ? "animate-spin" : ""}`}>
                            {reintentandoId === job.id ? "sync" : "replay"}
                          </span>
                          <span>Reintentar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-1 text-slate-400 font-mono text-xs">
        <span>
          Mostrando {jobsFiltrados.length} de {jobs.length} lotes registrados
        </span>
      </div>
    </div>
  );
}
