const WeatherService = require('./services/weather-service.js');
const AIRecommendationEngine = require('./ai/recommendation-engine.js');
const LocationHelper = require('./utils/location-helper.js');

class WeatherApp {
    constructor() {
        this.weatherService = new WeatherService();
        this.aiEngine = new AIRecommendationEngine();
        this.locationHelper = new LocationHelper();
        
        this.currentLocation = null;
        this.userSearchedLocation = false;
        this.currentWeather = null;
        this.forecast = null;
        this.recommendations = null;
        this.aiInsights = null;
        this.userPreferences = this.loadUserPreferences();
        this.isLoading = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        console.log('Initializing Weather AI App...');
        
        this.showLoadingState();
        
        try {
            // Get user's current location first
            await this.getCurrentLocation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showErrorMessage('Failed to initialize app: ' + error.message);
            
            // Fallback to default location
            this.currentLocation = 'London';
            await this.updateWeather();
        } finally {
            this.hideLoadingState();
        }
    }

    async getCurrentLocation() {
        try {
            // Request location permission first
            const permission = await this.locationHelper.requestLocationPermission();
            console.log('Location permission status:', permission);
            
            if (permission === 'denied') {
                throw new Error('Location access denied');
            }
            
            // Get current position
            const position = await this.locationHelper.getCurrentPosition();
            console.log('Got user location:', position);
            
            // Get weather for current coordinates
            this.currentWeather = await this.weatherService.getWeatherByCoords(
                position.latitude, 
                position.longitude
            );
            
            this.currentLocation = this.currentWeather.name;
            
            // Update location input
            const locationInput = document.getElementById('location-input');
            if (locationInput) {
                locationInput.value = this.currentLocation;
            }
            
            // Get AI recommendations
            const aiPrediction = await this.aiEngine.predict(this.currentWeather);
            this.recommendations = aiPrediction.recommendations;
            this.aiInsights = aiPrediction;
            
            this.updateUI();
            
        } catch (error) {
            console.log('Current location error:', error.message);
            console.log('Using default location');
            
            // Fallback to saved or default location
            this.currentLocation = this.userPreferences.lastLocation || 'London';
            await this.updateWeather();
        }
    }

    async updateWeather() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Validate location if it's a search
            if (this.userSearchedLocation && !this.locationHelper.validateCityName(this.currentLocation)) {
                throw new Error('Please enter a valid city name');
            }
            
            // Fetch current weather
            this.currentWeather = await this.weatherService.getCurrentWeather(this.currentLocation);
            
            // Get AI-powered recommendations
            const aiPrediction = await this.aiEngine.predict(this.currentWeather);
            this.recommendations = aiPrediction.recommendations;
            this.aiInsights = aiPrediction;
            
            this.updateUI();
            console.log('Weather data updated successfully');
            
        } catch (error) {
            console.error('Weather update failed:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    updateUI() {
        if (!this.currentWeather) {
            console.warn('No weather data available for UI update');
            return;
        }

        this.updateWeatherDisplay();
        this.updateRecommendations();
        this.updatePersonalizedTip();
        this.updateLocationDisplay();
    }

    updateWeatherDisplay() {
        const elements = {
            temperature: document.getElementById('temperature'),
            description: document.getElementById('description'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure')
        };

        if (elements.temperature) {
            elements.temperature.textContent = `${Math.round(this.currentWeather.main.temp)}°C`;
        }
        
        if (elements.description) {
            elements.description.textContent = this.currentWeather.weather[0].description
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        if (elements.humidity) {
            elements.humidity.textContent = `${this.currentWeather.main.humidity}%`;
        }
        
        if (elements.windSpeed) {
            elements.windSpeed.textContent = `${Math.round(this.currentWeather.wind.speed)} m/s`;
        }
        
        if (elements.pressure) {
            elements.pressure.textContent = `${this.currentWeather.main.pressure} hPa`;
        }

        this.updateWeatherIcon();
    }

    updateWeatherIcon() {
        const iconElement = document.getElementById('weather-icon');
        if (!iconElement) return;

        const weatherMain = this.currentWeather.weather[0].main.toLowerCase();
        const iconMap = {
            'clear': '☀️',
            'clouds': '☁️',
            'rain': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️',
            'fog': '🌫️',
            'haze': '🌫️'
        };
        
        iconElement.textContent = iconMap[weatherMain] || '🌤️';
    }

    updateRecommendations() {
        if (!this.recommendations) return;

        this.updateClothingRecommendations();
        this.updateItemRecommendations();
        this.updateActivityRecommendations();
    }

    updateClothingRecommendations() {
        const clothingList = document.getElementById('clothing-recommendations');
        if (!clothingList || !this.recommendations.clothing) return;

        clothingList.innerHTML = '';
        this.recommendations.clothing.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item;
            li.style.animationDelay = `${index * 0.1}s`;
            li.className = 'fade-in';
            clothingList.appendChild(li);
        });
    }

    updateItemRecommendations() {
        const itemsList = document.getElementById('items-recommendations');
        if (!itemsList || !this.recommendations.items) return;

        itemsList.innerHTML = '';
        this.recommendations.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item;
            li.style.animationDelay = `${index * 0.1}s`;
            li.className = 'fade-in';
            itemsList.appendChild(li);
        });
    }

    updateActivityRecommendations() {
        const activitiesDiv = document.getElementById('activities-recommendations');
        if (!activitiesDiv || !this.recommendations.activities) return;

        activitiesDiv.innerHTML = '';
        
        const activities = this.recommendations.activities;
        
        if (activities.outdoor && activities.outdoor.length > 0) {
            const outdoorSection = this.createActivitySection('🌞 Outdoor Activities', activities.outdoor);
            activitiesDiv.appendChild(outdoorSection);
        }

        if (activities.indoor && activities.indoor.length > 0) {
            const indoorSection = this.createActivitySection('🏠 Indoor Activities', activities.indoor);
            activitiesDiv.appendChild(indoorSection);
        }

        if (activities.tips && activities.tips.length > 0) {
            const tipsSection = this.createActivitySection('💡 Tips', activities.tips);
            activitiesDiv.appendChild(tipsSection);
        }
    }

    createActivitySection(title, activities) {
        const section = document.createElement('div');
        section.className = 'activity-section';
        
        const header = document.createElement('h4');
        header.textContent = title;
        section.appendChild(header);
        
        const list = document.createElement('ul');
        activities.forEach((activity, index) => {
            const li = document.createElement('li');
            li.textContent = activity;
            li.style.animationDelay = `${index * 0.1}s`;
            li.className = 'fade-in';
            list.appendChild(li);
        });
        
        section.appendChild(list);
        return section;
    }

    updatePersonalizedTip() {
        const personalTip = document.getElementById('personal-tip');
        if (!personalTip || !this.recommendations) return;

        personalTip.textContent = this.recommendations.personalizedTip || "Have a wonderful day! 😊";
        personalTip.className = 'fade-in';
    }

    updateLocationDisplay() {
        const locationDisplay = document.getElementById('current-location');
        if (!locationDisplay || !this.currentWeather) return;

        const formattedLocation = this.locationHelper.formatLocationName(this.currentWeather);
        const locationText = this.userSearchedLocation 
            ? `📍 ${formattedLocation}` 
            : `📍 Current Location: ${formattedLocation}`;
            
        locationDisplay.textContent = locationText;
    }

    setupEventListeners() {
        // Location input
        const locationInput = document.getElementById('location-input');
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.handleLocationChange(e.target.value.trim());
                }
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.handleRefresh();
            });
        }

        // Current location button
        const currentLocationBtn = document.getElementById('current-location-btn');
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', () => {
                this.useCurrentLocation();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.metaKey || e.ctrlKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.handleRefresh();
                        break;
                    case 'l':
                        e.preventDefault();
                        locationInput?.focus();
                        break;
                }
            }
        });
    }

    async handleLocationChange(newLocation) {
        if (!newLocation) return;
        
        console.log(`Searching weather for: ${newLocation}`);
        this.currentLocation = newLocation;
        this.userSearchedLocation = true;
        
        try {
            await this.updateWeather();
            this.saveUserPreferences();
            this.showSuccessMessage(`Weather updated for ${newLocation}! 🌤️`);
        } catch (error) {
            console.error('Location change failed:', error);
            this.showErrorMessage(error.message);
        }
    }

    async handleRefresh() {
        console.log('Refreshing weather data...');
        
        try {
            if (this.userSearchedLocation) {
                await this.updateWeather();
            } else {
                await this.getCurrentLocation();
            }
            this.showSuccessMessage('Weather data updated! 🔄');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showErrorMessage('Failed to refresh weather data');
        }
    }

    async useCurrentLocation() {
        console.log('Using current location...');
        this.userSearchedLocation = false;
        
        const locationInput = document.getElementById('location-input');
        if (locationInput) locationInput.value = 'Detecting location...';
        
        try {
            await this.getCurrentLocation();
            this.showSuccessMessage('Location updated! 📍');
        } catch (error) {
            console.error('Current location failed:', error);
            this.showErrorMessage('Could not get your current location');
        }
    }

    showLoadingState() {
        const app = document.querySelector('.app-container');
        if (app) app.classList.add('loading');

        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '⟳';
            refreshBtn.style.animation = 'spin 1s linear infinite';
        }

        this.updateLoadingText();
    }

    hideLoadingState() {
        const app = document.querySelector('.app-container');
        if (app) app.classList.remove('loading');

        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '🔄';
            refreshBtn.style.animation = '';
        }
    }

    updateLoadingText() {
        const elements = {
            temperature: document.getElementById('temperature'),
            description: document.getElementById('description'),
            currentLocation: document.getElementById('current-location')
        };
        
        if (elements.temperature) elements.temperature.textContent = '...°C';
        if (elements.description) elements.description.textContent = 'Loading weather data...';
        if (elements.currentLocation) elements.currentLocation.textContent = 'Detecting location...';
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            error: '#ff4757',
            success: '#2ed573',
            info: '#3742fa'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('weatherAppPreferences');
            return saved ? JSON.parse(saved) : {
                lastLocation: 'London',
                units: 'metric',
                autoLocation: true,
                theme: 'auto'
            };
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return {
                lastLocation: 'London',
                units: 'metric',
                autoLocation: true,
                theme: 'auto'
            };
        }
    }

    saveUserPreferences() {
        try {
            this.userPreferences.lastLocation = this.currentLocation;
            this.userPreferences.lastUpdated = new Date().toISOString();
            localStorage.setItem('weatherAppPreferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    destroy() {
        this.saveUserPreferences();
        console.log('Weather app destroyed');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing weather app...');
    window.weatherApp = new WeatherApp();
});

// Handle app closing
window.addEventListener('beforeunload', () => {
    if (window.weatherApp) {
        window.weatherApp.destroy();
    }
});

module.exports = WeatherApp;
