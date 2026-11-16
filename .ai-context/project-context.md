# 🧠 Project Context — RPA LAD-6819: Orquestador de Descuentos de Nómina

## 📌 Visión General
**RPA LAD-6819** es una solución integral diseñada para la automatización, cálculo, liquidación y auditoría de descuentos de nómina corporativos (Seguro de Vida, Gastos Médicos Mayores GMM y Costos Administrativos) para empresas aliadas como **Continental Gold**, **Compañía de Financiamiento CDF**, **DXC Technology** y cualquier entidad adicional configurada dinámicamente.

El sistema opera sobre una arquitectura **100% TypeScript Fullstack en Next.js 14 (App Router)** que unifica:
1. **Consola Web & Dashboard Operativo (`frontend/src/components/`)**: Interfaz *Obsidian FinTech* con control de acceso basado en roles (RBAC), ingesta Drag & Drop de planillas Excel, simulador de descuentos individuales con comprobante PDF e inspección de trazabilidad en tiempo real.
2. **Motor RPA & API Serverless (`frontend/src/app/api/`)**: Procesamiento desatendido de correos corporativos vía IMAP (`imapflow`), validación y cálculo fila a fila con SheetJS (`xlsx`), notificaciones automáticas por correo SMTP (`nodemailer`) y persistencia en la nube con Firebase Firestore.

---

## 🏗️ Estructura del Proyecto

```text
frontedRPEA/
├── .ai-context/
│   └── project-context.md        # Documentación de contexto y arquitectura del sistema
├── frontend/                     # Plataforma Fullstack Next.js 14 App Router
│   ├── src/
│   │   ├── app/                  # App Router, Layouts, Vistas y Route Handlers API
│   │   │   ├── api/              # REST API nativo (/health, /empresas, /pagos, /nomina/procesar, /rpa/scan)
│   │   │   ├── globals.css       # Estilos globales, tema Obsidian y reglas @media print
│   │   │   ├── layout.tsx        # Layout principal de la aplicación
│   │   │   └── page.tsx          # Punto de entrada reactivo (Login / Sesión Persistente / Dashboard)
│   │   ├── components/           # Componentes modulares y vistas por Rol (RBAC)
│   │   │   ├── Dashboard.tsx           # Tablero principal y coordinación de módulos
│   │   │   ├── DashboardHeader.tsx     # Barra de navegación fija con control RBAC
│   │   │   ├── CargaMasivaModule.tsx   # Carga, validación y liquidación masiva de planillas Excel/CSV
│   │   │   ├── PagoUnicoModule.tsx     # Liquidación individual y emisión de Comprobante PDF
│   │   │   ├── EmpresasModule.tsx      # Gestión dinámica de empresas y reglas paramétricas
│   │   │   ├── AuditoriaRolesModule.tsx# Matriz de permisos RBAC y directorio de usuarios
│   │   │   ├── JobsTable.tsx           # Monitor en tiempo real de lotes (Firestore onSnapshot)
│   │   │   ├── JobDrawer.tsx           # Panel de inspección financiera y trazabilidad por lote
│   │   │   ├── KpiSummary.tsx          # Tarjetas de indicadores clave de rendimiento
│   │   │   └── SystemStatusBar.tsx     # Barra de diagnóstico y latencia en vivo
│   │   ├── lib/
│   │   │   └── excel-processor.ts      # Motor de cálculo financiero y parsing Excel (SheetJS)
│   │   ├── tests/
│   │   │   └── audit-suite.test.ts     # Suite de pruebas de reglas de negocio y RBAC
│   │   ├── utils/
│   │   │   └── format.ts               # Formateadores de fechas, bytes y tiempos relativos
│   │   ├── firebase.ts           # Inicialización universal de Firebase SDK
│   │   └── types.ts              # Definiciones TypeScript estrictas y resolución de perfiles
│   ├── .env.example              # Plantilla de variables de entorno (Firebase + Gmail IMAP/SMTP)
│   ├── INICIAR_SISTEMA_LOCAL.bat # Lanzador automático para entorno local en Windows
│   ├── package.json              # Dependencias y scripts de verificación
│   ├── tailwind.config.ts        # Configuración de diseño y tokens de color
│   └── tsconfig.json             # Configuración estricta del compilador TypeScript
├── firestore.rules               # Reglas de seguridad de Firebase Firestore
├── .gitignore                    # Reglas de exclusión para control de versiones
├── AGENTS.md                     # Directrices operativas para agentes de IA
├── EJECUTAR_PLATAFORMA.md        # Manual de arranque y endpoints
└── README.md                     # Documentación general del repositorio
```

---

## 👥 Control de Acceso por Roles (RBAC)

La plataforma implementa una matriz estricta de segregación de funciones:

| Rol | Carga Masiva & Gmail RPA | Pagos Individuales | Configurar Empresas & Reglas | Auditoría & Métricas |
| :--- | :---: | :---: | :---: | :---: |
| **Administrador (`ADMIN`)** | ✅ (Todas) | ✅ (Todas) | ✅ (Crear / Editar / Eliminar) | ✅ (Completa y Editable) |
| **Supervisor (`SUPERVISOR`)** | ❌ | ❌ | 👁️ (Solo Lectura) | ✅ (Auditoría en Solo Lectura) |
| **Analista (`ANALISTA`)** | ✅ (Su empresa) | ✅ (Su empresa) | ❌ | 👁️ (Solo lotes de su empresa) |

---

## 📊 Reglas de Negocio y Liquidación de Descuentos

Para cada colaborador en la planilla de nómina:
1. **Deducción Seguro de Vida**: `Math.round(Salario Base * (% Seguro Vida / 100))`
2. **Deducción Gastos Médicos Mayores (GMM)**: `Math.round(Salario Base * (% GMM / 100))`
3. **Costos Administrativos**: `Math.round(Salario Base * (% Costos Admin / 100))`
4. **Total Descuento Calculado**: `Vida + GMM + Costos`
5. **Validación de Tope Máximo y Límite Legal (CST)**:
   - Si `Total Descuento > Tope Máximo` y `Permite Sobregiro == false`: Se trunca al `Tope Máximo` y se marca como `TOPADO`.
   - Si `Permite Sobregiro == true`: Se aplica el valor total calculado.
   - Si el descuento aplicado supera el **50% del salario base**, se emite alerta preventiva conforme al Código Sustantivo del Trabajo (`>50% CST`).
