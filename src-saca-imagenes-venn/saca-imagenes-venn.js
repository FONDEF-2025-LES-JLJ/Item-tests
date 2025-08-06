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
    const diagramaVenn = document.getElementById('venn-container');
    const botonResponder = document.getElementById('boton-responder');
    const homeButton = document.getElementById('home-button');
    const imagenDirectorio = '../img-saca-imagenes-venn/';

    let config = {};
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
            // Carga el archivo JSON de configuración
            const response = await fetch(configPath);
            config = await response.json();

            // Setea  el título e instrucciones del ítem
            document.getElementById('item-title').textContent = config.titulo;
            document.getElementById('item-instructions').textContent = config.instrucciones;

            // Setea el texto de los botones
            botonResponder.textContent = config.textoBotonResponder;
            homeButton.textContent = config.textoBotonHome;

            // Configura el diagrama de Venn
            document.documentElement.style.setProperty('--venn-width-as-pct', config.tamanoDiagramaVennEnPorciento);
            document.documentElement.style.setProperty('--venn-line-color', config.estiloVenn.colorLinea);
            document.documentElement.style.setProperty('--venn-background-color', config.estiloVenn.colorFondo);

            // Seleccionar un conjunto de imágenes "comunes"
            const conjuntoComun = getRandomItem(config.conjuntosDeImagenes);

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
        diagramaVenn.innerHTML = '';

        // Obtener las dimensiones del contenedor para no desbordar
        const containerRect = diagramaVenn.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const imagenWidthPct = ${config.tamanoImagenElementoEnPorciento}; 
        const imagenWidth = Math.round(containerWidth * imagenWidthPct / 100);
        const imagenHeight = Math.round(containerHeight * imagenWidthPct / 100);
        console.log(`Venn Width: ${containerWidth}px, Venn Height: ${containerHeight}px`);
        console.log(`Imagen Width as pct: ${imagenWidthPct}`);
        console.log(`Imagen Width: ${imagenWidth}px, Imagen Height: ${imagenHeight}px`);

        imagenes.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.src = `${imagenDirectorio}${img}`;
            imgElement.className = 'imagen';
            imgElement.setAttribute('draggable', 'true');
            imgElement.dataset.nombre = img;
        
            // Calcular y asignar posiciones aleatorias
            const randomTop = Math.random() * (containerHeight - imagenHeight);
            const randomLeft = Math.random() * (containerWidth - imagenWidth);
            console.log(`Imagen position: (${imagenWidth}px, ${imagenHeight}px)`);

            imgElement.style.top = `${randomTop}px`;
            imgElement.style.left = `${randomLeft}px`;
        
            diagramaVenn.appendChild(imgElement);
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
        diagramaVenn.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        diagramaVenn.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && !diagramaVenn.contains(draggedElement)) {
                diagramaVenn.appendChild(draggedElement);
            }
        });

        // Eventos fuera del contenedor (para soltar imágenes)
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.body.addEventListener('drop', (e) => {
            if (draggedElement && !document.body.contains(draggedElement)) {
                document.body.appendChild(draggedElement);
            }
        });
    };

    // Función para verificar la respuesta del usuario
    const verificarRespuesta = () => {
        const imagenesEnVenn = Array.from(diagramaVenn.querySelectorAll('.imagen')).map(img => img.dataset.nombre);

        const intrusasIdentificadas = imagenesEnVenn.filter(img => imagenesIntrusas.includes(img));
        
        const intrusasRestantes = imagenesIntrusas.filter(img => imagenesEnVenn.includes(img));
        
        if (intrusasRestantes.length === 0) {
            alert('¡Correcto! Has sacado todas las imágenes intrusas del diagrama.');
        } else {
            alert('Incorrecto. Hay ' + intrusasRestantes.length + ' imágenes intrusas que aún no has sacado.');
        }
    };

    botonResponder.addEventListener('click', verificarRespuesta);

    // Cargar el juego al inicio
    cargarConfiguracion();
});