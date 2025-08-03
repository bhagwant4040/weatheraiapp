const axios = require('axios');

class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
    }

    async getCurrentWeather(city) {
        try {
            // First get coordinates for the city
            const coords = await this.geocodeCity(city);
            return await this.getWeatherByCoords(coords.latitude, coords.longitude, city);
        } catch (error) {
            console.error('Weather API Error:', error);
            throw new Error(`Failed to fetch weather data for "${city}". Please check the city name.`);
        }
    }

    async getWeatherByCoords(lat, lon, cityName = null) {
        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: [
                        'temperature_2m',
                        'relative_humidity_2m', 
                        'wind_speed_10m',
                        'wind_direction_10m',
                        'weather_code',
                        'surface_pressure'
                    ].join(','),
                    hourly: [
                        'temperature_2m',
                        'relative_humidity_2m',
                        'wind_speed_10m',
                        'weather_code',
                        'precipitation'
                    ].join(','),
                    daily: [
                        'temperature_2m_max',
                        'temperature_2m_min',
                        'weather_code',
                        'precipitation_sum'
                    ].join(','),
                    timezone: 'auto',
                    forecast_days: 7
                }
            });

            // Transform Open-Meteo response to match your existing app structure
            return this.transformWeatherData(response.data, cityName, lat, lon);
        } catch (error) {
            console.error('Weather API Error:', error);
            throw new Error('Failed to fetch weather data for your location.');
        }
    }

    async geocodeCity(cityName) {
        try {
            const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
                params: {
                    name: cityName,
                    count: 1,
                    language: 'en',
                    format: 'json'
                }
            });

            if (!response.data.results || response.data.results.length === 0) {
                throw new Error(`City "${cityName}" not found`);
            }

            const result = response.data.results[0];
            return {
                latitude: result.latitude,
                longitude: result.longitude,
                name: result.name,
                country: result.country_code || result.country || 'Unknown'
            };
        } catch (error) {
            console.error('Geocoding error:', error);
            throw new Error(`Could not find location for "${cityName}"`);
        }
    }

    transformWeatherData(data, cityName, lat, lon) {
        // Transform Open-Meteo format to match your app's expected structure
        const current = data.current;
        const weatherCode = current.weather_code;
        
        return {
            name: cityName || 'Current Location',
            sys: { country: 'Unknown' },
            coord: { lat, lon },
            main: {
                temp: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                pressure: current.surface_pressure
            },
            wind: {
                speed: current.wind_speed_10m,
                deg: current.wind_direction_10m
            },
            weather: [{
                main: this.getWeatherCondition(weatherCode),
                description: this.getWeatherDescription(weatherCode),
                code: weatherCode
            }],
            visibility: 10000, // Default visibility
            dt: Math.floor(Date.now() / 1000)
        };
    }

    getWeatherCondition(code) {
        const conditions = {
            0: 'Clear',
            1: 'Clear', 2: 'Clouds', 3: 'Clouds',
            45: 'Mist', 48: 'Mist',
            51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
            56: 'Drizzle', 57: 'Drizzle',
            61: 'Rain', 63: 'Rain', 65: 'Rain',
            66: 'Rain', 67: 'Rain',
            71: 'Snow', 73: 'Snow', 75: 'Snow', 77: 'Snow',
            80: 'Rain', 81: 'Rain', 82: 'Rain',
            85: 'Snow', 86: 'Snow',
            95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
        };
        return conditions[code] || 'Unknown';
    }

    getWeatherDescription(code) {
        const descriptions = {
            0: 'clear sky',
            1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
            45: 'fog', 48: 'depositing rime fog',
            51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
            56: 'light freezing drizzle', 57: 'dense freezing drizzle',
            61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
            66: 'light freezing rain', 67: 'heavy freezing rain',
            71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow', 77: 'snow grains',
            80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
            85: 'slight snow showers', 86: 'heavy snow showers',
            95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
        };
        return descriptions[code] || 'unknown conditions';
    }

    async getForecast(city) {
        // For compatibility, return the same data as getCurrentWeather
        // Open-Meteo includes forecast data in the main response
        return await this.getCurrentWeather(city);
    }
}

module.exports = WeatherService;
