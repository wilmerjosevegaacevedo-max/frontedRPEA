import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#030712] cyber-grid p-6 text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 backdrop-blur-xl shadow-2xl border border-slate-800 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">error_outline</span>
        </div>
        <h1 className="text-xl font-bold text-white font-mono tracking-tight">404 - Página No Encontrada</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          El recurso o ruta solicitada en el Orquestador RPA no existe o fue reubicada.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all active:scale-[0.98] shadow-lg border border-cyan-500/40"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
