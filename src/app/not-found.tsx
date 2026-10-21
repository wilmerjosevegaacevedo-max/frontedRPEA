import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface-container-lowest shadow-xl border border-surface-container text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">error_outline</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">404 - Página No Encontrada</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          El recurso o ruta solicitada en el Orquestador RPA no existe o fue reubicada.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
