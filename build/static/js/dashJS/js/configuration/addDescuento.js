
document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    // Se ejecuta solo si estás en /dash-detallePedido/
    if (path === "/dash-addDescuento/") {
        buscarProducts();
        dentroModalLetraInput();
        // PARA TIPO(% o S/)
        // DETECTAR MÉTODO
        inicializarDescuento(); // 👈 Llamás tu lógica de descuento

        //PARA CAUNTOS DESCEUNTOS PUEDE
        const checkSinRequisitos = document.getElementById("check-sin-requisitos");
        const checkCantidad = document.getElementById("check-cantidad");
        const inputCantidadMinima = document.getElementById("inputCantidadMinima");
        const spanRequisitoCompra = document.querySelector("#info-requisito-compra span");

        const cantidadMinimaInput = document.getElementById("cantidad-minima");

        checkSinRequisitos.addEventListener("change", () => {
            if (checkSinRequisitos.checked) {
                checkCantidad.checked = false;
                inputCantidadMinima.style.display = "none";
                spanRequisitoCompra.textContent = "Hasta agotar stock";
            }
        });

        checkCantidad.addEventListener("change", () => {
            if (checkCantidad.checked) {
                checkSinRequisitos.checked = false;
                inputCantidadMinima.style.display = "block";
                actualizarRequisitoCompra();  // Mostrar la cantidad mínima
            } else {
                inputCantidadMinima.style.display = "none";
                spanRequisitoCompra.textContent = "Hasta agotar Stock";  // Volver al texto original
            }
        });

        cantidadMinimaInput.addEventListener("input", () => {
            if (checkCantidad.checked) {
                actualizarRequisitoCompra();  // Actualizar el mensaje cuando se cambia el valor
            }
        });

        function actualizarRequisitoCompra() {
            const cantidadMinima = cantidadMinimaInput.value || 0;  // Si no hay valor, usamos 2 por defecto
            spanRequisitoCompra.textContent = `Compra máxima ${cantidadMinima} artículos, uno por cada usuario`;
        }

        // Inicializar en caso de que haya valores por defecto o cambios previos
        if (checkCantidad.checked) {
            actualizarRequisitoCompra();
        }


        // PARA LA HORA Y FECHA
        setFechaHoraActual("fechaInput", "horaInput");
        toggleFechaFinalizacion("check-finalDes", "finalizacionContainer", "fechaInputFinish", "horaInputFinish");

        document.getElementById("fechaInput").addEventListener("change", actualizarActivoDesde);
        document.getElementById("fechaInputFinish").addEventListener("change", actualizarActivoDesde);
        document.getElementById("check-finalDes").addEventListener("change", actualizarActivoDesde);

        // Iniciar con la validación al cargar
        actualizarActivoDesde();




    } else {
        console.log("🟡 No estás en /dash-addDescuento/");
    }
});

function inicializarDescuento() {
    // Selectores
    const metodoCodigo = document.querySelector(".metodo_codigo");
    const metodoAutomatico = document.querySelector(".metodo_automatico");
    const labelCodigo = document.querySelector(".form-label.mb-0");
    const spanTexto = document.querySelector(".form-text");
    const inputMensaje = document.querySelector(".input-mensaje"); // ← input para código/nombre
    const inputValor = document.querySelector(".input-valor");     // ← input para valor numérico

    const spanTipo = document.querySelectorAll(".list-unstyled li span:nth-of-type(2)")[0];
    const spanCodigoTexto = document.querySelectorAll(".list-unstyled li span:nth-of-type(2)")[1];

    const spanValorDescuento = document.getElementById("valor-descuento");
    const selectTipoDescuento = document.getElementById("tipo-descuento");

    let metodoActivo = "automatico";
    let simbolo = "%";

    function actualizarTipoYTexto(metodo) {
        metodoActivo = metodo;

        metodoCodigo.classList.toggle("active", metodo === "codigo");
        metodoAutomatico.classList.toggle("active", metodo === "automatico");

        if (metodo === "codigo") {
            labelCodigo.textContent = "Código de descuento";
            spanTexto.textContent = "Los clientes deben introducir este código en el pago.";
            spanTipo.textContent = "Código de descuento";
        } else {
            labelCodigo.textContent = "Nombre";
            spanTexto.textContent = "Este descuento se aplica automáticamente sin necesidad de código.";
            spanTipo.textContent = "Descuento automático";
        }

        limpiarInputMensaje();
        actualizarCodigoTexto();
        actualizarInfoDescuento(); // también actualiza la parte inferior
    }

    function limpiarInputMensaje() {
        inputMensaje.value = "";
    }

    function actualizarCodigoTexto() {
        const valor = inputMensaje.value.trim();
        spanCodigoTexto.textContent = valor
            ? valor
            : metodoActivo === "codigo"
                ? "Aún no hay código de descuento"
                : "Aún no hay nombre asignado";
    }

    function actualizarInfoDescuento() {
        const valor = inputValor.value.trim();
        const texto = valor ? `${valor} ${simbolo} de descuento` : `0 ${simbolo} de descuento`;
        spanValorDescuento.textContent = texto;
    }

    // Evento: cambio de tipo (Porcentaje / Monto)
    selectTipoDescuento.addEventListener('change', function () {
        const simboloSpan = document.getElementById('simbolo-descuento');
        simbolo = this.value === 'Porcentaje' ? '%' : 'PEN';

        simboloSpan.textContent = simbolo;
        const placeholder = simbolo === '%' ? '' : '0.00';
        inputValor.setAttribute('placeholder', placeholder);

        actualizarInfoDescuento();
    });

    // Eventos
    metodoCodigo.addEventListener("click", () => actualizarTipoYTexto("codigo"));
    metodoAutomatico.addEventListener("click", () => actualizarTipoYTexto("automatico"));

    inputMensaje.addEventListener("input", actualizarCodigoTexto);
    inputValor.addEventListener("input", actualizarInfoDescuento);

    // Activar automático por defecto
    actualizarTipoYTexto("automatico");
}

function actualizarActivoDesde() {
    const fechaInput = document.getElementById("fechaInput");
    const fechaInputFinish = document.getElementById("fechaInputFinish");
    const checkFinalDes = document.getElementById("check-finalDes");
    const spanActivoDesde = document.getElementById("activo-desde");  // Este span se actualizará con el texto del descuento.

    const fechaInicio = new Date(fechaInput.value);
    const fechaFin = new Date(fechaInputFinish.value);
    const fechaHoy = new Date();

    const fechaHoyFormateada = fechaHoy.toISOString().split('T')[0];  // YYYY-MM-DD
    const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0];

    // Función para formatear solo el mes y día
    function formatearFecha(fecha) {
        return fecha.toLocaleDateString("es-ES", { month: 'long', day: 'numeric' });
    }

    // Si la fecha de inicio es hoy
    if (fechaInicioFormateada === fechaHoyFormateada) {
        spanActivoDesde.textContent = "Activo desde hoy";
        if (checkFinalDes.checked && fechaInputFinish.value) {
            const fechaFinFormateada = formatearFecha(fechaFin);
            spanActivoDesde.textContent = `Activo desde hoy hasta ${fechaFinFormateada}`;
        }
    } else {
        const fechaInicioFormateada = formatearFecha(fechaInicio);
        spanActivoDesde.textContent = `Activo desde ${fechaInicioFormateada}`;
        if (checkFinalDes.checked && fechaInputFinish.value) {
            const fechaFinFormateada = formatearFecha(fechaFin);
            spanActivoDesde.textContent = `Activo desde ${fechaInicioFormateada} hasta ${fechaFinFormateada}`;
        }
    }
}

// Función para establecer fecha y hora actual en inputs
function setFechaHoraActual(fechaId, horaId) {
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().slice(0, 5);

    document.getElementById(fechaId).value = fechaActual;
    document.getElementById(horaId).value = horaActual;

    document.getElementById(fechaId).addEventListener("focus", function () {
        this.showPicker?.(); // Solo se abre al enfocar, no desde el checkbox
    });

    document.getElementById(horaId).addEventListener("focus", function () {
        this.showPicker?.();
    });
}

// Función para mostrar/ocultar inputs de fecha finalización
function toggleFechaFinalizacion(checkboxId, contenedorId, fechaId, horaId) {
    const checkbox = document.getElementById(checkboxId);
    const contenedor = document.getElementById(contenedorId);

    checkbox.addEventListener("change", function () {
        if (this.checked) {
            contenedor.style.display = "flex";
            setFechaHoraActual(fechaId, horaId); // solo asigna valores, no abre pickers
        } else {
            contenedor.style.display = "none";
        }
    });
}

function buscarProducts() {
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
                renderProductsInModal_des(products);

                // Abrir el modal solo si aún no está abierto
                openModalProduct();
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}

function dentroModalLetraInput() {
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
                renderProductsInModal_des(products);
            } else {
                // Limpiar el contenido del modal si no hay texto
                modalContent.innerHTML = "<p>Por favor ingrese un texto válido.</p>";
            }
        });
    }
}



async function ProductsBySearchQuery(query) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get-products/?new=true`);
        const data = await response.json();

        // Filtrar: sin promociones y nombre coincide con el query
        const filteredProducts = data.products.filter(product =>
            product.promotions.length === 0 &&
            product.name.toUpperCase().includes(query.toUpperCase())
        );

        return filteredProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}


function renderProductsInModal_des(products) {
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
                checkbox.dispatchEvent(new Event("change")); // esto invoca a logSelectionDes(product, checkbox)
            });

            // Solo inicializamos si no existe
            selectedItemsDes[product.id] = selectedItemsDes[product.id] || { name: product.name, tallas: [], colores: [], selected: false };

            // Ya no marcamos el producto como seleccionado
            if (!productCheckboxElement.checked) {
                // Si se desmarca, vaciamos
                selectedItemsDes[product.id].tallas = [];
                selectedItemsDes[product.id].colores = [];
                selectedItemsDes[product.id].selected = false;

                // Si ya no hay ningún item seleccionado, eliminamos el producto del objeto
                const hasSelection = selectedItemsDes[product.id].tallas.length > 0 || selectedItemsDes[product.id].colores.length > 0;
                if (!hasSelection) {
                    delete selectedItemsDes[product.id];
                }
            }

            logSelectionDes(product, null); // actualizar estado del botón
        });

        // Checkbox de talla o color
        filteredOptionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                updateProductCheckboxState(productDetails, productCheckboxElement);
                logSelectionDes(product, checkbox); // esto también debería revisar si se debe ocultar el botón

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

let modalDes;
const selectedItemsDes = {};
let seleccionActualDes = []; // Variable global para mantener la selección
let idProductoSeleccionadoDes = null; // 👈 Declaración global

function logSelectionDes(product, checkbox) {
    const productId = product.id;

    // Solo inicializar si no existe aún
    if (!selectedItemsDes[productId]) {
        selectedItemsDes[productId] = {
            name: product.name,
            tallas: [],
            colores: []
        };
    }

    if (checkbox) {
        if (checkbox.name.startsWith("talla")) {
            if (checkbox.checked) {
                if (!selectedItemsDes[productId].tallas.includes(checkbox.id)) {
                    selectedItemsDes[productId].tallas.push(checkbox.id);
                }
            } else {
                selectedItemsDes[productId].tallas = selectedItemsDes[productId].tallas.filter(id => id !== checkbox.id);
            }
        } else if (checkbox.name.startsWith("color")) {
            const colorCode = checkbox.getAttribute("data-color");
            if (checkbox.checked) {
                if (!selectedItemsDes[productId].colores.some(c => c.id === checkbox.id)) {
                    selectedItemsDes[productId].colores.push({ id: checkbox.id, color: colorCode });
                }
            } else {
                selectedItemsDes[productId].colores = selectedItemsDes[productId].colores.filter(c => c.id !== checkbox.id);
            }
        }
    }

    // Limpiar si está vacío
    const hasTallas = selectedItemsDes[productId].tallas.length > 0;
    const hasColores = selectedItemsDes[productId].colores.length > 0;

    if (!hasTallas && !hasColores) {
        delete selectedItemsDes[productId];
    }

    btn_agregarProd();
}



function btn_agregarProd() {
    const existingBtn = document.getElementById("verSeleccionBtn");
    const modalContent = document.getElementById("modalContentProduct");

    const haySeleccion = Object.values(selectedItemsDes).some(item =>
        item.selected || item.tallas.length > 0 || item.colores.length > 0
    );
    if (haySeleccion && !existingBtn) {
        const button = document.createElement("button");
        button.id = "verSeleccionBtn";
        button.className = "btn btn-primary mt-3";
        button.textContent = "Ver selección";

        button.addEventListener("click", () => {
            const seleccionFinal = [];

            Object.entries(selectedItemsDes).forEach(([productId, data]) => {
                if (data.selected || data.tallas.length > 0 || data.colores.length > 0) {
                    if (!seleccionFinal.some(p => p.idProducto === productId)) {
                        seleccionFinal.push({ idProducto: productId, talla: null, color: null });
                    }
                }
            });
            console.log("=== ARRAY DE SELECCIÓN FINAL ===");
            console.log(seleccionFinal);

            // 💥 Agregá esto:
            seleccionActualDes = [...seleccionFinal];

            if (modalDes) {
                modalDes.hide();
                renderTablaDes(); // Ahora sí con los datos actualizados
            }
        });


        modalContent.appendChild(button);
    } else if (!haySeleccion && existingBtn) {
        existingBtn.remove();
    }
}

async function renderTablaDes() {
    const tablaContainer = document.getElementById("tablaContainerDes");
    tablaContainer.innerHTML = "";  // Limpiar el contenedor antes de renderizar

    document.getElementById("buscarProductoDes").value = "";  // Limpiar el campo de búsqueda

    if (seleccionActualDes.length === 0) return;

    let productosSeleccionados = [];  // Array para almacenar los nombres de productos seleccionados

    // Crear los productos como cards
    for (let i = 0; i < seleccionActualDes.length; i++) {
        const item = seleccionActualDes[i];

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/product/${item.idProducto}`);
            const data = await response.json();

            const producto = data.product;
            const nombre = producto.name;
            const imagenUrl = producto.imagenes.length > 0
                ? producto.imagenes[0].cRutaImagen
                : "https://via.placeholder.com/50";

            // Almacenar el nombre del producto
            productosSeleccionados.push(nombre);

            // Crear el div para cada producto
            const productoDiv = document.createElement("div");
            productoDiv.className = "card shadow-sm p-2 d-flex flex-row align-items-center justify-content-between";
            productoDiv.dataset.index = i;  // Guardamos el índice para eliminarlo

            productoDiv.innerHTML = `
                <!-- Imagen + Nombre -->
                <div class="d-flex align-items-center gap-3">
                    <img src="${imagenUrl}" height="50" width="50" alt="Imagen Producto" class="rounded">
                    <span class="fw-semibold">${nombre}</span>
                </div>

                <!-- Botón Eliminar -->
                <button class="btn btn-danger btn-sm btnEliminarFila">X</button>
            `;

            // Añadir el div al contenedor
            tablaContainer.appendChild(productoDiv);

            // Añadir funcionalidad de eliminación
            const btnEliminar = productoDiv.querySelector(".btnEliminarFila");
            btnEliminar.addEventListener("click", () => {
                const index = parseInt(productoDiv.dataset.index);
                const item = seleccionActualDes[index];

                // Eliminar del array seleccionActualDes
                seleccionActualDes.splice(index, 1);

                // Limpiar del objeto seleccionado también
                delete selectedItemsDes[item.idProducto];

                // Re-renderizar la tabla
                renderTablaDes();

                // Re-evaluar si debe mostrarse el botón
                btn_agregarProd();

                // Actualizar el <li> con los productos restantes
                const spanProductos = document.querySelector("#info-descuento span:nth-of-type(2)");
                if (seleccionActualDes.length > 0) {
                    // Actualizar el contenido del <span> con los productos restantes, agregando "a" antes
                    const productosRestantes = seleccionActualDes.map(item => item.nombre);
                    spanProductos.textContent = "a " + productosRestantes.join(", ");
                } else {
                    spanProductos.textContent = "a productos";
                }
            });

        } catch (error) {
            console.error("Error cargando producto:", item.idProducto, error);
        }
    }

    // Al finalizar la iteración, actualizar el <li> con los nombres de productos seleccionados
    const spanProductos = document.querySelector("#info-descuento span:nth-of-type(2)");
    if (productosSeleccionados.length > 0) {
        // Actualizar el contenido del <span> con los productos seleccionados, agregando "a" antes
        spanProductos.textContent = "a " + productosSeleccionados.join(", ");  // Juntar los nombres con coma
    } else {
        spanProductos.textContent = "a productos.";
    }
}

function openModalProduct() {
    if (!modalDes) {
        modalDes = new bootstrap.Modal(document.getElementById('productoModalDes'));

        // 💥 Una sola vez, cuando el modal ya se muestra:
        document.getElementById('productoModalDes').addEventListener('shown.bs.modal', () => {
            document.getElementById('buscadorModal').focus();
        });
    }

    if (!modalDes._isShown) {
        modalDes.show();
    }
}


function construirFechaHora(fechaId, horaId) {
    const fecha = document.getElementById(fechaId)?.value;
    const hora = document.getElementById(horaId)?.value;

    if (fecha && hora) {
        // Concatenar en el formato requerido y asumir zona horaria UTC
        return `${fecha} ${hora}:00.0000000 +00:00`;
    }
    return "";
}
function getToken() {
    return localStorage.getItem("access_token");
}


//PARA CREAR
document.getElementById("addDescuento").addEventListener("click", async () => {
    const token = getToken();
    const nomDes = document.querySelector(".input-valor")?.value.trim() || "";
    const checkCantidad = document.getElementById("check-cantidad");
    const cantidadMinimaInput = document.getElementById("cantidad-minima");

    let usage_limit = "";
    if (
        checkCantidad.checked &&
        cantidadMinimaInput.value.trim() !== "" &&
        !isNaN(cantidadMinimaInput.value.trim())
    ) {
        usage_limit = parseInt(cantidadMinimaInput.value.trim(), 10);
    }

    const productIds = seleccionActualDes.map(item => parseInt(item.idProducto));
    const discountPercentage = parseFloat(nomDes);

    const promotionData = {
        name: document.querySelector(".input-mensaje")?.value.trim() || "",
        description: nomDes,
        discount_percentage: discountPercentage,
        code: document.querySelector(".metodo_codigo.active")
            ? document.querySelector(".input-mensaje")?.value.trim() || ""
            : "",
        start_date: construirFechaHora("fechaInput", "horaInput"),
        end_date: document.getElementById("check-finalDes")?.checked
        ? construirFechaHora("fechaInputFinish", "horaInputFinish")
        : null,
        products: productIds,
        active: document.querySelector(".metodo_codigo").classList.contains("active") ||
            document.querySelector(".metodo_automatico").classList.contains("active"),
        money: document.getElementById("simbolo-descuento")?.textContent.trim() === "PEN",
        usage_limit: checkCantidad.checked &&
            cantidadMinimaInput.value.trim() !== "" &&
            !isNaN(cantidadMinimaInput.value.trim())
            ? parseInt(cantidadMinimaInput.value.trim(), 10)
            : null,
    };

    console.log("DATOS DEL DESCEUNTO:", promotionData);

    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/promotionsAdd/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(promotionData)
        });

        if (response.ok) {
            const result = await response.json();
            const baseUrl = document.body.dataset.apiUrl;
            Swal.fire({
                icon: "success",
                title: "¡Promoción agregada!",
                text: "La promoción fue registrada exitosamente.",
                confirmButtonColor: "#3085d6"
            }).then(() => {
                window.location.href = `${baseUrl}/dash-promocion/`;
            });
        }else {
            const errorData = await response.json();
            console.error("❌ Error en API:", errorData);

            let errorMessage = "Hubo un problema al agregar la promoción.";

            // Si es un objeto con errores por campo
            if (typeof errorData === "object" && !Array.isArray(errorData)) {
                errorMessage = Object.entries(errorData)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
                    .join("\n");
            }

            // Si viene como un string directo
            if (typeof errorData === "string") {
                errorMessage = errorData;
            }

            Swal.fire({
                icon: "error",
                title: "Error al registrar",
                html: `<pre style="text-align:left;">${errorMessage}</pre>`,  // permite ver errores formateados
                confirmButtonColor: "#d33"
            });

        }
    } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        Swal.fire({
            icon: "error",
            title: "Error de conexión",
            text: "No se pudo conectar con el servidor.",
            confirmButtonColor: "#d33"
        });
    }
});
