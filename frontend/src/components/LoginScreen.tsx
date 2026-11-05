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
      {/* Halos de Luz Ciberespacial de Fondo */}
      <div className="absolute w-[650px] h-[650px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-indigo-600/10 blur-[140px] rounded-full pointer-events-none -top-36 -left-36" />
      <div className="absolute w-[550px] h-[550px] bg-gradient-to-bl from-purple-600/15 via-blue-500/10 to-cyan-500/15 blur-[130px] rounded-full pointer-events-none -bottom-36 -right-36" />

      <div className="flex flex-col w-full max-w-4xl relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-950/85 backdrop-blur-2xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)]">
          
          {/* Panel Izquierdo: Sala de Comando y Misión RPA */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/80 text-white p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-at-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col gap-6 relative z-10">
              {/* Logo y Nombre Institucional HUD */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/40">
                  <span className="material-symbols-outlined text-[26px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    RPA LAD-6819
                  </span>
                  <span className="text-lg font-bold tracking-tight text-white">
                    Orquestador de Nómina
                  </span>
                </div>
              </div>

              {/* Título y Misión */}
              <div className="flex flex-col gap-2 mt-2">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  Control & Conciliación <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Automatizada</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Consola centralizada para validación algorítmica de planillas, aplicación de reglas por cliente y auditoría de transacciones en tiempo real.
                </p>
              </div>

              {/* Pilares High-Tech */}
              <div className="flex flex-col gap-3.5 pt-2">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Motor de Reglas Paramétricas</span>
                    <span className="text-slate-400 text-[11px]">Validación algorítmica de topes, porcentajes y políticas vigentes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <span className="material-symbols-outlined text-[16px]">dataset</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Ingesta de Lotes & Pagos Únicos</span>
                    <span className="text-slate-400 text-[11px]">Procesamiento instantáneo con emisión de reportes conciliados.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <span className="material-symbols-outlined text-[16px]">shield_lock</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Aislamiento y Seguridad RBAC</span>
                    <span className="text-slate-400 text-[11px]">Segregación estricta de datos por empresa con bitácora inmutable.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del Sistema HUD */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/80 mt-6 relative z-10">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                </span>
                SISTEMA OPERACIONAL
              </span>
              <span className="text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded text-[10px]">
                v2.4.0-RPA
              </span>
            </div>
          </div>

          {/* Panel Derecho: Consola de Acceso Futurista */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-slate-900/60 backdrop-blur-xl relative">
            <div>
              {/* Encabezado del Formulario */}
              <div className="flex flex-col gap-1 pb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    Portal de Autenticación
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
                  Ingreso al Sistema
                </h1>
                <p className="text-xs text-slate-400">
                  Ingrese sus credenciales de operador autorizadas para continuar
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                {/* Campo Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between" htmlFor="email-input">
                    <span>Correo Institucional</span>
                    <span className="text-[10px] text-cyan-400/80 font-normal">Identidad SSO / TdeA</span>
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px]">
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
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono" htmlFor="password-input">
                    Clave de Acceso
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px]">
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
                      className="w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={onToggleShowPassword}
                      className="absolute right-3.5 text-slate-400 hover:text-cyan-300 focus:outline-none transition-colors"
                      aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recordar Dispositivo */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => onRememberDeviceChange(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                    />
                    <span className="text-xs text-slate-300 select-none">
                      Mantener sesión segura activa
                    </span>
                  </label>
                </div>

                {/* Mensaje de Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/70 text-red-200 border border-red-800/80 text-xs font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="material-symbols-outlined text-red-400 text-[18px]">gpp_maybe</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón de Submit Futurista */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-300/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className={`material-symbols-outlined text-[19px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "login"}
                  </span>
                  <span>{isSigningIn ? "Validando credenciales..." : "Acceder al Orquestador"}</span>
                </button>
              </form>

              {/* Selector Rápido de Perfiles HUD */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-xs text-slate-400 hover:text-cyan-300 font-medium flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-mono">
                    <span className="material-symbols-outlined text-[16px] text-cyan-400">vpn_key</span>
                    <span>Perfiles de Demostración y Prueba</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {mostrarAyudaEvaluacion ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {mostrarAyudaEvaluacion && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs animate-fadeIn">
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
                          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                            email === c.email
                              ? "bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-[11px] text-white truncate">
                              {etiqueta}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                c.rol === "ADMIN"
                                  ? "bg-red-950/80 text-red-300 border border-red-800/60"
                                  : c.rol === "SUPERVISOR"
                                  ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                              }`}
                            >
                              {c.rol}
                            </span>
                          </div>
                          <span className="text-[10px] text-cyan-400/70 truncate font-mono mt-1">
                            {c.email.split("@")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de Seguridad */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="material-symbols-outlined text-[14px] text-cyan-500">lock</span>
              <span>Conexión cifrada TLS 1.3 • Auditoría biométrica de sesión</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
