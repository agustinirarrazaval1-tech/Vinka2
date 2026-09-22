import { PRODUCTOS, WHATSAPP, formatoPrecio } from "./productos.js";

// Carrito de cotización. Se guarda en el navegador de cada visitante.
const CLAVE = "vinca-carrito";
const MAXIMO = 99;
const porId = Object.fromEntries(PRODUCTOS.map((p) => [p.id, p]));

let carrito = leer();   // id -> cantidad
let stock = {};         // id -> unidades disponibles (llega desde stock.js)

const $ = (id) => document.getElementById(id);
const ventana = $("carrito");
const lista = $("carrito-lista");

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE)) || {};
    return Object.fromEntries(Object.entries(datos).filter(([id, n]) => porId[id] && Number.isInteger(n) && n > 0));
  } catch {
    return {};
  }
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch { /* sin almacenamiento: el carrito dura hasta cerrar la página */ }
}

// Cuántas unidades se pueden pedir de un modelo según el stock conocido
const limite = (id) => (Number.isInteger(stock[id]) ? Math.min(stock[id], MAXIMO) : MAXIMO);

/* ---------- Ficha de cada mesa ---------- */

document.querySelectorAll(".agregar").forEach((bloque) => {
  const id = bloque.dataset.producto;
  const numero = bloque.querySelector(".n");
  const menos = bloque.querySelector('[data-accion="menos"]');
  const mas = bloque.querySelector('[data-accion="mas"]');
  const boton = bloque.querySelector(".agregar-btn");
  const aviso = bloque.nextElementSibling;
  let cantidad = 1;

  const pintar = () => {
    const disponible = limite(id) - (carrito[id] || 0);
    if (limite(id) <= 0) {
      boton.disabled = true;
      boton.textContent = "Agotado";
    } else if (disponible <= 0) {
      boton.disabled = true;
      boton.textContent = "Ya tienes todo el stock en el carrito";
    } else {
      boton.disabled = false;
      boton.textContent = "Agregar al carrito";
    }
    cantidad = Math.max(1, Math.min(cantidad, Math.max(1, disponible)));
    numero.textContent = cantidad;
    menos.disabled = cantidad <= 1 || boton.disabled;
    mas.disabled = cantidad >= disponible || boton.disabled;
  };

  menos.addEventListener("click", () => { cantidad--; pintar(); });
  mas.addEventListener("click", () => { cantidad++; pintar(); });
  boton.addEventListener("click", () => {
    carrito[id] = Math.min((carrito[id] || 0) + cantidad, limite(id));
    cantidad = 1;
    guardar();
    actualizarTodo();
    aviso.hidden = false;
  });
  aviso.querySelector(".ver-carrito").addEventListener("click", () => {
    bloque.closest("dialog")?.close();
    abrir();
  });
  bloque.closest("dialog")?.addEventListener("close", () => { aviso.hidden = true; });

  bloque.pintar = pintar;
});

/* ---------- Ventana del carrito ---------- */

function pintarCarrito() {
  // Si bajó el stock, ajustar lo que ya estaba en el carrito
  for (const id of Object.keys(carrito)) {
    if (limite(id) > 0 && carrito[id] > limite(id)) carrito[id] = limite(id);
  }
  const ids = PRODUCTOS.map((p) => p.id).filter((id) => carrito[id] > 0);
  $("carrito-punto").hidden = ids.length === 0;
  $("abrir-carrito").setAttribute("aria-label", ids.length ? `Ver carrito (${ids.reduce((t, id) => t + carrito[id], 0)} mesas)` : "Ver carrito");
  $("carrito-vacio").hidden = ids.length > 0;
  $("carrito-pie").hidden = ids.length === 0;

  lista.innerHTML = "";
  let total = 0;
  for (const id of ids) {
    const p = porId[id];
    const n = carrito[id];
    total += p.precio * n;
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <img src="${p.foto}" alt="Mesa ${p.nombre}">
      <div>
        <div class="nombre">${p.nombre}</div>
        <div class="sub">${p.detalle} · ${formatoPrecio(p.precio)} c/u</div>
        ${limite(id) <= 0 ? '<div class="aviso">Sin stock por ahora: te avisamos cuándo llega.</div>' : ""}
        <div class="fila">
          <div class="cantidad" role="group" aria-label="Cantidad de ${p.nombre}">
            <button type="button" data-accion="menos" aria-label="Quitar uno">−</button>
            <span class="n">${n}</span>
            <button type="button" data-accion="mas" aria-label="Sumar uno">+</button>
          </div>
          <button type="button" class="quitar">Quitar</button>
        </div>
      </div>`;
    item.querySelector('[data-accion="menos"]').disabled = n <= 1;
    item.querySelector('[data-accion="mas"]').disabled = n >= limite(id);
    item.querySelector('[data-accion="menos"]').onclick = () => cambiar(id, n - 1);
    item.querySelector('[data-accion="mas"]').onclick = () => cambiar(id, n + 1);
    item.querySelector(".quitar").onclick = () => cambiar(id, 0);
    lista.appendChild(item);
  }
  $("carrito-total").textContent = formatoPrecio(total);
  $("carrito-cotizar").href = enlaceWhatsApp(ids, total);
}

function enlaceWhatsApp(ids, total) {
  const lineas = ids.map((id) => {
    const p = porId[id];
    return `• ${carrito[id]} × ${p.nombre} (${p.detalle}) — ${formatoPrecio(p.precio)} c/u`;
  });
  const texto = [
    "Hola Maria Ignacia, me interesaría cotizar estas mesas:",
    "",
    ...lineas,
    "",
    `Total referencial: ${formatoPrecio(total)} + despacho.`,
    "¡Gracias!"
  ].join("\n");
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

function cambiar(id, n) {
  if (n <= 0) delete carrito[id];
  else carrito[id] = n;
  guardar();
  actualizarTodo();
}

function actualizarTodo() {
  pintarCarrito();
  document.querySelectorAll(".agregar").forEach((b) => b.pintar());
}

function abrir() {
  pintarCarrito();
  ventana.showModal();
  document.body.classList.add("ficha-abierta");
}

$("abrir-carrito").addEventListener("click", abrir);
$("cerrar-carrito").addEventListener("click", () => ventana.close());
ventana.addEventListener("click", (e) => { if (e.target === ventana) ventana.close(); });
ventana.addEventListener("close", () => document.body.classList.remove("ficha-abierta"));
$("carrito-vaciar").addEventListener("click", () => { carrito = {}; guardar(); actualizarTodo(); });

// El stock en vivo limita cuántas mesas se pueden pedir
document.addEventListener("vinca:stock", (e) => { stock = e.detail; actualizarTodo(); });

// Si el visitante tiene la página abierta en otra pestaña, mantener el carrito al día
window.addEventListener("storage", (e) => { if (e.key === CLAVE) { carrito = leer(); actualizarTodo(); } });

actualizarTodo();
