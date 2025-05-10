document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    // Se ejecuta solo si estás en /dash-pedidoCliente/
    if (path === "/dash-pedidoCliente/") {
        obtenerPedidosCliente();
    } else {
        console.log("🟡 No estás en /dash-pedidoCliente/");
    }
});

function obtenerPedidosCliente() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");  // Obtiene el valor del parámetro "id"

    if (orderId) {
        console.log("✅ ID del pedido:", orderId);
        // Aquí puedes hacer lo que necesites con el orderId, por ejemplo, llamar a fetchOrderDetails
        allPedidos(orderId);  // ← Aquí puedes usar el orderId para obtener los detalles del pedido
    } else {
        console.warn("🚫 No se pudo obtener el ID del pedido desde la URL.");
    }
}

function allPedidos(orderId) {
    const token = getToken(); // Tu función para obtener token
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/orders/user/${orderId}/`;

    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Datos recibidos:", data); // Verifica los datos en la consola
        if (data && data.length > 0) {
            renderAllPedidos(data); // Asegúrate de que se pasa el array de pedidos
        } else {
            document.querySelector("#pedidosCliente-tbody").innerHTML = `<tr><td colspan="4">No hay productos.</td></tr>`;
        }
    })
    .catch(error => {
        console.error("❌ Error al obtener el detalle del pedido:", error);
    });
}

function renderAllPedidos(data) {
    console.log("🔍 Pedidos:", data); // Esto te permitirá ver qué datos recibes

    const tbody = document.querySelector("#pedidosCliente-tbody");
    tbody.innerHTML = ""; // Limpiar la tabla antes de agregar los nuevos datos

    // Mostrar el nombre del cliente en el div
    const nombreClienteDiv = document.querySelector(".card-body span span");
    if (data && data.length > 0) {
        // Asumimos que el 'full_name' es el mismo para todos los pedidos de un cliente
        const nombreCliente = data[0].full_name; // Usamos el nombre del primer pedido
        nombreClienteDiv.textContent = nombreCliente; // Establecer el nombre del cliente en el HTML
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No hay pedidos disponibles.</td></tr>`;
        return;
    }

    data.forEach(pedido => {
        console.log("📦 Pedido:", pedido);
    
        const fila = document.createElement("tr");
        fila.style.cursor = "pointer"; // ← 🔥 Añade el estilo de cursor pointer
    
        // Formatear la fecha
        const fecha = new Date(pedido.date_issued);
        const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    
        // Celda: Fecha
        const fechaCelda = document.createElement("td");
        fechaCelda.textContent = fechaFormateada;
        fila.appendChild(fechaCelda);
    
        // Celda: Total
        const totalCelda = document.createElement("td");
        totalCelda.textContent = `${parseFloat(pedido.amount).toFixed(2)} PEN`;
        fila.appendChild(totalCelda);
    
        // Celda: Estado
        const estadoCelda = document.createElement("td");
        estadoCelda.textContent = pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1);
        fila.appendChild(estadoCelda);
    
        // Celda: Artículos
        const articulosCelda = document.createElement("td");
        articulosCelda.textContent = pedido.items.reduce((total, item) => total + (item.count || 0), 0);
        fila.appendChild(articulosCelda);
    
        // Evento click
        fila.addEventListener("click", () => {
            const transactionId = pedido.transaction_id;
            verDetallePedido(transactionId);
        });
    
        // Agregar fila al tbody
        tbody.appendChild(fila);
    });
    
}


// Función que redirige a la página de detalle del pedido
function verDetallePedido(transactionId) {
    // Redirigir a la página de detalles con el transaction_id en la URL
    window.location.href = `/dash-detallePedido/?transaction=${transactionId}`;
}

