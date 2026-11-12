"use client";

import { useState } from "react";
import { CREDENCIALES_SISTEMA, CredencialEmpresa } from "../types";

type LoginScreenProps = {
  email: string;
  password: string;
  showPassword: boolean;
  rememberDevice: boolean;
  isSigningIn: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onRememberDeviceChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onSeleccionarCredencialRapida?: (cred: CredencialEmpresa) => void;
};

export function LoginScreen({
  email,
  password,
  showPassword,
  rememberDevice,
  isSigningIn,
  error,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onRememberDeviceChange,
  onSubmit,
  onSeleccionarCredencialRapida,
}: LoginScreenProps) {
  const [mostrarAyudaEvaluacion, setMostrarAyudaEvaluacion] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#030712] cyber-grid flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Halos de Luz Ciberespacial */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-transparent blur-[140px] rounded-full pointer-events-none -top-32 -left-32" />
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-blue-600/15 to-cyan-500/15 blur-[130px] rounded-full pointer-events-none -bottom-32 -right-32" />

      <div className="flex flex-col w-full max-w-3xl relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-950/85 backdrop-blur-2xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.12)]">
          
          {/* Panel Izquierdo: Identidad & Estado HUD */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/70 text-white p-7 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <div className="flex flex-col gap-6">
              {/* Logo y Nombre */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300/50">
                  <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                    RPA LAD-6819 • REPO PRIVADO ACTIVO
                  </span>
                  <span className="text-base font-bold tracking-tight text-white">
                    Orquestador de Nómina
                  </span>
                </div>
              </div>

              {/* Título Limpio */}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-white leading-snug">
                  Conciliación de Descuentos
                </h2>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Automatización integral de pólizas y retenciones multi-empresa.
                </p>
              </div>

              {/* Chips de Capacidades (Sin texto redundante) */}
              <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800/90">
                  <span className="material-symbols-outlined text-cyan-400 text-[16px]">verified</span>
                  <span>Motor de Reglas Paramétrico</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800/90">
                  <span className="material-symbols-outlined text-cyan-400 text-[16px]">dataset</span>
                  <span>Ingesta Masiva e Individual</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800/90">
                  <span className="material-symbols-outlined text-cyan-400 text-[16px]">shield</span>
                  <span>Seguridad y Segregación RBAC</span>
                </div>
              </div>
            </div>

            {/* Estado del Robot */}
            <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/80 mt-4">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                OPERACIONAL
              </span>
              <span className="text-cyan-400/80">v2.4.0</span>
            </div>
          </div>

          {/* Panel Derecho: Formulario Limpio */}
          <div className="lg:col-span-7 p-7 md:p-8 flex flex-col justify-between bg-slate-900/50 backdrop-blur-xl">
            <div>
              {/* Encabezado */}
              <div className="flex flex-col gap-1 pb-5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Ingreso al Sistema
                </h1>
                <p className="text-xs text-slate-400">
                  Autenticación de operador autorizado
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                {/* Campo Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono" htmlFor="email-input">
                    Correo Institucional
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                      alternate_email
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      placeholder="operador@tdea.edu.co"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono" htmlFor="password-input">
                    Clave de Acceso
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                      lock_open
                    </span>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={onToggleShowPassword}
                      className="absolute right-3.5 text-slate-400 hover:text-cyan-300 focus:outline-none transition-colors"
                      aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recordar Sesión */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => onRememberDeviceChange(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                    />
                    <span className="text-xs text-slate-400 select-none">
                      Mantener sesión activa
                    </span>
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-2.5 rounded-xl bg-red-950/70 text-red-200 border border-red-800/80 text-xs font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="material-symbols-outlined text-red-400 text-[16px]">gpp_maybe</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal (Verificación de Conexión en Esmeralda Neón) */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-1 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] border border-emerald-300/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "login"}
                  </span>
                  <span>{isSigningIn ? "Validando..." : "Acceder al Orquestador"}</span>
                </button>
              </form>

              {/* Selector Rápido de Perfiles Demo */}
              <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-xs text-slate-400 hover:text-cyan-300 font-medium flex items-center justify-between w-full p-1 rounded hover:bg-slate-800/40 transition-colors font-mono"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-cyan-400">vpn_key</span>
                    <span>Perfiles Rápidos de Demostración</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {mostrarAyudaEvaluacion ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {mostrarAyudaEvaluacion && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs animate-fadeIn">
                    {CREDENCIALES_SISTEMA.map((c) => {
                      const etiqueta =
                        c.rol === "ADMIN"
                          ? "Admin Master"
                          : c.rol === "SUPERVISOR"
                          ? "Auditor Central"
                          : c.empresaId.toUpperCase();

                      return (
                        <button
                          key={c.email}
                          type="button"
                          onClick={() => {
                            if (onSeleccionarCredencialRapida) {
                              onSeleccionarCredencialRapida(c);
                            } else {
                              onEmailChange(c.email);
                              onPasswordChange(c.passwordDefault);
                            }
                          }}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                            email === c.email
                              ? "bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-[11px] text-white truncate">
                              {etiqueta}
                            </span>
                            <span className="text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-300">
                              {c.rol}
                            </span>
                          </div>
                          <span className="text-[10px] text-cyan-400/80 truncate font-mono mt-0.5">
                            {c.email.split("@")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
