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
    <main className="w-full min-h-screen bg-[#080c14] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Luces y Neones de Fondo (Dark Obsidian & Neon Glow) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      <div className="flex flex-col w-full max-w-4xl relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden bg-[#0d131f]/95 border border-slate-800 shadow-[0_0_60px_-15px_rgba(16,185,129,0.18)] backdrop-blur-xl">
          
          {/* Panel Izquierdo: Identidad Dark Obsidian */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0a0f1d] via-[#0f172a] to-[#1a1033] p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative">
            <div className="flex flex-col gap-6">
              {/* Logo con brillo Neón */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  <span className="material-symbols-outlined text-[26px] text-emerald-400">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                    RPA LAD-6819
                  </span>
                  <span className="text-lg font-bold tracking-tight text-white">
                    Orquestador Nómina
                  </span>
                </div>
              </div>

              {/* Título Principal */}
              <div className="flex flex-col gap-2 mt-2">
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                  Control & Conciliación de Descuentos
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Infraestructura centralizada para liquidación paramétrica, validación de layouts y dispersión transaccional segura.
                </p>
              </div>

              {/* Pilares con Acabado Neón */}
              <div className="flex flex-col gap-3.5 pt-2">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Reglas Paramétricas por Entidad</span>
                    <span className="text-slate-400 text-[11px]">Validación automática de topes, porcentajes y políticas corporativas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">dataset</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Ingesta de Lotes & Descuentos Únicos</span>
                    <span className="text-slate-400 text-[11px]">Procesamiento instantáneo con bitácora de novedades y reportes XLSX.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-violet-400 text-[16px]">shield</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Segregación Estricta Multi-Entidad</span>
                    <span className="text-slate-400 text-[11px]">Aislamiento de información por empresa con auditoría inmutable.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de Panel */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800 mt-6">
              <span>Portal Operativo v2.4</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistema Seguro
              </span>
            </div>
          </div>

          {/* Panel Derecho: Formulario de Autenticación */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-[#0d131f]">
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase">
                    Acceso Seguro
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
                  Iniciar Sesión
                </h1>
                <p className="text-xs text-slate-400">
                  Ingresa tu cuenta institucional. El sistema asignará automáticamente tu rol y empresa autorizada.
                </p>
              </div>

              <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
                {/* Correo Institucional */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider" htmlFor="email-input">
                    Correo Institucional
                  </label>
                  <div className="relative flex items-center rounded-xl bg-[#131b2c] border border-slate-700/80 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/30 transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px]">
                      alternate_email
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                      placeholder="analista@empresa.com"
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Contraseña de Acceso */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider" htmlFor="password-input">
                    Contraseña
                  </label>
                  <div className="relative flex items-center rounded-xl bg-[#131b2c] border border-slate-700/80 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/30 transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px]">
                      lock
                    </span>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(event) => onPasswordChange(event.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      title="Mostrar u ocultar contraseña"
                      onClick={onToggleShowPassword}
                      className="absolute right-3.5 text-slate-400 hover:text-white focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recordar Estación */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(event) => onRememberDeviceChange(event.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                    />
                    <span className="text-xs text-slate-400 select-none">
                      Recordar estación de trabajo
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal Neón */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "login"}
                  </span>
                  <span>{isSigningIn ? "Validando credenciales..." : "Ingresar a la Plataforma"}</span>
                </button>
              </form>

              {/* Selector Rápido de Perfiles (Demostración) */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-xs text-slate-400 hover:text-emerald-400 font-medium flex items-center justify-between w-full p-1.5 rounded hover:bg-slate-800/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-400">key</span>
                    <span>Accesos rápidos de demostración</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {mostrarAyudaEvaluacion ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {mostrarAyudaEvaluacion && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-[#131b2c] rounded-xl border border-slate-800 text-xs animate-fadeIn">
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
                          className={`p-2 rounded-lg text-left border flex flex-col justify-between transition-all ${
                            email === c.email
                              ? "bg-emerald-500/15 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              : "bg-[#0d131f] border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-[11px] text-white truncate">
                              {etiqueta}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                c.rol === "ADMIN"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : c.rol === "SUPERVISOR"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {c.rol}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate font-mono mt-1">
                            {c.email.split("@")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de Confidencialidad */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
              <span>Acceso protegido bajo políticas de seguridad y confidencialidad corporativa</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
