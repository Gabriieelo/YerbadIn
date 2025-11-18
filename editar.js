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
// ... el resto de las referencias DOM son correctas.
const editDetalle = document.getElementById('editDetalle');
const editDescripcion = document.getElementById('editDescripcion');
const editImagenUrl = document.getElementById('editImagenUrl');
const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');


// ===============================================
// FUNCIONES DE UTILIDAD (Adaptadas de tu código)
// ===============================================

/**
 * Muestra un mensaje de estado (éxito o error) en la esquina inferior derecha.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} [type='success'] - El tipo de mensaje ('success' o 'error').
 */
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-danger', 'bg-success', 'opacity-0');
    
    statusMessage.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');

    statusMessage.classList.remove('opacity-0');
    statusMessage.classList.add('opacity-100');
    
    // Oculta el mensaje después de 3.5 segundos (ajustado para ser consistente con el tuyo)
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


// ===============================================
// LÓGICA DE EDICIÓN
// ===============================================

/**
 * Maneja el clic en "Editar Producto": obtiene datos, precarga el modal y lo muestra.
 * @param {string} recordId - El ID del registro de Airtable.
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

        // 1. Precargar los campos del formulario
        editRecordId.value = recordId;
        document.getElementById('productNameInModal').textContent = fields.Nombre || 'Producto';
        editNombre.value = fields.Nombre || '';
        editDetalle.value = fields.Detalle || '';
        editDescripcion.value = fields.Descripcion || '';
        
        // Obtener la URL de la imagen actual (si existe) para mostrarla opcionalmente
        const currentImageUrl = getImageUrl(data);
        // Si no es el placeholder, se muestra la URL para que el usuario pueda verla/cambiarla
        editImagenUrl.value = (currentImageUrl !== "placeholder.jpg") ? currentImageUrl : '';

        // Ocultar el mensaje de carga antes de mostrar el modal
        statusMessage.classList.remove('opacity-100');
        statusMessage.classList.add('opacity-0', 'hidden');

        // 2. Mostrar el modal
        editProductModal.show();
        
    } catch (error) {
        console.error('Error al cargar datos para edición:', error);
        showStatus(`Error: No se pudo cargar el producto. ${error.message}`, 'error');
    }
}

/**
 * Maneja el envío del formulario de edición y realiza la solicitud PATCH a Airtable.
 */
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idToUpdate = editRecordId.value;
    
    // Campos que se van a actualizar
    const updatedFields = {
        "Nombre": editNombre.value,
        "Detalle": editDetalle.value,
        "Descripcion": editDescripcion.value,
    };

    // Lógica para actualizar la imagen solo si se proporcionó una nueva URL
    const newImageUrl = editImagenUrl.value.trim();
    if (newImageUrl) {
        // Airtable espera un array de objetos para el campo de archivos adjuntos
        updatedFields["Imagen"] = [{ url: newImageUrl }];
    } else {
        // Si el campo de URL se vació, eliminamos la referencia de imagen en Airtable 
        // (Nota: Esto elimina la imagen del registro. Para mantenerla, el usuario debe dejar el campo con la URL actual).
        // Si el usuario vació el campo, probablemente quiere remover la imagen.
        // Alternativamente, podrías no enviar el campo 'Imagen' si no cambió. Lo dejaremos así para permitir la remoción.
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
        
        // Recargar la lista para que la tarjeta editada muestre los nuevos datos
        loadYerbas(); 

    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        showStatus(`❌ ERROR: No se pudo guardar la edición. ${error.message}`, 'error');
    } finally {
        btnGuardarEdicion.disabled = false;
        btnGuardarEdicion.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Guardar Cambios';
    }
});


// ===============================================
// CARGA DE PRODUCTOS EN LISTADO
// ===============================================

/**
 * Renderiza la tarjeta de un producto con el botón de Editar.
 */
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

    // Agregamos el listener al botón usando el data-id para abrir el modal
    const editButton = col.querySelector('.btn-editar');
    editButton.addEventListener('click', () => handleEditClick(recordId));

    productosContainer.appendChild(col);
}

/**
 * Carga todos los productos de Airtable y los muestra.
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


// ===============================================
// INICIALIZACIÓN
// ===============================================
window.onload = loadYerbas;