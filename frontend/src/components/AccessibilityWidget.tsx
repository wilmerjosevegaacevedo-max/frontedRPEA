"use client";

import { useEffect, useState } from "react";

type FontScale = 100 | 115 | 130;
type ThemeMode = "dark" | "light";

type A11yPrefs = {
  theme: ThemeMode;
  fontScale: FontScale;
  highContrast: boolean;
  readableSpacing: boolean;
  reduceMotion: boolean;
  focusRing: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  theme: "dark",
  fontScale: 100,
  highContrast: false,
  readableSpacing: false,
  reduceMotion: false,
  focusRing: true,
};

const STORAGE_KEY = "rpa_a11y_prefs";

function aplicarPreferenciasDOM(prefs: A11yPrefs) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.style.fontSize = `${prefs.fontScale}%`;
  html.classList.toggle("theme-light", prefs.theme === "light");
  html.classList.toggle("a11y-high-contrast", prefs.highContrast);
  html.classList.toggle("a11y-readable-spacing", prefs.readableSpacing);
  html.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
  html.classList.toggle("a11y-focus-ring", prefs.focusRing);
}

export function AccessibilityWidget() {
  const [abierto, setAbierto] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const [anuncio, setAnuncio] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_PREFS, ...JSON.parse(saved) } as A11yPrefs;
        setPrefs(parsed);
        aplicarPreferenciasDOM(parsed);
      } else {
        aplicarPreferenciasDOM(DEFAULT_PREFS);
      }
    } catch {
      aplicarPreferenciasDOM(DEFAULT_PREFS);
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto]);

  const actualizar = (cambio: Partial<A11yPrefs>, mensaje?: string) => {
    const nuevas = { ...prefs, ...cambio };
    setPrefs(nuevas);
    aplicarPreferenciasDOM(nuevas);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
      } catch {}
    }
    if (mensaje) setAnuncio(mensaje);
  };

  const restablecer = () => {
    actualizar(DEFAULT_PREFS, "Preferencias de accesibilidad restablecidas a valores predeterminados.");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print flex flex-col items-end">
      {/* Región aria-live para anunciar cambios a lectores de pantalla */}
      <div className="sr-only" aria-live="polite" role="status">
        {anuncio}
      </div>

      {abierto && (
        <div
          id="panel-accesibilidad"
          role="dialog"
          aria-label="Configuración de Accesibilidad WCAG"
          className="mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950/95 border border-slate-700 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl p-4 flex flex-col gap-3.5 text-slate-100"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]" aria-hidden="true">
                accessibility_new
              </span>
              <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Accesibilidad (WCAG 2.1)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar panel de accesibilidad"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>

          {/* Apariencia: Tema Claro / Oscuro */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Apariencia (Tema)
            </span>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Seleccionar tema visual">
              <button
                type="button"
                aria-pressed={prefs.theme === "dark"}
                onClick={() => actualizar({ theme: "dark" }, "Tema oscuro activado.")}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                  prefs.theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  dark_mode
                </span>
                Oscuro
              </button>
              <button
                type="button"
                aria-pressed={prefs.theme === "light"}
                onClick={() => actualizar({ theme: "light" }, "Tema claro activado.")}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                  prefs.theme === "light"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  light_mode
                </span>
                Claro
              </button>
            </div>
          </div>

          {/* Tamaño de Texto */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Tamaño de Fuente
            </span>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Tamaño de fuente">
              {([100, 115, 130] as FontScale[]).map((escala) => {
                const activo = prefs.fontScale === escala;
                return (
                  <button
                    key={escala}
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      actualizar({ fontScale: escala }, `Tamaño de texto ajustado al ${escala}%.`)
                    }
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                      activo
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {escala === 100 ? "Normal" : escala === 115 ? "Grande" : "Máximo"} ({escala}%)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles de Accesibilidad */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={prefs.highContrast}
              onClick={() =>
                actualizar(
                  { highContrast: !prefs.highContrast },
                  !prefs.highContrast ? "Modo alto contraste activado." : "Modo alto contraste desactivado."
                )
              }
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <span className="material-symbols-outlined text-[18px] text-cyan-400" aria-hidden="true">
                  contrast
                </span>
                Alto Contraste
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  prefs.highContrast
                    ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {prefs.highContrast ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.readableSpacing}
              onClick={() =>
                actualizar(
                  { readableSpacing: !prefs.readableSpacing },
                  !prefs.readableSpacing ? "Espaciado de lectura fácil activado." : "Espaciado estándar restaurado."
                )
              }
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <span className="material-symbols-outlined text-[18px] text-cyan-400" aria-hidden="true">
                  format_line_spacing
                </span>
                Lectura Fácil (Espaciado)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  prefs.readableSpacing
                    ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {prefs.readableSpacing ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.reduceMotion}
              onClick={() =>
                actualizar(
                  { reduceMotion: !prefs.reduceMotion },
                  !prefs.reduceMotion ? "Animaciones reducidas activadas." : "Animaciones estándar activadas."
                )
              }
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <span className="material-symbols-outlined text-[18px] text-cyan-400" aria-hidden="true">
                  motion_photos_off
                </span>
                Reducir Animaciones
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  prefs.reduceMotion
                    ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {prefs.reduceMotion ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.focusRing}
              onClick={() =>
                actualizar(
                  { focusRing: !prefs.focusRing },
                  !prefs.focusRing ? "Resaltado de foco por teclado activado." : "Resaltado de foco estándar."
                )
              }
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <span className="material-symbols-outlined text-[18px] text-cyan-400" aria-hidden="true">
                  keyboard
                </span>
                Foco Visible (Teclado)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  prefs.focusRing
                    ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {prefs.focusRing ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={restablecer}
            className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono font-bold transition-colors"
          >
            Restablecer Valores
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="panel-accesibilidad"
          aria-label="Configurar accesibilidad"
          title="Opciones de Accesibilidad (WCAG 2.1)"
          className="w-11 h-11 rounded-full bg-slate-900/95 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center justify-center transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            accessibility_new
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            actualizar(
              { theme: prefs.theme === "dark" ? "light" : "dark" },
              prefs.theme === "dark" ? "Tema claro activado." : "Tema oscuro activado."
            )
          }
          aria-label={prefs.theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          title={prefs.theme === "dark" ? "Cambiar a Tema Claro" : "Cambiar a Tema Oscuro"}
          className="h-11 px-3 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-mono font-bold transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined text-[18px] text-amber-400" aria-hidden="true">
            {prefs.theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span>{prefs.theme === "dark" ? "Claro" : "Oscuro"}</span>
        </button>
      </div>
    </div>
  );
}
