// ===============================================
// CONFIGURACIÓN DE AIRTABLE
// ===============================================
const API_KEY = "patVhTGXMmBRjvBCK.f28a2d4af45d46b8a777e24ee48ddde443475a91d946a96f307661175073f672"; 
const BASE_ID = "app4MOjY3G8sHauiV";  
const TABLE_NAME = "Productos"; 

// URL base de la API de Airtable
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

// ===============================================
// REFERENCIAS DEL DOM
// ===============================================
const yerbaContainer = document.getElementById('yerba-container');
const crudModal = document.getElementById('crud-modal');
const modalTitle = document.getElementById('modal-title');
const recordIdInput = document.getElementById('record-id');
const yerbaForm = document.getElementById('yerba-form');
const saveButton = document.getElementById('save-button');
const statusMessage = document.getElementById('status-message');
const imagenInput = document.getElementById('imagen_input');
const imagenTip = document.getElementById('imagen-tip'); 

// ===============================================
// FUNCIONES GLOBALES
// ===============================================

/**
 * Muestra un mensaje de estado (éxito o error) en la esquina inferior derecha.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} [type='success'] - El tipo de mensaje ('success' o 'error').
 */
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    // Eliminamos las clases de color y la clase 'hidden'
    statusMessage.classList.remove('hidden', 'bg-danger', 'bg-success');
    
    // Usamos clases de color de Bootstrap
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
    }, 3000);
}

/**
 * Renderiza la tarjeta de "Añadir Nueva Yerba" al inicio.
 */
function renderAddCard() {
    const addCardCol = document.createElement('div');
    addCardCol.className = 'col'; 

    const addCard = document.createElement('div');
    addCard.className = 'card h-100 border-2 border-secondary bg-white text-center cursor-pointer d-flex flex-column align-items-center justify-content-center p-4 card-add-new';
    addCard.setAttribute('onclick', 'openModal()');
    
    addCard.innerHTML = `
        <i class="bi bi-plus-circle-fill text-success mb-3" style="font-size: 3rem;"></i>
        <h3 class="fs-5 fw-semibold text-dark">Añadir Nueva Yerba</h3>
        <p class="text-secondary small">Haz clic para crear un nuevo producto</p>
    `;
    
    addCardCol.appendChild(addCard);
    yerbaContainer.appendChild(addCardCol);
}


/**
 * Abre el modal de formulario para añadir una nueva yerba.
 */
function openModal() {
    yerbaForm.reset();
    recordIdInput.value = '';
    modalTitle.textContent = 'Añadir Nueva Yerba';
    saveButton.textContent = 'Guardar Yerba';
    
    imagenTip.classList.remove('text-danger');
    imagenTip.classList.add('text-secondary');

    crudModal.classList.remove('hidden');
    crudModal.classList.add('flex');
}

/**
 * Cierra el modal de formulario.
 */
function closeModal() {
    crudModal.classList.remove('flex');
    crudModal.classList.add('hidden');
}

/**
 * Maneja el clic fuera del contenido del modal para cerrarlo.
 * @param {Event} event - El evento de clic.
 */
function handleModalClick(event) {
    if (event.target === crudModal) {
        closeModal();
    }
}

/**
 * Envía los datos del formulario a Airtable para crear un nuevo registro.
 * @param {Event} event - El evento de envío del formulario.
 */
async function saveYerba(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const detalle = document.getElementById('detalle').value; 
    const descripcion = document.getElementById('descripcion').value;
    
    const fileInput = document.getElementById('imagen_input');
    let imagenData = null;
    
    // ==========================================================
    // LÓGICA DE MANEJO DE IMAGEN (USANDO PLACEHOLDER URL)
    // ==========================================================
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;

        console.warn(`[ADVERTENCIA DE ARCHIVO] La imagen local "${fileName}" no se subirá. Se usará un PLACEHOLDER de URL para el registro.`);
        
        // URL de placeholder con color similar al verde de Yerbadin
        const placeholderUrl = 'https://placehold.co/100x100/2e7d32/ffffff?text=YERBA';

        imagenData = [{ 
            "url": placeholderUrl, 
            "filename": fileName 
        }];
        
    } else {
        imagenData = null;
    }

    // Estructura de datos para Airtable
    const dataFields = {
        "Nombre": nombre,
        "Detalle": detalle,
        "Descripcion": descripcion,
    };

    if (imagenData) {
        dataFields["Imagen"] = imagenData;
    } 

    const data = { fields: dataFields };
    
    // ==========================================================
    // LÓGICA DE FETCH CON REINTENTOS
    // ==========================================================
    try {
        const maxRetries = 3;
        let attempt = 0;
        let response;

        while (attempt < maxRetries) {
            try {
                response = await fetch(AIRTABLE_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    break; // Éxito
                }
                
                // Reintento para errores de servidor o throttling
                if (response.status >= 500 || response.status === 429) {
                    if (attempt < maxRetries - 1) {
                        const delay = Math.pow(2, attempt) * 1000;
                        console.log(`Reintento ${attempt + 1}: Falló con código ${response.status}. Esperando ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        attempt++;
                        continue;
                    }
                }
                
                // Error de Entidad No Procesable (generalmente campos o adjuntos)
                if (response.status === 422) {
                    const errorBody = await response.json();
                    const errorMsg = errorBody.error ? errorBody.error.message : response.statusText;
                    
                    if (errorMsg.includes("invalid attachment")) {
                        showStatus("¡ERROR! La URL de imagen de PLACEHOLDER falló. Intenta de nuevo o no uses imagen.", 'error');
                    }
                    
                    throw new Error(`Error 422 (Entidad No Procesable). Detalles: ${errorMsg}`);
                }

                // Otros errores 4xx o falla en el último reintento
                throw new Error(`Error al guardar: ${response.status} - ${response.statusText}`);

            } catch (error) {
                if (error.message.includes("Error al guardar") || error.message.includes("422") || attempt === maxRetries - 1) {
                    throw error;
                }
                // Si es un error temporal (5xx o 429), el bucle continuará al siguiente intento
            }
        }
        
        if (!response || !response.ok) {
            const errorDetails = response ? `${response.status} - ${response.statusText}` : "Fallo de red o tiempo de espera.";
            throw new Error(`Error al guardar: ${errorDetails}`);
        }

        closeModal();
        showStatus('Yerba añadida con éxito.', 'success');

    } catch (error) {
        console.error('Error saving data to Airtable:', error);
        
        let errorMessage = error.message;

        // Errores de API Key
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
            errorMessage = "Error de autorización (401/403). Verifica tu API Key y permisos de la Base/Tabla.";
        } 
        
        showStatus(errorMessage, 'error');
    }
}

window.onload = () => {
    renderAddCard();
};