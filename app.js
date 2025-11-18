const airtableToken = "patVhTGXMmBRjvBCK.f28a2d4af45d46b8a777e24ee48ddde443475a91d946a96f307661175073f672";
const baseId = "app4MOjY3G8sHauiV";
const tableName = "Productos";
const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

const contenedor = document.getElementById("productos");


function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const contador = document.getElementById("cart-count");
  if (contador) contador.textContent = carrito.length;
}

// carga de productos dinamicos desde airtable
async function cargarProductos() {
  if (!contenedor) return; 

  try {
    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });

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

              <button class="btn btn-success me-2 ver-detalle" data-id="${record.id}">
                Ver
              </button>

              <button 
                class="btn btn-outline-secondary btn-agregar-carrito"
                data-id="${record.id}"
                data-nombre="${Nombre}"
                data-imagen="${imagenUrl}"
                data-detalle="${Detalle || ""}">
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      `;

      contenedor.innerHTML += card;
    });

    
    document.querySelectorAll(".ver-detalle").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        localStorage.setItem("productoSeleccionado", id);
        window.location.href = "detalle.html";
      })
    );

    actualizarContador();

  } catch (error) {
    console.error("Error:", error);
    contenedor.innerHTML = `<p class="text-danger">Error cargando productos.</p>`;
  }
}

cargarProductos();


let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContador();
}

// agsreggar al carrito
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-agregar-carrito")) {
    
    const id = e.target.dataset.id;
    const nombre = e.target.dataset.nombre;
    const imagen = e.target.dataset.imagen;
    const detalle = e.target.dataset.detalle;

    const existente = carrito.find(p => p.id === id);

    if (existente) {
      existente.cantidad++;
    } else {
      carrito.push({ id, nombre, imagen, detalle, cantidad: 1 });
    }

    guardarCarrito();
    alert("Producto agregado al carrito 🧺");
  }
});

//s
// mostrar carro
// 
function mostrarCarrito() {
  const contenedorCarrito = document.getElementById("productosFavoritos");
  if (!contenedorCarrito) return; 

  contenedorCarrito.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarrito.innerHTML = `
      <p class="text-center text-muted">Tu carrito está vacío 🛒</p>
    `;
    return;
  }

  carrito.forEach((item, index) => {
    const card = `
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <img src="${item.imagen}" class="card-img-top" alt="${item.nombre}">
          <div class="card-body">
            <h5 class="card-title">${item.nombre}</h5>
            <p class="card-text">${item.detalle}</p>
            <p class="fw-bold">Cantidad: ${item.cantidad}</p>

            <button class="btn btn-danger btn-eliminar" data-index="${index}">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    `;
    contenedorCarrito.innerHTML += card;
  });
}

mostrarCarrito();

// ==================================================
// eliminar producto de l carro

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-eliminar")) {
    const index = e.target.dataset.index;
    carrito.splice(index, 1);

    guardarCarrito();
    mostrarCarrito();
  }
});
