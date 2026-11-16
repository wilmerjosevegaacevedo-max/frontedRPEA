"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Empresa, Job, RolUsuario } from "../types";
import {
  exportarExcelProcesado,
  generarArchivoPruebaFile,
  generarPlantillaExcelEjemplo,
  procesarNominaEnFrontend,
  ResultadoProcesamientoExcel,
} from "../lib/excel-processor";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "firebase/auth";

type CargaMasivaModuleProps = {
  empresas: Empresa[];
  user: User;
  rolUsuario: RolUsuario;
  empresaAsignada?: string;
  onLoteCreado: (nuevoJob: Job) => void;
};

export function CargaMasivaModule({
  empresas,
  user,
  rolUsuario,
  empresaAsignada,
  onLoteCreado,
}: CargaMasivaModuleProps) {
  const esDelimitado = Boolean(empresaAsignada && empresaAsignada !== "TODAS");
  const idInicial = esDelimitado ? empresaAsignada! : (empresas[0]?.id || "continental");
  const [empresaId, setEmpresaId] = useState<string>(idInicial);

  useEffect(() => {
    if (esDelimitado && empresaAsignada) {
      setEmpresaId(empresaAsignada);
    } else if (empresas.length > 0 && !empresas.some((e) => e.id === empresaId)) {
      setEmpresaId(empresas[0].id);
    }
  }, [empresas, empresaAsignada, esDelimitado, empresaId]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcesamientoExcel | null>(null);
  const [errorProcesamiento, setErrorProcesamiento] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [filtroTabla, setFiltroTabla] = useState<"todos" | "validos" | "invalidos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const empresaActual = useMemo(
    () => empresas.find((e) => e.id === empresaId) || empresas[0],
    [empresas, empresaId]
  );

  async function procesarArchivo(file: File) {
    if (!empresaActual) return;
    setArchivo(file);
    setAnalizando(true);
    setErrorProcesamiento("");
    setResultado(null);
    setMensajeExito("");

    try {
      const res = await procesarNominaEnFrontend(file, empresaActual);
      setResultado(res);
    } catch (err: any) {
      setErrorProcesamiento(err.message || "Error al procesar el archivo Excel en el navegador.");
    } finally {
      setAnalizando(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
  }

  async function confirmarYEncolar() {
    if (!resultado || !archivo || !empresaActual) return;
    setGuardandoLote(true);
    setMensajeExito("");
    setErrorProcesamiento("");

    const jobId = `LOTE-${empresaActual.codigo}-${Date.now().toString().slice(-5)}`;

    const nuevoJob: Job = {
      id: jobId,
      cliente: empresaActual.id,
      nombreArchivo: archivo.name,
      tipoCarga: "MASIVA",
      totalRegistros: resultado.totalFilas,
      registrosExitosos: resultado.filasValidas,
      registrosFallidos: resultado.filasInvalidas,
      totalDescuentos: resultado.granTotalDescuentos,
      estado: resultado.filasInvalidas === 0 ? "EXITOSO" : "COMPLETADO",
      tamanoBytes: archivo.size,
      usuarioId: user.uid,
      usuarioEmail: user.email || "analista@nomina.com",
    };

    try {
      if (db) {
        try {
          await setDoc(doc(collection(db, "jobs"), jobId), {
            ...nuevoJob,
            creadoEn: serverTimestamp(),
          });
        } catch (dbErr: any) {
          console.warn("Aviso al persistir lote en Firestore (modo local/demo activo):", dbErr?.message);
        }
      }

      onLoteCreado(nuevoJob);
      setMensajeExito(
        `¡Lote masivo ${jobId} procesado y liquidado con éxito! Se contabilizaron ${resultado.filasValidas} registros válidos por un gran total de $${resultado.granTotalDescuentos.toLocaleString("es-CO")} COP.`
      );
    } catch (err: any) {
      setErrorProcesamiento(`Error al procesar lote: ${err.message}`);
    } finally {
      setGuardandoLote(false);
    }
  }

  const registrosFiltrados = useMemo(() => {
    if (!resultado) return [];
    return resultado.registros.filter((r) => {
      if (filtroTabla === "validos" && r.estado !== "VALIDO") return false;
      if (filtroTabla === "invalidos" && r.estado !== "INVALIDO") return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return r.nombre.toLowerCase().includes(q) || r.documento.toLowerCase().includes(q);
      }
      return true;
    });
  }, [resultado, filtroTabla, busqueda]);

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[24px]">cloud_upload</span>
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">
              Carga Masiva de Planillas de Nómina
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Ingesta, validación de estructura y liquidación automática de planillas según los parámetros configurados para la entidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase font-mono">
            {esDelimitado ? "Empresa Asignada:" : "Empresa:"}
          </span>
          {esDelimitado ? (
            <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">domain_verification</span>
              <span>{empresaActual?.nombre || empresaAsignada?.toUpperCase()} ({empresaActual?.codigo})</span>
            </div>
          ) : (
            <select
              value={empresaId}
              onChange={(e) => {
                setEmpresaId(e.target.value);
                setResultado(null);
                setArchivo(null);
              }}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-cyan-300 font-mono text-xs font-semibold outline-none focus:border-cyan-500/60"
            >
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.codigo})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center justify-between gap-2 text-xs font-medium font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{mensajeExito}</span>
          </div>
          {resultado && (
            <button
              type="button"
              onClick={() => exportarExcelProcesado(resultado)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 border border-emerald-500/50 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              Descargar Planilla Liquidada
            </button>
          )}
        </div>
      )}

      {errorProcesamiento && (
        <div className="p-4 rounded-xl bg-red-950/50 text-red-300 border border-red-800/60 flex items-center gap-2 text-xs font-mono">
          <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
          <span>{errorProcesamiento}</span>
        </div>
      )}

      {/* Zona de Carga Drag & Drop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-8 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3 cursor-pointer border-2 border-dashed transition-all active:scale-[0.99] ${
            isDraggingOver
              ? "border-cyan-400 bg-cyan-950/30"
              : "border-slate-800 bg-slate-900/90 hover:bg-slate-900 hover:border-slate-700"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) procesarArchivo(file);
            }}
          />

          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">table_view</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white font-mono">
              {archivo ? archivo.name : "Arrastra aquí el archivo Excel/CSV o haz clic para examinar"}
            </span>
            <span className="text-xs text-slate-400 font-sans">
              Formatos aceptados: .xlsx, .xls, .csv • Validando reglas de:{" "}
              <strong className="text-slate-200">{empresaActual?.nombre}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-xs text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">view_column</span>
              Columnas requeridas: {empresaActual?.reglas.columnasRequeridas.join(", ")}
            </span>
          </div>

          {/* Botones de acción rápida para demostración */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-800/80 w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                if (empresaActual) {
                  const demoFile = generarArchivoPruebaFile(empresaActual);
                  procesarArchivo(demoFile);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-medium text-xs border border-emerald-700/60 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              <span>Cargar Planilla Demo en Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (empresaActual) {
                  generarPlantillaExcelEjemplo(empresaActual);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs border border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Descargar Plantilla ({empresaActual?.codigo}.xlsx)</span>
            </button>

            {archivo && (
              <button
                type="button"
                onClick={() => {
                  setArchivo(null);
                  setResultado(null);
                  setErrorProcesamiento("");
                  setMensajeExito("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 font-medium text-xs border border-red-800/60 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumen de Reglas de la Empresa Seleccionada */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider font-mono">
              Reglas Aplicadas ({empresaActual?.codigo})
            </span>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Vida</span>
                <p className="text-base font-bold text-cyan-400">{empresaActual?.reglas.porcentajeVida}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">GMM</span>
                <p className="text-base font-bold text-emerald-400">{empresaActual?.reglas.porcentajeGmm}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Costos</span>
                <p className="text-base font-bold text-amber-400">{empresaActual?.reglas.porcentajeCostos}%</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span>Tope Máximo:</span>
                <strong className="text-white">${empresaActual?.reglas.topeMaximoDescuento.toLocaleString("es-CO")} COP</strong>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Sobregiro:</span>
                <strong className={empresaActual?.reglas.permiteSobregiro ? "text-amber-400" : "text-emerald-400"}>
                  {empresaActual?.reglas.permiteSobregiro ? "Permitido" : "Truncado al tope"}
                </strong>
              </div>
            </div>
          </div>

          {resultado && (
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={confirmarYEncolar}
                disabled={guardandoLote}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs border border-cyan-500/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${guardandoLote ? "animate-spin" : ""}`}>
                  {guardandoLote ? "sync" : "verified"}
                </span>
                <span>{guardandoLote ? "Guardando Lote..." : "Confirmar y Encolar Lote"}</span>
              </button>

              <button
                type="button"
                onClick={() => exportarExcelProcesado(resultado)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Exportar Planilla Excel Calculada</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados y Métricas del Análisis */}
      {analizando && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-cyan-400 animate-spin">sync</span>
          <span className="text-sm font-bold text-white font-mono">
            Analizando planilla Excel y aplicando reglas de negocio...
          </span>
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-5">
          {/* Métricas Generales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Registros</span>
              <span className="text-2xl font-bold text-white tabular-nums">{resultado.totalFilas}</span>
              <span className="text-[10px] text-slate-500">Empleados procesados</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase">Válidos</span>
              <span className="text-2xl font-bold text-emerald-400 tabular-nums">{resultado.filasValidas}</span>
              <span className="text-[10px] text-emerald-500/80 font-medium">100% aprobados</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-red-400 uppercase">Inconsistencias</span>
              <span className="text-2xl font-bold text-red-400 tabular-nums">{resultado.filasInvalidas}</span>
              <span className="text-[10px] text-red-500/80">Rechazados por formato</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase">Masa Salarial</span>
              <span className="text-base font-bold text-cyan-300 tabular-nums truncate">
                ${resultado.totalSalariosBase.toLocaleString("es-CO")}
              </span>
              <span className="text-[10px] text-cyan-500/80">Base imponible</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase">Total Descuentos</span>
              <span className="text-base font-bold text-indigo-300 tabular-nums truncate">
                ${resultado.granTotalDescuentos.toLocaleString("es-CO")}
              </span>
              <span className="text-[10px] text-indigo-500/80 font-medium">Total a dispersar</span>
            </div>
          </div>

          {/* Tabla de Detalle con Filtros */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">format_list_bulleted</span>
                <h3 className="text-sm font-bold text-white tracking-tight font-mono">
                  Detalle de Registros Calculados
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("todos")}
                    className={`px-2.5 py-1 rounded-lg transition-all active:scale-[0.98] ${
                      filtroTabla === "todos" ? "bg-slate-800 text-white font-semibold border border-slate-700" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Todos ({resultado.registros.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("validos")}
                    className={`px-2.5 py-1 rounded-lg transition-all active:scale-[0.98] ${
                      filtroTabla === "validos" ? "bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/60" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Válidos ({resultado.filasValidas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("invalidos")}
                    className={`px-2.5 py-1 rounded-lg transition-all active:scale-[0.98] ${
                      filtroTabla === "invalidos" ? "bg-red-950 text-red-400 font-semibold border border-red-800/60" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Inválidos ({resultado.filasInvalidas})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Buscar cédula o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 text-xs w-48 outline-none focus:border-cyan-500/60 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">Empleado</th>
                    <th className="py-2.5 px-3 text-right">Salario Base</th>
                    <th className="py-2.5 px-3 text-right">Vida</th>
                    <th className="py-2.5 px-3 text-right">GMM</th>
                    <th className="py-2.5 px-3 text-right">Costos</th>
                    <th className="py-2.5 px-3 text-right">Total Descuento</th>
                    <th className="py-2.5 px-3 text-center">Tope</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                  {registrosFiltrados.slice(0, 50).map((r) => (
                    <tr key={r.indice} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500">{r.indice}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{r.documento || "—"}</td>
                      <td className="py-2.5 px-3 font-medium text-white font-sans">{r.nombre}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">${r.salarioBase.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-400">${r.descuentoVida.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">${r.descuentoGmm.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">${r.descuentoCostos.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                        ${r.descuentoAplicado.toLocaleString("es-CO")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.topeAplicado ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px]">
                            TOPADO
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.estado === "VALIDO" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                            VÁLIDO
                          </span>
                        ) : (
                          <span
                            title={r.motivoError}
                            className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px] cursor-help"
                          >
                            ERROR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {registrosFiltrados.length > 50 && (
                <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-950 font-mono border-t border-slate-800">
                  Mostrando primeros 50 registros de {registrosFiltrados.length}. Descarga el Excel para ver la totalidad.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
