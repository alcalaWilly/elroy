// function checkAndLoadAllPedido() {
//     let currentPath = window.location.pathname;
//     if (currentPath.includes("dash-allPedido")) {
//         console.log("📌 Cargando vista AllPedido...");
//         clearTimeout(allPedidoTimeout);
//         allPedidoTimeout = setTimeout(() => {
//             // Aquí llamas las funciones que deben ejecutarse al entrar a esa vista
//             // loadAllPedidos();     // Ejemplo: cargar todos los pedidos
//             // setupFiltros();       // Ejemplo: filtros de búsqueda
//             // inicializarEventos(); // Ejemplo: listeners de botones
//         }, 500);
//     }
// }

// let allPedidoTimeout = null;
// let lastAllPedidoPath = window.location.pathname;

// const allPedidoObserver = new MutationObserver(() => {
//     if (window.location.pathname !== lastAllPedidoPath) {
//         lastAllPedidoPath = window.location.pathname;
//         checkAndLoadAllPedido();
//     }
// });

// document.addEventListener("DOMContentLoaded", () => {
//     checkAndLoadAllPedido();
//     allPedidoObserver.observe(document.body, { childList: true, subtree: true });
// });


////////////////////////////////////////////////////


function checkAndLoadAllPedido() {
    let currentPath = window.location.pathname;
    if (currentPath.includes("dash-allPedido")) {
        console.log("📌 Cargando vista AllPedido...");
        clearTimeout(allPedidoTimeout);
        allPedidoTimeout = setTimeout(() => {
            // Aquí llamas las funciones que deben ejecutarse al entrar a esa vista
            fetchOrders();
            // setupFiltros();       // Ejemplo: filtros de búsqueda
            // inicializarEventos(); // Ejemplo: listeners de botones

        }, 500);
    }
}

function getToken() {
    return localStorage.getItem("access_token");
}

const ROWS_PER_PAGE_ORDERS = 10;
let currentPageOrders = 1;
let totalPagesOrders = 1;
let globalOrders = [];

function fetchOrders() {
    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/orders/get-orders/`;

    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.orders && data.orders.length > 0) {
                globalOrders = data.orders; // Guarda los pedidos para paginar
                totalPagesOrders = Math.ceil(globalOrders.length / ROWS_PER_PAGE_ORDERS);
                populateTable(globalOrders, 1); // Carga la primera página
            } else {
                document.getElementById('pedidos-tbody').innerHTML = '<tr><td colspan="5">No se encontraron pedidos.</td></tr>';
                document.getElementById('pagination-orders').innerHTML = ''; // Limpiar paginación si no hay resultados
            }
        })
        .catch(error => {
            console.error('Error al obtener los pedidos:', error);
            document.getElementById('pedidos-tbody').innerHTML = '<tr><td colspan="5">Error al cargar los pedidos.</td></tr>';
            document.getElementById('pagination-orders').innerHTML = '';
        });
}


function populateTable(orders, paginaActual) {
    const tbody = document.getElementById('pedidos-tbody');
    tbody.innerHTML = '';

    const start = (paginaActual - 1) * ROWS_PER_PAGE_ORDERS;
    const end = start + ROWS_PER_PAGE_ORDERS;
    const pageOrders = orders.slice(start, end);

    pageOrders.forEach(order => {
        const row = document.createElement('tr');

        // Aquí hacemos la conversión de status
        let statusLabel = "";
        let badgeClass = "";

        switch (order.status) {
            case 'not_processed':
                statusLabel = "Pagado";
                badgeClass = "bg-primary"; // Azul
                break;
            case 'processed':
                statusLabel = "Empaquetado";
                badgeClass = "bg-info"; // Celeste
                break;
            case 'shipped':
                statusLabel = "En Camino";
                badgeClass = "bg-warning"; // Amarillo
                break;
            case 'delivered':
                statusLabel = "Entregado";
                badgeClass = "bg-success"; // Verde
                break;
            default:
                statusLabel = "Desconocido";
                badgeClass = "bg-secondary"; // Gris
        }

        row.innerHTML = `
            <td style="cursor: pointer;">${new Date(order.date_issued).toLocaleDateString()}</td>
            <td style="cursor: pointer;">${order.transaction_id}</td>
            <td style="cursor: pointer;">${order.full_name}</td>
            <td style="cursor: pointer;">${parseFloat(order.amount).toFixed(2)} PEN</td>
            <td style="cursor: pointer;">
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </td>
            <td style="cursor: pointer;">${order.items.length}</td>
        `;

        row.addEventListener('click', () => verDetallePedido(order.transaction_id));
        tbody.appendChild(row);
    });

    renderOrdersPaginationControls(
        paginaActual,
        totalPagesOrders,
        page => {
            currentPageOrders = page;
            populateTable(globalOrders, page);
        }
    );
}




function renderOrdersPaginationControls(paginaActual, totalPaginas, onPageClick) {
    const container = document.getElementById('pagination-orders');
    container.innerHTML = ''; // Limpiar controles anteriores

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Botón Anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `<button class="page-link">Anterior</button>`;
    liAnterior.addEventListener('click', () => {
        if (paginaActual > 1) onPageClick(paginaActual - 1);
    });
    ul.appendChild(liAnterior);

    // Lógica para mostrar máximo 5 botones de página
    let start = Math.max(1, paginaActual - 2);
    let end = Math.min(totalPaginas, start + 4);

    // Si estamos cerca del final, ajustamos el inicio
    if (end - start < 4) {
        start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<button class="page-link">${i}</button>`;
        li.addEventListener('click', () => onPageClick(i));
        ul.appendChild(li);
    }

    // Botón Siguiente
    const liSiguiente = document.createElement('li');
    liSiguiente.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liSiguiente.innerHTML = `<button class="page-link">Siguiente</button>`;
    liSiguiente.addEventListener('click', () => {
        if (paginaActual < totalPaginas) onPageClick(paginaActual + 1);
    });
    ul.appendChild(liSiguiente);

    container.appendChild(ul);
}


function goToOrderPage(page) {
    if (page >= 1 && page <= totalPagesOrders) {
        populateTable(globalOrders, page);
    }
}

// Redirigir al detalle del pedido
function verDetallePedido(transactionId) {
    window.location.href = `/dash-detallePedido/?transaction=${transactionId}`;
}


let allPedidoTimeout = null;
let lastAllPedidoPath = window.location.pathname;

const allPedidoObserver = new MutationObserver(() => {
    if (window.location.pathname !== lastAllPedidoPath) {
        lastAllPedidoPath = window.location.pathname;
        checkAndLoadAllPedido();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    checkAndLoadAllPedido();
    allPedidoObserver.observe(document.body, { childList: true, subtree: true });
});
