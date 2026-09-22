import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, usuarioAdmin, correoAdmin } from "./firebase-config.js";

const PRODUCTOS = [
  { id: "cefalu",   nombre: "Cefalú",   detalle: "Mesa ovalada · $100.000", unidad: ["unidad", "unidades"] },
  { id: "menfi",    nombre: "Menfi",    detalle: "Doble cubierta · $130.000", unidad: ["unidad", "unidades"] },
  { id: "volterra", nombre: "Volterra", detalle: "Set de 2 mesas · $160.000", unidad: ["set", "sets"] }
];

const $ = (id) => document.getElementById(id);
const overlay = $("panel-overlay");
const panel = $("panel");
const formLogin = $("form-login");
const dashboard = $("dashboard");
const loginMsg = $("login-msg");
const dashMsg = $("dash-msg");
const lista = $("lista-stock");

const stockActual = {};   // id -> número (según Firestore)
let esAdmin = false;

const configurado = !firebaseConfig.apiKey.startsWith("PEGAR");
let db = null;
let auth = null;
if (configurado) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

/* ---------- Vista de clientes ---------- */

function textoStock(p, n) {
  if (n === undefined) return "Disponibilidad: sujeto a stock";
  if (n <= 0) return "Agotado · consúltanos por la próxima llegada";
  return `Stock disponible: ${n} ${n === 1 ? p.unidad[0] : p.unidad[1]}`;
}

function pintarPagina() {
  for (const p of PRODUCTOS) {
    const el = document.querySelector(`.stock[data-producto="${p.id}"]`);
    if (!el) continue;
    const n = stockActual[p.id];
    el.textContent = textoStock(p, n);
    el.classList.toggle("disponible", n > 0);
    el.classList.toggle("agotado", n !== undefined && n <= 0);
  }
}

/* ---------- Dashboard ---------- */

function construirDashboard() {
  lista.innerHTML = "";
  for (const p of PRODUCTOS) {
    const fila = document.createElement("div");
    fila.className = "fila-stock";
    fila.innerHTML = `
      <div>
        <div class="nombre">${p.nombre}</div>
        <div class="detalle">${p.detalle} · <span data-actual></span></div>
      </div>
      <div class="editor">
        <button type="button" data-accion="menos" aria-label="Restar uno">−</button>
        <input type="number" min="0" step="1" inputmode="numeric" aria-label="Stock de ${p.nombre}">
        <button type="button" data-accion="mas" aria-label="Sumar uno">+</button>
        <button type="button" class="guardar" data-accion="guardar" disabled>Guardar</button>
      </div>`;
    const input = fila.querySelector("input");
    const guardar = fila.querySelector(".guardar");
    const marcarCambio = () => {
      guardar.disabled = leerNumero(input) === null || leerNumero(input) === (stockActual[p.id] ?? 0);
    };
    fila.querySelector('[data-accion="menos"]').onclick = () => {
      input.value = Math.max(0, (leerNumero(input) ?? 0) - 1); marcarCambio();
    };
    fila.querySelector('[data-accion="mas"]').onclick = () => {
      input.value = (leerNumero(input) ?? 0) + 1; marcarCambio();
    };
    input.oninput = marcarCambio;
    guardar.onclick = () => guardarStock(p, input, guardar);
    fila.dataset.producto = p.id;
    lista.appendChild(fila);
  }
  pintarDashboard(true);
}

function leerNumero(input) {
  const n = Number(input.value);
  return input.value !== "" && Number.isInteger(n) && n >= 0 ? n : null;
}

function pintarDashboard(forzar = false) {
  let total = 0, agotados = 0;
  for (const p of PRODUCTOS) {
    const n = stockActual[p.id] ?? 0;
    total += n;
    if (n <= 0) agotados++;
    const fila = lista.querySelector(`[data-producto="${p.id}"]`);
    if (!fila) continue;
    fila.querySelector("[data-actual]").textContent = `hoy: ${n} ${n === 1 ? p.unidad[0] : p.unidad[1]}`;
    const input = fila.querySelector("input");
    const guardar = fila.querySelector(".guardar");
    // No pisar lo que se está editando
    if (forzar || guardar.disabled) { input.value = n; guardar.disabled = true; }
  }
  $("total-unidades").textContent = total;
  $("total-agotados").textContent = agotados;
}

async function guardarStock(p, input, boton) {
  const n = leerNumero(input);
  if (n === null) { mensaje(dashMsg, "Ingresa un número entero igual o mayor a 0.", "error"); return; }
  boton.disabled = true;
  boton.textContent = "…";
  try {
    await setDoc(doc(db, "productos", p.id), { nombre: p.nombre, stock: n, actualizado: serverTimestamp() }, { merge: true });
    mensaje(dashMsg, `${p.nombre}: stock actualizado a ${n}.`, "ok");
  } catch (e) {
    console.error(e);
    boton.disabled = false;
    mensaje(dashMsg, "No se pudo guardar. Revisa tu conexión o vuelve a iniciar sesión.", "error");
  } finally {
    boton.textContent = "Guardar";
  }
}

function mensaje(el, texto, tipo) {
  el.textContent = texto;
  el.className = `msg ${tipo}`;
}

/* ---------- Abrir / cerrar panel ---------- */

function mostrarVista() {
  formLogin.hidden = esAdmin;
  dashboard.hidden = !esAdmin;
  panel.classList.toggle("ancho", esAdmin);
  if (esAdmin) construirDashboard();
}

function abrirPanel() {
  overlay.classList.add("abierto");
  overlay.setAttribute("aria-hidden", "false");
  mostrarVista();
  if (!esAdmin) $("login-usuario").focus();
}

function cerrarPanel() {
  overlay.classList.remove("abierto");
  overlay.setAttribute("aria-hidden", "true");
  loginMsg.textContent = "";
  dashMsg.textContent = "";
}

$("abrir-panel").onclick = abrirPanel;
$("cerrar-panel").onclick = cerrarPanel;
overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrarPanel(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("abierto")) cerrarPanel(); });

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!configurado) { mensaje(loginMsg, "El panel aún no está conectado a Firebase.", "error"); return; }
  const usuario = $("login-usuario").value.trim();
  const clave = $("login-clave").value;
  if (usuario.toLowerCase() !== usuarioAdmin.toLowerCase()) {
    mensaje(loginMsg, "Usuario o clave incorrectos.", "error");
    return;
  }
  const boton = $("login-entrar");
  boton.disabled = true;
  mensaje(loginMsg, "", "error");
  try {
    await signInWithEmailAndPassword(auth, correoAdmin, clave);
    $("login-clave").value = "";
  } catch (err) {
    console.error(err);
    mensaje(loginMsg, err.code === "auth/too-many-requests"
      ? "Demasiados intentos. Espera unos minutos."
      : "Usuario o clave incorrectos.", "error");
  } finally {
    boton.disabled = false;
  }
});

$("cerrar-sesion").onclick = async () => { await signOut(auth); cerrarPanel(); };

/* ---------- Conexión con Firebase ---------- */

if (configurado) {
  onSnapshot(collection(db, "productos"), (snap) => {
    snap.forEach((d) => {
      const n = d.data().stock;
      if (Number.isInteger(n)) stockActual[d.id] = n;
    });
    pintarPagina();
    if (esAdmin) pintarDashboard();
  }, (err) => console.error("No se pudo leer el stock:", err));

  onAuthStateChanged(auth, (user) => {
    esAdmin = !!user && user.email === correoAdmin;
    if (overlay.classList.contains("abierto")) mostrarVista();
  });
}
