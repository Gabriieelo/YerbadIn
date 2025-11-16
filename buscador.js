document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("buscador");
  const cardsContainer = document.getElementById("productos");

  if (!input || !cardsContainer) return;

  // Función que filtra las tarjetas actuales
  const filtrar = () => {
    const filtro = input.value.toLowerCase();
    const cards = cardsContainer.querySelectorAll(".card");

    cards.forEach(card => {
      const titulo = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const texto = card.querySelector(".card-text")?.textContent.toLowerCase() || "";

      // Mostrar solo las que coinciden con el filtro
      if (titulo.includes(filtro) || texto.includes(filtro)) {
        card.parentElement.style.display = "block";
      } else {
        card.parentElement.style.display = "none";
      }
    });
  };

  // Ejecutar filtrado en cada tecla
  input.addEventListener("keyup", filtrar);

  // También observar cambios en el contenedor (por si se recargan productos)
  const observer = new MutationObserver(filtrar);
  observer.observe(cardsContainer, { childList: true });
});
