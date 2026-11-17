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
    email: "admin@rpa.com",
    passwordDefault: "Admin*2026",
    nombre: "Administrador General del Sistema",
    rol: "ADMIN",
    empresaId: "TODAS",
    descripcion: "Control total: Registrar empresas, configurar reglas de negocio y supervisión.",
  },
  {
    email: "supervisor@rpa.com",
    passwordDefault: "Audit*2026",
    nombre: "Auditor y Supervisor Central",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    descripcion: "Auditoría en tiempo real, aprobación de lotes y visualización de reportes.",
  },
  {
    email: "audit@rpa.com",
    passwordDefault: "Audit*2026",
    nombre: "Oficial de Auditoría y Cumplimiento",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    descripcion: "Monitoreo integral, auditoría y trazabilidad en solo lectura.",
  },
  {
    email: "nomina@continental.com",
    passwordDefault: "Cont*2026",
    nombre: "Analista Nómina Continental Gold",
    rol: "ANALISTA",
    empresaId: "continental",
    descripcion: "Carga masiva de planillas y descuentos individuales de Continental Gold.",
  },
  {
    email: "nomina@cdf.com",
    passwordDefault: "Cdf*2026",
    nombre: "Analista Nómina Compañía CDF",
    rol: "ANALISTA",
    empresaId: "cdf",
    descripcion: "Carga masiva de planillas y deducciones de Compañía de Financiamiento CDF.",
  },
  {
    email: "nomina@dxc.com",
    passwordDefault: "Dxc*2026",
    nombre: "Analista Nómina DXC Technology",
    rol: "ANALISTA",
    empresaId: "dxc",
    descripcion: "Carga masiva de planillas y deducciones de DXC Technology Colombia.",
  },
  // Alias de respaldo para compatibilidad
  {
    email: "admin.rpa@blacksmith.com.co",
    passwordDefault: "Admin*2026",
    nombre: "Administrador General del Sistema",
    rol: "ADMIN",
    empresaId: "TODAS",
    descripcion: "Control total: Único autorizado para registrar empresas y configurar reglas de negocio.",
  },
  {
    email: "auditoria@rpa-nomina.com",
    passwordDefault: "Audit*2026",
    nombre: "Auditor Central (Supervisión)",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    descripcion: "Monitoreo integral, auditoría y trazabilidad en solo lectura.",
  },
  {
    email: "nomina@continentalgold.com",
    passwordDefault: "Cont*2026",
    nombre: "Analista Nómina Continental Gold",
    rol: "ANALISTA",
    empresaId: "continental",
    descripcion: "Gestión exclusiva de planillas y descuentos individuales de Continental Gold.",
  },
  {
    email: "nomina@cdf-financiera.com",
    passwordDefault: "Cdf*2026",
    nombre: "Analista Nómina Compañía CDF",
    rol: "ANALISTA",
    empresaId: "cdf",
    descripcion: "Gestión exclusiva de planillas y deducciones de Compañía de Financiamiento CDF.",
  },
];

export function resolverPerfilUsuario(email?: string | null, empresas?: Empresa[]): CredencialEmpresa {
  const emailNorm = (email || "").trim().toLowerCase();
  if (!emailNorm) {
    return {
      email: "",
      passwordDefault: "",
      nombre: "Invitado",
      rol: "ANALISTA",
      empresaId: "continental",
      descripcion: "Sesión no autenticada."
    };
  }

  // 1. PRIORIDAD MÁXIMA: Configuración editada por el Administrador en rpa_usuarios_roles
  if (typeof window !== "undefined") {
    try {
      const localUsrs = window.localStorage.getItem("rpa_usuarios_roles");
      if (localUsrs) {
        const parsed = JSON.parse(localUsrs);
        const usrMatch = Array.isArray(parsed)
          ? parsed.find((u: any) => u.email?.toLowerCase() === emailNorm && u.estado !== "SUSPENDIDO")
          : null;
        if (usrMatch) {
          const credBase = CREDENCIALES_SISTEMA.find((c) => c.email.toLowerCase() === emailNorm);
          const empBase = empresas?.find((e) => e.emailOperador?.toLowerCase() === emailNorm);
          const pwd =
            usrMatch.passwordDefault ||
            credBase?.passwordDefault ||
            empBase?.passwordDefault ||
            (usrMatch.rol === "ADMIN" ? "Admin*2026" : usrMatch.rol === "SUPERVISOR" ? "Audit*2026" : "Nomina*2026");

          return {
            email: emailNorm,
            passwordDefault: pwd,
            nombre: usrMatch.nombre || credBase?.nombre || emailNorm,
            rol: usrMatch.rol || "ANALISTA",
            empresaId: usrMatch.empresaId || credBase?.empresaId || "TODAS",
            descripcion: `Rol configurado por Administrador (${usrMatch.rol}).`,
          };
        }
      }
    } catch {
      // Continuar con resolución estándar
    }
  }

  // 2. SEGUNDA PRIORIDAD: Empresas creadas en el sistema (tienen sus propios usuarios operadores)
  if (empresas && empresas.length > 0) {
    const empMatch = empresas.find(
      (e) => e.emailOperador && e.emailOperador.toLowerCase() === emailNorm
    );
    if (empMatch) {
      return {
        email: emailNorm,
        passwordDefault: empMatch.passwordDefault || `${empMatch.codigo}*2026`,
        nombre: `Operador Nómina ${empMatch.nombre}`,
        rol: empMatch.rolOperador || "ANALISTA",
        empresaId: empMatch.id,
        descripcion: `Usuario de empresa ${empMatch.nombre} con rol ${empMatch.rolOperador || "ANALISTA"}.`,
      };
    }
  }

  // 3. TERCERA PRIORIDAD: Credenciales predeterminadas del sistema
  const match = CREDENCIALES_SISTEMA.find((c) => c.email.toLowerCase() === emailNorm);
  if (match) return match;

  if (emailNorm === "admin@rpa.com" || emailNorm === "admin@blacksmith.com.co") {
    return {
      email: emailNorm,
      passwordDefault: "Admin*2026",
      nombre: "Administrador del Sistema",
      rol: "ADMIN",
      empresaId: "TODAS",
      descripcion: "Control total: Único con acceso a crear empresas y editar reglas."
    };
  }
  if (emailNorm === "supervisor@rpa.com" || emailNorm === "audit@rpa.com") {
    return {
      email: emailNorm,
      passwordDefault: "Audit*2026",
      nombre: "Auditor Central de Supervisión",
      rol: "SUPERVISOR",
      empresaId: "TODAS",
      descripcion: "Supervisión y auditoría en tiempo real (solo lectura)."
    };
  }
  if (emailNorm.endsWith("@cdf-financiera.com") || emailNorm.endsWith("@cdf.com")) {
    return {
      email: emailNorm,
      passwordDefault: "Cdf*2026",
      nombre: "Analista Nómina Compañía CDF",
      rol: "ANALISTA",
      empresaId: "cdf",
      descripcion: "Gestión exclusiva de Compañía de Financiamiento CDF."
    };
  }
  if (emailNorm.endsWith("@dxc.com") || emailNorm.endsWith("@hpe.com")) {
    return {
      email: emailNorm,
      passwordDefault: "Dxc*2026",
      nombre: "Analista Nómina DXC Technology",
      rol: "ANALISTA",
      empresaId: "dxc",
      descripcion: "Gestión exclusiva de DXC Technology Colombia."
    };
  }
  if (emailNorm.endsWith("@continentalgold.com") || emailNorm.endsWith("@continental.com")) {
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
  emailOperador?: string; // Correo institucional asignado para login
  passwordDefault?: string; // Clave de acceso asignada para el analista
  rolOperador?: RolUsuario; // Rol asignado al operador/analista de la empresa (ADMIN, SUPERVISOR, ANALISTA)
  reglas: ReglasNegocio;
  creadoEn?: Timestamp;
}

export const EMPRESAS_PREDETERMINADAS: Empresa[] = [
  {
    id: "continental",
    nombre: "Continental Gold",
    nit: "900123456",
    codigo: "CONT",
    emailOperador: "nomina@continentalgold.com",
    passwordDefault: "Cont*2026",
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
    nit: "800987654",
    codigo: "CDF",
    emailOperador: "nomina@cdf-financiera.com",
    passwordDefault: "Cdf*2026",
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
    nit: "860555444",
    codigo: "DXC",
    emailOperador: "nomina@dxc.com",
    passwordDefault: "Dxc*2026",
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
