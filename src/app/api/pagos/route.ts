import { NextRequest, NextResponse } from "next/server";
import { PagoIndividual } from "@/types";
import { db } from "@/firebase";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * GET /api/pagos
 * Consulta el historial de pagos únicos individuales registrados.
 */
export async function GET() {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "pagos_individuales"));
      if (!snap.empty) {
        const pagos = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ ok: true, data: pagos, total: pagos.length });
      }
    }
    return NextResponse.json({ ok: true, data: [], total: 0 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Error al obtener historial de pagos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pagos
 * Asienta un pago único individual en Firestore y registra el Job correspondiente.
 */
export async function POST(req: NextRequest) {
  try {
    const body: PagoIndividual = await req.json();

    if (!body.documento || !body.empleadoNombre || !body.salarioBase || !body.empresaId) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios: documento, empleadoNombre, salarioBase o empresaId." },
        { status: 400 }
      );
    }

    const id = body.id || `PAGO-IND-${Date.now().toString().slice(-6)}`;
    const nuevoPago: PagoIndividual = {
      id,
      documento: body.documento.trim(),
      empleadoNombre: body.empleadoNombre.trim(),
      empresaId: body.empresaId.trim(),
      concepto: body.concepto || "Total",
      salarioBase: Number(body.salarioBase),
      descuentoCalculado: Number(body.descuentoCalculado ?? 0),
      fecha: body.fecha || new Date().toLocaleDateString("es-CO"),
      estado: body.estado || "EXITOSO",
      observacion: body.observacion || "Pago individual asentado vía API REST Next.js",
      usuarioId: body.usuarioId || "api-client",
    };

    if (db) {
      await setDoc(doc(collection(db, "pagos_individuales"), id), {
        ...nuevoPago,
        creadoEn: serverTimestamp(),
      });

      // Crear Job de tipo UNICA
      await setDoc(doc(collection(db, "jobs"), id), {
        id,
        cliente: body.empresaId,
        nombreArchivo: `Pago_Individual_${body.documento}.json`,
        tipoCarga: "UNICA",
        totalRegistros: 1,
        totalDescuentos: nuevoPago.descuentoCalculado,
        registrosExitosos: 1,
        registrosFallidos: 0,
        usuarioId: nuevoPago.usuarioId,
        usuarioEmail: "operador@api-nextjs.com",
        estado: "EXITOSO",
        creadoEn: serverTimestamp(),
      });
    }

    return NextResponse.json(
      { ok: true, mensaje: "Pago individual procesado y asentado con éxito.", data: nuevoPago },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar pago único" },
      { status: 500 }
    );
  }
}
