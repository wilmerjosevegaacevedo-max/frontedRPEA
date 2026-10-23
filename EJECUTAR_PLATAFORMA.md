# 🚀 Guía de Ejecución de la Plataforma RPA LAD-6819

Este documento contiene las instrucciones paso a paso para levantar tanto el **Frontend (Next.js)** como el **Backend (Bot RPA / FastAPI)** en un entorno local de Windows.

---

## 📋 Prerrequisitos

- **Node.js** v18 o superior y **npm**.
- **Python** 3.10 o superior.
- **Git** instalado.
- Conexión a Internet para sincronización con Firebase y servicios de correo.

---

## 🌐 1. Ejecutar el Frontend (Next.js 14 Web App)

La aplicación web ofrece el Dashboard administrativo y operativo con roles RBAC.

### Opción Rápida (Script por Lotes)
1. Abrir una terminal o el Explorador de Archivos en la carpeta `frontend/`.
2. Hacer doble clic o ejecutar:
   ```cmd
   INICIAR_SISTEMA_LOCAL.bat
   ```
   *El script iniciará el servidor en el puerto 3001 y abrirá automáticamente el navegador.*

### Opción Manual (Línea de Comandos)
```powershell
# 1. Ubicarse en la carpeta frontend
cd frontend

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar el servidor en modo desarrollo
npm run dev -- -p 3001
```

- **URL de Acceso Local**: [http://localhost:3001](http://localhost:3001)
- **Roles para Pruebas**: Puedes alternar entre `ADMIN`, `SUPERVISOR` y `ANALISTA` directamente desde el selector de la barra superior.

---

## 🐍 2. Ejecutar el Backend (Bot RPA & API HTTP)

El backend contiene el motor de automatización de nómina y los servicios de correo.

### A. Ejecutar el Motor RPA (Modo Automático Buzón IMAP)
Monitorea la bandeja de correo en busca de planillas adjuntas, las liquida y envía el resultado por correo:

```powershell
# 1. Ubicarse en la carpeta backend
cd backend

# 2. Activar el entorno virtual
.\venv\Scripts\activate

# 3. Ejecutar el motor principal
python main.py
```
*(También puedes hacer doble clic en `backend\ejecutar_rpa.bat`)*

### B. Ejecutar el Motor RPA en Modo Manual (Archivo Específico)
Para procesar un archivo Excel local sin requerir conexión a la bandeja de correo:

```powershell
python main.py --cliente cdf --archivo "files\templates\cdf_plantilla.xlsx"
```
*Clientes disponibles: `cdf`, `continental`, `dxc`.*

### C. Ejecutar el Servidor REST API (FastAPI)
Para habilitar el despacho de trabajos y conexión HTTP:

```powershell
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Documentación Swagger Interactiva**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 3. Ejecución de Pruebas Automatizadas

### Pruebas del Backend (Pytest)
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

### Validación del Frontend (Build & Lint)
```powershell
cd frontend
npm run build
```

---

## 🛑 Detener los Servicios

Para detener cualquiera de los servidores en ejecución, presiona `Ctrl + C` en la terminal correspondiente.
