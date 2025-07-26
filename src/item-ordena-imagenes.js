// Botón para volver al home
document.addEventListener('DOMContentLoaded', function() {
  var backHomeBtn = document.getElementById('backHomeButton');
  if (backHomeBtn) {
    backHomeBtn.onclick = function() {
      window.location.href = '../index.html';
    };
  }
});
document.addEventListener('DOMContentLoaded', async () => {
    const imageContainer = document.getElementById('image-container');
    const checkOrderButton = document.getElementById('checkOrderButton');
    const messageDisplay = document.getElementById('message');

    let draggedItem = null;
    let correctOrder = [];

    // --- Función para cargar la configuración desde item-ordena-imagenes-config.json ---
    async function loadConfig() {
        try {
            const response = await fetch('item-ordena-imagenes-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
            messageDisplay.textContent = 'Error al cargar la configuración del juego.';
            messageDisplay.className = 'incorrect';
            return null;
        }
    }

    // --- Función para mezclar un array (Algoritmo de Fisher-Yates) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Función principal para inicializar el juego ---
    async function initializeGame() {
        const config = await loadConfig();
        if (!config) return;

        const { numberOfImagesToOrder, imageGroups } = config;
        let selectedImages = [];
        let imageIdCounter = 1;

        // Obtener los nombres de los grupos de la forma "size1", "size2", etc.
        // y ordenarlos numéricamente para asegurar que se elijan en un orden predecible.
        const sortedGroupNames = Object.keys(imageGroups)
                                     .filter(name => name.startsWith('size'))
                                     .sort((a, b) => {
                                         const numA = parseInt(a.replace('size', ''));
                                         const numB = parseInt(b.replace('size', ''));
                                         return numA - numB;
                                     });

        // Asegurarse de que tenemos suficientes grupos para el número de imágenes a ordenar
        if (sortedGroupNames.length < numberOfImagesToOrder) {
            console.error(`Error: Se requieren al menos ${numberOfImagesToOrder} grupos 'sizeN', pero solo se encontraron ${sortedGroupNames.length}.`);
            messageDisplay.textContent = `Error: Se necesitan ${numberOfImagesToOrder} grupos de imágenes (size1, size2, etc.) en item-ordena-imagenes-config.json.`;
            messageDisplay.className = 'incorrect';
            return;
        }

        // Crear una copia mutable de los grupos para evitar modificar el objeto original
        // y para poder remover URLs ya seleccionadas.
        const mutableImageGroups = JSON.parse(JSON.stringify(imageGroups));

        // Seleccionar una imagen de cada grupo 'sizeN' hasta alcanzar numberOfImagesToOrder
        for (let i = 0; i < numberOfImagesToOrder; i++) {
            const groupName = sortedGroupNames[i];
            const groupImages = mutableImageGroups[groupName];

            if (!groupImages || groupImages.length === 0) {
                console.error(`El grupo '${groupName}' está vacío o no existe en item-ordena-imagenes-config.json.`);
                messageDisplay.textContent = `Error: El grupo '${groupName}' no tiene imágenes.`;
                messageDisplay.className = 'incorrect';
                return;
            }

            // Seleccionar una imagen aleatoria del grupo actual
            const randomIndex = Math.floor(Math.random() * groupImages.length);
            const selectedImageUrl = groupImages[randomIndex];
            // Remover la imagen seleccionada de su grupo para evitar duplicados en esta sesión
            groupImages.splice(randomIndex, 1);

            selectedImages.push({
                id: imageIdCounter++, // Asigna IDs secuenciales para el orden
                src: selectedImageUrl // Usa la URL directamente
            });
        }

        // El orden correcto se basa en los IDs que se asignaron secuencialmente
        // Esto significa que 'size1' tendrá id=1, 'size2' id=2, etc., si se seleccionaron en ese orden.
        correctOrder = selectedImages.map(img => img.id).sort((a, b) => a - b);

        // Mezclar las imágenes para mostrarlas desordenadas en la pantalla
        const shuffledImages = shuffleArray([...selectedImages]);

        // Renderizar las imágenes en el contenedor
        imageContainer.innerHTML = ''; // Limpiar el contenedor
        shuffledImages.forEach(imgData => {
            const imgElement = document.createElement('img');
            imgElement.src = imgData.src; // La URL completa
            imgElement.classList.add('draggable');
            imgElement.setAttribute('data-id', imgData.id);
            imgElement.setAttribute('alt', `Imagen ${imgData.id}`);
            imgElement.setAttribute('draggable', true);
            imageContainer.appendChild(imgElement);
        });

        // Re-adjuntar listeners de eventos a las nuevas imágenes
        attachDragListeners();
    }

    // --- Función para adjuntar listeners de arrastre a las imágenes ---
    function attachDragListeners() {
        const currentDraggableImages = document.querySelectorAll('.draggable');
        currentDraggableImages.forEach(image => {
            image.removeEventListener('dragstart', handleDragStart);
            image.removeEventListener('dragend', handleDragEnd);

            image.addEventListener('dragstart', handleDragStart);
            image.addEventListener('dragend', handleDragEnd);
        });
    }

    // --- Handlers de eventos de arrastre ---
    function handleDragStart(e) {
        draggedItem = e.target;
        setTimeout(() => {
            draggedItem.classList.add('dragging');
        }, 0);
        e.dataTransfer.setData('text/plain', '');
    }

    function handleDragEnd() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    }

    // --- Handlers de eventos de soltado para el contenedor ---
    imageContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageContainer.classList.add('drag-over');
    });

    imageContainer.addEventListener('dragleave', () => {
        imageContainer.classList.remove('drag-over');
    });

    imageContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        imageContainer.classList.remove('drag-over');

        if (draggedItem) {
            const dropTarget = e.target.closest('.draggable') || imageContainer;

            if (dropTarget !== imageContainer && dropTarget !== draggedItem) {
                const dropTargetRect = dropTarget.getBoundingClientRect();
                const middleOfDropTarget = dropTargetRect.left + dropTargetRect.width / 2;

                if (e.clientX < middleOfDropTarget) {
                    imageContainer.insertBefore(draggedItem, dropTarget);
                } else {
                    imageContainer.insertBefore(draggedItem, dropTarget.nextElementSibling);
                }
            } else if (dropTarget === imageContainer) {
                imageContainer.appendChild(draggedItem);
            }
        }
    });

    // --- Función para comprobar el orden ---
    checkOrderButton.addEventListener('click', () => {
        const currentOrder = Array.from(imageContainer.children).map(img => parseInt(img.dataset.id));

        const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(correctOrder);

        if (isCorrect) {
            messageDisplay.textContent = '¡Felicidades! El orden es correcto.';
            messageDisplay.className = 'correct';
        } else {
            messageDisplay.textContent = 'El orden es incorrecto. Inténtalo de nuevo.';
            messageDisplay.className = 'incorrect';
        }
    });

    // Iniciar el juego al cargar la página
    initializeGame();
});
