// Modelos a la venta. Los usan el panel de stock (stock.js) y el carrito (carrito.js).
// El id debe coincidir con data-producto en index.html y usar solo minúsculas,
// números o guiones (lo exigen las reglas de Firestore).
export const PRODUCTOS = [
  { id: "cefalu",   nombre: "Cefalú",   detalle: "Mesa ovalada",             precio: 100000, foto: "assets/img/cefalu.jpg",   unidad: ["unidad", "unidades"] },
  { id: "menfi",    nombre: "Menfi",    detalle: "Doble cubierta",           precio: 130000, foto: "assets/img/menfi.jpg",    unidad: ["unidad", "unidades"] },
  { id: "volterra", nombre: "Volterra", detalle: "Set de 2 mesas",           precio: 160000, foto: "assets/img/volterra.jpg", unidad: ["set", "sets"] },
  { id: "matera",   nombre: "Matera",   detalle: "Cubierta cuadrada",        precio: 110000, foto: "assets/img/matera.webp",  unidad: ["unidad", "unidades"] },
  { id: "capri",    nombre: "Capri",    detalle: "Doble cubierta cuadrada",  precio: 160000, foto: "assets/img/capri.webp",   unidad: ["unidad", "unidades"] }
];

export const WHATSAPP = "56997392615";

export const formatoPrecio = (n) => "$" + n.toLocaleString("es-CL");
