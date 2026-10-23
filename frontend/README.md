# RPA LAD-6819 · Orquestador de Descuentos de Nómina
> **Arquitectura Fullstack Next.js 14 (App Router) + TypeScript + Firebase**  
> *(100% JavaScript / TypeScript — Eliminación total de dependencias en Python)*

Sistema centralizado de liquidación, validación paramétrica y dispersión de deducciones de nómina (Seguro de Vida, Gastos Médicos Mayores GMM y Costos Administrativos) para empresas aliadas corporativas (**Continental Gold**, **Compañía de Financiamiento CDF**, **DXC Technology**, entre otras).

---

## 🚀 Cambios Principales de la Entrega (Evolución Arquitectónica)

1. **Migración a Fullstack Next.js 14 y TypeScript (Sin Python)**:
   - Se reemplazó la arquitectura anterior basada en Vite + FastAPI (Python).
   - Todo el motor de parsing de planillas Excel/CSV, validación de reglas de negocio y cálculo financiero se ejecuta en **TypeScript puro** mediante `xlsx` (SheetJS) en el cliente y servidor Node.js.
   - Ya no se requiere servidor Python, ni FastAPI, ni Pandas, ni entornos `venv`.

2. **Control de Acceso Basado en Roles en el Frontend (RBAC)**:
   - **ADMIN**: Control total (Crear/editar empresas, ajustar reglas paramétricas, carga masiva, pagos individuales y auditoría).
   - **SUPERVISOR**: Monitoreo en tiempo real, KPIs gerenciales, auditoría de seguridad y visualización de reglas.
   - **ANALISTA**: Operación de nómina (Carga masiva de archivos y registro de pagos únicos).
   - **Selector de Rol en Vivo**: Permite alternar perfiles en la cabecera para facilitar la sustentación ante el evaluador.

3. **Carga Masiva de Planillas de Nómina**:
   - Soporte Drag & Drop para formatos `.xlsx`, `.xls` y `.csv`.
   - Validación automática de columnas requeridas por empresa.
   - Cálculo en tiempo real de porcentajes (% Vida, % GMM, % Costos, Total y Topes).
   - Generación y descarga instantánea del reporte liquidado en Excel con hojas de **Resumen Auditoría** y **Detalle Descuentos**.
   - Asentamiento automático del lote en la base de datos Firestore (`jobs`).

4. **Registro de Empresas con Reglas de Negocio Dinámicas**:
   - Módulo interactivo para registrar nuevas empresas corporativas y gestionar parámetros:
     - `% Seguro de Vida` (ej: 1.5%)
     - `% Gastos Médicos Mayores GMM` (ej: 2.0%)
     - `% Costos Administrativos` (ej: 1.0%)
     - `Tope Máximo de Descuento ($ COP)` (ej: $500.000)
     - `Permite Sobregiro` (Interruptor de control estricto vs flexible)
     - `Columnas Requeridas en la Planilla Excel`
   - Persistencia directa en la colección `empresas` de Firestore.

5. **Carga de un Único Pago (Pago Individual)**:
   - Formulario transaccional para asentar deducciones de un empleado específico.
   - Simulador y cálculo en vivo según las reglas de la empresa seleccionada.
   - Verificación de topes máximos y alertas de sobregiro.
   - Registro en la colección `pagos_individuales` y creación automática del Job correspondiente.

6. **Backend REST API Integrado (Route Handlers en Next.js)**:
   - Endpoints REST nativos en TypeScript para consulta e integración externa:
     - `GET /api/health`: Estado del servicio y telemetría.
     - `GET /api/empresas` & `POST /api/empresas`: Gestión de empresas y reglas.
     - `GET /api/pagos` & `POST /api/pagos`: Historial y registro de pagos únicos.
     - `POST /api/nomina/procesar`: Procesamiento de planillas vía API.

---

## 📂 Estructura del Proyecto

```text
frontedRPEA/
├── src/
│   ├── app/                               # Next.js 14 App Router
│   │   ├── layout.tsx                     # Layout global y metadatos
│   │   ├── page.tsx                       # Página raíz: Auth + Dashboard reactivo
│   │   ├── loading.tsx                    # Skeleton de carga
│   │   ├── not-found.tsx                  # Error 404 personalizado
│   │   ├── error.tsx                      # Límite de captura de errores (ErrorBoundary)
│   │   ├── globals.css                    # Directivas Tailwind y fuentes tipográficas
│   │   └── api/                           # Backend REST API (Route Handlers)
│   │       ├── health/route.ts            # GET /api/health
│   │       ├── empresas/route.ts          # GET & POST /api/empresas
│   │       ├── pagos/route.ts             # GET & POST /api/pagos
│   │       └── nomina/procesar/route.ts   # POST /api/nomina/procesar
│   │
│   ├── components/                        # Módulos y Vistas por Rol
│   │   ├── Dashboard.tsx                  # Orquestador del Dashboard principal
│   │   ├── DashboardHeader.tsx            # Cabecera con selector RBAC y navegación dinámica
│   │   ├── CargaMasivaModule.tsx          # Módulo de Carga Masiva (Excel/CSV)
│   │   ├── PagoUnicoModule.tsx            # Módulo de Carga de Pago Único Individual
│   │   ├── EmpresasModule.tsx             # Módulo de Empresas y Reglas de Negocio
│   │   ├── AuditoriaRolesModule.tsx       # Matriz de Segregación de Funciones RBAC
│   │   ├── JobsTable.tsx                  # Monitor en vivo de lotes en Firestore
│   │   ├── JobDrawer.tsx                  # Panel lateral de detalle y auditoría
│   │   ├── KpiSummary.tsx                 # Métricas e indicadores clave (KPIs)
│   │   ├── LoginScreen.tsx                # Pantalla de inicio de sesión institucional
│   │   └── SystemStatusBar.tsx            # Barra de estado del sistema
│   │
│   ├── lib/
│   │   └── excel-processor.ts             # Motor TypeScript de parsing y cálculo de nómina (SheetJS)
│   ├── firebase.ts                        # Configuración universal de Firebase (Auth, Firestore, Storage)
│   ├── types.ts                           # Modelos de datos TypeScript (Empresas, Reglas, Jobs, Roles)
│   ├── declarations.d.ts                  # Declaraciones de tipos para módulos externos
│   └── utils/
│       └── format.ts                      # Utilidades de formato monetario, fechas y bytes
│
├── next.config.mjs                        # Configuración de compilación Next.js y Webpack
├── tailwind.config.ts                     # Configuración del sistema de diseño Tailwind CSS
├── tsconfig.json                          # Configuración estricta de TypeScript
└── package.json                           # Dependencias y scripts del proyecto
```

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/) (100% tipado estricto)
- **Estilos**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Procesamiento de Archivos**: [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Base de Datos & Auth**: [Firebase](https://firebase.google.com/) (Firestore NoSQL, Authentication, Storage)
- **Iconografía & Tipografía**: Google Material Symbols Outlined, Inter, Plus Jakarta Sans

---

## ⚡ Instalación y Ejecución Local

### 1. Prerrequisitos
- Node.js versión **18.17** o superior.
- Gestor de paquetes `npm`.

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Variables de Entorno (`.env`)
El proyecto incluye valores predeterminados seguros en `src/firebase.ts` para pruebas inmediatas y modo demostración. Si deseas conectar a tu propio proyecto de Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 4. Modo Desarrollo
```bash
npm run dev
```
La aplicación iniciará en `http://localhost:3000`.

### 5. Compilación y Ejecución en Producción
```bash
npm run build
npm start
```

---

## 📋 Endpoints de la API REST Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verifica la disponibilidad del servicio y versiones del stack. |
| `GET` | `/api/empresas` | Consulta todas las empresas aliadas y sus reglas de negocio. |
| `POST` | `/api/empresas` | Registra o actualiza una empresa y sus reglas paramétricas. |
| `GET` | `/api/pagos` | Lista el historial de pagos únicos individuales registrados. |
| `POST` | `/api/pagos` | Asienta una transacción de pago único individual y crea el Job. |
| `POST` | `/api/nomina/procesar` | Procesa un lote masivo de nómina desde JSON aplicando reglas. |

---

## 👥 Matriz de Roles y Permisos (RBAC)

| Funcionalidad | ADMIN | SUPERVISOR | ANALISTA |
| :--- | :---: | :---: | :---: |
| **Registrar y Editar Reglas de Empresas** | ✅ Permitido | 👁️ Solo Lectura | ❌ Denegado |
| **Carga Masiva de Planillas (Excel/CSV)** | ✅ Permitido | ❌ Denegado | ✅ Permitido |
| **Cargar Pago Único Individual** | ✅ Permitido | ❌ Denegado | ✅ Permitido |
| **Monitoreo de Lotes y KPIs en Vivo** | ✅ Permitido | ✅ Permitido | 👤 Solo Propios |
| **Exportar Liquidación en Excel (XLSX)** | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Auditoría de Roles y Seguridad** | ✅ Permitido | ✅ Permitido | ❌ Denegado |

---

## 📄 Licencia y Entrega Académica
Proyecto desarrollado para la entrega académica institucional de Automatización Robótica de Procesos (RPA LAD-6819). Todos los derechos reservados.
