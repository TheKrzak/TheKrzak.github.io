// inicjalizacja mapy
const map = L.map('map').setView([53.433, 14.5498], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  crossOrigin: true
}).addTo(map);

let userMarker = null;

document.addEventListener('DOMContentLoaded', () => {
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
});

// generowanie tablicy na puzle
const puzzleBoard = document.getElementById("puzzleBoard");
const puzzlePool = document.getElementById("puzzlePool");
const progressDisplay = document.getElementById("puzzleProgress");
const puzzleFields = [];

// siatka
for (let i = 1; i <= 16; i++) {
  let field = document.createElement("div");
  field.classList.add("puzzleField");
  field.dataset.targetId = i;
  puzzleBoard.appendChild(field);
  puzzleFields.push(field);

  // drop
  field.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  field.addEventListener("dragenter", () => field.classList.add("drag-over"));
  field.addEventListener("dragleave", () => field.classList.remove("drag-over"));

  field.addEventListener("drop", (e) => {
    e.preventDefault();
    field.classList.remove("drag-over");

    const puzzleId = e.dataTransfer.getData("text/plain");
    const puzzleElement = document.querySelector(`.puzzle[data-id="${puzzleId}"]`);

    // sprawdzenie czy jest puste pole
    if (puzzleElement && field.children.length === 0) {
      field.appendChild(puzzleElement);
      checkPuzzleState(); // weryfikacja po każdym ruchu
    }
  });
}

puzzlePool.addEventListener("dragover", (e) => e.preventDefault());
puzzlePool.addEventListener("drop", (e) => {
  e.preventDefault();
  const puzzleId = e.dataTransfer.getData("text/plain");
  const puzzleElement = document.querySelector(`.puzzle[data-id="${puzzleId}"]`);

  if (puzzleElement) {
    puzzlePool.appendChild(puzzleElement);
    checkPuzzleState(); // weryfikacja po każdym ruchu
  }
});

// lokalizacja
document.getElementById("locationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolokalizacja nie jest wspierana w tej przeglądarce.");
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    map.setView([lat, lng], 16);

    if (userMarker) {
      map.removeLayer(userMarker);
    }
    userMarker = L.marker([lat, lng]).addTo(map);
    document.getElementById("coordinates").textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, (err) => console.warn(err), { enableHighAccuracy: true });
});

// pobieranie mapy i generowanie puzzli
document.getElementById("downloadBtn").addEventListener("click", () => {
  leafletImage(map, function(err, canvas) {
    if (err) return console.error("Błąd generowania obrazu", err);

    // czyszczenie tablicy
    puzzlePool.innerHTML = "";
    puzzleFields.forEach(f => f.innerHTML = "");
    checkPuzzleState();

    const pieceWidth = Math.floor(canvas.width / 4);
    const pieceHeight = Math.floor(canvas.height / 4);
    let pieces = [];
    let pieceId = 1;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let pieceCanvas = document.createElement("canvas");
        pieceCanvas.classList.add("puzzle");
        pieceCanvas.width = pieceWidth;
        pieceCanvas.height = pieceHeight;
        pieceCanvas.dataset.id = pieceId++;
        pieceCanvas.draggable = true;

        // ucinanie puzli
        let ctx = pieceCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight,
          0, 0, pieceWidth, pieceHeight
        );

        // drag
        pieceCanvas.addEventListener("dragstart", (e) => {
          pieceCanvas.classList.add("dragging");
          e.dataTransfer.setData("text/plain", pieceCanvas.dataset.id);
        });

        pieceCanvas.addEventListener("dragend", () => {
          pieceCanvas.classList.remove("dragging");
        });

        pieces.push(pieceCanvas);
      }
    }

    // mieszanie puzli
    pieces.sort(() => Math.random() - 0.5);
    pieces.forEach(p => puzzlePool.appendChild(p));
  });
});

// weryfikacja stanu gry
function checkPuzzleState() {
  let correct = 0;
  puzzleFields.forEach(field => {
    if (field.children.length > 0) {
      if (field.children[0].dataset.id === field.dataset.targetId) {
        correct++;
      }
    }
  });

  document.getElementById("puzzleProgress").textContent = `Ułożone: ${correct}/16`;

  if (correct === 16) {
    if (Notification.permission === "granted") {
      new Notification("Koniec gry!", {
        body: "Mapa została ułożona poprawnie."
      });
    } else {
      alert("Ułożyłeś mapę!");
    }
  }
}
