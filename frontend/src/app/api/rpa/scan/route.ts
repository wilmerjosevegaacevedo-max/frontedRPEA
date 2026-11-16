import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import { EMPRESAS_PREDETERMINADAS, Empresa } from "@/types";
import { db } from "@/firebase";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Hasta 60 segundos en Node.js runtime

const GMAIL_USER = process.env.MAILBOX_USER || "rpalad6819@gmail.com";
const GMAIL_PASS = process.env.MAILBOX_PASSWORD || "";

function normalizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizarClaveColumna(texto: string): string {
  return texto
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9_]/g, "_");
}

function buscarValorEnFila(fila: Record<string, any>, posiblesNombres: string[]): any {
  const entradas = Object.entries(fila);
  for (const posible of posiblesNombres) {
    const normalizado = normalizarClaveColumna(posible);
    for (const [k, v] of entradas) {
      const kNorm = normalizarClaveColumna(k);
      if (kNorm === normalizado || kNorm.includes(normalizado)) {
        return v;
      }
    }
  }
  return undefined;
}

async function cargarDirectorioEmpresas(): Promise<Empresa[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, "empresas"));
      if (!snap.empty) {
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Empresa));
      }
    } catch {
      // Fallback a predeterminadas
    }
  }
  return EMPRESAS_PREDETERMINADAS;
}

function identificarCliente(
  asunto: string,
  remitente: string,
  empresas: Empresa[] = EMPRESAS_PREDETERMINADAS
): string | null {
  const asuntoNorm = normalizarTexto(asunto);
  const remitenteNorm = normalizarTexto(remitente);

  // 1. Reglas CDF
  if (
    asuntoNorm.includes("cdf") ||
    remitenteNorm.includes("cdf.com") ||
    remitenteNorm.includes("cdf-financiera.com") ||
    remitenteNorm.includes("recursos-cdf.net")
  ) {
    return "cdf";
  }

  // 2. Reglas Continental
  if (
    asuntoNorm.includes("continental") ||
    asuntoNorm.includes("cont") ||
    remitenteNorm.includes("continentalgold.com") ||
    remitenteNorm.includes("continental-corp.com") ||
    remitenteNorm.includes("hr-conti.net")
  ) {
    return "continental";
  }

  // 3. Reglas DXC / HPE
  if (
    asuntoNorm.includes("dxc") ||
    asuntoNorm.includes("hpe") ||
    remitenteNorm.includes("dxc.com") ||
    remitenteNorm.includes("hpe.com")
  ) {
    return "dxc";
  }

  // 4. Búsqueda dinámica contra cualquier empresa registrada en Firestore
  for (const emp of empresas) {
    const idNorm = normalizarTexto(emp.id);
    const codNorm = normalizarTexto(emp.codigo);
    const nomNorm = normalizarTexto(emp.nombre);
    const emailOpNorm = normalizarTexto(emp.emailOperador || "");
    const dominioOp = emailOpNorm.includes("@") ? emailOpNorm.split("@")[1] : "";

    if (
      (codNorm && asuntoNorm.includes(codNorm)) ||
      (idNorm && asuntoNorm.includes(idNorm)) ||
      (nomNorm && asuntoNorm.includes(nomNorm)) ||
      (emailOpNorm && remitenteNorm === emailOpNorm) ||
      (dominioOp && remitenteNorm.includes(dominioOp))
    ) {
      return emp.id;
    }
  }

  return null;
}

async function obtenerReglasEmpresa(clienteId: string): Promise<Empresa> {
  if (db) {
    try {
      const snap = await getDoc(doc(collection(db, "empresas"), clienteId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Empresa;
      }
    } catch {
      // Fallback a predeterminadas
    }
  }
  return (
    EMPRESAS_PREDETERMINADAS.find((e) => e.id === clienteId) ||
    EMPRESAS_PREDETERMINADAS[0]
  );
}

async function guardarLoteEnFirestore(
  jobId: string,
  cliente: string,
  estado: "EXITOSO" | "COMPLETADO" | "FALLIDO",
  nombreArchivo: string,
  totalRegistros: number,
  registrosExitosos: number,
  registrosFallidos: number,
  totalDescuentos: number,
  tamanoBytes: number,
  error = ""
) {
  if (db) {
    try {
      await setDoc(doc(collection(db, "jobs"), jobId), {
        id: jobId,
        cliente,
        estado,
        nombreArchivo,
        tipoCarga: "MASIVA",
        totalRegistros,
        registrosExitosos,
        registrosFallidos,
        totalDescuentos,
        tamanoBytes,
        error: error || undefined,
        usuarioId: "rpa-bot-gmail",
        usuarioEmail: GMAIL_USER,
        creadoEn: serverTimestamp(),
      });
      return;
    } catch (err: any) {
      console.warn("[API RPA] Aviso al guardar con SDK en Firestore:", err.message);
    }
  }

  // Fallback vía API REST de Firestore
  const url = `https://firestore.googleapis.com/v1/projects/rpa-nomina-oficial/databases/(default)/documents/jobs?documentId=${jobId}`;
  const payload = {
    fields: {
      id: { stringValue: jobId },
      cliente: { stringValue: cliente },
      estado: { stringValue: estado },
      nombreArchivo: { stringValue: nombreArchivo },
      tipoCarga: { stringValue: "MASIVA" },
      totalRegistros: { integerValue: String(totalRegistros) },
      registrosExitosos: { integerValue: String(registrosExitosos) },
      registrosFallidos: { integerValue: String(registrosFallidos) },
      totalDescuentos: { integerValue: String(totalDescuentos) },
      tamanoBytes: { integerValue: String(tamanoBytes) },
      error: { stringValue: error },
      usuarioId: { stringValue: "rpa-bot-gmail" },
      usuarioEmail: { stringValue: GMAIL_USER },
      creadoEn: { timestampValue: new Date().toISOString() },
      actualizadoEn: { timestampValue: new Date().toISOString() },
    },
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    console.warn("[API RPA] Aviso al guardar en Firestore REST:", err.message);
  }
}

async function enviarCorreoConfirmacion(
  destinatario: string,
  asuntoOriginal: string,
  cliente: string,
  exito: boolean,
  mensaje: string
) {
  if (!GMAIL_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const asunto = exito
      ? `✅ [RPA LAD-6819] Planilla Procesada Exitosamente - ${cliente.toUpperCase()}`
      : `❌ [RPA LAD-6819] Rechazo de Planilla - ${cliente.toUpperCase()}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #1e293b;">
        <h2 style="color: ${exito ? "#0284c7" : "#e11d48"};">Notificación Automática del Robot RPA</h2>
        <p>Estimado analista,</p>
        <p>El orquestador de nómina ha analizado su envío correspondiente a: <b>${asuntoOriginal}</b>.</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 15px 0;">
          <p><b>Empresa:</b> ${cliente.toUpperCase()}</p>
          <p><b>Estado:</b> ${exito ? "EXITOSO" : "FALLIDO"}</p>
          <p><b>Detalle:</b> ${mensaje}</p>
          <p><b>Fecha de Ejecución:</b> ${new Date().toLocaleString("es-CO")}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Sistema RPA LAD-6819 • Tecnológico de Antioquia</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Orquestador RPA LAD-6819" <${GMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: html,
    });
  } catch (mailErr: any) {
    console.warn("[API RPA] Aviso al enviar correo SMTP:", mailErr.message);
  }
}

export async function POST(_req: NextRequest) {
  if (!GMAIL_PASS) {
    return NextResponse.json(
      {
        ok: false,
        error: "Credenciales de buzón (MAILBOX_PASSWORD) no configuradas en variables de entorno.",
      },
      { status: 503 }
    );
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    logger: false,
  });

  const resultados: any[] = [];
  let procesados = 0;
  let exitosos = 0;
  let fallidos = 0;

  try {
    const directorioEmpresas = await cargarDirectorioEmpresas();
    await client.connect();

    // Asegurar carpetas Procesados y Errores
    for (const folder of ["Procesados", "Errores"]) {
      try {
        await client.mailboxCreate(folder);
      } catch {
        // Ya existe
      }
    }

    const lock = await client.getMailboxLock("INBOX");

    try {
      const uids = await client.search({ all: true }, { uid: true });

      if (uids && uids.length > 0) {
        const recientes = uids.slice(-15);

        for (const uid of recientes) {
          const dl = await client.download(String(uid), undefined, { uid: true });
          if (!dl || !dl.content) continue;

          const parsed = await simpleParser(dl.content);
          const asunto = parsed.subject || "Sin Asunto";
          const remitente = parsed.from?.value?.[0]?.address || "";

          // Buscar adjuntos Excel
          const adjuntosExcel = (parsed.attachments || []).filter((a) =>
            /\.(xlsx|xls|csv)$/i.test(a.filename || "")
          );

          if (adjuntosExcel.length === 0) {
            continue;
          }

          // Identificar empresa (incluyendo empresas dinámicas creadas en Firestore)
          const cliente = identificarCliente(asunto, remitente, directorioEmpresas);

          if (!cliente) {
            console.warn(`[API RPA] Correo no identificado: '${asunto}'`);
            await client.messageMove(String(uid), "Errores", { uid: true });
            fallidos++;
            resultados.push({
              uid,
              asunto,
              remitente,
              cliente: "DESCONOCIDO",
              estado: "FALLIDO",
              motivo: "Cliente no identificado en asunto o remitente",
            });
            continue;
          }

          const empresaReglas = await obtenerReglasEmpresa(cliente);
          const { porcentajeVida, porcentajeGmm, porcentajeCostos, topeMaximoDescuento, permiteSobregiro } =
            empresaReglas.reglas;

          // Procesar el primer adjunto Excel aplicando las reglas paramétricas reales
          const primerAdjunto = adjuntosExcel[0];
          let loteExitoso = true;
          let totalRows = 0;
          let filasValidas = 0;
          let filasInvalidas = 0;
          let granTotalDescuentos = 0;
          let errorMsg = "";

          try {
            const workbook = XLSX.read(primerAdjunto.content, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              defval: "",
            });
            totalRows = rows.length;

            if (totalRows === 0) {
              throw new Error("La planilla no contiene registros.");
            }

            for (const fila of rows) {
              const rawDoc =
                buscarValorEnFila(fila, ["CEDULA", "DOCUMENTO", "ID_EMPLEADO", "IDENTIFICACION", "ATTUID", "CC"]) ?? "";
              const docStr = String(rawDoc).trim();

              const rawSalario =
                buscarValorEnFila(fila, [
                  "SALARIO",
                  "VALOR_BASE",
                  "SUELDO",
                  "SALARIO_BASE",
                  "COSTO_EMPLEADO",
                  "BASE",
                  "INGRESO",
                  "SALARY",
                ]) ?? 0;

              const salarioBase =
                typeof rawSalario === "number"
                  ? rawSalario
                  : parseFloat(String(rawSalario).replace(/[^0-9.-]/g, "")) || 0;

              if (!docStr || salarioBase <= 0) {
                filasInvalidas++;
                continue;
              }

              filasValidas++;
              const dVida = Math.round(salarioBase * (porcentajeVida / 100));
              const dGmm = Math.round(salarioBase * (porcentajeGmm / 100));
              const dCostos = Math.round(salarioBase * (porcentajeCostos / 100));
              const dCalculado = dVida + dGmm + dCostos;

              const dAplicado =
                dCalculado > topeMaximoDescuento && !permiteSobregiro ? topeMaximoDescuento : dCalculado;

              granTotalDescuentos += dAplicado;
            }

            if (filasValidas === 0) {
              throw new Error(
                `Ninguna fila superó la validación de estructura (columnas esperadas para ${empresaReglas.nombre}: ${empresaReglas.reglas.columnasRequeridas.join(", ")}).`
              );
            }
          } catch (err: any) {
            loteExitoso = false;
            errorMsg = err.message;
          }

          const estadoLote: "EXITOSO" | "COMPLETADO" | "FALLIDO" = !loteExitoso
            ? "FALLIDO"
            : filasInvalidas > 0
              ? "COMPLETADO"
              : "EXITOSO";
          const batchId = `LOTE-GMAIL-${Date.now().toString().slice(-4)}`;

          // 1. Guardar en Firestore con valores calculados reales
          await guardarLoteEnFirestore(
            batchId,
            cliente,
            estadoLote,
            primerAdjunto.filename || `Nomina_${cliente}.xlsx`,
            totalRows,
            filasValidas,
            loteExitoso ? filasInvalidas : totalRows,
            granTotalDescuentos,
            primerAdjunto.size || primerAdjunto.content?.length || 0,
            errorMsg
          );

          // 2. Mover en Gmail a Procesados o Errores
          const carpetaDestino = loteExitoso ? "Procesados" : "Errores";
          try {
            await client.messageMove(String(uid), carpetaDestino, { uid: true });
          } catch (moveErr: any) {
            console.warn("[API RPA] Error al mover correo UID:", uid, moveErr.message);
          }

          // 3. Notificar por correo
          if (remitente) {
            await enviarCorreoConfirmacion(
              remitente,
              asunto,
              cliente,
              loteExitoso,
              loteExitoso
                ? `Planilla procesada correctamente. Se liquidaron ${filasValidas} empleados válidos (${filasInvalidas} rechazados) por un total de $${granTotalDescuentos.toLocaleString("es-CO")} COP bajo las reglas de ${empresaReglas.nombre}.`
                : `Error en la validación: ${errorMsg}`
            );
          }

          procesados++;
          if (loteExitoso) exitosos++;
          else fallidos++;

          resultados.push({
            batchId,
            asunto,
            remitente,
            cliente,
            estado: estadoLote,
            registros: totalRows,
            registrosExitosos: filasValidas,
            registrosFallidos: filasInvalidas,
            totalDescuentos: granTotalDescuentos,
            archivo: primerAdjunto.filename,
          });
        }
      }
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[API RPA] Error en ciclo IMAP:", error);
    return NextResponse.json(
      { ok: false, error: "Error conectando con Gmail IMAP: " + error.message },
      { status: 500 }
    );
  } finally {
    try {
      await client.logout();
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    totalProcesados: procesados,
    exitosos,
    fallidos,
    resultados,
  });
}
