// ============================================
// WEATHER PAGE JAVASCRIPT
// ============================================

// Coordonnées du terrain. La météo passe par la fonction serveur
// /api/weather, qui détient la clé OpenWeatherMap côté serveur : la clé
// n'est donc jamais exposée au navigateur. En mode démo / hors serveur,
// l'appel échoue proprement et des données d'exemple sont affichées.
const WEATHER_CONFIG = {
    lat: (window.APP_CONFIG && window.APP_CONFIG.LATITUDE) || 43.8678,
    lon: (window.APP_CONFIG && window.APP_CONFIG.LONGITUDE) || 1.4167
};

// Mock Weather Data
const mockWeatherData = {
    current: {
        temp: 22,
        feelsLike: 20,
        condition: 'Ciel dégagé',
        icon: 'fa-sun',
        wind: {
            speed: 12,
            direction: 45, // degrees
            directionName: 'NE',
            gusts: 18
        },
        humidity: 65,
        pressure: 1013,
        visibility: 10,
        clouds: 15,
        uv: 8,
        sunrise: '07:24',
        sunset: '17:42',
        dewPoint: 15
    },
    forecast: [
        { day: "Aujourd'hui", icon: 'fa-sun', tempMax: 22, tempMin: 15, wind: 12 },
        { day: 'Dimanche', icon: 'fa-cloud-sun', tempMax: 20, tempMin: 14, wind: 15 },
        { day: 'Lundi', icon: 'fa-cloud', tempMax: 18, tempMin: 12, wind: 20 },
        { day: 'Mardi', icon: 'fa-cloud-rain', tempMax: 16, tempMin: 11, wind: 25 },
        { day: 'Mercredi', icon: 'fa-cloud-sun', tempMax: 19, tempMin: 13, wind: 18 },
        { day: 'Jeudi', icon: 'fa-sun', tempMax: 21, tempMin: 14, wind: 10 },
        { day: 'Vendredi', icon: 'fa-sun', tempMax: 23, tempMin: 16, wind: 8 }
    ],
    metar: {
        raw: 'LFML 161430Z 04012KT 9999 FEW025 22/15 Q1013 NOSIG',
        decoded: {
            station: 'LFML (Marseille)',
            time: '16 Nov, 14:30 UTC',
            wind: '040° à 12 kt',
            visibility: '>10 km',
            clouds: 'Peu de nuages à 2500 ft',
            temp: '22°C',
            dewpoint: '15°C',
            qnh: '1013 hPa'
        }
    },
    taf: {
        raw: 'TAF LFML 161100Z 1612/1718 05015KT 9999 FEW030 SCT080\nTEMPO 1615/1620 4000 SHRA BKN020CB',
        decoded: {
            period: '16/12Z à 17/18Z',
            mainWind: '050° à 15 kt',
            visibility: '>10 km',
            tempo: 'Temporairement 15h-20h: averses possibles, visibilité 4 km'
        }
    }
};

// Récupère la météo réelle via la fonction serveur /api/weather (qui
// détient la clé) et la convertit au format interne.
async function fetchRealWeather() {
    const resp = await fetch(`/api/weather?lat=${WEATHER_CONFIG.lat}&lon=${WEATHER_CONFIG.lon}`);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || 'Erreur API météo');
    if (!data.current) throw new Error('Réponse météo vide');
    return { current: convertCurrent(data.current), forecast: convertForecast(data.forecast) };
}

function owmIcon(code) {
    // Codes conditions OpenWeatherMap -> icônes Font Awesome
    if (code >= 200 && code < 300) return 'fa-bolt';
    if (code >= 300 && code < 600) return 'fa-cloud-rain';
    if (code >= 600 && code < 700) return 'fa-snowflake';
    if (code >= 700 && code < 800) return 'fa-smog';
    if (code === 800) return 'fa-sun';
    if (code === 801 || code === 802) return 'fa-cloud-sun';
    return 'fa-cloud';
}

function windDirectionName(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(deg / 45) % 8];
}

function convertCurrent(w) {
    const toTime = ts => {
        const d = new Date(ts * 1000);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    return {
        temp: Math.round(w.main.temp),
        feelsLike: Math.round(w.main.feels_like),
        condition: w.weather[0] ? w.weather[0].description : '',
        icon: owmIcon(w.weather[0] ? w.weather[0].id : 800),
        wind: {
            speed: Math.round(w.wind.speed * 3.6),
            direction: w.wind.deg || 0,
            directionName: windDirectionName(w.wind.deg || 0),
            gusts: w.wind.gust ? Math.round(w.wind.gust * 3.6) : null
        },
        humidity: w.main.humidity,
        pressure: w.main.pressure,
        visibility: w.visibility != null ? Math.round(w.visibility / 1000) : 10,
        clouds: w.clouds ? w.clouds.all : 0,
        sunrise: w.sys ? toTime(w.sys.sunrise) : '',
        sunset: w.sys ? toTime(w.sys.sunset) : '',
        dewPoint: null
    };
}

// L'API /forecast donne des pas de 3 h sur 5 jours : on agrège par jour
function convertForecast(f) {
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const byDay = {};
    (f.list || []).forEach(item => {
        const d = new Date(item.dt * 1000);
        const key = d.toISOString().split('T')[0];
        if (!byDay[key]) byDay[key] = { temps: [], winds: [], codes: [], date: d };
        byDay[key].temps.push(item.main.temp);
        byDay[key].winds.push(item.wind.speed * 3.6);
        if (item.weather[0]) byDay[key].codes.push(item.weather[0].id);
    });
    const todayKey = new Date().toISOString().split('T')[0];
    return Object.entries(byDay).slice(0, 7).map(([key, v]) => ({
        day: key === todayKey ? "Aujourd'hui" : dayNames[v.date.getDay()],
        icon: owmIcon(v.codes[Math.floor(v.codes.length / 2)] || 800),
        tempMax: Math.round(Math.max(...v.temps)),
        tempMin: Math.round(Math.min(...v.temps)),
        wind: Math.round(Math.max(...v.winds))
    }));
}

// Update Weather Display
function updateWeatherDisplay(data = mockWeatherData) {
    updateCurrentWeather(data.current);
    updateForecast(data.forecast);
    updateFlightConditions(data.current);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Update Current Weather
function updateCurrentWeather(current) {
    setText('updateTime', formatDateTime(new Date()));
    setText('weatherTemp', current.temp + '°C');
    setText('weatherCondition', current.condition);
    setText('weatherFeelsLike', 'Ressenti: ' + current.feelsLike + '°C');
    setText('windSpeed', current.wind.speed + ' km/h');
    setText('windDirText', `${current.wind.directionName} (${current.wind.direction}°)`);
    setText('windGusts', current.wind.gusts ? 'Rafales: ' + current.wind.gusts + ' km/h' : '');
    setText('humidityVal', current.humidity + '%');
    setText('dewPointVal', current.dewPoint != null ? 'Point de rosée: ' + current.dewPoint + '°C' : '');
    setText('pressureVal', current.pressure + ' hPa');
    setText('visibilityVal', current.visibility + ' km');
    setText('cloudsVal', current.clouds + '%');
    if (current.sunrise) setText('sunriseVal', current.sunrise);
    if (current.sunset) setText('sunsetVal', current.sunset);

    const iconEl = document.getElementById('weatherIconLarge');
    if (iconEl) iconEl.className = 'fas ' + current.icon;

    const windDirectionEl = document.getElementById('windDirection');
    if (windDirectionEl) {
        windDirectionEl.textContent = current.wind.directionName;
    }
    updateWindArrow(current.wind.direction);
}

// Update Forecast
function updateForecast(forecast) {
    const grid = document.getElementById('forecastGrid');
    if (!grid || !forecast || !forecast.length) return;
    grid.innerHTML = forecast.map(day => `
        <div class="forecast-day">
            <div class="day-name">${day.day}</div>
            <i class="fas ${day.icon} forecast-icon"></i>
            <div class="temps">${day.tempMax}° / ${day.tempMin}°</div>
            <div class="wind-info"><i class="fas fa-wind"></i> ${day.wind} km/h</div>
        </div>
    `).join('');
}

// Update Flight Conditions
function updateFlightConditions(current) {
    // Determine flight conditions based on weather data
    const conditions = evaluateFlightConditions(current);

    const statusElement = document.querySelector('.flight-status');
    if (statusElement) {
        // Remove existing classes
        statusElement.classList.remove('excellent', 'good', 'marginal', 'poor');

        // Add new class and update content
        statusElement.classList.add(conditions.class);

        const icon = statusElement.querySelector('i');
        const title = statusElement.querySelector('h4');
        const description = statusElement.querySelector('p');

        if (icon) icon.className = conditions.icon;
        if (title) title.textContent = conditions.title;
        if (description) description.textContent = conditions.description;
    }

    // Update indicators
    updateConditionIndicators(conditions);
}

// Evaluate Flight Conditions
function evaluateFlightConditions(current) {
    let score = 100;
    let issues = [];

    // Wind check
    if (current.wind.speed > 25) {
        score -= 40;
        issues.push('wind');
    } else if (current.wind.speed > 20) {
        score -= 20;
        issues.push('wind');
    }

    // Visibility check
    if (current.visibility < 5) {
        score -= 30;
        issues.push('visibility');
    } else if (current.visibility < 8) {
        score -= 15;
        issues.push('visibility');
    }

    // Cloud ceiling check
    if (current.clouds > 80) {
        score -= 20;
        issues.push('clouds');
    }

    // Determine overall condition
    if (score >= 80) {
        return {
            class: 'excellent',
            icon: 'fas fa-check-circle',
            title: 'Conditions Excellentes',
            description: 'Parfait pour le vol ULM',
            issues: []
        };
    } else if (score >= 60) {
        return {
            class: 'good',
            icon: 'fas fa-thumbs-up',
            title: 'Bonnes Conditions',
            description: 'Vol possible avec prudence',
            issues: issues
        };
    } else if (score >= 40) {
        return {
            class: 'marginal',
            icon: 'fas fa-exclamation-triangle',
            title: 'Conditions Marginales',
            description: 'Vol déconseillé pour débutants',
            issues: issues
        };
    } else {
        return {
            class: 'poor',
            icon: 'fas fa-times-circle',
            title: 'Mauvaises Conditions',
            description: 'Vol fortement déconseillé',
            issues: issues
        };
    }
}

// Update Condition Indicators
function updateConditionIndicators(conditions) {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach(indicator => {
        const icon = indicator.querySelector('i');
        const type = indicator.querySelector('small').textContent.toLowerCase();

        // Remove existing classes
        icon.classList.remove('text-success', 'text-warning', 'text-danger');

        // Check if this indicator is in the issues list
        let hasIssue = false;
        if (type.includes('vent') && conditions.issues.includes('wind')) hasIssue = true;
        if (type.includes('visibilité') && conditions.issues.includes('visibility')) hasIssue = true;
        if (type.includes('plafond') && conditions.issues.includes('clouds')) hasIssue = true;

        // Apply appropriate class
        if (hasIssue) {
            icon.classList.add('text-warning');
        } else {
            icon.classList.add('text-success');
        }
    });
}

// Get Wind Direction Arrow
function getWindDirectionArrow(degrees) {
    // Return rotation for arrow icon
    return `rotate(${degrees}deg)`;
}

// Update Wind Direction Arrow
function updateWindArrow(degrees) {
    const arrowEl = document.querySelector('.wind-direction i.fa-location-arrow');
    if (arrowEl) {
        arrowEl.style.transform = getWindDirectionArrow(degrees);
    }
}

// Refresh Weather
async function refreshWeather(silent = false) {
    try {
        if (!silent) showLoading();
        const data = await fetchRealWeather();
        updateWeatherDisplay(data);
        if (!silent) showSuccessToast('Données météo actualisées');
    } catch (e) {
        // Pas de serveur météo (mode démo) ou clé absente : repli sur l'exemple
        console.error(e);
        updateWeatherDisplay(mockWeatherData);
        if (!silent) showInfoToast('Météo réelle indisponible : données d\'exemple affichées');
    } finally {
        if (!silent) hideLoading();
    }
}

// Charge le METAR/TAF réel de la station officielle la plus proche
// du terrain (via /api/metar). Repli silencieux si indisponible.
async function loadMetar() {
    const raw = document.getElementById('metarRaw');
    const decode = document.getElementById('metarDecode');
    const tafRaw = document.getElementById('tafRaw');
    if (!raw) return;

    try {
        const resp = await fetch(`/api/metar?lat=${WEATHER_CONFIG.lat}&lon=${WEATHER_CONFIG.lon}`);
        const d = await resp.json().catch(() => ({}));
        if (!resp.ok || !d.found) throw new Error('indisponible');

        const label = `${d.name} (${d.station}) · ≈ ${d.distance_km} km`;
        setText('metarStation', '— ' + label);
        setText('tafStation', '— ' + d.station);

        raw.textContent = d.metar_raw || '—';
        tafRaw.textContent = d.taf_raw || 'TAF non publié pour cette station.';

        const rows = [];
        rows.push(`<li><i class="fas fa-map-marker-alt text-success"></i> Station : ${escapeHtml(d.name)} (${escapeHtml(d.station)})</li>`);
        if (d.flt_cat) rows.push(`<li><i class="fas fa-plane text-success"></i> Catégorie de vol : ${escapeHtml(d.flt_cat)}</li>`);
        if (d.wspd != null) rows.push(`<li><i class="fas fa-wind text-success"></i> Vent : ${escapeHtml(String(d.wdir))}° à ${escapeHtml(String(d.wspd))} kt</li>`);
        if (d.visib) rows.push(`<li><i class="fas fa-eye text-success"></i> Visibilité : ${escapeHtml(d.visib)} (mi/SM)</li>`);
        if (d.temp != null) rows.push(`<li><i class="fas fa-temperature-half text-success"></i> Température : ${escapeHtml(String(d.temp))}°C / rosée ${escapeHtml(String(d.dewp))}°C</li>`);
        if (d.altim != null) rows.push(`<li><i class="fas fa-gauge text-success"></i> QNH : ${escapeHtml(String(d.altim))} hPa</li>`);
        decode.innerHTML = '<p class="mb-2"><strong>Décodage :</strong></p><ul class="list-unstyled">' + rows.join('') + '</ul>';
    } catch (e) {
        console.error(e);
        raw.textContent = 'METAR indisponible pour le moment.';
        if (tafRaw) tafRaw.textContent = 'TAF indisponible pour le moment.';
        if (decode) decode.innerHTML = '';
    }
}

// Format DateTime
function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Auto-refresh weather
function startWeatherAutoRefresh() {
    setInterval(() => {
        refreshWeather(true);
    }, 300000); // Refresh every 5 minutes
}

// Get Weather Alerts (fonction pour implémentation future)
async function checkWeatherAlerts() {
    // This would check for severe weather alerts
    // For now, just a placeholder
    return [];
}

// Export functions
window.refreshWeather = refreshWeather;

// Initialize on page load
window.addEventListener('load', async function() {
    // La météo est celle du terrain du club du membre connecté
    if (window.appReady) await window.appReady;
    const club = window.CURRENT_CLUB;
    if (club && club.latitude != null && club.longitude != null) {
        WEATHER_CONFIG.lat = club.latitude;
        WEATHER_CONFIG.lon = club.longitude;
    }
    if (club) {
        const parts = [club.base_name || club.name, club.base_code ? '(' + club.base_code + ')' : '', club.city ? '— ' + club.city : ''];
        setText('weatherLocation', parts.filter(Boolean).join(' '));
    }

    await refreshWeather(true);
    loadMetar();
    startWeatherAutoRefresh();

    // Check for alerts
    checkWeatherAlerts().then(alerts => {
        if (alerts && alerts.length > 0) {
            alerts.forEach(alert => {
                showInfoToast('Alerte météo: ' + alert.message);
            });
        }
    });
});
