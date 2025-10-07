document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("buscador");
  const cards = document.querySelectorAll(".card");

  input.addEventListener("keyup", () => {
    const filtro = input.value.toLowerCase();

    cards.forEach(card => {
      const titulo = card.querySelector(".card-title").textContent.toLowerCase();
      const texto = card.querySelector(".card-text").textContent.toLowerCase();

      if (titulo.includes(filtro) || texto.includes(filtro)) {
        card.parentElement.style.display = "block"; 
      } else {
        card.parentElement.style.display = "none"; 
      }
    });
  });
});
