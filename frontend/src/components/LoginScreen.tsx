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
    <main className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col w-full items-center justify-center relative">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl shadow-xl overflow-hidden bg-white border border-slate-200">
          
          {/* Panel Izquierdo: Identidad Corporativa Sobria */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-8 md:p-10 flex flex-col justify-between relative">
            <div className="flex flex-col gap-6">
              {/* Logo y Nombre */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/15 shadow-sm">
                  <span className="material-symbols-outlined text-[24px] text-indigo-300">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    RPA LAD-6819
                  </span>
                  <span className="text-lg font-bold tracking-tight text-white">
                    Orquestador de Nómina
                  </span>
                </div>
              </div>

              {/* Propuesta de Valor */}
              <div className="flex flex-col gap-2.5 mt-2">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  Control & Conciliación de Descuentos Empresariales
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Plataforma centralizada para la validación de layouts, liquidación paramétrica de novedades y conciliación en tiempo real.
                </p>
              </div>

              {/* Pilares Funcionales */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">verified</span>
                  <div>
                    <span className="font-semibold block text-white">Reglas Paramétricas por Entidad</span>
                    <span className="text-slate-300 text-[11px]">Validación automática de topes, porcentajes y políticas corporativas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">dataset</span>
                  <div>
                    <span className="font-semibold block text-white">Ingesta de Lotes y Descuentos Únicos</span>
                    <span className="text-slate-300 text-[11px]">Depuración instantánea con reportes descargables y alertas de inconsistencias.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">security</span>
                  <div>
                    <span className="font-semibold block text-white">Segregación Estricta Multi-Entidad</span>
                    <span className="text-slate-300 text-[11px]">Aislamiento de información por empresa con auditoría inmutable.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de Panel Izquierdo */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-white/10 mt-6">
              <span>Portal Operativo v2.4</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Sistema Seguro
              </span>
            </div>
          </div>

          {/* Panel Derecho: Formulario de Autenticación */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Iniciar Sesión
                </h1>
                <p className="text-xs text-slate-500">
                  Ingresa tu cuenta institucional. El sistema asignará automáticamente tu rol y empresa autorizada.
                </p>
              </div>

              <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
                {/* Correo Institucional */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="email-input">
                    Correo Institucional
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-600 focus-within:bg-white focus-within:shadow-sm transition-all">
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

                {/* Contraseña de Acceso */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password-input">
                    Contraseña
                  </label>
                  <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-600 focus-within:bg-white focus-within:shadow-sm transition-all">
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
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 select-none">
                      Recordar estación de trabajo
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botón Principal de Acceso */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-2 w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 hover:shadow active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isSigningIn ? "animate-spin" : ""}`}>
                    {isSigningIn ? "sync" : "login"}
                  </span>
                  <span>{isSigningIn ? "Validando credenciales..." : "Ingresar a la Plataforma"}</span>
                </button>
              </form>

              {/* Selector Rápido de Perfiles (Discreto y Ordenado) */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarAyudaEvaluacion((v) => !v)}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-between w-full p-1.5 rounded hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-indigo-500">key</span>
                    <span>Accesos rápidos de demostración</span>
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
                          className={`p-2 rounded-lg text-left border flex flex-col justify-between transition-all ${
                            email === c.email
                              ? "bg-indigo-50 border-indigo-500 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-[11px] text-slate-800 truncate">
                              {etiqueta}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                c.rol === "ADMIN"
                                  ? "bg-red-100 text-red-700"
                                  : c.rol === "SUPERVISOR"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
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

            {/* Aviso de Confidencialidad Minimalista */}
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
