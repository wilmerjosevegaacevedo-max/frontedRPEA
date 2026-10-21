"use client";

import { useState } from "react";
import { Empresa, EMPRESAS_PREDETERMINADAS, RolUsuario } from "../types";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

type EmpresasModuleProps = {
  empresas: Empresa[];
  onActualizarEmpresas: (nuevas: Empresa[]) => void;
  rolUsuario: RolUsuario;
};

export function EmpresasModule({ empresas, onActualizarEmpresas, rolUsuario }: EmpresasModuleProps) {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(empresas[0] || null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [codigo, setCodigo] = useState("");
  const [porcentajeVida, setPorcentajeVida] = useState(1.5);
  const [porcentajeGmm, setPorcentajeGmm] = useState(2.0);
  const [porcentajeCostos, setPorcentajeCostos] = useState(1.0);
  const [topeMaximo, setTopeMaximo] = useState(500000);
  const [permiteSobregiro, setPermiteSobregiro] = useState(false);
  const [columnasStr, setColumnasStr] = useState("CEDULA, NOMBRE, SALARIO");

  const esAdmin = rolUsuario === "ADMIN";

  function iniciarNuevaEmpresa() {
    setEmpresaSeleccionada(null);
    setNombre("");
    setNit("");
    setCodigo("");
    setPorcentajeVida(1.5);
    setPorcentajeGmm(2.0);
    setPorcentajeCostos(1.0);
    setTopeMaximo(500000);
    setPermiteSobregiro(false);
    setColumnasStr("CEDULA, NOMBRE, SALARIO");
    setModoEdicion(true);
    setMensajeExito("");
    setMensajeError("");
  }

  function editarEmpresa(emp: Empresa) {
    setEmpresaSeleccionada(emp);
    setNombre(emp.nombre);
    setNit(emp.nit);
    setCodigo(emp.codigo);
    setPorcentajeVida(emp.reglas.porcentajeVida);
    setPorcentajeGmm(emp.reglas.porcentajeGmm);
    setPorcentajeCostos(emp.reglas.porcentajeCostos);
    setTopeMaximo(emp.reglas.topeMaximoDescuento);
    setPermiteSobregiro(emp.reglas.permiteSobregiro);
    setColumnasStr(emp.reglas.columnasRequeridas.join(", "));
    setModoEdicion(true);
    setMensajeExito("");
    setMensajeError("");
  }

  async function guardarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    if (!esAdmin) {
      setMensajeError("Solo los usuarios con rol ADMINISTRADOR pueden modificar reglas de negocio.");
      return;
    }

    if (!nombre.trim() || !nit.trim() || !codigo.trim()) {
      setMensajeError("El nombre, NIT y código de empresa son obligatorios.");
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    const columnasArray = columnasStr
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const id = empresaSeleccionada ? empresaSeleccionada.id : codigo.trim().toLowerCase();

    const empresaData: Empresa = {
      id,
      nombre: nombre.trim(),
      nit: nit.trim(),
      codigo: codigo.trim().toUpperCase(),
      reglas: {
        porcentajeVida: Number(porcentajeVida),
        porcentajeGmm: Number(porcentajeGmm),
        porcentajeCostos: Number(porcentajeCostos),
        topeMaximoDescuento: Number(topeMaximo),
        permiteSobregiro: Boolean(permiteSobregiro),
        columnasRequeridas: columnasArray.length > 0 ? columnasArray : ["CEDULA", "NOMBRE", "SALARIO"],
      },
    };

    try {
      if (db) {
        await setDoc(doc(collection(db, "empresas"), id), empresaData, { merge: true });
      }

      const existe = empresas.some((e) => e.id === id);
      const actualizadas = existe
        ? empresas.map((e) => (e.id === id ? empresaData : e))
        : [...empresas, empresaData];

      onActualizarEmpresas(actualizadas);
      setEmpresaSeleccionada(empresaData);
      setModoEdicion(false);
      setMensajeExito(`Empresa "${empresaData.nombre}" y reglas de negocio guardadas exitosamente.`);
    } catch (err: any) {
      setMensajeError(`Error al guardar en base de datos: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">domain</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Empresas y Reglas de Negocio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              Motor Dinámico
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Configuración de parámetros paramétricos de descuento (Vida, GMM, Costos, Topes Máximos) para cada empresa aliada.
          </p>
        </div>

        {esAdmin && (
          <button
            type="button"
            onClick={iniciarNuevaEmpresa}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Registrar Nueva Empresa
          </button>
        )}
      </div>

      {mensajeExito && (
        <div className="p-space-md rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-space-md rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Lista de Empresas Disponibles */}
        <div className="lg:col-span-5 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Empresas Registradas ({empresas.length})
            </span>
            <span className="text-xs text-on-surface-variant font-code-sm">Firestore: empresas</span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {empresas.map((emp) => {
              const estaSeleccionada = empresaSeleccionada?.id === emp.id;
              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setEmpresaSeleccionada(emp);
                    setModoEdicion(false);
                    setMensajeExito("");
                    setMensajeError("");
                  }}
                  className={`p-space-md rounded-xl cursor-pointer transition-all border flex flex-col gap-2 ${
                    estaSeleccionada
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-surface-container-low border-transparent hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {emp.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded font-code-sm text-code-sm bg-surface-container-highest text-primary font-bold">
                      {emp.codigo}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>NIT: {emp.nit}</span>
                    <span>Tope: ${emp.reglas.topeMaximoDescuento.toLocaleString("es-CO")} COP</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                      Vida: {emp.reglas.porcentajeVida}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                      GMM: {emp.reglas.porcentajeGmm}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      Costos: {emp.reglas.porcentajeCostos}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Detalle o Formulario de Edición */}
        <div className="lg:col-span-7 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          {modoEdicion ? (
            <form onSubmit={guardarEmpresa} className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {empresaSeleccionada ? `Editar Reglas: ${empresaSeleccionada.nombre}` : "Registrar Nueva Empresa"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModoEdicion(false)}
                  className="text-xs text-on-surface-variant hover:text-on-surface underline font-medium"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Multinacional de Seguros S.A."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Código Interno</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: MULTI"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">NIT de la Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 900.876.543-2"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
                />
              </div>

              {/* Parámetros de Descuento (Reglas de Negocio) */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-md border border-surface-container">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Porcentajes Paramétricos de Descuento
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Seguro de Vida (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={porcentajeVida}
                      onChange={(e) => setPorcentajeVida(parseFloat(e.target.value) || 0)}
                      className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Gastos Médicos GMM (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={porcentajeGmm}
                      onChange={(e) => setPorcentajeGmm(parseFloat(e.target.value) || 0)}
                      className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Costos Admin (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={porcentajeCostos}
                      onChange={(e) => setPorcentajeCostos(parseFloat(e.target.value) || 0)}
                      className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2 border-t border-surface-container">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">Tope Máximo de Descuento ($ COP)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      required
                      value={topeMaximo}
                      onChange={(e) => setTopeMaximo(parseFloat(e.target.value) || 0)}
                      className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">¿Permite Sobregiro de Descuento?</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="sobregiro"
                          checked={permiteSobregiro}
                          onChange={() => setPermiteSobregiro(true)}
                        />
                        <span>Sí (Sobregiro permitido)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="sobregiro"
                          checked={!permiteSobregiro}
                          onChange={() => setPermiteSobregiro(false)}
                        />
                        <span>No (Aplicar tope)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t border-surface-container">
                  <label className="text-xs font-semibold text-on-surface">
                    Columnas Requeridas en la Planilla Excel (separadas por coma)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CEDULA, NOMBRE, SALARIO"
                    value={columnasStr}
                    onChange={(e) => setColumnasStr(e.target.value)}
                    className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    El orquestador verificará la existencia de estas columnas antes de calcular la nómina.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setModoEdicion(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${guardando ? "animate-spin" : ""}`}>
                    {guardando ? "sync" : "save"}
                  </span>
                  <span>{guardando ? "Guardando..." : "Guardar Reglas de Negocio"}</span>
                </button>
              </div>
            </form>
          ) : empresaSeleccionada ? (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {empresaSeleccionada.nombre}
                    </h3>
                    <span className="text-xs text-on-surface-variant font-mono">
                      NIT: {empresaSeleccionada.nit} • Código: {empresaSeleccionada.codigo}
                    </span>
                  </div>
                </div>

                {esAdmin && (
                  <button
                    type="button"
                    onClick={() => editarEmpresa(empresaSeleccionada)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container text-xs font-semibold transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Modificar Parámetros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                <div className="p-space-md rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-1">
                  <span className="text-xs text-blue-700 font-semibold uppercase">Seguro de Vida</span>
                  <span className="font-headline-lg text-headline-lg font-bold text-blue-900">
                    {empresaSeleccionada.reglas.porcentajeVida}%
                  </span>
                  <span className="text-[11px] text-blue-700">Calculado sobre Salario Base</span>
                </div>

                <div className="p-space-md rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-1">
                  <span className="text-xs text-emerald-700 font-semibold uppercase">Gastos Médicos GMM</span>
                  <span className="font-headline-lg text-headline-lg font-bold text-emerald-900">
                    {empresaSeleccionada.reglas.porcentajeGmm}%
                  </span>
                  <span className="text-[11px] text-emerald-700">Cobertura Integral Médica</span>
                </div>

                <div className="p-space-md rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col gap-1">
                  <span className="text-xs text-amber-700 font-semibold uppercase">Costos Administrativos</span>
                  <span className="font-headline-lg text-headline-lg font-bold text-amber-900">
                    {empresaSeleccionada.reglas.porcentajeCostos}%
                  </span>
                  <span className="text-[11px] text-amber-700">Operación & Gestión RPA</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2">
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase">Tope Máximo Permitido</span>
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">
                    ${empresaSeleccionada.reglas.topeMaximoDescuento.toLocaleString("es-CO")} COP
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {empresaSeleccionada.reglas.permiteSobregiro
                      ? "⚠️ Sobregiro activado: se permite superar el tope."
                      : "🛡️ Descuentos mayores se truncan al tope estricto."}
                  </span>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase">
                    Columnas Requeridas en Excel
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {empresaSeleccionada.reglas.columnasRequeridas.map((col) => (
                      <span
                        key={col}
                        className="px-2 py-0.5 rounded font-mono text-xs bg-surface-container-highest text-primary font-bold"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ejemplo en vivo de cálculo */}
              <div className="p-space-md rounded-xl bg-surface-container-high/60 flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calculate</span>
                  Simulador de Reglas para Salario Base de $2.000.000 COP
                </span>
                <div className="text-xs text-on-surface-variant grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>Vida: ${(2000000 * (empresaSeleccionada.reglas.porcentajeVida / 100)).toLocaleString("es-CO")}</div>
                  <div>GMM: ${(2000000 * (empresaSeleccionada.reglas.porcentajeGmm / 100)).toLocaleString("es-CO")}</div>
                  <div>Costos: ${(2000000 * (empresaSeleccionada.reglas.porcentajeCostos / 100)).toLocaleString("es-CO")}</div>
                  <div className="font-bold text-primary">
                    Total: $
                    {Math.min(
                      empresaSeleccionada.reglas.permiteSobregiro ? Infinity : empresaSeleccionada.reglas.topeMaximoDescuento,
                      2000000 *
                        ((empresaSeleccionada.reglas.porcentajeVida +
                          empresaSeleccionada.reglas.porcentajeGmm +
                          empresaSeleccionada.reglas.porcentajeCostos) /
                          100)
                    ).toLocaleString("es-CO")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px]">business</span>
              <span>Selecciona una empresa de la lista para ver o editar sus reglas de negocio.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
