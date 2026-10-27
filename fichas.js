// Abre y cierra la ficha de cada mesa. Vive en su propio archivo (y no dentro de
// index.html) porque la política de seguridad del sitio no permite scripts inline.

// El evento "close" llega un instante después de cerrar: si para entonces ya se
// abrió otra ventana (por ejemplo el carrito), la página debe seguir sin scroll.
export function liberarScroll() {
  if (!document.querySelector("dialog[open]")) document.body.classList.remove("ficha-abierta");
}

document.querySelectorAll(".tarjeta").forEach((t) => {
  t.addEventListener("click", () => {
    const d = document.getElementById(t.dataset.abre);
    d.showModal();
    d.scrollTop = 0;
    document.body.classList.add("ficha-abierta");
  });
});

document.querySelectorAll("dialog.detalle").forEach((d) => {
  d.querySelector(".detalle-cerrar").addEventListener("click", () => d.close());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  d.addEventListener("close", liberarScroll);
});
