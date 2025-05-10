
document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    if (path === "/dash-updateDescuento/") {
        await detectarYObtenerDescuento();  // <-- Importante el await
        buscarProductsUpdate();

    } else {
        console.log("🟡 No estás en /dash-updateDescuento/");
    }
});

async function detectarYObtenerDescuento() {
    const params = new URLSearchParams(window.location.search);
    const descuentoId = params.get("id");

    if (!descuentoId) {
        console.warn("🚫 No se pudo obtener el ID del DESCUENTO desde la URL.");
        return;
    }

    const descuentoIdNumerico = Number(descuentoId);
    const detalle = await obtenerDetalleDescuento(descuentoIdNumerico);
    console.log("✅ Detalle del descuento:", detalle);

    renderInputDescuento(detalle);  // ⬅️ nueva función modular
    renderTipoDescuento(detalle);
    renderRequisitos(detalle);
    renderFechas(detalle);
    actualizarResumenDescuento();


    if (detalle && detalle.product_ids) {
        seleccionActualDes = detalle.product_ids.map(id => ({
            idProducto: id,
            nombre: ""  // Se llenará luego
        }));

        detalle.product_ids.forEach(id => {
            selectedItemsDes[id] = true;
        });

        await renderTablaDesView();  // ⬅️ ya estaba modularizada, puedes mantenerla así
    } else {
        console.warn("🚫 No se encontraron product_ids en el detalle.");
    }
}


function renderInputDescuento(detalle) {
    const contenedor = document.getElementById("contenedorDescuento");

    if (!contenedor) {
        console.warn("🚫 No se encontró el contenedorDescuento en el HTML.");
        return;
    }

    if (detalle.code && detalle.code.trim() !== "") {
        contenedor.innerHTML = `
            <div class="card-body">
                <div class="mb-3 d-flex justify-content-between align-items-center">
                    <label class="form-label mb-0">Código de descuento</label>
                </div>

                <div class="mb-3">
                    <input type="text" class="form-control inputdescuento input-mensajeUpdate" value="${detalle.code}" /> 
                    <span class="form-text spanTextoUpdate">Los clientes deben introducir este código en el pago.</span>
                </div>
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="card-body">
                <div class="mb-3 d-flex justify-content-between align-items-center">
                    <label class="form-label mb-0">Nombre</label>
                </div>

                <div class="mb-3">
                    <input type="text" class="form-control inputdescuento input-mensajeUpdate" value="${detalle.description}" /> 
                    <span class="form-text spanTextoUpdate">Este descuento se aplica automáticamente sin necesidad de código.</span>
                </div>
            </div>
        `;
    }
    escucharCambiosGenerales();
}

function renderTipoDescuento(detalle) {
    const contenedor = document.getElementById("contenedorTipoDescuento");

    if (!contenedor) {
        console.warn("🚫 No se encontró el contenedorTipoDescuento en el HTML.");
        return;
    }

    const isMoney = detalle.money === true;
    const tipoSeleccionado = isMoney ? "fijo" : "Porcentaje";
    const simbolo = isMoney ? "PEN" : "%";
    const valor = detalle.discount_percentage || "";

    contenedor.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-md-8">
                <select class="form-select inputdescuento" id="tipo-descuentoUpdate">
                    <option value="Porcentaje" ${!isMoney ? "selected" : ""}>Porcentaje</option>
                    <option value="fijo" ${isMoney ? "selected" : ""}>Monto fijo</option>
                </select>
            </div>
            <div class="col-md-4">
                <div class="input-wrapper">
                    <input type="text" class="form-control inputdescuento input-valorUpdate" value="${valor}" />
                    <span class="input-symbol" id="simbolo-descuentoUpdate">${simbolo}</span>
                </div>
            </div>
        </div>
    `;

    // Escuchar cambios del select para actualizar símbolo
    const select = document.getElementById("tipo-descuentoUpdate");
    const simboloSpan = document.getElementById("simbolo-descuentoUpdate");

    select.addEventListener("change", () => {
        if (select.value === "fijo") {
            simboloSpan.textContent = "PEN";
        } else {
            simboloSpan.textContent = "%";
        }
    });
    escucharCambiosGenerales();
}

function renderRequisitos(detalle) {
    const contenedor = document.getElementById("contenedorRequisitos");

    const usageLimit = detalle.usage_limit;
    const usageCount = detalle.usage_count ?? 0; // Obtiene usage_count o lo pone en 0 si no está definido
    const isCantidad = usageLimit !== null;

    contenedor.innerHTML = `
        <div class="mb-3">
            <div class="mb-3">
                <input type="checkbox" id="check-sin-requisitos" class="requisitos" ${!isCantidad ? "checked" : ""}>
                <label class="form-check-label" for="check-sin-requisitos" style="cursor: pointer;">
                    Hasta agotar stock
                </label>
            </div>

            <div class="mb-3">
                <input type="checkbox" id="check-cantidad" class="requisitos" ${isCantidad ? "checked" : ""}>
                <label class="form-check-label" for="check-cantidad" style="cursor: pointer;">
                    Como máximo
                </label>
            </div>

            <div class="mb-3" id="inputCantidadMinima" style="display: ${isCantidad ? "block" : "none"};">
                <input type="text" class="form-control inputdescuento mb-3 col-md-4" id="cantidad-minima" value="${isCantidad ? usageLimit : ""}">
                <span class="form-text">Se aplica solo a productos seleccionados.</span>
            </div>
            
            <!-- Mostrar el usage_count actual -->
            <div class="mb-3">
                <label for="usage-count" class="form-label">Usado actualmente:</label>
                <input type="text" id="usage-count" class="form-control" value="${usageCount}" disabled>
            </div>
        </div>
    `;

    const checkStock = document.getElementById("check-sin-requisitos");
    const checkCantidad = document.getElementById("check-cantidad");
    const inputCantidadDiv = document.getElementById("inputCantidadMinima");

    // Escuchar cambios
    checkStock.addEventListener("change", () => {
        if (checkStock.checked) {
            checkCantidad.checked = false;
            inputCantidadDiv.style.display = "none";
        }
    });

    checkCantidad.addEventListener("change", () => {
        if (checkCantidad.checked) {
            checkStock.checked = false;
            inputCantidadDiv.style.display = "block";
        } else {
            inputCantidadDiv.style.display = "none";
        }
    });

    escucharCambiosGenerales();
}


function renderFechas(detalle) {
    const contenedor = document.getElementById("contenedorFechas");

    const start = new Date(detalle.start_date);
    const end = detalle.end_date ? new Date(detalle.end_date) : null;

    const startFecha = start.toISOString().slice(0, 10);
    const startHora = start.toTimeString().slice(0, 5);

    let endFecha = '';
    let endHora = '';
    let checkFinal = '';

    if (end) {
        endFecha = end.toISOString().slice(0, 10);
        endHora = end.toTimeString().slice(0, 5);
        checkFinal = 'checked';
    }

    contenedor.innerHTML = `
        <div class="row"> 
            <div class="col-md-6">
                <label>Fecha de inicio</label>
                <input type="date" class="form-control inputdescuento mb-3" id="fechaInput" value="${startFecha}" style="cursor: pointer;">
            </div>
            <div class="col-md-6">
                <label>Hora de inicio (-05)</label>
                <input type="time" class="form-control inputdescuento mb-3" id="horaInput" value="${startHora}" style="cursor: pointer;">
            </div>
        </div>

        <div class="mb-3">
            <input type="checkbox" id="check-finalDes" class="requisitos" ${checkFinal}>
            <label class="form-check-label" for="check-finalDes" style="cursor: pointer;">
                Establecer fecha de finalización
            </label>
        </div>

        <div class="row" id="finalizacionContainer" style="display: ${end ? "flex" : "none"};">
            <div class="col-md-6">
                <label>Fecha de finalización</label>
                <input type="date" class="form-control inputdescuento mb-3" id="fechaInputFinish" value="${endFecha}" style="cursor: pointer;">
            </div>
            <div class="col-md-6">
                <label>Hora de finalización (-05)</label>
                <input type="time" class="form-control inputdescuento mb-3" id="horaInputFinish" value="${endHora}" style="cursor: pointer;">
            </div>
        </div>
    `;

    // Dinámicamente mostrar u ocultar inputs de finalización
    const checkbox = document.getElementById("check-finalDes");
    const finalizacionContainer = document.getElementById("finalizacionContainer");

    checkbox.addEventListener("change", () => {
        finalizacionContainer.style.display = checkbox.checked ? "flex" : "none";
    });

    escucharCambiosGenerales();
}

function escucharCambiosGenerales() {
    const inputs = document.querySelectorAll(".inputdescuento, .requisitos");

    inputs.forEach(input => {
        input.addEventListener("input", actualizarResumenDescuento);
        input.addEventListener("change", actualizarResumenDescuento);
    });
}

function actualizarResumenDescuento() {
    // Método del descuento
    const inputCodigo = document.getElementById("codigoDescuentoInput");
    const inputDescripcion = document.querySelector(".input-mensajeUpdate");

    const tieneCodigo = inputCodigo && inputCodigo.value.trim() !== "";
    const metodoTexto = tieneCodigo ? "Código de descuento" : "Descuento automático";
    const descripcionCodigo = tieneCodigo
        ? inputCodigo.value.trim()
        : (inputDescripcion?.value.trim() || "Aún no hay descripción");

    // Tipo de valor e input
    const tipoValorSelect = document.getElementById("tipo-descuentoUpdate");
    const tipoValor = tipoValorSelect?.value;
    const valor = document.querySelector(".input-valorUpdate")?.value || "";
    const textoDescuento = tipoValor === "Porcentaje"
        ? `${valor} % de descuento`
        : tipoValor === "fijo"
            ? `${valor} PEN de descuento`
            : "Descuento no definido";

    // Requisito mínimo
    const tieneRequisito = document.getElementById("check-cantidad")?.checked;
    const requisitoInput = document.getElementById("cantidad-minima")?.value;
    const textoRequisito = tieneRequisito && requisitoInput
        ? `Compra máxima de ${requisitoInput} artículos`
        : "Hasta agotar stock";

    // Fechas
    const startFecha = document.getElementById("fechaInput")?.value;
    const endFecha = document.getElementById("fechaInputFinish")?.value;
    const textoFecha = startFecha && endFecha
        ? `Activo desde ${formatearFecha(startFecha)} hasta ${formatearFecha(endFecha)}`
        : startFecha
            ? `Activo desde ${formatearFecha(startFecha)}`
            : "Fecha no definida";

    // Actualizar HTML: método
    document.querySelector(".clienteDate").textContent = metodoTexto;

    const ulMetodo = document.querySelector(".card-body ul.resumen-metodo");
    ulMetodo.innerHTML = `
        <li class="mb-1">
            <span data-feather="tag" class="feather-sm me-1"></span>
            <span>${metodoTexto}</span>
        </li>
        <li class="mb-1">
            <span data-feather="info" class="feather-sm me-1"></span>
            <span>${descripcionCodigo}</span>
        </li>
    `;

    // Descuento
    document.getElementById("valor-descuento").textContent = textoDescuento;

    // Productos seleccionados
    actualizarTextoProductos();

    // Requisito y fechas
    document.getElementById("info-requisito-compra").innerHTML = `<span>${textoRequisito}</span>`;
    document.getElementById("activo-desde").innerHTML = `<span>${textoFecha}</span>`;
}



// Helper para formatear fecha tipo "2025-05-03" → "3 de mayo"
function formatearFecha(fechaStr) {
    const opciones = { day: 'numeric', month: 'long' };
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', opciones);
}


function obtenerProductosSeleccionadosTotales() {
    const combinados = [...seleccionActualDes];

    seleccionActualDesUpdate.forEach(nuevo => {
        if (!combinados.some(p => p.idProducto === nuevo.idProducto)) {
            combinados.push(nuevo);
        }
    });

    return combinados;
}


function getToken() {
    return localStorage.getItem("access_token");
}


async function obtenerDetalleDescuento(descuentoId) {
    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    try {
        const response = await fetch(`${baseUrl}/get/promociones/${descuentoId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}` // Asegúrate de que este token sea válido
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener la promoción: ${response.status}`);
        }

        const data = await response.json();


        if (!data) {
            console.warn("🚫 No se obtuvo datos válidos desde la API.");
        }

        // Verificamos que la respuesta contiene el campo product_ids
        if (!data.product_ids) {
            console.warn("🚫 La respuesta no contiene product_ids:", data);
        }

        return data;

    } catch (error) {
        console.error("❌ Error al obtener el detalle del descuento:", error);
    }
}


async function renderTablaDesView() {
    const tablaContainer = document.getElementById("cartContainerDesUpdate");
    tablaContainer.innerHTML = "";  // Limpiar el contenedor

    document.getElementById("buscarProductoDes").value = "";  // Limpiar búsqueda

    const productosTotales = obtenerProductosSeleccionadosTotales();

    if (productosTotales.length === 0) return;

    let productosSeleccionados = [];

    for (let i = 0; i < productosTotales.length; i++) {
        const item = productosTotales[i];

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/product/${item.idProducto}`);
            const data = await response.json();

            const producto = data.product;
            const nombre = producto.name;
            const imagenUrl = producto.imagenes.length > 0
                ? producto.imagenes[0].cRutaImagen
                : "https://via.placeholder.com/50";

            productosSeleccionados.push(nombre);
            item.nombre = nombre;

            const productoDiv = document.createElement("div");
            productoDiv.className = "card shadow-sm p-2 d-flex flex-row align-items-center justify-content-between";
            productoDiv.dataset.index = i;

            productoDiv.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <img src="${imagenUrl}" height="50" width="50" alt="Imagen Producto" class="rounded">
                    <span class="fw-semibold">${nombre}</span>
                </div>
                <button class="btn btn-danger btn-sm btnEliminarFila">X</button>
            `;

            tablaContainer.appendChild(productoDiv);

            const btnEliminar = productoDiv.querySelector(".btnEliminarFila");
            btnEliminar.addEventListener("click", () => {
                const index = parseInt(productoDiv.dataset.index);
                const item = productosTotales[index];

                // Eliminar del array correspondiente
                seleccionActualDes = seleccionActualDes.filter(p => p.idProducto !== item.idProducto);
                seleccionActualDesUpdate = seleccionActualDesUpdate.filter(p => p.idProducto !== item.idProducto);
                delete selectedItemsDes[item.idProducto];
                delete selectedItemsDesUpdate[item.idProducto];

                renderTablaDesView();
                btn_agregarProd();  // o btn_agregarProdUpdate si aplica
                actualizarTextoProductos();
            });

        } catch (error) {
            console.error("❌ Error cargando producto:", item.idProducto, error);
        }
    }

    actualizarTextoProductos();
}

function actualizarTextoProductos() {
    const spanProductos = document.getElementById("productos-descuento");

    // Usamos seleccionActualDesUpdate si está definido, si no seleccionActualDes
    const productos = seleccionActualDesUpdate?.length ? seleccionActualDesUpdate : seleccionActualDes || [];

    const nombres = productos.map(p => p.nombre).filter(Boolean);  // Solo nombres definidos
    const texto = nombres.length > 0 ? `a ${nombres.join(", ")}` : "a productos";

    spanProductos.textContent = texto;
}



// PARA MODAL
const selectedItemsDesUpdate = {};
let seleccionActualDesUpdate = [];

function buscarProductsUpdate() {
    const inputLetra = document.getElementById("buscarProductoDes");
    const buscadorModal = document.getElementById("buscadorModal");
    const modalContent = document.getElementById("modalContentProduct");

    if (inputLetra) {
        inputLetra.addEventListener("input", async () => {
            const query = inputLetra.value.trim(); // Obtener el texto ingresado
            console.log("Texto ingresado en input de la página:", query); // Verificar lo que el usuario ingresa

            // Actualizar el campo de búsqueda en el modal
            buscadorModal.value = query;

            if (query.length > 0) {
                // Obtener productos de la API filtrados por el texto
                const products = await ProductsBySearchQuery(query);

                // Renderizar los productos en el modal
                renderProductsInModal_desUpdate(products);

                // Abrir el modal solo si aún no está abierto
                openModalProductUpdate();
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}

function dentroModalLetraInputUpdate() {
    const inputModalLetra = document.getElementById("buscadorModal");
    const modalContent = document.getElementById("modalContentProduct");

    if (inputModalLetra) {
        inputModalLetra.addEventListener("input", async () => {
            const query = inputModalLetra.value.trim(); // Obtener el texto ingresado
            console.log("Texto ingresado en el modal:", query); // Verificar lo que el usuario ingresa

            if (query.length > 0) {
                // Obtener productos de la API filtrados por el texto
                const products = await ProductsBySearchQuery(query);

                // Renderizar los productos en el modal
                renderProductsInModal_desUpdate(products);
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}

function renderProductsInModal_desUpdate(products) {
    const modalContent = document.getElementById("modalContentProduct");
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
                checkbox.dispatchEvent(new Event("change")); // esto invoca a logSelectionDesUpdateUpdate(product, checkbox)
            });

            // Solo inicializamos si no existe
            selectedItemsDesUpdate[product.id] = selectedItemsDesUpdate[product.id] || { name: product.name, tallas: [], colores: [], selected: false };

            // Ya no marcamos el producto como seleccionado
            if (!productCheckboxElement.checked) {
                // Si se desmarca, vaciamos
                selectedItemsDesUpdate[product.id].tallas = [];
                selectedItemsDesUpdate[product.id].colores = [];
                selectedItemsDesUpdate[product.id].selected = false;

                // Si ya no hay ningún item seleccionado, eliminamos el producto del objeto
                const hasSelection = selectedItemsDesUpdate[product.id].tallas.length > 0 || selectedItemsDesUpdate[product.id].colores.length > 0;
                if (!hasSelection) {
                    delete selectedItemsDesUpdate[product.id];
                }
            }

            logSelectionDesUpdateUpdate(product, null); // actualizar estado del botón
        });

        // Checkbox de talla o color
        filteredOptionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                updateProductCheckboxState(productDetails, productCheckboxElement);
                logSelectionDesUpdateUpdate(product, checkbox); // esto también debería revisar si se debe ocultar el botón

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

function logSelectionDesUpdateUpdate(product, checkbox) {
    const productId = product.id;

    // Solo inicializar si no existe aún
    if (!selectedItemsDesUpdate[productId]) {
        selectedItemsDesUpdate[productId] = {
            name: product.name,
            tallas: [],
            colores: []
        };
    }

    if (checkbox) {
        if (checkbox.name.startsWith("talla")) {
            if (checkbox.checked) {
                if (!selectedItemsDesUpdate[productId].tallas.includes(checkbox.id)) {
                    selectedItemsDesUpdate[productId].tallas.push(checkbox.id);
                }
            } else {
                selectedItemsDesUpdate[productId].tallas = selectedItemsDesUpdate[productId].tallas.filter(id => id !== checkbox.id);
            }
        } else if (checkbox.name.startsWith("color")) {
            const colorCode = checkbox.getAttribute("data-color");
            if (checkbox.checked) {
                if (!selectedItemsDesUpdate[productId].colores.some(c => c.id === checkbox.id)) {
                    selectedItemsDesUpdate[productId].colores.push({ id: checkbox.id, color: colorCode });
                }
            } else {
                selectedItemsDesUpdate[productId].colores = selectedItemsDesUpdate[productId].colores.filter(c => c.id !== checkbox.id);
            }
        }
    }

    // Limpiar si está vacío
    const hasTallas = selectedItemsDesUpdate[productId].tallas.length > 0;
    const hasColores = selectedItemsDesUpdate[productId].colores.length > 0;

    if (!hasTallas && !hasColores) {
        delete selectedItemsDesUpdate[productId];
    }

    btn_agregarProdUpdate();
}

let nombresSeleccionadosDesUpdate = [];

function btn_agregarProdUpdate() {
    const existingBtn = document.getElementById("verSeleccionBtnUpdate");
    const modalContent = document.getElementById("modalContentProduct");

    const haySeleccion = Object.values(selectedItemsDesUpdate).some(item =>
        item.selected || item.tallas.length > 0 || item.colores.length > 0
    );

    if (haySeleccion && !existingBtn) {
        const button = document.createElement("button");
        button.id = "verSeleccionBtnUpdate";
        button.className = "btn btn-primary mt-3";
        button.textContent = "Ver selección";

        button.addEventListener("click", () => {
            const seleccionFinal = [];
            nombresSeleccionadosDesUpdate = []; // Reiniciamos

            Object.entries(selectedItemsDesUpdate).forEach(([productId, data]) => {
                if (data.selected || data.tallas.length > 0 || data.colores.length > 0) {
                    const idNum = Number(productId);

                    if (!seleccionFinal.some(p => p.idProducto === idNum)) {
                        seleccionFinal.push({ idProducto: idNum, talla: null, color: null });

                        // Obtener nombre desde un data attribute o similar
                        const el = document.querySelector(`[data-product-id="${productId}"]`);
                        const nombre = el?.dataset?.nombre || el?.textContent?.trim() || "Producto desconocido";

                        nombresSeleccionadosDesUpdate.push(nombre);
                    }
                }
            });

            console.log("=== ARRAY DE SELECCIÓN FINAL ===");
            console.log(seleccionFinal);

            seleccionActualDesUpdate = seleccionFinal.map(item => ({
                idProducto: item.idProducto,
                talla: item.talla,
                color: item.color
            }));

            if (modalDes) {
                modalDes.hide();
                renderTablaDesView(); // Aquí NO rompe porque mantenemos solo id, talla y color
            }
        });

        modalContent.appendChild(button);
    } else if (!haySeleccion && existingBtn) {
        existingBtn.remove();
    }
}
function openModalProductUpdate() {
    if (!modalDes) {
        modalDes = new bootstrap.Modal(document.getElementById('productoModalDesUpdate'));

        // 💥 Una sola vez, cuando el modal ya se muestra:
        document.getElementById('productoModalDesUpdate').addEventListener('shown.bs.modal', () => {
            document.getElementById('buscadorModal').focus();
        });
    }

    if (!modalDes._isShown) {
        modalDes.show();
    }
}


document.getElementById("updateDescuento").addEventListener("click", async function () {
    const input = document.querySelector(".inputdescuento");

    if (!input) {
        console.warn("🚫 No se encontró el input de descuento.");
        return;
    }

    const nuevoValor = input.value.trim();

    // ✅ Crear el objeto resultado antes de usarlo
    const resultado = {
        active: true,
        id: null,
        code: "",
        description: "",
        money: false,
        discount_percentage: "",
        products: [],
        usage_limit: null,
        usage_count: null,
        start_date: "",
        end_date: "",
        name: ""
    };

    // Obtener el id desde la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    resultado.id = id;

    // Detectamos si es un código o descripción
    const spanTexto = document.querySelector(".spanTextoUpdate");
    const esCodigo = spanTexto?.textContent.includes("código");

    if (esCodigo) {
        resultado.code = nuevoValor;
    }

    // Obtener tipo de descuento
    const tipoSelect = document.getElementById("tipo-descuentoUpdate");
    const valorInput = document.querySelector(".input-valorUpdate");

    if (tipoSelect && valorInput) {
        const tipo = tipoSelect.value;
        const valor = valorInput.value.trim();

        resultado.money = tipo === "fijo";
        resultado.discount_percentage = valor;
        resultado.description = valor;
        resultado.name = valor;
    }

    // ✅ Obtener productos seleccionados
    const productosTotales = obtenerProductosSeleccionadosTotales();
    resultado.products = productosTotales.map(p => p.idProducto);

    // ✅ Obtener límites de uso
    const checkCantidad = document.getElementById("check-cantidad");
    const inputCantidad = document.getElementById("cantidad-minima");

    resultado.usage_limit = checkCantidad.checked ? Number(inputCantidad.value.trim()) : null;

    const usageCountInput = document.getElementById("usage-count");
    resultado.usage_count = usageCountInput ? Number(usageCountInput.value.trim()) : null;

    // ✅ Fechas
    const fechaInicio = document.getElementById("fechaInput").value;
    const horaInicio = document.getElementById("horaInput").value;
    resultado.start_date = `${fechaInicio}T${horaInicio}:00-05:00`;

    const checkboxFinal = document.getElementById("check-finalDes");
    if (checkboxFinal.checked) {
        const fechaFin = document.getElementById("fechaInputFinish").value;
        const horaFin = document.getElementById("horaInputFinish").value;
        resultado.end_date = `${fechaFin}T${horaFin}:00-05:00`;
    } else {
        resultado.end_date = null;
    }

    console.log("📦 Resultado actualizado:", resultado);

    // ✅ Envío al backend con try-catch
    try {
        const token = localStorage.getItem("access_token");
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/promotionsAdd/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(resultado)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Error al actualizar:", errorData);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar la promoción.'
            });
            return;
        }

        const data = await response.json();
        console.log("✅ Promoción actualizada correctamente:", data);
        // Mostrar alerta con SweetAlert2 y redirigir al confirmar
        Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Promoción actualizada con éxito.',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = `${baseUrl}/dash-promocion/`;
        });

    } catch (error) {
        console.error("💥 Error inesperado:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Hubo un problema con la actualización.'
        });
    }

});

