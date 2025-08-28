const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================================================================================
// SELECTORES DE ELEMENTOS DEL DOM
// ===================================================================================
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const emailInput = document.getElementById('email-address');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submit-button');
const authError = document.getElementById('auth-error');
const logoutButton = document.getElementById('logout-button');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
let modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const addInmuebleBtn = document.getElementById('add-inmueble-btn');
const addInquilinoBtn = document.getElementById('add-inquilino-btn');
const addReciboBtn = document.getElementById('add-recibo-btn');
const addMantenimientoBtn = document.getElementById('add-mantenimiento-btn');
const addPlantillaBtn = document.getElementById('add-plantilla-btn');
const inmueblesTableBody = document.getElementById('inmuebles-table-body');
const inquilinosTableBody = document.getElementById('inquilinos-table-body');
const recibosTableBody = document.getElementById('recibos-table-body');
const mantenimientoTableBody = document.getElementById('mantenimiento-table-body');
const plantillasContainer = document.getElementById('plantillas-container');
const totalInmueblesEl = document.getElementById('total-inmuebles');
const inmueblesOcupadosEl = document.getElementById('inmuebles-ocupados');
const inmueblesDisponiblesEl = document.getElementById('inmuebles-disponibles');
const inquilinosActivosEl = document.getElementById('inquilinos-activos');
const recibosPendientesEl = document.getElementById('recibos-pendientes');
const montoPendienteEl = document.getElementById('monto-pendiente');
// NUEVOS SELECTORES PARA NAVEGACIÓN MÓVIL
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

// ===================================================================================
// ESTADO DE LA APLICACIÓN
// ===================================================================================
let editingItemId = null;

// ===================================================================================
// FUNCIONES AUXILIARES
// ===================================================================================
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    toast.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function showSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
    navLinks.forEach(link => {
        link.classList.toggle('bg-gray-900', link.dataset.section === sectionId);
    });
}

function openModal(title, formHtml, submitHandler) {
    modalTitle.textContent = title;
    modalForm.innerHTML = formHtml;
    modal.classList.remove('hidden');
    
    const newSubmitBtn = modalSubmitBtn.cloneNode(true);
    modalSubmitBtn.parentNode.replaceChild(newSubmitBtn, modalSubmitBtn);
    modalSubmitBtn = newSubmitBtn;

    modalSubmitBtn.onclick = submitHandler;
}

function closeModal() {
    modal.classList.add('hidden');
    modalForm.innerHTML = '';
    editingItemId = null;
}

// ===================================================================================
// LÓGICA DE AUTENTICACIÓN
// ===================================================================================
async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
    } catch (error) {
        console.error('Error de autenticación:', error.message);
        authError.textContent = "Email o contraseña incorrectos.";
    }
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        showToast('Error al cerrar sesión', true);
    }
}

// ===================================================================================
// LÓGICA DE CARGA Y RENDERIZADO DE DATOS
// ===================================================================================
async function fetchAndRenderInmuebles() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data, error } = await supabaseClient.from('inmuebles').select('*').eq('propietario_id', user.id).order('created_at', { ascending: false });
    if (error) return console.error('Error cargando inmuebles:', error);

    inmueblesTableBody.innerHTML = data.map(inmueble => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${inmueble.nombre_propiedad}</td>
            <td class="p-4">${inmueble.direccion}</td>
            <td class="p-4">${inmueble.tipo_inmueble}</td>
            <td class="p-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${
                inmueble.estado_actual === 'Ocupado' ? 'bg-red-200 text-red-800' :
                inmueble.estado_actual === 'Disponible' ? 'bg-green-200 text-green-800' :
                'bg-yellow-200 text-yellow-800'
            }">${inmueble.estado_actual}</span></td>
            <td class="p-4">
                <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="handleEditInmueble('${inmueble.id}')">Editar</button>
                <button class="text-red-600 hover:text-red-900" onclick="handleDelete('inmuebles', '${inmueble.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}
    
async function fetchAndRenderInquilinos() {
    const { data, error } = await supabaseClient.from('inquilinos').select(`*, inmuebles (nombre_propiedad)`).order('created_at', { ascending: false });
    if (error) return console.error('Error cargando inquilinos:', error);
    
    inquilinosTableBody.innerHTML = data.map(inquilino => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${inquilino.nombre_completo}</td>
            <td class="p-4">${inquilino.dni_identificacion}</td>
            <td class="p-4">${inquilino.telefono}</td>
            <td class="p-4">${inquilino.email}</td>
            <td class="p-4">${inquilino.inmuebles ? inquilino.inmuebles.nombre_propiedad : 'No asignado'}</td>
            <td class="p-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${
                inquilino.estado_inquilino === 'Activo' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
            }">${inquilino.estado_inquilino}</span></td>
            <td class="p-4">
                <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="handleEditInquilino('${inquilino.id}')">Editar</button>
                <button class="text-red-600 hover:text-red-900" onclick="handleDelete('inquilinos', '${inquilino.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function fetchAndRenderRecibos() {
    const { data, error } = await supabaseClient.from('recibos').select(`*, inmuebles (nombre_propiedad), inquilinos (nombre_completo)`).order('fecha_emision', { ascending: false });
    if (error) return console.error('Error cargando recibos:', error);

    recibosTableBody.innerHTML = data.map(recibo => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${recibo.inmuebles ? recibo.inmuebles.nombre_propiedad : 'N/A'}</td>
            <td class="p-4">${recibo.inquilinos ? recibo.inquilinos.nombre_completo : 'N/A'}</td>
            <td class="p-4">${new Date(recibo.fecha_emision).toLocaleDateString()}</td>
            <td class="p-4">${recibo.mes_alquiler}</td>
            <td class="p-4 font-semibold">$${recibo.total_cobrar}</td>
            <td class="p-4">
                <button class="px-2 py-1 text-xs font-semibold rounded-full ${
                    recibo.estado_recibo === 'Cobrado' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                }" onclick="toggleEstadoRecibo('${recibo.id}', '${recibo.estado_recibo}')">
                    ${recibo.estado_recibo}
                </button>
            </td>
            <td class="p-4">
                <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="handleEditRecibo('${recibo.id}')">Editar</button>
                <button class="text-red-600 hover:text-red-900" onclick="handleDelete('recibos', '${recibo.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function fetchAndRenderMantenimiento() {
    const { data, error } = await supabaseClient.from('solicitudes_mantenimiento').select(`*, inmuebles (nombre_propiedad)`).order('fecha_reporte', { ascending: false });
    if (error) return console.error('Error cargando mantenimiento:', error);

    mantenimientoTableBody.innerHTML = data.map(solicitud => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${solicitud.inmuebles ? solicitud.inmuebles.nombre_propiedad : 'N/A'}</td>
            <td class="p-4">${solicitud.descripcion_problema}</td>
            <td class="p-4">${new Date(solicitud.fecha_reporte).toLocaleString()}</td>
            <td class="p-4">
                <select class="p-1 rounded border-gray-300" onchange="updateEstadoMantenimiento('${solicitud.id}', this.value)">
                    <option value="Pendiente" ${solicitud.estado_solicitud === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En Progreso" ${solicitud.estado_solicitud === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                    <option value="Resuelta" ${solicitud.estado_solicitud === 'Resuelta' ? 'selected' : ''}>Resuelta</option>
                </select>
            </td>
            <td class="p-4">
                <button class="text-red-600 hover:text-red-900" onclick="handleDelete('solicitudes_mantenimiento', '${solicitud.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function fetchAndRenderPlantillas() {
    const { data, error } = await supabaseClient.from('plantillas_comunicacion').select('*').order('created_at', { ascending: false });
    if (error) return console.error('Error cargando plantillas:', error);

    plantillasContainer.innerHTML = data.map(plantilla => `
        <div class="bg-white p-4 rounded-lg shadow-md flex flex-col">
            <h4 class="text-lg font-bold mb-2">${plantilla.titulo_plantilla}</h4>
            <p class="text-gray-600 flex-1 mb-4">${plantilla.contenido_mensaje}</p>
            <div class="mt-auto flex justify-between items-center">
                <button class="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300" onclick="copyToClipboard('${plantilla.contenido_mensaje.replace(/'/g, "\\'")}')">Copiar</button>
                <div>
                    <button class="text-indigo-600 hover:text-indigo-900 mr-2" onclick="handleEditPlantilla('${plantilla.id}')">Editar</button>
                    <button class="text-red-600 hover:text-red-900" onclick="handleDelete('plantillas_comunicacion', '${plantilla.id}')">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}
    
async function updateDashboardStats() {
    const { data: inmuebles, error: inmueblesError } = await supabaseClient.from('inmuebles').select('estado_actual');
    if (inmueblesError) return console.error(inmueblesError);
    
    totalInmueblesEl.textContent = inmuebles.length;
    inmueblesOcupadosEl.textContent = inmuebles.filter(i => i.estado_actual === 'Ocupado').length;
    inmueblesDisponiblesEl.textContent = inmuebles.filter(i => i.estado_actual === 'Disponible').length;

    const { count: inquilinosActivos, error: inquilinosError } = await supabaseClient.from('inquilinos').select('*', { count: 'exact', head: true }).eq('estado_inquilino', 'Activo');
    if (inquilinosError) return console.error(inquilinosError);
    inquilinosActivosEl.textContent = inquilinosActivos;

    const { data: recibos, error: recibosError } = await supabaseClient.from('recibos').select('total_cobrar, estado_recibo').eq('estado_recibo', 'Pendiente');
    if (recibosError) return console.error(recibosError);
    
    recibosPendientesEl.textContent = recibos.length;
    const montoPendiente = recibos.reduce((sum, r) => sum + r.total_cobrar, 0);
    montoPendienteEl.textContent = `$${montoPendiente.toFixed(2)}`;
}

// ===================================================================================
// MANEJADORES DE EVENTOS (CRUD)
// ===================================================================================
async function handleSaveInmueble() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const inmuebleData = {
        nombre_propiedad: document.getElementById('nombre_propiedad').value,
        direccion: document.getElementById('direccion').value,
        ciudad_provincia: document.getElementById('ciudad_provincia').value,
        tipo_inmueble: document.getElementById('tipo_inmueble').value,
        estado_actual: document.getElementById('estado_actual').value,
        propietario_id: user.id,
    };

    const { error } = editingItemId
        ? await supabaseClient.from('inmuebles').update(inmuebleData).eq('id', editingItemId)
        : await supabaseClient.from('inmuebles').insert([inmuebleData]);

    if (error) {
        showToast('Error al guardar el inmueble', true);
        console.error(error);
    } else {
        showToast(`Inmueble ${editingItemId ? 'actualizado' : 'creado'} con éxito.`);
        closeModal();
        loadDataForSection('inmuebles');
        updateDashboardStats();
    }
}

async function handleEditInmueble(id) {
    editingItemId = id;
    const { data, error } = await supabaseClient.from('inmuebles').select('*').eq('id', id).single();
    if (error) return console.error(error);

    const formHtml = `
        <input type="text" id="nombre_propiedad" placeholder="Nombre" required class="w-full p-2 border rounded" value="${data.nombre_propiedad}">
        <input type="text" id="direccion" placeholder="Dirección" required class="w-full p-2 border rounded" value="${data.direccion}">
        <input type="text" id="ciudad_provincia" placeholder="Ciudad, Provincia" class="w-full p-2 border rounded" value="${data.ciudad_provincia}">
        <select id="tipo_inmueble" class="w-full p-2 border rounded">
            <option value="Departamento" ${data.tipo_inmueble === 'Departamento' ? 'selected' : ''}>Departamento</option>
            <option value="Casa" ${data.tipo_inmueble === 'Casa' ? 'selected' : ''}>Casa</option>
            <option value="Local Comercial" ${data.tipo_inmueble === 'Local Comercial' ? 'selected' : ''}>Local Comercial</option>
        </select>
        <select id="estado_actual" class="w-full p-2 border rounded">
            <option value="Disponible" ${data.estado_actual === 'Disponible' ? 'selected' : ''}>Disponible</option>
            <option value="Ocupado" ${data.estado_actual === 'Ocupado' ? 'selected' : ''}>Ocupado</option>
            <option value="En Mantenimiento" ${data.estado_actual === 'En Mantenimiento' ? 'selected' : ''}>En Mantenimiento</option>
        </select>
    `;
    openModal('Editar Inmueble', formHtml, handleSaveInmueble);
}
    
async function handleSaveInquilino() {
    const inquilinoData = {
        nombre_completo: document.getElementById('nombre_completo').value,
        dni_identificacion: document.getElementById('dni_identificacion').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        inmueble_asignado_id: document.getElementById('inmueble_asignado_id').value,
        estado_inquilino: document.getElementById('estado_inquilino').value,
    };

    const { error } = editingItemId
        ? await supabaseClient.from('inquilinos').update(inquilinoData).eq('id', editingItemId)
        : await supabaseClient.from('inquilinos').insert([inquilinoData]);
    
    if (error) {
        showToast('Error al guardar el inquilino', true);
    } else {
        showToast(`Inquilino ${editingItemId ? 'actualizado' : 'creado'} con éxito.`);
        closeModal();
        loadDataForSection('inquilinos');
        updateDashboardStats();
    }
}
    
async function handleEditInquilino(id) {
    editingItemId = id;
    const { data, error } = await supabaseClient.from('inquilinos').select('*').eq('id', id).single();
    if (error) return console.error(error);

    const { data: inmuebles } = await supabaseClient.from('inmuebles').select('id, nombre_propiedad');
    const options = inmuebles.map(i => `<option value="${i.id}" ${data.inmueble_asignado_id === i.id ? 'selected' : ''}>${i.nombre_propiedad}</option>`).join('');

    const formHtml = `
        <input type="text" id="nombre_completo" required class="w-full p-2 border rounded" value="${data.nombre_completo}">
        <input type="text" id="dni_identificacion" required class="w-full p-2 border rounded" value="${data.dni_identificacion}">
        <input type="tel" id="telefono" class="w-full p-2 border rounded" value="${data.telefono}">
        <input type="email" id="email" class="w-full p-2 border rounded" value="${data.email}">
        <select id="inmueble_asignado_id" class="w-full p-2 border rounded" required>${options}</select>
        <select id="estado_inquilino" class="w-full p-2 border rounded">
            <option value="Activo" ${data.estado_inquilino === 'Activo' ? 'selected' : ''}>Activo</option>
            <option value="Inactivo/Baja" ${data.estado_inquilino === 'Inactivo/Baja' ? 'selected' : ''}>Inactivo/Baja</option>
        </select>
    `;
    openModal('Editar Inquilino', formHtml, handleSaveInquilino);
}
    
async function handleSaveRecibo() {
    const importeAlquiler = parseFloat(document.getElementById('importe_alquiler').value) || 0;
    const importeSuministros = parseFloat(document.getElementById('importe_suministros').value) || 0;
    
    const reciboData = {
        inmueble_id: document.getElementById('inmueble_id').value,
        inquilino_id: document.getElementById('inquilino_id').value,
        fecha_emision: document.getElementById('fecha_emision').value,
        mes_alquiler: document.getElementById('mes_alquiler').value,
        importe_alquiler: importeAlquiler,
        importe_suministros: importeSuministros,
        total_cobrar: importeAlquiler + importeSuministros,
        estado_recibo: document.getElementById('estado_recibo').value,
    };

    const { error } = editingItemId
        ? await supabaseClient.from('recibos').update(reciboData).eq('id', editingItemId)
        : await supabaseClient.from('recibos').insert([reciboData]);
    
    if (error) {
        showToast('Error al guardar el recibo', true);
    } else {
        showToast(`Recibo ${editingItemId ? 'actualizado' : 'creado'} con éxito.`);
        closeModal();
        loadDataForSection('recibos');
        updateDashboardStats();
    }
}
    
async function handleEditRecibo(id) {
    editingItemId = id;
    const { data, error } = await supabaseClient.from('recibos').select('*').eq('id', id).single();
    if (error) return console.error(error);

    const { data: inmuebles } = await supabaseClient.from('inmuebles').select('id, nombre_propiedad');
    const { data: inquilinos } = await supabaseClient.from('inquilinos').select('id, nombre_completo');

    const inmuebleOptions = inmuebles.map(i => `<option value="${i.id}" ${data.inmueble_id === i.id ? 'selected' : ''}>${i.nombre_propiedad}</option>`).join('');
    const inquilinoOptions = inquilinos.map(i => `<option value="${i.id}" ${data.inquilino_id === i.id ? 'selected' : ''}>${i.nombre_completo}</option>`).join('');

    const formHtml = `
        <select id="inmueble_id" class="w-full p-2 border rounded" required>${inmuebleOptions}</select>
        <select id="inquilino_id" class="w-full p-2 border rounded" required>${inquilinoOptions}</select>
        <input type="date" id="fecha_emision" required class="w-full p-2 border rounded" value="${data.fecha_emision}">
        <input type="text" id="mes_alquiler" required class="w-full p-2 border rounded" value="${data.mes_alquiler}">
        <input type="number" id="importe_alquiler" required class="w-full p-2 border rounded" step="0.01" value="${data.importe_alquiler}">
        <input type="number" id="importe_suministros" class="w-full p-2 border rounded" step="0.01" value="${data.importe_suministros}">
        <select id="estado_recibo" class="w-full p-2 border rounded">
            <option value="Pendiente" ${data.estado_recibo === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Cobrado" ${data.estado_recibo === 'Cobrado' ? 'selected' : ''}>Cobrado</option>
        </select>
    `;
    openModal('Editar Recibo', formHtml, handleSaveRecibo);
}
    
async function toggleEstadoRecibo(id, estadoActual) {
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Cobrado' : 'Pendiente';
    const { error } = await supabaseClient.from('recibos').update({ estado_recibo: nuevoEstado }).eq('id', id);
    if (error) {
        showToast('Error al cambiar el estado', true);
    } else {
        showToast('Estado del recibo actualizado');
        loadDataForSection('recibos');
        updateDashboardStats();
    }
}

async function updateEstadoMantenimiento(id, nuevoEstado) {
    const { error } = await supabaseClient.from('solicitudes_mantenimiento').update({ estado_solicitud: nuevoEstado }).eq('id', id);
    if (error) showToast('Error al actualizar estado', true);
    else showToast('Estado de solicitud actualizado');
}

async function handleSavePlantilla() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const data = {
        propietario_id: user.id,
        titulo_plantilla: document.getElementById('titulo_plantilla').value,
        contenido_mensaje: document.getElementById('contenido_mensaje').value,
    };
    
    const { error } = editingItemId
        ? await supabaseClient.from('plantillas_comunicacion').update(data).eq('id', editingItemId)
        : await supabaseClient.from('plantillas_comunicacion').insert([data]);
        
    if (error) showToast('Error al guardar plantilla', true);
    else {
        showToast('Plantilla guardada');
        closeModal();
        loadDataForSection('plantillas');
    }
}

async function handleEditPlantilla(id) {
    editingItemId = id;
    const { data, error } = await supabaseClient.from('plantillas_comunicacion').select('*').eq('id', id).single();
    if (error) return console.error(error);
    const formHtml = `
        <input type="text" id="titulo_plantilla" value="${data.titulo_plantilla}" required class="w-full p-2 border rounded">
        <textarea id="contenido_mensaje" required class="w-full p-2 border rounded h-32">${data.contenido_mensaje}</textarea>
    `;
    openModal('Editar Plantilla', formHtml, handleSavePlantilla);
}
    
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Texto copiado al portapapeles');
    }, () => {
        showToast('Error al copiar el texto', true);
    });
}

async function handleDelete(tableName, id) {
    if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
        const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
        if (error) {
            showToast('Error al eliminar', true);
        } else {
            showToast('Elemento eliminado con éxito');
            const currentSection = document.querySelector('.content-section.active').id;
            loadDataForSection(currentSection);
            updateDashboardStats();
        }
    }
}

// ===================================================================================
// INICIALIZACIÓN Y EVENT LISTENERS GENERALES
// ===================================================================================
function loadDataForSection(sectionId) {
    switch (sectionId) {
        case 'dashboard': updateDashboardStats(); break;
        case 'inmuebles': fetchAndRenderInmuebles(); break;
        case 'inquilinos': fetchAndRenderInquilinos(); break;
        case 'recibos': fetchAndRenderRecibos(); break;
        case 'mantenimiento': fetchAndRenderMantenimiento(); break;
        case 'plantillas': fetchAndRenderPlantillas(); break;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutButton.addEventListener('click', handleLogout);
    modalCloseBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });
    
    addInmuebleBtn.addEventListener('click', () => {
        editingItemId = null;
        const formHtml = `
            <input type="text" id="nombre_propiedad" placeholder="Nombre (ej. Depto. Centro)" required class="w-full p-2 border rounded">
            <input type="text" id="direccion" placeholder="Dirección" required class="w-full p-2 border rounded">
            <input type="text" id="ciudad_provincia" placeholder="Ciudad, Provincia" class="w-full p-2 border rounded">
            <select id="tipo_inmueble" class="w-full p-2 border rounded"><option>Departamento</option><option>Casa</option><option>Local Comercial</option></select>
            <select id="estado_actual" class="w-full p-2 border rounded"><option>Disponible</option><option>Ocupado</option><option>En Mantenimiento</option></select>
        `;
        openModal('Añadir Nuevo Inmueble', formHtml, handleSaveInmueble);
    });

    addInquilinoBtn.addEventListener('click', async () => {
        editingItemId = null;
        const { data: inmuebles } = await supabaseClient.from('inmuebles').select('id, nombre_propiedad');
        const options = inmuebles.map(i => `<option value="${i.id}">${i.nombre_propiedad}</option>`).join('');
        const formHtml = `
            <input type="text" id="nombre_completo" placeholder="Nombre Completo" required class="w-full p-2 border rounded">
            <input type="text" id="dni_identificacion" placeholder="DNI" required class="w-full p-2 border rounded">
            <input type="tel" id="telefono" placeholder="Teléfono" class="w-full p-2 border rounded">
            <input type="email" id="email" placeholder="Email" class="w-full p-2 border rounded">
            <select id="inmueble_asignado_id" class="w-full p-2 border rounded" required>${options}</select>
            <select id="estado_inquilino" class="w-full p-2 border rounded"><option>Activo</option><option>Inactivo/Baja</option></select>
        `;
        openModal('Añadir Nuevo Inquilino', formHtml, handleSaveInquilino);
    });

    addReciboBtn.addEventListener('click', async () => {
        editingItemId = null;
        const { data: inmuebles } = await supabaseClient.from('inmuebles').select('id, nombre_propiedad');
        const { data: inquilinos } = await supabaseClient.from('inquilinos').select('id, nombre_completo');
        const inmuebleOptions = inmuebles.map(i => `<option value="${i.id}">${i.nombre_propiedad}</option>`).join('');
        const inquilinoOptions = inquilinos.map(i => `<option value="${i.id}">${i.nombre_completo}</option>`).join('');
        const formHtml = `
            <select id="inmueble_id" class="w-full p-2 border rounded" required>${inmuebleOptions}</select>
            <select id="inquilino_id" class="w-full p-2 border rounded" required>${inquilinoOptions}</select>
            <input type="date" id="fecha_emision" required class="w-full p-2 border rounded">
            <input type="text" id="mes_alquiler" placeholder="Mes Alquiler (ej. Enero)" required class="w-full p-2 border rounded">
            <input type="number" id="importe_alquiler" placeholder="Importe Alquiler" required class="w-full p-2 border rounded" step="0.01">
            <input type="number" id="importe_suministros" placeholder="Importe Suministros" class="w-full p-2 border rounded" step="0.01" value="0">
            <select id="estado_recibo" class="w-full p-2 border rounded"><option>Pendiente</option><option>Cobrado</option></select>
        `;
        openModal('Crear Nuevo Recibo', formHtml, handleSaveRecibo);
    });

    addMantenimientoBtn.addEventListener('click', async () => {
        const { data: inmuebles } = await supabaseClient.from('inmuebles').select('id, nombre_propiedad');
        const options = inmuebles.map(i => `<option value="${i.id}">${i.nombre_propiedad}</option>`).join('');
        const formHtml = `
            <select id="inmueble_id" class="w-full p-2 border rounded" required>${options}</select>
            <textarea id="descripcion_problema" placeholder="Describe el problema" required class="w-full p-2 border rounded h-24"></textarea>
            <select id="estado_solicitud" class="w-full p-2 border rounded"><option>Pendiente</option><option>En Progreso</option><option>Resuelta</option></select>
        `;
        openModal('Crear Solicitud de Mantenimiento', formHtml, async () => {
            const data = {
                inmueble_id: document.getElementById('inmueble_id').value,
                descripcion_problema: document.getElementById('descripcion_problema').value,
                estado_solicitud: document.getElementById('estado_solicitud').value,
            };
            const { error } = await supabaseClient.from('solicitudes_mantenimiento').insert([data]);
            if (error) showToast('Error al crear la solicitud', true);
            else { showToast('Solicitud creada con éxito'); closeModal(); loadDataForSection('mantenimiento'); }
        });
    });

    addPlantillaBtn.addEventListener('click', () => {
        editingItemId = null;
        const formHtml = `
            <input type="text" id="titulo_plantilla" placeholder="Título de la plantilla" required class="w-full p-2 border rounded">
            <textarea id="contenido_mensaje" placeholder="Contenido del mensaje" required class="w-full p-2 border rounded h-32"></textarea>
        `;
        openModal('Crear Nueva Plantilla', formHtml, handleSavePlantilla);
    });
     // --- INICIO: LÓGICA PARA NAVEGACIÓN MÓVIL ---

    // Función para abrir el menú
    const openMobileMenu = () => {
        sidebar.classList.remove('-translate-x-full');
        mobileMenuOverlay.classList.remove('hidden');
    };

    // Función para cerrar el menú
    const closeMobileMenu = () => {
        sidebar.classList.add('-translate-x-full');
        mobileMenuOverlay.classList.add('hidden');
    };

    // Event listeners para los botones
    mobileMenuButton.addEventListener('click', openMobileMenu);
    mobileMenuCloseButton.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    // Modificación del listener de los enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.currentTarget.dataset.section;
            showSection(sectionId);
            loadDataForSection(sectionId);
            
            // Cierra el menú si estamos en vista móvil
            if (window.innerWidth < 768) { // 768px es el breakpoint 'md' de Tailwind
                closeMobileMenu();
            }
        });
    });

    // --- FIN: LÓGICA PARA NAVEGACIÓN MÓVIL ---
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        authView.style.display = 'none';
        mainView.style.display = 'block';
        showSection('dashboard');
        loadDataForSection('dashboard');
    } else {
        authView.style.display = 'flex';
        mainView.style.display = 'none';
    }
});
