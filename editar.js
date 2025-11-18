const API_KEY = "patVhTGXMmBRjvBCK.f28a2d4af45d46b8a777e24ee48ddde443475a91d946a96f307661175073f672"; 
const BASE_ID = "app4MOjY3G8sHauiV";  
const TABLE_NAME = "Productos"; 

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const productosContainer = document.getElementById('productos-container'); 
const loadingMessage = document.getElementById('loading-message');
const statusMessage = document.getElementById('status-message');

const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
const editForm = document.getElementById('editProductForm');
const editRecordId = document.getElementById('editRecordId');
const editNombre = document.getElementById('editNombre');
const editDetalle = document.getElementById('editDetalle');
const editDescripcion = document.getElementById('editDescripcion');
const editImagenUrl = document.getElementById('editImagenUrl');
const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');


// FUNCIONES DE UTILIDAD

/**
 * Muestra un mensaje de estado (éxito o error) en la esquina inferior derecha.
 */
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-danger', 'bg-success', 'opacity-0');
    
    statusMessage.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');

    statusMessage.classList.remove('opacity-0');
    statusMessage.classList.add('opacity-100');
    
    setTimeout(() => {
        statusMessage.classList.remove('opacity-100');
        statusMessage.classList.add('opacity-0');
        setTimeout(() => { statusMessage.classList.add('hidden'); }, 300);
    }, 3500); 
}

/**
 * Obtiene la URL de imagen de un registro de Airtable.
 */
function getImageUrl(record) {
    const defaultImage = "placeholder.jpg"; 
    
    if (record.fields.Imagen && Array.isArray(record.fields.Imagen) && record.fields.Imagen.length > 0) {
        return record.fields.Imagen[0].url || defaultImage;
    }
    return defaultImage;
}

//edicion

/**
 * Maneja el clic en "Editar Producto": obtiene datos, precarga el modal y lo muestra.
 */
async function handleEditClick(recordId) {
    showStatus('Cargando datos del producto...', 'success');

    try {
        const response = await fetch(`${AIRTABLE_URL}/${recordId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener datos del producto: ${response.statusText}`);
        }

        const data = await response.json();
        const fields = data.fields;

        editRecordId.value = recordId;
        document.getElementById('productNameInModal').textContent = fields.Nombre || 'Producto';
        editNombre.value = fields.Nombre || '';
        editDetalle.value = fields.Detalle || '';
        editDescripcion.value = fields.Descripcion || '';
        
        const currentImageUrl = getImageUrl(data);
        editImagenUrl.value = (currentImageUrl !== "placeholder.jpg") ? currentImageUrl : '';

        statusMessage.classList.remove('opacity-100');
        statusMessage.classList.add('opacity-0', 'hidden');

        editProductModal.show();
        
    } catch (error) {
        console.error('Error al cargar datos para edición:', error);
        showStatus(`Error: No se pudo cargar el producto. ${error.message}`, 'error');
    }
}

/**
 //Maneja el envío del formulario de edición y realiza la solicitud PATCH a Airtable.
 */
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idToUpdate = editRecordId.value;
    
    const updatedFields = {
        "Nombre": editNombre.value,
        "Detalle": editDetalle.value,
        "Descripcion": editDescripcion.value,
    };

    const newImageUrl = editImagenUrl.value.trim();
    if (newImageUrl) {
        updatedFields["Imagen"] = [{ url: newImageUrl }];
    } else {
        updatedFields["Imagen"] = []; 
    }


    btnGuardarEdicion.disabled = true;
    btnGuardarEdicion.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';
    
    try {
        const response = await fetch(`${AIRTABLE_URL}/${idToUpdate}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: updatedFields })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMsg = errorBody.error ? errorBody.error.message : response.statusText;
            throw new Error(`Error al actualizar: ${response.status} - ${errorMsg}`);
        }

        showStatus('✅ Producto actualizado con éxito.', 'success');
        editProductModal.hide(); 
        
        loadYerbas(); 

    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        showStatus(`❌ ERROR: No se pudo guardar la edición. ${error.message}`, 'error');
    } finally {
        btnGuardarEdicion.disabled = false;
        btnGuardarEdicion.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Guardar Cambios';
    }
});


// CARGA DE PRODUCTOS 

function renderProductCard(record) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4'; 
    
    const imageUrl = getImageUrl(record);
    const nombre = record.fields.Nombre || 'Nombre Desconocido';
    const detalle = record.fields.Detalle || 'Sin detalle.'; 
    const recordId = record.id;

    col.innerHTML = `
        <div class="card h-100 shadow-sm">
            <img src="${imageUrl}" class="card-img-top p-3" alt="${nombre}">
            
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${nombre}</h5>
                <p class="card-text">${detalle}</p>
                
                <div class="mt-auto pt-2">
                    <button class="btn btn-warning w-100 fw-bold btn-editar" data-id="${recordId}">
                        <i class="bi bi-pencil-square me-2"></i>Editar Producto
                    </button>
                </div>
            </div>
        </div>
    `;

    const editButton = col.querySelector('.btn-editar');
    editButton.addEventListener('click', () => handleEditClick(recordId));

    productosContainer.appendChild(col);
}

/**
 // Carga todos los productos de Airtable y los muestra.
 */
async function loadYerbas() {
    productosContainer.innerHTML = '';
    productosContainer.className = 'row g-4';
    loadingMessage.textContent = 'Cargando productos...';
    loadingMessage.classList.remove('d-none');

    try {
        const response = await fetch(AIRTABLE_URL, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 throw new Error(`Error de Autenticación (${response.status}). Revisa la API KEY y permisos.`);
            }
            throw new Error(`Error al obtener datos: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            data.records.forEach(renderProductCard);
            loadingMessage.classList.add('d-none');
        } else {
            loadingMessage.textContent = 'No se encontraron yerbas para editar.';
            loadingMessage.classList.remove('d-none');
        }

    } catch (error) {
        console.error('Error al cargar yerbas:', error);
        loadingMessage.textContent = `Error al cargar productos: ${error.message}.`;
        loadingMessage.classList.remove('d-none');
    }
}

window.onload = loadYerbas;