const API_KEY = 'e8f624b3c125ef9a9492e3220d57f324';
const ui = {
  btn: document.getElementById('searchButton'),
  bar: document.getElementById('searchBar'),
  curr: document.getElementById('currentWeatherContainer'),
  fore: document.getElementById('forecastContainer'),
  err: document.getElementById('errorContainer') };
let charts = [];

ui.btn.addEventListener('click', searchWeather);
ui.bar.addEventListener('keypress', (e) => e.key === 'Enter' && searchWeather());

function searchWeather() {
  const city = ui.bar.value.trim();
  if (!city) return ui.err.innerHTML = 'Wpisz nazwę miasta!';

  ui.err.innerHTML = ui.curr.innerHTML = ui.fore.innerHTML = '';
  charts.forEach(c => c.destroy()); charts = [];

  // pogoda bieżąca
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`, true);
  xhr.onload = () => {
    if (xhr.status === 200) {
      const d = JSON.parse(xhr.responseText);
      console.log("Odpowiedź z XMLHttpRequest (Current):", d);
      ui.curr.innerHTML = `<div class="current-weather">
        <h2>Bieżąca pogoda: ${d.name}, ${d.sys.country}</h2>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png" alt="${d.weather[0].description}">
        <div class="current-temp">${Math.round(d.main.temp)}°C</div>
        <p>Odczuwalna: ${Math.round(d.main.feels_like)}°C | ${d.weather[0].description}</p>
        <p>💧 Wilgotność: ${d.main.humidity}% | 💨 Wiatr: ${Math.round(d.wind.speed * 3.6)} km/h</p></div>`;
    } else ui.err.innerHTML = 'Nie znaleziono bieżącej pogody.';
  };
  xhr.send();

  // prognoza na 5 dni i wykresy
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=pl`)
    .then(res => { if (!res.ok) throw new Error('Nie znaleziono prognozy.'); return res.json(); })
    .then(data => {
      console.log("Odpowiedź z Fetch (Forecast):", data);
      // Grupowanie dniami
      const grouped = data.list.reduce((acc, item) => {
        const date = item.dt_txt.split(' ')[0];
        (acc[date] = acc[date] || []).push(item); return acc;
      }, {});

      Object.entries(grouped).forEach(([dateStr, items], idx) => {
        const dateName = new Date(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
        const labels = [], temps = [];

        // Budowanie HTML godzin (kafelki) za pomocą map()
        const hoursHTML = items.map(item => {
          const time = item.dt_txt.split(' ')[1].substring(0, 5);
          const t = Math.round(item.main.temp);
          labels.push(time); temps.push(t); // Zbieranie danych do wykresu

          return `<div class="weather-item"><div class="weather-time">${time}</div>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="weather-icon">
            <span class="temp">${t}°C</span><span class="description">${item.weather[0].description}</span>
            <div class="weather-extra"><span>💧 ${item.main.humidity}%</span><span>💨 ${Math.round(item.wind.speed * 3.6)} km/h</span></div></div>`;
        }).join('');

        // wstawienie jako blok
        const dayDiv = document.createElement('div');
        dayDiv.className = 'forecast-day';
        dayDiv.innerHTML = `<h3>${dateName}</h3><div class="forecast-hours-row">${hoursHTML}</div><div class="chart-container"><canvas id="chart-${idx}"></canvas></div>`;
        ui.fore.appendChild(dayDiv);

        // tworzenie wykresu
        charts.push(new Chart(document.getElementById(`chart-${idx}`).getContext('2d'), {
          type: 'line',
          data: { labels, datasets: [{ label: `Temp (°C) - ${dateName}`, data: temps, borderColor: '#4a90e2', backgroundColor: 'rgba(74, 144, 226, 0.2)', fill: true, tension: 0.3 }] },
          options: { responsive: true, maintainAspectRatio: false }
        }));
      });
    }).catch(err => ui.err.innerHTML = err.message);
}
