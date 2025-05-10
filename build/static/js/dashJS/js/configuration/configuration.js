
// document.querySelectorAll('.btnAdd-season').forEach(button => {
//     button.addEventListener('click', event => {

//     });
// });

function modalUpdateSeason(seasonId, title) {
    const modal = new bootstrap.Modal(document.getElementById("exampleModalUpdate"));
    document.getElementById("exampleModalLabel").textContent = title;

    // Limpiar campos antes de cargar datos
    document.querySelector(".season-nameUpdate").value = "";
    document.querySelector(".season-descriptionUpdate").value = "";

    //Si es edición, obtener datos y llenar el modal
    if (seasonId) {
        const baseUrl = document.body.dataset.apiUrl;
        fetch(`${baseUrl}/season/${seasonId}/`)
            .then(response => response.json())
            .then(data => {
                document.querySelector(".season-nameUpdate").value = data.name || "";
                document.querySelector(".season-descriptionUpdate").value = data.description || "";
            })
            .catch(error => console.error("❌ Error al obtener la temporada:", error));
    }

    modal.show();
}

function loadSeason() {
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get/seasons/`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector(".season-orders-table tbody");
            if (!tbody) return; // Evitar error si la tabla no existe

            tbody.innerHTML = ""; // Limpiar contenido previo

            data.results.forEach((season, index) => { // Corregido: data.results
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${index + 1}</td>  
                    <td>${season.name}</td>  
                    <td>${season.description}</td>  
                    <td>
                        <button type="button" class="btn btn-info btn-sm btn-icon-text mr-3 editSeason-btn" data-id="${season.id}">
                            Edit <i class="typcn typcn-edit btn-icon-append"></i>
                        </button>
                    </td>
                `;

                tbody.appendChild(row);
            });

            document.querySelectorAll('.editSeason-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const seasonId = event.currentTarget.dataset.id; // ✅ Usar const
                    console.log("ID Season: ", seasonId)
                    if (!seasonId) {
                        console.error("❌ Error: seasonId es undefined");
                        return;
                    }

                    modalUpdateSeason(seasonId, "Editar Season");
                });
            });


        })
        .catch(error => console.error("Error al obtener las temporadas:", error));
}


function modalUpdateCategory(categoryId, title) {
    const modal = new bootstrap.Modal(document.getElementById("modalCategoryUpdate"));
    document.getElementById("exampleModalLabel").textContent = title;

    //Limpiar campos antes de cargar datos
    document.querySelector(".category-nameUpdate").value = "";
    document.querySelector(".category-descriptionUpdate").value = "";

    //Si es edición, obtener datos y llenar el modal
    if (categoryId) {
        const baseUrl = document.body.dataset.apiUrl;
        fetch(`${baseUrl}/product-category/${categoryId}/`)
            .then(response => response.json())
            .then(data => {
                document.querySelector(".category-nameUpdate").value = data.name || "";
                document.querySelector(".category-descriptionUpdate").value = data.description || "";
            })
            .catch(error => console.error("❌ Error al obtener la temporada:", error));
    }

    modal.show();
}


function loadCategory() {
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get/categories/`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector(".category-orders-table tbody");
            if (!tbody) return; // Evitar error si la tabla no existe

            tbody.innerHTML = ""; // Limpiar contenido previo

            data.results.forEach((category, index) => { // 🔹 index empieza en 0
                const row = document.createElement("tr");

                row.innerHTML = `
                <td>${index + 1}</td>  <!-- 🔹 Enumeración automática -->
                <td>${category.name}</td>  
                <td>${category.description}</td>  
                <td>
                    <button type="button" class="btn btn-info btn-sm btn-icon-text mr-3 editCategory-btn" data-id="${category.id}">
                            Edit <i class="typcn typcn-edit btn-icon-append"></i>
                        </button>
                </td>
            `;

                tbody.appendChild(row);
            });

            document.querySelectorAll('.editCategory-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const categoryId = event.currentTarget.dataset.id; // ✅ Usar const
                    console.log("ID Category: ", categoryId)
                    if (!categoryId) {
                        console.error("❌ Error: categoryId es undefined");
                        return;
                    }

                    modalUpdateCategory(categoryId, "Editar Category");
                });
            });

        })
        .catch(error => console.error("Error al obtener las categorías:", error));
}

function modalUpdateSize(sizeId, title) {
    const modal = new bootstrap.Modal(document.getElementById("modalSizeUpdate"));
    document.getElementById("exampleModalLabel").textContent = title;
    const sizeInput = document.querySelector(".size-nameUpdate");

    // Limpiar campos antes de cargar datos
    sizeInput.value = "";

    const token = getToken(); // Obtener el token

    // Si es edición, obtener datos y llenar el modal
    if (sizeId) {
        const baseUrl = document.body.dataset.apiUrl;
        fetch(`${baseUrl}/talla/${sizeId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(data => {
                sizeInput.value = data.cNombreTalla || "";
            })
            .catch(error => console.error("❌ Error al obtener la talla:", error));
    }

    // Evento para actualizar la talla cuando se haga clic en "Guardar"
    document.getElementById("update-size").onclick = function () {
        const updatedName = sizeInput.value;

        const baseUrl = document.body.dataset.apiUrl;
        fetch(`${baseUrl}/talla/${sizeId}/`, {
            method: "PATCH", // ✅ PATCH para actualizar parcialmente
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ cNombreTalla: updatedName }) // Enviar solo el campo actualizado
        })
            .then(response => response.json())
            .then(data => {
                //console.log("✅ Talla actualizada:", data);
                alert("✅ Talla actualizada correctamente");

                modal.hide(); // Cerrar modal después de actualizar
                loadSize();
            })
            .catch(error => console.error("❌ Error al actualizar la talla:", error));
    };

    modal.show();
}

function setupPriceInputValidation(input) {
    input.addEventListener("input", (e) => {
        let value = e.target.value;

        // Eliminar caracteres no numéricos excepto el punto
        value = value.replace(/[^0-9.]/g, "");

        // Evitar múltiples puntos
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts[1];
        }

        // Si tiene decimales, limitar a 2 dígitos después del punto
        if (value.includes('.')) {
            let [integerPart, decimalPart] = value.split('.');
            decimalPart = decimalPart.substring(0, 2); // máximo 2 decimales
            value = integerPart + (decimalPart ? '.' + decimalPart : '.');
        }

        e.target.value = value;
    });
}

function modalUpdateShipping(shippingId, title) {
    const modal = new bootstrap.Modal(document.getElementById("modalShippingUpdate"));
    document.getElementById("shippingModalLabel").textContent = title;

    const nameShippingInput = document.getElementById("nameShippingUpdate");
    const tiempoShippingInput = document.getElementById("tiempoShippingUpdate");
    const precioShippingInput = document.getElementById("precioShippingUpdate");

    // 🔥 Aplicar la validación al input de precio
    setupPriceInputValidation(precioShippingInput);

    // Limpiar campos antes de cargar datos
    nameShippingInput.value = "";
    tiempoShippingInput.value = "";
    precioShippingInput.value = "";

    const token = getToken(); // Obtener el token
    const baseUrl = document.body.dataset.apiUrl;
    // Si es edición, obtener datos y llenar el modal
    if (shippingId) {
        fetch(`${baseUrl}/api/shipping/${shippingId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(data => {
                nameShippingInput.value = data.name || "";
                tiempoShippingInput.value = data.time_to_delivery || "";
                precioShippingInput.value = data.price || "";
            })
            .catch(error => console.error("❌ Error al obtener el envío:", error));
    }

    // Evento para actualizar el envío cuando se haga clic en "Guardar"
    document.getElementById("Update-shipping").onclick = function () {
        const nameShipping = nameShippingInput.value.trim();
        const tiempoShipping = tiempoShippingInput.value.trim();
        const precioShipping = precioShippingInput.value.trim();
        const baseUrl = document.body.dataset.apiUrl;

        fetch(`${baseUrl}/api/shipping/${shippingId}/`, {
            method: "PATCH", // ✅ PATCH para actualizar parcialmente
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nameShipping,
                time_to_delivery: tiempoShipping,
                price: precioShipping
            })
        })
            .then(response => response.json())
            .then(data => {
                alert("✅ Envío actualizado correctamente");
                modal.hide(); // Cerrar modal después de actualizar
                loadShipping(); // Recargar la lista
            })
            .catch(error => console.error("❌ Error al actualizar el envío:", error));
    };

    modal.show();
}


function loadSize() {
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get/sizes/`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector(".size-orders-table tbody");
            if (!tbody) return; // Evitar error si la tabla no existe

            tbody.innerHTML = ""; // Limpiar contenido previo

            data.results.forEach((size, index) => { // Corregido: data.results
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${index + 1}</td>  
                    <td>${size.cNombreTalla}</td> 
                    <td>
                        <button type="button" class="btn btn-info btn-sm btn-icon-text mr-3 editSize-btn" data-id="${size.id}">
                            Edit <i class="typcn typcn-edit btn-icon-append"></i>
                        </button>
                `;

                tbody.appendChild(row);
            });


            document.querySelectorAll('.editSize-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const sizeId = event.currentTarget.dataset.id; // ✅ Usar const
                    console.log("ID Size: ", sizeId)
                    if (!sizeId) {
                        console.error("❌ Error: sizeId es undefined");
                        return;
                    }

                    modalUpdateSize(sizeId, "Editar Size");
                });
            });

        })
        .catch(error => console.error("Error al obtener las temporadas:", error));
}

function loadShipping() {
    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/api/shipping`, {  // Asegúrate que tu endpoint es correcto
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector(".shipping-orders-table tbody");
            if (!tbody) return; // Seguridad

            tbody.innerHTML = ""; // Limpiar contenido anterior

            data.results.forEach((shipping, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${shipping.name}</td>
                <td>${shipping.time_to_delivery}</td>
                <td>${shipping.price}</td>
                <td>
                    <button type="button" class="btn btn-info btn-sm btn-icon-text mr-3 btn-edit-shipping" data-id="${shipping.id}">
                        Edit <i class="typcn typcn-edit btn-icon-append"></i>
                    </button>
                </td>
            `;

                tbody.appendChild(row);
            });

            document.querySelectorAll('.btn-edit-shipping').forEach(button => {
                button.addEventListener('click', event => {
                    const shippingId = event.currentTarget.dataset.id;
                    console.log("ID del shipping:", shippingId);
                    if (!shippingId) {
                        console.error("❌ Error: shippingId es undefined");
                        return;
                    }

                    modalUpdateShipping(shippingId, "Editar Shipping");
                });
            });
        })
        .catch(error => {
            console.error('Error cargando los shippings:', error);
        });
}


function loadPromotion() {
    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get/promociones/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("promotion-table-body");
            if (!tbody) return;

            tbody.innerHTML = "";

            data.results.forEach((promotion, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                <td  style="cursor: pointer;">${index + 1}</td>
                <td style="cursor: pointer;">${promotion.name}</td>
                <td style="cursor: pointer;">${promotion.description}</td>
                <td style="cursor: pointer;">${promotion.discount_percentage}%</td>
                <td style="cursor: pointer;">${promotion.code ? promotion.code : "SIN CÓDIGO"}</td>
                <td style="cursor: pointer;">${promotion.start_date ? new Date(promotion.start_date).toLocaleDateString() : "SIN FECHA"}</td>
                <td style="cursor: pointer;">${promotion.end_date ? new Date(promotion.end_date).toLocaleDateString() : "SIN FECHA"}</td>
            `;

                row.dataset.promotionId = promotion.id;
                row.classList.add("clickable-row"); // Para hover y cursor

                row.addEventListener('click', () => {
                    const promoId = row.dataset.promotionId;
                    window.location.href = `/dash-updateDescuento/?id=${promoId}`;
                });

                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("❌ Error al obtener las promociones:", error));
}


function loadBanner() {
    const baseUrl = document.body.dataset.apiUrl;
    fetch(`${baseUrl}/get/banerinicio-publico/`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                const banner = data.results[0]; // Primer resultado de la API

                // Contenedor principal donde se insertará el contenido dinámico
                const bannerContainer = document.getElementById("banner-container");
                if (!bannerContainer) {
                    console.error("❌ No se encontró el contenedor del banner.");
                    return;
                }

                // Limpiar contenido anterior
                bannerContainer.innerHTML = "";

                // Crear la estructura del banner con los datos obtenidos
                bannerContainer.innerHTML = `
                <div class="col-12 grid-margin stretch-card">
                    <div class="card">
                        <div class="card-body">
                            <div class="forms-sample">
                                <div class="form-group">
                                    <label for="exampleInputName1">Encabezado de la Página inicio:</label>
                                    <input type="text" class="form-control" id="exampleInputName1" placeholder="Encabezado" value="${banner.encabezado}" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Imagen del Banner:</label>
                                    <div>
                                        <img id="banner-img" src="${banner.imagen_banner}" class="img-fluid" alt="Imagen del Banner" style="height: 200px; width: 100%;">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Imagen Extra:</label>
                                    <div>
                                        <img id="extra-img" src="${banner.imagen_extra}" class="img-fluid" alt="Imagen Extra" style="height: 200px; width: 100%;">
                                    </div>
                                </div>
                                <button type="button" class="btn btn-primary mr-2" id="editar-Banner" data-id="${banner.id}">Editar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
                // Agregar funcionalidad al botón "Editar"
                document.getElementById("editar-Banner").addEventListener("click", (event) => {
                    const bannerId = event.target.getAttribute("data-id");
                    console.log(`🖊️ Editando el banner con ID: ${bannerId}`);

                    // Aquí puedes abrir el modal u otra acción
                    openBannerModalUpdate(bannerId);
                });
            }
        })
        .catch(error => console.error("❌ Error al obtener el banner:", error));
}

async function loadImageCategory() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/category-images/`);
        if (!response.ok) throw new Error("Error al obtener imágenes");

        const data = await response.json();
        const resultados = data.results;

        const container = document.getElementById("category-image-container");
        container.innerHTML = ""; // Limpiar contenido previo

        // Crear el contenedor de la tarjeta
        const card = document.createElement("div");
        card.className = "card";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        const formSample = document.createElement("div");
        formSample.className = "forms-sample";

        resultados.forEach((item, index) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";

            const label = document.createElement("label");
            label.textContent = item.caption;

            const imgDiv = document.createElement("div");

            const img = document.createElement("img");
            img.src = item.image;
            img.alt = "Imagen de " + item.caption;
            img.className = "img-fluid";
            img.style = "height: 200px; width: 100%;";
            img.id = index === 0 ? "banner-img" : "extra-img"; // El primero como banner

            imgDiv.appendChild(img);
            formGroup.appendChild(label);
            formGroup.appendChild(imgDiv);
            formSample.appendChild(formGroup);
        });

        // Botón de editar
        const editarBtn = document.createElement("button");
        editarBtn.type = "button";
        editarBtn.className = "btn btn-primary mr-2";
        editarBtn.id = "editar-Banner";
        editarBtn.textContent = "Editar";
        editarBtn.setAttribute("data-id", resultados[0]?.id || "");

        editarBtn.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById("bannerModalCategoryUpdate"));
            modal.show();

            const modalCards = document.querySelectorAll("#bannerModalCategoryUpdate .card");

            resultados.forEach((item, index) => {
                const card = modalCards[index];
                if (!card) return; // Si no hay tarjeta en esa posición, salta

                // Rellenar el select
                const select = card.querySelector(".category-selectUpdate");
                if (select) {
                    select.innerHTML = `
                        <option value="${item.category}" selected>${item.caption}</option>
                    `;
                    select.setAttribute("data-id", item.id); // Guardar ID en el select
                }

                // Actualizar el label
                const labelSpan = card.querySelector(".categorySelectedUpdate");
                if (labelSpan) {
                    labelSpan.textContent = item.caption;
                }

                // Cargar imagen
                const imgPreview = card.querySelector(".preview-image");
                if (imgPreview) {
                    imgPreview.src = item.image;
                    imgPreview.classList.remove("d-none");
                }

                // Mostrar en consola todo lo que se está cargando
                console.log(`--- Card ${index + 1} ---`);
                console.log(`ID: ${item.id}`);
                console.log(`Caption: ${item.caption}`);
                console.log(`Categoría ID: ${item.category}`);
                console.log(`Imagen URL: ${item.image}`);
            });
        });

        formSample.appendChild(editarBtn);
        cardBody.appendChild(formSample);
        card.appendChild(cardBody);
        container.appendChild(card);

    } catch (error) {
        console.error("❌ Error al cargar las imágenes:", error);
    }
}



//PARA LAS TENDENCIAS
async function loadTendencias() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/carrusel-productos/`);
        if (!response.ok) throw new Error(`Error en la API de tendencias (${response.status})`);

        const data = await response.json();
        const container = document.getElementById("tendencias-container");
        container.innerHTML = ""; // Limpiar contenido previo

        const fragment = document.createDocumentFragment(); // Para mejor rendimiento

        for (const tendencia of data.results) {
            const token = getToken();
            try {
                // Construir URL del producto
                const productoURL = `${baseUrl}/product/${tendencia.producto}`;
                console.log(`🔍 Buscando producto: ${productoURL}`);

                const productoResponse = await fetch(productoURL);
                if (!productoResponse.ok) {
                    throw new Error(`Error en la API de productos (${productoResponse.status}): ${productoURL}`);
                }

                const productoData = await productoResponse.json();
                console.log(`✅ Producto encontrado:`, productoData);

                // Crear el elemento HTML
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("col-12", "grid-margin", "stretch-card");
                cardDiv.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <div class="forms-sample">
                                <div class="form-group">
                                    <label>Nombre del producto:</label>
                                    <input type="text" class="form-control" value="${productoData.product.name}" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Número tendencia:</label>
                                    <input type="text" class="form-control" value="${tendencia.numTendencia}" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Título de la tendencia:</label>
                                    <input type="text" class="form-control" value="${tendencia.titleTendencia}" disabled>
                                </div>
                                <button type="button" class="btn btn-primary mr-2 editar-tendencia" 
                                data-id="${tendencia.id}" 
                                data-product-id="${productoData.product.id}">Editar</button>
                            </div>
                        </div>
                    </div>
                `;
                fragment.appendChild(cardDiv);

            } catch (error) {
                console.error(`❌ Error al obtener el producto (${tendencia.producto}):`, error);
            }
        }

        container.appendChild(fragment); // Insertar todo a la vez
        // Delegación de eventos para los botones
        container.addEventListener("click", function (event) {
            if (event.target.classList.contains("editar-tendencia")) {
                const tendenciaId = event.target.getAttribute("data-id");
                const productoId = event.target.getAttribute("data-product-id");
                editarTendencia(tendenciaId, productoId);
            }
        });

    } catch (error) {
        console.error("❌ Error al obtener las tendencias:", error);
    }
}


document.addEventListener("DOMContentLoaded", loadBanner);

// Llamar a la función cuando cargue la página
document.addEventListener("DOMContentLoaded", loadTendencias);


function openBannerModalUpdate(bannerId) {
    let modal = new bootstrap.Modal(document.getElementById("bannerModalUpdate"));
    modal.show();

    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    // Obtener los datos del banner desde la API
    fetch(`${baseUrl}/api/banerinicio/${bannerId}/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(data => {
            // Llenar los campos con los datos del banner
            document.getElementById("encabezadoUpdate").value = data.encabezado;

            // Mostrar imagen del banner
            let bannerPreview = document.getElementById("bannerPreview");
            bannerPreview.src = data.imagen_banner;
            bannerPreview.classList.remove("d-none");

            // Mostrar imagen adicional
            let extraPreview = document.getElementById("extraPreview");
            extraPreview.src = data.imagen_extra;
            extraPreview.classList.remove("d-none");

            // Agregar evento al botón de actualización
            document.getElementById("add-bannerUpdate").onclick = function () {
                updateBanner(bannerId, token);
            };
        })
        .catch(error => console.error("Error al obtener el banner:", error));
}

// Función para actualizar el banner
async function updateBanner(bannerId, token) {
    let encabezado = document.getElementById("encabezadoUpdate").value;
    let bannerImageFile = document.getElementById("bannerImageUpdate").files[0];
    let extraImageFile = document.getElementById("extraImageUpdate").files[0];

    // Validar que los campos no estén vacíos
    if (!encabezado || !bannerImageFile || !extraImageFile) {
        alert("⚠️ Por favor, completa todos los campos.");
        return;
    }

    // Función para convertir imagen a Base64
    async function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    try {
        // Convertir imágenes a Base64
        const bannerImageBase64 = await toBase64(bannerImageFile);
        const extraImageBase64 = await toBase64(extraImageFile);

        // Estructurar datos para la API
        const requestData = {
            encabezado: encabezado,
            imagen_banner_base64: bannerImageBase64,
            imagen_extra_base64: extraImageBase64
        };

        console.log("📤 Datos enviados:", requestData);
        const baseUrl = document.body.dataset.apiUrl;
        // Enviar datos al backend con PATCH
        const response = await fetch(`${baseUrl}/api/banerinicio/${bannerId}/`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (response.ok) {
            await Swal.fire({
                icon: "success",
                title: "Banner actualizado correctamente",
                showConfirmButton: false,
                timer: 2000
            });
            location.reload(); // Recargar la página
        } else {
            let errorMessage = "Error al actualizar el banner.";
            if (data.detail) {
                errorMessage += `<br>${data.detail}`;
            }
            Swal.fire({
                icon: "error",
                title: "Error",
                html: errorMessage
            });
        }
    } catch (error) {
        console.error("❌ Error al convertir imágenes a Base64 o al enviar:", error);
        Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "Hubo un problema al procesar las imágenes o enviar los datos."
        });
    }

}




async function editarTendencia(id, productoId) {
    let modal = new bootstrap.Modal(document.getElementById("modalTendenciaUpdate"));
    modal.show();

    const token = getToken();
    const baseUrl = document.body.dataset.apiUrl;
    try {
        // 🔹 Obtener los detalles de la tendencia
        const tendenciaURL = `${baseUrl}/carrusel-productos/${id}/`;
        const tendenciaResponse = await fetch(tendenciaURL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!tendenciaResponse.ok) {
            throw new Error(`Error al obtener la tendencia (${tendenciaResponse.status})`);
        }

        const tendenciaData = await tendenciaResponse.json();

        // 🔹 Obtener los detalles del producto
        const productoURL = `${baseUrl}/product/${productoId}`;
        const productoResponse = await fetch(productoURL);

        if (!productoResponse.ok) {
            throw new Error(`Error al obtener el producto (${productoResponse.status})`);
        }

        const productoData = await productoResponse.json();
        const producto = productoData.product;

        // 📝 Llenar los campos con los datos obtenidos
        document.getElementById("nombre-productoUpdate").value = producto.name;
        document.getElementById("description-productoUpdate").value = producto.description;

        // 🔹 Mostrar la primera imagen del producto si existe
        if (producto.imagenes.length > 0) {
            document.getElementById("producto-imgUpdate").src = `${baseUrl}${producto.imagenes[0].cRutaImagen}`;
        } else {
            document.getElementById("producto-img").src = "ruta-a-imagen-por-defecto.jpg"; // Imagen por defecto
        }

        document.getElementById("num-tendenciaUpdate").value = tendenciaData.numTendencia;
        document.getElementById("title-tendenciaUpdate").value = tendenciaData.titleTendencia;

        // 🔹 Cargar productos en el select y marcar el producto seleccionado
        await cargarProductosSelect(producto.id);

        // 🔹 Evento para actualizar la tendencia
        document.getElementById("update-tendencia").onclick = function () {
            actualizarTendencia(id, token);
        };

    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// ✅ Función para llenar el select de productos y marcar el seleccionado
async function cargarProductosSelect(productoSeleccionado) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const productosURL = `${baseUrl}/get-products/`;
        const response = await fetch(productosURL);
        if (!response.ok) throw new Error("Error al obtener la lista de productos");

        const productos = await response.json();
        let select = document.getElementById("productoSelectUpdate");
        select.innerHTML = ""; // Limpiar el select

        productos.products.forEach(producto => {
            let option = document.createElement("option");
            option.value = producto.id;
            option.textContent = producto.name;
            if (producto.id === productoSeleccionado) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // 🔹 Evento para actualizar los datos del producto al cambiar de selección
        select.addEventListener("change", function () {
            let selectedId = this.value;
            let selectedProduct = productos.products.find(p => p.id == selectedId);

            if (selectedProduct) {
                let imageElement = document.getElementById("producto-imgUpdate");
                let nombreInput = document.getElementById("nombre-productoUpdate");
                let descripcionInput = document.getElementById("description-productoUpdate");

                // Verificar si hay imágenes disponibles
                if (selectedProduct.imagenes.length > 0) {
                    imageElement.src = `${baseUrl}${selectedProduct.imagenes[0].cRutaImagen}`;
                } else {
                    imageElement.src = "ruta-a-imagen-por-defecto.jpg"; // Imagen por defecto
                }

                nombreInput.value = selectedProduct.name;
                descripcionInput.value = selectedProduct.description;
            }
        });

    } catch (error) {
        console.error("❌ Error al cargar productos:", error);
    }
}



// ✅ Función para actualizar la tendencia con PATCH
async function actualizarTendencia(id, token) {
    try {
        const data = {
            numTendencia: document.getElementById("num-tendenciaUpdate").value,
            titleTendencia: document.getElementById("title-tendenciaUpdate").value,
            producto: document.getElementById("productoSelectUpdate").value
        };
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/carrusel-productos/${id}/`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Error al actualizar la tendencia");

        alert("Tendencia actualizada correctamente");
        location.reload(); // Recargar la página o actualizar la vista

    } catch (error) {
        console.error("❌ Error al actualizar la tendencia:", error);
    }
}

function getToken() {
    return localStorage.getItem("access_token");
}

// Llamamos `loadProducts()` si la página ya está cargada
function checkAndLoadSeason() {
    let currentPath = window.location.pathname;
    if (currentPath.includes("dash-configuration")) {
        console.log("📌 Cargando configuración...");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadSeason();
            loadCategory();
            loadSize();
            loadShipping();
        }, 500); // Espera 500ms para evitar ejecuciones innecesarias


        // SEASON MODAL
        let openModalBtn = document.getElementById('openModalBtn');
        let closeSeasonBtn = document.getElementById('btnClose-season');
        let modalSeason = document.getElementById('exampleModal');

        if (openModalBtn && modalSeason) {
            openModalBtn.removeEventListener('click', openSeasonModal);
            openModalBtn.addEventListener('click', openSeasonModal);
        }

        if (closeSeasonBtn && modalSeason) {
            closeSeasonBtn.removeEventListener('click', closeSeasonModal);
            closeSeasonBtn.addEventListener('click', closeSeasonModal);
        }

        // CATEGORY MODAL
        let openCategoryBtn = document.getElementById('btn-category');
        let closeCategoryBtn = document.getElementById('btnClose-category');
        let modalCategory = document.getElementById('modalCategory');

        if (openCategoryBtn && modalCategory) {
            openCategoryBtn.removeEventListener('click', openCategoryModal);
            openCategoryBtn.addEventListener('click', openCategoryModal);
        }

        if (closeCategoryBtn && modalCategory) {
            closeCategoryBtn.removeEventListener('click', closeCategoryModal);
            closeCategoryBtn.addEventListener('click', closeCategoryModal);
        }
        // SIZE

        let openSizeBtn = document.getElementById('btn-size');
        let closeSizeBtn = document.getElementById('btnClose-size');
        let modalSize = document.getElementById('modalSize');

        if (openSizeBtn && modalSize) {
            openSizeBtn.removeEventListener('click', openSizeModal);
            openSizeBtn.addEventListener('click', openSizeModal);
        }

        if (closeSizeBtn && modalSize) {
            closeSizeBtn.removeEventListener('click', closeSizeModal);
            closeSizeBtn.addEventListener('click', closeSizeModal);
        }
        // SHIPPING
        let openShippingBtn = document.getElementById('btn-shipping');
        let closeShippingBtn = document.getElementById('btnClose-Shipping');
        let modalShipping = document.getElementById('modalShipping');
        if (openShippingBtn && modalShipping) {
            openShippingBtn.removeEventListener('click', openShippingModal);
            openShippingBtn.addEventListener('click', openShippingModal);
        }

        if (closeShippingBtn && modalShipping) {
            closeShippingBtn.removeEventListener('click', closeShippingModal);
            closeShippingBtn.addEventListener('click', closeShippingModal);
        }

        addSeasonModal();
        addCategoryModal();
        addSizeModal();
        addShipping();

    }
    if (currentPath.includes("dash-promocion")) {
        console.log("📌 Cargando promociones...");

        // Limpiar cualquier timeout anterior
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            // Abrir y cerrar modal PARA AGREGAR
            let btnPromotion = document.getElementById("btn-promotion");
            let btnClosePromotion = document.getElementById("btnClose-promotion");
            let modalPromotion = document.getElementById("modalPromotion");

            if (btnPromotion && modalPromotion) {
                btnPromotion.removeEventListener("click", openPromotionModal);
                btnPromotion.addEventListener("click", openPromotionModal);
            }

            if (btnClosePromotion && modalPromotion) {
                btnClosePromotion.removeEventListener("click", closePromotionModal);
                btnClosePromotion.addEventListener("click", closePromotionModal);
            }

            // Abrir y cerrar modal PARA actualizar

            // Checkbox y inputs de promoción
            let checkCodigoPromo = document.getElementById("check-codigoPromo");
            let inputsToToggle = document.querySelectorAll(".promotion-codigo, .promocion-fechaInicio, .promocion-fechaFin");

            let checkProducto = document.getElementById("check-producto");
            let inputsToToggleProduct = document.querySelectorAll(".selectProducts");


            let checkCodigoSoles = document.getElementById("check-codigoSoles");
            let alertBoxSoles = document.getElementById("alert-descuento");

            if (!checkCodigoPromo) {
                console.error("❌ No se encontró el checkbox de promoción.");
                return;
            }
            if (!checkProducto) {
                console.error("❌ No se encontró el checkbox del producto.");
                return;
            }
            if (!checkCodigoSoles) {
                console.error("❌ No se encontró el checkbox de descuento en soles.");
                return;
            }

            // Función para activar/desactivar los inputs
            function toggleInputs() {
                if (checkCodigoPromo) {
                    inputsToToggle.forEach(input => {
                        input.disabled = !checkCodigoPromo.checked;
                    });
                }
                if (checkProducto) {
                    inputsToToggleProduct.forEach(input => {
                        input.disabled = !checkProducto.checked;
                        $(input).toggleClass("disabled", !checkProducto.checked);
                    });
                }
                // ✅ Cambia el mensaje de alerta según el estado del checkbox de descuento en soles
                if (checkCodigoSoles.checked) {
                    alertBoxSoles.classList.remove("alert-warning");
                    alertBoxSoles.classList.add("alert-success");
                    alertBoxSoles.innerHTML = "Se aplicará descuento —> RESTANDO(S/.)";
                } else {
                    alertBoxSoles.classList.remove("alert-success");
                    alertBoxSoles.classList.add("alert-warning");
                    alertBoxSoles.innerHTML = "Se aplicará descuento — PRORCENTAJE(%)";
                }
            }


            // Función para abrir el calendario
            function openDatePicker(event) {
                if (event.target.disabled) {
                    event.target.disabled = false;
                    event.target.showPicker();
                    setTimeout(() => {
                        event.target.disabled = true;
                    }, 200);
                } else {
                    event.target.showPicker();
                }
            }

            // Agregar eventos de cambio a los checkboxes
            if (checkCodigoPromo) checkCodigoPromo.addEventListener("change", toggleInputs);
            if (checkProducto) checkProducto.addEventListener("change", toggleInputs);
            if (checkCodigoSoles) checkCodigoSoles.addEventListener("change", toggleInputs);

            // Agregar evento de clic a los inputs de fecha
            document.querySelectorAll(".promocion-fechaInicio, .promocion-fechaFin").forEach(input => {
                input.addEventListener("click", openDatePicker);
            });
            $(document).ready(function () {
                $('.js-example-basic-multiple').select2({
                    width: '100%' // Asegura que use todo el ancho disponible
                });
                const baseUrl = document.body.dataset.apiUrl;
                // ✅ Cargar productos desde la API
                $.ajax({
                    url: `${baseUrl}/get-products/?new=true`,
                    type: "GET",
                    dataType: "json",
                    success: function (response) {
                        if (response.products) {
                            let select = $(".selectProducts");
                            select.empty(); // Limpiar opciones previas

                            response.products.forEach(product => {
                                // ✅ Filtrar productos sin promociones
                                if (product.promotions.length === 0) {
                                    let option = new Option(product.name, product.id, false, false);
                                    select.append(option);
                                }
                            });

                            // ✅ Mantener el estado del select según el checkbox
                            toggleInputs();
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error("Error al obtener los productos:", error);
                    }
                });

                // ✅ Activamos o desactivamos los inputs al cargar la página
                toggleInputs();
            });


            // Activamos o desactivamos los inputs al cargar la página
            toggleInputs();
            // 🔹 Cargar dinámicamente las promociones SIN recargar la página
            loadPromotion();

            // Llamar a la función que gestiona el modal
            // addPromocionModal();

        }, 500); // Espera medio segundo para asegurarse de que el DOM está listo
    }
    if (currentPath.includes("dash-inicio")) {
        console.log("📌 Cargando Página inicio...");

        // Limpiar cualquier timeout anterior
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            // Abrir y cerrar modal PARA AGREGAR
            let btnBanner = document.getElementById("btn-banner");
            let btnCloseBanner = document.getElementById("btn-closeBanner");
            let modalBanner = document.getElementById("bannerModal");

            if (btnBanner && modalBanner) {
                btnBanner.removeEventListener("click", openBannerModal);
                btnBanner.addEventListener("click", openBannerModal);
            }

            if (btnCloseBanner && modalBanner) {
                btnCloseBanner.removeEventListener("click", closeBannerModal);
                btnCloseBanner.addEventListener("click", closeBannerModal);
            }

            //modal PARA TENDENCIA
            let btnTendencia = document.getElementById("btn-tendencia");
            let btnCloseTendencia = document.getElementById("btn-closeTendencia");
            let modalTendencia = document.getElementById("modalTendencia");

            if (btnTendencia && modalTendencia) {
                btnTendencia.removeEventListener("click", openTendenciaModal);
                btnTendencia.addEventListener("click", openTendenciaModal);
            }

            if (btnCloseTendencia && modalTendencia) {
                btnCloseTendencia.removeEventListener("click", closeTendenciaModal);
                btnCloseTendencia.addEventListener("click", closeTendenciaModal);
            }

            let btnBannerCategory = document.getElementById("btn-bannerCategory");
            let btnCloseBannerCategory = document.getElementById("btn-closeBannerCategory");
            let modalBannerCategory = document.getElementById("bannerModalCategory");

            if (btnBannerCategory && modalBannerCategory) {
                btnBannerCategory.removeEventListener("click", openCategoryImageModal);
                btnBannerCategory.addEventListener("click", openCategoryImageModal);
            }

            if (btnCloseBannerCategory && modalBannerCategory) {
                btnCloseBannerCategory.removeEventListener("click", closeCategoryImageModal);
                btnCloseBannerCategory.addEventListener("click", closeCategoryImageModal);
            }
            //Cargar lista de productos en el select
            fetch(`${baseUrl}/get-products/`)
                .then(response => response.json())
                .then(data => {
                    let select = document.getElementById("productoSelect");
                    if (!select) return;

                    select.innerHTML = ""; // Limpiamos el select antes de agregar opciones

                    data.products.forEach(producto => {
                        let option = document.createElement("option");
                        option.value = producto.id; // Guardamos solo el ID del producto
                        option.textContent = producto.name; // Mostramos el nombre correcto
                        select.appendChild(option);
                    });

                    // Escuchar cambios en el select
                    select.addEventListener("change", function () {
                        let selectedId = this.value;
                        let selectedProduct = data.products.find(p => p.id == selectedId);

                        if (selectedProduct) {
                            let imageElement = document.getElementById("producto-img");
                            let nombreInput = document.getElementById("nombre-producto");
                            let descripcionInput = document.getElementById("description-producto");

                            // Verificar si hay imágenes disponibles
                            if (selectedProduct.imagenes.length > 0) {
                                imageElement.src = `${baseUrl}${selectedProduct.imagenes[0].cRutaImagen}`;
                            } else {
                                imageElement.src = "ruta-a-imagen-por-defecto.jpg"; // Imagen por defecto
                            }

                            nombreInput.value = selectedProduct.name; // Nombre correcto
                            descripcionInput.value = selectedProduct.description; // Descripción correcta
                        }
                    });
                })
                .catch(error => {
                    console.error("Error al cargar productos:", error);
                    let select = document.getElementById("productoSelect");
                    if (select) {
                        select.innerHTML = `<option value="">Error al cargar productos</option>`;
                    }
                });


            // imagen de categorias
            // Aquí llamas solo las funciones necesarias
            const categoriesEndpoint = `${baseUrl}/get/categories/`;
            let categories = [];

            fetch(categoriesEndpoint)
                .then(res => res.json())
                .then(data => {
                    categories = data.results;
                    populateSelects(categories);
                    setupSelectListeners();
                });

            document.getElementById("add-categoryImage").addEventListener("click", agregarCategoryImage);


            loadBanner();
            bannerAgregar();
            loadTendencias();
            agregarTendencia();
            loadImageCategory();


            function convertToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            }

            document.getElementById('update-categoryImage').addEventListener('click', async () => {
                const cards = document.querySelectorAll('#bannerModalCategoryUpdate .card');
                const token = getToken();

                for (const card of cards) {
                    const select = card.querySelector('.category-selectUpdate');
                    const inputFile = card.querySelector('.category-imageUpdate');
                    const categoryId = select?.value;  // Este es el ID de la categoría
                    const categoryImageId = select.getAttribute("data-id");  // Este es el ID del objeto CategoryImage
                    const file = inputFile?.files[0];

                    console.log("Input de archivo:", inputFile); // Verifica que el input esté correctamente seleccionado
                    console.log("Archivo seleccionado:", file); // Verifica que se haya seleccionado un archivo

                    if (!categoryId || !file) {
                        console.warn(`Falta información para actualizar: categoryId=${categoryId}, file=${!!file}`);
                        continue;
                    }

                    try {
                        const base64Image = await convertToBase64(file);

                        const payload = {
                            category: categoryId,
                            base64_image: base64Image
                        };

                        console.log(`🔄 Enviando actualización para categoría ID: ${categoryId} (CategoryImage ID: ${categoryImageId})`);
                        console.log("📦 Payload enviado:", JSON.stringify(payload, null, 2));

                        const response = await fetch(`${baseUrl}/get/category-images/${categoryImageId}/`, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            const result = await response.json();
                            console.log(`✅ Actualización exitosa para categoría ID ${categoryId}`, result);

                            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("bannerModalCategoryUpdate"));
                            if (modalInstance) modalInstance.hide();

                            await loadImageCategory();
                        } else {
                            const errorText = await response.text();
                            console.error(`❌ Error al actualizar categoría ID ${categoryId}:`, errorText);
                        }
                    } catch (error) {
                        console.error(`🚨 Error al procesar categoría ID ${categoryId}:`, error);
                    }

                }
            });







        }, 500); // Espera medio segundo para asegurarse de que el DOM está listo
    }
}

// 🎯 Funciones separadas para cada modal y creacion
//SEASON
function openSeasonModal() {
    let modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    modal.show();
}

function closeSeasonModal() {
    let modalElement = document.getElementById('exampleModal');
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function addSeasonModal() {
    let addSeasonBtn = document.getElementById("add-season");
    if (!addSeasonBtn) return;

    // Eliminar eventos previos para evitar múltiples registros
    addSeasonBtn.removeEventListener("click", handleAddSeason);
    addSeasonBtn.addEventListener("click", handleAddSeason);
}

async function handleAddSeason() {
    const token = getToken();
    if (!token) {
        console.error("❌ No hay token en localStorage.");
        alert("❌ No estás autenticado. Inicia sesión primero.");
        return;
    }

    const addSeasonBtn = document.getElementById("add-season");
    addSeasonBtn.disabled = true; // 🔹 Deshabilita el botón para evitar múltiples envíos

    const seasonName = document.querySelector(".season-name").value.trim();
    const seasonDescription = document.querySelector(".season-description").value.trim();

    if (!seasonName || !seasonDescription) {
        alert("⚠️ Por favor, completa todos los campos.");
        addSeasonBtn.disabled = false;
        return;
    }

    const seasonData = { name: seasonName, description: seasonDescription };

    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/seasonAdd/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(seasonData)
        });

        if (response.ok) {
            const result = await response.json();
            alert("✅ Temporada agregada exitosamente.");
            console.log("✅ Respuesta de API:", result);

            // Cerrar el modal
            let modalElement = document.getElementById("exampleModal");
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            loadSeason();
        } else {
            const errorData = await response.json();
            console.error("❌ Error en API:", errorData);
            alert(`❌ Error: ${JSON.stringify(errorData)}`);
        }
    } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        alert("❌ Hubo un problema al agregar la temporada.");
    }

    addSeasonBtn.disabled = false; // 🔹 Habilita el botón después de la respuesta
}

//CATEGORY
function openCategoryModal() {
    let modal = new bootstrap.Modal(document.getElementById('modalCategory'));
    modal.show();
}

function closeCategoryModal() {
    let modalElement = document.getElementById('modalCategory');
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function addCategoryModal() {
    const token = getToken();
    let addCategoryBtn = document.getElementById("add-category");
    if (!addCategoryBtn) return;

    addCategoryBtn.addEventListener("click", async function () {
        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            return;
        }

        const categoryName = document.querySelector(".category-name").value.trim();
        const categoryDescription = document.querySelector(".category-description").value.trim();

        if (!categoryName || !categoryDescription) {
            alert("⚠️ Por favor, completa todos los campos.");
            return;
        }

        const categoryData = {
            name: categoryName,
            description: categoryDescription,
            seasons: []
        };

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/get/categoryAdd/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(categoryData)
            });

            if (response.ok) {
                const result = await response.json();
                // alert("✅ Categoría agregada exitosamente.");
                // console.log("✅ Respuesta de API:", result);

                await Swal.fire({
                    icon: "success",
                    title: "✅ Categoría agregada exitosamente.",
                    showConfirmButton: false,
                    timer: 2000
                });
                // location.reload(); 


                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalCategory"));
                if (modalInstance) modalInstance.hide();

                loadCategory();
            } else {
                const errorData = await response.json();
                console.error("❌ Error en API:", errorData);
                alert(`❌ Error: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            alert("❌ Hubo un problema al agregar la categoría.");
        }
    });
}

//SIZE
function openSizeModal() {
    let modal = new bootstrap.Modal(document.getElementById('modalSize'));
    modal.show();
}

function closeSizeModal() {
    let modalElement = document.getElementById('modalSize');
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function addSizeModal() {
    const token = getToken();
    let addSizeBtn = document.getElementById("add-size");
    if (!addSizeBtn) return;

    addSizeBtn.addEventListener("click", async function () {
        console.log("TALLA PRECIONADA");
        addSizeBtn.disabled = true; // 🔹 Deshabilita el botón para evitar múltiples clics

        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            addSizeBtn.disabled = false;
            return;
        }

        const sizeName = document.querySelector(".size-name").value.trim();
        if (!sizeName) {
            alert("⚠️ Por favor, completa todos los campos.");
            addSizeBtn.disabled = false;
            return;
        }

        const sizeData = { cNombreTalla: sizeName };

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/get/sizeAdd/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(sizeData)
            });

            if (response.ok) {
                const result = await response.json();
                await Swal.fire({
                    icon: "success",
                    title: "✅ Categoría agregada exitosamente.",
                    showConfirmButton: false,
                    timer: 2000
                });

                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalSize"));
                if (modalInstance) modalInstance.hide();

                loadSize();
            } else {
                const errorData = await response.json();
                console.error("❌ Error en API:", errorData);
                alert(`❌ Error: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            alert("❌ Hubo un problema al agregar la talla.");
        }

        addSizeBtn.disabled = false;
    });
}
//SHIPPING
function openShippingModal() {
    let modal = new bootstrap.Modal(document.getElementById('modalShipping'));
    modal.show();
}

function closeShippingModal() {
    let modalElement = document.getElementById('modalShipping');
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    limpiarCamposShipping();
    if (modalInstance) modalInstance.hide();
}

function addShipping() {
    const token = getToken();
    const addShippingBtn = document.getElementById("add-shipping");
    const precioInput = document.getElementById("precioShipping");

    if (!addShippingBtn || !precioInput) return;

    // 🔹 Agregar solo UNA vez el formateo del precio
    setupPriceInputValidation(precioInput);

    // 🔹 Opcional: Al salir del campo (onblur), formatear agregando ".00" si no tiene decimales
    precioInput.addEventListener("blur", (e) => {
        let value = e.target.value;
        if (value && !value.includes('.')) {
            value = value + ".00"; // agrega .00 solo cuando termina de escribir
        }
        e.target.value = value;
    });


    addShippingBtn.addEventListener("click", async function () {
        addShippingBtn.disabled = true;

        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            addShippingBtn.disabled = false;
            return;
        }

        const nameShipping = document.getElementById("nameShipping").value.trim();
        const tiempoShipping = document.getElementById("tiempoShipping").value.trim();
        const precio = precioInput.value.trim();

        if (!nameShipping || !tiempoShipping || !precio) {
            alert("⚠️ Por favor, completa todos los campos.");
            addShippingBtn.disabled = false;
            return;
        }

        const shippingData = {
            name: nameShipping,
            time_to_delivery: tiempoShipping,
            price: precio
        };

        try {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/api/shipping/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(shippingData)
            });

            if (response.ok) {
                const result = await response.json();
                alert("✅ Envío agregado exitosamente.");
                console.log("✅ Respuesta de API:", result);

                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalShipping"));
                if (modalInstance) {
                    limpiarCamposShipping(); // 🔹 Limpia antes de cerrar
                    modalInstance.hide();
                }

                loadShipping();
            } else {
                const errorData = await response.json();
                await Swal.fire({
                    icon: "success",
                    title: "✅ Shipping agregado exitosamente.",
                    showConfirmButton: false,
                    timer: 2000
                });

                let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalShipping"));
                if (modalInstance) {
                    limpiarCamposShipping(); // 🔹 Limpia antes de cerrar también en error
                    modalInstance.hide();
                }
            }

        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            alert("❌ Hubo un problema al agregar el envío.");
        }

        addShippingBtn.disabled = false;
    });
}

function limpiarCamposShipping() {
    document.getElementById("nameShipping").value = "";
    document.getElementById("tiempoShipping").value = "";
    document.getElementById("precioShipping").value = "";
}

//PROMOITION
function openPromotionModal() {
    let modal = new bootstrap.Modal(document.getElementById("modalPromotion"));
    modal.show();
}

function closePromotionModal() {
    let modalElement = document.getElementById("modalPromotion");
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

// function addPromocionModal() {
//     const token = getToken();
//     let addPromocionBtn = document.getElementById("add-promocion");
//     if (!addPromocionBtn) return;

//     addPromocionBtn.addEventListener("click", async function () {
//         addPromocionBtn.disabled = true; // 🔹 Deshabilita el botón para evitar múltiples clics

//         if (!token) {
//             console.error("❌ No hay token en localStorage.");
//             alert("❌ No estás autenticado. Inicia sesión primero.");
//             addPromocionBtn.disabled = false;
//             return;
//         }

//         const promotionName = document.querySelector(".promotion-name").value.trim();
//         const promotionDescription = document.querySelector(".promotion-description").value.trim();
//         let promotionCantidad = document.querySelector(".promotion-cantidad").value.trim();
//         const promotionCodigo = document.querySelector(".promotion-codigo").value.trim();
//         let promotionInicio = document.querySelector(".promocion-fechaInicio").value.trim();
//         let promotionFin = document.querySelector(".promocion-fechaFin").value.trim();
//         let checkCodigoPromo = document.getElementById("check-codigoPromo");
//         let checkProducto = document.getElementById("check-producto");
//         let checkCodigoSoles = document.getElementById("check-codigoSoles"); // ✅ Checkbox de descuento en soles
//         let selectedProducts = [];

//         // ✅ Si el checkbox de código promo está desactivado, usa las fechas actuales
//         if (!checkCodigoPromo.checked) {
//             let today = new Date();
//             promotionInicio = today.toISOString();
//             promotionFin = today.toISOString();
//         } else {
//             // Si la fecha está vacía, envía "" en lugar de null
//             promotionInicio = promotionInicio ? new Date(promotionInicio).toISOString() : "";
//             promotionFin = promotionFin ? new Date(promotionFin).toISOString() : "";
//         }

//         // ✅ Obtener productos seleccionados solo si el checkbox de productos está activo
//         if (checkProducto.checked) {
//             selectedProducts = $(".selectProducts").val() || []; // Obtiene los productos seleccionados
//         } else {
//             selectedProducts = []; // Si no está marcado, lista vacía
//         }

//         // 🛠️ Validación de campos
//         if (!promotionName || !promotionDescription || !promotionCantidad) {
//             alert("⚠️ Por favor, completa todos los campos.");
//             addPromocionBtn.disabled = false;
//             return;
//         }

//         // 🛠️ Validación de número en discount_percentage
//         promotionCantidad = parseFloat(promotionCantidad);
//         if (isNaN(promotionCantidad)) {
//             alert("⚠️ El descuento debe ser un número válido.");
//             addPromocionBtn.disabled = false;
//             return;
//         }

//         // ✅ Detectar si el checkbox de descuento en soles está activado
//         const isMoneyDiscount = checkCodigoSoles.checked;

//         const promotionData = {
//             name: promotionName,
//             description: promotionDescription,
//             discount_percentage: promotionCantidad,
//             code: promotionCodigo,
//             start_date: promotionInicio,
//             end_date: promotionFin,
//             products: selectedProducts.map(Number),
//             active: true,
//             money: isMoneyDiscount // ✅ Enviar `true` si el checkbox está activo, `false` si no.
//         };

//         // 🔍 Verificación en consola (puedes eliminar esta línea en producción)
//         console.log("Datos de la promoción:", promotionData);


//         try {
//             const response = await fetch("http://127.0.0.1:8000/get/promotionsAdd/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${token}`
//                 },
//                 body: JSON.stringify(promotionData)
//             });

//             if (response.ok) {
//                 const result = await response.json();
//                 alert("✅ Promoción agregada exitosamente.");
//                 console.log("✅ Respuesta de API:", result);

//                 let modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalPromotion"));
//                 if (modalInstance) modalInstance.hide();

//                 loadPromotion();
//             } else {
//                 const errorData = await response.json();
//                 console.error("❌ Error en API:", errorData);
//                 alert(`❌ Error: ${JSON.stringify(errorData)}`);
//             }
//         } catch (error) {
//             console.error("❌ Error en la solicitud:", error);
//             alert("❌ Hubo un problema al agregar la promoción.");
//         }

//         addPromocionBtn.disabled = false;
//     });
// }


//INICIO - BANNER
function openBannerModal() {
    let modal = new bootstrap.Modal(document.getElementById("bannerModal"));
    modal.show();
}

function closeBannerModal() {
    let modalElement = document.getElementById("bannerModal");
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

async function bannerAgregar() {
    const token = getToken();
    let addBannerBtn = document.getElementById("add-banner");
    if (!addBannerBtn) return;

    addBannerBtn.addEventListener("click", async function (event) {
        event.preventDefault(); // Evita recargar la página

        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            return;
        }

        const encabezado = document.getElementById("encabezado").value.trim();
        const bannerImage = document.getElementById("bannerImage").files[0];
        const extraImage = document.getElementById("extraImage").files[0];

        if (!encabezado || !bannerImage || !extraImage) {
            alert("⚠️ Por favor, completa todos los campos.");
            return;
        }

        async function toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        }

        try {
            const bannerImageBase64 = await toBase64(bannerImage);
            const extraImageBase64 = await toBase64(extraImage);

            const requestData = {
                encabezado: encabezado,
                imagen_banner_base64: bannerImageBase64, // Se envía en base64
                imagen_extra_base64: extraImageBase64
            };

            console.log("📤 Datos enviados:", requestData);

            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/api/banerinicio/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                alert("✅ Banner agregado exitosamente.");
                console.log("✅ Respuesta de API:", result);
                location.reload();
            } else {
                const errorData = await response.json();
                console.error("❌ Error en API:", errorData);
                alert(`❌ Error: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            alert("❌ Hubo un problema al agregar el banner.");
        }
    });
}



//INICIO - productons en TENDENCIA
// Función para abrir el modal
function openTendenciaModal() {
    let modal = new bootstrap.Modal(document.getElementById("modalTendencia"));
    modal.show();
}

function closeTendenciaModal() {
    let modalElement = document.getElementById("modalTendencia");
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}


async function agregarTendencia() {
    const token = getToken();
    let addBannerBtn = document.getElementById("add-tendencia");
    if (!addBannerBtn) return;

    addBannerBtn.addEventListener("click", async function (event) {
        event.preventDefault(); // Evita recargar la página

        if (!token) {
            console.error("❌ No hay token en localStorage.");
            alert("❌ No estás autenticado. Inicia sesión primero.");
            return;
        }

        const numTendencia = document.getElementById("num-tendencia").value.trim(); // No se convierte a número
        const titleTendencia = document.getElementById("title-tendencia").value.trim();
        const producto = document.getElementById("productoSelect").value.trim();

        // Convertir `producto` a número (porque es una ForeignKey en Django)
        const productoId = parseInt(producto, 10);

        // Validaciones de datos
        if (isNaN(productoId) || !numTendencia || !titleTendencia) {
            alert("⚠️ Por favor, completa todos los campos correctamente.");
            return;
        }

        try {
            const requestTendencia = {
                producto: productoId,  // Debe ser un número, ya que es una FK en Django
                numTendencia: numTendencia, // Se mantiene como texto
                titleTendencia: titleTendencia
            };

            console.log("📤 Datos enviados:", requestTendencia);

            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/carrusel-productos/create/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestTendencia)
            });

            if (response.ok) {
                const result = await response.json();
                await Swal.fire({
                    icon: "success",
                    title: "✅ Tendencia agregada exitosamente.",
                    showConfirmButton: false,
                    timer: 2000
                });
                location.reload();
            } else {
                const errorData = await response.json();
                console.error("❌ Error en API:", errorData);
                alert(`❌ Error: ${JSON.stringify(errorData)}`);
            }

        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            alert("❌ Hubo un problema al agregar la Tendencia.");
        }
    });
}

// INICIO----> imagenes de categorias
function openCategoryImageModal() {
    let modal = new bootstrap.Modal(document.getElementById("bannerModalCategory"));
    modal.show();
}

function closeCategoryImageModal() {
    let modalElement = document.getElementById("bannerModalCategory");
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function populateSelects(categories) {
    const selects = document.querySelectorAll(".form-select");
    selects.forEach(select => {
        select.innerHTML = `<option selected disabled value="">Seleccione</option>`;
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    });
}

function setupSelectListeners() {
    const selects = document.querySelectorAll(".form-select");
    selects.forEach(select => {
        select.addEventListener("change", () => {
            const selectedText = select.options[select.selectedIndex].textContent;
            const card = select.closest(".card");
            const span = card.querySelector(".categorySelected");
            if (span) span.textContent = selectedText;
            updateSelectOptions();
        });
    });
}

function updateSelectOptions() {
    const allSelects = document.querySelectorAll(".form-select");
    const selectedValues = Array.from(allSelects).map(s => s.value).filter(v => v !== "");

    allSelects.forEach(select => {
        const currentValue = select.value;
        Array.from(select.options).forEach(option => {
            if (option.value === "") return;
            option.hidden = selectedValues.includes(option.value) && option.value !== currentValue;
        });
    });
}

async function agregarCategoryImage() {
    const token = getToken(); // Obtener el token de autenticación
    const cards = document.querySelectorAll(".card");
    const resultados = [];

    for (const card of cards) {
        const select = card.querySelector(".form-select");
        const input = card.querySelector("input[type='file']");

        if (!select || !input) {
            console.warn("⚠️ Tarjeta sin select o input. Se ignora.");
            continue;
        }

        const caption = select.options[select.selectedIndex]?.textContent;
        const categoryId = select.value;
        const file = input.files[0];

        if (!categoryId || !file) {
            console.warn("⚠️ Falta categoría o imagen en una de las tarjetas.");
            continue;
        }

        const base64 = await toBase64(file);

        resultados.push({
            category: parseInt(categoryId),
            caption: caption,
            base64_image: base64
        });
    }

    console.log("✅ Resultados a enviar:", resultados);
    const baseUrl = document.body.dataset.apiUrl;
    // Enviar los resultados al servidor
    const response = await fetch(`${baseUrl}/get/category-images/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(resultados)
    });

    // Manejo de la respuesta
    if (response.ok) {
        const data = await response.json();
        console.log("✔️ Imágenes y categorías enviadas correctamente:", data);

        // Cerrar el modal
        closeCategoryImageModal();

        // Mostrar mensaje de éxito con SweetAlert2
        Swal.fire({
            icon: 'success',
            title: '¡Imágenes registradas!',
            text: 'Las imágenes fueron guardadas correctamente.',
            timer: 2500,
            showConfirmButton: false
        });
    } else {
        console.error("❌ Error al enviar los datos:", response.statusText);

        // Mensaje de error con SweetAlert2
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron guardar las imágenes.',
        });
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}





let timeout = null;


// Evitar ejecutar innecesariamente
let lastPath = window.location.pathname;

// Solo observar cambios si la ruta coincide
const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        checkAndLoadSeason();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    checkAndLoadSeason();
    observer.observe(document.body, { childList: true, subtree: true });
});
