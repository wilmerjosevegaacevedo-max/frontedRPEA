# 🤖 Directrices para Agentes de IA — Plataforma Fullstack RPA LAD-6819

Este archivo define las reglas de desarrollo, arquitectura y estándares de calidad que todos los agentes de IA (Antigravity, Cursor, Copilot, etc.) deben acatar al realizar modificaciones en este repositorio.

---

## 📂 Arquitectura Fullstack (Next.js 14 App Router)

El proyecto está consolidado en una arquitectura **100% TypeScript Fullstack** dentro de `frontend/`:
- **`frontend/src/app/`**: Vistas del App Router y **Route Handlers API REST** (`/api/rpa/scan`, `/api/nomina/procesar`, `/api/empresas`, `/api/pagos`, `/api/health`).
- **`frontend/src/components/`**: Módulos interactivos con diseño *Obsidian FinTech* y segregación por roles (RBAC).
- **`frontend/src/lib/`**: Motor paramétrico de liquidación y procesamiento de hojas de cálculo con SheetJS (`excel-processor.ts`).
- **`.ai-context/`**: Contexto del negocio y especificaciones arquitectónicas (`project-context.md`).

---

## 💻 Convenciones de Ingeniería (`frontend/`)

1. **Stack Tecnológico**:
   - Next.js 14 con App Router (`src/app/`).
   - TypeScript estricto con interfaces centralizadas en `src/types.ts`.
   - Tailwind CSS para estilos utilitarios y consistencia visual (`tabular-nums` en montos financieros).
   - SheetJS (`xlsx`) para parsing y generación de hojas de cálculo tanto en cliente como en servidor.
   - `imapflow`, `mailparser` y `nodemailer` en `/api/rpa/scan` para el robot desatendido de correo Gmail.
   - Firebase Client & REST SDK (`src/firebase.ts`).

2. **Control de Acceso por Roles (RBAC)**:
   - Toda acción privilegiada (crear/eliminar empresa, modificar parámetros, liquidar nómina, sincronizar buzón IMAP) debe validar el rol activo (`ADMIN`, `SUPERVISOR`, `ANALISTA`).
   - El rol `SUPERVISOR` es estrictamente de auditoría y solo lectura.
   - El rol `ANALISTA` opera delimitado exclusivamente a su `empresaAsignada`.

3. **Manejo de Errores y Resiliencia**:
   - Todas las llamadas a Firestore deben tener control de errores mediante bloques `try/catch`.
   - Mantener estado de fallback local para que la interfaz nunca quede congelada ni genere pantallas en blanco.

4. **Verificación y Calidad**:
   - Antes de dar por concluido un cambio, verificar que la compilación estática de tipos pase sin errores:
     ```powershell
     cd frontend
     npm run typecheck
     ```

---

## 🔐 Seguridad y Credenciales

- **NUNCA** commitear archivos de credenciales: `.env`, `.env.local`, claves privadas o contraseñas de aplicación SMTP/IMAP en el código fuente.
- Utilizar siempre variables de entorno `NEXT_PUBLIC_FIREBASE_*` para el cliente y `MAILBOX_USER` / `MAILBOX_PASSWORD` exclusivamente en el entorno del servidor.
