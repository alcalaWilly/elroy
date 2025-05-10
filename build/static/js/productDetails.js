let currentProductData = null; // 

if (window.location.pathname === "/shop/details/") {
    function getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');

    }


    const productId = getProductIdFromURL();
    // Solicitar datos del producto y tallas y colores en una sola llamada
    fetchProductDetailsAndVariants(productId)
        .then(({ productData, sizes, colors }) => {
            console.log("Detalles del producto:", productData);

            currentProductData = productData;

            if (productData.product && productData.product.imagenes && productData.product.imagenes.length > 0) {
                console.log("Imágenes recibidas:", productData.product.imagenes);
                renderizarImagenes(productData.product.imagenes);
            } else {
                console.warn("No hay imágenes disponibles.");
            }

            addDetalle(productData.product, sizes, colors);

            console.log("ID CATEGORIAAA", productData.product.category)
            // 🔥 PASAMOS LA CATEGORÍA directamente
            loadRelatedProducts(productData.product.category, productData.product.id);
        })
        .catch(error => console.error("Error en la solicitud del producto:", error));

}

// Función optimizada que hace solo una llamada a la API
async function fetchProductDetailsAndVariants(productId) {
    try {
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/product/${productId}`);

        if (!response.ok) {
            throw new Error("Error al obtener el producto");
        }

        const data = await response.json();

        // Obtener las tallas y colores del producto
        const sizesData = data.tallas || []; // Extraer tallas del JSON
        const colors = data.colores || [];   // Asegúrate de que tu API tenga este campo

        // Mantener id y cNombreTalla en cada talla
        const sizes = sizesData.map(talla => ({
            id: talla.id,  // ID del stock de talla
            cNombreTalla: talla.talla.cNombreTalla // Nombre de la talla
        }));

        return { productData: data, sizes, colors };
    } catch (error) {
        console.error("Error obteniendo detalles, tallas o colores:", error);
        return { productData: {}, sizes: [], colors: [] };
    }
}



// function renderizarImagenes(imagenes) {
//     const thumbnailsContainer = document.getElementById("image-thumbnails");
//     const mainImage = document.getElementById("MainProductImg");
//     const loader = document.getElementById("loader"); // Elemento de carga

//     if (!thumbnailsContainer || !mainImage || !loader) {
//         console.error("No se encontraron los elementos en el DOM.");
//         return;
//     }

//     // Mostrar el loader antes de cargar las imágenes
//     loader.style.display = "block";

//     // Limpiar contenido anterior
//     thumbnailsContainer.innerHTML = "";

//     // Verificar que haya imágenes antes de acceder a ellas
//     if (imagenes.length === 0) {
//         loader.style.display = "none"; // Ocultar el loader si no hay imágenes
//         return;
//     }

//     // Establecer la primera imagen como imagen principal
//     mainImage.src = imagenes[0].cRutaImagen;

//     let imagesLoaded = 0;

//     // Generar miniaturas dinámicamente
//     imagenes.forEach((imagen, index) => {
//         const imgElement = document.createElement("img");
//         imgElement.src = imagen.cRutaImagen;
//         imgElement.alt = `Imagen ${index + 1}`;
//         imgElement.classList.add("list__img", "image__sector-show");

//         // Si es la primera imagen, añadir clase de seleccionada
//         if (index === 0) {
//             imgElement.classList.add("selected-thumbnail");
//         }

//         // Evento para cambiar la imagen principal al hacer clic
//         imgElement.addEventListener("click", () => {
//             mainImage.src = imagen.cRutaImagen;

//             // Quitar la clase de seleccionado de todas las miniaturas
//             document.querySelectorAll(".list__img").forEach(img => {
//                 img.classList.remove("selected-thumbnail");
//             });

//             // Agregar la clase de seleccionado a la miniatura actual
//             imgElement.classList.add("selected-thumbnail");
//         });

//         // Evento cuando la imagen se haya cargado
//         imgElement.onload = () => {
//             imagesLoaded++;
//             if (imagesLoaded === imagenes.length) {
//                 loader.style.display = "none"; // Ocultar el loader cuando todas las imágenes carguen
//             }
//         };

//         // Manejo de error si una imagen no carga
//         imgElement.onerror = () => {
//             console.error(`Error al cargar la imagen: ${imagen.cRutaImagen}`);
//             imagesLoaded++;
//             if (imagesLoaded === imagenes.length) {
//                 loader.style.display = "none";
//             }
//         };

//         // Agregar la miniatura al contenedor
//         thumbnailsContainer.appendChild(imgElement);
//     });
// }



// PARA EL DETALLE DEL PRODUCTO
// Modificación de addDetalle para incluir colores

function renderizarImagenes(imagenes) {
    const thumbnailsContainer = document.getElementById("image-thumbnails");
    const mainImage = document.getElementById("MainProductImg");
    const loader = document.getElementById("loader"); // Elemento de carga

    if (!thumbnailsContainer || !mainImage || !loader) {
        console.error("No se encontraron los elementos en el DOM.");
        return;
    }

    loader.style.display = "block";
    thumbnailsContainer.innerHTML = "";

    if (imagenes.length === 0) {
        loader.style.display = "none";
        return;
    }

    mainImage.src = imagenes[0].cRutaImagen;

    let imagesLoaded = 0;

    imagenes.forEach((imagen, index) => {
        // Creamos el contenedor
        const wrapper = document.createElement("div");
        wrapper.classList.add("thumbnail-wrapper");

        const imgElement = document.createElement("img");
        imgElement.src = imagen.cRutaImagen;
        imgElement.alt = `Imagen ${index + 1}`;
        imgElement.classList.add("list__img", "image__sector-show");

        // Si es la primera imagen, marcar como seleccionada
        if (index === 0) {
            wrapper.classList.add("selected-thumbnail");
        }

        imgElement.addEventListener("click", () => {
            mainImage.src = imagen.cRutaImagen;

            // Quitar la clase a todos los wrappers
            document.querySelectorAll(".thumbnail-wrapper").forEach(w => {
                w.classList.remove("selected-thumbnail");
            });

            // Agregar la clase al wrapper clickeado
            wrapper.classList.add("selected-thumbnail");
        });

        imgElement.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === imagenes.length) {
                loader.style.display = "none";
            }
        };

        imgElement.onerror = () => {
            console.error(`Error al cargar la imagen: ${imagen.cRutaImagen}`);
            imagesLoaded++;
            if (imagesLoaded === imagenes.length) {
                loader.style.display = "none";
            }
        };

        // Meter la imagen dentro del contenedor
        wrapper.appendChild(imgElement);
        thumbnailsContainer.appendChild(wrapper);
    });
}


function addDetalle(datos, sizes, colors) {
    const titleElement = document.querySelector(".details__title");
    const priceElement = document.querySelector(".details__price");
    const discountElement = document.querySelector(".details__descount");
    const sizeContainer = document.querySelector(".details__size-selected");
    const descriptionElement = document.querySelector(".detail__description");

    if (!titleElement || !priceElement || !discountElement || !sizeContainer || !descriptionElement) {
        console.error("Algunos elementos no existen en el DOM.");
        return;
    }

    titleElement.textContent = datos.name || "Producto sin nombre";

    const originalPrice = parseFloat(datos.price);
    let finalPrice = originalPrice;

    const promo = datos.promotions && datos.promotions.length > 0 ? datos.promotions[0] : null;

    if (promo && promo.code === "") {
        const discountValue = parseFloat(promo.discount_percentage);
        if (promo.money) {
            // Descuento directo en dinero
            finalPrice = Math.max(originalPrice - discountValue, 0);
        } else {
            // Descuento en porcentaje
            finalPrice = originalPrice * (1 - discountValue / 100);
        }

        priceElement.textContent = `$${finalPrice.toFixed(2)}`;
        discountElement.textContent = `$${originalPrice.toFixed(2)}`;
        discountElement.style.display = "inline";
    } else {
        // No hay promoción válida o el code está lleno → no aplicar descuento
        priceElement.textContent = `$${originalPrice.toFixed(2)}`;
        discountElement.style.display = "none";
    }

    renderSizesAndColors({ sizes, colors }, sizeContainer, datos.id);

    descriptionElement.textContent = datos.description || "No hay descripción disponible.";
}


// Función para convertir color hexadecimal a RGB
function hexToRgb(hex) {
    // Eliminar el signo '#' del comienzo si está presente
    hex = hex.replace(/^#/, '');

    // Convertir el valor hexadecimal a RGB
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
}

// Función para renderizar tallas o colores
function renderSizesAndColors({ sizes, colors }, container, productId) {
    container.innerHTML = "";

    const titleElement = document.querySelector(".details__size-Size");
    const selectionMessage = document.createElement("span");
    selectionMessage.classList.add("selection-message");
    const messageSpan = document.querySelector(".meage-sizeColor");
    container.appendChild(selectionMessage);

    let selectedSizeId = null;
    let selectedColor = null;

    if (sizes.length > 0) {
        sizes.forEach((size) => {
            const sizeElement = document.createElement("div");
            sizeElement.classList.add("selectSize-size");

            sizeElement.innerHTML = `
          <a class="typeSize" 
             href="javascript:void(0);" 
             data-size-id="${size.id}" 
             data-product-id="${productId}">
            ${size.cNombreTalla}
          </a>`;

            sizeElement.addEventListener("click", (event) => {
                if (event.target.tagName === "A") event.preventDefault();
                selectedSizeId = size.id;
                selectedColor = null;

                document.querySelectorAll(".selectSize-size").forEach(el => {
                    el.classList.remove("selected-size");
                });

                sizeElement.classList.add("selected-size");

                messageSpan.innerHTML = `Talla seleccionada: <span class="styled-size">${size.cNombreTalla}</span>, quedan pocos!`;
            });

            container.appendChild(sizeElement);
        });

        document.getElementById("addToCartButton").addEventListener("click", () => {
            if (selectedSizeId) {
                addToCart(productId, selectedSizeId, null);
            } else {
                messageSpan.innerHTML = `<span class="alerTalla">¡Por favor, selecciona una talla antes de agregar al carrito!</span>`;
            }
        });
    }

    else if (colors.length > 0) {
        colors.forEach((color) => {
            const rgbColor = hexToRgb(color.color);
            const colorElement = document.createElement("div");
            colorElement.classList.add("color-circle");
            colorElement.style.backgroundColor = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;

            colorElement.addEventListener("click", () => {
                selectedColor = color.color;
                messageSpan.innerHTML = `
              Color seleccionado: <span class="styled-color">${color.color}</span>
              <div class="color-rectangle" style="background-color: ${color.color};"></div>
            `;
            });

            container.appendChild(colorElement);
        });

        document.getElementById("addToCartButton").addEventListener("click", () => {
            if (selectedColor) {
                addToCart(productId, null, selectedColor);
            } else {
                messageSpan.innerHTML = `<span class="alerTalla">¡Por favor, selecciona un color antes de agregar al carrito!</span>`;
            }
        });
    }

    else {
        titleElement.textContent = "Opciones";
        container.innerHTML = "<p>Sin tallas ni colores disponibles</p>";
    }
}


// async function loadRelatedProducts() {
//     try {
//         const response = await fetch('http://127.0.0.1:8000/get-products/');
//         const data = await response.json();

//         const swiperWrapper = document.querySelector('#related-products .new-wrapper'); // Seleccionamos el contenedor de productos nuevos
//         const products = data.products.slice(0, 6); // Limitar a 4 productos

//         swiperWrapper.innerHTML = ''; // Limpiar productos existentes

//         products.forEach(product => {
//             const productElement = createProductElementRelated(product);
//             swiperWrapper.appendChild(productElement);
//             addEventListeners(product, productElement);
//         });

//         initSwipers(); // Inicializar el Swiper después de cargar los productos

//     } catch (error) {
//         console.error('Error al cargar productos nuevos:', error);
//     }
// }

async function loadRelatedProducts(categoryId, currentProductId) {
    try {
        if (!categoryId) {
            console.error('No se recibió una categoría válida.');
            return;
        }

        console.log("Categoría del producto actual:", categoryId);
        const baseUrl = document.body.dataset.apiUrl;
        const response = await fetch(`${baseUrl}/get-products/`);
        const data = await response.json();

        const swiperWrapper = document.querySelector('#related-products .new-wrapper');
        swiperWrapper.innerHTML = '';

        const relatedProducts = data.products.filter(product =>
            product.category === categoryId && product.id !== currentProductId
        );

        const productsToShow = relatedProducts.slice(0, 6);

        if (productsToShow.length === 0) {
            console.log('No hay productos relacionados para esta categoría.');
            return;
        }

        productsToShow.forEach(product => {
            const productElement = createProductElementRelated(product);
            swiperWrapper.appendChild(productElement);
            addEventListeners(product, productElement);
        });

        initSwipers();
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
    }
}

function createProductElementRelated(product) {
    const productElement = document.createElement("div");
    productElement.classList.add("new__content", "swiper-slide");

    // Obtener imágenes de manera segura
    const image1 = product.imagenes?.[0]?.cRutaImagen || "/media/photos/default.jpg";
    const image2 = product.imagenes?.[1]?.cRutaImagen || "/media/photos/default.jpg";

    // Obtener tallas disponibles
    const sizes = product.tallas?.map(talla => `<button class="size-option">${talla.talla.cNombreTalla}</button>`).join("") || "<span>Sin tallas disponibles</span>";

    productElement.innerHTML = `
        <a href="/shop/details/?id=${product.id}">
            <div class="new__tag">New</div> <!-- Se elimina el porcentaje de descuento -->
            <img src="${image1}" alt="${product.name}" class="new__img">
            <img src="${image2}" alt="${product.name}" class="new__img2">
            <h3 class="new__title">${product.name}</h3>
            <div class="new__prices">
                <span class="new__price">S/${product.price}</span>
            </div>
            <div>
                <a href="javascript:void(0);" class="button new__button add-to-cart" data-product-id="${product.id}" id="toggleSize-${product.id}" aria-expanded="false" aria-controls="selectSize-${product.id}">
                    <i class="bx bx-cart-alt new__icon"></i>
                </a>
                <div class="selectSize" id="selectSize-${product.id}" hidden>
                    <div>
                        <i class="bx bx-x cart__close" id="closeSize-${product.id}"></i>
                    </div>
                    <div>
                        <span class="selectSize-title">Seleccionar Talla</span>
                        <div class="selectSize-all" id="sizeContainer-${product.id}">
                            ${sizes}
                        </div>
                    </div>
                </div>
            </div>
        </a>
    `;

    return productElement;
}

function initSwipers() {
    const sections = document.querySelectorAll(".new.section");

    sections.forEach((section, index) => {
        const swiperContainer = section.querySelector(".mySwiper");
        const wrapper = section.querySelector(".new-wrapper");

        if (!swiperContainer || !wrapper) {
            console.warn(`Sección ${index + 1} no tiene un Swiper o wrapper válido.`);
            return;
        }

        if (window.innerWidth > 767) {
            if (!swipers[index]) {
                swipers[index] = new Swiper(swiperContainer, {
                    watchSlidesProgress: true,
                    slidesPerView: "auto",
                    spaceBetween: 0, // Ajusta el espacio entre productos
                    freeMode: true,
                });
            }
            wrapper.style.display = "flex"; // Diseño para Swiper en pantallas grandes
            wrapper.style.gridTemplateColumns = ""; // Resetear estilos de grid
        } else {
            destroySwiperIfInitialized(index);
            wrapper.style.display = "grid";
            wrapper.style.gridTemplateColumns = "repeat(2, 1fr)"; // Siempre 2 columnas
        }
    });
}

// Función para destruir Swiper si ya está inicializado
function destroySwiperIfInitialized(index) {
    if (swipers[index]) {
        swipers[index].destroy(true, true);
        swipers[index] = null;
    }
}


// let swipersRelated = [];

// async function loadProductsByCategory(productId) {
//     try {
//         const { productData } = await fetchProductDetailsAndVariants(productId);
//         const categoryId = Number(productData.category);

//         if (!categoryId) {
//             console.error('No se encontró categoría para el producto');
//             return;
//         }

//         // const productIdNumber = Number(productId);

//         const response = await fetch('http://127.0.0.1:8000/get-products/');
//         const data = await response.json();
//         const allProducts = data.products;

//         const filteredProducts = allProducts.filter(product =>
//             Number(product.category) === categoryId && Number(product.id) !== productId
//         );

//         const productsToShow = filteredProducts.slice(0, 6);

//         const swiperWrapper = document.querySelector('#related-products .new-wrapper');
//         swiperWrapper.innerHTML = '';

//         productsToShow.forEach(product => {
//             const productElement = createProductRelated(product);
//             swiperWrapper.appendChild(productElement);
//             addEventListeners(product, productElement);
//         });

//         initSwipersRelated();
//     } catch (error) {
//         console.error('Error al cargar productos por categoría:', error);
//     }
// }

// function createProductRelated(product) {
//     const productElement = document.createElement("div");
//     productElement.classList.add("new__content", "swiper-slide");

//     const image1 = product.imagenes?.[0]?.cRutaImagen || "/media/photos/default.jpg";
//     const image2 = product.imagenes?.[1]?.cRutaImagen || "/media/photos/default.jpg";

//     const sizes = product.tallas?.map(talla => `
//         <button class="size-option">${talla.talla.cNombreTalla}</button>
//     `).join("") || "<span>Sin tallas disponibles</span>";

//     productElement.innerHTML = `
//         <div class="new__tag">New</div>
//         <img src="${image1}" alt="${product.name}" class="new__img">
//         <span class="new__img2" style="background-image:url('${image2}')"></span>
//         <h3 class="new__title">${product.name}</h3>
//         <div class="new__prices">
//             <span class="new__price">S/${product.price}</span>
//         </div>
//         <div>
//             <a href="javascript:void(0);" class="button new__button add-to-cart" data-product-id="${product.id}" id="toggleSize-${product.id}" aria-expanded="false" aria-controls="selectSize-${product.id}">
//                 <i class="bx bx-cart-alt new__icon"></i>
//             </a>
//             <div class="selectSize" id="selectSize-${product.id}" hidden>
//                 <div>
//                     <i class="bx bx-x cart__close" id="closeSize-${product.id}"></i>
//                 </div>
//                 <div>
//                     <span class="selectSize-title">Seleccionar Talla</span>
//                     <div class="selectSize-all" id="sizeContainer-${product.id}">
//                         ${sizes}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;

//     return productElement;
// }

// function initSwipersRelated() {
//     const section = document.querySelector(".new.section");

//     if (!section) {
//         console.warn("No se encontró la sección de productos relacionados.");
//         return;
//     }

//     const swiperContainer = section.querySelector(".mySwiper");
//     const wrapper = section.querySelector(".new-wrapper");

//     if (!swiperContainer || !wrapper) {
//         console.warn("No se encontró un Swiper o wrapper válido en productos relacionados.");
//         return;
//     }

//     // 🛑 PRIMERO: Destruir si ya existe
//     destroySwiperIfInitialized(0); // Siempre usamos índice 0 para related-products

//     if (window.innerWidth > 767) {
//         // ✅ LUEGO: Crear nuevo swiper
//         swipersRelated[0] = new Swiper(swiperContainer, {
//             watchSlidesProgress: true,
//             slidesPerView: "auto",
//             spaceBetween: 10,
//             freeMode: true,
//         });
//         wrapper.style.display = "flex";
//         wrapper.style.gridTemplateColumns = "";
//     } else {
//         // Si es mobile, no creamos swiper, sólo organizamos el grid
//         wrapper.style.display = "grid";
//         wrapper.style.gridTemplateColumns = "repeat(2, 1fr)";
//     }
// }

// function destroySwiperIfInitialized(index) {
//     if (swipersRelated[index]) {
//         swipersRelated[index].destroy(true, true); // destroy(deleteInstance, cleanStyles)
//         swipersRelated[index] = undefined;
//     }
// }

