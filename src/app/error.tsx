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
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface-container-lowest shadow-xl border border-surface-container text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">warning</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Ocurrió un Error Inesperado</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {error.message || "Se produjo una excepción durante la ejecución del módulo."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar Operación
        </button>
      </div>
    </div>
  );
}
