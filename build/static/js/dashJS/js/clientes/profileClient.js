document.addEventListener("DOMContentLoaded", () => {
    const pathActual = window.location.pathname;
    const rutaPerfil = /^\/dash-profileClient\/(\d+)\/$/;

    if (rutaPerfil.test(pathActual)) {
        detectarRutaYObtenerPerfil();
        window.addEventListener("popstate", detectarRutaYObtenerPerfil);
    } else {
        console.log("🟡 No estás en la ruta /dash-profileClient/");
    }
});

// ✅ Función para obtener el token desde localStorage
function getToken() {
    return localStorage.getItem("access_token");
}

// ✅ Función para detectar la ruta y obtener el perfil
function detectarRutaYObtenerPerfil() {
    const pathActual = window.location.pathname;
    const rutaPerfil = /^\/dash-profileClient\/(\d+)\/$/;
    const match = pathActual.match(rutaPerfil);

    if (match) {
        const idCliente = match[1];
        obtenerPerfilCliente(idCliente);
        mostrarUltimoPedido(idCliente);
        mostrarResumenCliente(idCliente) 

        const btnAllPedidos = document.querySelector("#AllPedios");
        if (btnAllPedidos) {
            btnAllPedidos.addEventListener("click", () => {
                window.location.href = `/dash-pedidoCliente/?id=${idCliente}`;
            });
        }

        // Botón "Crear pedido"
        const btnCreatePedido = document.querySelector("#createPedido");
        if (btnCreatePedido) {
            btnCreatePedido.addEventListener("click", () => {
                window.location.href = `/dash-addPedido/?id=${idCliente}`;
            });
        }

    } else {
        document.getElementById("perfil-cliente").innerHTML =
            `<p>Ruta no válida</p>`;
    }
}

// ✅ Función para obtener el perfil del cliente desde la API
async function obtenerPerfilCliente(idCliente) {
    try {
        const token = getToken();
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/actualizar-usuario/${idCliente}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const cliente = await response.json();
            console.log("✅ Datos del cliente:", cliente);
            mostrarPerfilCliente(cliente);  // 👈 Agregar esta línea para actualizar la vista
            llenarModalCliente(cliente); 
        } else {
            console.warn("🚫 Error al obtener datos:", response.status);
        }
    } catch (error) {
        console.error("🚫 Error de conexión:", error);
    }
}


function formatearTelefono(numero) {
    if (!numero) return "No disponible";

    // Asegurar que sea solo dígitos
    numero = numero.replace(/\D/g, ""); 

    // Agregar prefijo +51 si no lo tiene
    if (!numero.startsWith("51")) {
        numero = "51" + numero;
    }

    // Formatear en grupos de tres (Ej: +51 987 654 321)
    return `+${numero.slice(0, 2)} ${numero.slice(2, 5)} ${numero.slice(5, 8)} ${numero.slice(8)}`;
}

function obtenerTipoDocumento(numero) {
    if (!numero) return "No disponible"; // Si es null o vacío
    numero = numero.replace(/\D/g, ""); // Eliminar caracteres no numéricos

    // if (numero.length === 8) {
    //     return `DNI: ${numero}`;
    // } else if (numero.length === 11) {
    //     return `RUC: ${numero}`;
    // } else {
    //     return `Documento inválido: ${numero}`;
    // }
    if (numero.length === 8) {
        return `DNI: ${numero}`;
    } else if (numero.length > 8) {
        return `RUC: ${numero}`;
    }
}

function mostrarPerfilCliente(cliente) {
    // Actualizar el nombre en el título "Profile"
    const tituloPerfil = document.querySelector(".mb-3 h1.h3");
    if (tituloPerfil) {
        tituloPerfil.textContent = `${cliente.first_name} ${cliente.last_name}`.trim();
    }

    actualizarCampo("cliente-email", cliente.email);
    actualizarCampo("cliente-telefono", formatearTelefono(cliente.telefono));
    actualizarCampo("cliente-ruc", obtenerTipoDocumento(cliente.ruc));
    actualizarCampo("cliente-nombre", `${cliente.first_name} ${cliente.last_name}`.trim());

    actualizarCampo("cliente-direccion", cliente.direccion);
    actualizarCampo("cliente-ciudad", cliente.ciudad);
    actualizarCampo("cliente-region", cliente.region);
    actualizarCampo("cliente-codPostal", cliente.codPostal);

    // Cargar iconos Feather si los estás usando
    if (typeof feather !== "undefined") {
        feather.replace();
    }
}

// Función auxiliar para ocultar elementos vacíos
function actualizarCampo(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        if (valor && valor.trim() !== "") {
            elemento.textContent = valor;
            elemento.style.display = ""; // Mostrar si tiene contenido
        } else {
            elemento.style.display = "none"; // Ocultar si está vacío
        }
    }
}

function llenarModalCliente(cliente) {
    document.getElementById("nombreUpdate").value = cliente.last_name || "";
    document.getElementById("apellidoUpdate").value = cliente.first_name || "";
    document.getElementById("emailUpdate").value = cliente.email || "";
    document.getElementById("dniUpdate").value = cliente.ruc || "";
    document.getElementById("phoneUpdate").value = cliente.telefono || "";
    document.getElementById("direccionInputUpdate").value = cliente.direccion || "";
    document.getElementById("ciudadInputUpdate").value = cliente.ciudad || "";
    document.getElementById("regionInputUpdate").value = cliente.region || "";
    document.getElementById("postalInputUpdate").value = cliente.codPostal || "";
    console.log("✅ Cliente recibido en el modal:", cliente);  // Debug
    document.getElementById("editClientModal").setAttribute("data-id", cliente.id); 
}

document.getElementById("updateCliente").addEventListener("click", function () {
    const modal = document.getElementById("editClientModal");
    const idCliente = modal.getAttribute("data-id"); // Obtener el ID del cliente

    const datosActualizados = {
        last_name: document.getElementById("nombreUpdate").value.trim(),
        first_name: document.getElementById("apellidoUpdate").value.trim(),
        email: document.getElementById("emailUpdate").value.trim(),
        ruc: document.getElementById("dniUpdate").value.trim(),
        telefono: document.getElementById("phoneUpdate").value.trim(),
        direccion: document.getElementById("direccionInputUpdate").value.trim(),
        ciudad: document.getElementById("ciudadInputUpdate").value.trim(),
        region: document.getElementById("regionInputUpdate").value.trim(),
        codPostal: document.getElementById("postalInputUpdate").value.trim()
    };

    // console.log("DATOS PARA ACTUALIZAR:",datosActualizados)

    actualizarPerfilCliente(idCliente, datosActualizados);
});


async function actualizarPerfilCliente(idCliente, datosActualizados) {
    try {
        const token = getToken();

        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/actualizar-usuario/${idCliente}/`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datosActualizados)
        });

        if (response.ok) {
            const respuesta = await response.json();
            console.log("✅ Usuario actualizado:", respuesta);

            // Cerrar el modal después de actualizar
            const modal = bootstrap.Modal.getInstance(document.getElementById("editClientModal"));
            modal.hide();

            // Opcional: Mostrar una alerta de éxito
            alert("✅ Cliente actualizado correctamente");

            // Opcional: Recargar la página para ver los cambios reflejados
            location.reload();
        } else {
            console.warn("🚫 Error al actualizar:", response.status);
            alert("❌ Error al actualizar el cliente");
        }
    } catch (error) {
        console.error("🚫 Error de conexión:", error);
        alert("❌ Error de conexión con el servidor");
    }
}

async function obtenerOrdenesUsuario(userId) {
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/orders/user/${userId}/`;
    const token = getToken();

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Error al obtener los pedidos");
        return await response.json(); // Retorna los datos de las órdenes

    } catch (error) {
        console.error("Error al cargar las órdenes:", error);
        return []; // Retorna un arreglo vacío si ocurre un error
    }
}

async function mostrarUltimoPedido(userId) {
    const orders = await obtenerOrdenesUsuario(userId);

    const contenedor = document.querySelector("#ultimo-pedido");

    if (orders.length === 0) {
        contenedor.innerHTML = "<p>No hay pedidos realizados.</p>";
        return;
    }

    orders.sort((a, b) => {
        const dateA = new Date(a.items[0]?.date_added || a.date_issued);
        const dateB = new Date(b.items[0]?.date_added || b.date_issued);
        return dateB - dateA;
    });

    const pedido = orders[0];
    const item = pedido.items[0];

    const baseUrl = document.body.dataset.apiUrl;
    const productUrl = `${baseUrl}/product/${item.product}`;
    const productRes = await fetch(productUrl);
    const productData = await productRes.json();
    const imagenProducto = productData.product.imagenes[0]?.cRutaImagen || "/static/img/placeholder.png";
    const rutaImagenCompleta = `${baseUrl}${imagenProducto}`;

    let tallaMostrar = item.talla;
    if (!isNaN(item.talla)) {
        const tallaRes = await fetch(`${baseUrl}/get/sizes/`);
        const tallaData = await tallaRes.json();
        const tallaEncontrada = tallaData.results.find(t => t.id == item.talla);
        if (tallaEncontrada) {
            tallaMostrar = tallaEncontrada.cNombreTalla;
        }
    }

    const fecha = new Date(item.date_added);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fechaFormateada = `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()} a las ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;

    const total = parseFloat(pedido.amount).toFixed(2);

    const detalleExtraHTML = item.color
        ? `<div class="tallaPedido">
            <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${item.color}; border: 1px solid #000;"></span>
        </div>`
        : (tallaMostrar ? `<div class="tallaPedido"><span>${tallaMostrar}</span></div>` : "");

    const fila = `
        <tr data-product-id="${item.product}" data-talla-id="${item.talla}" data-color-hex="${item.color || ''}">
            <td>
                <div class="tablePedido" style="display: flex; gap: 10px; align-items: center;">
                    <img src="${rutaImagenCompleta}" height="50" width="50" alt="Producto">
                    <div class="detallePedido">
                        <span>${item.name}</span>
                        ${detalleExtraHTML}
                        <span class="abrirModalCodigo" data-idproducto="${item.product}" data-bs-toggle="modal" data-bs-target="#modalCode">
                            ${parseFloat(item.price).toFixed(2)} PEN
                        </span>
                    </div>
                </div>
            </td>
            <td><label class="numPedido" style="width: 70px;">${item.count}</label></td>
            <td><span class="totalPrecio">${(parseFloat(item.price) * item.count).toFixed(2)} PEN</span></td>
        </tr>
    `;

    const contenidoPedidoHTML = `
        <div class="card-header">
            <h5 class="card-title mb-0 pedidoH5">Último pedido realizado</h5>
        </div>
        <div class="card-body totalCompra">
            <div class="detallePrepare">
                <span>${fechaFormateada}</span>
                <span>${total} PEN</span>
            </div>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th style="color: #0008; font-weight: bold;">Producto</th>
                    <th style="color: #0008; font-weight: bold;">Cantidad</th>
                    <th style="color: #0008; font-weight: bold;">Total</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${fila}
            </tbody>
        </table>
    `;

    contenedor.innerHTML = contenidoPedidoHTML;
}

async function mostrarResumenCliente(userId) {
    const orders = await obtenerOrdenesUsuario(userId);
    const contenedor = document.querySelector("#resumen-cliente");

    if (orders.length === 0) {
        contenedor.innerHTML = "<p>No hay pedidos realizados.</p>";
        return;
    }

    const cantidadGastada = orders.reduce((total, order) => total + parseFloat(order.amount), 0).toFixed(2);
    const totalPedidos = orders.length;

    // Generar HTML dinámico
    const contenidoResumenHTML = `
        <div class="card mb-3">
            <div class="detalleOrder">
                <div class="detalleItem">
                    <span class="titleorder">Cantidad Gastada</span>
                    <span id="totalGasto">${cantidadGastada} PEN</span>
                </div>
                <div class="detalleItem pedidoTotal" id="verPedidos">
                    <span class="titleorder">Pedidos</span>
                    <span id="totalCompra">${totalPedidos}</span>
                </div>
                <div class="detalleItem">
                    <span class="titleorder">Cliente desde</span>
                    <span>6 días</span>
                </div>
            </div>
        </div>
    `;

    contenedor.innerHTML = contenidoResumenHTML;

    // ⏬ Evento click para ir a /dash-pedidoCliente/?id=...
    const totalCompraElem = document.querySelector("#verPedidos");
    totalCompraElem.style.cursor = "pointer";
    totalCompraElem.addEventListener("click", () => {
        window.location.href = `/dash-pedidoCliente/?id=${userId}`;
    });
}


async function getNombreTallaPorId(id) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/sizes/`);
        if (!response.ok) throw new Error("Error al obtener tallas");

        const data = await response.json();
        const talla = data.results.find(t => t.id === parseInt(id));
        return talla ? talla.cNombreTalla : "";
    } catch (error) {
        console.error("Error al obtener nombre de talla:", error);
        return "";
    }
}
// // Ejemplo de actualización
// const nuevosDatos = {
//     first_name: "Juan",
//     last_name: "Pérez",
//     email: "juan.perez@correo.com",
//     telefono: "987654321",
//     direccion: "Av. Principal 123",
//     ruc: "123456789",
//     ciudad: "Lima",
//     region: "Lima",
//     codPostal: "15001",
// };

// actualizarPerfilCliente(1, nuevosDatos);
