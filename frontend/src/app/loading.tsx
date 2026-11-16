export default function Loading() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#030712] cyber-grid p-6 text-slate-100">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/90 backdrop-blur-xl shadow-2xl border border-slate-800 text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 relative">
          <span className="material-symbols-outlined text-[36px] animate-spin">
            sync
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold text-white font-mono tracking-tight">
            Cargando Orquestador...
          </span>
          <span className="text-xs text-slate-400">
            Sincronizando estado de lotes, reglas de negocio y perfil de usuario.
          </span>
        </div>
        <div className="w-full bg-slate-950 border border-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div className="bg-cyan-500 h-full w-2/3 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
