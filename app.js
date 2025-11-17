// === CONFIGURACIÓN DE AIRTABLE ===
const airtableToken = "patVhTGXMmBRjvBCK.f28a2d4af45d46b8a777e24ee48ddde443475a91d946a96f307661175073f672";
const baseId = "app4MOjY3G8sHauiV";
const tableName = "Productos";
const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

const contenedor = document.getElementById("productos");

function nombreAArchivo(nombre) {
  return nombre
    .normalize("NFD")              
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, "")           
    + ".html";                     
}

async function cargarProductos() {
  try {
    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });

    if (!response.ok) throw new Error(`Error al obtener los productos: ${response.statusText}`);

    const data = await response.json();
    contenedor.innerHTML = "";

    data.records.forEach((record) => {
      const { Nombre, Detalle, Imagen } = record.fields;
      const imagenUrl = Imagen && Imagen[0] ? Imagen[0].url : "placeholder.jpg";

      const card = `
        <div class="col-md-4 mb-4">
          <div class="card h-100 shadow-sm">
            <img src="${imagenUrl}" class="card-img-top" alt="${Nombre}">
            <div class="card-body">
              <h5 class="card-title">${Nombre}</h5>
              <p class="card-text">${Detalle || ""}</p>
              <button class="btn btn-success me-2 ver-detalle" data-id="${record.id}">Ver</button>
              <button class="btn btn-outline-secondary">Agregar al carrito</button>
            </div>
          </div>
        </div>
      `;
      contenedor.innerHTML += card;
    });

    document.querySelectorAll(".ver-detalle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        localStorage.setItem("productoSeleccionado", id);
        window.location.href = "detalle.html";
      });
    });

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<p class="text-danger">Ocurrió un error al cargar los productos.</p>`;
  }
}

cargarProductos();
