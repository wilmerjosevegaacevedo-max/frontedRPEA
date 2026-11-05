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
    <main className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col w-full max-w-4xl relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xl">
          
          {/* Panel Izquierdo: Azul Marino Corporativo Institucional */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="flex flex-col gap-6">
              {/* Logo y Nombre Institucional */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
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
                  Control & Conciliación de Descuentos
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistema centralizado para la validación de archivos, aplicación de reglas de negocio por cliente y auditoría de transacciones en tiempo real.
                </p>
              </div>

              {/* Pilares Corporativos */}
              <div className="flex flex-col gap-3.5 pt-2">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Reglas Paramétricas por Entidad</span>
                    <span className="text-slate-400 text-[11px]">Validación automática de topes, porcentajes y políticas vigentes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                    <span className="material-symbols-outlined text-[16px]">dataset</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Ingesta de Lotes & Pagos Únicos</span>
                    <span className="text-slate-400 text-[11px]">Procesamiento instantáneo con emisión de reportes conciliados.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-white text-[13px]">Aislamiento y Seguridad RBAC</span>
                    <span className="text-slate-400 text-[11px]">Segregación estricta de datos por empresa con bitácora inmutable.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de Panel Izquierdo */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800 mt-6">
              <span>Portal Corporativo v2.4</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Servidor en Línea</span>
              </span>
            </div>
          </div>

          {/* Panel Derecho: Formulario Corporativo Limpio */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider border border-blue-100">
                    Acceso Autorizado
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  Iniciar Sesión
                </h1>
                <p className="text-xs text-slate-500">
                  Ingresa tu correo institucional asignado. El sistema validará tu rol y empresa de forma automática.
                </p>
              </div>

              <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
                {/* Correo Institucional */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="email-input">
                    Correo Institucional
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-300 focus-within:border-blue-700 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-700/20 transition-all">
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
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password-input">
                    Contraseña
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-300 focus-within:border-blue-700 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-700/20 transition-all">
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
                      className="w-full pl-10 pr-10 py-3 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      title="Mostrar u ocultar contraseña"
                      onClick={onToggleShowPassword}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 focus:outline-none"
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
                      className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-0 cursor-pointer accent-blue-700"
                    />
                    <span className="text-xs text-slate-600 select-none">
                      Recordar estación de trabajo segura
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal Elegante con Profundidad y Brillo */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_4px_14px_rgba(30,64,175,0.38)] hover:shadow-[0_6px_20px_rgba(30,64,175,0.45)] border border-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className={`material-symbols-outlined text-[19px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "login"}
                  </span>
                  <span>{isSigningIn ? "Validando credenciales..." : "Acceder al Orquestador"}</span>
                </button>
              </form>

              {/* Selector Rápido de Perfiles (Discreto) */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-xs text-slate-500 hover:text-blue-700 font-medium flex items-center justify-between w-full p-1.5 rounded hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">key</span>
                    <span>Perfiles de Demostración</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {mostrarAyudaEvaluacion ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {mostrarAyudaEvaluacion && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs animate-fadeIn">
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
                          className={`p-2.5 rounded-xl text-left border flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 ${
                            email === c.email
                              ? "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-[11px] text-slate-800 truncate">
                              {etiqueta}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                c.rol === "ADMIN"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : c.rol === "SUPERVISOR"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {c.rol}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 truncate font-mono mt-1">
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
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Acceso protegido bajo políticas de seguridad y confidencialidad corporativa</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
