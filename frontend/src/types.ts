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
  empresaAsignada?: string; // 'continental', 'cdf', 'dxc' o 'TODAS' para Admin
}

export interface CredencialEmpresa {
  email: string;
  passwordDefault: string;
  nombre: string;
  rol: RolUsuario;
  empresaId: string; // 'continental', 'cdf', 'dxc' o 'TODAS'
  descripcion: string;
}

export const CREDENCIALES_SISTEMA: CredencialEmpresa[] = [
  {
    email: "admin.rpa@blacksmith.com.co",
    passwordDefault: "Admin*2026",
    nombre: "Administrador General del Sistema",
    rol: "ADMIN",
    empresaId: "TODAS",
    descripcion: "Control total: Único autorizado para registrar empresas y configurar reglas de negocio."
  },
  {
    email: "nomina@continentalgold.com",
    passwordDefault: "Cont*2026",
    nombre: "Analista Nómina Continental Gold",
    rol: "ANALISTA",
    empresaId: "continental",
    descripcion: "Gestión exclusiva de planillas y descuentos individuales de Continental Gold."
  },
  {
    email: "nomina@cdf-financiera.com",
    passwordDefault: "Cdf*2026",
    nombre: "Analista Nómina Compañía CDF",
    rol: "ANALISTA",
    empresaId: "cdf",
    descripcion: "Gestión exclusiva de planillas y deducciones de Compañía de Financiamiento CDF."
  },
  {
    email: "nomina@dxc.com",
    passwordDefault: "Dxc*2026",
    nombre: "Analista Nómina DXC Technology",
    rol: "ANALISTA",
    empresaId: "dxc",
    descripcion: "Gestión exclusiva de planillas y deducciones de DXC Technology Colombia."
  },
  {
    email: "auditoria@rpa-nomina.com",
    passwordDefault: "Audit*2026",
    nombre: "Auditor Central (Supervisión)",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    descripcion: "Monitoreo integral, auditoría y trazabilidad en solo lectura."
  }
];

export function resolverPerfilUsuario(email?: string | null): CredencialEmpresa {
  const emailNorm = (email || "").trim().toLowerCase();
  const match = CREDENCIALES_SISTEMA.find((c) => c.email.toLowerCase() === emailNorm);
  if (match) return match;

  if (emailNorm.includes("admin")) {
    return {
      email: emailNorm,
      passwordDefault: "Admin*2026",
      nombre: "Administrador del Sistema",
      rol: "ADMIN",
      empresaId: "TODAS",
      descripcion: "Control total: Único con acceso a crear empresas y editar reglas."
    };
  }
  if (emailNorm.includes("audit") || emailNorm.includes("supervisor")) {
    return {
      email: emailNorm,
      passwordDefault: "Audit*2026",
      nombre: "Auditor Central de Supervisión",
      rol: "SUPERVISOR",
      empresaId: "TODAS",
      descripcion: "Supervisión y auditoría en tiempo real (solo lectura)."
    };
  }
  if (emailNorm.includes("cdf")) {
    return {
      email: emailNorm,
      passwordDefault: "Cdf*2026",
      nombre: "Analista Nómina Compañía CDF",
      rol: "ANALISTA",
      empresaId: "cdf",
      descripcion: "Gestión exclusiva de Compañía de Financiamiento CDF."
    };
  }
  if (emailNorm.includes("dxc")) {
    return {
      email: emailNorm,
      passwordDefault: "Dxc*2026",
      nombre: "Analista Nómina DXC Technology",
      rol: "ANALISTA",
      empresaId: "dxc",
      descripcion: "Gestión exclusiva de DXC Technology Colombia."
    };
  }
  if (emailNorm.includes("continental") || emailNorm.includes("gold")) {
    return {
      email: emailNorm,
      passwordDefault: "Cont*2026",
      nombre: "Analista Nómina Continental Gold",
      rol: "ANALISTA",
      empresaId: "continental",
      descripcion: "Gestión exclusiva de Continental Gold."
    };
  }

  // Mínimo privilegio por defecto: rol ANALISTA delimitado
  return {
    email: emailNorm || "analista@empresa.com",
    passwordDefault: "",
    nombre: "Analista de Nómina",
    rol: "ANALISTA",
    empresaId: "continental",
    descripcion: "Acceso operativo delimitado a su empresa."
  };
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
