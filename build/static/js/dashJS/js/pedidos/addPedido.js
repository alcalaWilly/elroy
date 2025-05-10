let loadTimeout = null;
let previousPath = window.location.pathname;

// Función para manejar la ruta "/dash-addPedido"
function handleDashAddPedido() {
    const currentPath = window.location.pathname;

    if (currentPath.includes("dash-addPedido")) {
        console.log("✅ Estamos en la ruta /dash-addPedido");
        setupLetraInput();
        setupModalLetraInput();
        actualizarResumenPedido();

        const urlParams = new URLSearchParams(window.location.search);
        const clienteId = urlParams.get("id");

        if (clienteId) {
            cargarClientePorId(clienteId);
        }
    }
}



document.getElementById('clientePedido').addEventListener('input', async (e) => {
    const valor = e.target.value.trim();

    const token = getToken();

    // Verifica si hay algo escrito antes de hacer la búsqueda
    if (valor.length === 0) return;

    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/api/clientes/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener clientes");
        }

        const data = await response.json(); // Lista completa de clientes

        const datalist = document.getElementById("listaClientes");
        datalist.innerHTML = ""; // Limpiar anteriores

        // Filtrar clientes localmente basándonos en el texto ingresado
        const clientesFiltrados = data.filter(cliente =>
            // Buscar en el nombre y apellido
            `${cliente.first_name} ${cliente.last_name}`.toLowerCase().includes(valor.toLowerCase())
        );

        // Agregar los resultados al datalist
        clientesFiltrados.forEach(cliente => {
            const option = document.createElement("option");
            option.value = `${cliente.first_name} ${cliente.last_name}`;
            option.setAttribute("data-id", cliente.id); // Guardamos el ID como un atributo
            datalist.appendChild(option);
        });

    } catch (error) {
        console.error("Error en autocompletado:", error);
    }
});

document.getElementById('clientePedido').addEventListener('change', async (e) => {
    const clienteNombre = e.target.value;
    const clienteOption = Array.from(document.getElementById("listaClientes").options).find(option => option.value === clienteNombre);

    if (clienteOption) {
        const clienteId = clienteOption.getAttribute("data-id");
        await cargarClientePorId(clienteId);
    }
});


async function cargarClientePorId(clienteId) {
    document.getElementById("cliente-id-hidden").value = clienteId;

    const token = getToken();
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/actualizar-usuario/${clienteId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener los detalles del cliente");
        }

        const cliente = await response.json();

        document.getElementById("clientePedido").value = `${cliente.first_name} ${cliente.last_name}`;

        const detalleClienteHTML = `
            <div class="card-body">
                <h5 class="h6 card-title clienteDate">Información del contacto</h5>
                <ul class="list-unstyled mb-0">
                    <li class="mb-1 d-flex align-items-center">
                        <span data-feather="mail" class="feather-sm me-2 text-primary"></span>
                        <a href="mailto:${cliente.email}" id="cliente-email" class="fw-bold text-blue">${cliente.email}</a>
                    </li>
                    <li class="mb-1"><span data-feather="phone" class="feather-sm me-1"></span> <span id="cliente-telefono">${cliente.telefono}</span></li>
                    <li class="mb-1"><span data-feather="user" class="feather-sm me-1"></span> <span id="cliente-nombre">${cliente.first_name} ${cliente.last_name}</span></li>
                </ul>
            </div>
            <div class="card-body">
                <h5 class="h6 card-title clienteDate">Dirección predeterminada</h5>
                <ul class="list-unstyled mb-0">
                    <li class="mb-1"><span data-feather="id-card" class="feather-sm me-1"></span> <span id="cliente-ruc">${cliente.ruc}</span></li>
                    <li class="mb-1"><span data-feather="map-pin" class="feather-sm me-1"></span> <span id="cliente-direccion">${cliente.direccion}</span></li>
                    <li class="mb-1"><span data-feather="map" class="feather-sm me-1"></span> <span id="cliente-ciudad">${cliente.ciudad}</span></li>
                    <li class="mb-1"><span data-feather="globe" class="feather-sm me-1"></span> <span id="cliente-region">${cliente.region}</span></li>
                    <li class="mb-1"><span data-feather="mail" class="feather-sm me-1"></span> <span id="cliente-codPostal">${cliente.codPostal}</span></li>
                </ul>
            </div>
        `;

        document.getElementById('detalleClientePedido').innerHTML = detalleClienteHTML;

    } catch (error) {
        console.error("Error al obtener los detalles del cliente:", error);
    }
}


let modal; // Instancia global del modal

// Función para abrir el modal solo si no está abierto
function openProductModalOnce() {
    if (!modal) {
        modal = new bootstrap.Modal(document.getElementById('productoModal'));

        // 💥 Una sola vez, cuando el modal ya se muestra:
        document.getElementById('productoModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('buscadorEnModal').focus();
        });
    }

    if (!modal._isShown) {
        modal.show();
    }
}

// PARA DESCEUNTOOOOS //////////////////
let codigoDescuentoIngresado = "";

function calcularPrecioConDescuento(producto) {
    const precioBase = parseFloat(producto.price);
    const promociones = producto.promotions || [];

    if (promociones.length === 0) {
        return precioBase.toFixed(2);
    }

    const promo = promociones.find(p => p.active);
    if (!promo) {
        return precioBase.toFixed(2);
    }

    const tieneCodigo = promo.code && promo.code.trim() !== "";

    // Si la promo tiene código
    if (tieneCodigo) {
        // Solo aplicar si el código ingresado coincide
        if (promo.code.trim().toLowerCase() === codigoDescuentoIngresado.trim().toLowerCase()) {
            const descuento = parseFloat(promo.discount_percentage);

            if (promo.money) {
                const precioFinal = precioBase - descuento;
                return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
            } else {
                const precioFinal = precioBase * (1 - descuento / 100);
                return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
            }
        } else {
            return precioBase.toFixed(2); // Código incorrecto, no se aplica
        }
    }

    // Si no tiene código, aplicar directamente
    const descuento = parseFloat(promo.discount_percentage);
    if (promo.money) {
        const precioFinal = precioBase - descuento;
        return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
    } else {
        const precioFinal = precioBase * (1 - descuento / 100);
        return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
    }
}

async function fetchProductsBySearchQuery(query) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get-products/`);
        const data = await response.json();

        // Filtramos los productos que contienen el texto ingresado en cualquier parte del nombre
        const filteredProducts = data.products.filter(product =>
            product.name.toUpperCase().includes(query.toUpperCase())
        );

        return filteredProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

const selectedItems = {};

function renderProductsInModal(products) {
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = ""; // Limpiar el contenido anterior

    if (products.length === 0) {
        modalContent.innerHTML = "<p>No se encontraron productos.</p>";
        return;
    }

    products.forEach((product) => {
        const productRow = document.createElement("div");
        productRow.classList.add("d-flex", "align-items-start", "product-row");

        const productDetails = document.createElement("div");
        productDetails.classList.add("flex-grow-1");

        const image = product.imagenes[0]?.cRutaImagen || "/default-image.jpg";
        const imageHTML = `<img src="${image}" width="50" height="50" alt="${product.name}">`;

        const productName = `<span>${product.name}</span>`;
        const productCheckboxId = `product-${product.id}`;
        const productCheckbox = `<input class="inputPedido" type="checkbox" id="${productCheckboxId}" />`;

        let optionHTML = "";

        // Si tiene tallas, se muestran
        if (product.tallas.length > 0) {
            product.tallas.forEach((talla) => {
                const tallaId = `talla-${product.id}-${talla.id}`;
                optionHTML += `
                    <div class="d-flex align-items-start tallaColorPedido selectPedido">
                        <div class="flex-grow-1 d-flex justify-content-between">
                            <!-- Inicio -->
                            <div class="d-flex align-items-center">
                                <input class="inputPedido" type="checkbox" name="talla-${product.id}-${talla.id}" id="${tallaId}" />
                                <span class="ms-2">${talla.talla.cNombreTalla}</span>
                            </div>
                            <!-- Centro -->
                            <div class="d-flex align-items-center">
                                <span>${talla.stock} disponibles</span>
                            </div>
                            <!-- Final -->
                            <div class="d-flex align-items-center">
                                <span>${product.price} PEN</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Si no hay tallas pero sí colores
        else if (product.colores && product.colores.length > 0) {
            product.colores.forEach((colorObj, index) => {
                const colorId = `color-${product.id}-${index}`;
                optionHTML += `
                    <div class="d-flex align-items-start tallaColorPedido selectPedido">
                        <div class="flex-grow-1 d-flex justify-content-between">
                            <!-- Inicio -->
                            <div class="d-flex align-items-center">
                                <input class="inputPedido" type="checkbox" name="color-${product.id}-${index}" id="${colorId}" data-color="${colorObj.color}" />
                                <div style="width: 20px; height: 20px; background-color: ${colorObj.color}; border: 1px solid #000; margin-left: 8px; border-radius: 3px;"></div>
                                <span class="ms-2 text-muted d-none color-code" id="colorCode-${product.id}-${index}">${colorObj.color}</span>
                            </div>
                            <!-- Centro -->
                            <div class="d-flex align-items-center">
                                <span>${colorObj.stock} disponibles</span>
                            </div>
                            <!-- Final -->
                            <div class="d-flex align-items-center">
                                <span>${product.price} PEN</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Agrega el HTML al contenedor de detalles
        productDetails.innerHTML = `
            <div class="productoPedido selectPedido mb-2">
                ${productCheckbox} ${imageHTML} ${productName}
            </div>
            ${optionHTML}
        `;

        // Agrega los elementos al DOM
        productRow.appendChild(productDetails);
        modalContent.appendChild(productRow);

        // Eventos
        const productCheckboxElement = productDetails.querySelector(`#${productCheckboxId}`);

        // Selecciona todos los checkboxes excepto el principal, incluyendo anidados
        const optionCheckboxElements = productDetails.querySelectorAll(`input[type="checkbox"]`);
        const filteredOptionCheckboxes = Array.from(optionCheckboxElements).filter(cb => cb.id !== productCheckboxId);

        // Checkbox principal (producto completo)
        productCheckboxElement.addEventListener("change", () => {
            // Marca o desmarca todos los checkboxes de tallas/colores
            optionCheckboxElements.forEach(checkbox => {
                checkbox.checked = productCheckboxElement.checked;
                checkbox.dispatchEvent(new Event("change")); // esto invoca a logSelection(product, checkbox)
            });

            // Solo inicializamos si no existe
            selectedItems[product.id] = selectedItems[product.id] || { name: product.name, tallas: [], colores: [], selected: false };

            // Ya no marcamos el producto como seleccionado
            if (!productCheckboxElement.checked) {
                // Si se desmarca, vaciamos
                selectedItems[product.id].tallas = [];
                selectedItems[product.id].colores = [];
                selectedItems[product.id].selected = false;

                // Si ya no hay ningún item seleccionado, eliminamos el producto del objeto
                const hasSelection = selectedItems[product.id].tallas.length > 0 || selectedItems[product.id].colores.length > 0;
                if (!hasSelection) {
                    delete selectedItems[product.id];
                }
            }

            logSelection(product, null); // actualizar estado del botón
        });

        // Checkbox de talla o color
        filteredOptionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                updateProductCheckboxState(productDetails, productCheckboxElement);
                logSelection(product, checkbox); // esto también debería revisar si se debe ocultar el botón

                // Mostrar código de color
                if (checkbox.name.startsWith("color")) {
                    const colorCodeSpan = document.getElementById("colorCode-" + checkbox.id.split("-").slice(1).join("-"));
                    if (colorCodeSpan) {
                        colorCodeSpan.classList.toggle("d-none", !checkbox.checked);
                    }
                }
            });
        });

        // Clic en cualquier parte del contenedor para seleccionar checkbox
        const selectableDivs = productDetails.querySelectorAll('.selectPedido');
        selectableDivs.forEach(div => {
            div.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() !== 'input') {
                    const checkbox = div.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event("change"));
                    }
                }
            });
        });

    });

    function updateProductCheckboxState(productDetails, productCheckboxElement) {
        const optionCheckboxes = productDetails.querySelectorAll('input[type="checkbox"]:not(#' + productCheckboxElement.id + ')');
        const checkedCount = [...optionCheckboxes].filter(cb => cb.checked).length;

        if (checkedCount === 0) {
            productCheckboxElement.checked = false;
            productCheckboxElement.indeterminate = false;
        } else if (checkedCount === optionCheckboxes.length) {
            productCheckboxElement.checked = true;
            productCheckboxElement.indeterminate = false;
        } else {
            productCheckboxElement.checked = false;
            productCheckboxElement.indeterminate = true;
        }
    }
}


function updateVerSeleccionButton() {
    const existingBtn = document.getElementById("verSeleccionBtn");
    const modalContent = document.getElementById("modalContent");

    const haySeleccion = Object.values(selectedItems).some(item =>
        item.tallas.length > 0 || item.colores.length > 0
    );

    if (haySeleccion && !existingBtn) {
        const button = document.createElement("button");
        button.id = "verSeleccionBtn";
        button.className = "btn btn-primary mt-3";
        button.textContent = "Ver selección";

        button.addEventListener("click", () => {
            const seleccionFinal = [];

            Object.entries(selectedItems).forEach(([productId, data]) => {
                const idProducto = productId;

                if (data.selected && data.tallas.length === 0 && data.colores.length === 0) {
                    seleccionFinal.push({ idProducto, talla: null, color: null });
                }

                data.tallas.forEach(tallaId => {
                    const parts = tallaId.split("-");
                    const idTalla = parts[2];
                    seleccionFinal.push({ idProducto, talla: idTalla, color: null });
                });

                data.colores.forEach(colorData => {
                    seleccionFinal.push({ idProducto, talla: null, color: colorData.color });
                });
            });

            console.log("=== ARRAY DE SELECCIÓN FINAL ===");
            console.log(seleccionFinal);

            // 💥 Agregá esto:
            seleccionActual = [...seleccionFinal];

            if (modal) {
                modal.hide();
                renderTablaPedido(); // Ahora sí con los datos actualizados
            }
        });


        modalContent.appendChild(button);
    } else if (!haySeleccion && existingBtn) {
        existingBtn.remove();
    }
}

function agregarListenerCantidad(input, precioUnitario, totalSpan) {
    input.addEventListener("input", () => {
        let cantidad = parseInt(input.value);
        if (isNaN(cantidad) || cantidad < 1) {
            cantidad = 1;
            input.value = 1;
        }

        const nuevoTotal = (cantidad * precioUnitario).toFixed(2);
        totalSpan.textContent = `${nuevoTotal} PEN`;

        actualizarResumenPedido();
    });
}

let seleccionActual = []; // Variable global para mantener la selección
let idProductoSeleccionado = null; // 👈 Declaración global

async function renderTablaPedido() {
    const tablaContainer = document.getElementById("tablaContainer");
    tablaContainer.innerHTML = "";

    document.getElementById("buscarLetraProducto").value = "";

    if (seleccionActual.length === 0) return;

    const table = document.createElement("table");
    table.className = "table";

    table.innerHTML = `
        <thead>
            <tr>
                <th style="color: #0008; font-weight: bold;" scope="col">Producto</th>
                <th style="color: #0008; font-weight: bold;" scope="col">Cantidad</th>
                <th style="color: #0008; font-weight: bold;" scope="col">Total</th>
                <th></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    for (let i = 0; i < seleccionActual.length; i++) {
        const item = seleccionActual[i];

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/product/${item.idProducto}`);
            const data = await response.json();

            const producto = data.product;
            const talla = item.talla;
            const color = item.color;
            const nombre = producto.name;
            const precio = calcularPrecioConDescuento(producto);
            const precioUnitario = parseFloat(precio);

            const imagenUrl = producto.imagenes.length > 0
                ? producto.imagenes[0].cRutaImagen
                : "https://via.placeholder.com/50";

            let tallaHtml = "";
            let tallaIdReal = "";
            if (talla) {
                const tallaObj = data.tallas.find(t => t.id == talla);
                // tallaHtml = `<div class="tallaPedido"><span>${tallaObj.talla.cNombreTalla}</span></div>`;
                if (tallaObj) {
                    tallaIdReal = tallaObj.talla.id;
                    tallaHtml = `<div class="tallaPedido"><span>${tallaObj.talla.cNombreTalla}</span></div>`;
                }
            }

            let colorHtml = "";
            if (color) {
                colorHtml = `
                    <div class="tallaPedido">
                        <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${color}; border: 1px solid #000;"></span>
                    </div>
                `;
            }

            const row = document.createElement("tr");
            row.dataset.productId = item.idProducto;
            row.dataset.tallaId = tallaIdReal ? tallaIdReal : "";  // ← ahora es el ID correcto
            row.dataset.colorHex = color ? color : ""; // Aquí guardas el color en formato HEX
            row.innerHTML = `
                <td>
                    <div class="tablePedido" style="display: flex; gap: 10px; align-items: center;">
                        <img src="${imagenUrl}" height="50" width="50" alt="">
                        <div class="detallePedido">
                            <span>${nombre}</span>
                            ${tallaHtml}
                            ${colorHtml}
                            <span>
                            <a href="#" class="abrirModalCodigo" data-idproducto="${item.idProducto}" data-bs-toggle="modal" data-bs-target="#modalCode">${precio} PEN</a>

                            </span>
                        </div>
                    </div>
                </td>
                <td>
                    <input class="numPedido" type="number" min="1" value="1" style="width: 70px;">
                </td>
                <td><span class="totalPrecio">${precio} PEN</span></td>
                <td>
                    <button class="btn btn-danger btn-sm btnEliminarFila" data-index="${i}">X</button>
                </td>
            `;

            tbody.appendChild(row);

            // Añadir funcionalidad de cantidad
            const inputCantidad = row.querySelector(".numPedido");
            const spanTotal = row.querySelector(".totalPrecio");
            agregarListenerCantidad(inputCantidad, precioUnitario, spanTotal);

        } catch (error) {
            console.error("Error cargando producto:", item.idProducto, error);
        }
    }

    tablaContainer.appendChild(table);
    tablaContainer.querySelectorAll(".abrirModalCodigo").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            idProductoSeleccionado = e.target.getAttribute("data-idproducto");
            console.log("Producto seleccionado para aplicar código:", idProductoSeleccionado);
        });
    });

    // Escuchar clic en botón aplicar código
    document.getElementById("btnAplicarCodigo").addEventListener("click", () => {
        const codigo = document.getElementById("inputCodigoDescuento").value.trim();

        if (!idProductoSeleccionado) {
            alert("No se ha seleccionado ningún producto");
            return;
        }

        aplicarCodigoADomProducto(idProductoSeleccionado, codigo);

    });


    actualizarResumenPedido();
    // Listeners para eliminar fila
    tablaContainer.querySelectorAll(".btnEliminarFila").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.getAttribute("data-index"));
            const item = seleccionActual[index];

            seleccionActual.splice(index, 1);

            const id = item.idProducto;
            const talla = item.talla;
            const color = item.color;

            if (selectedItems[id]) {
                if (!talla && !color) {
                    selectedItems[id].selected = false;
                }

                if (talla) {
                    selectedItems[id].tallas = selectedItems[id].tallas.filter(t => {
                        const parts = t.split("-");
                        return parts[2] !== talla;
                    });
                }

                if (color) {
                    selectedItems[id].colores = selectedItems[id].colores.filter(c => c.color !== color);
                }
            }

            renderTablaPedido();
            if (seleccionActual.length === 0) {
                precioEnvioSeleccionado = 0;
                nombreEnvioSeleccionado = "Sin envío";
            }
            actualizarResumenPedido();
            updateVerSeleccionButton();
        });
    });
}


async function aplicarCodigoADomProducto(idProducto, codigo) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/product/${idProducto}`);
        const data = await response.json();
        const producto = data.product;

        // Obtener el nuevo precio con descuento
        const nuevoPrecio = calcularPrecioConDescuentoConCodigo(producto, codigo);

        // Si el precio no cambió (significa que el código es incorrecto), mostrar el mensaje de error y no actualizar el precio
        if (nuevoPrecio === producto.price) {
            Swal.fire({
                icon: 'error',
                title: '¡Código incorrecto!',
                showConfirmButton: false,
                timer: 2000 // Desaparece después de 2 segundos
            });
            // Cerrar el modal después de mostrar la alerta de error
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalCode"));
            if (modal) modal.hide();
            return; // Salir de la función sin aplicar el descuento
        }

        // Si el precio ha cambiado, actualizar la tabla con el nuevo precio
        const filas = document.querySelectorAll("tr");
        filas.forEach(fila => {
            const link = fila.querySelector(".abrirModalCodigo");
            if (link && link.getAttribute("data-idproducto") === idProducto) {
                const precioSpan = fila.querySelector(".totalPrecio");
                if (precioSpan) {
                    precioSpan.textContent = `${nuevoPrecio} PEN`;
                }
            }
        });

        // Mostrar alerta de éxito solo si el código es correcto
        Swal.fire({
            icon: 'success',
            title: '¡Código correcto, descuento aplicado!',
            showConfirmButton: false,
            timer: 2000 // Desaparece después de 2 segundos
        });

        // Actualizar el resumen del pedido
        actualizarResumenPedido();

    } catch (error) {
        console.error("Error al aplicar el código:", error);
    }

    // Cerrar el modal independientemente del resultado
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalCode"));
    if (modal) modal.hide();
}


function calcularPrecioConDescuentoConCodigo(producto, codigo) {
    const precioBase = parseFloat(producto.price);
    const promociones = producto.promotions || [];

    // Si no tiene promociones, retornar el precio base
    if (promociones.length === 0) return precioBase.toFixed(2);

    // Buscar la promoción activa
    const promo = promociones.find(p => p.active);
    if (!promo) return precioBase.toFixed(2);

    const tieneCodigo = promo.code && promo.code.trim() !== "";

    // Si tiene código, verificar si coincide con el ingresado
    if (tieneCodigo) {
        if (promo.code.trim().toLowerCase() === codigo.trim().toLowerCase()) {
            const descuento = parseFloat(promo.discount_percentage || 0);
            const precioFinal = promo.money
                ? precioBase - descuento
                : precioBase * (1 - descuento / 100);

            return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
        } else {
            // Si el código es incorrecto, mostrar un mensaje de error
            Swal.fire({
                icon: 'error',
                title: '¡Código incorrecto!',
                showConfirmButton: false,
                timer: 2000 // Desaparece después de 2 segundos
            });

            return precioBase.toFixed(2); // Retornar precio sin descuento
        }
    }

    // Si no tiene código, aplicar el descuento directamente
    const descuento = parseFloat(promo.discount_percentage || 0);
    const precioFinal = promo.money
        ? precioBase - descuento
        : precioBase * (1 - descuento / 100);
    return (precioFinal > 0 ? precioFinal : 0).toFixed(2);
}

function logSelection(product, checkbox) {
    const productId = product.id;

    // Solo inicializar si no existe aún
    if (!selectedItems[productId]) {
        selectedItems[productId] = {
            name: product.name,
            tallas: [],
            colores: []
        };
    }

    if (checkbox) {
        if (checkbox.name.startsWith("talla")) {
            if (checkbox.checked) {
                if (!selectedItems[productId].tallas.includes(checkbox.id)) {
                    selectedItems[productId].tallas.push(checkbox.id);
                }
            } else {
                selectedItems[productId].tallas = selectedItems[productId].tallas.filter(id => id !== checkbox.id);
            }
        } else if (checkbox.name.startsWith("color")) {
            const colorCode = checkbox.getAttribute("data-color");
            if (checkbox.checked) {
                if (!selectedItems[productId].colores.some(c => c.id === checkbox.id)) {
                    selectedItems[productId].colores.push({ id: checkbox.id, color: colorCode });
                }
            } else {
                selectedItems[productId].colores = selectedItems[productId].colores.filter(c => c.id !== checkbox.id);
            }
        }
    }

    // Limpiar si está vacío
    const hasTallas = selectedItems[productId].tallas.length > 0;
    const hasColores = selectedItems[productId].colores.length > 0;

    if (!hasTallas && !hasColores) {
        delete selectedItems[productId];
    }

    updateVerSeleccionButton();
}


// Función para inicializar el evento de ingreso de texto en el input fuera del modal
function setupLetraInput() {
    const inputLetra = document.getElementById("buscarLetraProducto");
    const buscadorModal = document.getElementById("buscadorEnModal");
    const modalContent = document.getElementById("modalContent");

    if (inputLetra) {
        inputLetra.addEventListener("input", async () => {
            const query = inputLetra.value.trim(); // Obtener el texto ingresado
            console.log("Texto ingresado en input de la página:", query); // Verificar lo que el usuario ingresa

            // Actualizar el campo de búsqueda en el modal
            buscadorModal.value = query;

            if (query.length > 0) {
                // Obtener productos de la API filtrados por el texto
                const products = await fetchProductsBySearchQuery(query);

                // Renderizar los productos en el modal
                renderProductsInModal(products);

                // Abrir el modal solo si aún no está abierto
                openProductModalOnce();
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}

// Función para inicializar el evento de ingreso de texto en el input dentro del modal
function setupModalLetraInput() {
    const inputModalLetra = document.getElementById("buscadorEnModal");
    const modalContent = document.getElementById("modalContent");

    if (inputModalLetra) {
        inputModalLetra.addEventListener("input", async () => {
            const query = inputModalLetra.value.trim(); // Obtener el texto ingresado
            console.log("Texto ingresado en el modal:", query); // Verificar lo que el usuario ingresa

            if (query.length > 0) {
                // Obtener productos de la API filtrados por el texto
                const products = await fetchProductsBySearchQuery(query);

                // Renderizar los productos en el modal
                renderProductsInModal(products);
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}


function getToken() {
    return localStorage.getItem("access_token");
}

function actualizarResumenPedido() {
    const resumen = {
        cantidadTotal: 0,
        subtotal: 0,
        totalConDescuento: 0
    };

    const filas = document.querySelectorAll("tbody tr");

    filas.forEach(fila => {
        const inputCantidad = fila.querySelector(".numPedido");
        const spanTotal = fila.querySelector(".totalPrecio");

        const cantidad = parseInt(inputCantidad.value);
        const total = parseFloat(spanTotal.textContent.replace(" PEN", ""));

        resumen.cantidadTotal += cantidad;
        resumen.totalConDescuento += total;
    });

    resumen.subtotal = resumen.totalConDescuento;

    // Actualizar el DOM
    document.querySelector(".cantidadArticulos").textContent = `${resumen.cantidadTotal} artículo${resumen.cantidadTotal !== 1 ? "s" : ""}`;
    document.querySelector(".subtotalSinDescuento").textContent = `${resumen.subtotal.toFixed(2)} PEN`;
    document.querySelector(".precioEnvio").textContent = `${precioEnvioSeleccionado.toFixed(2)} PEN`;
    // document.getElementById("time_to_delivery").value = tiempoEntrega;
    document.querySelector(".nombreEnvio").textContent = nombreEnvioSeleccionado;
    document.querySelector(".totalGeneral").textContent = `${(resumen.totalConDescuento + precioEnvioSeleccionado).toFixed(2)} PEN`;
}


document.getElementById("btnAplicarEnvio").addEventListener("click", function () {
    const select = document.getElementById("tipoEnvio");
    const selectedOption = select.options[select.selectedIndex];
    const tiempoEntrega = selectedOption.dataset.time || ""; // puede ser vacío si no seleccionó nada
    document.getElementById("time_to_delivery").value = tiempoEntrega;

    if (select.value) {
        const regexPrecio = /(\d+(?:[.,]\d+)?) PEN/;
        const match = selectedOption.textContent.match(regexPrecio);

        if (match) {
            precioEnvioSeleccionado = parseFloat(match[1].replace(",", "."));
            nombreEnvioSeleccionado = selectedOption.textContent.replace(regexPrecio, "").trim();
        } else {
            precioEnvioSeleccionado = 0;
            nombreEnvioSeleccionado = "Sin envío";
        }
    } else {
        precioEnvioSeleccionado = 0;
        nombreEnvioSeleccionado = "Sin envío";
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEnvio"));
    modal.hide();

    actualizarResumenPedido();
});



document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#abrirModalEnvio").addEventListener("click", function (e) {
        e.preventDefault();

        if (seleccionActual.length > 0) {
            const modalEnvio = new bootstrap.Modal(document.getElementById("modalEnvio"));
            modalEnvio.show();
            cargarOpcionesEnvio();
        } else {
            console.log("No hay productos seleccionados");
        }
    });
});

let precioEnvioSeleccionado = 0;
let nombreEnvioSeleccionado = "Sin envío";

async function cargarOpcionesEnvio() {
    try {
        const token = getToken(); // Asumiendo que tienes una función `getToken` para obtener el token de autenticación
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/api/shipping`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        const selectEnvio = document.getElementById("tipoEnvio");

        // Limpiar las opciones previas
        selectEnvio.innerHTML = "";

        // Añadir una opción por defecto
        const opcionDefault = document.createElement("option");
        opcionDefault.value = "";
        opcionDefault.textContent = "Seleccionar tipo de envío";
        selectEnvio.appendChild(opcionDefault);

        // Añadir las opciones de la API al select
        // data.results.forEach(envio => {
        //     const option = document.createElement("option");
        //     option.value = envio.id;
        //     option.textContent = `${envio.name} - ${envio.time_to_delivery} - ${envio.price} PEN`;
        //     selectEnvio.appendChild(option);
        // });
        data.results.forEach(envio => {
            const option = document.createElement("option");
            option.value = envio.id;
            option.textContent = `${envio.name} - ${envio.time_to_delivery} - ${envio.price} PEN`;
            option.dataset.time = envio.time_to_delivery; // <<<<<< aquí se guarda el time_to_delivery
            selectEnvio.appendChild(option);
        });


    } catch (error) {
        console.error("Error al cargar opciones de envío:", error);
    }
}

document.getElementById("pagarProducto").addEventListener("click", async () => {
    const userId = parseInt(document.getElementById("cliente-id-hidden")?.value || "0");
    const time_to_delivery = document.getElementById("time_to_delivery")?.value || "0";
    if (!userId) {
        alert("Por favor, selecciona un cliente válido antes de continuar.");
        return;
    }

    // Detalle de productos
    const productos = [];
    const filas = document.querySelectorAll("tbody tr");


    const clienteData = {
                full_name: document.getElementById("cliente-nombre")?.textContent || "",
                email: document.getElementById("cliente-email")?.textContent || "",
                telephone_number: document.getElementById("cliente-telefono")?.textContent || "",
                ruc: document.getElementById("cliente-ruc")?.textContent || "",
                address_line_1: document.getElementById("cliente-direccion")?.textContent || "",
                address_line_2: "",
                city: document.getElementById("cliente-ciudad")?.textContent || "",
                state_province_region: document.getElementById("cliente-region")?.textContent || "",
                postal_zip_code: document.getElementById("cliente-codPostal")?.textContent || "",
                country_region: "Perú"
            };

    for (const fila of filas) {
        const productId = parseInt(fila.dataset.productId || "0");
        const talla = fila.dataset.tallaId || null;
        const color = fila.dataset.colorHex || null;
        const cantidad = parseInt(fila.querySelector(".numPedido")?.value || "0");

        if (!productId || cantidad <= 0) continue;

        productos.push({
            product: productId,
            count: cantidad,
            ...(talla ? { talla: parseInt(talla) } : {}),
            ...(color ? { color: color } : {})
        });
    }

    if (productos.length === 0) {
        alert("No hay productos válidos en el carrito.");
        return;
    }

    const shipping_price = parseFloat(document.querySelector(".precioEnvio")?.textContent || "0");
    const shipping_name = document.querySelector(".nombreEnvio")?.textContent || "Normal";
    const totalGeneral = parseFloat(document.querySelector(".totalGeneral")?.textContent || "0");

    const resumen = {
        user: userId,
        full_name: clienteData.full_name,
        transaction_id: "TX" + Date.now(),
        amount: totalGeneral,
        address_line_1: document.getElementById("cliente-direccion")?.textContent || "",
        address_line_2: "",
        city: document.getElementById("cliente-ciudad")?.textContent || "",
        state_province_region: document.getElementById("cliente-region")?.textContent || "",
        postal_zip_code: document.getElementById("cliente-codPostal")?.textContent || "",
        country_region: document.getElementById("cliente-region")?.textContent || "",
        telephone_number: document.getElementById("cliente-telefono")?.textContent || "",
        shipping_name: shipping_name,
        shipping_time: time_to_delivery,
        shipping_price: shipping_price,
        date_issued: new Date().toISOString(),
        items: productos
    };

    console.log("Resumen del pedido ordenado:", resumen);
    const token = getToken();
    
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/api/orders/create-order/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resumen)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error al crear la orden:", data);
            alert(data.error || "Error al procesar la orden.");
            return;
        }

        console.log("Orden creada exitosamente:", data);
        alert("¡Orden creada con éxito!");

        // Opcional: Redirigir o limpiar formulario
        // window.location.href = "/ordenes";
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error inesperado.");
    }
});


const pathObserver = new MutationObserver(() => {
    // Comprobar si la ruta ha cambiado
    if (window.location.pathname !== previousPath) {
        previousPath = window.location.pathname;
        handleDashAddPedido();

    }
});

// Ejecutar cuando el documento haya cargado completamente
document.addEventListener("DOMContentLoaded", () => {
    handleDashAddPedido(); // Verificar la ruta al cargar
    pathObserver.observe(document.body, { childList: true, subtree: true }); // Iniciar observador de cambios
});
