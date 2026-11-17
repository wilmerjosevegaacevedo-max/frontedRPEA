"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signInAnonymously, User } from "firebase/auth";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ClienteId, CREDENCIALES_SISTEMA, CredencialEmpresa, Empresa, EMPRESAS_PREDETERMINADAS, Job, resolverPerfilUsuario, RolUsuario } from "../types";
import { LoginScreen } from "../components/LoginScreen";
import { Dashboard } from "../components/Dashboard";

const REMEMBER_EMAIL_KEY = "rpa-lad-6819:lastEmail";
const DEMO_SESSION_KEY = "rpa-lad-6819:demoSession";

const DEMO_JOBS: Job[] = [
  {
    id: "LOTE-2026-CDF-001",
    cliente: "cdf",
    nombreArchivo: "Nomina_CDF_Septiembre_2026.xlsx",
    tipoCarga: "MASIVA",
    totalRegistros: 145,
    registrosExitosos: 142,
    registrosFallidos: 3,
    totalDescuentos: 6850000,
    estado: "EXITOSO",
    tamanoBytes: 245760,
    creadoEn: { toDate: () => new Date(Date.now() - 1000 * 60 * 18) } as any,
  },
  {
    id: "LOTE-2026-CONT-002",
    cliente: "continental",
    nombreArchivo: "Nomina_Continental_Q1.xlsx",
    tipoCarga: "MASIVA",
    totalRegistros: 88,
    registrosExitosos: 88,
    registrosFallidos: 0,
    totalDescuentos: 4210000,
    estado: "EXITOSO",
    tamanoBytes: 512000,
    creadoEn: { toDate: () => new Date(Date.now() - 1000 * 60 * 55) } as any,
  },
  {
    id: "PAGO-IND-991",
    cliente: "dxc",
    nombreArchivo: "Pago_Individual_10328491.json",
    tipoCarga: "UNICA",
    totalRegistros: 1,
    registrosExitosos: 1,
    registrosFallidos: 0,
    totalDescuentos: 145000,
    estado: "EXITOSO",
    creadoEn: { toDate: () => new Date(Date.now() - 1000 * 60 * 120) } as any,
  },
];

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [cliente, setCliente] = useState<ClienteId>("continental");
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [modoDemo, setModoDemo] = useState(false);
  const [rolUsuarioActivo, setRolUsuarioActivo] = useState<RolUsuario>("ADMIN");
  const [empresaAsignadaActiva, setEmpresaAsignadaActiva] = useState<string>("TODAS");
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_PREDETERMINADAS);
  const [usuariosConfig, setUsuariosConfig] = useState<any[]>([]);

  // Sincronizar empresas dinámicas desde Firestore y localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const localUsrs = window.localStorage.getItem("rpa_usuarios_roles");
        if (localUsrs) {
          const parsed = JSON.parse(localUsrs);
          if (Array.isArray(parsed)) setUsuariosConfig(parsed);
        }
      } catch {}
    }

    if (!db) return;
    const unsub = onSnapshot(
      collection(db, "empresas"),
      (snapshot) => {
        if (!snapshot.empty) {
          const cargadas = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Empresa));
          setEmpresas(cargadas);
        }
      },
      (error) => {
        console.warn("Aviso al sincronizar empresas en auth:", error.message);
      }
    );

    const unsubUsrs = onSnapshot(
      doc(db, "config", "usuarios_roles"),
      (snap: any) => {
        if (snap.exists() && Array.isArray(snap.data()?.usuarios)) {
          const usrs = snap.data().usuarios;
          setUsuariosConfig(usrs);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("rpa_usuarios_roles", JSON.stringify(usrs));
          }
        }
      },
      () => {}
    );

    return () => {
      unsub();
      unsubUsrs();
    };
  }, []);

  // Lista dinámica unificada de credenciales (Sistema + Empresas Creadas + Usuarios RBAC)
  const credencialesDinamicas = useMemo<CredencialEmpresa[]>(() => {
    const mapa = new Map<string, CredencialEmpresa>();

    // 1. Credenciales principales base (sin duplicar alias)
    CREDENCIALES_SISTEMA.slice(0, 6).forEach((c) => {
      mapa.set(c.email.toLowerCase(), c);
    });

    // 2. Todas las empresas registradas (dinámicas de Firestore o predeterminadas)
    empresas.forEach((emp) => {
      const emailEmp = (emp.emailOperador || `nomina@${emp.codigo.toLowerCase()}.com`).toLowerCase();
      const passEmp =
        emp.passwordDefault ||
        `${emp.codigo.charAt(0).toUpperCase() + emp.codigo.slice(1).toLowerCase()}*2026`;
      mapa.set(emailEmp, {
        email: emailEmp,
        passwordDefault: passEmp,
        nombre: `Operador ${emp.nombre}`,
        rol: emp.rolOperador || "ANALISTA",
        empresaId: emp.id,
        descripcion: `Cuenta de ${emp.nombre} (${emp.rolOperador || "ANALISTA"}).`,
      });
    });

    // 3. Usuarios personalizados o roles editados por el Administrador
    usuariosConfig.forEach((u) => {
      if (!u?.email || u.estado === "SUSPENDIDO") return;
      const emailNorm = u.email.toLowerCase();
      const existente = mapa.get(emailNorm);
      mapa.set(emailNorm, {
        email: emailNorm,
        passwordDefault:
          u.passwordDefault ||
          existente?.passwordDefault ||
          (u.rol === "ADMIN" ? "Admin*2026" : u.rol === "SUPERVISOR" ? "Audit*2026" : "Nomina*2026"),
        nombre: u.nombre || existente?.nombre || emailNorm,
        rol: u.rol || existente?.rol || "ANALISTA",
        empresaId: u.empresaId || existente?.empresaId || "TODAS",
        descripcion: `Perfil asignado por Administrador (${u.rol}).`,
      });
    });

    return Array.from(mapa.values());
  }, [empresas, usuariosConfig]);

  // Escuchar estado de autenticación en Firebase y resolver rol estricto
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (firebaseUser) => {
      // No sobrescribir una sesión de sistema/demo activa en sessionStorage
      if (typeof window !== "undefined" && window.sessionStorage.getItem(DEMO_SESSION_KEY)) {
        return;
      }
      if (firebaseUser) {
        setUser(firebaseUser);
        const perfil = resolverPerfilUsuario(firebaseUser.email, empresas);
        setRolUsuarioActivo(perfil.rol);
        setEmpresaAsignadaActiva(perfil.empresaId);
      }
    });
  }, []);

  // Cargar email recordado y restaurar sesión activa si se recarga la página (F5)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberDevice(true);
      }

      const savedDemo = window.sessionStorage.getItem(DEMO_SESSION_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (parsed?.email) {
            setUser({
              uid: parsed.uid || "usr-demo-restored",
              email: parsed.email,
              displayName: parsed.displayName || parsed.email,
            } as User);
            setRolUsuarioActivo(parsed.rol || "ADMIN");
            setEmpresaAsignadaActiva(parsed.empresaId || "TODAS");
            setModoDemo(true);
          }
        } catch {}
      }
    }
  }, []);

  // Sincronizar trabajos en tiempo real desde Firestore (incluso en modo demo de lectura)
  useEffect(() => {
    if (!user || !db) return;

    const jobsQuery = query(collection(db, "jobs"));
    const unsub = onSnapshot(
      jobsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedJobs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Job));
          loadedJobs.sort((a, b) => (b.creadoEn?.toMillis?.() || 0) - (a.creadoEn?.toMillis?.() || 0));
          setJobs(loadedJobs);
        }
      },
      (error) => {
        console.warn("Aviso al leer jobs de Firestore (usando locales):", error.message);
      }
    );

    return () => unsub();
  }, [user]);

  async function iniciarSesion(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    setIsSigningIn(true);

    const perfil = resolverPerfilUsuario(email, empresas);

    try {
      if (!auth) {
        setUser({ uid: "demo-usr-01", email: email.trim(), displayName: perfil.nombre } as User);
        setRolUsuarioActivo(perfil.rol);
        setEmpresaAsignadaActiva(perfil.empresaId);
        setModoDemo(true);
        return;
      }

      await signInWithEmailAndPassword(auth, email.trim(), password);
      setRolUsuarioActivo(perfil.rol);
      setEmpresaAsignadaActiva(perfil.empresaId);
      setModoDemo(false);

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(DEMO_SESSION_KEY);
        if (rememberDevice) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      }
    } catch (err: any) {
      // Limpiar cualquier sesión previa en Firebase Auth para evitar colisiones
      if (auth?.currentUser) {
        try {
          await auth.signOut();
        } catch {}
      }

      // 1. Verificar primero contra el perfil resuelto (que respeta los cambios del Administrador)
      if (perfil && perfil.passwordDefault && password === perfil.passwordDefault) {
        const mockUid = `usr-${perfil.rol.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        setUser({
          uid: mockUid,
          email: email.trim(),
          displayName: perfil.nombre,
        } as User);
        setRolUsuarioActivo(perfil.rol);
        setEmpresaAsignadaActiva(perfil.empresaId);
        if (perfil.empresaId !== "TODAS") {
          setCliente(perfil.empresaId as ClienteId);
        }
        setModoDemo(true);
        if (typeof window !== "undefined") {
          if (rememberDevice) {
            window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          }
          window.sessionStorage.setItem(
            DEMO_SESSION_KEY,
            JSON.stringify({
              uid: mockUid,
              email: email.trim(),
              displayName: perfil.nombre,
              rol: perfil.rol,
              empresaId: perfil.empresaId,
            })
          );
        }
        return;
      }

      // 1.1 Si el email es una credencial del sistema o dinámica (empresa / usuario creado)
      const credEncontrada =
        credencialesDinamicas.find((c) => c.email.toLowerCase() === email.trim().toLowerCase()) ||
        CREDENCIALES_SISTEMA.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
      if (credEncontrada && password === credEncontrada.passwordDefault) {
        const mockUid = `usr-${credEncontrada.rol.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        setUser({
          uid: mockUid,
          email: credEncontrada.email,
          displayName: credEncontrada.nombre,
        } as User);
        setRolUsuarioActivo(credEncontrada.rol);
        setEmpresaAsignadaActiva(credEncontrada.empresaId);
        if (credEncontrada.empresaId !== "TODAS") {
          setCliente(credEncontrada.empresaId as ClienteId);
        }
        setModoDemo(true);
        if (typeof window !== "undefined") {
          if (rememberDevice) {
            window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          }
          window.sessionStorage.setItem(
            DEMO_SESSION_KEY,
            JSON.stringify({
              uid: mockUid,
              email: credEncontrada.email,
              displayName: credEncontrada.nombre,
              rol: credEncontrada.rol,
              empresaId: credEncontrada.empresaId,
            })
          );
        }
        return;
      }

      // 1.1 Si coincide con un perfil resuelto (p. ej. supervisor@rpa.com, admin@rpa.com)
      if (perfil && perfil.passwordDefault && password === perfil.passwordDefault) {
        const mockUid = `usr-${perfil.rol.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        setUser({
          uid: mockUid,
          email: email.trim(),
          displayName: perfil.nombre,
        } as User);
        setRolUsuarioActivo(perfil.rol);
        setEmpresaAsignadaActiva(perfil.empresaId);
        if (perfil.empresaId !== "TODAS") {
          setCliente(perfil.empresaId as ClienteId);
        }
        setModoDemo(true);
        if (typeof window !== "undefined") {
          if (rememberDevice) {
            window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          }
          window.sessionStorage.setItem(
            DEMO_SESSION_KEY,
            JSON.stringify({
              uid: mockUid,
              email: email.trim(),
              displayName: perfil.nombre,
              rol: perfil.rol,
              empresaId: perfil.empresaId,
            })
          );
        }
        return;
      }

      // 2. Si coincide con una empresa registrada dinámicamente en Firestore
      const empresaCoincidente = empresas.find(
        (e) =>
          e.emailOperador?.toLowerCase() === email.trim().toLowerCase() &&
          (e.passwordDefault === password || (!e.passwordDefault && password === `${e.codigo}*2026`))
      );
      if (empresaCoincidente) {
        const mockUid = `usr-empresa-${empresaCoincidente.id}`;
        const displayName = `Analista Nómina ${empresaCoincidente.nombre}`;
        setUser({
          uid: mockUid,
          email: email.trim(),
          displayName,
        } as User);
        setRolUsuarioActivo("ANALISTA");
        setEmpresaAsignadaActiva(empresaCoincidente.id);
        setCliente(empresaCoincidente.id as ClienteId);
        setModoDemo(true);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            DEMO_SESSION_KEY,
            JSON.stringify({
              uid: mockUid,
              email: email.trim(),
              displayName,
              rol: "ANALISTA",
              empresaId: empresaCoincidente.id,
            })
          );
        }
        return;
      }

      setAuthError(
        "Credenciales no válidas. Por favor verifica tu correo y contraseña asignada."
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  function handleSeleccionarCredencialRapida(cred: CredencialEmpresa) {
    setEmail(cred.email);
    setPassword(cred.passwordDefault);
    setRolUsuarioActivo(cred.rol);
    setEmpresaAsignadaActiva(cred.empresaId);
    if (cred.empresaId !== "TODAS") {
      setCliente(cred.empresaId as ClienteId);
    }
  }

  async function entrarModoDemo() {
    if (auth) {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        console.warn("Aviso Auth anónimo en Firebase (usando sesión mock local):", e?.message);
      }
    }
    const emailDemo = email || "admin.rpa@blacksmith.com.co";
    const perfil = resolverPerfilUsuario(emailDemo);
    const uidDemo = auth?.currentUser?.uid || "usr-demo-academico";
    setUser({
      uid: uidDemo,
      email: emailDemo,
      displayName: perfil.nombre,
    } as User);
    setRolUsuarioActivo(perfil.rol);
    setEmpresaAsignadaActiva(perfil.empresaId);
    setModoDemo(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        DEMO_SESSION_KEY,
        JSON.stringify({
          uid: uidDemo,
          email: emailDemo,
          displayName: perfil.nombre,
          rol: perfil.rol,
          empresaId: perfil.empresaId,
        })
      );
    }
  }

  function handleNuevoJob(nuevoJob: Job) {
    setJobs((prev) => [nuevoJob, ...prev]);
  }

  function handleActualizarJob(jobId: string, cambios: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...cambios } : j)));
  }

  if (!user) {
    return (
      <div className="relative">
        <LoginScreen
          email={email}
          password={password}
          showPassword={showPassword}
          rememberDevice={rememberDevice}
          isSigningIn={isSigningIn}
          error={authError}
          credencialesDisponibles={credencialesDinamicas}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onToggleShowPassword={() => setShowPassword((v) => !v)}
          onRememberDeviceChange={setRememberDevice}
          onSubmit={iniciarSesion}
          onSeleccionarCredencialRapida={handleSeleccionarCredencialRapida}
        />

        {/* Botón flotante para Acceso Directo de Demostración para Presentación del Profesor */}
        <div className="fixed bottom-4 left-4 z-50">
          <button
            type="button"
            onClick={entrarModoDemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-xl hover:bg-primary/90 transition-all border border-white/20"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Entrar en Modo Demostración Rápida</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      jobs={jobs}
      onNuevoJob={handleNuevoJob}
      onActualizarJob={handleActualizarJob}
      rolInicial={rolUsuarioActivo}
      empresaAsignadaInicial={empresaAsignadaActiva}
      onSignOut={() => {
        auth?.signOut();
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(DEMO_SESSION_KEY);
        }
        setUser(null);
        setModoDemo(false);
        setRolUsuarioActivo("ADMIN");
        setEmpresaAsignadaActiva("TODAS");
      }}
    />
  );
}
