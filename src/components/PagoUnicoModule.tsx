"use client";

import { useMemo, useState } from "react";
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
    if (!empresaActual || s <= 0) return { descuento: 0, superaTope: false, tope: 0, porcentajeAplicado: 0 };

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

    return {
      descuento: descuentoFinal,
      montoTeorico,
      superaTope: supera,
      tope: topeMaximoDescuento,
      porcentajeAplicado: pct,
      permiteSobregiro,
    };
  }, [salarioBase, empresaActual, concepto]);

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
      }

      setHistorialPagos((prev) => [nuevoPago, ...prev]);
      if (onPagoRegistrado) onPagoRegistrado(nuevoPago);

      setMensajeExito(
        `¡Pago individual registrado con éxito! Folio: ${nuevoId} — Descuento aplicado: $${calculoEnVivo.descuento.toLocaleString("es-CO")} COP.`
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

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              Cargar un Único Pago (Pago Individual)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Transacción Inmediata
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Permite asentar deducciones individuales para un empleado específico, aplicando automáticamente las reglas de negocio de la empresa.
          </p>
        </div>
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
        {/* Formulario de Pago Único */}
        <div className="lg:col-span-5 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
              Datos del Descuento
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
              Rol: {rolUsuario}
            </span>
          </div>

          <form onSubmit={registrarPago} className="flex flex-col gap-space-md">
            {/* Empresa Aliada */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Empresa Aliada</label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
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
                <label className="text-xs font-bold text-on-surface-variant uppercase">Salario Base ($ COP)</label>
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
                placeholder="Ej: Ajuste extraordinario por ingreso tardío a póliza"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="p-2.5 rounded-lg border border-surface-container-highest bg-white text-sm"
              />
            </div>

            {/* Tarjeta de Cálculo en Vivo y Reglas */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface-variant uppercase">Desglose Paramétrico</span>
                <span className="font-mono text-primary font-bold">{calculoEnVivo.porcentajeAplicado}%</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-semibold text-on-surface">Monto a Descontar:</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  ${calculoEnVivo.descuento.toLocaleString("es-CO")} COP
                </span>
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
            </div>

            <button
              type="submit"
              disabled={procesando || !salarioBase}
              className="inline-flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${procesando ? "animate-spin" : ""}`}>
                {procesando ? "sync" : "send"}
              </span>
              <span>{procesando ? "Registrando Pago..." : "Cargar y Asentar Pago Único"}</span>
            </button>
          </form>
        </div>

        {/* Historial de Pagos Únicos */}
        <div className="lg:col-span-7 flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                Historial de Pagos Individuales ({historialPagos.length})
              </span>
            </div>
            <span className="text-xs text-on-surface-variant font-code-sm">Colección: pagos_individuales</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-3">Folio</th>
                  <th className="py-2.5 px-3">Empleado</th>
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3 text-right">Salario Base</th>
                  <th className="py-2.5 px-3 text-right">Descuento</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {historialPagos.map((p) => {
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
                      <td className="py-3 px-3 text-right font-mono text-on-surface-variant">
                        ${p.salarioBase.toLocaleString("es-CO")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ${p.descuentoCalculado.toLocaleString("es-CO")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          EXITOSO
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
