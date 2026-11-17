"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Empresa, RolUsuario, ROLES_CONFIG } from "../types";

export type UsuarioSistema = {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  empresaId: string;
  passwordDefault?: string;
  estado: "ACTIVO" | "SUSPENDIDO";
};

export type PermisoFila = {
  id: string;
  funcionalidad: string;
  descripcion: string;
  admin: boolean | string;
  supervisor: boolean | string;
  analista: boolean | string;
};

const MATRIZ_PERMISOS_INICIAL: PermisoFila[] = [
  {
    id: "p1",
    funcionalidad: "Registrar Empresa & Configurar Reglas de Negocio",
    descripcion: "Crear empresas y ajustar % de Vida, GMM, Costos, Topes y Columnas Requeridas.",
    admin: true,
    supervisor: "Solo Lectura",
    analista: false,
  },
  {
    id: "p2",
    funcionalidad: "Carga Masiva de Planillas (Excel / CSV)",
    descripcion: "Procesamiento client-side en TypeScript, validación de esquemas y liquidación masiva.",
    admin: true,
    supervisor: false,
    analista: true,
  },
  {
    id: "p3",
    funcionalidad: "Cargar Descuento Individual",
    descripcion: "Asentar deducciones unitarias con verificación paramétrica de sobregiro y tope.",
    admin: true,
    supervisor: false,
    analista: true,
  },
  {
    id: "p4",
    funcionalidad: "Monitoreo de Lotes y KPIs en Tiempo Real",
    descripcion: "Visualización de estado de lotes, tasas de éxito, fallos y tiempos de procesamiento.",
    admin: true,
    supervisor: true,
    analista: "Solo Lotes Propios",
  },
  {
    id: "p5",
    funcionalidad: "Exportar Liquidaciones en Excel (XLSX)",
    descripcion: "Descarga de archivos consolidados con desglose de pólizas y resumen de auditoría.",
    admin: true,
    supervisor: true,
    analista: true,
  },
  {
    id: "p6",
    funcionalidad: "Gestión de Roles y Auditoría de Seguridad",
    descripcion: "Inspección de perfiles de usuario, roles RBAC y trazabilidad de operaciones.",
    admin: true,
    supervisor: "Solo Lectura",
    analista: false,
  },
];

const USUARIOS_DEFAULT: UsuarioSistema[] = [
  {
    id: "usr-admin",
    email: "admin@rpa.com",
    nombre: "Administrador Central",
    rol: "ADMIN",
    empresaId: "TODAS",
    passwordDefault: "Admin*2026",
    estado: "ACTIVO",
  },
  {
    id: "usr-supervisor",
    email: "supervisor@rpa.com",
    nombre: "Auditor y Supervisor Central",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    passwordDefault: "Audit*2026",
    estado: "ACTIVO",
  },
  {
    id: "usr-audit",
    email: "audit@rpa.com",
    nombre: "Oficial de Auditoría y Cumplimiento",
    rol: "SUPERVISOR",
    empresaId: "TODAS",
    passwordDefault: "Audit*2026",
    estado: "ACTIVO",
  },
];

function fusionarUsuariosConEmpresas(base: UsuarioSistema[], listaEmpresas: Empresa[]): UsuarioSistema[] {
  const mapa = new Map<string, UsuarioSistema>();

  // 1. Insertar base
  base.forEach((u) => {
    mapa.set(u.email.toLowerCase(), u);
  });

  // 2. Integrar todas las empresas registradas (cada empresa tiene su usuario operador)
  listaEmpresas.forEach((emp) => {
    const emailEmp = (emp.emailOperador || `nomina@${emp.codigo.toLowerCase()}.com`).toLowerCase();
    const passEmp = emp.passwordDefault || `${emp.codigo.charAt(0).toUpperCase() + emp.codigo.slice(1).toLowerCase()}*2026`;
    const rolEmp = emp.rolOperador || "ANALISTA";
    const existente = mapa.get(emailEmp);

    if (existente) {
      mapa.set(emailEmp, {
        ...existente,
        nombre: existente.nombre || `Analista Nómina ${emp.nombre}`,
        empresaId: emp.id,
        passwordDefault: existente.passwordDefault || passEmp,
        rol: existente.rol || rolEmp,
      });
    } else {
      mapa.set(emailEmp, {
        id: `usr-emp-${emp.id}`,
        email: emailEmp,
        nombre: `Analista Nómina ${emp.nombre}`,
        rol: rolEmp,
        empresaId: emp.id,
        passwordDefault: passEmp,
        estado: "ACTIVO",
      });
    }
  });

  return Array.from(mapa.values());
}

export function AuditoriaRolesModule({
  rolUsuario,
  esAdmin = false,
  onCambiarRol,
  empresas = [],
}: {
  rolUsuario: RolUsuario;
  esAdmin?: boolean;
  onCambiarRol?: (rol: RolUsuario) => void;
  empresas?: Empresa[];
}) {
  const [matrizPermisos, setMatrizPermisos] = useState<PermisoFila[]>(MATRIZ_PERMISOS_INICIAL);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() =>
    fusionarUsuariosConEmpresas(USUARIOS_DEFAULT, empresas)
  );
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Formulario nuevo usuario
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRol, setNuevoRol] = useState<RolUsuario>("ANALISTA");
  const [nuevaEmpresaId, setNuevaEmpresaId] = useState("TODAS");
  const [nuevaPassword, setNuevaPassword] = useState("Nomina*2026");

  // Sincronizar usuarios cuando la lista de empresas cambie
  useEffect(() => {
    setUsuarios((prev) => fusionarUsuariosConEmpresas(prev, empresas));
  }, [empresas]);

  // Cargar configuración guardada de Firestore o localStorage
  useEffect(() => {
    async function cargarConfiguracion() {
      // 1. Intentar leer de Firestore
      if (db) {
        try {
          const docRbac = await getDoc(doc(db, "config", "rbac_matriz"));
          if (docRbac.exists() && docRbac.data()?.matriz) {
            setMatrizPermisos(docRbac.data().matriz);
          }
          const docUsrs = await getDoc(doc(db, "config", "usuarios_roles"));
          if (docUsrs.exists() && Array.isArray(docUsrs.data()?.usuarios)) {
            const cargados = docUsrs.data().usuarios as UsuarioSistema[];
            setUsuarios(fusionarUsuariosConEmpresas(cargados, empresas));
            return;
          }
        } catch {
          // Fallback a localStorage
        }
      }

      // 2. Fallback a localStorage
      if (typeof window !== "undefined") {
        const localRbac = localStorage.getItem("rpa_rbac_matriz");
        if (localRbac) {
          try {
            setMatrizPermisos(JSON.parse(localRbac));
          } catch {}
        }
        const localUsrs = localStorage.getItem("rpa_usuarios_roles");
        if (localUsrs) {
          try {
            const parsed = JSON.parse(localUsrs);
            if (Array.isArray(parsed)) {
              setUsuarios(fusionarUsuariosConEmpresas(parsed, empresas));
            }
          } catch {}
        }
      }
    }

    cargarConfiguracion();
  }, [empresas]);

  // Actualizar un permiso individual de la matriz
  const togglePermiso = (idFila: string, campo: "supervisor" | "analista") => {
    if (!esAdmin) return;
    setMatrizPermisos((prev) =>
      prev.map((fila) => {
        if (fila.id !== idFila) return fila;

        if (campo === "supervisor") {
          const actual = fila.supervisor;
          let nuevo: boolean | string = true;
          if (actual === true) nuevo = "Solo Lectura";
          else if (actual === "Solo Lectura") nuevo = false;
          else nuevo = true;
          return { ...fila, supervisor: nuevo };
        } else {
          const actual = fila.analista;
          let nuevo: boolean | string = true;
          if (actual === true) nuevo = "Solo Lotes Propios";
          else if (actual === "Solo Lotes Propios") nuevo = false;
          else nuevo = true;
          return { ...fila, analista: nuevo };
        }
      })
    );
  };

  // Guardar matriz de permisos
  const guardarPermisos = async () => {
    setGuardando(true);
    setMensajeExito(null);
    setMensajeError(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rpa_rbac_matriz", JSON.stringify(matrizPermisos));
      }
      if (db) {
        await setDoc(doc(db, "config", "rbac_matriz"), {
          matriz: matrizPermisos,
          actualizadoPor: "admin",
          actualizadoEn: new Date().toISOString(),
        });
      }
      setMensajeExito("Matriz de permisos RBAC guardada exitosamente.");
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setMensajeError(`Error al guardar permisos: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Restaurar matriz predeterminada
  const restaurarPermisosDefault = () => {
    setMatrizPermisos(MATRIZ_PERMISOS_INICIAL);
    if (typeof window !== "undefined") {
      localStorage.removeItem("rpa_rbac_matriz");
    }
    setMensajeExito("Matriz de permisos restaurada a los valores predeterminados.");
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Modificar rol de un usuario existente
  const actualizarRolUsuario = (id: string, nuevoRol: RolUsuario) => {
    if (!esAdmin) return;
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u))
    );
  };

  // Modificar empresa de un usuario
  const actualizarEmpresaUsuario = (id: string, nuevaEmpresaId: string) => {
    if (!esAdmin) return;
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, empresaId: nuevaEmpresaId } : u))
    );
  };

  // Modificar clave de un usuario
  const actualizarPasswordUsuario = (id: string, nuevaPass: string) => {
    if (!esAdmin) return;
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, passwordDefault: nuevaPass } : u))
    );
  };

  // Alternar estado activo / suspendido
  const toggleEstadoUsuario = (id: string) => {
    if (!esAdmin) return;
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, estado: u.estado === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO" }
          : u
      )
    );
  };

  // Guardar usuarios y sincronizar con Firestore
  const guardarUsuarios = async () => {
    setGuardando(true);
    setMensajeExito(null);
    setMensajeError(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rpa_usuarios_roles", JSON.stringify(usuarios));
      }

      if (db) {
        // 1. Guardar colección central de usuarios
        await setDoc(doc(db, "config", "usuarios_roles"), {
          usuarios,
          actualizadoPor: "admin",
          actualizadoEn: new Date().toISOString(),
        });

        // 2. Sincronizar el rolOperador y passwordDefault en cada empresa registrada
        for (const u of usuarios) {
          if (u.empresaId && u.empresaId !== "TODAS") {
            try {
              await setDoc(
                doc(db, "empresas", u.empresaId),
                {
                  rolOperador: u.rol,
                  emailOperador: u.email,
                  ...(u.passwordDefault ? { passwordDefault: u.passwordDefault } : {}),
                },
                { merge: true }
              );
            } catch (errEmp) {
              console.warn(`Aviso al actualizar empresa ${u.empresaId}:`, errEmp);
            }
          }
        }
      }

      setMensajeExito(
        "Directorio de usuarios y roles actualizado: los roles asignados ya están activos para el inicio de sesión."
      );
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err: any) {
      setMensajeError(`Error al guardar usuarios: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Agregar nuevo usuario
  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmail.trim() || !nuevoNombre.trim()) return;

    const nuevo: UsuarioSistema = {
      id: `usr-${Date.now()}`,
      email: nuevoEmail.trim().toLowerCase(),
      nombre: nuevoNombre.trim(),
      rol: nuevoRol,
      empresaId: nuevaEmpresaId,
      passwordDefault: nuevaPassword.trim() || "Nomina*2026",
      estado: "ACTIVO",
    };

    setUsuarios((prev) => [...prev, nuevo]);
    setNuevoEmail("");
    setNuevoNombre("");
    setNuevoRol("ANALISTA");
    setNuevaEmpresaId("TODAS");
    setNuevaPassword("Nomina*2026");
    setMostrarModalNuevo(false);
    setMensajeExito(`Usuario ${nuevo.email} registrado con rol ${nuevo.rol}. Guarda los cambios para sincronizar.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Eliminar usuario
  const eliminarUsuario = (id: string) => {
    if (!esAdmin) return;
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              Auditoría y Gestión de Roles (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {esAdmin ? "Modo Administrador: Roles y Usuarios Editables" : "Modo Auditoría"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Control de acceso basado en roles, segregación de funciones bancarias y administración de cuentas de usuario de todas las empresas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <span className="text-xs text-slate-400 font-medium">Sesión activa:</span>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${ROLES_CONFIG[rolUsuario].badgeBg}`}>
            {ROLES_CONFIG[rolUsuario].label}
          </span>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 flex items-center gap-2.5 text-xs font-medium">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-4 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/60 flex items-center gap-2.5 text-xs font-medium">
          <span className="material-symbols-outlined text-rose-400 text-[18px]">error</span>
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Tarjetas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(["ADMIN", "SUPERVISOR", "ANALISTA"] as RolUsuario[]).map((rol) => {
          const cfg = ROLES_CONFIG[rol];
          const esElMio = rol === rolUsuario;
          return (
            <div
              key={rol}
              className={`p-5 rounded-2xl bg-slate-900/90 shadow-xl flex flex-col justify-between gap-4 border transition-all ${
                esElMio
                  ? "border-cyan-500/60 ring-1 ring-cyan-500/30 bg-cyan-950/20"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border ${cfg.badgeBg}`}>
                    {cfg.label}
                  </span>
                  {esElMio ? (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Sesión Activa
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                      Perfil Habilitado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cfg.descripcion}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span className="material-symbols-outlined text-[15px] text-cyan-400">shield</span>
                    <span>
                      {rol === "ADMIN" ? "Nivel 3 (Total)" : rol === "SUPERVISOR" ? "Nivel 2 (Auditor)" : "Nivel 1 (Operativo)"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                      esElMio
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                        : "bg-slate-950 text-slate-300 border border-slate-800"
                    }`}
                  >
                    {esElMio ? "Tu Rol Activo" : "Disponible en Sistema"}
                  </span>
                </div>

                {/* Si es Administrador, botón para simular o cambiar su rol en tiempo real */}
                {esAdmin && onCambiarRol && (
                  <button
                    type="button"
                    onClick={() => onCambiarRol(rol)}
                    disabled={esElMio}
                    className={`w-full py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      esElMio
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 cursor-default"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-cyan-500/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {esElMio ? "verified" : "swap_horiz"}
                    </span>
                    <span>{esElMio ? "Rol en Uso" : `Simular Rol ${cfg.label}`}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECCIÓN 1: Directorio y Edición de Usuarios del Sistema (Incluye Empresas Creadas) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono tracking-tight flex items-center gap-2">
                <span>Directorio de Usuarios y Asignación de Roles</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {usuarios.length} cuentas
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                {esAdmin
                  ? "Como Administrador puedes cambiar el rol (ADMIN, SUPERVISOR, ANALISTA), clave y empresa de cualquier usuario."
                  : "Lista de usuarios y asignación de perfiles (solo lectura)."}
              </span>
            </div>
          </div>

          {esAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold border border-slate-700 hover:border-cyan-500/40 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Añadir Usuario</span>
              </button>
              <button
                type="button"
                onClick={guardarUsuarios}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-300/30 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${guardando ? "animate-spin" : ""}`}>
                  {guardando ? "sync" : "save"}
                </span>
                <span>Guardar Usuarios y Roles</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal / Formulario para Agregar Usuario */}
        {mostrarModalNuevo && (
          <form
            onSubmit={handleCrearUsuario}
            className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Nuevo Usuario del Sistema
              </span>
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Rol Asignado</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value as RolUsuario)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono outline-none focus:border-cyan-400 font-bold"
                >
                  <option value="ADMIN">ADMINISTRADOR (Nivel 3)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Nivel 2)</option>
                  <option value="ANALISTA">ANALISTA (Nivel 1)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Empresa Asignada</label>
                <select
                  value={nuevaEmpresaId}
                  onChange={(e) => setNuevaEmpresaId(e.target.value)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono outline-none focus:border-cyan-400"
                >
                  <option value="TODAS">TODAS (Corporativo)</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Clave de Acceso</label>
                <input
                  type="text"
                  required
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-cyan-300 text-xs font-mono outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
              >
                Crear y Asignar
              </button>
            </div>
          </form>
        )}

        {/* Tabla de Usuarios */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Usuario / Correo</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Empresa / Origen</th>
                <th className="py-3 px-4">Rol en Sistema</th>
                <th className="py-3 px-4">Clave Asignada</th>
                <th className="py-3 px-4 text-center">Estado</th>
                {esAdmin && <th className="py-3 px-4 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {usuarios.map((u) => {
                const empresaAsociada = empresas.find((e) => e.id === u.empresaId);
                const esDeEmpresa = Boolean(empresaAsociada && u.empresaId !== "TODAS");

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-white">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-cyan-400">account_circle</span>
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.nombre}</td>
                    
                    {/* Empresa / Origen */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {esAdmin ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={u.empresaId}
                            onChange={(e) => actualizarEmpresaUsuario(u.id, e.target.value)}
                            className="p-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono outline-none focus:border-cyan-400"
                          >
                            <option value="TODAS">TODAS (Corporativo)</option>
                            {empresas.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.nombre}
                              </option>
                            ))}
                          </select>
                          {esDeEmpresa && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              Empresa: {empresaAsociada?.codigo}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span>{empresaAsociada ? empresaAsociada.nombre : u.empresaId.toUpperCase()}</span>
                      )}
                    </td>

                    {/* Selector de Rol Editable por Administrador */}
                    <td className="py-3 px-4 font-mono">
                      {esAdmin ? (
                        <select
                          value={u.rol}
                          onChange={(e) => actualizarRolUsuario(u.id, e.target.value as RolUsuario)}
                          className={`p-1.5 rounded-lg border font-mono text-xs font-bold outline-none cursor-pointer ${
                            u.rol === "ADMIN"
                              ? "bg-red-950/40 text-red-300 border-red-800/60"
                              : u.rol === "SUPERVISOR"
                              ? "bg-blue-950/40 text-blue-300 border-blue-800/60"
                              : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                          }`}
                        >
                          <option value="ADMIN" className="bg-slate-900 text-red-300">ADMINISTRADOR</option>
                          <option value="SUPERVISOR" className="bg-slate-900 text-blue-300">SUPERVISOR</option>
                          <option value="ANALISTA" className="bg-slate-900 text-emerald-300">ANALISTA</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLES_CONFIG[u.rol].badgeBg}`}>
                          {ROLES_CONFIG[u.rol].label}
                        </span>
                      )}
                    </td>

                    {/* Clave Asignada (Transparente para el Administrador) */}
                    <td className="py-3 px-4 font-mono text-cyan-300">
                      {esAdmin ? (
                        <input
                          type="text"
                          value={u.passwordDefault || "Nomina*2026"}
                          onChange={(e) => actualizarPasswordUsuario(u.id, e.target.value)}
                          className="w-28 p-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
                        />
                      ) : (
                        <span className="text-slate-500">••••••••</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {esAdmin ? (
                        <button
                          type="button"
                          onClick={() => toggleEstadoUsuario(u.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            u.estado === "ACTIVO"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60"
                              : "bg-rose-950/60 text-rose-400 border-rose-800/60 hover:bg-rose-900/60"
                          }`}
                        >
                          {u.estado}
                        </button>
                      ) : (
                        <span className="text-slate-400">{u.estado}</span>
                      )}
                    </td>

                    {esAdmin && (
                      <td className="py-3 px-4 text-right">
                        {u.email !== "admin@rpa.com" && (
                          <button
                            type="button"
                            aria-label={`Eliminar usuario ${u.email}`}
                            onClick={() => eliminarUsuario(u.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Eliminar usuario"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: Matriz de Permisos RBAC Editable */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight font-mono">
                Matriz de Segregación de Funcionalidades por Rol
              </h3>
              <span className="text-xs text-slate-400">
                {esAdmin
                  ? "Haz clic sobre los permisos de Supervisor o Analista para alternar su estado."
                  : "Permisos definidos por la arquitectura de seguridad bancaria (solo lectura)."}
              </span>
            </div>
          </div>

          {esAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={restaurarPermisosDefault}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold border border-slate-700 transition-all"
                title="Restaurar matriz original"
              >
                <span className="material-symbols-outlined text-[15px] align-middle mr-1">restore</span>
                Restaurar
              </button>
              <button
                type="button"
                onClick={guardarPermisos}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-300/30 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${guardando ? "animate-spin" : ""}`}>
                  {guardando ? "sync" : "save"}
                </span>
                <span>Guardar Permisos</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Funcionalidad del Sistema</th>
                <th className="py-3 px-4">Descripción de Negocio</th>
                <th className="py-3 px-4 text-center">ADMIN</th>
                <th className="py-3 px-4 text-center">SUPERVISOR</th>
                <th className="py-3 px-4 text-center">ANALISTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {matrizPermisos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white font-mono">{p.funcionalidad}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{p.descripcion}</td>

                  {/* ADMIN: Siempre PERMITIDO */}
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">check</span> PERMITIDO
                    </span>
                  </td>

                  {/* SUPERVISOR: Clickeable para Administrador */}
                  <td className="py-3 px-4 text-center font-mono">
                    <button
                      type="button"
                      disabled={!esAdmin}
                      onClick={() => togglePermiso(p.id, "supervisor")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[10px] transition-transform ${
                        esAdmin ? "hover:scale-105 cursor-pointer" : "cursor-default"
                      } ${
                        p.supervisor === true
                          ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                          : p.supervisor === false
                          ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                          : "bg-slate-800 text-cyan-300 border border-slate-700"
                      }`}
                      title={esAdmin ? "Haz clic para cambiar permiso" : undefined}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {p.supervisor === true ? "check" : p.supervisor === false ? "close" : "visibility"}
                      </span>
                      <span>
                        {p.supervisor === true
                          ? "PERMITIDO"
                          : p.supervisor === false
                          ? "DENEGADO"
                          : String(p.supervisor)}
                      </span>
                    </button>
                  </td>

                  {/* ANALISTA: Clickeable para Administrador */}
                  <td className="py-3 px-4 text-center font-mono">
                    <button
                      type="button"
                      disabled={!esAdmin}
                      onClick={() => togglePermiso(p.id, "analista")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[10px] transition-transform ${
                        esAdmin ? "hover:scale-105 cursor-pointer" : "cursor-default"
                      } ${
                        p.analista === true
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                          : p.analista === false
                          ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                          : "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                      }`}
                      title={esAdmin ? "Haz clic para cambiar permiso" : undefined}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {p.analista === true ? "check" : p.analista === false ? "close" : "tune"}
                      </span>
                      <span>
                        {p.analista === true
                          ? "PERMITIDO"
                          : p.analista === false
                          ? "DENEGADO"
                          : String(p.analista)}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjeta de Arquitectura Técnica */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">code</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-white font-mono">
              Arquitectura Fullstack TypeScript Puro (Cero Python)
            </span>
            <span className="text-xs text-slate-400 font-sans mt-0.5">
              Control RBAC desacoplado, integración automática de usuarios de empresas y sincronización multi-tenant en Firestore.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-cyan-400">
            RBAC Dinámico
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-emerald-400">
            Next.js 14
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-amber-400">
            Firebase Firestore
          </span>
        </div>
      </div>
    </div>
  );
}
