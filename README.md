# 🤖 RPA LAD-6819 — Orquestador de Deducciones de Nómina

> **Plataforma Integral de Automatización Robótica de Procesos (RPA) y Conciliación Financiera**  
> *Tecnológico de Antioquia (TdeA) • Facultad de Ingeniería • Blacksmith Research Colombia SAS*

[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)]()
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue?logo=typescript)]()
[![Tailwind CSS](https://img.shields.io/badge/UI-Cyber--Enterprise-06b6d4?logo=tailwindcss)]()
[![Firebase](https://img.shields.io/badge/DB-Firestore-orange?logo=firebase)]()
[![Vercel](https://img.shields.io/badge/Deploy-Production-success?logo=vercel)](https://fronted-rpea.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-14%2F14%20Pass-brightgreen?logo=vitest)]()

---

## ⚡ Acceso Rápido

* 🚀 **Plataforma Web (Producción)**: [https://fronted-rpea.vercel.app](https://fronted-rpea.vercel.app)
* 📦 **Repositorio Frontend (Next.js)**: [github.com/wilmerjosevegaacevedo-max/frontedRPEA](https://github.com/wilmerjosevegaacevedo-max/frontedRPEA)
* 🧠 **Repositorio Núcleo (RPA)**: [github.com/wilmerjosevegaacevedo-max/Descuentos-de-Nomina](https://github.com/wilmerjosevegaacevedo-max/Descuentos-de-Nomina)

---

## 🎯 Objetivo

Automatizar de extremo a extremo la recepción, validación algorítmica, cálculo de pólizas y conciliación contable de deducciones de nómina para empresas aliadas (*Continental Gold*, *CDF*, *DXC Technology*), eliminando reprocesos manuales y garantizando trazabilidad auditables en tiempo real.

---

## 🏛️ Arquitectura (DDD & Hexagonal)

```text
┌────────────────────────────────────────────────────────┐
│ PRESENTACIÓN : Consola Web Futurista (Next.js 14)      │
├────────────────────────────────────────────────────────┤
│ APLICACIÓN   : Orquestador (orchestrator.ts) & Reglas  │
├────────────────────────────────────────────────────────┤
│ DOMINIO      : Entidades de Nómina, Pólizas & Límites  │
├────────────────────────────────────────────────────────┤
│ INFRAESTR.   : IMAP Gmail, SMTP, Firestore & XLSX      │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos del Sistema

| Módulo | Función Principal | Perfiles Autorizados |
| :--- | :--- | :--- |
| **Centro de Control** | Monitoreo en tiempo real, KPIs, disparo Gmail y bitácora de lotes. | Admin Master, Auditor, Analista |
| **Carga Masiva** | Ingesta Drag & Drop de Excel, validación fila a fila y liquidación. | Admin Master, Analista |
| **Pago Individual** | Deducción unitaria por empleado y emisión de **Comprobante Oficial PDF**. | Admin Master, Analista |
| **Empresas & Reglas** | Parametrización en vivo de topes, porcentajes de vida y GMM en Firestore. | Admin Master |
| **Auditoría & RBAC** | Trazabilidad inmutable de eventos y aislamiento estricto de datos. | Admin Master, Auditor |

---

## ⚙️ Guía de Inicio Rápido

### 1. Iniciar Consola Web Local
```bash
cd frontend
npm install
npm run dev
# Abrir: http://localhost:3000
```

### 2. Ejecutar Pruebas Automatizadas
```bash
cd frontend
npm test
# 14 tests unitarios (Vitest)
```

### 3. Ejecutar Robot RPA por Consola (o doble clic en `ejecutar_rpa.bat`)
```bash
cd frontend
npm run rpa
```

---

## 🎓 Contexto Institucional
* **Institución**: Tecnológico de Antioquia — Institución Universitaria (TdeA)
* **Facultad**: Facultad de Ingeniería
* **Empresa Aliada**: Blacksmith Research Colombia SAS
* **Línea**: Automatización Robótica de Procesos (RPA) & FinTech
* **Fecha**: Noviembre 2026
