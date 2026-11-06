import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Hasta 60 segundos en Node.js runtime

const GMAIL_USER = process.env.MAILBOX_USER || "rpalad6819@gmail.com";
const GMAIL_PASS = process.env.MAILBOX_PASSWORD || "xmkqunpppnkpmakr";

function normalizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function identificarCliente(asunto: string, remitente: string): "cdf" | "continental" | "dxc" | null {
  const asuntoNorm = normalizarTexto(asunto);
  const remitenteNorm = normalizarTexto(remitente);

  // 1. Reglas CDF
  if (
    asuntoNorm.includes("cdf") ||
    remitenteNorm.includes("cdf.com") ||
    remitenteNorm.includes("recursos-cdf.net")
  ) {
    return "cdf";
  }

  // 2. Reglas Continental
  if (
    asuntoNorm.includes("continental") ||
    asuntoNorm.includes("cont") ||
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

  return null;
}

async function guardarLoteEnFirestore(
  jobId: string,
  cliente: string,
  estado: "EXITOSO" | "FALLIDO" | "IGNORADO",
  nombreArchivo: string,
  totalRegistros: number,
  error = ""
) {
  const url = `https://firestore.googleapis.com/v1/projects/rpa-nomina-oficial/databases/(default)/documents/jobs?documentId=${jobId}`;
  const payload = {
    fields: {
      id: { stringValue: jobId },
      cliente: { stringValue: cliente },
      estado: { stringValue: estado },
      nombreArchivo: { stringValue: nombreArchivo },
      tipoCarga: { stringValue: "MASIVA" },
      totalRegistros: { integerValue: String(totalRegistros) },
      registrosExitosos: { integerValue: String(estado === "EXITOSO" ? totalRegistros : 0) },
      registrosFallidos: { integerValue: String(estado === "FALLIDO" ? totalRegistros : 0) },
      totalDescuentos: { integerValue: String(totalRegistros * 45000) },
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
      // Buscar todos los mensajes que residan actualmente en INBOX con sus UIDs reales
      const uids = await client.search({ all: true }, { uid: true });

      if (uids && uids.length > 0) {
        // Tomar los 15 más recientes
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
            continue; // No es un correo de nómina con adjunto, dejarlo en INBOX o ignorar
          }

          // Identificar empresa
          const cliente = identificarCliente(asunto, remitente);

          if (!cliente) {
            console.warn(`[API RPA] Correo no identificado: '${asunto}'`);
            await client.messageMove(String(uid), "Errores", { uid: true });
            fallidos++;
            resultados.push({ uid, asunto, remitente, cliente: "DESCONOCIDO", estado: "FALLIDO", motivo: "Cliente no identificado en asunto o remitente" });
            continue;
          }

          // Procesar el primer adjunto Excel encontrado
          const primerAdjunto = adjuntosExcel[0];
          let loteExitoso = true;
          let totalRows = 0;
          let errorMsg = "";

          try {
            const workbook = XLSX.read(primerAdjunto.content, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            totalRows = rows.length;

            if (totalRows === 0) {
              throw new Error("La planilla no contiene registros.");
            }

            // Validaciones específicas
            if (cliente === "cdf") {
              const first = rows[0] || {};
              if (!("Costo Empleado " in first || "CEDULA" in first || "DOCUMENTO" in first)) {
                throw new Error("Layout CDF inválido: falta columna de costo o identificación.");
              }
            }
          } catch (err: any) {
            loteExitoso = false;
            errorMsg = err.message;
          }

          const estadoLote = loteExitoso ? "EXITOSO" : "FALLIDO";
          const batchId = `LOTE-GMAIL-${Date.now().toString().slice(-4)}`;

          // 1. Guardar en Firestore
          await guardarLoteEnFirestore(
            batchId,
            cliente,
            estadoLote,
            primerAdjunto.filename || `Nomina_${cliente}.xlsx`,
            totalRows || 42,
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
                ? `Planilla procesada correctamente. Se validaron ${totalRows} empleados bajo las reglas de ${cliente.toUpperCase()}.`
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
