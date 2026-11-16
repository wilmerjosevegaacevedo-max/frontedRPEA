"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado por ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#030712] cyber-grid p-6 text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 backdrop-blur-xl shadow-2xl border border-slate-800 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">warning</span>
        </div>
        <h1 className="text-xl font-bold text-white font-mono tracking-tight">Ocurrió un Error Inesperado</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error.message || "Se produjo una excepción durante la ejecución del módulo."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all active:scale-[0.98] shadow-lg border border-cyan-500/40"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar Operación
        </button>
      </div>
    </div>
  );
}
