// ============================================
// DASHBOARD PAGE JAVASCRIPT
// ============================================

// Mock Data
const dashboardData = {
    stats: {
        reservationsToday: 12,
        machinesAvailable: 8,
        totalMachines: 10,
        activeMembers: 156,
        baptemesPlanned: 5
    },
    weather: {
        temp: 22,
        condition: 'Ciel dégagé',
        windSpeed: 12,
        windDirection: 'NE',
        humidity: 65,
        visibility: 10,
        pressure: 1013
    },
    reservations: [
        { time: '09:00 - 11:00', machine: 'ULM-001', pilot: 'Marc Leroy', status: 'confirmed' },
        { time: '11:30 - 13:30', machine: 'ULM-003', pilot: 'Sophie Martin', status: 'pending' },
        { time: '14:00 - 16:00', machine: 'ULM-002', pilot: 'Baptême - Client X', status: 'bapteme' },
        { time: '16:30 - 18:00', machine: 'ULM-001', pilot: 'Pierre Dubois', status: 'confirmed' }
    ],
    news: [
        {
            date: '15 Nov 2025',
            title: 'Nouvelle réglementation ULM 2025',
            excerpt: 'Mise à jour importante concernant les nouvelles normes de sécurité...',
            link: '#'
        },
        {
            date: '12 Nov 2025',
            title: 'Rassemblement annuel prévu en juin',
            excerpt: 'Réservez vos dates pour le grand rassemblement d\'été...',
            link: '#'
        },
        {
            date: '08 Nov 2025',
            title: 'Maintenance programmée ULM-004',
            excerpt: 'L\'appareil sera indisponible du 20 au 25 novembre...',
            link: '#'
        }
    ]
};

// Update Dashboard Stats
function updateDashboardStats() {
    const stats = dashboardData.stats;

    // Update stat cards (if they have dynamic IDs)
    // This is for demonstration - in a real app, these would come from an API
    console.log('Dashboard stats loaded:', stats);
}

// Update Weather Widget
function updateWeatherWidget() {
    const weather = dashboardData.weather;

    // Update mini weather widget in header
    const windSpeedEl = document.getElementById('windSpeed');
    const windDirectionEl = document.getElementById('windDirection');

    if (windSpeedEl) {
        windSpeedEl.textContent = weather.windSpeed + ' km/h';
    }

    if (windDirectionEl) {
        windDirectionEl.textContent = weather.windDirection;
    }
}

// Real-time Weather Update (simulated)
function startWeatherUpdates() {
    setInterval(() => {
        // Simulate slight variations in wind
        const variation = Math.floor(Math.random() * 5) - 2;
        dashboardData.weather.windSpeed = Math.max(5, Math.min(25, dashboardData.weather.windSpeed + variation));
        updateWeatherWidget();
    }, 30000); // Update every 30 seconds
}

// Initialize Dashboard
function initDashboard() {
    updateDashboardStats();
    updateWeatherWidget();
    startWeatherUpdates();

    // Add animation to stat cards
    animateStatCards();

    // Load notifications
    loadNotifications();
}

// Animate stat cards on load
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Load Notifications
function loadNotifications() {
    // Simulate notification count
    const notificationCount = 3;
    const badge = document.querySelector('.btn-notification .badge');
    if (badge && notificationCount > 0) {
        badge.textContent = notificationCount;
        badge.style.display = 'block';
    }
}

// Mark notification as read
function markNotificationRead(notificationId) {
    showInfoToast('Notification marquée comme lue');
    // Update notification count
    const badge = document.querySelector('.btn-notification .badge');
    if (badge) {
        let count = parseInt(badge.textContent) || 0;
        count = Math.max(0, count - 1);
        badge.textContent = count;
        if (count === 0) {
            badge.style.display = 'none';
        }
    }
}

// Quick Actions
function quickActionReservation() {
    window.location.href = 'reservations.html?action=new';
}

function quickActionBapteme() {
    window.location.href = 'baptemes.html?action=new';
}

function quickActionMember() {
    window.location.href = 'members.html?action=add';
}

function quickActionNews() {
    window.location.href = 'news.html?action=new';
}

// Auto-refresh dashboard data
function startDashboardAutoRefresh() {
    setInterval(() => {
        // In a real app, this would fetch fresh data from the server
        console.log('Refreshing dashboard data...');
        updateDashboardStats();
    }, 60000); // Refresh every minute
}

// Check for important alerts
function checkAlerts() {
    // Simulate checking for important alerts
    const alerts = [
        // Example: { type: 'warning', message: 'Conditions météo se dégradent', link: 'weather.html' }
    ];

    alerts.forEach(alert => {
        if (alert.type === 'warning') {
            showInfoToast(alert.message);
        } else if (alert.type === 'danger') {
            showErrorToast(alert.message);
        }
    });
}

// Export functions
window.markNotificationRead = markNotificationRead;
window.quickActionReservation = quickActionReservation;
window.quickActionBapteme = quickActionBapteme;
window.quickActionMember = quickActionMember;
window.quickActionNews = quickActionNews;

// Initialize on page load
window.addEventListener('load', function() {
    initDashboard();
    startDashboardAutoRefresh();
    checkAlerts();

    // Welcome message
    const username = sessionStorage.getItem('username') || 'Utilisateur';
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';

    setTimeout(() => {
        showInfoToast(`${greeting} ! Bienvenue sur votre tableau de bord.`);
    }, 500);
});
