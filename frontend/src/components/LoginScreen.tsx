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
    <main className="w-full min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col w-full items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl shadow-2xl overflow-hidden bg-surface-container-lowest border border-surface-container">
          {/* Panel Izquierdo: Identidad Corporativa */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-primary to-indigo-950 text-on-primary p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/15">
                  <span className="material-symbols-outlined text-[26px] text-white">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-code-sm text-code-sm text-emerald-300 font-bold tracking-widest uppercase">
                    RPA LAD-6819
                  </span>
                  <span className="font-headline-sm text-headline-sm text-white font-bold tracking-tight">
                    Orquestador Nómina
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Automatización & Control de Descuentos de Nómina
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Infraestructura centralizada de liquidación paramétrica, conciliación en tiempo real y dispersión transaccional segura.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Next.js 14 • TypeScript</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 text-xs font-semibold border border-white/10">
                  <span className="material-symbols-outlined text-[13px]">shield</span>
                  <span>TLS 1.3 End-to-End</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2 bg-black/25 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Módulos de Seguridad Activos
                </span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                      Control de Acceso RBAC
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">Activo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-emerald-400">domain_verification</span>
                      Aislamiento Multi-Tenant
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">Segregado</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-emerald-400">verified</span>
                      Auditoría Inmutable
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">Firebase</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-white/10 mt-6">
              <span>PROD-NODE: #LAD6819</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Portal Corporativo
              </span>
            </div>
          </div>

          {/* Panel Derecho: Formulario Limpio & Sobrio */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    Acceso Autorizado
                  </span>
                  <span className="text-xs text-on-surface-variant font-code-sm">• Solo Personal Registrado</span>
                </div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight mt-1">
                  Iniciar Sesión en el Orquestador
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Ingresa tu correo institucional asignado. El sistema autenticará tu rol y empresa automáticamente.
                </p>
              </div>

              <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
                {/* Correo Institucional */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center justify-between" htmlFor="email-input">
                    <span>Correo Institucional</span>
                    <span className="text-[11px] font-normal text-on-surface-variant font-mono">SSO Corporativo</span>
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low border border-surface-container focus-within:border-primary focus-within:bg-white focus-within:shadow-sm transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                      alternate_email
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                      placeholder="nombre.apellido@empresa.com"
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-on-surface text-sm placeholder:text-outline outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Contraseña de Acceso */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="password-input">
                    Contraseña de Acceso
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low border border-surface-container focus-within:border-primary focus-within:bg-white focus-within:shadow-sm transition-all">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                      lock
                    </span>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(event) => onPasswordChange(event.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-transparent text-on-surface text-sm placeholder:text-outline outline-none"
                    />
                    <button
                      type="button"
                      title="Mostrar u ocultar contraseña"
                      onClick={onToggleShowPassword}
                      className="absolute right-3.5 text-on-surface-variant hover:text-on-surface focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
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
                      className="w-4 h-4 rounded bg-surface-container accent-primary text-primary focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant select-none font-medium">
                      Recordar estación de trabajo segura
                    </span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Conexión Cifrada</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal de Acceso */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-2 w-full py-3.5 px-6 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-[20px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "arrow_forward"}
                  </span>
                  <span>{isSigningIn ? "Verificando Credenciales..." : "Acceder al Centro de Control"}</span>
                </button>
              </form>

              {/* Botón Discreto para Jurado / Evaluación Académica */}
              <div className="mt-4 pt-4 border-t border-surface-container flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-[11px] text-on-surface-variant hover:text-primary font-medium flex items-center justify-between w-full p-1.5 rounded hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-primary">school</span>
                    Perfiles de Prueba para Sustentación
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {mostrarAyudaEvaluacion ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {mostrarAyudaEvaluacion && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-surface-container-low rounded-xl border border-surface-container text-xs animate-fadeIn">
                    {CREDENCIALES_SISTEMA.map((c) => (
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
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "bg-white border-surface-container-highest hover:bg-surface-container"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-[11px] text-on-surface truncate">
                            {c.empresaId === "TODAS"
                              ? c.rol === "ADMIN"
                                ? "Admin Master"
                                : "Auditor"
                              : c.empresaId.toUpperCase()}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1 rounded ${c.rol === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : c.rol === "SUPERVISOR"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                              }`}
                          >
                            {c.rol}
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant truncate font-mono mt-1">
                          {c.email.split("@")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">verified_user</span>
              <span>
                Toda autenticación y operación es auditada formalmente bajo políticas de seguridad inmutable.
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
