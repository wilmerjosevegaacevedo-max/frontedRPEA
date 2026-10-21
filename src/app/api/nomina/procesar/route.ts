import { NextRequest, NextResponse } from "next/server";
import { EMPRESAS_PREDETERMINADAS, Empresa, Job } from "@/types";
import { db } from "@/firebase";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * POST /api/nomina/procesar
 * Procesa un lote de nómina en el servidor Next.js a partir de filas JSON o parámetros enviados.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, nombreArchivo, filas, usuarioId, usuarioEmail } = body;

    if (!empresaId || !Array.isArray(filas) || filas.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Se requiere 'empresaId' y un arreglo 'filas' con al menos 1 registro." },
        { status: 400 }
      );
    }

    // Obtener reglas de la empresa
    let empresa: Empresa | undefined;
    if (db) {
      const empDoc = await getDoc(doc(collection(db, "empresas"), empresaId));
      if (empDoc.exists()) {
        empresa = { id: empDoc.id, ...empDoc.data() } as Empresa;
      }
    }
    if (!empresa) {
      empresa = EMPRESAS_PREDETERMINADAS.find((e) => e.id === empresaId) || EMPRESAS_PREDETERMINADAS[0];
    }

    const { porcentajeVida, porcentajeGmm, porcentajeCostos, topeMaximoDescuento, permiteSobregiro } =
      empresa.reglas;

    let totalSalariosBase = 0;
    let totalVida = 0;
    let totalGmm = 0;
    let totalCostos = 0;
    let granTotalDescuentos = 0;
    let registrosExitosos = 0;
    let registrosFallidos = 0;

    const procesados = filas.map((fila: any, idx: number) => {
      const docVal = fila.cedula || fila.documento || fila.id || fila.CEDULA || "";
      const nombreVal = fila.nombre || fila.empleado || fila.NOMBRE || `Empleado #${idx + 1}`;
      const salarioVal = Number(fila.salario || fila.salarioBase || fila.SALARIO || 0);

      let estado = "VALIDO";
      let error = "";

      if (!docVal) {
        estado = "INVALIDO";
        error = "Documento ausente";
        registrosFallidos++;
      } else if (salarioVal <= 0) {
        estado = "INVALIDO";
        error = "Salario inválido o menor a cero";
        registrosFallidos++;
      } else {
        registrosExitosos++;
      }

      const dVida = Math.round(salarioVal * (porcentajeVida / 100));
      const dGmm = Math.round(salarioVal * (porcentajeGmm / 100));
      const dCostos = Math.round(salarioVal * (porcentajeCostos / 100));
      const subtotal = dVida + dGmm + dCostos;

      let dAplicado = subtotal;
      let topado = false;
      if (subtotal > topeMaximoDescuento) {
        if (!permiteSobregiro) {
          dAplicado = topeMaximoDescuento;
          topado = true;
        }
      }

      if (estado === "VALIDO") {
        totalSalariosBase += salarioVal;
        totalVida += dVida;
        totalGmm += dGmm;
        totalCostos += dCostos;
        granTotalDescuentos += dAplicado;
      }

      return {
        indice: idx + 1,
        documento: String(docVal),
        nombre: String(nombreVal),
        salarioBase: salarioVal,
        descuentoVida: dVida,
        descuentoGmm: dGmm,
        descuentoCostos: dCostos,
        descuentoCalculado: subtotal,
        descuentoAplicado: dAplicado,
        topado,
        estado,
        error: error || undefined,
      };
    });

    const jobId = `LOTE-${empresa.codigo}-${Date.now().toString().slice(-5)}`;
    const nuevoJob: Job = {
      id: jobId,
      cliente: empresa.id,
      nombreArchivo: nombreArchivo || `Planilla_API_${empresa.codigo}.json`,
      tipoCarga: "MASIVA",
      totalRegistros: filas.length,
      registrosExitosos,
      registrosFallidos,
      totalDescuentos: granTotalDescuentos,
      estado: registrosFallidos === 0 ? "EXITOSO" : "COMPLETADO",
      usuarioId: usuarioId || "api-server",
      usuarioEmail: usuarioEmail || "api@nomina.com",
    };

    if (db) {
      await setDoc(doc(collection(db, "jobs"), jobId), {
        ...nuevoJob,
        creadoEn: serverTimestamp(),
      });
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Lote ${jobId} procesado exitosamente vía API REST.`,
      job: nuevoJob,
      resumen: {
        totalRegistros: filas.length,
        registrosExitosos,
        registrosFallidos,
        totalSalariosBase,
        totalVida,
        totalGmm,
        totalCostos,
        granTotalDescuentos,
      },
      registros: procesados,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar lote de nómina" },
      { status: 500 }
    );
  }
}
