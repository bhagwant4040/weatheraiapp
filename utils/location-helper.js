class LocationHelper {
    constructor() {
        this.defaultLocation = { city: 'London', coords: { lat: 51.5074, lon: -0.1278 } };
    }

    // In utils/location-helper.js, simplify to use only browser geolocation
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false, // Use less precise but more reliable
                timeout: 5000
            });
        });
    }


    async requestLocationPermission() {
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            return permission.state;
        } catch (error) {
            console.warn('Could not check location permission');
            return 'unknown';
        }
    }

    validateCityName(cityName) {
        if (!cityName || typeof cityName !== 'string') {
            return false;
        }
        
        const trimmed = cityName.trim();
        if (trimmed.length < 2 || trimmed.length > 50) {
            return false;
        }
        
        // Allow letters, spaces, hyphens, apostrophes
        const validChars = /^[a-zA-Z\s\-']+$/;
        return validChars.test(trimmed);
    }

    formatLocationName(weatherData) {
        if (!weatherData || !weatherData.name) {
            return 'Unknown Location';
        }
        
        const city = weatherData.name;
        const country = weatherData.sys?.country || '';
        
        return country ? `${city}, ${country}` : city;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

module.exports = LocationHelper;
