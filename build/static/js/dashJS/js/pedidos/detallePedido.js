document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    // Se ejecuta solo si estás en /dash-detallePedido/
    if (path === "/dash-detallePedido/") {
        await cargarTallas(); // ← Cargar las tallas primero
        detectarYObtenerPedido();
    } else {
        console.log("🟡 No estás en /dash-detallePedido/");
    }
});

function inicializarStepper(statusPedido) {
    const steps = document.querySelectorAll('.step');

    // Relación entre status backend y pasos del stepper
    const statusToStepIndex = {
        "not_processed": 0,  // pago recibido pero no procesado
        "processed": 1,      // empaquetado
        "shipped": 2,        // en camino
        "delivered": 3       // entregado
    };

    // Obtener en qué paso estamos
    let currentStep = statusToStepIndex[statusPedido] ?? 0; // Si no encuentra, default 0

    const stepMessages = [
        "¿El pago ya fue realizado correctamente?",
        "¿El producto está siendo empaquetado o ya está listo?",
        "¿El pedido ya está en camino hacia el cliente?",
        "¿El pedido fue entregado y archivado correctamente?"
    ];

    // Resetear clases primero
    steps.forEach((step) => {
        step.classList.remove('completed', 'active');
    });

    // Pintar los pasos actuales
    steps.forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep) {
            step.classList.add('active');
        }
    });

    // Escuchar clicks para avanzar
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            if (index >= currentStep) {
                Swal.fire({
                    title: '¿Deseas avanzar?',
                    text: stepMessages[index],
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, continuar',
                    cancelButtonText: 'No, cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        updateSteps(index);
                        // Acá podrías llamar a la función para actualizar en backend
                        actualizarEstadoOrden(index);
                    }
                });
            }
        });
    });

    function updateSteps(index) {
        steps.forEach((step, i) => {
            if (i < index) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (i === index) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        currentStep = index;
    }
}

function actualizarEstadoOrden(stepIndex) {
    const token = getToken();
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get("transaction"); // ← Debes definir esta función para traer el ID actual

    // Relación inversa: paso → status backend
    const stepIndexToStatus = {
        0: "not_processed",
        1: "processed",
        2: "shipped",
        3: "delivered"
    };

    const nuevoStatus = stepIndexToStatus[stepIndex];

    console.log("ACTUALIZAR STATUS:",nuevoStatus)
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/api/orders/actualizar-status/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            transaction_id: transactionId,
            status: nuevoStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Estado actualizado en backend:", data);
    })
    .catch(error => {
        console.error("❌ Error al actualizar estado en backend:", error);
    });
}


function detectarYObtenerPedido() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("transaction");

    if (orderId) {
        console.log("✅ ID del pedido:", orderId);
        fetchOrderDetails(orderId); // ← aquí corregido
    } else {
        console.warn("🚫 No se pudo obtener el ID del pedido desde la URL.");
    }
}

async function fetchClienteInfo(idCliente) {
    const token = getToken(); // Tu función para obtener el token
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/actualizar-usuario/${idCliente}/`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener información del cliente");
        }

        const data = await response.json();
        renderClienteInfo(data);
    } catch (error) {
        console.error("❌ Error al obtener datos del cliente:", error);
    }
}

function fetchOrderDetails(transactionId) {
    const token = getToken(); // Tu función para obtener token
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/orders/get-order/${transactionId}/`;

    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Datos recibidos:", data);
            if (data && data.items) {
                renderOrderItems(data.items);
                renderResumenPago(data); // Nueva función para actualizar los totales
                fetchClienteInfo(data.user);
                mostrarFechaOrden(data.date_issued); // ← Agrega esto
                // Aquí inicializamos el stepper pasando el status
                inicializarStepper(data.status); 
            } else {
                document.querySelector("#tablaOrder tbody").innerHTML = `<tr><td colspan="4">No hay productos.</td></tr>`;
            }
        })
        .catch(error => {
            console.error("❌ Error al obtener el detalle del pedido:", error);
        });
}

async function renderOrderItems(items) {
    const tbody = document.querySelector("#tablaOrder tbody");
    tbody.innerHTML = '';

    for (const item of items) {
        const imgSrc = await obtenerImagenProducto(item.product);
        const total = parseFloat(item.price) * item.count;
        const nombreTalla = await obtenerNombreTalla(item.talla);

        // Mostrar color si hay, si no, mostrar talla
        const displayHtml = item.color
            ? `<div class="tallaPedido" style="background-color: ${item.color}; width: 20px; height: 20px; border-radius: 4px;"></div>`
            : nombreTalla
                ? `<div class="tallaPedido"><span>${nombreTalla}</span></div>`
                : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="tablePedido" style="display: flex; gap: 10px; align-items: center;">
                    <img src="${imgSrc}" height="50" width="50" alt="Producto">
                    <div class="productoDetaalle">
                        <span>${item.name}</span>
                        ${displayHtml}
                        
                    </div>
                </div>
            </td>
            <td>
                <label class="numPedido"><span>${item.count}</span></label>
            </td>
            <td><span class="totalPrecio">${total.toFixed(2)} PEN</span></td>
            <td></td>
        `;

        tbody.appendChild(row);
    }
}

async function renderClienteInfo(cliente) {
    const nombreCompleto = `${cliente.first_name} ${cliente.last_name}`;

    // Cliente
    const nombreElem = document.querySelector("#cliente-nombre");
    nombreElem.textContent = nombreCompleto;
    // Cambia el comportamiento de clic
    nombreElem.style.cursor = "pointer";
    nombreElem.removeAttribute("href");  // Remueve el mailto
    nombreElem.addEventListener("click", () => {
        window.location.href = `/dash-profileClient/${cliente.id}/`;
    });

    // Contacto
    document.querySelector("#cliente-email").textContent = cliente.email;
    document.querySelector("#cliente-email").href = `mailto:${cliente.email}`;

    document.querySelector("#cliente-telefono").textContent = formatearTelefonoPeruano(cliente.telefono);

    // Dirección
    document.querySelector("#cliente-ruc").textContent = cliente.ruc;
    document.querySelector("#cliente-direccion").textContent = cliente.direccion;
    document.querySelector("#cliente-ciudad").textContent = cliente.ciudad;
    document.querySelector("#cliente-region").textContent = cliente.region;
    document.querySelector("#cliente-codPostal").textContent = cliente.codPostal;

    // Total de pedidos
    const totalPedidos = await obtenerTotalPedidosCliente(cliente.id);

    const totalCompraElem = document.querySelector("#total-compra");
    totalCompraElem.textContent = `${totalPedidos} pedido${totalPedidos === 1 ? '' : 's'}`;
    totalCompraElem.style.cursor = "pointer"; // estilo para mostrar que se puede hacer clic
    totalCompraElem.title = "Ver pedidos del cliente"; // hint al pasar el mouse
    totalCompraElem.addEventListener("click", () => {
        window.location.href = `/dash-pedidoCliente/?id=${cliente.id}`;
    });

}


async function obtenerTotalPedidosCliente(idCliente) {
    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/orders/user/${idCliente}/`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener los pedidos del cliente.");
        }

        const pedidos = await response.json();
        return pedidos.length; // Asumiendo que la API devuelve una lista de órdenes
    } catch (error) {
        console.error("❌ Error al obtener total de pedidos del cliente:", error);
        return 0;
    }
}


function formatearTelefonoPeruano(numero) {
    const limpio = numero.replace(/\D/g, ''); // Elimina todo lo que no sea dígito
    const match = limpio.match(/^(\d{3})(\d{3})(\d{3})$/);
    if (match) {
        return `+51 ${match[1]} ${match[2]} ${match[3]}`;
    }
    return `+51 ${limpio}`; // Si no matchea, igual devuelve con +51
}

function renderResumenPago(orderData) {
    const items = orderData.items || [];

    // Calcular subtotal (suma de count * price)
    let subtotal = 0;
    let totalItems = 0;

    items.forEach(item => {
        const price = parseFloat(item.price);
        const count = parseInt(item.count);
        subtotal += price * count;
        totalItems += count;
    });

    const shippingName = orderData.shipping_name || '—';
    const shippingPrice = parseFloat(orderData.shipping_price || 0);
    const totalAmount = parseFloat(orderData.amount || 0);

    // Actualizar contenido del DOM
    document.querySelector('.cantidadArticulos').textContent = `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`;
    document.querySelector('.nombreEnvio').textContent = shippingName;
    document.querySelector('.subtotalSinDescuento').textContent = `${subtotal.toFixed(2)} PEN`;
    document.querySelector('.precioEnvio').textContent = `${shippingPrice.toFixed(2)} PEN`;
    document.querySelector('.totalGeneral').textContent = `${totalAmount.toFixed(2)} PEN`;
}

function mostrarFechaOrden(dateIssued) {
    const fechaFormateada = formatearFechaOrden(dateIssued);
    const fechaElemento = document.querySelector(".fecha-compra");
    if (fechaElemento) {
        fechaElemento.textContent = fechaFormateada;
    }
}

async function obtenerImagenProducto(productId) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/product/${productId}`);
        const data = await response.json();

        if (data.product && data.product.imagenes && data.product.imagenes.length > 0) {
            // Devolver la primera imagen
            const ruta = data.product.imagenes[0].cRutaImagen;
            return `${baseUrl}${ruta}`;
        } else {
            // Imagen por defecto si no hay imágenes
            return 'https://via.placeholder.com/50';
        }
    } catch (error) {
        console.error("❌ Error al obtener imagen del producto:", error);
        return 'https://via.placeholder.com/50';
    }
}

let mapaTallas = {};

async function cargarTallas() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const res = await fetch(`${baseUrl}/get/sizes/`);
        const data = await res.json();

        // Crea un mapa: { 1: "S", 2: "M" }
        data.results.forEach(talla => {
            mapaTallas[talla.id] = talla.cNombreTalla;
        });
    } catch (err) {
        console.error("❌ Error al cargar tallas:", err);
    }
}
function obtenerNombreTalla(talla) {
    // Si es número (ID), devolver el nombre usando el mapa
    if (!isNaN(talla)) {
        return mapaTallas[talla] || "-";
    }
    // Si ya es nombre (letra), devolver tal cual
    return talla;
}

function formatearFechaOrden(isoString) {
    const fecha = new Date(isoString);

    const opcionesFecha = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return fecha.toLocaleString('es-PE', opcionesFecha).replace(',', ' a las');
}