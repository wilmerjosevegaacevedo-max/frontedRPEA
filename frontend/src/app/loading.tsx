export default function Loading() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-surface-container-lowest shadow-xl border border-surface-container text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative">
          <span className="material-symbols-outlined text-[36px] animate-spin">
            sync
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Cargando Orquestador...
          </span>
          <span className="font-body-xs text-body-xs text-on-surface-variant">
            Sincronizando estado de lotes, reglas de negocio y perfil de usuario.
          </span>
        </div>
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-2">
          <div className="bg-primary h-full w-2/3 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
