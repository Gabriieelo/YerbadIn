document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("buscador");
  const cardsContainer = document.getElementById("productos");

  if (!input || !cardsContainer) return;

  const filtrar = () => {
    const filtro = input.value.toLowerCase();
    const cards = cardsContainer.querySelectorAll(".card");

    cards.forEach(card => {
      const titulo = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const texto = card.querySelector(".card-text")?.textContent.toLowerCase() || "";

      if (titulo.includes(filtro) || texto.includes(filtro)) {
        card.parentElement.style.display = "block";
      } else {
        card.parentElement.style.display = "none";
      }
    });
  };

  input.addEventListener("keyup", filtrar);

  const observer = new MutationObserver(filtrar);
  observer.observe(cardsContainer, { childList: true });
});
