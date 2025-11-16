// ============================================
// WEATHER PAGE JAVASCRIPT
// ============================================

// Configuration API Météo
const WEATHER_CONFIG = {
    // Pour une vraie implémentation, utilisez OpenWeatherMap API
    apiKey: 'YOUR_OPENWEATHERMAP_API_KEY',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    // Coordonnées de l'aérodrome (exemple: Marseille-Provence)
    lat: 43.5352,
    lon: 5.3672,
    // METAR/TAF endpoint (exemple: Aviation Weather)
    metarUrl: 'https://avwx.rest/api'
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

// Fetch Real Weather Data (fonction pour implémentation future)
async function fetchRealWeather() {
    try {
        // Current weather
        const weatherResponse = await fetch(
            `${WEATHER_CONFIG.apiUrl}/weather?lat=${WEATHER_CONFIG.lat}&lon=${WEATHER_CONFIG.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric&lang=fr`
        );
        const weatherData = await weatherResponse.json();

        // Forecast
        const forecastResponse = await fetch(
            `${WEATHER_CONFIG.apiUrl}/forecast?lat=${WEATHER_CONFIG.lat}&lon=${WEATHER_CONFIG.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric&lang=fr`
        );
        const forecastData = await forecastResponse.json();

        return { current: weatherData, forecast: forecastData };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Update Weather Display
function updateWeatherDisplay(data = mockWeatherData) {
    updateCurrentWeather(data.current);
    updateForecast(data.forecast);
    updateFlightConditions(data.current);
}

// Update Current Weather
function updateCurrentWeather(current) {
    // Update time
    const updateTimeEl = document.getElementById('updateTime');
    if (updateTimeEl) {
        const now = new Date();
        updateTimeEl.textContent = formatDateTime(now);
    }

    // Update wind speed in header if exists
    const windSpeedEl = document.getElementById('windSpeed');
    if (windSpeedEl) {
        windSpeedEl.textContent = current.wind.speed + ' km/h';
    }

    const windDirectionEl = document.getElementById('windDirection');
    if (windDirectionEl) {
        windDirectionEl.textContent = current.wind.directionName;
    }
}

// Update Forecast
function updateForecast(forecast) {
    // The forecast display is already in the HTML
    // In a real implementation, this would dynamically generate the forecast cards
    console.log('Forecast data:', forecast);
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
function refreshWeather() {
    showLoading();

    // Simulate API call
    setTimeout(() => {
        // In production, call fetchRealWeather() here
        updateWeatherDisplay(mockWeatherData);
        hideLoading();
        showSuccessToast('Données météo actualisées');

        // Update time
        const updateTimeEl = document.getElementById('updateTime');
        if (updateTimeEl) {
            updateTimeEl.textContent = formatDateTime(new Date());
        }
    }, 1000);
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
        refreshWeather();
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
window.addEventListener('load', function() {
    updateWeatherDisplay(mockWeatherData);
    updateWindArrow(mockWeatherData.current.wind.direction);
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
