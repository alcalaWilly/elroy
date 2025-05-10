

async function addToCart(productId, sizeId = null, colorRGB = null) {
    console.log("Producto agregadooooooo:", productId, "Talla:", sizeId, "Color:", colorRGB);

    const accessToken = localStorage.getItem("access_token");

    if (accessToken) {

        // 🔄 Si hay sizeId, reemplazarlo por talla.id real usando la API
        // if (sizeId !== null) {
        //     try {
        //         const response = await fetch(`http://127.0.0.1:8000/product/${productId}`);
        //         const productData = await response.json();
        
        //         // Buscar el objeto del array tallas con ID igual a sizeId
        //         const selectedTallaStock = productData.tallas.find(t => t.id === Number(sizeId));
        
        //         if (selectedTallaStock?.talla?.id) {
        //             console.log(`🔁 Reemplazando sizeId ${sizeId} ➡️ talla.id ${selectedTallaStock.talla.id}`);
        //             sizeId = selectedTallaStock.talla.id;
        //         } else {
        //             console.warn("⚠️ No se pudo encontrar talla.id dentro del sizeId proporcionado.");
        //         }
        //     } catch (error) {
        //         console.error("❌ Error al obtener talla interna:", error);
        //     }
        // }
        

        // 🟢 Usuario autenticado: Enviar solicitud al backend
        const baseUrl = document.body.dataset.apiUrl;
        const url = `${baseUrl}/api/cart/add-item`;

        const data = {
            product_id: productId,
            ...(sizeId !== null && { talla_id: sizeId }),
            ...(colorRGB && { color: colorRGB }) // Agregar color si es diferente
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {

                updateCartCount();
                await loadCartItems();
                showMessage("Producto agregado al carrito.", "success");
                console.log("DATOS AGREGADOOOOOOS DESPUEEES", response);
            } else {
                console.error("❌ Error al agregar el producto:", result);
                showMessage(result.detail || "No se pudo agregar el producto.", "error");
            }
        } catch (error) {
            console.error("❌ Error en la solicitud:", error);
            showMessage("Hubo un error en la solicitud. Intenta de nuevo.", "error");
        }
    } else {
        // Recuperar el carrito desde LocalStorage
        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        // Convertir valores a números para comparación segura
        productId = Number(productId);
        sizeId = sizeId !== null ? String(sizeId) : null;
        colorRGB = colorRGB !== null ? String(colorRGB) : null;

        // Buscar producto existente
        const existingProduct = cart.find(item =>
            Number(item.product_id) === productId &&
            String(item.size_id) === sizeId &&
            String(item.color) === colorRGB
        );

        if (existingProduct) {
            // ✅ Incrementar cantidad si ya existe
            existingProduct.quantity += 1;
            console.log("Producto existente encontrado, cantidad aumentada:", existingProduct);
        } else {
            // 🆕 Agregar nuevo producto si no existe
            cart.push({
                product_id: productId,
                quantity: 1,
                ...(sizeId !== null && { size_id: sizeId }),
                ...(colorRGB && { color: colorRGB })
            });
            console.log("Producto agregado al carrito:", cart);
        }

        // Guardar carrito actualizado
        localStorage.setItem("cart", JSON.stringify(cart));
        cartData = JSON.parse(localStorage.getItem("cart")) || [];
        // console.log("DATOS AGREGADOOOOOOS ANTEEES", cartData);

        cartData = consolidateLocalCart(cartData);
        cartData = await consolidateCartData(cartData);
        localStorage.setItem("cart", JSON.stringify(cartData));
        console.log("DATOS AGREGADOOOOOOS DESPUEEES", cartData);
        updateCartCount();
        await loadCartItems();
        showMessage("Producto agregado al carrito (sin iniciar sesión).", "success");

    }

    function consolidateLocalCart(cart) {
        const cartMap = {};

        cart.forEach(item => {
            // Validar y normalizar `product_id`
            const productId = item.product_id ? String(item.product_id) : "missing_id";

            // Normalizar talla y color correctamente
            const sizeKey = item.size_id !== null && item.size_id !== undefined ? String(item.size_id) : "no_size";
            const colorKey = item.color ? item.color.toLowerCase().trim() : null;
            const count = item.count ?? 1;

            console.log("Después de normalizar:", {
                productId,
                type_product_id: typeof productId,
                sizeKey,
                type_size_id: typeof sizeKey,
                colorKey,
                type_color: typeof colorKey,
                count,
                type_count: typeof count
            });

            // Generar clave única asegurando consistencia
            const key = `${productId}_${sizeKey}_${colorKey}`;
            console.log(`Clave generada: ${key}`);

            if (cartMap[key]) {
                // ✅ Incrementar cantidad si ya existe la misma combinación
                cartMap[key].count += count;
            } else {
                // 🆕 Agregar nuevo si no existe
                cartMap[key] = { ...item, product_id: productId, size_id: sizeKey, color: colorKey, count };
            }
        });

        // 🔄 Convertir `cartMap` a un array
        return Object.values(cartMap);
    }





}



async function updateCartCount() {
    const accessToken = localStorage.getItem("access_token");
    let totalItems = 0;

    if (accessToken) {
        // 🟢 Usuario autenticado: Obtener el total desde el backend
        const baseUrl = document.body.dataset.apiUrl;
        const url = `${baseUrl}/api/cart/get-item-total`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Total de productos en el carrito:", result.total_items);
                totalItems = result.total_items;
            } else {
                console.error("Error al obtener el total del carrito:", result);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
        }
    } else {
        // 🔴 Usuario no autenticado: Agrupar productos únicos en LocalStorage
        console.warn("Usuario no autenticado. Contando productos en LocalStorage...");
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        // Crear un Set para filtrar productos únicos por product_id, size_id y color
        const uniqueItems = new Set(cart.map(item => `${item.product_id}_${item.size_id}_${item.color || "no_color"}`));

        // La longitud del Set representa el número de productos únicos, considerando también el color
        totalItems = uniqueItems.size;
    }

    // Actualizar el número de productos en el carrito
    const cartShop = document.getElementById("cart-shop");
    if (cartShop) {
        cartShop.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <i class="bx bx-cart-alt" id="link3"></i>
                ${totalItems > 0 ? `<span class="cart-count">${totalItems}</span>` : ""}
            </div>
        `;
    }
}


async function fetchCartItems() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No hay token de acceso disponible.");
        return null;
    }
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/cart/cart-items`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Error al obtener los productos del carrito.");
        return await response.json();
    } catch (error) {
        console.error("Error en fetchCartItems:", error);
        return null;
    }
}

async function fetchCartTotal() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        console.error("No hay token de acceso disponible.");
        return null;
    }
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/cart/get-total`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Error al obtener el total del carrito.");
        return await response.json();
    } catch (error) {
        console.error("Error en fetchCartTotal:", error);
        return null;
    }
}

async function consolidateCartData(cartData) {
    // Consolidar productos repetidos por ID, talla y color
    const consolidatedCart = cartData.reduce((acc, item) => {
        // Crear una clave única que considere el color
        const key = `${item.product?.id || item.product_id}_${item.size_id || item.talla}_${item.color || "no_color"}`;

        if (acc[key]) {
            acc[key].count += item.quantity || item.count;
        } else {
            acc[key] = { ...item };
        }
        return acc;
    }, {});

    // Convertir el objeto a un array
    const consolidatedArray = Object.values(consolidatedCart);

    // Obtener productos únicos
    const uniqueProductIds = [...new Set(consolidatedArray.map(item => item.product?.id || item.product_id))];

    // Solicitar detalles de productos
    const baseUrl = document.body.dataset.apiUrl;
    const productResponses = await Promise.all(
        uniqueProductIds.map(id =>
            fetch(`${baseUrl}/product/${id}`)
                .then(response => response.ok ? response.json() : null)
                .catch(() => null)
        )
    );

    // Crear un mapa de productos
    const productMap = {};
    productResponses.forEach(data => {
        if (data) productMap[data.product.id] = data;
    });

    // Completar datos con tallas
    return consolidatedArray.map(item => {
        const productDetails = productMap[item.product?.id || item.product_id];
        let cNombreTalla = null;
        let sizeId = null;

        if (productDetails?.tallas) {
            const tallaEncontrada = productDetails.tallas.find(talla =>
                talla.talla?.id === Number(item.size_id || item.talla)
            );
            cNombreTalla = tallaEncontrada ? tallaEncontrada.talla.cNombreTalla : null;
            sizeId = tallaEncontrada ? tallaEncontrada.talla.id : null; // ← usamos el id real de la talla
        }
        

        return {
            product: productDetails?.product || item.product,
            count: item.quantity || item.count,
            talla: cNombreTalla,
            size_id: sizeId,
            color: item.color || null
        };
    });
}


async function loadCartItems() {
    try {
        const accessToken = localStorage.getItem("access_token");
        const cartContainer = document.querySelector(".cart__container");
        const totalElement = document.querySelector(".cart__total");
        // const checkoutButton = document.querySelector(".cart__button");
        const checkoutButtonContainer = document.getElementById("checkout-button-container");


        cartContainer.innerHTML = "";
        // checkoutButton.disabled = true;
        checkoutButtonContainer.innerHTML = ""; // Limpiar el botón previo si existe

        let cartData = [];
        let totalCost = 0;

        if (accessToken) {
            // Usuario autenticado
            const [cartResponse, totalResponse] = await Promise.all([fetchCartItems(), fetchCartTotal()]);

            if (!cartResponse || !totalResponse) return;

            cartData = await consolidateCartData(cartResponse.cart);
            totalCost = totalResponse.total_cost;
        } else {
            cartData = JSON.parse(localStorage.getItem("cart")) || [];
        }

        // Consolidar productos duplicados en el carrito
        console.log("DATOOOOOS GENERAAAL", cartData);

        // Calcular el costo total
        totalCost = cartData.reduce((acc, item) => acc + (item.product.price * item.count), 0);

        // Renderizar carrito
        cartData.forEach(item => {
            const product = item.product;
            const tallaHTML = item.talla ? `<span>Size:</span> <span>${item.talla}</span>` : "";
            const colorHTML = item.color ? `<span>Color:</span> <span style="background-color: ${item.color}; width: 20px; height: 20px; display: inline-block; border-radius: 50%;"></span>` : "";

            cartContainer.innerHTML += `
                <article class="cart__card" data-product-id="${product.id}">
                    <div class="cart__box">
                        <img src="${product.imagenes[0]?.cRutaImagen || 'assets/img/default.png'}" alt="${product.name}" class="cart__img lazy">
                    </div>
                    <div class="cart__details">
                        <h3 class="cart__title">${product.name}</h3>
                        <div class="cart__size-color">${tallaHTML} ${colorHTML}</div>
                        <span class="cart__price">s/${product.price}</span>
                        <div class="cart__amount">
                            <div class="cart__amount-content">
                                <span class="cart__amount-box cart__minus" data-product-id="${product.id}" data-size-id="${item.size_id}" data-color="${item.color}">
                                    <i class="bx bx-minus"></i>
                                </span>
                                <span class="cart__amount-number">${item.count}</span>
                                <span class="cart__amount-box cart__plus" data-product-id="${product.id}" data-size-id="${item.size_id}" data-color="${item.color}">
                                    <i class="bx bx-plus"></i>
                                </span>
                            </div>
                            <i class="bx bx-trash-alt cart__amount-trash" data-product-id="${product.id}" data-size-id="${item.size_id}" data-color="${item.color}">
                            </i>
                        </div>
                    </div>
                </article>
            `;
        });

        // Calcular el costo total nuevamente
        totalCost = cartData.reduce((acc, item) => acc + (item.product.price * item.count), 0);
        totalElement.textContent = `s/ ${totalCost.toFixed(2)}`;

        // if (cartData.length > 0) {
        //     checkoutButton.disabled = false;
        // }

        // Configurar los eventos para actualizar la cantidad
        document.querySelectorAll(".cart__plus").forEach(button => {
            button.addEventListener("click", async (event) => {
                const productId = Number(event.currentTarget.getAttribute("data-product-id"));
                const sizeId = event.currentTarget.getAttribute("data-size-id");
                const color = event.currentTarget.getAttribute("data-color");

                if (!productId || !sizeId) {
                    console.warn("Product ID o Size ID no válido");
                    return;
                }

                await updateCartItem(productId, 1, sizeId, color);
            });
        });

        document.querySelectorAll(".cart__minus").forEach(button => {
            button.addEventListener("click", async (event) => {
                const productId = Number(event.currentTarget.getAttribute("data-product-id"));
                const sizeId = event.currentTarget.getAttribute("data-size-id");
                const color = event.currentTarget.getAttribute("data-color");

                if (!productId || !sizeId) {
                    console.warn("Product ID o Size ID no válido");
                    return;
                }

                await updateCartItem(productId, -1, sizeId, color);
            });
        });

        // Evento de eliminación con color
        document.querySelectorAll(".cart__amount-trash").forEach(button => {
            button.addEventListener("click", async (event) => {
                const productId = event.currentTarget.getAttribute("data-product-id");
                const sizeId = event.currentTarget.getAttribute("data-size-id");
                const color = event.currentTarget.getAttribute("data-color");

                await removeItemFromCart(productId, sizeId, color); // Enviar color para eliminar el ítem correcto
            });
        });
        // Asumimos que `cartData` contiene los productos en el carrito

        if (cartData.length > 0) {
            // Aquí añadimos el botón de Checkout al contenedor
            const checkoutButtonContainer = document.getElementById("checkout-button-container");
            checkoutButtonContainer.innerHTML = `
                <a id="cart__button" href="javascript:void(0);" class="cart__button">
                    Check Out
                    <div id="loading-spinner" class="loading-spinner"></div> <!-- Spinner -->
                </a>
            `;

            // Obtener el botón de checkout y el spinner
            const checkoutButton = document.getElementById("cart__button");
            const loadingSpinner = document.getElementById("loading-spinner");

            // Agregar evento de clic al botón de checkout
            checkoutButton.addEventListener("click", async function (event) {
                event.preventDefault();  // Evitar la acción por defecto del enlace

                // Mostrar el spinner de carga
                checkoutButton.disabled = true;  // Desactivar el botón para evitar múltiples clics
                loadingSpinner.style.display = "inline-block";  // Mostrar el spinner

                // Validar el accessToken
                const accessToken = localStorage.getItem("access_token");

                // Depuración
                console.log("accessToken:", accessToken);

                // Validar si existe accessToken
                if (!accessToken) {
                    agregarToast({
                        tipo: 'error',
                        titulo: 'Inicie sesión para el CHECKOUT.',
                        descripcion: "Iniciar sesión",
                        autoCierre: true
                    });

                    // Ocultar el spinner y habilitar el botón nuevamente
                    checkoutButton.disabled = false;
                    loadingSpinner.style.display = "none";
                    return;
                }

                // Verificar si el carrito está vacío
                if (cartData.length === 0) {
                    // Ocultar el spinner y habilitar el botón nuevamente
                    checkoutButton.disabled = false;
                    loadingSpinner.style.display = "none";
                    return;
                }

                // Guardar datos del carrito
                localStorage.setItem("checkout_data", JSON.stringify(cartData));

                // Obtener el token de Braintree
                const token = getToken();

                try {
                    const baseUrl = document.body.dataset.apiUrl;
                    const response = await fetch(`${baseUrl}/api/payment/get-token`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,  // Usamos el token de acceso almacenado
                            "Content-Type": "application/json"
                        }
                    });

                    const data = await response.json();
                    const clientToken = data.braintree_token;

                    // Ahora que tenemos el token, redirigir al checkout
                    window.location.href = "/shop/checkouts/";

                    // Guardamos el clientToken en el localStorage para accederlo luego
                    localStorage.setItem('braintree_client_token', clientToken);

                } catch (error) {
                    console.error("Error al obtener el token de Braintree:", error);

                    // Ocultar el spinner y habilitar el botón nuevamente
                    checkoutButton.disabled = false;
                    loadingSpinner.style.display = "none";
                }
            });
        }





    } catch (error) {
        console.error("Error en loadCartItems:", error);
    }
}

function getToken() {
    return localStorage.getItem("access_token");
}


async function removeItemFromCart(productId, sizeId = null, colorId = null) {
    const accessToken = localStorage.getItem("access_token");
    const productIdNum = Number(productId);
    const sizeIdNum = (sizeId !== null && sizeId !== "null" && !isNaN(Number(sizeId)))
        ? Number(sizeId)
        : String(null);  // Aquí convertimos el null en una cadena "null"


    // Normalizar el color si es un objeto RGB
    const colorIdStr = colorId !== null
        ? (typeof colorId === "object" ? `rgb(${colorId.r}, ${colorId.g}, ${colorId.b})` : String(colorId))
        : null;



    // Obtener el carrito desde localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // 🔹 Caso 1: Usuario NO logueado (modificar localStorage)
    if (!accessToken) {
        try {
            // Filtrar y eliminar los productos que coincidan con product.id y size_id o product.id y color
            const newCart = cart.filter(item =>
                !(
                    item.product.id === productIdNum &&
                    (
                        (sizeIdNum !== null && item.size_id === sizeIdNum) || // Coincidencia por talla
                        (colorIdStr !== null && item.color === colorIdStr)   // Coincidencia por color
                    )
                )
            );

            if (newCart.length === cart.length) {
                console.warn("⚠️ No se encontraron productos a eliminar.");
            } else {
                localStorage.setItem("cart", JSON.stringify(newCart));
                console.log("✅ Productos eliminados del localStorage.");
                await loadCartItems();
                await updateCartCount();
            }
        } catch (error) {
            console.error("❌ Error al manipular el localStorage:", error);
        }
        return;
    }

    // 🔹 Caso 2: Usuario logueado (eliminar del backend)
    try {

        console.log("📌 PRODUCTO:", productIdNum, "Tipo de dato:", typeof productIdNum);
        console.log("📌 TALLA:", sizeIdNum, "Tipo de dato:", typeof sizeIdNum);
        console.log("📌 COLOR:", colorIdStr, "Tipo de dato:", typeof colorIdStr);
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/api/cart/remove-item`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product_id: productIdNum,
                talla_id: sizeIdNum,
                color: colorIdStr
            })
        });

        if (response.ok) {
            console.log("✅ Producto eliminado del servidor.");
            await loadCartItems();
            await updateCartCount();
        } else {
            const data = await response.json();
            console.error("❌ Error al eliminar el producto del servidor:", data);
        }
    } catch (error) {
        console.error("❌ Error en removeItemFromCart:", error);
    }
}


async function updateCartItem(productId, change, sizeId = null) {
    const accessToken = localStorage.getItem("access_token");

    console.log("Enviando a backend:");
    console.log("Product ID:", productId, "Tipo de dato:", typeof productId);
    console.log("Cantidad:", change, "Tipo de dato:", typeof change);

    sizeId = parseInt(sizeId)

    console.log("Talla ID:", sizeId, "Tipo de dato:", typeof sizeId);

    try {
        // Obtener la cantidad actual desde el DOM
        const productElement = document.querySelector(`.cart__card[data-product-id="${productId}"]`);
        if (!productElement) return;

        let countElement = productElement.querySelector(".cart__amount-number");
        let currentCount = parseInt(countElement.textContent);

        let newCount = currentCount + change;

        // ✅ Evitar cantidad negativa o cero antes de proceder
        if (newCount < 1) {
            await removeItemFromCart(productId);
            await loadCartItems();
            await updateCartCount();
            return;
        }

        // ✅ USUARIOS AUTENTICADOS
        if (accessToken) {
            const baseUrl = document.body.dataset.apiUrl;
            const response = await fetch(`${baseUrl}/api/cart/update-item`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    product_id: productId,
                    count: change,
                    talla_id: sizeId
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Producto actualizado correctamente:", data);
                await loadCartItems();
                await updateCartCount();
            } else {
                console.error("Error al actualizar el producto:", data.error);
            }
        } else {
            // ✅ USUARIOS NO AUTENTICADOS (localStorage)
            let cartItems = JSON.parse(localStorage.getItem("cart")) || [];

            // Buscar el producto considerando el sizeId si existe
            const itemIndex = cartItems.findIndex(item =>
                item.product_id === productId &&
                (sizeId ? item.size_id === sizeId : true) // Comparación segura
            );

            if (itemIndex !== -1) {
                // ✅ Actualizar la cantidad
                cartItems[itemIndex].quantity = newCount;
            } else {
                console.warn("Producto no encontrado en el carrito local");
                return;
            }

            // ✅ Guardar el carrito actualizado
            localStorage.setItem("cart", JSON.stringify(cartItems));
            console.log("Producto actualizado en localStorage:", cartItems);

            // ✅ Actualizar UI localmente
            countElement.textContent = newCount;
            await updateCartCount();
        }

    } catch (error) {
        console.error("Error en updateCartItem:", error);
    }
}


function showMessage(message, type = "success") {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}


// Llamar a la función al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    updateCartCount();
    loadCartItems();

    const accessToken = localStorage.getItem("access_token");
    let cartData = JSON.parse(localStorage.getItem("cart")) || [];
    console.log("📦 DATOS EN LOCALSTORAGE:", cartData);

    if (accessToken) {
        // 🟢 Usuario autenticado: Sincronizar el carrito con el backend
        await syncCartWithBackend(cartData, accessToken);
    }
});


async function syncCartWithBackend(cartData, accessToken) {
    const baseUrl = document.body.dataset.apiUrl;
    const url = `${baseUrl}/api/cart/add-item`;

    for (const item of cartData) {
        const data = {
            product_id: item.product.id,
            ...(item.size_id && { talla_id: item.size_id }),
            ...(item.color && { color: item.color }),
            count: item.count
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("❌ Error al sincronizar el producto:", result);
            }
        } catch (error) {
            console.error("❌ Error en la sincronización:", error);
        }
    }

    // Después de la sincronización, limpiar el carrito local
    localStorage.removeItem("cart");
}


// Hacer la función accesible globalmente
window.addToCart = addToCart;