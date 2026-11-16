# 🚀 Guía de Ejecución de la Plataforma RPA LAD-6819

Este documento contiene las instrucciones paso a paso para ejecutar y verificar la plataforma **RPA LAD-6819 (Next.js 14 Fullstack + Motor RPA Gmail + Firebase Firestore)** en un entorno local de Windows o en producción.

---

## 📋 Prerrequisitos

- **Node.js** v18 o superior y **npm**.
- **Git** instalado.
- Conexión a Internet para sincronización en tiempo real con Firebase Firestore y el buzón corporativo de Gmail (IMAP/SMTP).

---

## 🌐 1. Ejecutar la Plataforma Completa (Frontend + API REST + Bot RPA)

Toda la solución (Dashboard interactivo, motor de cálculo SheetJS y robot de lectura de correo IMAP/SMTP) se ejecuta de forma unificada sobre Next.js 14.

### Opción Rápida (Un clic en Windows)
1. Abrir el Explorador de Archivos en la carpeta `frontend/`.
2. Hacer doble clic en:
   ```cmd
   INICIAR_SISTEMA_LOCAL.bat
   ```
   *El script iniciará el servidor en el puerto `3000` y abrirá automáticamente el navegador.*

### Opción Manual (Terminal PowerShell)
```powershell
# 1. Ubicarse en la carpeta frontend
cd frontend

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

- **URL de Acceso Local**: [http://localhost:3000](http://localhost:3000)
- **URL de Producción (Vercel)**: [https://fronted-rpea.vercel.app](https://fronted-rpea.vercel.app)

---

## 🔌 2. Endpoints de la API Fullstack Integrada

El servidor Next.js expone los siguientes endpoints bajo `src/app/api/`:

| Endpoint | Método | Descripción |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Diagnóstico de salud, versión (`v2.4.0`) y estado del motor Fullstack. |
| `/api/rpa/scan` | `POST` | Conecta vía IMAP a Gmail, descarga adjuntos Excel, liquida según reglas de la empresa, guarda en Firestore, mueve el correo a `Procesados`/`Errores` y notifica por SMTP. |
| `/api/nomina/procesar` | `POST` | Liquida un lote de nómina enviado en formato JSON aplicando las reglas de negocio de la empresa. |
| `/api/empresas` | `GET / POST` | Consulta o actualiza el catálogo de empresas aliadas y sus porcentajes paramétricos. |
| `/api/pagos` | `GET / POST` | Consulta o asienta descuentos individuales con generación de lote en Firestore. |

---

## 🧪 3. Verificación de Tipos y Compilación de Producción

```powershell
cd frontend

# 1. Verificación estática de tipos TypeScript
npm run typecheck

# 2. Compilación optimizada de producción
npm run build
```

---

## 🛑 Detener el Servidor

Para detener el servidor local en ejecución, presiona `Ctrl + C` en la terminal activa.
