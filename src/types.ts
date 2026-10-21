import type { Timestamp } from "firebase/firestore";

// ==========================================
// ROLES DE USUARIO (RBAC)
// ==========================================
export type RolUsuario = "ADMIN" | "SUPERVISOR" | "ANALISTA";

export interface PerfilUsuario {
  uid: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export const ROLES_CONFIG: Record<
  RolUsuario,
  { label: string; descripcion: string; color: string; badgeBg: string }
> = {
  ADMIN: {
    label: "Administrador",
    descripcion: "Control total: Registrar empresas, configurar reglas de negocio y supervisión.",
    color: "#dc2626",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  SUPERVISOR: {
    label: "Supervisor",
    descripcion: "Auditoría en tiempo real, aprobación de lotes y visualización de reportes.",
    color: "#2563eb",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  ANALISTA: {
    label: "Analista de Nómina",
    descripcion: "Carga masiva de planillas Excel/CSV y registro de pagos únicos individuales.",
    color: "#16a34a",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
};

// ==========================================
// EMPRESAS Y REGLAS DE NEGOCIO
// ==========================================
export interface ReglasNegocio {
  porcentajeVida: number; // Ej: 1.5 %
  porcentajeGmm: number; // Ej: 2.0 %
  porcentajeCostos: number; // Ej: 1.0 %
  topeMaximoDescuento: number; // Ej: 500000 COP
  permiteSobregiro: boolean;
  columnasRequeridas: string[];
}

export interface Empresa {
  id: string; // ej: 'continental', 'cdf', 'dxc' o generado
  nombre: string;
  nit: string;
  codigo: string;
  reglas: ReglasNegocio;
  creadoEn?: Timestamp;
}

export const EMPRESAS_PREDETERMINADAS: Empresa[] = [
  {
    id: "continental",
    nombre: "Continental Gold",
    nit: "900.123.456-7",
    codigo: "CONT",
    reglas: {
      porcentajeVida: 1.5,
      porcentajeGmm: 2.5,
      porcentajeCostos: 0.8,
      topeMaximoDescuento: 600000,
      permiteSobregiro: false,
      columnasRequeridas: ["CEDULA", "NOMBRE", "SALARIO"],
    },
  },
  {
    id: "cdf",
    nombre: "Compañía de Financiamiento CDF",
    nit: "800.987.654-1",
    codigo: "CDF",
    reglas: {
      porcentajeVida: 1.8,
      porcentajeGmm: 2.0,
      porcentajeCostos: 1.0,
      topeMaximoDescuento: 450000,
      permiteSobregiro: false,
      columnasRequeridas: ["DOCUMENTO", "EMPLEADO", "VALOR_BASE"],
    },
  },
  {
    id: "dxc",
    nombre: "DXC Technology Colombia",
    nit: "860.555.444-9",
    codigo: "DXC",
    reglas: {
      porcentajeVida: 2.0,
      porcentajeGmm: 3.0,
      porcentajeCostos: 1.2,
      topeMaximoDescuento: 800000,
      permiteSobregiro: true,
      columnasRequeridas: ["ID_EMPLEADO", "NOMBRES", "SUELDO"],
    },
  },
];

export type ClienteId = "continental" | "cdf" | "dxc" | string;

export interface ClienteOption {
  id: ClienteId;
  label: string;
  nit: string;
}

export const CLIENTES: ClienteOption[] = EMPRESAS_PREDETERMINADAS.map((e) => ({
  id: e.id as ClienteId,
  label: e.nombre,
  nit: e.nit,
}));

// ==========================================
// CARGA DE UN ÚNICO PAGO (PAGO INDIVIDUAL)
// ==========================================
export interface PagoIndividual {
  id?: string;
  empleadoNombre: string;
  documento: string;
  empresaId: string;
  concepto: "Vida" | "GMM" | "Costos" | "Total";
  salarioBase: number;
  descuentoCalculado: number;
  fecha: string;
  estado: "EXITOSO" | "RECHAZADO";
  observacion?: string;
  usuarioId: string;
  creadoEn?: Timestamp;
}

// ==========================================
// CARGA MASIVA Y LOTES DE NÓMINA (JOBS)
// ==========================================
export type EstadoJob = "PENDIENTE" | "PROCESANDO" | "EXITOSO" | "COMPLETADO" | "FALLIDO" | string;

export interface Job {
  id: string;
  cliente: string;
  nombreArchivo: string;
  estado: EstadoJob;
  tipoCarga?: "MASIVA" | "UNICA";
  totalRegistros?: number;
  totalDescuentos?: number;
  registrosExitosos?: number;
  registrosFallidos?: number;
  archivoEntrada?: string;
  archivoSalida?: string;
  usuarioId?: string;
  usuarioEmail?: string;
  error?: string;
  tamanoBytes?: number;
  creadoEn?: Timestamp;
}

const ESTADOS_EXITO = new Set(["EXITOSO", "COMPLETADO"]);
const ESTADOS_FALLO = new Set(["FALLIDO", "ERROR", "RECHAZADO"]);
const ESTADOS_PROCESO = new Set(["PENDIENTE", "PROCESANDO"]);

export function grupoEstado(estado: EstadoJob): "exito" | "fallo" | "proceso" | "otro" {
  const normalizado = (estado || "").toUpperCase();
  if (ESTADOS_EXITO.has(normalizado)) return "exito";
  if (ESTADOS_FALLO.has(normalizado)) return "fallo";
  if (ESTADOS_PROCESO.has(normalizado)) return "proceso";
  return "otro";
}
