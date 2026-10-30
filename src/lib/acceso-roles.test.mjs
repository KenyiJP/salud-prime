// Test sin dependencias: `node src/lib/acceso-roles.test.mjs` (Node >= 22.18).
import assert from "node:assert/strict";
import { ACCESO_RUTAS, puedeVerRuta, rutaInicialPorRol } from "./acceso-roles.ts";

let n = 0;
const t = (fn) => {
  fn();
  n++;
};

const ROLES = ["founder", "medico", "community_manager", "recepcion", "enfermeria", "facturacion", "asistente"];
const CLINICAS = ["/historias", "/laboratorios", "/imagenologia", "/recetario", "/atencion/x", "/facturacion"];

t(() => {
  for (const r of ["founder", "medico"])
    for (const ruta of [...Object.keys(ACCESO_RUTAS), ...CLINICAS])
      assert.equal(puedeVerRuta(r, ruta), true, `${r} ${ruta}`);
});

t(() => {
  // Ningún rol operativo ni CM ve rutas clínicas (no listadas = solo titular).
  for (const r of ["community_manager", "recepcion", "enfermeria", "facturacion", "asistente"])
    for (const ruta of CLINICAS) assert.equal(puedeVerRuta(r, ruta), false, `${r} ${ruta}`);
});

t(() => {
  assert.equal(puedeVerRuta(null, "/"), false);
  assert.equal(puedeVerRuta("recepcion", "/calendario"), true);
  assert.equal(puedeVerRuta("recepcion", "/horarios"), true);
  assert.equal(puedeVerRuta("recepcion", "/fichas"), true);
  assert.equal(puedeVerRuta("recepcion", "/enfermeria"), false);
  assert.equal(puedeVerRuta("enfermeria", "/enfermeria"), true);
  assert.equal(puedeVerRuta("enfermeria", "/horarios"), false);
  assert.equal(puedeVerRuta("facturacion", "/cobranza"), true);
  assert.equal(puedeVerRuta("facturacion", "/fichas"), false);
  assert.equal(puedeVerRuta("facturacion", "/calendario"), false);
  assert.equal(puedeVerRuta("facturacion", "/"), false);
  assert.equal(puedeVerRuta("enfermeria", "/calendario"), false);
  assert.equal(puedeVerRuta("enfermeria", "/fichas"), false);
  assert.equal(puedeVerRuta("community_manager", "/marca"), true);
  assert.equal(puedeVerRuta("community_manager", "/configuracion/equipo"), false);
});

t(() => {
  // Gestión de equipo: solo titular.
  for (const r of ROLES) assert.equal(puedeVerRuta(r, "/configuracion/equipo"), r === "founder" || r === "medico", r);
});

t(() => {
  // La ruta inicial de cada rol debe ser una ruta que ese rol puede ver.
  for (const r of ROLES) {
    const destino = rutaInicialPorRol(r);
    if (r === "asistente") continue; // sin acceso en la base
    assert.equal(puedeVerRuta(r, destino), true, `${r} -> ${destino}`);
  }
  assert.equal(rutaInicialPorRol("recepcion"), "/calendario");
  assert.equal(rutaInicialPorRol("enfermeria"), "/enfermeria");
  assert.equal(rutaInicialPorRol("facturacion"), "/cobranza");
  assert.equal(rutaInicialPorRol("community_manager"), "/perfil-consultorio");
  assert.equal(rutaInicialPorRol(null), "/");
});

console.log(`acceso-roles: ${n} bloques OK`);
