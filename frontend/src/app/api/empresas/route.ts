import { NextRequest, NextResponse } from "next/server";
import { EMPRESAS_PREDETERMINADAS, Empresa } from "@/types";
import { db } from "@/firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

/**
 * GET /api/empresas
 * Retorna la lista de empresas y sus reglas de negocio configuradas.
 */
export async function GET() {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "empresas"));
      if (snap && !snap.empty) {
        const empresas = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ ok: true, data: empresas, source: "firestore" }, { status: 200 });
      }
    }
  } catch (error: any) {
    console.warn("Aviso al consultar Firestore (usando fallback local):", error.message);
  }

  // Fallback a empresas predeterminadas para funcionamiento local / offline
  return NextResponse.json({ ok: true, data: EMPRESAS_PREDETERMINADAS, source: "default" }, { status: 200 });
}

/**
 * POST /api/empresas
 * Registra o actualiza una empresa aliada con sus reglas de negocio.
 */
export async function POST(req: NextRequest) {
  try {
    const body: Empresa = await req.json();

    const nitNumerico = String(body.nit || "").replace(/\D/g, "").trim();

    if (!body.nombre?.trim() || !nitNumerico || !body.codigo?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Los campos 'nombre', 'nit' y 'codigo' son obligatorios, y el NIT debe contener únicamente números." },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(nitNumerico)) {
      return NextResponse.json(
        { ok: false, error: "El NIT de la empresa debe contener exclusivamente dígitos numéricos." },
        { status: 400 }
      );
    }

    const id = body.id || body.codigo.trim().toLowerCase();
    const empresaData: Empresa = {
      id,
      nombre: body.nombre.trim(),
      nit: nitNumerico,
      codigo: body.codigo.trim().toUpperCase(),
      reglas: {
        porcentajeVida: Number(body.reglas?.porcentajeVida ?? 1.5),
        porcentajeGmm: Number(body.reglas?.porcentajeGmm ?? 2.0),
        porcentajeCostos: Number(body.reglas?.porcentajeCostos ?? 1.0),
        topeMaximoDescuento: Number(body.reglas?.topeMaximoDescuento ?? 500000),
        permiteSobregiro: Boolean(body.reglas?.permiteSobregiro ?? false),
        columnasRequeridas: body.reglas?.columnasRequeridas?.length
          ? body.reglas.columnasRequeridas
          : ["CEDULA", "NOMBRE", "SALARIO"],
      },
    };

    if (db) {
      try {
        await setDoc(doc(collection(db, "empresas"), id), empresaData, { merge: true });
      } catch (dbErr: any) {
        console.warn("Aviso al escribir en Firestore:", dbErr.message);
      }
    }

    return NextResponse.json(
      { ok: true, mensaje: "Empresa y reglas de negocio guardadas con éxito.", data: empresaData },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Error al registrar empresa" },
      { status: 500 }
    );
  }
}
