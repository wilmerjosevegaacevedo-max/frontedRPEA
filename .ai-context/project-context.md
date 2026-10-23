# 🧠 Project Context — RPA LAD-6819: Orquestador de Descuentos de Nómina

## 📌 Visión General
**RPA LAD-6819** es una solución integral diseñada para la automatización, cálculo, liquidación y auditoría de descuentos de nómina corporativos (Seguro de Vida, Gastos Médicos Mayores GMM y Costos Administrativos) para empresas aliadas como **Continental Gold**, **Compañía de Financiamiento CDF** y **DXC Technology**.

El repositorio está estructurado como un **Monorepo** que unifica dos subsistemas complementarios:
1. **Frontend / Web Platform (`frontend/`)**: Aplicación web moderna construida en Next.js 14 App Router con TypeScript, Tailwind CSS y Firebase, ofreciendo un Dashboard gerencial y operativo con control de acceso basado en roles (RBAC).
2. **Backend / Bot RPA (`backend/`)**: Motor de automatización desatendida en Python con procesamiento de correos IMAP (Gmail), parsing y validación paramétrica de planillas Excel, notificaciones SMTP, sincronización FTP y API HTTP con FastAPI.

---

## 🏗️ Estructura del Monorepo

```text
frontedRPEA/
├── .ai-context/
│   └── project-context.md        # Documentación de contexto y arquitectura para IA y desarrolladores
├── backend/                      # Motor RPA en Python (Legacy & Microservicio API)
│   ├── clients/                  # Implementación de lógica por cliente (CDF, Continental, DXC)
│   ├── config/                   # Carga de variables de entorno seguras (.env)
│   ├── data/                     # Bitácora anti-duplicados y registros locales
│   ├── docs/                     # Documentación técnica adicional y diagramas
│   ├── files/                    # Almacenamiento de archivos temporales y plantillas
│   ├── logs/                     # Trazabilidad y bitácoras de ejecución
│   ├── services/                 # Servicios modulares (Mailbox IMAP, Email SMTP, Firebase)
│   ├── tests/                    # Pruebas automatizadas (pytest)
│   ├── api.py                    # API REST con FastAPI (Job Dispatcher)
│   ├── base_client.py            # Patrón Template Method para clientes
│   ├── ConexionFtp.py            # Cliente FTP con reintentos automáticos
│   ├── layout_config.yaml        # Mapeo y detección de clientes por asunto/dominio
│   ├── main.py                   # Orquestador CLI principal del bot
│   ├── records_data.py           # Gestor de historial y sincronización con Firestore
│   ├── registro_log.py           # Logger rotativo estructurado y consola
│   └── requirements.txt          # Dependencias de Python
├── frontend/                     # Plataforma Web Next.js 14 App Router
│   ├── src/
│   │   ├── app/                  # App Router, Layouts, Vistas y Route Handlers API
│   │   │   ├── api/              # REST API nativo en Next.js (/health, /empresas, /pagos, /nomina)
│   │   │   ├── globals.css       # Estilos globales y tokens Tailwind
│   │   │   ├── layout.tsx        # Layout principal de la aplicación
│   │   │   └── page.tsx          # Punto de entrada reactivo (Dashboard / Login)
│   │   ├── components/           # Componentes modulares y vistas por Rol (RBAC)
│   │   │   ├── Dashboard.tsx     # Tablero principal y control de navegación
│   │   │   ├── CargaMasivaModule.tsx   # Carga y liquidación masiva de planillas
│   │   │   ├── PagoUnicoModule.tsx     # Formulario y simulador de pagos individuales
│   │   │   ├── EmpresasModule.tsx      # Gestión dinámica de empresas y reglas
│   │   │   ├── AuditoriaRolesModule.tsx# Matriz de permisos y segregación RBAC
│   │   │   ├── JobsTable.tsx           # Monitor en tiempo real de lotes (Firestore)
│   │   │   └── JobDrawer.tsx           # Panel de auditoría e inspección
│   │   ├── lib/                  # Motor de cálculo financiero y parsing Excel (SheetJS)
│   │   ├── firebase.ts           # Inicialización universal de Firebase SDK
│   │   └── types.ts              # Definiciones TypeScript estrictas
│   ├── package.json              # Dependencias y scripts de Node.js
│   ├── tailwind.config.ts        # Configuración de diseño responsivo y tema
│   └── tsconfig.json             # Configuración estricta de compilador TypeScript
├── .gitignore                    # Reglas de exclusión unificadas para git
├── AGENTS.md                     # Guía operativa y directrices para agentes inteligentes
└── EJECUTAR_PLATAFORMA.md        # Manual integral de arranque y comandos locales
```

---

## 👥 Control de Acceso por Roles (RBAC)

La plataforma web implementa una matriz estricta de segregación de funciones:

| Rol | Carga Masiva | Pagos Individuales | Configurar Empresas & Reglas | Auditoría & Métricas |
| :--- | :---: | :---: | :---: | :---: |
| **Administrador (ADMIN)** | ✅ | ✅ | ✅ (Crear/Editar) | ✅ (Completa) |
| **Supervisor (SUPERVISOR)** | ❌ | ❌ | 👁️ (Solo Lectura) | ✅ (Auditoría Avanzada) |
| **Analista (ANALISTA)** | ✅ | ✅ | ❌ | 👁️ (Lotes propios) |

---

## 📊 Reglas de Negocio y Liquidación de Descuentos

Para cada colaborador en la planilla de nómina:
1. **Deducción Seguro de Vida**: `Salario Base * % Seguro Vida (Empresa)`
2. **Deducción Gastos Médicos Mayores (GMM)**: `Salario Base * % GMM (Empresa)`
3. **Costos Administrativos**: `Salario Base * % Costos Admin (Empresa)`
4. **Total Descuento Teórico**: `Vida + GMM + Costos`
5. **Validación de Tope Máximo**:
   - Si `Total Descuento > Tope Máximo` y `Permite Sobregiro == False`: Se ajusta al tope y se emite alerta de auditoría.
   - Si `Permite Sobregiro == True`: Se liquida el valor completo y se marca con bandera preventiva.

---

## ☁️ Integraciones Cloud y Servicios Externos

- **Firebase Firestore**: Base de datos NoSQL para colecciones `jobs`, `empresas`, `pagos_individuales` y `logs`.
- **Firebase Authentication**: Control de sesiones de usuario con JWT y tokens seguros.
- **Firebase Storage**: Repositorio de planillas de entrada (`entrada/`) y reportes procesados en ZIP (`salida/`).
- **Google Workspace Gmail (IMAP/SMTP)**: Recepción de archivos vía correo y envío de respuestas automatizadas con confirmación o reporte de errores.
- **Servidor FTP**: Sincronización corporativa bidireccional de archivos validados.
