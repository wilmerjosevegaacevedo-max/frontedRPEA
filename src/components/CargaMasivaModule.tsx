"use client";

import { useMemo, useRef, useState } from "react";
import { Empresa, Job, RolUsuario } from "../types";
import {
  exportarExcelProcesado,
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
  onLoteCreado: (nuevoJob: Job) => void;
};

export function CargaMasivaModule({
  empresas,
  user,
  rolUsuario,
  onLoteCreado,
}: CargaMasivaModuleProps) {
  const [empresaId, setEmpresaId] = useState<string>(empresas[0]?.id || "continental");
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
        await setDoc(doc(collection(db, "jobs"), jobId), {
          ...nuevoJob,
          creadoEn: serverTimestamp(),
        });
      }

      onLoteCreado(nuevoJob);
      setMensajeExito(
        `¡Lote masivo ${jobId} procesado y liquidado con éxito! Se contabilizaron ${resultado.filasValidas} registros válidos por un gran total de $${resultado.granTotalDescuentos.toLocaleString("es-CO")} COP.`
      );
    } catch (err: any) {
      setErrorProcesamiento(`Error al guardar lote en Firestore: ${err.message}`);
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
    <div className="flex flex-col gap-space-lg w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">cloud_upload</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Carga Masiva de Planillas de Nómina
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              Procesamiento TypeScript 100% Client-Side
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Validación de formato, cálculo automático de conceptos según reglas de empresa y generación instantánea de resultados sin intermediación de servidores externos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant uppercase">Empresa:</span>
          <select
            value={empresaId}
            onChange={(e) => {
              setEmpresaId(e.target.value);
              setResultado(null);
              setArchivo(null);
            }}
            className="p-2 rounded-lg border border-surface-container-highest bg-white text-sm font-semibold text-primary"
          >
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} ({emp.codigo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-space-md rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between gap-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{mensajeExito}</span>
          </div>
          {resultado && (
            <button
              type="button"
              onClick={() => exportarExcelProcesado(resultado)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Descargar Planilla Liquidada
            </button>
          )}
        </div>
      )}

      {errorProcesamiento && (
        <div className="p-space-md rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span>{errorProcesamiento}</span>
        </div>
      )}

      {/* Zona de Carga Drag & Drop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-8 p-space-xl rounded-xl flex flex-col items-center justify-center text-center gap-space-sm cursor-pointer border-2 border-dashed transition-all ${
            isDraggingOver
              ? "border-primary bg-primary/5"
              : "border-surface-container bg-surface-container-lowest hover:bg-surface-container-low"
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

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[32px]">table_view</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {archivo ? archivo.name : "Arrastra aquí el archivo Excel/CSV o haz clic para examinar"}
            </span>
            <span className="text-xs text-on-surface-variant">
              Formatos aceptados: .xlsx, .xls, .csv • Validando reglas de:{" "}
              <strong>{empresaActual?.nombre}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-on-surface-variant">
            <span className="px-2.5 py-1 rounded-full bg-surface-container flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[14px]">view_column</span>
              Columnas requeridas: {empresaActual?.reglas.columnasRequeridas.join(", ")}
            </span>
          </div>
        </div>

        {/* Resumen de Reglas de la Empresa Seleccionada */}
        <div className="lg:col-span-4 p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Reglas Aplicadas ({empresaActual?.codigo})
            </span>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold uppercase">Vida</span>
                <p className="text-base font-bold text-blue-900">{empresaActual?.reglas.porcentajeVida}%</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">GMM</span>
                <p className="text-base font-bold text-emerald-900">{empresaActual?.reglas.porcentajeGmm}%</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold uppercase">Costos</span>
                <p className="text-base font-bold text-amber-900">{empresaActual?.reglas.porcentajeCostos}%</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-on-surface-variant flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Tope Máximo:</span>
                <strong className="font-mono">${empresaActual?.reglas.topeMaximoDescuento.toLocaleString("es-CO")} COP</strong>
              </div>
              <div className="flex justify-between">
                <span>Sobregiro:</span>
                <strong className={empresaActual?.reglas.permiteSobregiro ? "text-amber-600" : "text-emerald-700"}>
                  {empresaActual?.reglas.permiteSobregiro ? "Permitido" : "Truncado al tope"}
                </strong>
              </div>
            </div>
          </div>

          {resultado && (
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={confirmarYEncolar}
                disabled={guardandoLote}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${guardandoLote ? "animate-spin" : ""}`}>
                  {guardandoLote ? "sync" : "verified"}
                </span>
                <span>{guardandoLote ? "Guardando Lote..." : "Confirmar y Encolar Lote"}</span>
              </button>

              <button
                type="button"
                onClick={() => exportarExcelProcesado(resultado)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-container-high text-primary font-semibold text-xs hover:bg-surface-container transition-all"
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
        <div className="p-space-xl rounded-xl bg-surface-container-lowest text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Analizando planilla Excel y aplicando reglas de negocio...
          </span>
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-space-md">
          {/* Métricas Generales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-1 border-l-4 border-primary">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Total Registros</span>
              <span className="text-2xl font-bold font-mono text-on-surface">{resultado.totalFilas}</span>
              <span className="text-[11px] text-on-surface-variant">Empleados procesados</span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-1 border-l-4 border-emerald-500">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Válidos</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">{resultado.filasValidas}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">100% aprobados</span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-1 border-l-4 border-red-500">
              <span className="text-[11px] font-bold text-red-800 uppercase">Con Inconsistencias</span>
              <span className="text-2xl font-bold font-mono text-red-600">{resultado.filasInvalidas}</span>
              <span className="text-[11px] text-red-600">Rechazados por formato</span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-1 border-l-4 border-blue-500">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Masa Salarial</span>
              <span className="text-lg font-bold font-mono text-blue-900 truncate">
                ${resultado.totalSalariosBase.toLocaleString("es-CO")}
              </span>
              <span className="text-[11px] text-blue-700">Base imponible</span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-1 border-l-4 border-indigo-600">
              <span className="text-[11px] font-bold text-indigo-800 uppercase">Gran Total Descuentos</span>
              <span className="text-lg font-bold font-mono text-indigo-900 truncate">
                ${resultado.granTotalDescuentos.toLocaleString("es-CO")}
              </span>
              <span className="text-[11px] text-indigo-700 font-semibold">Total a dispersar</span>
            </div>
          </div>

          {/* Tabla de Detalle con Filtros */}
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Detalle de Registros Calculados
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("todos")}
                    className={`px-2.5 py-1 rounded font-semibold ${
                      filtroTabla === "todos" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"
                    }`}
                  >
                    Todos ({resultado.registros.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("validos")}
                    className={`px-2.5 py-1 rounded font-semibold ${
                      filtroTabla === "validos" ? "bg-white text-emerald-800 shadow-sm" : "text-on-surface-variant"
                    }`}
                  >
                    Válidos ({resultado.filasValidas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTabla("invalidos")}
                    className={`px-2.5 py-1 rounded font-semibold ${
                      filtroTabla === "invalidos" ? "bg-white text-red-800 shadow-sm" : "text-on-surface-variant"
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
                  className="p-1.5 rounded-lg border border-surface-container-highest bg-white text-xs w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
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
                <tbody className="divide-y divide-surface-container">
                  {registrosFiltrados.slice(0, 50).map((r) => (
                    <tr key={r.indice} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-2.5 px-3 font-mono text-on-surface-variant">{r.indice}</td>
                      <td className="py-2.5 px-3 font-mono font-medium">{r.documento || "—"}</td>
                      <td className="py-2.5 px-3 font-medium text-on-surface">{r.nombre}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${r.salarioBase.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-700">${r.descuentoVida.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">${r.descuentoGmm.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">${r.descuentoCostos.toLocaleString("es-CO")}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        ${r.descuentoAplicado.toLocaleString("es-CO")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.topeAplicado ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            TOPADO
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.estado === "VALIDO" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            VÁLIDO
                          </span>
                        ) : (
                          <span
                            title={r.motivoError}
                            className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] cursor-help"
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
                <div className="py-2 text-center text-xs text-on-surface-variant bg-surface-container-low mt-2 rounded">
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
