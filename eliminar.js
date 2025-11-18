// ===============================================
// CONFIGURACIÓN DE AIRTABLE
// ===============================================
const airtableToken = "patVhTGXMmBRjvBCK.f28a2d4af45d46b8a777e24ee48ddde443475a91d946a96f307661175073f672";
const baseId = "app4MOjY3G8sHauiV";
const tableName = "Productos";
const AIRTABLE_URL = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// ===============================================
// REFERENCIAS DEL DOM
// ===============================================
const productosContainer = document.getElementById('productos-container');
const loadingMessage = document.getElementById('loading-message');
const statusMessage = document.getElementById('status-message');


// ===============================================
// FUNCIONES DE UTILIDAD
// ===============================================

/**
 * Muestra un mensaje de estado (éxito o error) en la esquina inferior derecha.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} [type='success'] - El tipo de mensaje ('success' o 'error').
 */
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-danger', 'bg-success');
    
    if (type === 'success') {
        statusMessage.classList.add('bg-success');
    } else {
        statusMessage.classList.add('bg-danger');
    }

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
 * @param {object} record - El objeto de registro de Airtable.
 * @returns {string} La URL de la imagen o una URL de placeholder.
 */
function getImageUrl(record) {
    // Usamos el mismo placeholder que usas en cargarProductos
    const defaultImage = "placeholder.jpg"; 
    
    if (record.fields.Imagen && Array.isArray(record.fields.Imagen) && record.fields.Imagen.length > 0) {
        return record.fields.Imagen[0].url || defaultImage;
    }
    return defaultImage;
}



/**
 * Renderiza la tarjeta un producto con botón de Eliminar.
 * @param {object} record 
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
                    <button class="btn btn-danger w-100" onclick="deleteYerba('${recordId}', this)">
                        <i class="bi bi-trash-fill me-2"></i>Eliminar de Yerbadin
                    </button>
                </div>
            </div>
        </div>
    `;

    productosContainer.appendChild(col);
}

/**
 * Carga todos los productos de Airtable y los muestra.
 */
async function loadYerbas() {
    if (productosContainer) {
        productosContainer.className = 'row g-4'; 
    }

    productosContainer.innerHTML = '';
    loadingMessage.textContent = 'Cargando productos...';
    loadingMessage.classList.remove('d-none'); 

    try {
        const response = await fetch(AIRTABLE_URL, {
            headers: {
                'Authorization': `Bearer ${airtableToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            data.records.forEach(renderProductCard);
            loadingMessage.classList.add('d-none'); // Ocultar mensaje de carga
        } else {
            loadingMessage.textContent = 'No se encontraron yerbas para eliminar.';
            loadingMessage.classList.remove('d-none');
        }

    } catch (error) {
        console.error('Error al cargar yerbas:', error);
        loadingMessage.textContent = `Error al cargar productos: ${error.message}. Verifica la API Key y la conexión.`;
        loadingMessage.classList.remove('d-none');
        showStatus('Error al cargar productos. Revisa la consola para detalles.', 'error');
    }
}

/**
  //Elimina un registro de Airtable.
  @param {string} recordId 
  @param {HTMLElement} buttonElement 
 */
async function deleteYerba(recordId, buttonElement) {
    if (!confirm('⚠️ Advertencia: ¿Estás seguro de que quieres eliminar este producto PERMANENTEMENTE? Esta acción no se puede deshacer.')) {
        return;
    }

    buttonElement.disabled = true;
    buttonElement.textContent = 'Eliminando...';

    try {
        const deleteUrl = `${AIRTABLE_URL}/${recordId}`;
        
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${airtableToken}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMsg = errorBody.error ? errorBody.error.message : response.statusText;
            throw new Error(`Error al eliminar: ${response.status} - ${errorMsg}`);
        }

        // eliminar la tarjeta del DOM
        const cardCol = buttonElement.closest('.col-md-4');
        cardCol.remove();

        showStatus(`✅ Producto eliminado con éxito (ID: ${recordId}).`, 'success');

        if (productosContainer.querySelectorAll('.col-md-4').length === 0) {
            loadingMessage.textContent = 'No se encontraron yerbas para eliminar.';
            loadingMessage.classList.remove('d-none');
        }

    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        showStatus(`❌ ERROR: No se pudo eliminar el producto. ${error.message}`, 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Eliminar de Yerbadin';
    }
}

window.onload = loadYerbas;