# 🤖 Directrices para Agentes de IA — Monorepo RPA LAD-6819

Este archivo define las reglas de desarrollo, arquitectura y estándares de calidad que todos los agentes de IA (Antigravity, Cursor, Copilot, etc.) deben acatar al realizar modificaciones en este repositorio.

---

## 📂 Arquitectura Monorepo

El repositorio está dividido estrictamente en dos subsistemas:
- **`frontend/`**: Plataforma Web Next.js 14 (App Router) + TypeScript + Tailwind CSS + Firebase.
- **`backend/`**: Motor RPA y API HTTP en Python (IMAP, SMTP, FastAPI, Pandas, OpenpyXL).
- **`.ai-context/`**: Contexto del negocio y especificaciones arquitectónicas (`project-context.md`).

> ⚠️ **REGLA DE ORO**: No mezclar dependencias entre frontend y backend. Cada subsistema cuenta con sus propios archivos de dependencias (`package.json` en `frontend/` y `requirements.txt` en `backend/`).

---

## 💻 Convenciones para Frontend (`frontend/`)

1. **Stack Tecnológico**:
   - Next.js 14 con App Router (`src/app/`).
   - TypeScript estricto con interfaces centralizadas en `src/types.ts`.
   - Tailwind CSS para estilos utilitarios y consistencia visual.
   - SheetJS (`xlsx`) para parsing de hojas de cálculo del lado del cliente/servidor.
   - Firebase Client SDK (`src/firebase.ts`).

2. **Control de Acceso por Roles (RBAC)**:
   - Toda acción privilegiada (crear empresa, modificar parámetros, liquidar nómina) debe validar el rol activo (`ADMIN`, `SUPERVISOR`, `ANALISTA`).
   - No exponer botones interactivos que no correspondan al nivel de permisos del rol en pantalla.

3. **Manejo de Errores y Resiliencia**:
   - Todas las llamadas a Firestore deben tener control de errores mediante bloques `try/catch`.
   - Mantener estado de fallback para que la interfaz nunca quede congelada ni genere pantallas en blanco.

---

## 🐍 Convenciones para Backend (`backend/`)

1. **Stack Tecnológico**:
   - Python 3.10+ con tipado estático (Type Hints).
   - FastAPI + Uvicorn para endpoints REST.
   - Entornos virtuales aislados (`venv/`).
   - Logging estructurado con `registro_log.py` (usar `logger.info`, `logger.error`, `logger.seccion`, `logger.success`).

2. **Patrón Template Method**:
   - Todo nuevo cliente empresarial debe heredar de `BaseClient` en `base_client.py` e implementar su método `procesar()`.
   - Registrar la clase en `clients/__init__.py` (`CLIENT_MAP`) y sus reglas en `layout_config.yaml`.

3. **Pruebas y Validación**:
   - Antes de dar por concluido un cambio en el backend, ejecutar la suite de pruebas unitarias:
     ```powershell
     cd backend
     .\venv\Scripts\python.exe -m pytest
     ```

---

## 🔐 Seguridad y Credenciales

- **NUNCA** commitear archivos de credenciales: `.env`, `firebase-key.json`, certificados `.pfx` o tokens de sesión.
- Utilizar siempre `config/environment.py` en Python y variables de entorno `NEXT_PUBLIC_*` en Next.js para valores dinámicos.
