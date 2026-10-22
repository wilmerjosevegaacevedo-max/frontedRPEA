import * as XLSX from "xlsx";
import { Empresa } from "../types";

export interface RegistroNominaProcesado {
  indice: number;
  documento: string;
  nombre: string;
  salarioBase: number;
  descuentoVida: number;
  descuentoGmm: number;
  descuentoCostos: number;
  descuentoCalculado: number;
  descuentoAplicado: number;
  topeAplicado: boolean;
  estado: "VALIDO" | "INVALIDO";
  motivoError?: string;
  detallesOriginales?: Record<string, any>;
}

export interface ResultadoProcesamientoExcel {
  nombreArchivo: string;
  empresa: Empresa;
  totalFilas: number;
  filasValidas: number;
  filasInvalidas: number;
  totalSalariosBase: number;
  totalDescuentoVida: number;
  totalDescuentoGmm: number;
  totalDescuentoCostos: number;
  granTotalDescuentos: number;
  registros: RegistroNominaProcesado[];
  columnasDetectadas: string[];
  columnasFaltantes: string[];
  erroresGenerales: string[];
}

/**
 * Normaliza nombres de columnas para mapear sin importar mayúsculas/minúsculas o tildes.
 */
function normalizarClave(texto: string): string {
  return texto
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9_]/g, "_");
}

/**
 * Encuentra el valor correspondiente a varias posibles cabeceras en una fila
 */
function buscarValor(fila: Record<string, any>, posiblesNombres: string[]): any {
  const entradas = Object.entries(fila);
  for (const posible of posiblesNombres) {
    const normalizado = normalizarClave(posible);
    for (const [k, v] of entradas) {
      if (normalizarClave(k) === normalizado || normalizarClave(k).includes(normalizado)) {
        return v;
      }
    }
  }
  return undefined;
}

/**
 * Parsea y procesa un archivo Excel o CSV aplicando las reglas de negocio de la empresa seleccionada.
 */
export async function procesarNominaEnFrontend(
  archivo: File,
  empresa: Empresa
): Promise<ResultadoProcesamientoExcel> {
  const buffer = await archivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const primerNombreHoja = workbook.SheetNames[0];

  if (!primerNombreHoja) {
    throw new Error("El archivo Excel no contiene ninguna hoja válida.");
  }

  const hoja = workbook.Sheets[primerNombreHoja];
  const filas: Record<string, any>[] = XLSX.utils.sheet_to_json(hoja, { defval: "" });

  if (filas.length === 0) {
    throw new Error("La planilla no contiene filas de datos.");
  }

  // Detectar columnas presentes
  const primeraFila = filas[0] || {};
  const columnasDetectadas = Object.keys(primeraFila);
  const columnasNormalizadas = columnasDetectadas.map(normalizarClave);

  // Validar columnas requeridas por las reglas de la empresa
  const columnasFaltantes: string[] = [];
  for (const req of empresa.reglas.columnasRequeridas) {
    const reqNorm = normalizarClave(req);
    const encontrada = columnasNormalizadas.some((col) => col.includes(reqNorm) || reqNorm.includes(col));
    if (!encontrada) {
      columnasFaltantes.push(req);
    }
  }

  const erroresGenerales: string[] = [];
  if (columnasFaltantes.length > 0) {
    erroresGenerales.push(
      `Faltan columnas requeridas para ${empresa.nombre}: ${columnasFaltantes.join(", ")}`
    );
  }

  const registros: RegistroNominaProcesado[] = [];
  let totalSalariosBase = 0;
  let totalDescuentoVida = 0;
  let totalDescuentoGmm = 0;
  let totalDescuentoCostos = 0;
  let granTotalDescuentos = 0;

  filas.forEach((fila, idx) => {
    // Mapeo flexible de Documento / Cédula / ID
    const rawDoc =
      buscarValor(fila, ["CEDULA", "DOCUMENTO", "ID_EMPLEADO", "IDENTIFICACION", "ATTUID", "CC"]) ?? "";
    const documento = String(rawDoc).trim();

    // Mapeo flexible de Nombre
    const rawNombre =
      buscarValor(fila, ["NOMBRE", "EMPLEADO", "NOMBRES", "APELLIDOS", "COLABORADOR", "NAME"]) ?? "";
    const nombre = String(rawNombre).trim() || `Empleado #${idx + 1}`;

    // Mapeo flexible de Salario Base
    const rawSalario =
      buscarValor(fila, [
        "SALARIO",
        "VALOR_BASE",
        "SUELDO",
        "SALARIO_BASE",
        "BASE",
        "INGRESO",
        "SALARY",
      ]) ?? 0;

    let salarioBase = 0;
    if (typeof rawSalario === "number") {
      salarioBase = rawSalario;
    } else {
      const limpio = String(rawSalario).replace(/[^0-9.-]/g, "");
      salarioBase = parseFloat(limpio) || 0;
    }

    // Reglas de negocio de la Empresa
    const { porcentajeVida, porcentajeGmm, porcentajeCostos, topeMaximoDescuento, permiteSobregiro } =
      empresa.reglas;

    let estado: "VALIDO" | "INVALIDO" = "VALIDO";
    let motivoError = "";

    if (!documento) {
      estado = "INVALIDO";
      motivoError = "Documento de identificación vacío.";
    } else if (salarioBase <= 0) {
      estado = "INVALIDO";
      motivoError = "Salario base inválido o menor a 0.";
    }

    const dVida = Math.round(salarioBase * (porcentajeVida / 100));
    const dGmm = Math.round(salarioBase * (porcentajeGmm / 100));
    const dCostos = Math.round(salarioBase * (porcentajeCostos / 100));
    const dCalculado = dVida + dGmm + dCostos;

    let dAplicado = dCalculado;
    let topeAplicado = false;

    if (dCalculado > topeMaximoDescuento) {
      if (!permiteSobregiro) {
        dAplicado = topeMaximoDescuento;
        topeAplicado = true;
      } else {
        topeAplicado = false; // Sobregiro permitido
      }
    }

    if (estado === "VALIDO") {
      totalSalariosBase += salarioBase;
      totalDescuentoVida += dVida;
      totalDescuentoGmm += dGmm;
      totalDescuentoCostos += dCostos;
      granTotalDescuentos += dAplicado;
    }

    registros.push({
      indice: idx + 1,
      documento,
      nombre,
      salarioBase,
      descuentoVida: dVida,
      descuentoGmm: dGmm,
      descuentoCostos: dCostos,
      descuentoCalculado: dCalculado,
      descuentoAplicado: dAplicado,
      topeAplicado,
      estado,
      motivoError: motivoError || undefined,
      detallesOriginales: fila,
    });
  });

  const filasValidas = registros.filter((r) => r.estado === "VALIDO").length;
  const filasInvalidas = registros.length - filasValidas;

  return {
    nombreArchivo: archivo.name,
    empresa,
    totalFilas: registros.length,
    filasValidas,
    filasInvalidas,
    totalSalariosBase,
    totalDescuentoVida,
    totalDescuentoGmm,
    totalDescuentoCostos,
    granTotalDescuentos,
    registros,
    columnasDetectadas,
    columnasFaltantes,
    erroresGenerales,
  };
}

/**
 * Genera y descarga un archivo Excel procesado con los cálculos y auditoría final.
 */
export function exportarExcelProcesado(resultado: ResultadoProcesamientoExcel) {
  const datosParaExportar = resultado.registros.map((r) => ({
    Índice: r.indice,
    Documento: r.documento,
    "Nombre del Empleado": r.nombre,
    "Salario Base ($)": r.salarioBase,
    [`Seguro Vida (${resultado.empresa.reglas.porcentajeVida}%)`]: r.descuentoVida,
    [`GMM (${resultado.empresa.reglas.porcentajeGmm}%)`]: r.descuentoGmm,
    [`Costos Admin (${resultado.empresa.reglas.porcentajeCostos}%)`]: r.descuentoCostos,
    "Total Calculado ($)": r.descuentoCalculado,
    "Total Descuento Aplicado ($)": r.descuentoAplicado,
    "Tope Aplicado": r.topeAplicado ? "SÍ" : "NO",
    Estado: r.estado,
    Observaciones: r.motivoError || "Procesado conforme a reglas",
  }));

  const hojaDetalle = XLSX.utils.json_to_sheet(datosParaExportar);

  // Hoja de resumen gerencial / auditoría
  const resumen = [
    { Métrica: "Empresa", Valor: resultado.empresa.nombre },
    { Métrica: "NIT", Valor: resultado.empresa.nit },
    { Métrica: "Archivo Fuente", Valor: resultado.nombreArchivo },
    { Métrica: "Total Empleados Evaluados", Valor: resultado.totalFilas },
    { Métrica: "Registros Exitosos", Valor: resultado.filasValidas },
    { Métrica: "Registros Rechazados", Valor: resultado.filasInvalidas },
    { Métrica: "Masa Salarial Total ($)", Valor: resultado.totalSalariosBase },
    { Métrica: "Total Descuento Vida ($)", Valor: resultado.totalDescuentoVida },
    { Métrica: "Total Descuento GMM ($)", Valor: resultado.totalDescuentoGmm },
    { Métrica: "Total Costos Admin ($)", Valor: resultado.totalDescuentoCostos },
    { Métrica: "Gran Total Descuentos a Dispersar ($)", Valor: resultado.granTotalDescuentos },
    { Métrica: "Fecha de Procesamiento", Valor: new Date().toLocaleString("es-CO") },
  ];
  const hojaResumen = XLSX.utils.json_to_sheet(resumen);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaResumen, "Resumen Auditoria");
  XLSX.utils.book_append_sheet(wb, hojaDetalle, "Detalle Descuentos");

  const nombreSalida = `Liquidacion_${resultado.empresa.codigo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, nombreSalida);
}

/**
 * Genera datos de prueba realistas estructurados según las columnas obligatorias de cada empresa
 */
export function generarDatosPruebaPorEmpresa(empresa: Empresa): Record<string, any>[] {
  const codigo = (empresa.codigo || empresa.id).toUpperCase();
  const c = empresa.reglas.columnasRequeridas;
  const colDoc = c[0] || "CEDULA";
  const colNom = c[1] || "NOMBRE";
  const colSal = c[2] || "SALARIO";

  // Retorna filas con salarios realistas, incluyendo uno que exceda el tope para demostrar el truncamiento
  return [
    {
      [colDoc]: "1037648291",
      [colNom]: "Carlos Mario Restrepo Vélez",
      [colSal]: 2800000,
    },
    {
      [colDoc]: "1017234890",
      [colNom]: "Laura Camila Gómez Arango",
      [colSal]: 3400000,
    },
    {
      [colDoc]: "71982341",
      [colNom]: "Mateo Henao Jaramillo",
      [colSal]: 1950000,
    },
    {
      [colDoc]: "1035982143",
      [colNom]: "Sofía Marcela Duque Londoño",
      [colSal]: 4200000,
    },
    {
      [colDoc]: "98721345",
      [colNom]: "Andrés Felipe Bedoya Zapata",
      [colSal]: 12500000, // Alto ingreso para probar tope máximo de la empresa
    },
    {
      [colDoc]: "1028371920",
      [colNom]: "Valentina Ríos Castaño",
      [colSal]: 2600000,
    },
    {
      [colDoc]: "70192834",
      [colNom]: "Esteban Osorio Murillo",
      [colSal]: 3100000,
    },
  ];
}

/**
 * Descarga directamente un archivo Excel de plantilla modelo para la empresa seleccionada
 */
export function generarPlantillaExcelEjemplo(empresa: Empresa) {
  const datos = generarDatosPruebaPorEmpresa(empresa);
  const hoja = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hoja, `Nomina_${empresa.codigo}`);

  const nombreArchivo = `Plantilla_Ejemplo_${empresa.codigo}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}

/**
 * Crea un objeto File en memoria con datos de prueba listo para ser procesado inmediatamente sin requerir subida externa
 */
export function generarArchivoPruebaFile(empresa: Empresa): File {
  const datos = generarDatosPruebaPorEmpresa(empresa);
  const hoja = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hoja, `Nomina_${empresa.codigo}`);

  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new File([blob], `Nomina_Demostracion_${empresa.codigo}.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
