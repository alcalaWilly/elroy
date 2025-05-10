
const PRODUCTS_ROWS_PER_PAGE = 4;
let PRODUCTS_currentPage = 1;
let PRODUCTS_totalPages = 1;
let PRODUCTS_data = [];

function PRODUCTS_renderPaginationControls(currentPage, totalPages, onPageClick) {
    const container = document.getElementById('pagination-products-controls');
    container.innerHTML = ''; // Limpiar controles anteriores

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Botón Anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `<button class="page-link">Anterior</button>`;
    liAnterior.addEventListener('click', () => {
        if (currentPage > 1) {
            onPageClick(currentPage - 1);
            PRODUCTS_renderPaginationControls(currentPage - 1, totalPages, onPageClick);
        }
    });
    ul.appendChild(liAnterior);

    // Mostrar hasta 5 botones de página
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) {
        start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<button class="page-link">${i}</button>`;
        li.addEventListener('click', () => {
            onPageClick(i);
            PRODUCTS_renderPaginationControls(i, totalPages, onPageClick);  // 🔄 Esto actualiza el estilo activo
        });
        ul.appendChild(li);
    }

    // Botón Siguiente
    const liSiguiente = document.createElement('li');
    liSiguiente.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    liSiguiente.innerHTML = `<button class="page-link">Siguiente</button>`;
    liSiguiente.addEventListener('click', () => {
        if (currentPage < totalPages) {
            onPageClick(currentPage + 1);
            PRODUCTS_renderPaginationControls(currentPage + 1, totalPages, onPageClick);
        }
    });
    ul.appendChild(liSiguiente);

    container.appendChild(ul);
}


function PRODUCTS_renderPage(products, page) {
    const tbody = document.getElementById("products-table-body");
    tbody.innerHTML = "";

    const start = (page - 1) * PRODUCTS_ROWS_PER_PAGE;
    const end = start + PRODUCTS_ROWS_PER_PAGE;
    const pageProducts = products.slice(start, end);

    pageProducts.forEach(product => {
        const row = document.createElement("tr");

        const tallas = product.tallas.length > 0
            ? product.tallas.map(t => t.talla.cNombreTalla).join(", ")
            : "N/A";

        const promociones = product.promotions.length > 0
            ? product.promotions.join(", ")
            : "Sin promociones";

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div>
                        <img class="image" src="${product.imagenes.length > 0 ? product.imagenes[0].cRutaImagen : '/static/default.jpg'}" 
                            alt="Imagen del producto">
                    </div>
                    <span class="btn-sm btn-icon-text">${product.name}</span>
                </div>
            </td>
            <td>${product.stock}</td>
            <td>${tallas}</td>
            <td>S/. ${product.price}</td>
            <td>${product.category}</td>
            <td>${promociones}</td>
            <td>
                <div class="d-flex align-items-center">
                    <button type="button" class="btn btn-success btn-sm btn-icon-text mr-3 edit-btn" data-id="${product.id}">
                        Edit
                        <i class="typcn typcn-edit btn-icon-append"></i>
                    </button>
                    <button type="button" class="btn btn-warning btn-sm btn-icon-text view-btn" data-id="${product.id}">
                        View
                        <i class="typcn typcn-eye btn-icon-append"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn, .view-btn').forEach(button => {
        button.addEventListener('click', event => {
            productId = event.currentTarget.dataset.id;
            if (!productId) {
                console.error("❌ Error: productId es undefined");
                return;
            }
            const isEdit = event.currentTarget.classList.contains("edit-btn");
            openModal(productId, isEdit ? "Editar Producto" : "Detalles del Producto");
        });
    });
}

function loadProducts() {
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get-products/`)
        .then(response => response.json())
        .then(data => {
            PRODUCTS_data = data.products;
            PRODUCTS_totalPages = Math.ceil(PRODUCTS_data.length / PRODUCTS_ROWS_PER_PAGE);
            PRODUCTS_renderPage(PRODUCTS_data, PRODUCTS_currentPage);
            PRODUCTS_renderPaginationControls(PRODUCTS_currentPage, PRODUCTS_totalPages, (page) => {
                PRODUCTS_currentPage = page;
                PRODUCTS_renderPage(PRODUCTS_data, PRODUCTS_currentPage);
            });
        })
        .catch(error => console.error("❌ Error al obtener productos:", error));
}

async function openModal(productId, title) {
    console.log("📢 Abriendo modal para producto ID:", productId);
    document.getElementById('productModalLabel').innerText = title;

    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/product/${productId}`);
        const data = await response.json();

        console.log("✅ Datos del producto recibidos:", data);

        if (!data || !data.product) {
            document.getElementById('modalContent').innerHTML = "<p>❌ Producto no encontrado.</p>";
            return;
        }

        const { product, tallas = [], colores = [] } = data;
        // Extraer solo el id de la talla y su nombre
        const tallasProducto = tallas.map(tallaItem => ({
            id: tallaItem.talla.id,
            nombre: tallaItem.talla.cNombreTalla
        }));

        console.log("SE PASSSAAAAAAAAA: ", tallasProducto);
        // 🔹 Estructura base con nombre, descripción y precio
        let modalContentHTML = `
            <div class="product-content">
                <div class="row mt-3">
                    <div class="col-md-6">
                        <label for="productName" class="form-label">Nombre del Producto</label>
                        <input type="text" class="form-control product-name" id="productName" value="${product.name}" required>
                    </div>
                    <div class="col-md-6">
                        <label for="productDescription" class="form-label">Descripción</label>
                        <textarea class="form-control product-description" id="productDescription" rows="3" required>${product.description}</textarea>
                    </div>
                </div>

                <div class="row d-flex align-items-end mt-3">
                    <div class="col-md-3 d-flex flex-column">
                        <label for="productPrice" class="form-label">Precio</label>
                        <input type="text" class="form-control product-price" id="productPrice" value="${product.price}" required>
                    </div>
                    <div class="col-md-2 d-flex align-items-center gap-2">
                        <div class="col">
                            <p class="mb-2">Descuento</p>
                            <label class="toggle-switch toggle-switch-success">
                                <input class="product-discount" type="checkbox" id="discountCheckbox">
                                <span class="toggle-slider round"></span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-3 d-flex flex-column promotionContainer"></div>
                    <div class="col-md-2 d-flex flex-column">
                        <label class="form-label">Nuevo Precio</label>
                        <p id="newPrice" class="form-control bg-light text-center" style="height:38px; margin-bottom: 2px;">0</p>
                    </div>
                    <div class="col-md-2 d-flex flex-column">
                        <label class="form-label">Cod</label>
                        <p id="promoCode" class="form-control bg-light text-center" style="height:38px; margin-bottom: 2px;">N/A</p>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-4 seasonContainer"></div>
                    <div class="col-md-4 categoryContainer"></div>
                </div>

                <div class="row d-flex align-items-end mt-3">
                    <div class="mb-2">
                        <label class="form-label">Subir Imagen</label>
                        <input type="file" class="product-image" accept="image/*">
                        <div class="mt-2 image-preview"></div>
                    </div>
                    <div id="image-warning" class="text-danger mt-2"></div>
                </div>

                <div class="row align-items-end mt-3">
                    <div class="col-md-3">
                        <label for="stock" class="form-label">Stock Total</label>
                        <input type="number" class="form-control product-stock" id="stock" value="${product.stock}" disabled>
                    </div>

                    <div class="col-md-3">
                        <label for="productSizeColor" class="form-label">Agregar talla o color</label>
                        <input type="number" class="form-control" id="productSizeColor" required>
                    </div>

                    <div class="col-md-3">
                        <button type="button" id="addSizeBtn" class="btn btn-primary w-100">Add Size / Color</button>
                    </div>
                </div>

            <h5 class="mt-3">Tallas o Colores del Producto</h5>

            <div class="border p-3 mt-2 rounded position-relative">
                ${generateTallasHTML(tallas)}
                ${generateColoresHTML(colores)}
            </div>
            <!-- Contenedor donde se agregarán las tallas/colores dinámicamente -->
                <div id="sizeContainer"></div>
            </div>
            `;


        // 🔹 Insertar en el modal y mostrarlo
        document.getElementById("modalContent").innerHTML = modalContentHTML;


        /*** TEMPORADAS ***/
        const temporadas = await obtenerTemporadas(); // Asegurar que obtenemos los datos antes de usarlos

        const selectTemporada = document.createElement("select");
        selectTemporada.classList.add("form-select", "form-control", "temporada-name");
        selectTemporada.id = "seasonSelect";


        const labelTemporada = document.createElement("label");
        labelTemporada.setAttribute("for", selectTemporada.id);
        labelTemporada.classList.add("form-label");
        labelTemporada.textContent = "Temporada";

        const temporadaProductoId = product.season; // Suponiendo que `season` está en el producto

        // Agregar las opciones y marcar la seleccionada por defecto
        temporadas.forEach(temporada => {
            const option = document.createElement("option");
            option.value = temporada.id;
            option.textContent = temporada.name;

            if (temporada.id === temporadaProductoId) {
                option.selected = true;
            }

            selectTemporada.appendChild(option);
        });

        // Agregar el select al contenedor
        document.querySelector(".seasonContainer").appendChild(labelTemporada);
        document.querySelector(".seasonContainer").appendChild(selectTemporada);

        /*** CATEGORÍAS ***/
        const categorias = await obtenerCategorias(); // Asegurar que obtenemos los datos antes de usarlos

        const selectCategoria = document.createElement("select");
        selectCategoria.classList.add("form-select", "form-control", "categoria-name");
        selectCategoria.id = "categorySelect";

        const labelCategoria = document.createElement("label");
        labelCategoria.setAttribute("for", selectCategoria.id);
        labelCategoria.classList.add("form-label");
        labelCategoria.textContent = "Categoría";

        // ID de la categoría del producto (es un solo número, no un array)
        const categoriaProductoId = product.category;

        // Agregar las opciones y marcar la seleccionada por defecto
        categorias.forEach(categoria => {
            const option = document.createElement("option");
            option.value = categoria.id;
            option.textContent = categoria.name;

            // Si el ID coincide, seleccionarlo
            if (categoria.id === categoriaProductoId) {
                option.selected = true;
            }

            selectCategoria.appendChild(option);
        });

        // Agregar el select al contenedor de categorías
        document.querySelector(".categoryContainer").appendChild(labelCategoria);
        document.querySelector(".categoryContainer").appendChild(selectCategoria);

        /*** PROMOCIONES ***/
        const promociones = await obtenerPromociones();

        // Obtener el contenedor y limpiarlo antes de agregar nuevos elementos
        const promoContainer = document.querySelector(".promotionContainer");
        promoContainer.innerHTML = "";

        // Crear el checkbox de descuento
        const discountCheckbox = document.querySelector("#discountCheckbox");

        // Crear el <select>
        const selectPromociones = document.createElement("select");
        selectPromociones.classList.add("form-select", "form-control", "promociones-name");
        selectPromociones.id = "promocionSelect";

        // Crear label para el select
        const labelPromociones = document.createElement("label");
        labelPromociones.setAttribute("for", selectPromociones.id);
        labelPromociones.classList.add("form-label");
        labelPromociones.textContent = "Promoción";

        // Obtener promociones activas
        const promocionesActivas = promociones.filter(promo => promo.active);

        // Obtener promociones del producto
        const promocionesProducto = product.promotions || [];
        const tienePromocion = promocionesProducto.length > 0;

        // Si hay promoción, obtener el ID de la primera (suponiendo que solo tiene una activa)
        const promocionProductoId = tienePromocion ? promocionesProducto[0].id : null;

        // Opción inicial "Sin descuento"
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.dataset.discount = "0";
        defaultOption.dataset.code = "";
        defaultOption.textContent = "Seleccione una opción";
        selectPromociones.appendChild(defaultOption);

        // Agregar opciones de promociones activas
        promocionesActivas.forEach(promocion => {
            const option = document.createElement("option");
            option.value = promocion.id;
            option.dataset.discount = promocion.discount_percentage;
            option.dataset.code = promocion.code || "No tiene código";
            option.textContent = promocion.description;

            // Si la promoción del producto coincide, seleccionarla por defecto
            if (promocion.id === promocionProductoId) {
                option.selected = true;
            }

            selectPromociones.appendChild(option);
        });

        // Agregar elementos al contenedor
        promoContainer.appendChild(labelPromociones);
        promoContainer.appendChild(selectPromociones);

        // ✅ Permitir que el usuario active el checkbox manualmente
        discountCheckbox.checked = tienePromocion; // Marcar si ya tiene promoción
        discountCheckbox.disabled = false; // Siempre habilitado para permitir activación manual
        selectPromociones.disabled = !tienePromocion; // Si no hay promoción, desactivar select

        // ✅ Evento para permitir al usuario activar o desactivar la selección de promociones
        discountCheckbox.addEventListener("change", function () {
            selectPromociones.disabled = !this.checked;
        });


        // Seleccionar solo el input dentro del `productDiv`
        const inputs = document.querySelectorAll(".form-control");
        // Agregar los elementos al contenedor
        const promotionContainer = document.querySelector(".promotionContainer");
        promotionContainer.appendChild(labelPromociones);
        promotionContainer.appendChild(selectPromociones);

        discountCheckbox.addEventListener("change", function () {
            selectPromociones.disabled = !this.checked; // Habilita si está marcado, deshabilita si no
        });
        inputs.forEach(input => {
            input.addEventListener("blur", function () {
                if (input.value.trim() !== "") {
                    input.classList.add("is-valid");
                    input.classList.remove("is-invalid");
                } else {
                    input.classList.add("is-invalid");
                    input.classList.remove("is-valid");
                }
            });
        });

        
        // PARA LAS PROMOCIONES//////////////////////////////////////////////////////////////////////////
        const productPriceConver = document.querySelector("#productPrice");
        const rawValue = productPriceConver?.value;
        const productPriceInput = parseFloat(parseFloat(rawValue).toFixed(2)) || 0;

        const newPriceElement = document.querySelector("#newPrice");
        const promoCodeElement = document.querySelector("#promoCode");

        // Función para calcular y actualizar el precio con descuento
        function actualizarPrecioConDescuento() {
            const selectedOption = selectPromociones.options[selectPromociones.selectedIndex];
            let discountPercentage = selectedOption.dataset.discount;
            let promoCode = selectedOption.dataset.code;

            const originalPrice = parseFloat(productPriceInput.value) || 0; // Obtener precio original

            // Si el checkbox NO está activo o no hay descuento, mostrar el precio normal
            if (!discountCheckbox.checked || discountPercentage === "null") {
                newPriceElement.textContent = originalPrice.toFixed(2);
                promoCodeElement.textContent = "No tiene código";
                return;
            }

            // Calcular precio con descuento
            discountPercentage = parseFloat(discountPercentage) || 0;
            const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));

            // Mostrar precio actualizado
            newPriceElement.textContent = discountedPrice.toFixed(2);
            promoCodeElement.textContent = (promoCode && promoCode !== "null" && promoCode.trim() !== "") ? promoCode : "No tiene código";
        }

        // Evento para cambiar el precio según la promoción seleccionada
        selectPromociones.addEventListener("change", actualizarPrecioConDescuento);

        // Evento para actualizar cuando cambia el estado del checkbox
        discountCheckbox.addEventListener("change", actualizarPrecioConDescuento);
        // Ejecutar al cargar la página para establecer el precio correcto por defecto
        actualizarPrecioConDescuento();


        // PARA LAS IMÁGENES//////////////////////////////////////////////////////////////////////////
        // PARA LAS IMÁGENES ////////////////////////////////////////////////////////////////////////
        const fileInput = document.querySelector(".product-image");
        const previewContainer = document.querySelector(".image-preview");
        const warningMessage = document.getElementById("image-warning");

        // Limpiar la previsualización antes de agregar imágenes nuevas
        previewContainer.innerHTML = "";

        // Cargar imágenes existentes directamente desde `product.imagenes`
        const imagenes = product.imagenes || []; // Evitar undefined
        imagenes.forEach(img => {
            agregarImagenPrevisualizacion(img.cRutaImagen, img.id, true);
        });

        // Función para agregar imágenes a la previsualización
        function agregarImagenPrevisualizacion(src, id = null, existente = false) {
            const imageWrapper = document.createElement("div");
            imageWrapper.classList.add("position-relative", "m-1");
            imageWrapper.style.display = "inline-block";

            const img = document.createElement("img");
            img.src = src; // Ya debe estar en Base64 si es nueva
            img.classList.add("img-thumbnail");
            img.style.width = "100px";
            img.style.height = "100px";
            if (id) img.dataset.id = id; // Guardar ID de imagen existente

            const closeButton = document.createElement("button");
            closeButton.innerHTML = "&times;";
            closeButton.classList.add("btn", "btn-danger", "btn-sm", "position-absolute");
            closeButton.style.top = "5px";
            closeButton.style.right = "5px";

            closeButton.addEventListener("click", function () {
                imageWrapper.remove();
                if (!existente) {
                    actualizarInputArchivos(src);
                } else {
                    eliminarImagenServidor(id);
                }
            });

            imageWrapper.appendChild(img);
            imageWrapper.appendChild(closeButton);
            previewContainer.appendChild(imageWrapper);
        }

        // Función para convertir imagen a Base64
        function convertirImagenABase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // Evento de previsualización de imágenes nuevas
        fileInput.addEventListener("change", async function () {
            if (!fileInput.files.length) return;

            let currentFiles = Array.from(fileInput.files);
            let existingImages = previewContainer.querySelectorAll("img").length;

            // Si ya hay imágenes en el contenedor, añadir solo las que faltan hasta 6
            if (existingImages + currentFiles.length > 6) {
                warningMessage.textContent = "Solo puedes subir hasta 6 imágenes.";
                setTimeout(() => warningMessage.textContent = "", 3000);
                currentFiles = currentFiles.slice(0, 6 - existingImages);
            }

            for (const file of currentFiles) {
                try {
                    const base64Image = await convertirImagenABase64(file);
                    agregarImagenPrevisualizacion(base64Image); // Agregar la imagen en Base64
                } catch (error) {
                    console.error("Error al convertir imagen:", error);
                }
            }

            fileInput.value = "";
        });

        // Función para eliminar una imagen del servidor
        async function eliminarImagenServidor(imagenId) {
            try {
                const response = await fetch(`/delete/imagen/${imagenId}/`, { method: "DELETE" });
                if (!response.ok) throw new Error("Error al eliminar la imagen");
                console.log(`Imagen ${imagenId} eliminada correctamente.`);
            } catch (error) {
                console.error("Error eliminando imagen:", error);
            }
        }


        const productSizeColorInput = document.querySelector("#productSizeColor");
        // Código para el botón de agregar talla
        let i = 0; // Contador para las opciones dinámicas
        const addSizeBtn = document.querySelector("#addSizeBtn");


        addSizeBtn.addEventListener("click", function () {
            const cantidad = parseInt(productSizeColorInput.value, 10); // Obtiene el número ingresado
            if (isNaN(cantidad) || cantidad <= 0) {
                alert("Por favor, ingrese un número válido.");
                return;
            }

            for (let j = 0; j < cantidad; j++) {
                agregarTallaColor(i, tallasProducto); // 🔥 Genera la cantidad ingresada
                i++;
            }
        });

        new bootstrap.Modal(document.getElementById("productModal")).show();

    } catch (error) {
        console.error("❌ Error al obtener detalles del producto:", error);
    }
}


function showBootstrapAlert(message, type = "success") {
    const alertContainer = document.getElementById("alert-container");
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show shadow-lg" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;

    // Insertar alerta en el contenedor
    alertContainer.innerHTML = alertHTML;

    // Eliminar automáticamente después de 3 segundos
    setTimeout(() => {
        const alertElement = alertContainer.querySelector(".alert");
        if (alertElement) {
            bootstrap.Alert.getOrCreateInstance(alertElement).close();
        }
    }, 3000);
}


// 🎯 Evento para el botón "Actualizar Producto"
document.addEventListener("click", async function (event) {
    if (event.target.id === "btn-actualizar") {
        event.preventDefault();


        // ✅ Obtener datos del producto a actualizar
        const datosProducto = await obtenerDatosProducto(); // Asegúrate de que esta función obtiene los datos correctamente
        console.log("📦 Datos del producto a actualizar:", JSON.stringify(datosProducto, null, 2));
        // 🔥 Obtener el token del localStorage
        const token = localStorage.getItem("access_token");

        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            return;
        }

        // console.log('PARA ACTUALIZAR: ', datosProducto);

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const respuesta = await fetch(`${baseUrl}/update_product/`, {  // Ruta de tu API en Django
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(datosProducto)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                console.log("✅ Producto actualizado con éxito:", resultado);
                //alert("Producto actualizado correctamente.");
                showBootstrapAlert("✅ Producto actualizado correctamente.", "success");
                 // Cerrar modal después de la actualización
                const modalElement = document.getElementById('productModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide(); // 🔥 Cierra el modal
                }

                loadProducts(); // 🔄 Recargar la lista de productos
            } else {
                console.error("❌ Error en la actualización:", resultado);
                alert("Error al actualizar el producto. Ver consola.");
            }
        } catch (error) {
            console.error("❌ Error al actualizar el producto:", error);
            alert("Hubo un error inesperado.");
        }
    
    
    }
});


async function obtenerCategorias() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/categories/`);
        if (!response.ok) throw new Error("Error al obtener categorias");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

async function obtenerPromociones() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/promociones/`);
        if (!response.ok) throw new Error("Error al obtener las Promociones");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

async function obtenerTallas() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/sizes/`);
        if (!response.ok) throw new Error("Error al obtener las Promociones");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

async function obtenerTemporadas() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/seasons/`);
        if (!response.ok) throw new Error("Error al obtener temporadas");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

let tallas = []; // Variable global
let tallasProducto = [];

async function cargarTallas() {
    tallas = await obtenerTallas(); // Cargar tallas desde la API
}

// Llamar a cargarTallas antes de usar la variable
cargarTallas();

// Para editar

// 🔹 Función para generar HTML de tallas
function generateTallasHTML(tallas) {
    if (!tallas.length) return "<p class='text-muted'>No hay tallas disponibles.</p>";

    return tallas.map((t, index) => `
        <div class="border p-3 mt-2 rounded position-relative talla-container"> 
            <div class="d-flex justify-content-end position-absolute top-0 end-0 m-2 gap-2">
                <button type="button" class="btn btn-secondary btn-sm toggle-collapse">−</button>
                <button type="button" class="btn-close"></button>
            </div>

            <h6 class="tallas" style="color: #73252f; font-weight: bold;">Talla ${index + 1}</h6>
            <div class="d-flex align-items-center gap-4">
                <div class="col-sm-4">
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label">Talla</label>
                        <div class="col-sm-5">
                            <select class="form-select talla-name">
                                <option value="${t.talla.id}" selected>${t.talla.cNombreTalla}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label">Stock</label>
                        <div class="col-sm-5">
                            <input type="number" class="form-control stock-talla" value="${t.stock}" min="0">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}


// 🔹 Función para generar HTML de colores

function generateColoresHTML(colores) {
    if (!colores.length) return "<p class='text-muted'>No hay colores disponibles.</p>";

    return colores.map((c, index) => `
        <div class="border p-3 mt-2 rounded position-relative color-container">
            <div class="d-flex justify-content-end position-absolute top-0 end-0 m-2 gap-2">
                <button type="button" class="btn btn-secondary btn-sm toggle-collapse">−</button>
                <button type="button" class="btn-close"></button>
            </div>

            <h6 class="tallas" style="color: #73252f; font-weight: bold;">Color ${index + 1}</h6>
        
            <div class="d-flex align-items-center gap-4">
                <!-- Color -->
                <div class="d-flex align-items-center">
                    <label class="col-form-label me-2">Color:</label>
                    <div class="border px-3 py-1 rounded color-label" style="background-color: ${c.color};">${c.color}</div>
                </div>

                <!-- Stock -->
                <div class="d-flex align-items-center">
                    <label class="col-form-label me-2">Stock:</label>
                    <input type="number" class="form-control col-sm-10 stock-color" value="${c.stock}" min="0" style="width: 80px;">
                </div>
            </div>
        </div>
    `).join('');
}

async function agregarTallaColor(index, tallasProducto) {
    if (tallas.length === 0) {
        await cargarTallas(); // Asegura que las tallas estén disponibles
    }

    const tallasProductoIDs = tallasProducto.map(talla => talla.id);
    const tallasDisponibles = tallasProductoIDs.length
        ? tallas.filter(tallaGlobal => !tallasProductoIDs.includes(tallaGlobal.id))
        : tallas;

    const productDiv = document.createElement("div");
    productDiv.classList.add("border", "p-3", "mt-2", "rounded", "position-relative", "talla-container", "color-container");

    productDiv.innerHTML = `
        <div class="d-flex justify-content-end position-absolute top-0 end-0 m-2 gap-2">
            <button type="button" class="btn btn-secondary btn-sm toggle-collapse">−</button>
            <button type="button" class="btn-close"></button>
        </div>

        <h6 class="tallas" style="color: #73252f; font-weight: bold;">Nueva-talla-color ${index + 1}</h6>
        <div class="size-content row">
            <!-- Talla y stock -->
            <div class="col-md-6">
                <div class="form-group">
                    <label class="form-label">Tallas</label>
                    <select class="form-select talla-name" id="sizesSelect-${index}" ${tallasProducto.length === 0 ? "disabled" : ""}>
                        <option value="">Seleccione una talla</option>
                    </select>
                </div>
                <div class="form-group mt-2">
                    <label class="form-label">Stock</label>
                    <input type="number" class="form-control stock-talla" id="stockTalla_${index}" value="1" min="0" ${tallasProducto.length === 0 ? "disabled" : ""}>
                </div>
            </div>

            <!-- Color y stock -->
            <div class="col-md-6">
                <div class="form-group d-flex align-items-center gap-2">
                    <label for="colorPicker_${index}" class="form-label">Color</label>
                    <input type="color" class="form-control form-control-color colorPicker" id="colorPicker_${index}" value="#ffffff"
                        style="width: 50px; height: 38px;" ${tallasProducto.length === 0 ? "" : "disabled"}>
                    <span class="border px-3 py-1 rounded color-label" style="background-color: #fff;">#FFF</span>
                </div>
                <div class="form-group mt-2">
                    <label class="form-label">Stock Color</label>
                    <input type="number" class="form-control stock-color" id="stockColor_${index}" value="1" min="0" ${tallasProducto.length === 0 ? "" : "disabled"}>
                </div>
            </div>
        </div>
    `;

    // Insertar tallas filtradas en el select
    const selectTallas = productDiv.querySelector(".talla-name");
    tallasDisponibles.forEach(talla => {
        const option = document.createElement("option");
        option.value = talla.id;
        option.textContent = talla.cNombreTalla;
        selectTallas.appendChild(option);
    });

    // Actualizar color
    const colorPicker = productDiv.querySelector(".colorPicker");
    const colorLabel = productDiv.querySelector(".color-label");

    colorPicker.addEventListener("input", function () {
        const selectedColor = this.value.toUpperCase();
        colorLabel.style.backgroundColor = selectedColor;
        colorLabel.textContent = selectedColor;
    });

    // Botón de eliminar
    productDiv.querySelector(".btn-close").addEventListener("click", function () {
        productDiv.remove();
    });

    // Botón para colapsar
    const toggleButton = productDiv.querySelector(".toggle-collapse");
    const productContent = productDiv.querySelector(".size-content");

    toggleButton.addEventListener("click", function () {
        productContent.style.display = productContent.style.display === "none" ? "block" : "none";
        toggleButton.textContent = productContent.style.display === "none" ? "+" : "−";
    });

    sizeContainer.appendChild(productDiv);
}


async function obtenerDatosProducto() {
    const datosProducto = {
        id: productId ? parseInt(productId) : null,
        name: document.getElementById("productName")?.value.trim() || "",
        description: document.getElementById("productDescription")?.value.trim() || "",
        price: parseFloat(parseFloat(document.getElementById("productPrice")?.value).toFixed(2)) || 0,
        stock: parseInt(document.getElementById("stock")?.value) || 0,
        season: parseInt(document.getElementById("seasonSelect")?.value) || null,
        category: parseInt(document.getElementById("categorySelect")?.value) || null,
        promotions: [],
        tallas: [],
        colores: []
    };

    // Obtener promoción seleccionada
    const selectPromocion = document.getElementById("promocionSelect");
    if (selectPromocion) {
        const selectedOption = selectPromocion.selectedOptions[0];
        if (selectedOption) {
            datosProducto.promotions.push(parseInt(selectPromocion.value));
        }
    }

    // Obtener imágenes existentes
    const imagenesExistentes = Array.from(document.querySelectorAll(".image-preview img"))
        .map(img => ({ id: img.dataset.id || null, src: img.src }));

    // Obtener imágenes nuevas del input
    const fileInput = document.querySelector(".product-image");
    let imagenesNuevas = [];
    if (fileInput?.files?.length > 0) {
        imagenesNuevas = await Promise.all(
            Array.from(fileInput.files).map(file => convertirImagenABase64(file).then(src => ({ id: null, src })))
        );
    }

    // Unir imágenes
    datosProducto.imagenes = [...imagenesExistentes, ...imagenesNuevas];

    datosProducto.tallas = Array.from(document.querySelectorAll(".talla-container"))
        .map(el => {
            const talla = parseInt(el.querySelector(".talla-name")?.value);
            const stock = parseInt(el.querySelector(".stock-talla")?.value) || 0;
            return talla && stock > 0 ? { talla, stock } : null;
        })
        .filter(Boolean); // Filtrar valores nulos

    // 🔹 Obtener colores y sus stocks SOLO si no hay tallas
    if (datosProducto.tallas.length === 0) {
        const colorContainers = document.querySelectorAll(".color-container");

        datosProducto.colores = Array.from(colorContainers)
            .map(el => {
                const color = el.querySelector(".color-label")?.textContent.trim(); // Usamos el texto del label
                const stock = parseInt(el.querySelector(".stock-color")?.value) || 0;
                return color && stock > 0 ? { color, stock } : null;
            })
            .filter(Boolean);
    } else {
        datosProducto.colores = []; // Si hay tallas, los colores deben estar vacíos
    }

    console.log("🔍 Datos organizados del producto:", datosProducto);
    return datosProducto;
}


function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault(); // Evita la navegación normal

            let url = this.getAttribute("data-url");
            if (url) {
                fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
                    .then(response => response.text())
                    .then(html => {
                        let contentContainer = document.querySelector("#contenido-dinamico");
                        contentContainer.innerHTML = html;

                        history.pushState({}, "", url); // Cambia la URL sin recargar
                        actualizarMenuActivo(url);

                        // 🔥 Esperar a que el DOM se actualice antes de ejecutar `loadProducts()`
                        setTimeout(() => {
                            if (url === "/dash-allProducts/") {
                                console.log("🚀 Cargando productos después de la actualización del DOM...");
                                loadProducts();
                            }
                        }, 100); // Pequeño retraso para asegurarse de que el DOM se actualizó
                    })
                    .catch(error => console.error("❌ Error al cargar la página:", error));
            }
        });
    });

    // Manejar el botón "atrás" del navegador
    // window.addEventListener("popstate", function () {
    //     let currentUrl = window.location.pathname;
    
    //     fetch(currentUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } })
    //         .then(response => response.text())
    //         .then(html => {
    //             document.querySelector("#contenido-dinamico").innerHTML = html;
    //             actualizarMenuActivo(currentUrl);
    //         })
    //         .catch(error => console.error("❌ Error al manejar popstate:", error));
    // });
}


// Función para actualizar el menú activo
function actualizarMenuActivo(url) {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".collapse").forEach(submenu => submenu.classList.remove("show"));

    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("data-url") === url) {
            let parentItem = link.closest(".nav-item");
            if (parentItem) {
                parentItem.classList.add("active");

                let parentCollapse = link.closest(".collapse");
                if (parentCollapse) {
                    parentCollapse.classList.add("show");
                    let parentNavItem = parentCollapse.closest(".nav-item");
                    if (parentNavItem) {
                        parentNavItem.classList.add("active");
                    }
                }
            }
        }
    });
}

// 🔥 Ejecutamos la navegación AJAX y verificamos si estamos en "/dash-allProducts/"
setupNavigation();

// if (window.location.pathname === "/dash-allProducts/") {
//     loadProducts();
// }

document.addEventListener("DOMContentLoaded", function () {

    loadProducts();

});
