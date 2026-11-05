# 🤖 RPA LAD-6819 — Orquestador de Deducciones de Nómina

> **Plataforma Integral de Automatización Robótica de Procesos (RPA) y Conciliación Financiera Multi-Entidad**  
> *Proyecto de Grado / Desarrollo Tecnológico — Tecnológico de Antioquia (TdeA) & Blacksmith Research Colombia SAS*

[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black?logo=next.js)]()
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.0-blue?logo=typescript)]()
[![Tailwind CSS](https://img.shields.io/badge/UI-Cyber--Enterprise%20Futuristic-06b6d4?logo=tailwindcss)]()
[![Firebase Firestore](https://img.shields.io/badge/Database-Firebase%20Firestore-orange?logo=firebase)]()
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel%20Production-success?logo=vercel)](https://fronted-rpea.vercel.app)
[![Vitest](https://img.shields.io/badge/Tests-14%2F14%20Passing%20(100%25)-brightgreen?logo=vitest)]()

---

## 🌐 Enlaces del Proyecto

* 🚀 **Plataforma Web en Producción**: [https://fronted-rpea.vercel.app](https://fronted-rpea.vercel.app)
* 📦 **Repositorio Frontend (Vercel)**: [github.com/wilmerjosevegaacevedo-max/frontedRPEA](https://github.com/wilmerjosevegaacevedo-max/frontedRPEA)
* 🧠 **Repositorio Núcleo / RPA**: [github.com/wilmerjosevegaacevedo-max/Descuentos-de-Nomina](https://github.com/wilmerjosevegaacevedo-max/Descuentos-de-Nomina)

---

## 🎯 Propósito del Sistema

El sistema **RPA LAD-6819** resuelve integralmente la problemática de recepción, validación, cálculo y conciliación de deducciones de nómina (pólizas de vida, gastos médicos mayores, costos de administración y fondos de empleados) para empresas aliadas corporativas (*Continental Gold*, *CDF*, *DXC Technology*).

Elimina reprocesos manuales mediante un pipeline automatizado que:
1. **Monitorea bandejas de correo Gmail** vía protocolo IMAP seguro.
2. **Detecta y clasifica planillas Excel** mediante algoritmos de coincidencia semántica y de estructura.
3. **Valida y aplica reglas de negocio paramétricas** por cliente con topes salariales y normativas laborales vigentes.
4. **Responde automáticamente vía SMTP** adjuntando las planillas liquidadas o reportes de discrepancias.
5. **Sincroniza la bitácora en Firebase Firestore** para auditoría y visualización inmediata en tiempo real.
6. **Emite Comprobantes Oficiales de Deducción** imprimibles y exportables en formato PDF de alta fidelidad.

---

## 🏛️ Arquitectura del Sistema (DDD & Clean Architecture)

El sistema implementa los principios de **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal**, desacoplando completamente las reglas de negocio de la infraestructura:

```text
               ┌────────────────────────────────────────────────────────┐
               │                  CAPA DE PRESENTACIÓN                  │
               │   • Consola Web Futurista (Next.js 14 App Router)      │
               │   • Dashboard HUD • Carga Masiva • Pago Individual     │
               └───────────────────────────┬────────────────────────────┘
                                           │
               ┌───────────────────────────▼────────────────────────────┐
               │                   CAPA DE APLICACIÓN                   │
               │   • Orquestador de Lotes (orchestrator.ts)             │
               │   • Detector Semántico de Clientes (detector.ts)       │
               │   • Liquidador Masivo e Individual de Nómina           │
               └───────────────────────────┬────────────────────────────┘
                                           │
               ┌───────────────────────────▼────────────────────────────┐
               │                    CAPA DE DOMINIO                     │
               │   • Entidades de Nómina, Empleado y Reglas de Negocio  │
               │   • Políticas Paramétricas (Continental, CDF, DXC)     │
               │   • Validaciones de Topes y Porcentajes de Pólizas     │
               └───────────────────────────┬────────────────────────────┘
                                           │
               ┌───────────────────────────▼────────────────────────────┐
               │                  CAPA DE INFRAESTRUCTURA               │
               │   • Conector IMAP Flow (Gmail Sync)                    │
               │   • Servicio SMTP Nodemailer (Notificaciones)          │
               │   • Persistencia Firestore (Bitácora & Reglas en Vivo) │
               │   • Motor de Hojas de Cálculo (XLSX Engine)            │
               └────────────────────────────────────────────────────────┘
```

---

## 🚀 Módulos de la Plataforma Web

### 1. Centro de Control Operacional (HUD Command Center)
* Métricas en tiempo real: Lotes procesados hoy, tasa de efectividad porcentual, empresas aliadas activas y último lote registrado.
* Botón de **Sincronización Directa con Buzón Gmail** para disparo manual del robot RPA.
* Acciones rápidas de despacho: "Nueva Planilla" y "Descuento Individual".
* Tabla reactiva de lotes con filtros de estado (*Exitoso*, *En Proceso*, *Fallo*), reintento inmediato y descarga de archivos procesados ZIP/Excel.

### 2. Módulo de Carga Masiva de Planillas
* Zona de carga interactiva **Drag & Drop** con soporte para `.xlsx` y `.xls`.
* Validación previa de estructura y visualización previa de registros válidos e inválidos.
* Cálculo instantáneo de totales y deducciones.
* Encolado del lote hacia el motor RPA y exportación de la planilla liquidada con fórmulas auditables.

### 3. Módulo de Pago y Deducción Individual
* Formulario para la aplicación inmediata de deducciones unitarias por empleado.
* Botón **"Llenar con Ejemplo"** para demostraciones y sustentaciones rápidas.
* Cálculo transparente en vivo del desglose de conceptos:
  * Póliza de Vida Colectiva.
  * Gastos Médicos Mayores (GMM).
  * Cuota de Manejo / Gastos Administrativos.
* **Comprobante Oficial de Retención de Nómina**: Modal con diseño formal institucional que genera el recibo oficial con botón directo de impresión o guardado en PDF (`window.print()`).

### 4. Módulo de Empresas y Reglas de Negocio Paramétricas
* Gestión dinámica en Firestore de las entidades aliadas:
  * **Continental Gold**: Póliza de Vida (1.5%), GMM (2.0%), Costo Fijo ($15.000 COP), Tope Salarial (40%).
  * **CDF**: Póliza de Vida (1.2%), GMM (1.8%), Costo Fijo ($12.000 COP), Tope Salarial (35%).
  * **DXC Technology**: Póliza de Vida (1.0%), GMM (2.5%), Costo Fijo ($18.000 COP), Tope Salarial (45%).
* Posibilidad de registrar nuevas empresas o restaurar las predeterminadas con un solo clic.

### 5. Seguridad y Control de Acceso RBAC
* Segregación estricta de datos por roles corporativos:
  * **Admin Master**: Acceso total al centro de control, carga masiva, pagos individuales, edición de reglas y auditoría.
  * **Auditor Central (Supervisor)**: Acceso de solo lectura y monitoreo global de todas las empresas.
  * **Analista de Nómina**: Delimitación estricta de visualización y procesamiento únicamente a la empresa asignada a sus credenciales.
* Selector rápido de credenciales de demostración en la pantalla de inicio de sesión.

---

## 🌌 Diseño Visual Futurista (Cyber-Enterprise Command Deck)

La interfaz gráfica fue rediseñada para ofrecer una experiencia estética de sala de control aeroespacial y fintech moderna:
* **Fondo Dark Space & Cyber Grid**: Base negro obsidiana (`#030712`) con cuadrícula cibernética y halos de luz azul cian y violeta esmerilados.
* **Paneles Glassmorphism Holográficos**: Tarjetas en vidrio oscuro translúcido (`bg-slate-950/85 backdrop-blur-2xl`) con bordes micro-iluminados (`border-slate-800 hover:border-cyan-500/40`).
* **Controles Táctiles HUD**: Botones con degradados tridimensionales de Neón Cian a Azul Eléctrico (`from-cyan-500 via-blue-600 to-indigo-600`) y halo exterior de iluminación.
* **Tipografía High-Tech**: Cifras financieras, NITs y porcentajes en tipografía monoespaciada (`Space Grotesk / monospace`) con acentos brillantes en verde esmeralda y cian.

---

## 📁 Estructura del Repositorio

```text
rpa_lad_6819/
├── frontend/                       # Motor RPA + Plataforma Web (Next.js 14 / TypeScript)
│   ├── src/
│   │   ├── app/                    # App Router, Layout y Endpoints API (/api/empresas, /api/pagos)
│   │   ├── components/             # Componentes HUD Futuristas:
│   │   │   ├── LoginScreen.tsx     # Consola de autenticación con perfiles demo
│   │   │   ├── Dashboard.tsx       # Orquestador visual y contenedor principal
│   │   │   ├── DashboardHeader.tsx # Barra de navegación fija con estado de conexión
│   │   │   ├── KpiSummary.tsx      # Métricas de efectividad y volumen
│   │   │   ├── JobsTable.tsx       # Tabla de lotes con filtros y reintentos
│   │   │   ├── JobDrawer.tsx       # Panel lateral de inspección de lote
│   │   │   ├── CargaMasivaModule.tsx # Procesamiento de planillas Excel
│   │   │   ├── PagoUnicoModule.tsx # Descuento individual y Comprobante PDF
│   │   │   ├── EmpresasModule.tsx  # Parametrización de reglas de negocio
│   │   │   └── SystemStatusBar.tsx # Diagnóstico del robot y servicios
│   │   ├── lib/
│   │   │   └── rpa/                # Motor RPA en TypeScript puro
│   │   │       ├── clients/        # Conectores para Continental, CDF, DXC
│   │   │       ├── services/       # Email IMAP/SMTP, Firestore y Tracker
│   │   │       ├── orchestrator.ts # Ciclo de vida y procesamiento
│   │   │       └── detector.ts     # Detección inteligente de archivos
│   │   ├── types/                  # Tipado de dominio, interfaces y roles
│   │   └── utils/                  # Formateadores de moneda y fechas
│   ├── tests/
│   │   └── rpa.test.ts             # 14 Pruebas unitarias automatizadas (Vitest)
│   ├── package.json                # Dependencias del ecosistema TypeScript
│   ├── tailwind.config.ts          # Tokens de diseño Cyber-Enterprise
│   └── vitest.config.ts            # Configuración de pruebas unitarias
├── docs/                           # Especificaciones técnicas, flujogramas y actas
├── ejecutar_rpa.bat                # Lanzador automatizado para Windows (un solo clic)
├── firestore.rules                 # Reglas de seguridad Firebase Firestore
└── storage.rules                   # Reglas de seguridad Firebase Storage
```

---

## ⚙️ Guía de Ejecución Local

### 1. Requisitos Previos
* Node.js v18+ o v20+
* NPM / PNPM

### 2. Ejecutar la Plataforma Web
```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias (si es primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```
Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

### 3. Ejecutar las Pruebas Unitarias
```bash
cd frontend
npm test
```
*Ejecuta 14 pruebas automatizadas que validan el 100% de los algoritmos de Continental, CDF, DXC, la detección semántica y el aislamiento de datos.*

### 4. Ejecutar el Robot RPA por Consola (o Doble Clic en Windows)
En Windows, simplemente haz doble clic en el archivo raíz:
```cmd
ejecutar_rpa.bat
```
O desde la terminal:
```bash
cd frontend
npm run rpa
```

---

## 🎓 Créditos y Contexto Institucional

* **Institución**: Tecnológico de Antioquia — Institución Universitaria (TdeA)
* **Facultad**: Facultad de Ingeniería
* **Organización Patrocinadora**: Blacksmith Research Colombia SAS
* **Línea de Investigación**: Automatización Robótica de Procesos (RPA), Arquitecturas de Software Empresariales y FinTech.
* **Fecha**: Noviembre 2026
