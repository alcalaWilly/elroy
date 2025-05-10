// const regiones = [
//     "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho",
//     "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco",
//     "Ica", "Junín", "La Libertad", "Lambayeque", "Lima",
//     "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura",
//     "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
// ];
const regionInput = document.getElementById("regionInput");
const regionList = document.getElementById("regionList");

let regiones = []; // Lista completa de regiones
const baseUrl = document.body.dataset.apiUrl;
// ✅ Obtener regiones desde API
fetch(`${baseUrl}/api/orders/countries/`)
    .then(response => response.json())
    .then(data => {
        regiones = data; // Guardamos todo el objeto {value, label}
    })
    .catch(error => {
        console.error("Error al cargar las regiones:", error);
    });

// ✅ Evento para filtrar opciones
regionInput.addEventListener("input", () => {
    const filtro = regionInput.value.toLowerCase();
    regionList.innerHTML = ""; // Limpiar lista

    regiones
        .filter(region => region.label.toLowerCase().includes(filtro))
        .forEach(region => {
            const opcion = document.createElement("button");
            opcion.type = "button";
            opcion.classList.add("list-group-item", "list-group-item-action");
            opcion.textContent = region.label;
            opcion.onclick = () => {
                regionInput.value = region.value; // 👈 Insertamos el valor real (con tildes, etc.)
                regionList.innerHTML = ""; // Limpiar lista
            };
            regionList.appendChild(opcion);
        });
});
// ✅ Variables globales para la dirección
let direccionTemp = "";
let ciudadTemp = "";
let regionTemp = "";
let codigoPostalTemp = "";

// ✅ Evento al agregar dirección
document.getElementById("addDirection").addEventListener("click", function () {
    direccionTemp = document.getElementById("direccionInput").value;
    ciudadTemp = document.getElementById("ciudadInput").value;
    regionTemp = document.getElementById("regionInput").value;
    codigoPostalTemp = document.getElementById("postalInput").value;

    // Validación de campos
    if (!direccionTemp || !ciudadTemp || !regionTemp || !codigoPostalTemp) {
        alert("⚠️ Todos los campos son obligatorios");
        return;
    }

    // Mostrar dirección agregada
    document.querySelector(".direccion-predeterminada").innerHTML = `
    <div class="card mt-3 p-3 bg-light">
        <h5 class="card-title">Dirección agregada</h5>
        <p class="card-text direccion"><strong>Dirección:</strong> ${direccionTemp}</p>
        <p class="card-text ciudadDirec"><strong>Ciudad:</strong> ${ciudadTemp}</p>
        <p class="card-text region"><strong>Región:</strong> ${regionTemp}</p>
        <p class="card-text codigo-postal"><strong>Código Postal:</strong> ${codigoPostalTemp}</p>
    </div>
`;
    limpiarCampos(); // Limpiar campos
    cerrarModal();   // Cerrar modal
});

// ✅ Función para limpiar campos
function limpiarCampos() {
    document.getElementById("direccionInput").value = "";
    document.getElementById("ciudadInput").value = "";
    document.getElementById("regionInput").value = "";
    document.getElementById("postalInput").value = "";
    regionList.innerHTML = ""; // Limpiar lista
}

// ✅ Función para cerrar el modal correctamente
function cerrarModal() {
    const modalElement = document.getElementById('exampleModal');
    const modal = bootstrap.Modal.getInstance(modalElement);

    if (!modal) {
        // Si el modal no está inicializado, lo inicializamos
        new bootstrap.Modal(modalElement).hide();
    } else {
        // Si ya está inicializado, lo cerramos
        modal.hide();
    }
}

// ✅ Reiniciar modal al abrirlo
document.getElementById('exampleModal').addEventListener('show.bs.modal', () => {
    limpiarCampos(); // Limpiar campos al abrir el modal
});

// ✅ Reiniciar modal al cerrarlo
document.getElementById('exampleModal').addEventListener('hidden.bs.modal', () => {
    limpiarCampos(); // Limpiar campos al cerrar el modal
});

// Evento para crear cliente
document.getElementById("btnCrearCliente").addEventListener("click", async function () {
    // Capturar datos del formulario
    const nombre = document.querySelector(".nombre")?.value.trim() || "";
    const apellido = document.querySelector(".apellido")?.value.trim() || "";
    const email = document.querySelector(".email")?.value.trim() || "";
    const telefono = document.querySelector(".telefono")?.value.trim() || "";
    const ruc = document.querySelector(".rucDni")?.value.trim() || "";

    // Capturar valores dinámicos, usando || "" para evitar null
    const direccionValor = document.querySelector(".direccion")?.textContent.replace("Dirección: ", "").trim() || "";
    const ciudadValor = document.querySelector(".ciudadDirec")?.textContent.replace("Ciudad: ", "").trim() || "";
    const regionValor = document.querySelector(".region")?.textContent.replace("Región: ", "").trim() || "";
    const codigoPostalValor = document.querySelector(".codigo-postal")?.textContent.replace("Código Postal: ", "").trim() || "";

    // Limpiar alertas previas
    const errorAlert = document.getElementById("errorAlert");
    errorAlert.classList.add("d-none");
    errorAlert.innerHTML = "";
    let errores = [];

    // Validaciones obligatorias
    if (!nombre) errores.push("⚠️ El campo Nombre es obligatorio");
    if (!apellido) errores.push("⚠️ El campo Apellido es obligatorio");

    // Validación de número de teléfono
    const telefonoRegex = /^[0-9]{9}$/;
    if (telefono && !telefonoRegex.test(telefono)) {
        errores.push("⚠️ El teléfono debe tener exactamente 9 dígitos numéricos");
    }

    // Validación de RUC o DNI
    const rucDniRegex = /^[0-9]{8,11}$/;
    if (ruc && !rucDniRegex.test(ruc)) {
        errores.push("⚠️ El RUC o DNI debe tener entre 8 y 11 dígitos numéricos");
    }

    // Validación de código postal (si existe)
    const postalRegex = /^[0-9]+$/;
    if (codigoPostalValor && !postalRegex.test(codigoPostalValor)) {
        errores.push("⚠️ El código postal debe contener solo números");
    }

    // Validación de email
    const emailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    if (email && !emailRegex.test(email)) {
        errores.push("⚠️ El email debe ser un correo de Gmail (ejemplo@gmail.com)");
    }

    // Mostrar errores si existen
    if (errores.length > 0) {
        errorAlert.innerHTML = errores.join("<br>");
        errorAlert.classList.remove("d-none");
        return;
    }

    // Crear objeto usuarioData con valores opcionales
    const usuarioData = {
        email: email,
        first_name: nombre,
        last_name: apellido,
        phone: telefono,
        ruc: ruc,
        ciudad: ciudadValor || "", // Valor vacío si es null
        direccion: direccionValor || "", // Valor vacío si es null
        codPostal: codigoPostalValor || "", // Valor vacío si es null
        region: regionValor || "", // Valor vacío si es null
        password: "123" // Usa un valor seguro en producción
    };
    console.log("DATOS DE DASH:", usuarioData);

    // Petición POST
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/api/registro/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuarioData)
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error("La respuesta no es un JSON válido");
        }

        if (response.ok) {
            mostrarModalExito();
        } else {
            alert("❌ Error en el registro: " + (result.error || "Respuesta no válida"));
        }
    } catch (error) {
        alert("❌ Error de conexión o respuesta inválida");
        console.error("Error detectado:", error);
    }

    // Función para mostrar el modal de éxito
    function mostrarModalExito() {
        const modal = new bootstrap.Modal(document.getElementById('modalExito'));
        modal.show();
    }
});


// ✅ Función para redirigir
function redirigir() {
    const baseUrl = document.body.dataset.apiUrl;
    window.location.href = `${baseUrl}/dash-allUsers/`;
}