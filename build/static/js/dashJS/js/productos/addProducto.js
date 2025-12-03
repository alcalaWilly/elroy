document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;

    // Se ejecuta solo si estás en /dash-detallePedido/
    if (path === "/dash-addProduct/") {

        const talla = await obtenerTallas();

        console.log("LAS tallaaaaaaaaa:", talla);

        await cargarFiltrosProducto();
        addImg();
        validarInputsDePrecio();
        activarSelectorTallaColor();
        await inicializarAgregarTallas();
        inicializarSelectorDeColor();
        inicializarAgregarColores();
        inicializarBotonesEliminarColor();

    } else {
        console.log("🟡 No estás en /dash-addProduct/");
    }
});

// const baseUrl = document.body.dataset.apiUrl;
async function obtenerTemporadas() {
    try {
        const response = await fetch(`${baseUrl}/get/seasons/`);
        if (!response.ok) throw new Error("Error al obtener temporadas");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

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

async function obtenerTallas() {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get/sizes/`);
        if (!response.ok) throw new Error("Error al obtener las tallas");

        const data = await response.json();
        return data.results; // Devuelve la lista de temporadas
    } catch (error) {
        console.error("Error cargando temporadas:", error);
        return [];
    }
}

async function cargarFiltrosProducto() {
    const seasonSelect = document.querySelector(".seasonSelect");
    const categorySelect = document.querySelector(".categorySelect");

    if (!seasonSelect || !categorySelect) {
        console.warn("No se encontraron los elementos <select> para temporadas o categorías.");
        return;
    }

    // Obtener datos
    const temporadas = await obtenerTemporadas();
    const categorias = await obtenerCategorias();

    console.log("LAS temporadassss:", temporadas);
    console.log("LAS CATEGORIAAAAAS:", categorias);

    // Limpiar selects
    seasonSelect.innerHTML = '<option value="">Selecciona temporada</option>';
    categorySelect.innerHTML = '<option value="">Selecciona categoría</option>';

    // Llenar temporadas
    temporadas.forEach(temp => {
        const option = document.createElement("option");
        option.value = temp.id;
        option.textContent = temp.name || `Temporada ${temp.id}`;
        seasonSelect.appendChild(option);
    });

    // Llenar categorías
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name || `Categoría ${cat.id}`;
        categorySelect.appendChild(option);
    });

    // 🔁 Mostrar en consola lo seleccionado
    seasonSelect.addEventListener("change", () => {
        const selectedOption = seasonSelect.options[seasonSelect.selectedIndex];
        console.log("🟡 Temporada seleccionada:", {
            id: seasonSelect.value
        });
    });

    categorySelect.addEventListener("change", () => {
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        console.log("🔵 Categoría seleccionada:", {
            id: categorySelect.value
        });
    });
}

function addImg() {
    const fileInput = document.querySelector(".product-image");
    const previewContainer = document.querySelector(".image-preview");
    const warningMessage = document.getElementById("image-warning");

    let uploadedImg = [];
    let imagenesUrls = [];

    if (!fileInput || !previewContainer) {
        console.warn("⚠️ No se encontró el input o el contenedor de previsualización.");
        return;
    }

    fileInput.addEventListener("change", function () {
        if (!fileInput.files.length) return;

        let newFiles = Array.from(fileInput.files);
        let totalImages = uploadedImg.length + newFiles.length;

        if (totalImages > 6) {
            warningMessage.textContent = "Solo puedes subir hasta 6 imágenes.";
            setTimeout(() => warningMessage.textContent = "", 3000);
            newFiles = newFiles.slice(0, 6 - uploadedImg.length);
        }

        newFiles.forEach(file => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const base64 = e.target.result;

                uploadedImg.push(file);
                imagenesUrls.push({ url: base64 });

                const imageWrapper = document.createElement("div");
                imageWrapper.classList.add("position-relative", "m-1");
                imageWrapper.style.display = "inline-block";

                const img = document.createElement("img");
                img.src = base64;
                img.classList.add("img-thumbnail");
                img.style.width = "100px";
                img.style.height = "100px";

                const closeButton = document.createElement("button");
                closeButton.innerHTML = "&times;";
                closeButton.classList.add("btn", "btn-danger", "btn-sm", "position-absolute");
                closeButton.style.top = "5px";
                closeButton.style.right = "5px";

                closeButton.addEventListener("click", function () {
                    imageWrapper.remove();
                    const index = uploadedImg.indexOf(file);
                    if (index !== -1) {
                        uploadedImg.splice(index, 1);
                        imagenesUrls.splice(index, 1);
                    }
                    mostrarArchivosConsola();
                });

                imageWrapper.appendChild(img);
                imageWrapper.appendChild(closeButton);
                previewContainer.appendChild(imageWrapper);

                mostrarArchivosConsola();
            };

            reader.readAsDataURL(file);
        });

        fileInput.value = "";
    });

    function mostrarArchivosConsola() {
        //console.clear();
        console.log("imagenes:", imagenesUrls);
    }
}

function activarSelectorTallaColor() {
    const btnTalla = document.querySelector(".metodo_codigo");
    const btnColor = document.querySelector(".metodo_automatico");
    const cardTallas = document.getElementById("cardTallas");
    const cardColores = document.getElementById("cardColores");
    const tbodyTallas = document.querySelector("#cardTallas tbody");
    const tbodyColores = document.querySelector(".tbodyColores");

    if (!btnTalla || !btnColor || !cardTallas || !cardColores) {
        console.warn("⚠️ Elementos necesarios no encontrados");
        return;
    }

    btnTalla.addEventListener("click", function () {
        btnTalla.classList.add("active");
        btnColor.classList.remove("active");
        cardTallas.classList.remove("d-none");
        cardColores.classList.add("d-none");

        // Limpiar colores
        if (tbodyColores) tbodyColores.innerHTML = "";
        coloresUsados?.clear?.();

        // Resetear contadores
        actualizarTotalInventarioColores();
        actualizarTotalInventarioTallas();

        // Simular “limpiar consola” de colores
        console.log("🔄 Cambio a modo TALLAS");
        console.log("🧹 Limpiando resumen de colores...");
        console.log("----------------------------");
    });

    btnColor.addEventListener("click", function () {
        btnColor.classList.add("active");
        btnTalla.classList.remove("active");
        cardColores.classList.remove("d-none");
        cardTallas.classList.add("d-none");

        // Limpiar tallas
        if (tbodyTallas) tbodyTallas.innerHTML = "";
        tallasUsadas?.clear?.();

        // Resetear contadores
        actualizarTotalInventarioTallas();
        actualizarTotalInventarioColores();

        // Simular “limpiar consola” de tallas
        console.log("🔄 Cambio a modo COLORES");
        console.log("🧹 Limpiando resumen de tallas...");
        console.log("----------------------------");
    });
}

function validarInputsDePrecio() {
    const inputs = document.querySelectorAll(".precioInput");

    inputs.forEach(input => {
        // Permitir solo números y punto (.)
        input.addEventListener("input", (e) => {
            e.target.value = e.target.value
                .replace(/[^\d.]/g, "")      // Elimina todo excepto números y punto
                .replace(/^0+(\d)/, "$1")   // Elimina ceros iniciales (opcional)
                .replace(/(\..*?)\..*/g, "$1"); // Evita más de un punto
        });

        // Formatear a 2 decimales al salir
        input.addEventListener("blur", (e) => {
            let valor = parseFloat(e.target.value);
            if (!isNaN(valor)) {
                const valorFormateado = valor.toFixed(2);
                e.target.value = valorFormateado;
                console.log("💰 Precio ingresado:", valorFormateado);
            } else {
                e.target.value = "";
                console.log("❌ Entrada inválida");
            }
        });
    });
}

let tallasDisponibles = []; // Se llena desde la API
let tallasUsadas = new Set(); // Para evitar repetir

async function inicializarAgregarTallas() {
    tallasDisponibles = await obtenerTallas(); // Debe devolver [{id, cNombreTalla}, ...]

    const btnAgregar = document.getElementById("btnAgregarTalla");
    const tbody = document.getElementById("tbodyTallas");

    if (!btnAgregar || !tbody) return;

    btnAgregar.addEventListener("click", () => {
        const restantes = tallasDisponibles.filter(t => !tallasUsadas.has(t.id));
        if (restantes.length === 0) {
            alert("Ya se han agregado todas las tallas disponibles.");
            return;
        }

        const talla = restantes[0];
        tallasUsadas.add(talla.id);

        const inputPrincipal = document.querySelector(".precioInput");
        let precioBase = parseFloat(inputPrincipal?.value);
        precioBase = !isNaN(precioBase) ? precioBase.toFixed(2) : "";

        const fila = document.createElement("tr");
        fila.setAttribute("data-id-talla", talla.id); // 👈 Guardamos el id

        fila.innerHTML = `
            <td>${talla.cNombreTalla}</td>
            <td>
                <div class="input-group">
                    <span class="input-group-text">PEN</span>
                    <input type="text" class="form-control precioTabla" placeholder="0.00" value="${precioBase}">
                </div>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control cantidadTabla" placeholder="0">
                    <button type="button" class="btn btn-danger btn-sm btnEliminarFila" title="Eliminar">
                        &times;
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(fila);

        // Event: actualizar total y resumen cuando cambie cantidad
        const inputCantidad = fila.querySelector(".cantidadTabla");
        inputCantidad.addEventListener("input", () => {
            actualizarTotalInventarioTallas();
            mostrarResumenTallas(); // 👈 Mostrar resumen cada vez que cambia
        });

        // Event: eliminar fila
        const btnEliminar = fila.querySelector(".btnEliminarFila");
        btnEliminar.addEventListener("click", () => {
            fila.remove();
            tallasUsadas.delete(talla.id);
            actualizarTotalInventarioTallas();
            mostrarResumenTallas(); // 👈 Mostrar resumen cada vez que se elimina
        });

        actualizarTotalInventarioTallas();
        mostrarResumenTallas(); // 👈 Mostrar resumen al agregar
    });
}

function actualizarTotalInventarioTallas() {
    const cantidades = document.querySelectorAll(".cantidadTabla");
    let total = 0;

    cantidades.forEach(input => {
        const valor = parseInt(input.value);
        if (!isNaN(valor)) total += valor;
    });

    const spanTotal = document.getElementById("totalInventarioTalla");
    spanTotal.textContent = `Total de inventario en la tienda: ${total} disponible`;
}

// ✅ Función que muestra resumen de tallas en consola
function mostrarResumenTallas() {
    const filas = document.querySelectorAll("#tbodyTallas tr");
    const resultado = [];
    const colores = [];
    let stockTotal = 0;

    filas.forEach(fila => {
        const idTalla = fila.getAttribute("data-id-talla");
        const inputCantidad = fila.querySelector(".cantidadTabla");
        const stock = parseInt(inputCantidad?.value) || 0;
        stockTotal += stock;

        resultado.push({
            talla: parseInt(idTalla),
            stock: stock
        });
    });

    console.log("📦 Stock total:", stockTotal);
    console.log("📏 Tallas:", resultado);
    console.log("📏 Colores:", colores);
}

function inicializarSelectorDeColor() {
    const colorSpans = document.querySelectorAll(".color-selector");

    colorSpans.forEach(spanColor => {
        const grupo = spanColor.closest(".input-group");
        const inputColor = grupo.querySelector("input.form-control");

        // Crear input color único y oculto
        const selector = document.createElement("input");
        selector.type = "color";
        selector.style.position = "fixed";
        selector.style.left = "50%";
        selector.style.top = "50%";
        selector.style.transform = "translate(-50%, -50%)";
        selector.style.opacity = 0;
        selector.style.pointerEvents = "none";
        selector.style.zIndex = "9999";
        document.body.appendChild(selector);

        // Al hacer clic en el span
        spanColor.addEventListener("click", () => {
            selector.value = inputColor.value || "#ffffff"; // Valor actual o blanco por defecto
            selector.click();
        });

        // Cuando se selecciona el color
        selector.addEventListener("input", () => {
            const colorHex = selector.value;
            spanColor.textContent = colorHex;
            spanColor.style.backgroundColor = colorHex;
            spanColor.style.color = getContrasteTextColor(colorHex);
            inputColor.value = colorHex;

            // ✅ NUEVO: actualizar también el atributo en la fila
            const fila = spanColor.closest("tr");
            if (fila) {
                fila.setAttribute("data-color", colorHex);
            }
        });
    });

    function getContrasteTextColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminancia > 186 ? "#000" : "#fff";
    }
}

let coloresUsados = new Set(); // opcional

function inicializarAgregarColores() {
    const tablaColores = document.querySelector(".tbodyColores");
    const btnAgregar = document.getElementById("btnAgregarColor");
    const inputPrecioBase = document.querySelector(".precioInput");

    if (!tablaColores || !btnAgregar || !inputPrecioBase) return;

    btnAgregar.addEventListener("click", () => {
        const precioBase = parseFloat(inputPrecioBase.value) || 0;
        const precioFormateado = precioBase.toFixed(2);

        const fila = document.createElement("tr");
        const colorDefault = "#ffffff";

        fila.setAttribute("data-color", colorDefault); // 👈 Guardar color como atributo inicial

        fila.innerHTML = `
            <td>
                <div class="input-group">
                    <span class="input-group-text color-selector" style="cursor: pointer;">${colorDefault}</span>
                    <input type="text" class="form-control inputColorHex" placeholder="#ffffff" value="${colorDefault}">
                </div>
            </td>
            <td>
                <div class="input-group">
                    <span class="input-group-text">PEN</span>
                    <input type="text" class="form-control precioTabla" placeholder="0.00" value="${precioFormateado}">
                </div>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control cantidadTabla" placeholder="0">
                    <button type="button" class="btn btn-danger btn-sm btnEliminarColor" title="Eliminar fila">
                        &times;
                    </button>
                </div>
            </td>
        `;

        tablaColores.appendChild(fila);

        // Actualizar color seleccionado (si se cambia)
        const colorInput = fila.querySelector(".inputColorHex");
        const spanColor = fila.querySelector(".color-selector");

        colorInput.addEventListener("input", () => {
            const color = colorInput.value;
            spanColor.textContent = color;
            fila.setAttribute("data-color", color); // 👈 actualizar atributo con color
        });

        // Evento cantidad
        const inputCantidad = fila.querySelector(".cantidadTabla");
        inputCantidad.addEventListener("input", () => {
            actualizarTotalInventarioColores();
            mostrarResumenColores(); // 👈 resumen por consola
        });

        // Eliminar
        const btnEliminar = fila.querySelector(".btnEliminarColor");
        btnEliminar.addEventListener("click", () => {
            fila.remove();
            actualizarTotalInventarioColores();
            mostrarResumenColores();
        });

        inicializarSelectorDeColor?.();
        actualizarTotalInventarioColores();
        mostrarResumenColores();
    });
}

function actualizarTotalInventarioColores() {
    const cantidades = document.querySelectorAll("#cardColores .cantidadTabla");
    let total = 0;

    cantidades.forEach(input => {
        const valor = parseInt(input.value);
        if (!isNaN(valor)) total += valor;
    });

    const spanTotal = document.getElementById("totalInventarioColor");
    if (spanTotal) {
        spanTotal.textContent = `Total de inventario en la tienda: ${total} disponible`;
    }
}

// ✅ Mostrar resumen de colores por consola
function mostrarResumenColores() {
    const filas = document.querySelectorAll("#cardColores tbody tr");
    const resultado = [];
    const tallas = [];
    let stockTotal = 0;

    filas.forEach(fila => {
        const color = fila.getAttribute("data-color") || "#000000";
        const inputCantidad = fila.querySelector(".cantidadTabla");
        const stock = parseInt(inputCantidad?.value) || 0;
        stockTotal += stock;

        resultado.push({ color, stock });
    });

    console.log("🎨 Stock total colores:", stockTotal);
    console.log("🎨 Colores:", resultado);
    console.log("🎨 tallas:", tallas);
}

function inicializarBotonesEliminarColor() {
    const botones = document.querySelectorAll(".btnEliminarColor");

    botones.forEach(btn => {
        btn.removeEventListener("click", eliminarFila); // Evitar duplicación
        btn.addEventListener("click", eliminarFila);
    });

    function eliminarFila(e) {
        const fila = e.target.closest("tr");
        if (fila) fila.remove();
    }
}



