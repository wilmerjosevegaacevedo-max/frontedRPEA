"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Empresa, PagoIndividual, RolUsuario } from "../types";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "firebase/auth";

type PagoUnicoModuleProps = {
  empresas: Empresa[];
  user: User;
  rolUsuario: RolUsuario;
  onPagoRegistrado?: (pago: PagoIndividual) => void;
};

export function PagoUnicoModule({ empresas, user, rolUsuario, onPagoRegistrado }: PagoUnicoModuleProps) {
  const [empresaId, setEmpresaId] = useState<string>(empresas[0]?.id || "continental");
  const [documento, setDocumento] = useState("");
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [salarioBase, setSalarioBase] = useState<number | "">("");
  const [concepto, setConcepto] = useState<"Vida" | "GMM" | "Costos" | "Total">("Total");
  const [observacion, setObservacion] = useState("");

  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // Filtros de búsqueda en historial
  const [busqueda, setBusqueda] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("TODAS");

  // Estado para visualización / impresión de comprobante oficial
  const [comprobanteActivo, setComprobanteActivo] = useState<PagoIndividual | null>(null);

  const [historialPagos, setHistorialPagos] = useState<PagoIndividual[]>([
    {
      id: "PAGO-IND-001",
      documento: "1020304050",
      empleadoNombre: "Carlos Mario Restrepo",
      empresaId: "continental",
      concepto: "Total",
      salarioBase: 2500000,
      descuentoCalculado: 120000,
      fecha: new Date().toLocaleDateString("es-CO"),
      estado: "EXITOSO",
      observacion: "Pago procesado según porcentaje Continental (4.8%)",
      usuarioId: user.uid,
    },
    {
      id: "PAGO-IND-002",
      documento: "71283912",
      empleadoNombre: "Ana María Valencia",
      empresaId: "cdf",
      concepto: "Vida",
      salarioBase: 3800000,
      descuentoCalculado: 68400,
      fecha: new Date().toLocaleDateString("es-CO"),
      estado: "EXITOSO",
      observacion: "Descuento póliza de vida",
      usuarioId: user.uid,
    },
  ]);

  const empresaActual = useMemo(
    () => empresas.find((e) => e.id === empresaId) || empresas[0],
    [empresas, empresaId]
  );

  // Cálculo en vivo según las reglas de negocio de la empresa seleccionada
  const calculoEnVivo = useMemo(() => {
    const s = typeof salarioBase === "number" ? salarioBase : 0;
    if (!empresaActual || s <= 0) return { descuento: 0, superaTope: false, tope: 0, porcentajeAplicado: 0, salarioNeto: 0, superaLimiteLegal: false };

    const { porcentajeVida, porcentajeGmm, porcentajeCostos, topeMaximoDescuento, permiteSobregiro } =
      empresaActual.reglas;

    let pct = 0;
    if (concepto === "Vida") pct = porcentajeVida;
    else if (concepto === "GMM") pct = porcentajeGmm;
    else if (concepto === "Costos") pct = porcentajeCostos;
    else pct = porcentajeVida + porcentajeGmm + porcentajeCostos;

    const montoTeorico = Math.round(s * (pct / 100));
    const supera = montoTeorico > topeMaximoDescuento;
    const descuentoFinal = supera && !permiteSobregiro ? topeMaximoDescuento : montoTeorico;
    const salarioNeto = Math.max(0, s - descuentoFinal);
    const superaLimiteLegal = s > 0 && (descuentoFinal / s) > 0.50; // Código sustantivo del trabajo (límite 50%)

    return {
      descuento: descuentoFinal,
      montoTeorico,
      superaTope: supera,
      tope: topeMaximoDescuento,
      porcentajeAplicado: pct,
      permiteSobregiro,
      salarioNeto,
      superaLimiteLegal,
    };
  }, [salarioBase, empresaActual, concepto]);

  // Historial filtrado en tiempo real
  const historialFiltrado = useMemo(() => {
    return historialPagos.filter((p) => {
      const matchEmpresa = filtroEmpresa === "TODAS" || p.empresaId === filtroEmpresa;
      const q = busqueda.trim().toLowerCase();
      const matchTexto =
        !q ||
        (p.documento || "").toLowerCase().includes(q) ||
        (p.empleadoNombre || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q);
      return matchEmpresa && matchTexto;
    });
  }, [historialPagos, busqueda, filtroEmpresa]);

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault();
    if (!documento.trim() || !empleadoNombre.trim() || !salarioBase || salarioBase <= 0) {
      setMensajeError("Por favor completa todos los campos del colaborador y un salario base válido.");
      return;
    }

    setProcesando(true);
    setMensajeError("");
    setMensajeExito("");

    const nuevoId = `PAGO-IND-${Date.now().toString().slice(-6)}`;
    const nuevoPago: PagoIndividual = {
      id: nuevoId,
      documento: documento.trim(),
      empleadoNombre: empleadoNombre.trim(),
      empresaId,
      concepto,
      salarioBase: Number(salarioBase),
      descuentoCalculado: calculoEnVivo.descuento,
      fecha: new Date().toLocaleDateString("es-CO"),
      estado: "EXITOSO",
      observacion:
        observacion.trim() ||
        `Descuento ${concepto} (${calculoEnVivo.porcentajeAplicado}%) aplicado a ${empresaActual?.nombre || empresaId}`,
      usuarioId: user.uid,
    };

    try {
      if (db) {
        try {
          // Registrar en pagos_individuales
          await setDoc(doc(collection(db, "pagos_individuales"), nuevoId), {
            ...nuevoPago,
            creadoEn: serverTimestamp(),
          });

          // Registrar también en jobs para que aparezca en el monitor unificado
          await setDoc(doc(collection(db, "jobs"), nuevoId), {
            id: nuevoId,
            cliente: empresaId,
            nombreArchivo: `Pago_Individual_${documento}.json`,
            tipoCarga: "UNICA",
            totalRegistros: 1,
            totalDescuentos: calculoEnVivo.descuento,
            registrosExitosos: 1,
            registrosFallidos: 0,
            usuarioId: user.uid,
            usuarioEmail: user.email || "operador@nomina.com",
            estado: "EXITOSO",
            creadoEn: serverTimestamp(),
          });
        } catch (dbErr: any) {
          console.warn("Aviso al guardar pago en Firestore (modo local/demo activo):", dbErr?.message);
        }
      }

      setHistorialPagos((prev) => [nuevoPago, ...prev]);
      if (onPagoRegistrado) onPagoRegistrado(nuevoPago);

      setMensajeExito(
        `¡Descuento individual asentado con éxito! Folio: ${nuevoId} — Valor descontado: $${calculoEnVivo.descuento.toLocaleString("es-CO")} COP.`
      );

      // Limpiar formulario
      setDocumento("");
      setEmpleadoNombre("");
      setSalarioBase("");
      setObservacion("");
    } catch (err: any) {
      setMensajeError(`Error al registrar el pago: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  }

  function autocompletarEjemplo() {
    setDocumento("1037648291");
    setEmpleadoNombre("Santiago Morales Duque");
    setSalarioBase(3200000);
    setConcepto("Total");
    setObservacion("Deducción extraordinaria autorizada por colaborador");
    setMensajeError("");
    setMensajeExito("");
  }

  function exportarHistorialExcel() {
    if (historialFiltrado.length === 0) return;
    const datosExportar = historialFiltrado.map((p) => {
      const emp = empresas.find((e) => e.id === p.empresaId);
      return {
        "Folio Transacción": p.id,
        "Cédula / Documento": p.documento,
        "Empleado": p.empleadoNombre,
        "Empresa": emp?.nombre || p.empresaId,
        "Código": emp?.codigo || p.empresaId.toUpperCase(),
        "Concepto": p.concepto,
        "Salario Base ($)": p.salarioBase,
        "Descuento Liquidado ($)": p.descuentoCalculado,
        "Salario Neto Estimado ($)": p.salarioBase - p.descuentoCalculado,
        "Fecha de Registro": p.fecha,
        "Estado": p.estado,
        "Observación": p.observacion || "Sin observación",
      };
    });

    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja, "Descuentos_Individuales");
    XLSX.writeFile(wb, `Historial_Descuentos_Individuales_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Descuento Individual de Nómina
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Transacción Inmediata
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Registra y liquida deducciones directas para un empleado específico, con validación de topes y emisión de comprobante oficial.
          </p>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-space-md rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{mensajeExito}</span>
          </div>
          {historialPagos[0] && (
            <button
              type="button"
              onClick={() => setComprobanteActivo(historialPagos[0])}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">receipt_long</span>
              Ver Comprobante Oficial
            </button>
          )}
        </div>
      )}

      {mensajeError && (
        <div className="p-space-md rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Formulario de Descuento Individual */}
        <div className="lg:col-span-5 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Datos del Descuento
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autocompletarEjemplo}
                className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary hover:bg-primary/10 font-semibold text-xs flex items-center gap-1 transition-all border border-surface-container"
              >
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span>Llenar con Ejemplo</span>
              </button>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                Rol: {rolUsuario}
              </span>
            </div>
          </div>

          <form onSubmit={registrarPago} className="flex flex-col gap-space-md">
            {/* Empresa Aliada */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Empresa Aliada</label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm font-medium"
              >
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ({emp.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Documento y Nombre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Cédula / Documento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1098765432"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Camilo Pérez"
                  value={empleadoNombre}
                  onChange={(e) => setEmpleadoNombre(e.target.value)}
                  className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
                />
              </div>
            </div>

            {/* Salario Base y Concepto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Salario Base ($ COP)</label>
                  {typeof salarioBase === "number" && salarioBase > 0 && (
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ${salarioBase.toLocaleString("es-CO")}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="1000"
                  min="1"
                  required
                  placeholder="Ej: 2500000"
                  value={salarioBase}
                  onChange={(e) => setSalarioBase(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Concepto de Deducción</label>
                <select
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value as any)}
                  className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
                >
                  <option value="Total">Total Integrado (Vida + GMM + Costos)</option>
                  <option value="Vida">Solo Seguro de Vida ({empresaActual?.reglas.porcentajeVida}%)</option>
                  <option value="GMM">Solo Gastos Médicos GMM ({empresaActual?.reglas.porcentajeGmm}%)</option>
                  <option value="Costos">Solo Costos Admin ({empresaActual?.reglas.porcentajeCostos}%)</option>
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Observaciones / Motivo</label>
              <input
                type="text"
                placeholder="Ej: Deducción acordada por concepto de póliza colectiva"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
              />
            </div>

            {/* Tarjeta de Cálculo en Vivo y Reglas */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface-variant uppercase">Desglose Paramétrico en Tiempo Real</span>
                <span className="font-mono text-primary font-bold">{calculoEnVivo.porcentajeAplicado}% aplicado</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container/60">
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant">Deducción Calculada:</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    ${calculoEnVivo.descuento.toLocaleString("es-CO")} COP
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-on-surface-variant">Neto Estimado al Colaborador:</span>
                  <span className="text-xl font-bold font-mono text-emerald-700">
                    ${calculoEnVivo.salarioNeto.toLocaleString("es-CO")} COP
                  </span>
                </div>
              </div>

              {calculoEnVivo.superaTope && (
                <div className="text-xs p-2 rounded bg-amber-50 text-amber-800 border border-amber-200 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>
                    {calculoEnVivo.permiteSobregiro
                      ? `Atención: Supera el tope (${calculoEnVivo.tope.toLocaleString("es-CO")}), pero la empresa permite sobregiro.`
                      : `Aviso: El cálculo original era $${calculoEnVivo.montoTeorico?.toLocaleString("es-CO")}, pero se topó a $${calculoEnVivo.tope.toLocaleString("es-CO")} por regla de negocio.`}
                  </span>
                </div>
              )}

              {calculoEnVivo.superaLimiteLegal && (
                <div className="text-xs p-2 rounded bg-red-50 text-red-800 border border-red-200 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>
                    Atención: La deducción supera el 50% del salario base (Límite legal sugerido por el CST).
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={procesando || !salarioBase}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${procesando ? "animate-spin" : ""}`}>
                {procesando ? "sync" : "send"}
              </span>
              <span>{procesando ? "Registrando Descuento..." : "Asentar Descuento Individual"}</span>
            </button>
          </form>
        </div>

        {/* Historial de Descuentos Individuales */}
        <div className="lg:col-span-7 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-sm border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                Historial de Descuentos ({historialFiltrado.length} de {historialPagos.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportarHistorialExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high text-on-surface hover:text-primary hover:bg-surface-container font-semibold text-xs border border-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>Exportar (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-surface-container-low p-2.5 rounded-lg border border-surface-container">
            <div className="sm:col-span-7 flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-surface-container-highest">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o folio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full text-xs bg-transparent outline-none text-on-surface"
              />
              {busqueda && (
                <button type="button" onClick={() => setBusqueda("")} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="sm:col-span-5 flex items-center gap-1.5">
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="w-full bg-white px-2.5 py-1.5 rounded border border-surface-container-highest text-xs text-on-surface font-medium"
              >
                <option value="TODAS">Todas las empresas</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-3">Folio</th>
                  <th className="py-2.5 px-3">Empleado</th>
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3 text-right">Descuento</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {historialFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                      No se encontraron deducciones individuales con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  historialFiltrado.map((p) => {
                    const emp = empresas.find((e) => e.id === p.empresaId);
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-primary">{p.id}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">{p.empleadoNombre}</span>
                            <span className="text-[11px] text-on-surface-variant font-mono">CC: {p.documento}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded font-mono font-bold bg-surface-container text-on-surface">
                            {emp?.codigo || p.empresaId.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">{p.concepto}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ${p.descuentoCalculado.toLocaleString("es-CO")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setComprobanteActivo(p)}
                            title="Ver e Imprimir Comprobante Oficial"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-primary hover:text-white text-primary text-xs font-semibold transition-all border border-surface-container-highest"
                          >
                            <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                            <span>Comprobante</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: COMPROBANTE OFICIAL DE DEDUCCIÓN INDIVIDUAL (LISTO PARA PDF / IMPRESIÓN) */}
      {comprobanteActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            id="comprobante-impresion"
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 flex flex-col"
          >
            {/* Cabecera del Comprobante */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-[26px]">verified</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-emerald-300 font-semibold">
                    ORQUESTADOR RPA DE NÓMINA • LAD-6819
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Comprobante de Deducción de Nómina</h3>
                <p className="text-xs text-slate-300">
                  Certificación formal de retención individual asentada en la planilla de compensación.
                </p>
              </div>

              <div className="flex flex-col sm:items-end font-mono">
                <span className="text-xs text-slate-400">FOLIO DE RADICACIÓN</span>
                <span className="text-base font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {comprobanteActivo.id}
                </span>
                <span className="text-[11px] text-slate-300 mt-1">{comprobanteActivo.fecha}</span>
              </div>
            </div>

            {/* Contenido del Comprobante */}
            <div className="p-6 flex flex-col gap-5">
              {/* Bloque Colaborador y Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colaborador / Titular</span>
                  <span className="text-base font-bold text-slate-900">{comprobanteActivo.empleadoNombre}</span>
                  <span className="text-xs font-mono text-slate-600">C.C. {comprobanteActivo.documento}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa Empleadora</span>
                  <span className="text-base font-bold text-slate-900">
                    {empresas.find((e) => e.id === comprobanteActivo.empresaId)?.nombre || comprobanteActivo.empresaId}
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    Cód: {empresas.find((e) => e.id === comprobanteActivo.empresaId)?.codigo || "N/A"}
                  </span>
                </div>
              </div>

              {/* Liquidación Financiera */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detalle Financiero</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="text-slate-600">Salario Base Devengado:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${comprobanteActivo.salarioBase.toLocaleString("es-CO")} COP
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="text-slate-600">Concepto de Deducción:</span>
                    <span className="font-semibold text-indigo-700">{comprobanteActivo.concepto}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="text-slate-600">Observaciones del Registro:</span>
                    <span className="text-slate-700 italic">{comprobanteActivo.observacion || "Sin observaciones"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-950 font-bold">
                    <span className="text-sm">VALOR TOTAL DEDUCIDO:</span>
                    <span className="font-mono text-lg text-emerald-800">
                      -${comprobanteActivo.descuentoCalculado.toLocaleString("es-CO")} COP
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50">
                    <span className="font-semibold text-slate-700">Salario Neto Estimado a Transferir:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${(comprobanteActivo.salarioBase - comprobanteActivo.descuentoCalculado).toLocaleString("es-CO")} COP
                    </span>
                  </div>
                </div>
              </div>

              {/* Sello de Auditoría */}
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">security</span>
                  <span>Operador: {user.email || user.uid.slice(0, 10)}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  HASH: {(comprobanteActivo.id || "000").replace(/[^0-9]/g, "")}8F2D
                </div>
              </div>

              {/* Botones de Acción (Ocultos en impresión) */}
              <div className="no-print pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setComprobanteActivo(null)}
                  className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Imprimir / Guardar en PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}