document.addEventListener('DOMContentLoaded', function() {
  var homeButton = document.getElementById('home-button');
  if (homeButton) {
    homeButton.onclick = function() {
      window.location.href = '../index.html';
    };
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const configPath = './saca-imagenes-venn-config.json';
    const imagenesContainer = document.getElementById('imagenes-container');
    const diagramaVenn = document.getElementById('diagrama-venn');
    const botonPrincipal = document.getElementById('boton-principal');
    const homeButton = document.getElementById('home-button');
    const imagenDirectorio = '../img-saca-imagenes-venn/';

    let imagenesCorrectas = [];
    let imagenesIntrusas = [];

    // Función para obtener una imagen aleatoria de un array
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Función para obtener N items aleatorios de un array sin repetirlos
    const getRandomItems = (arr, n) => {
        const result = new Set();
        while (result.size < n) {
            result.add(getRandomItem(arr));
        }
        return Array.from(result);
    };

    // Función para cargar la configuración del juego
    const cargarConfiguracion = async () => {
        try {
            const response = await fetch(configPath);
            const config = await response.json();

            document.getElementById('game-title').textContent = config.titulo;
            document.getElementById('game-instructions').textContent = config.instrucciones;
            botonPrincipal.textContent = config.textoBotonPrincipal;
            homeButton.textContent = config.textoBotonHome;

            // Configurar los colores del diagrama de Venn
            document.documentElement.style.setProperty('--venn-line-color', config.estiloVenn.colorLinea);
            document.documentElement.style.setProperty('--venn-background-color', config.estiloVenn.colorFondo);

            // Seleccionar un conjunto de imágenes "comunes"
            const conjuntoComun = getRandomItem(config.conjuntosDeImagenes);
            console.log('Conjunto escogido:', conjuntoComun);

            // Seleccionar las imágenes "correctas" (n)
            imagenesCorrectas = getRandomItems(conjuntoComun.imagenes, config.numeroImagenesComunes);
            
            // Seleccionar los conjuntos "intrusos"
            const otrosConjuntos = config.conjuntosDeImagenes.filter(c => c.nombre !== conjuntoComun.nombre);
            
            // Seleccionar las imágenes "intrusas" (m) de los otros conjuntos
            imagenesIntrusas = getRandomItems(otrosConjuntos.flatMap(c => c.imagenes), config.numeroImagenesIntrusas);

            // Mezclar todas las imágenes para renderizarlas
            const todasLasImagenes = [...imagenesCorrectas, ...imagenesIntrusas];
            const imagenesMezcladas = todasLasImagenes.sort(() => Math.random() - 0.5);

            renderizarImagenes(imagenesMezcladas);
            adjuntarEventosArrastre();

        } catch (error) {
            console.error('Error al cargar la configuración:', error);
        }
    };

    // Función para renderizar las imágenes
    const renderizarImagenes = (imagenes) => {
        imagenesContainer.innerHTML = '';
        imagenes.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.src = `${imagenDirectorio}${img}`;
            imgElement.className = 'imagen';
            imgElement.setAttribute('draggable', 'true');
            imgElement.dataset.nombre = img;
            imagenesContainer.appendChild(imgElement);
        });
    };

    // Función para adjuntar eventos de arrastre
    const adjuntarEventosArrastre = () => {
        let draggedElement = null;

        document.querySelectorAll('.imagen').forEach(imagen => {
            imagen.addEventListener('dragstart', (e) => {
                draggedElement = e.target;
                e.target.classList.add('arrastrando');
            });

            imagen.addEventListener('dragend', (e) => {
                e.target.classList.remove('arrastrando');
            });
        });

        // Eventos en el contenedor de imágenes (diagrama de Venn)
        imagenesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        imagenesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && !imagenesContainer.contains(draggedElement)) {
                imagenesContainer.appendChild(draggedElement);
            }
        });

        // Eventos fuera del contenedor (para soltar imágenes)
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.body.addEventListener('drop', (e) => {
            if (e.target.id !== 'imagenes-container' && draggedElement) {
            /* if (draggedElement && e.target !== imagenesContainer && !imagenesContainer.contains(e.target))*/
                // La imagen se soltó fuera del diagrama de Venn
                document.body.appendChild(draggedElement);
            }
        });
    };

    // Función para verificar la respuesta del usuario
    const verificarRespuesta = () => {
        const imagenesEnVenn = Array.from(imagenesContainer.querySelectorAll('.imagen')).map(img => img.dataset.nombre);

        const intrusasIdentificadas = imagenesEnVenn.filter(img => imagenesIntrusas.includes(img));
        
        const intrusasRestantes = imagenesIntrusas.filter(img => imagenesEnVenn.includes(img));
        
        if (intrusasRestantes.length === 0) {
            alert('¡Correcto! Has sacado todas las imágenes intrusas del diagrama.');
        } else {
            alert('Incorrecto. Hay ' + intrusasRestantes.length + ' imágenes intrusas que aún no has sacado.');
        }
    };

    botonPrincipal.addEventListener('click', verificarRespuesta);

    // Cargar el juego al inicio
    cargarConfiguracion();
});