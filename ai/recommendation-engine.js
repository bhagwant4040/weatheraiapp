class AIRecommendationEngine {
    constructor() {
        this.clothingDatabase = this.initializeClothingDatabase();
        this.activityDatabase = this.initializeActivityDatabase();
        this.itemDatabase = this.initializeItemDatabase();
    }

    async predict(weatherData) {
        try {
            const analysis = this.analyzeWeatherConditions(weatherData);
            
            return {
                clothingWeight: analysis.clothingWeight,
                activityLevel: analysis.activityLevel,
                comfortIndex: analysis.comfortIndex,
                recommendations: {
                    clothing: this.getClothingRecommendations(weatherData, analysis),
                    items: this.getItemRecommendations(weatherData, analysis),
                    activities: this.getActivityRecommendations(weatherData, analysis),
                    personalizedTip: this.generatePersonalizedTip(weatherData, analysis)
                }
            };
        } catch (error) {
            console.error('AI Prediction Error:', error);
            return this.getFallbackRecommendations(weatherData);
        }
    }

    analyzeWeatherConditions(weatherData) {
        const temp = weatherData.main.temp;
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind?.speed || 0;
        const pressure = weatherData.main.pressure;
        const weatherMain = weatherData.weather[0].main.toLowerCase();
        const isRaining = weatherMain.includes('rain');
        const isSnowing = weatherMain.includes('snow');
        const isCloudy = weatherMain.includes('cloud');
        const visibility = weatherData.visibility || 10000;
        
        return {
            temp,
            humidity,
            windSpeed,
            pressure,
            weatherMain,
            isRaining,
            isSnowing,
            isCloudy,
            visibility,
            clothingWeight: this.calculateClothingWeight(temp, windSpeed, isRaining, isSnowing),
            activityLevel: this.calculateActivityLevel(temp, isRaining, windSpeed, visibility),
            comfortIndex: this.calculateComfortIndex(temp, humidity, windSpeed, pressure)
        };
    }

    calculateClothingWeight(temp, windSpeed, isRaining, isSnowing) {
        let weight = 0.5; // Base level
        
        // Temperature factor
        if (temp < -10) weight = 1.0;
        else if (temp < 0) weight = 0.9;
        else if (temp < 10) weight = 0.7;
        else if (temp < 20) weight = 0.5;
        else if (temp < 30) weight = 0.3;
        else weight = 0.1;
        
        // Weather adjustments
        if (isSnowing) weight = Math.max(weight, 0.8);
        if (isRaining) weight += 0.1;
        if (windSpeed > 15) weight += 0.1;
        if (windSpeed > 25) weight += 0.1;
        
        return Math.min(Math.max(weight, 0), 1);
    }

    calculateActivityLevel(temp, isRaining, windSpeed, visibility) {
        let activity = 0.7; // Base level
        
        // Weather penalties
        if (isRaining) activity -= 0.4;
        if (windSpeed > 20) activity -= 0.3;
        if (visibility < 5000) activity -= 0.2;
        if (temp < -5 || temp > 35) activity -= 0.3;
        
        // Optimal conditions bonus
        if (temp >= 15 && temp <= 25 && !isRaining && windSpeed < 10) {
            activity = 1.0;
        }
        
        return Math.min(Math.max(activity, 0), 1);
    }

    calculateComfortIndex(temp, humidity, windSpeed, pressure) {
        let comfort = 0.5;
        
        // Temperature comfort zone
        if (temp >= 18 && temp <= 24) comfort += 0.3;
        else if (temp >= 15 && temp <= 27) comfort += 0.1;
        else if (temp < 5 || temp > 30) comfort -= 0.2;
        
        // Humidity comfort
        if (humidity >= 40 && humidity <= 60) comfort += 0.2;
        else if (humidity > 80) comfort -= 0.2;
        else if (humidity < 30) comfort -= 0.1;
        
        // Wind comfort
        if (windSpeed >= 5 && windSpeed <= 15) comfort += 0.1;
        else if (windSpeed > 25) comfort -= 0.2;
        
        // Pressure comfort (normal range: 1013.25 ± 20 hPa)
        if (pressure >= 993 && pressure <= 1033) comfort += 0.1;
        else comfort -= 0.1;
        
        return Math.min(Math.max(comfort, 0), 1);
    }

    getClothingRecommendations(weatherData, analysis) {
        const { temp, isRaining, isSnowing, windSpeed, clothingWeight } = analysis;
        const recommendations = new Set();
        
        // Base clothing by temperature
        if (temp <= -10) {
            recommendations.add("🧥 Heavy winter coat");
            recommendations.add("🧤 Insulated gloves");
            recommendations.add("👢 Winter boots");
            recommendations.add("🧣 Warm scarf");
            recommendations.add("🎿 Thermal underwear");
        } else if (temp <= 0) {
            recommendations.add("🧥 Winter jacket");
            recommendations.add("🧤 Gloves");
            recommendations.add("👢 Warm boots");
            recommendations.add("🧣 Scarf");
        } else if (temp <= 10) {
            recommendations.add("🧥 Warm jacket or coat");
            recommendations.add("👖 Long pants");
            recommendations.add("👟 Closed shoes");
            recommendations.add("🧣 Light scarf (optional)");
        } else if (temp <= 20) {
            recommendations.add("👕 Light sweater or cardigan");
            recommendations.add("👖 Long pants or jeans");
            recommendations.add("👟 Comfortable shoes");
        } else if (temp <= 30) {
            recommendations.add("👕 T-shirt or light shirt");
            recommendations.add("🩳 Shorts or light pants");
            recommendations.add("👟 Breathable shoes");
        } else {
            recommendations.add("👕 Lightweight, breathable clothing");
            recommendations.add("🩳 Shorts");
            recommendations.add("🩴 Sandals or breathable shoes");
            recommendations.add("👒 Sun hat");
        }
        
        // Weather-specific additions
        if (isRaining) {
            recommendations.add("☔ Waterproof jacket or raincoat");
            recommendations.add("👢 Waterproof shoes or rain boots");
        }
        
        if (isSnowing) {
            recommendations.add("❄️ Waterproof outer layer");
            recommendations.add("👢 Non-slip winter boots");
        }
        
        if (windSpeed > 15) {
            recommendations.add("🌬️ Windbreaker or wind-resistant jacket");
            recommendations.add("👒 Secure hat or cap");
        }
        
        if (temp > 25) {
            recommendations.add("🕶️ Sunglasses");
            recommendations.add("👒 Sun protection hat");
        }
        
        return Array.from(recommendations);
    }

    getItemRecommendations(weatherData, analysis) {
        const { temp, isRaining, isSnowing, humidity, windSpeed } = analysis;
        const items = new Set(["📱 Phone", "💳 Wallet", "🔑 Keys"]);
        
        // Weather-specific items
        if (isRaining) {
            items.add("☔ Umbrella");
            items.add("💧 Waterproof bag cover");
            items.add("🧻 Tissues (for wet conditions)");
        }
        
        if (isSnowing) {
            items.add("🧤 Extra gloves");
            items.add("🧻 Tissues");
        }
        
        if (temp > 25) {
            items.add("🧴 Sunscreen (SPF 30+)");
            items.add("💧 Water bottle");
            items.add("🕶️ Sunglasses");
        }
        
        if (temp < 5) {
            items.add("🔥 Hand warmers");
            items.add("☕ Thermos with hot drink");
        }
        
        if (humidity > 80) {
            items.add("🧻 Extra tissues");
            items.add("💧 Dehumidifying packets");
        }
        
        if (windSpeed > 20) {
            items.add("🎯 Secure bag or backpack");
        }
        
        // Health considerations
        if (temp < 10 || humidity > 70) {
            items.add("💊 Hand sanitizer");
        }
        
        return Array.from(items);
    }

    getActivityRecommendations(weatherData, analysis) {
        const { temp, isRaining, isSnowing, windSpeed, activityLevel, visibility } = analysis;
        
        const activities = {
            outdoor: [],
            indoor: [],
            tips: []
        };
        
        // Excellent outdoor conditions
        if (activityLevel > 0.8) {
            activities.outdoor.push(
                "🚶‍♂️ Walking or hiking",
                "🚴‍♂️ Cycling",
                "🏃‍♂️ Jogging or running",
                "🏐 Outdoor sports",
                "📸 Photography walk",
                "🧺 Picnic in the park",
                "🌳 Nature exploration"
            );
        }
        
        // Good outdoor conditions
        else if (activityLevel > 0.5) {
            activities.outdoor.push(
                "🚶‍♂️ Light walking",
                "☕ Outdoor café visits",
                "🛍️ Outdoor markets"
            );
            activities.indoor.push(
                "🏛️ Museums",
                "🛍️ Shopping centers"
            );
        }
        
        // Poor outdoor conditions
        else {
            activities.indoor.push(
                "🏛️ Museums and galleries",
                "📚 Libraries",
                "🛍️ Indoor shopping",
                "🎬 Movie theaters",
                "🎮 Gaming centers",
                "☕ Cozy cafés",
                "🍽️ Indoor dining"
            );
        }
        
        // Weather-specific activities
        if (isSnowing && temp > -10) {
            activities.outdoor.push("⛄ Snow activities (if you enjoy winter sports)");
        }
        
        if (temp > 30) {
            activities.outdoor.push("🏊‍♂️ Swimming", "🌊 Water sports");
            activities.tips.push("Stay hydrated and seek shade frequently");
        }
        
        if (temp < 0) {
            activities.tips.push("Limit outdoor exposure, dress warmly");
        }
        
        if (windSpeed > 25) {
            activities.tips.push("Avoid activities with loose items outdoors");
        }
        
        if (visibility < 5000) {
            activities.tips.push("Be extra careful if driving or walking outdoors");
        }
        
        return activities;
    }

    generatePersonalizedTip(weatherData, analysis) {
        const { temp, isRaining, isSnowing, windSpeed, comfortIndex, activityLevel } = analysis;
        
        if (isSnowing) {
            return "❄️ Snow day! Perfect for cozy indoor activities with hot cocoa.";
        }
        
        if (comfortIndex > 0.8) {
            return "🌟 Perfect weather conditions! Great time to enjoy outdoor activities and get some fresh air.";
        }
        
        if (comfortIndex < 0.3) {
            return "🏠 Weather conditions are challenging today. Stay comfortable indoors and take care of yourself.";
        }
        
        if (activityLevel > 0.7) {
            return "🏃‍♂️ Excellent weather for being active! Don't forget to stay hydrated and enjoy the outdoors.";
        }
        
        if (temp > 30) {
            return "🌞 Hot day ahead! Seek shade, wear light colors, and drink plenty of water.";
        }
        
        if (temp < 5) {
            return "🧥 Bundle up today! Layer your clothing and keep extremities warm.";
        }
        
        if (isRaining) {
            return "☔ Rainy day vibes! Perfect for indoor activities or a cozy walk with an umbrella.";
        }
        
        if (windSpeed > 20) {
            return "🌬️ Windy conditions today! Secure loose items and dress in wind-resistant clothing.";
        }
        
        return "😊 Have a wonderful day! Check the weather again if conditions change.";
    }

    getFallbackRecommendations(weatherData) {
        const temp = weatherData.main.temp;
        const isRaining = weatherData.weather[0].main.toLowerCase().includes('rain');
        
        return {
            clothingWeight: temp < 10 ? 0.8 : temp > 25 ? 0.2 : 0.5,
            activityLevel: isRaining ? 0.3 : 0.7,
            comfortIndex: 0.5,
            recommendations: {
                clothing: temp < 10 ? ["🧥 Warm jacket", "👖 Long pants"] : ["👕 Comfortable clothing"],
                items: isRaining ? ["☔ Umbrella", "💧 Waterproof bag"] : ["💧 Water bottle"],
                activities: {
                    outdoor: isRaining ? [] : ["🚶‍♂️ Walking"],
                    indoor: ["📚 Reading", "🏛️ Museums"],
                    tips: ["Have a great day!"]
                },
                personalizedTip: "Have a wonderful day! 😊"
            }
        };
    }

    initializeClothingDatabase() {
        return {
            temperature_ranges: {
                freezing: { min: -20, max: 0, weight: 1.0 },
                cold: { min: 0, max: 10, weight: 0.7 },
                cool: { min: 10, max: 20, weight: 0.5 },
                warm: { min: 20, max: 30, weight: 0.3 },
                hot: { min: 30, max: 50, weight: 0.1 }
            }
        };
    }

    initializeActivityDatabase() {
        return {
            indoor: ["Museums", "Shopping", "Movies", "Libraries", "Cafés"],
            outdoor: ["Walking", "Cycling", "Sports", "Photography", "Picnics"]
        };
    }

    initializeItemDatabase() {
        return {
            essential: ["Phone", "Wallet", "Keys"],
            weather_specific: {
                rain: ["Umbrella", "Waterproof bag"],
                sun: ["Sunscreen", "Sunglasses", "Water bottle"],
                cold: ["Hand warmers", "Hot drink"]
            }
        };
    }
}

module.exports = AIRecommendationEngine;
