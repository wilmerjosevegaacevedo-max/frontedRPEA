/**
 * Suite de Pruebas Unitarias — Motor Financiero y RBAC (RPA LAD-6819)
 * Ejecutar con: npm test
 */
import assert from "node:assert/strict";
import { EMPRESAS_PREDETERMINADAS, grupoEstado, resolverPerfilUsuario } from "../types";
import { generarArchivoPruebaFile, procesarNominaEnFrontend } from "../lib/excel-processor";

async function ejecutarPruebas() {
  let pasadas = 0;
  function test(nombre: string, fn: () => void | Promise<void>) {
    return Promise.resolve(fn()).then(() => {
      pasadas++;
      console.log(`  ✅ [PASS] ${nombre}`);
    });
  }

  console.log("\n=======================================================");
  console.log(" 🧪 SUITE DE PRUEBAS AUTOMATIZADAS — RPA LAD-6819");
  console.log("=======================================================\n");

  // 1. Resolución de Roles (RBAC)
  await test("1. RBAC: Credencial oficial Admin Master resuelve rol ADMIN y empresa TODAS", () => {
    const p = resolverPerfilUsuario("admin.rpa@blacksmith.com.co");
    assert.equal(p.rol, "ADMIN");
    assert.equal(p.empresaId, "TODAS");
  });

  await test("2. RBAC: Credencial oficial Auditor Central resuelve rol SUPERVISOR", () => {
    const p = resolverPerfilUsuario("auditoria@rpa-nomina.com");
    assert.equal(p.rol, "SUPERVISOR");
    assert.equal(p.empresaId, "TODAS");
  });

  await test("3. RBAC: Analista de Continental Gold queda delimitado a 'continental'", () => {
    const p = resolverPerfilUsuario("nomina@continentalgold.com");
    assert.equal(p.rol, "ANALISTA");
    assert.equal(p.empresaId, "continental");
  });

  await test("4. RBAC: Prevención de escalamiento de privilegios con substring 'admin' no autorizado", () => {
    const p = resolverPerfilUsuario("atacante.admin@dominioexterno.com");
    assert.equal(p.rol, "ANALISTA", "Un correo externo con 'admin' NO debe obtener rol ADMIN");
  });

  await test("5. RBAC: Resolución dinámica de nueva empresa registrada en el sistema", () => {
    const empresasCustom = [
      ...EMPRESAS_PREDETERMINADAS,
      {
        id: "sura",
        nombre: "Seguros SURA",
        nit: "890903407",
        codigo: "SURA",
        emailOperador: "nomina@sura.com.co",
        reglas: {
          porcentajeVida: 1.2,
          porcentajeGmm: 2.0,
          porcentajeCostos: 0.5,
          topeMaximoDescuento: 500000,
          permiteSobregiro: false,
          columnasRequeridas: ["CEDULA", "NOMBRE", "SALARIO"],
        },
      },
    ];
    const p = resolverPerfilUsuario("nomina@sura.com.co", empresasCustom);
    assert.equal(p.rol, "ANALISTA");
    assert.equal(p.empresaId, "sura");
  });

  // 2. Clasificación de Estados de Lote
  await test("6. Estados: 'EXITOSO' y 'COMPLETADO' agrupan como 'exito'", () => {
    assert.equal(grupoEstado("EXITOSO"), "exito");
    assert.equal(grupoEstado("COMPLETADO"), "exito");
  });

  await test("7. Estados: 'FALLIDO' y 'RECHAZADO' agrupan como 'fallo'", () => {
    assert.equal(grupoEstado("FALLIDO"), "fallo");
    assert.equal(grupoEstado("RECHAZADO"), "fallo");
  });

  // 3. Motor de Liquidación Excel (SheetJS)
  await test("8. Liquidación Continental Gold: Aplica tope máximo ($600.000) cuando permiteSobregiro=false", async () => {
    const continental = EMPRESAS_PREDETERMINADAS.find((e) => e.id === "continental")!;
    const file = generarArchivoPruebaFile(continental);
    const res = await procesarNominaEnFrontend(file, continental);

    assert.equal(res.totalFilas, 7);
    assert.equal(res.filasValidas, 7);
    // El empleado #5 tiene salario 12,500,000 -> 4.8% = 600,000
    const altoIngreso = res.registros.find((r) => r.salarioBase === 12500000)!;
    assert.ok(altoIngreso);
    assert.equal(altoIngreso.descuentoAplicado, 600000);
  });

  await test("9. Liquidación CDF: Trunca descuentos que superan el tope de $450.000 COP", async () => {
    const cdf = EMPRESAS_PREDETERMINADAS.find((e) => e.id === "cdf")!;
    const file = generarArchivoPruebaFile(cdf);
    const res = await procesarNominaEnFrontend(file, cdf);

    // Salario 12,500,000 * 4.8% (1.8 + 2.0 + 1.0) = 600,000 > tope 450,000
    const empleadoTopado = res.registros.find((r) => r.salarioBase === 12500000)!;
    assert.equal(empleadoTopado.descuentoCalculado, 600000);
    assert.equal(empleadoTopado.descuentoAplicado, 450000);
    assert.equal(empleadoTopado.topeAplicado, true);
  });

  await test("10. Liquidación DXC: Permite sobregiro cuando permiteSobregiro=true", async () => {
    const dxc = {
      ...EMPRESAS_PREDETERMINADAS.find((e) => e.id === "dxc")!,
      reglas: {
        ...EMPRESAS_PREDETERMINADAS.find((e) => e.id === "dxc")!.reglas,
        topeMaximoDescuento: 500000,
        permiteSobregiro: true,
      },
    };
    const file = generarArchivoPruebaFile(dxc);
    const res = await procesarNominaEnFrontend(file, dxc);

    // Salario 12,500,000 * 6.2% (2.0 + 3.0 + 1.2) = 775,000 > 500,000 pero permiteSobregiro=true
    const empleadoSobregiro = res.registros.find((r) => r.salarioBase === 12500000)!;
    assert.equal(empleadoSobregiro.descuentoAplicado, 775000);
    assert.equal(empleadoSobregiro.topeAplicado, false);
  });

  console.log(`\n🎉 Resultado Final: ${pasadas}/10 pruebas ejecutadas y aprobadas con éxito.\n`);
}

ejecutarPruebas().catch((err) => {
  console.error("❌ Fallo en la suite de pruebas:", err);
  process.exit(1);
});
