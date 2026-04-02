// ============================================
// KONFIGURACJA GLOBALNA
// ============================================
const CONFIG = {
    PUZZLE_GRID: 4,
    PUZZLE_CELLS: 16,
    MAP_WIDTH: 800,
    MAP_HEIGHT: 600,
};

const STATE = {
    map: null,
    userMarker: null,
    userCoordinates: null,
    mapCanvas: null,
    puzzlePieces: [],
    placedPieces: new Set(),
    draggedElement: null,
    tileLayer: null,
    isSatellite: false,
};

// ============================================
// INICJALIZACJA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    requestLocationPermission();
    requestNotificationPermission();
    initializeMap();
    setupEventListeners();
});

// ============================================
// PERMISSIONS - Prośby o zgody
// ============================================
function requestLocationPermission() {
    if (!('geolocation' in navigator)) {
        console.warn('Geolokalizacja nie jest dostępna');
        return;
    }

    // Sprawdzanie czy wcześniej daliśmy zgodę
    if (localStorage.getItem('locationGranted') !== 'true') {
        showPermissionRequest(
            '📍 Geolokalizacja',
            'Czy zezwalasz na dostęp do Twojej lokalizacji?',
            () => {
                localStorage.setItem('locationGranted', 'true');
            }
        );
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Powiadomienia nie są dostępne');
        return;
    }

    if (Notification.permission === 'granted') {
        return;
    }

    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                localStorage.setItem('notificationGranted', 'true');
            }
        });
    }
}

function showPermissionRequest(title, message, onAllow) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        max-width: 400px;
    `;

    dialog.innerHTML = `
        <h3 style="margin-bottom: 10px; color: #2d3748;">${title}</h3>
        <p style="margin-bottom: 20px; color: #718096; font-size: 14px;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="btnAllow" style="
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Zezwól</button>
            <button id="btnDeny" style="
                padding: 10px 20px;
                background: #cbd5e0;
                color: #2d3748;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Nie teraz</button>
        </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    document.getElementById('btnAllow').addEventListener('click', () => {
        onAllow();
        dialog.remove();
        backdrop.remove();
    });

    document.getElementById('btnDeny').addEventListener('click', () => {
        dialog.remove();
        backdrop.remove();
    });
}

// ============================================
// MAPA - Inicjalizacja i sterowanie
// ============================================
function initializeMap() {
    const mapElement = document.getElementById('map');

    STATE.map = L.map(mapElement).setView([51.505, -0.09], 13);

    // Domyślnie mapa OSM
    STATE.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(STATE.map);

    // Ikona dla lokalizacji użytkownika
    const userIcon = L.icon({
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="%23667eea" stroke-width="2"/></svg>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

    // Geolokalizacja - automatyczne pobranie
    if ('geolocation' in navigator && localStorage.getItem('locationGranted') === 'true') {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation(latitude, longitude, userIcon);
            },
            (error) => console.warn('Błąd geolokalizacji:', error)
        );
    }
}

function setUserLocation(lat, lng, icon) {
    STATE.userCoordinates = { lat, lng };

    if (STATE.userMarker) {
        STATE.map.removeLayer(STATE.userMarker);
    }

    STATE.userMarker = L.marker([lat, lng], { icon }).addTo(STATE.map);
    STATE.map.setView([lat, lng], 15);
    updateCoordinatesDisplay(lat, lng);
}

function updateCoordinatesDisplay(lat, lng) {
    const coordsElement = document.getElementById('coordinates');
    coordsElement.textContent = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// ============================================
// EVENT LISTENERS - Przyciski
// ============================================
function setupEventListeners() {
    document.getElementById('locationBtn').addEventListener('click', handleLocationClick);
    document.getElementById('downloadBtn').addEventListener('click', handleDownloadClick);
    document.getElementById('toggleSatelliteBtn').addEventListener('click', toggleSatelliteView);
}

function toggleSatelliteView() {
    const btn = document.getElementById('toggleSatelliteBtn');

    if (STATE.isSatellite) {
        // Przełącz na mapę OSM
        STATE.map.removeLayer(STATE.tileLayer);
        STATE.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(STATE.map);
        STATE.isSatellite = false;
        btn.textContent = '🛰️ Satelita';
        btn.classList.remove('active');
    } else {
        // Przełącz na satelitę - Esri
        STATE.map.removeLayer(STATE.tileLayer);
        STATE.tileLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: '© Esri',
                maxZoom: 18,
            }
        ).addTo(STATE.map);
        STATE.isSatellite = true;
        btn.textContent = 'Przełącz widok';
        btn.classList.add('active');
    }
}

function handleLocationClick() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userIcon = L.icon({
                    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="%23667eea" stroke-width="2"/></svg>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });
                setUserLocation(latitude, longitude, userIcon);
                showNotification('Lokalizacja', `Znajdujesz się na: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            },
            (error) => {
                console.error('Błąd:', error);
                alert('Nie można pobrać lokalizacji. Sprawdź ustawienia.');
            }
        );
    }
}

function handleDownloadClick() {
    // Bezpośrednio rysujemy mapę z tile'ów
    createPuzzleFromMapCanvas();
}

function createPuzzleFromMapCanvas() {
    // Alternatywna metoda - rysujemy mapę na canvas
    const mapElement = document.querySelector('.leaflet-container');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');

    // Pobieramy tile'e z mapy i rysujemy
    try {
        const mapBounds = STATE.map.getBounds();
        const zoomLevel = STATE.map.getZoom();

        // Rysujemy tło
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pobieramy wszystkie tile obrazy z mapy
        const tiles = document.querySelectorAll('.leaflet-tile');
        let loadedTiles = 0;

        tiles.forEach(tile => {
            if (tile.tagName === 'IMG' && tile.src) {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const rect = tile.getBoundingClientRect();
                    const mapRect = mapElement.getBoundingClientRect();
                    const x = rect.left - mapRect.left;
                    const y = rect.top - mapRect.top;
                    ctx.drawImage(img, x, y, 256, 256);
                    loadedTiles++;

                    if (loadedTiles === tiles.length) {
                        STATE.mapCanvas = canvas;
                        createPuzzleFromMap(canvas);
                        showNotification('Mapa pobrana', 'Mapa została podzielona na puzzle!');
                    }
                };
                img.onerror = () => {
                    loadedTiles++;
                    if (loadedTiles === tiles.length) {
                        STATE.mapCanvas = canvas;
                        createPuzzleFromMap(canvas);
                        showNotification('Mapa pobrana', 'Mapa została podzielona na puzzle!');
                    }
                };
                img.src = tile.src;
            }
        });

        // Jeśli nie ma tiles, idź na fallback
        if (tiles.length === 0) {
            createPuzzleFromMapFallback();
        }
    } catch (err) {
        console.error('Błąd rysowania mapy:', err);
        createPuzzleFromMapFallback();
    }
}

// ============================================
// PUZZLE - Tworzenie z mapy
// ============================================
function createPuzzleFromMap(canvas) {
    const board = document.getElementById('puzzleBoard');
    board.innerHTML = '';
    STATE.puzzlePieces = [];
    STATE.placedPieces.clear();

    const pieceWidth = canvas.width / CONFIG.PUZZLE_GRID;
    const pieceHeight = canvas.height / CONFIG.PUZZLE_GRID;

    const pieces = [];

    // Tworzymy 16 części puzzle
    for (let row = 0; row < CONFIG.PUZZLE_GRID; row++) {
        for (let col = 0; col < CONFIG.PUZZLE_GRID; col++) {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;

            const ctx = pieceCanvas.getContext('2d');
            ctx.drawImage(
                canvas,
                col * pieceWidth,
                row * pieceHeight,
                pieceWidth,
                pieceHeight,
                0,
                0,
                pieceWidth,
                pieceHeight
            );

            pieces.push({
                canvas: pieceCanvas,
                correctRow: row,
                correctCol: col,
                currentRow: row,
                currentCol: col,
            });
        }
    }

    // Mieszamy kolejność
    pieces.sort(() => Math.random() - 0.5);

    // Tworzymy placeholder elementy w planszy
    for (let i = 0; i < CONFIG.PUZZLE_CELLS; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot placeholder';
        slot.dataset.row = Math.floor(i / CONFIG.PUZZLE_GRID);
        slot.dataset.col = i % CONFIG.PUZZLE_GRID;
        slot.dataset.index = i;
        board.appendChild(slot);
    }

    // Dodajemy części do UI (w oddzielnej puli)
    const pool = document.getElementById('puzzlePool');
    pool.innerHTML = '';

    pieces.forEach((piece, index) => {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = index;
        slot.dataset.correctRow = piece.correctRow;
        slot.dataset.correctCol = piece.correctCol;
        slot.draggable = true;

        const img = document.createElement('img');
        img.src = piece.canvas.toDataURL();
        img.alt = `Puzzle ${index}`;
        slot.appendChild(img);

        pool.appendChild(slot);
        STATE.puzzlePieces.push({
            element: slot,
            correctRow: piece.correctRow,
            correctCol: piece.correctCol,
        });

        setupDragHandlers(slot);
    });

    setupDropZones();
}

function createPuzzleFromMapFallback() {
    // Fallback - tworzymy próbne puzzle z kolorami
    const board = document.getElementById('puzzleBoard');
    board.innerHTML = '';
    STATE.puzzlePieces = [];
    STATE.placedPieces.clear();

    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B88B', '#ABEBC6', '#F1948A', '#AED6F1',
        '#D7BDE2', '#FAD7A0', '#A3E4D7', '#F5B7B1',
    ];

    console.log('Uruchamianie fallback puzzle z kolorami');

    // Placeholders w siatce
    for (let i = 0; i < CONFIG.PUZZLE_CELLS; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot placeholder';
        slot.dataset.row = Math.floor(i / CONFIG.PUZZLE_GRID);
        slot.dataset.col = i % CONFIG.PUZZLE_GRID;
        slot.dataset.index = i;
        slot.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e6eeff 100%)';
        slot.style.borderStyle = 'dashed';
        slot.style.color = '#cbd5e0';
        slot.textContent = `${Math.floor(i / CONFIG.PUZZLE_GRID) + 1}-${(i % CONFIG.PUZZLE_GRID) + 1}`;
        slot.style.fontSize = '12px';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        board.appendChild(slot);
    }

    // Rozrzucone puzzle - w oddzielnej puli
    const pool = document.getElementById('puzzlePool');
    pool.innerHTML = '';

    colors.forEach((color, index) => {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = index;
        slot.dataset.correctRow = Math.floor(index / CONFIG.PUZZLE_GRID);
        slot.dataset.correctCol = index % CONFIG.PUZZLE_GRID;
        slot.style.background = color;
        slot.draggable = true;
        slot.textContent = index + 1;
        slot.style.fontSize = '32px';
        slot.style.fontWeight = 'bold';
        slot.style.color = 'rgba(255,255,255,0.8)';
        slot.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';

        pool.appendChild(slot);
        STATE.puzzlePieces.push({
            element: slot,
            correctRow: Math.floor(index / CONFIG.PUZZLE_GRID),
            correctCol: index % CONFIG.PUZZLE_GRID,
        });

        setupDragHandlers(slot);
    });

    setupDropZones();
}

// ============================================
// DRAG & DROP
// ============================================
function setupDragHandlers(element) {
    element.addEventListener('dragstart', (e) => {
        // Jeśli to element z puli, mogę go przeciągnąć
        // Jeśli to element na planszy (ma row/col), mogę go przeciągnąć
        STATE.draggedElement = element;
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.innerHTML);
    });

    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        STATE.draggedElement = null;
    });
}

function setupDropZones() {
    updateBoardDragHandlers();

    const board = document.getElementById('puzzleBoard');
    const pool = document.getElementById('puzzlePool');

    // Ustaw drop zones na wszystkie sloty na planszy (mają row/col)
    const boardSlots = board.querySelectorAll('[data-row][data-col]');

    boardSlots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            slot.classList.add('drag-over');
        });

        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');

            if (!STATE.draggedElement) return;
            if (slot === STATE.draggedElement) return;

            const draggedIndex = parseInt(STATE.draggedElement.dataset.index);
            const correctRow = parseInt(STATE.draggedElement.dataset.correctRow);
            const correctCol = parseInt(STATE.draggedElement.dataset.correctCol);
            const targetRow = parseInt(slot.dataset.row);
            const targetCol = parseInt(slot.dataset.col);

            // Zapamiętaj zawartość slotu docelowego (PRZED zmianą)
            const targetWasPlaced = slot.classList.contains('placed');
            const targetContent = {
                html: slot.innerHTML,
                classList: Array.from(slot.classList),
                background: slot.style.background,
                fontSize: slot.style.fontSize,
                fontWeight: slot.style.fontWeight,
                color: slot.style.color,
                textShadow: slot.style.textShadow,
            };

            // Wyczyść slot docelowy
            slot.innerHTML = '';

            // Przenieś zawartość dragowanego do slotu - kopiuj prawidłowo IMG
            const draggedImg = STATE.draggedElement.querySelector('img');
            if (draggedImg) {
                const newImg = draggedImg.cloneNode(true);
                slot.appendChild(newImg);
            } else {
                // Jeśli to puzzle testowe (kolorowe)
                slot.textContent = STATE.draggedElement.textContent;
                slot.style.background = STATE.draggedElement.style.background;
                slot.style.fontSize = STATE.draggedElement.style.fontSize;
                slot.style.fontWeight = STATE.draggedElement.style.fontWeight;
                slot.style.color = STATE.draggedElement.style.color;
                slot.style.textShadow = STATE.draggedElement.style.textShadow;
            }

            slot.classList.remove('placeholder', 'drag-over');
            slot.classList.add('placed');
            slot.classList.remove('correct-position');

            // Sprawdzenie czy element jest na swoim miejscu
            if (correctRow === targetRow && correctCol === targetCol) {
                slot.classList.add('correct-position');
            }

            // Teraz obsług zawartość która była na slocie - przenies do dragowanego elementu (z powrotem do puli)
            if (targetContent.html) {
                STATE.draggedElement.innerHTML = '';

                // Jeśli slot miał IMG
                if (targetContent.html.includes('<img')) {
                    STATE.draggedElement.innerHTML = targetContent.html;
                } else {
                    // Jeśli miał tekst/tło
                    STATE.draggedElement.textContent = targetContent.html;
                    STATE.draggedElement.style.background = targetContent.background;
                    STATE.draggedElement.style.fontSize = targetContent.fontSize;
                    STATE.draggedElement.style.fontWeight = targetContent.fontWeight;
                    STATE.draggedElement.style.color = targetContent.color;
                    STATE.draggedElement.style.textShadow = targetContent.textShadow;
                }
            } else {
                // Slot był pusty (placeholder)
                STATE.draggedElement.innerHTML = '';
                STATE.draggedElement.style.background = '';
                STATE.draggedElement.style.fontSize = '';
                STATE.draggedElement.style.fontWeight = '';
                STATE.draggedElement.style.color = '';
                STATE.draggedElement.style.textShadow = '';
            }

            // Update drag handlers na planszy
            updateBoardDragHandlers();

            // Sprawdzenie czy wszystkie puzzle na miejscu
            setTimeout(() => {
                checkPuzzleComplete();
            }, 100);
        });
    });

    // Dodaj drag handlers do puzzle z puli
    const poolSlots = pool.querySelectorAll('.puzzle-slot');
    poolSlots.forEach(slot => {
        setupDragHandlers(slot);

        // Drop zones dla puzzle w puli (aby się mogły zamieniać)
        slot.addEventListener('dragover', (e) => {
            if (STATE.draggedElement && STATE.draggedElement !== slot &&
                STATE.draggedElement.parentElement === pool) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.classList.add('drag-over');
            }
        });

        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', (e) => {
            if (STATE.draggedElement.parentElement !== pool) return; // Tylko jeśli z puli

            e.preventDefault();
            slot.classList.remove('drag-over');

            if (!STATE.draggedElement || slot === STATE.draggedElement) return;

            // Swap - zamień miejscami dwa puzzle w puli
            const draggedContent = STATE.draggedElement.innerHTML;
            const draggedCorrectRow = STATE.draggedElement.dataset.correctRow;
            const draggedCorrectCol = STATE.draggedElement.dataset.correctCol;
            const draggedDataIndex = STATE.draggedElement.dataset.index;

            const slotContent = slot.innerHTML;
            const slotCorrectRow = slot.dataset.correctRow;
            const slotCorrectCol = slot.dataset.correctCol;
            const slotDataIndex = slot.dataset.index;

            // Zamieniaj zawartość
            slot.innerHTML = draggedContent;
            slot.dataset.correctRow = draggedCorrectRow;
            slot.dataset.correctCol = draggedCorrectCol;
            slot.dataset.index = draggedDataIndex;

            STATE.draggedElement.innerHTML = slotContent;
            STATE.draggedElement.dataset.correctRow = slotCorrectRow;
            STATE.draggedElement.dataset.correctCol = slotCorrectCol;
            STATE.draggedElement.dataset.index = slotDataIndex;
        });
    });
}

function updateBoardDragHandlers() {
    const board = document.getElementById('puzzleBoard');
    const boardSlots = board.querySelectorAll('.puzzle-slot.placed');

    boardSlots.forEach(slot => {
        // Klonuj element aby reset-ować event listeners
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);

        setupDragHandlers(newSlot);

        // Dodaj drop zone dla puzzli które są już na planszy
        newSlot.addEventListener('dragover', (e) => {
            if (STATE.draggedElement && STATE.draggedElement !== newSlot) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                newSlot.classList.add('drag-over');
            }
        });

        newSlot.addEventListener('dragleave', () => {
            newSlot.classList.remove('drag-over');
        });

        newSlot.addEventListener('drop', (e) => {
            e.preventDefault();
            newSlot.classList.remove('drag-over');

            if (!STATE.draggedElement) return;
            if (newSlot === STATE.draggedElement) return;

            const draggedIndex = parseInt(STATE.draggedElement.dataset.index);
            const correctRow = parseInt(STATE.draggedElement.dataset.correctRow);
            const correctCol = parseInt(STATE.draggedElement.dataset.correctCol);

            // Jeśli dragging jest z puli lub z innego slotu na planszy
            const targetRow = parseInt(newSlot.dataset.row);
            const targetCol = parseInt(newSlot.dataset.col);

            // Zapamiętaj zawartość slotu docelowego
            const targetContent = {
                html: newSlot.innerHTML,
                background: newSlot.style.background,
                fontSize: newSlot.style.fontSize,
                fontWeight: newSlot.style.fontWeight,
                color: newSlot.style.color,
                textShadow: newSlot.style.textShadow,
            };

            // Wyczyść slot docelowy
            newSlot.innerHTML = '';

            // Przenieś zawartość dragowanego do slotu
            const draggedImg = STATE.draggedElement.querySelector('img');
            if (draggedImg) {
                const newImg = draggedImg.cloneNode(true);
                newSlot.appendChild(newImg);
            } else {
                // Kolorowe puzzle
                newSlot.textContent = STATE.draggedElement.textContent;
                newSlot.style.background = STATE.draggedElement.style.background;
                newSlot.style.fontSize = STATE.draggedElement.style.fontSize;
                newSlot.style.fontWeight = STATE.draggedElement.style.fontWeight;
                newSlot.style.color = STATE.draggedElement.style.color;
                newSlot.style.textShadow = STATE.draggedElement.style.textShadow;
            }

            newSlot.classList.remove('placeholder', 'drag-over', 'correct-position');
            newSlot.classList.add('placed');

            // Sprawdzenie czy element jest na swoim miejscu
            if (correctRow === targetRow && correctCol === targetCol) {
                newSlot.classList.add('correct-position');
            }

            // Przenieś zawartość z powrotem do dragowanego elementu
            if (targetContent.html) {
                STATE.draggedElement.innerHTML = '';
                if (targetContent.html.includes('<img')) {
                    STATE.draggedElement.innerHTML = targetContent.html;
                } else {
                    STATE.draggedElement.textContent = targetContent.html;
                    STATE.draggedElement.style.background = targetContent.background;
                    STATE.draggedElement.style.fontSize = targetContent.fontSize;
                    STATE.draggedElement.style.fontWeight = targetContent.fontWeight;
                    STATE.draggedElement.style.color = targetContent.color;
                    STATE.draggedElement.style.textShadow = targetContent.textShadow;
                }
            } else {
                STATE.draggedElement.innerHTML = '';
                STATE.draggedElement.style.background = '';
                STATE.draggedElement.style.fontSize = '';
                STATE.draggedElement.style.fontWeight = '';
                STATE.draggedElement.style.color = '';
                STATE.draggedElement.style.textShadow = '';
            }

            // Update drag handlers ponownie
            updateBoardDragHandlers();

            // Sprawdzenie czy wszystkie puzzle na miejscu
            setTimeout(() => {
                checkPuzzleComplete();
            }, 100);
        });
    });
}


// ============================================
// WERYFIKACJA PUZZLE
// ============================================
function checkPuzzleComplete() {
    const board = document.getElementById('puzzleBoard');
    const correctPieces = board.querySelectorAll('.puzzle-slot.correct-position');
    const progress = correctPieces.length;

    document.getElementById('puzzleProgress').textContent = `Postęp: ${progress}/16`;

    if (progress === CONFIG.PUZZLE_CELLS) {
        onPuzzleComplete();
    }
}

function onPuzzleComplete() {
    const board = document.getElementById('puzzleBoard');
    const slots = board.querySelectorAll('.puzzle-slot');

    slots.forEach(slot => {
        slot.style.animation = 'correctPlacement 0.6s ease';
    });

    setTimeout(() => {
        showNotification(
            '🎉 Gratulacje!',
            'Ukończyłeś puzzle! Wszystkie elementy są na swoim miejscu!'
        );
    }, 300);
}

// ============================================
// POWIADOMIENIA
// ============================================
function showNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
        });
    }
}

// ============================================
// KONIEC SKRYPTU
// ============================================

