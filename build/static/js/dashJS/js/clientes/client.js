// ✅ Obtener el token almacenado
function getToken() {
    return localStorage.getItem("access_token");
}

// ✅ Función para obtener y mostrar clientes
async function obtenerClientes() {
    const token = getToken();
    if (!token) {
        document.getElementById("clientes-tbody").innerHTML =
            `<tr><td colspan="4">Token no encontrado</td></tr>`;
        return;
    }

    try {
        console.log("⏳ Cargando clientes y órdenes...");

        const baseUrl = document.body.dataset.apiUrl;
        const clientesRes = await fetch(`${baseUrl}/api/clientes/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("✅ Clientes response status:", clientesRes.status);

        const ordenes = await obtenerTodasLasOrdenes(); // esta función ya tiene su catch

        if (!clientesRes.ok) {
            const errorText = await clientesRes.text();
            console.warn("⚠️ Error en respuesta clientes:", errorText);
            document.getElementById("clientes-tbody").innerHTML =
                `<tr><td colspan="4">Error ${clientesRes.status}</td></tr>`;
            return;
        }

        const clientes = await clientesRes.json();
        console.log("📦 Clientes recibidos:", clientes);
        console.log("📦 Órdenes recibidas:", ordenes);

        renderClientes(clientes, ordenes, 1); // ← inicializa con página 1

    } catch (error) {
        console.error("❌ Error de conexión general:", error);
        document.getElementById("clientes-tbody").innerHTML =
            `<tr><td colspan="4">Error de conexión</td></tr>`;
    }
}



async function obtenerTodasLasOrdenes() {
    const token = getToken();
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const res = await fetch(`${baseUrl}/api/orders/get-orders/`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error("Error al obtener las órdenes");

        const data = await res.json();
        return data.orders || []; // ajusta "orders" al nombre correcto del array en tu respuesta
    } catch (error) {
        console.error("Error al obtener órdenes:", error);
        return [];
    }
}


// ✅ Función para renderizar los datos
// function renderClientes(clientes, ordenes) {
//     const tbody = document.getElementById("clientes-tbody");
//     tbody.innerHTML = "";

//     if (!clientes || clientes.length === 0) {
//         tbody.innerHTML = `<tr><td colspan="4">No hay clientes registrados</td></tr>`;
//         return;
//     }

//     clientes.forEach(cliente => {
//         const pedidosUsuario = ordenes.filter(order => order.user === cliente.id);
//         const totalCompras = pedidosUsuario.length;
//         const totalGastado = pedidosUsuario.reduce((sum, order) => sum + parseFloat(order.amount), 0).toFixed(2);

//         tbody.innerHTML += `
//             <tr style="cursor: pointer;" onclick="location.href='/dash-profileClient/${cliente.id}/'">
//                 <td>${cliente.first_name} ${cliente.last_name}</td>
//                 <td>
//                     <a href="mailto:${cliente.email}" class="text-primary text-decoration-none">
//                         ${cliente.email}
//                     </a>
//                 </td>
//                 <td>${totalCompras} ${totalCompras === 1 ? "compra" : "compras"}</td>
//                 <td>${totalGastado} PEN</td>
//             </tr>
//         `;
//     });
// }

const ROWS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;
let globalClientes = [];
let globalOrdenes = [];

function renderClientes(clientes, ordenes, page = 1) {
    globalClientes = clientes;
    globalOrdenes = ordenes;
    const tbody = document.getElementById("clientes-tbody");
    tbody.innerHTML = "";

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No hay clientes registrados</td></tr>`;
        return;
    }

    totalPages = Math.ceil(clientes.length / ROWS_PER_PAGE);
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const clientesPaginados = clientes.slice(start, end);

    clientesPaginados.forEach(cliente => {
        const pedidosUsuario = ordenes.filter(order => order.user === cliente.id);
        const totalCompras = pedidosUsuario.length;
        const totalGastado = pedidosUsuario.reduce((sum, order) => sum + parseFloat(order.amount), 0).toFixed(2);

        tbody.innerHTML += `
            <tr style="cursor: pointer;" onclick="location.href='/dash-profileClient/${cliente.id}/'">
                <td>${cliente.first_name} ${cliente.last_name}</td>
                <td>
                    <a href="mailto:${cliente.email}" class="text-primary text-decoration-none">
                        ${cliente.email}
                    </a>
                </td>
                <td>${totalCompras} ${totalCompras === 1 ? "compra" : "compras"}</td>
                <td>${totalGastado} PEN</td>
            </tr>
        `;
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const container = document.getElementById("pagination-controls");
    container.innerHTML = "";

    if (totalPages <= 1) return;

    let html = `<nav><ul class="pagination justify-content-center">`;

    // Botón "Anterior"
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="goToPage(${currentPage - 1})">Anterior</button>
             </li>`;

    // Lógica para mostrar como máximo 5 botones
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
        start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="goToPage(${i})">${i}</button>
                 </li>`;
    }

    // Botón "Siguiente"
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="goToPage(${currentPage + 1})">Siguiente</button>
             </li>`;

    html += `</ul></nav>`;
    container.innerHTML = html;
}


function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderClientes(globalClientes, globalOrdenes, page);
    }
}


// ✅ Redirigir al perfil del cliente
function verPerfilCliente(idCliente) {
    window.location.href = `/dash-profileClient/?id=${idCliente}`;
}



// ✅ Función para detectar la ruta actual
function verificarRuta() {
    // console.log("Ruta actual:", window.location.pathname);

    // Detecta si estás en la ruta correcta
    if (window.location.pathname.includes("dash-allUsers")) {
        console.log("Ruta correcta, cargando clientes...");
        obtenerClientes();
    }
}

// ✅ Función para monitorear cambios de ruta dinámicamente
function detectarCambiosRuta() {
    verificarRuta(); // Primera llamada inicial

    // Monitorea cambios de ruta en aplicaciones SPA
    window.addEventListener("popstate", verificarRuta);
    window.addEventListener("hashchange", verificarRuta);

    // Detectar cambios de ruta mediante eventos personalizados
    document.body.addEventListener("click", (event) => {
        const target = event.target;

        // Validación para links internos
        if (target.tagName === 'A' && target.href.includes("dash-allUsers")) {
            event.preventDefault(); // Evita el comportamiento predeterminado
            history.pushState({}, "", target.href); // Cambia la URL
            verificarRuta(); // Ejecuta la función
        }
    });
}

// ✅ Detectar cuando la página carga completamente
document.addEventListener("DOMContentLoaded", detectarCambiosRuta);

