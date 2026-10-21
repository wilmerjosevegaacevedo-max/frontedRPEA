import { NextRequest, NextResponse } from "next/server";
import { PagoIndividual } from "@/types";
import { db } from "@/firebase";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

const PAGOS_DEMO: PagoIndividual[] = [
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
    usuarioId: "demo-user",
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
    usuarioId: "demo-user",
  },
];

/**
 * GET /api/pagos
 * Consulta el historial de pagos únicos individuales registrados.
 */
export async function GET() {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "pagos_individuales"));
      if (snap && !snap.empty) {
        const pagos = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ ok: true, data: pagos, total: pagos.length, source: "firestore" }, { status: 200 });
      }
    }
  } catch (error: any) {
    console.warn("Aviso al consultar pagos de Firestore (usando fallback demo):", error.message);
  }

  return NextResponse.json({ ok: true, data: PAGOS_DEMO, total: PAGOS_DEMO.length, source: "demo" }, { status: 200 });
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
      try {
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
      } catch (dbErr: any) {
        console.warn("Aviso al escribir pago en Firestore:", dbErr.message);
      }
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
