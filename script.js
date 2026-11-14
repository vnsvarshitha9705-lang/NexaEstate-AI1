
// ==================================================
// 1. GLOBAL SETTINGS
// ==================================================

const HISTORY_KEY = "houseHistory";
const FAVORITES_KEY = "favoriteProperties";


let priceChart = null;
let facilityMap = null;
let facilityMarkers = [];


// ==================================================
// 2. GET SAVED HOUSE HISTORY
// ==================================================

function getHistory() {
    try {
        const history = JSON.parse(
            localStorage.getItem(HISTORY_KEY)
        );

        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.error("Error reading history:", error);
        return [];
    }
}


// ==================================================
// 3. SAVE HOUSE HISTORY
// ==================================================

function saveHistory(history) {
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 100))
    );
}

function saveHistory(history) {
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 100))
    );
}

// FEATURE 8 CODE STARTS HERE

function getFavorites() {
    try {
        const favorites = JSON.parse(
            localStorage.getItem(FAVORITES_KEY)
        );

        return Array.isArray(favorites) ? favorites : [];

    } catch (error) {
        console.error("Error reading favorites:", error);
        return [];
    }
}

// ==================================================
// 4. HOUSE PRICE PREDICTION
// ==================================================

async function predictPrice() {

    const houseDetails = {
        city: document.getElementById("city")?.value.trim(),
        locality: document.getElementById("locality")?.value.trim(),
        area: Number(document.getElementById("area")?.value),
        bedrooms: Number(document.getElementById("bedrooms")?.value),
        bathrooms: Number(document.getElementById("bathrooms")?.value),
        floor: Number(document.getElementById("floor")?.value),
        age: Number(document.getElementById("age")?.value)
    };

    if (
        !houseDetails.city ||
        !houseDetails.locality ||
        !houseDetails.area ||
        !houseDetails.bedrooms ||
        !houseDetails.bathrooms ||
        Number.isNaN(houseDetails.floor) ||
        Number.isNaN(houseDetails.age)
    ) {
        alert("Please enter all house details.");
        return;
    }

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(houseDetails)
        });

        if (!response.ok) {
            throw new Error("Prediction request failed.");
        }

        const data = await response.json();

        if (data.predicted_price_lakhs === undefined) {
            throw new Error("Prediction value not received.");
        }

        const price = Number(data.predicted_price_lakhs);

        if (!Number.isFinite(price)) {
            throw new Error("Invalid prediction value.");
        }

        const history = getHistory();

        history.unshift({
    id: Date.now().toString(),
    ...houseDetails,
    price: price,
    date: new Date().toLocaleString()
});

        saveHistory(history);

        const resultElement =
            document.getElementById("predictionResult");

        if (resultElement) {
            resultElement.textContent =
                `Estimated House Price: ₹${price.toFixed(2)} Lakhs`;
        }

        displayHistory();
        
        displayPropertyRecommendations(houseDetails);

        console.log("House price predicted successfully.");

    } catch (error) {
        console.error("Prediction error:", error);
        alert("Unable to predict price. Please check your Flask server.");
    }
}


// ==================================================
// 5. GET PRICE FROM HISTORY RECORD
// ==================================================

function getRecordPrice(record) {
    return Number(
        record.price ??
        record.predictedPrice ??
        record.predicted_price ??
        record.estimatedPrice ??
        0
    );
}


// ==================================================
// 6. DISPLAY PROPERTY HISTORY
// ==================================================

function displayHistory() {

    const history = getHistory();

    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");

    if (!historyList) {
        console.error("historyList element not found.");
        return;
    }

    let filteredHistory = [...history];

    // Minimum price
    const minPrice =
        Number(document.getElementById("minPrice")?.value) || 0;

    // Maximum price
    const maxPriceInput =
        document.getElementById("maxPrice")?.value;

    const maxPrice = maxPriceInput === ""
        ? Infinity
        : Number(maxPriceInput);

    // City filter
    const selectedCity =
        document.getElementById("filterCity")?.value || "all";

    // Locality search
    const localitySearch =
        document.getElementById("searchLocality")?.value
            .trim()
            .toLowerCase() || "";

    // Bedroom filters
    const minBedrooms =
        Number(document.getElementById("minBedrooms")?.value) || 0;

    const maxBedroomsInput =
        document.getElementById("maxBedrooms")?.value;

    const maxBedrooms = maxBedroomsInput === ""
        ? Infinity
        : Number(maxBedroomsInput);

    // Bathroom filters
    const minBathrooms =
        Number(document.getElementById("minBathrooms")?.value) || 0;

    const maxBathroomsInput =
        document.getElementById("maxBathrooms")?.value;

    const maxBathrooms = maxBathroomsInput === ""
        ? Infinity
        : Number(maxBathroomsInput);

    // Area filters
    const minArea =
        Number(document.getElementById("minArea")?.value) || 0;

    const maxAreaInput =
        document.getElementById("maxArea")?.value;

    const maxArea = maxAreaInput === ""
        ? Infinity
        : Number(maxAreaInput);

    // Maximum property age
    const maxAgeInput =
        document.getElementById("maxAge")?.value;

    const maxAge = maxAgeInput === ""
        ? Infinity
        : Number(maxAgeInput);

    // Apply all filters
    filteredHistory = filteredHistory.filter(property => {

        const price = getRecordPrice(property);

        const city = String(property.city || "").toLowerCase();

        const locality =
            String(property.locality || "").toLowerCase();

        const area = Number(property.area) || 0;
        const bedrooms = Number(property.bedrooms) || 0;
        const bathrooms = Number(property.bathrooms) || 0;
        const age = Number(property.age) || 0;

        return (
            price >= minPrice &&
            price <= maxPrice &&
            (selectedCity === "all" ||
                city === selectedCity.toLowerCase()) &&
            locality.includes(localitySearch) &&
            bedrooms >= minBedrooms &&
            bedrooms <= maxBedrooms &&
            bathrooms >= minBathrooms &&
            bathrooms <= maxBathrooms &&
            area >= minArea &&
            area <= maxArea &&
            age <= maxAge
        );
    });

    // Sort prices
    const sortPrice =
        document.getElementById("sortPrice")?.value || "newest";

    if (sortPrice === "low-high") {
        filteredHistory.sort(
            (a, b) => getRecordPrice(a) - getRecordPrice(b)
        );
    } else if (sortPrice === "high-low") {
        filteredHistory.sort(
            (a, b) => getRecordPrice(b) - getRecordPrice(a)
        );
    } else {
        // Newest first
        filteredHistory.sort((a, b) => {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    }

    // Display count
    if (historyCount) {
        historyCount.textContent =
            `Showing ${filteredHistory.length} of ${history.length} properties`;
    }

    // Clear old cards
    historyList.replaceChildren();

    if (filteredHistory.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No matching properties found.";
        historyList.appendChild(message);
    } else {

        filteredHistory.forEach(property => {

            const card = document.createElement("div");
            card.className = "history-card";

            const title = document.createElement("h3");
            title.textContent =
                `${property.locality || "Unknown locality"}, ${property.city || "Unknown city"}`;

            const price = document.createElement("p");
            price.textContent =
                `Estimated Price: ₹${getRecordPrice(property).toFixed(2)} Lakhs`;

            const details = document.createElement("p");
            details.textContent =
                `Area: ${property.area} | Bedrooms: ${property.bedrooms} | Bathrooms: ${property.bathrooms}`;

            const age = document.createElement("p");
            age.textContent = `Property Age: ${property.age} years`;

            const date = document.createElement("small");

date.textContent =
    `Date: ${property.date || "Not available"}`;


// FAVORITES BUTTON

const favoriteButton = document.createElement("button");

favoriteButton.type = "button";

favoriteButton.className = "favorite-btn";

favoriteButton.textContent = "❤️ Add to Favorites";


// ACTUAL PROPERTY DETAILS

const favoriteProperty = {

    id: property.id ||
        `${property.date}-${property.city}-${property.locality}`,

    title: `${property.locality || "Property"}, ${property.city || ""}`,

    city: property.city || "N/A",

    locality: property.locality || "N/A",

    price: `${getRecordPrice(property).toFixed(2)} Lakhs`,

    area: property.area,

    bedrooms: property.bedrooms,

    bathrooms: property.bathrooms

};


// BUTTON CLICK EVENT

favoriteButton.addEventListener("click", function() {

    addToFavorites(favoriteProperty);

});


// ADD EVERYTHING TO PROPERTY CARD

card.append(
    title,
    price,
    details,
    age,
    date,
    favoriteButton
);

historyList.appendChild(card);
        });
    }

    // Update graph and dashboard
    updatePriceChart(history);
    updateDashboard(history);
}


// ==================================================
// 7. APPLY FILTER BUTTON
// ==================================================

function applyHistoryFilters() {
    console.log("APPLY BUTTON CLICKED");
    displayHistory();
}


// ==================================================
// 8. RESET FILTER BUTTON
// ==================================================

function resetHistoryFilters() {

    const filterIds = [
        "minPrice",
        "maxPrice",
        "searchLocality",
        "minBedrooms",
        "maxBedrooms",
        "minBathrooms",
        "maxBathrooms",
        "minArea",
        "maxArea",
        "maxAge"
    ];

    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = "";
        }
    });

    const cityFilter = document.getElementById("filterCity");
    if (cityFilter) {
        cityFilter.value = "all";
    }

    const sortFilter = document.getElementById("sortPrice");
    if (sortFilter) {
        sortFilter.value = "newest";
    }

    displayHistory();
}


// ==================================================
// 9. CLEAR HISTORY
// ==================================================

function clearHistory() {

    const confirmClear = confirm(
        "Are you sure you want to clear all property history?"
    );

    if (!confirmClear) {
        return;
    }

    localStorage.removeItem(HISTORY_KEY);

    displayHistory();

    console.log("Property history cleared.");
}


// ==================================================
// 10. PRICE COMPARISON GRAPH
// ==================================================

function updatePriceChart(history) {

    const canvas = document.getElementById("priceChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const cityPrices = {};

    history.forEach(property => {

        const city = property.city || "Unknown";
        const price = getRecordPrice(property);

        if (!cityPrices[city]) {
            cityPrices[city] = [];
        }

        cityPrices[city].push(price);
    });

    const labels = Object.keys(cityPrices);

    const averagePrices = labels.map(city => {

        const prices = cityPrices[city];

        return prices.reduce((sum, price) => sum + price, 0)
            / prices.length;
    });

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Average House Price (Lakhs)",
                data: averagePrices,
                backgroundColor: "#2563eb",
                borderColor: "#1d4ed8",
                borderWidth: 1
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Price in Lakhs"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "City"
                    }
                }
            }
        }
    });
}


// ==================================================
// 11. DASHBOARD STATISTICS
// ==================================================

function updateDashboard(history) {

    const prices = history
        .map(getRecordPrice)
        .filter(price => Number.isFinite(price) && price > 0);

    const total = prices.length;

    const average = total
        ? prices.reduce((sum, price) => sum + price, 0) / total
        : 0;

    const highest = total ? Math.max(...prices) : 0;
    const lowest = total ? Math.min(...prices) : 0;

    const totalElement = document.getElementById("totalHouses");
    const averageElement = document.getElementById("averagePrice");
    const highestElement = document.getElementById("highestPrice");
    const lowestElement = document.getElementById("lowestPrice");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (averageElement) {
        averageElement.textContent = `₹${average.toFixed(2)} Lakhs`;
    }

    if (highestElement) {
        highestElement.textContent = `₹${highest.toFixed(2)} Lakhs`;
    }

    if (lowestElement) {
        lowestElement.textContent = `₹${lowest.toFixed(2)} Lakhs`;
    }
}


// ==================================================
// 12. INITIALIZE FACILITY MAP
// ==================================================

function initializeFacilityMap() {

    const mapElement = document.getElementById("facilityMap");

    if (!mapElement || typeof L === "undefined") {
        console.warn("Map element or Leaflet library not found.");
        return;
    }

    if (facilityMap) {
        return;
    }

    facilityMap = L.map("facilityMap").setView(
        [17.3850, 78.4867],
        12
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(facilityMap);
}


// ==================================================
// 13. SEARCH NEARBY FACILITIES
// ==================================================


async function searchNearbyFacilities() {

    const locationInput =
        document.getElementById("facilityLocation")?.value.trim();

    const cityInput =
        document.getElementById("facilityCity")?.value.trim();

    const facilityType =
        document.getElementById("facilityType")?.value || "hospital";

    const status = document.getElementById("facilityStatus");
    const resultsList = document.getElementById("facilityResultsList");

    const location = [locationInput, cityInput]
        .filter(Boolean)
        .join(", ");

    if (!location) {
        alert("Please enter a location or city.");
        return;
    }

    if (status) {
        status.textContent = "Searching for nearby facilities...";
    }

    if (resultsList) {
        resultsList.replaceChildren();
    }

    try {

        // STEP 1: Find location coordinates
        const searchQueries = [
            location,
            `${location}, Hyderabad, Telangana, India`,
            `${location}, Telangana, India`
        ];

        let geoData = [];

        for (const searchQuery of searchQueries) {

            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(searchQuery)}`
            );

            if (!geoResponse.ok) {
                throw new Error("Location search service unavailable.");
            }

            geoData = await geoResponse.json();

            if (geoData.length > 0) {
                break;
            }
        }

        if (!geoData.length) {
            throw new Error("Location not found. Enter area and city.");
        }

        const latitude = Number(geoData[0].lat);
        const longitude = Number(geoData[0].lon);

        // STEP 2: Initialize map
        initializeFacilityMap();

        if (!facilityMap) {
            throw new Error("Map could not be initialized.");
        }

        facilityMap.setView([latitude, longitude], 13);

        // STEP 3: Clear old markers
        facilityMarkers.forEach(marker => {
            facilityMap.removeLayer(marker);
        });

        facilityMarkers = [];

        // STEP 4: Show searched location
        const searchMarker = L.marker([
            latitude,
            longitude
        ]).addTo(facilityMap);

        searchMarker.bindPopup("Searched Location");
        facilityMarkers.push(searchMarker);

        // STEP 5: Facility filters
        const facilityFilters = {
            hospital: '["amenity"="hospital"]',
            school: '["amenity"="school"]',
            college: '["amenity"="college"]',
            supermarket: '["shop"="supermarket"]',
            bank: '["amenity"="bank"]',
            pharmacy: '["amenity"="pharmacy"]'
        };

        const filter =
            facilityFilters[facilityType] ||
            facilityFilters.hospital;

        // STEP 6: Search nearby facilities
        const query = `
            [out:json][timeout:25];
            (
                node${filter}(around:5000,${latitude},${longitude});
                way${filter}(around:5000,${latitude},${longitude});
                relation${filter}(around:5000,${latitude},${longitude});
            );
            out center tags;
        `;

        const overpassResponse = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: query
            }
        );

        if (!overpassResponse.ok) {
            throw new Error("Facility search service is unavailable.");
        }

        const facilityData = await overpassResponse.json();
        const facilities = facilityData.elements || [];

        if (!facilities.length) {
            if (status) {
                status.textContent = "No nearby facilities found.";
            }
            return;
        }

        // STEP 7: Display results
        let displayedCount = 0;

        facilities.forEach((facility, index) => {

            const lat = facility.lat ?? facility.center?.lat;
            const lon = facility.lon ?? facility.center?.lon;

            if (lat === undefined || lon === undefined) {
                return;
            }

            displayedCount++;

            const name =
                facility.tags?.name || "Unnamed Facility";

            const marker = L.marker([lat, lon]).addTo(facilityMap);

            marker.bindPopup(name);
            facilityMarkers.push(marker);

            if (resultsList) {

                const item = document.createElement("div");
                item.className = "facility-result";

                const heading = document.createElement("h4");
                heading.textContent = `${displayedCount}. ${name}`;

                const address = document.createElement("p");

const street = facility.tags?.["addr:street"];
const houseNumber = facility.tags?.["addr:housenumber"];
const city = facility.tags?.["addr:city"];
const postcode = facility.tags?.["addr:postcode"];

if (street) {
    address.textContent = [
        houseNumber,
        street,
        city,
        postcode
    ].filter(Boolean).join(", ");
} else {
    address.textContent =
        `Location: ${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
}

                const viewButton = document.createElement("button");
                viewButton.type = "button";
                viewButton.textContent = "View on Map";
                viewButton.addEventListener("click", () => {

    // Move map to selected facility
    facilityMap.setView([Number(lat), Number(lon)], 17, {
        animate: true
    });

    // Make sure map displays correctly
    setTimeout(() => {
        facilityMap.invalidateSize();
        marker.openPopup();
    }, 300);

    // Scroll to map
    document.getElementById("facilityMap").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

});

                item.append(heading, address, viewButton);
                resultsList.appendChild(item);
            }
        });

        if (status) {
            status.textContent =
                `${displayedCount} nearby facilities found.`;
        }

    } catch (error) {

        console.error("Facility search error:", error);

        if (status) {
            status.textContent = error.message;
        }
    }
}


// ==================================================
// 14. CONNECT FACILITY SEARCH BUTTON
// ==================================================


function setupFacilitySearchButton() {

    const searchButton =
        document.getElementById("facilitySearchButton");

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchNearbyFacilities
        );

    } else {
        console.warn("facilitySearchButton not found.");
    }
}



// ==================================================
// 15. PAGE LOAD
// ==================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("House Price Prediction Website Loaded Successfully");

    displayHistory();

    initializeFacilityMap();

    setupFacilitySearchButton();

});

document.addEventListener("DOMContentLoaded", function () {

    const applyButton = document.querySelector(".apply-button");

    console.log("Apply button:", applyButton);

    if (applyButton) {
        applyButton.addEventListener("click", function () {
            console.log("APPLY BUTTON CLICKED");
            applyHistoryFilters();
        });
    }

});
// ============================================
// FEATURE 7: SMART PROPERTY RECOMMENDATION
// ============================================

function displayPropertyRecommendations(currentHouse) {

    try {

        // Get saved house history
        const history = getHistory();

        // Find prediction section
        const predictionSection = document.getElementById("prediction");

        if (!predictionSection) {
            console.error("Prediction section not found");
            return;
        }

        // Create recommendation section if it does not exist
        let section = document.getElementById("recommendationSection");

        if (!section) {

            section = document.createElement("div");

            section.id = "recommendationSection";
            section.className = "recommendation-section";

            section.innerHTML = `
                <h2>Smart Property Recommendations</h2>
                <p>Similar properties from your saved prediction history.</p>

                <div id="recommendationResults"
                     class="recommendation-grid">
                </div>
            `;

            const predictionContainer =
                predictionSection.querySelector(".prediction-container");

            if (predictionContainer) {
                predictionContainer.insertAdjacentElement("afterend", section);
            } else {
                predictionSection.appendChild(section);
            }
        }

        const results = document.getElementById("recommendationResults");

        if (!results) return;

        results.replaceChildren();

        // Find similar properties
        const recommendations = history
            .filter(property => {

                const sameProperty =
                    String(property.city).toLowerCase() ===
                    String(currentHouse.city).toLowerCase() &&
                    String(property.locality).toLowerCase() ===
                    String(currentHouse.locality).toLowerCase() &&
                    Number(property.area) === Number(currentHouse.area) &&
                    Number(property.bedrooms) === Number(currentHouse.bedrooms);

                return !sameProperty;

            })
            .map(property => {

                let score = 0;

                const cityMatch =
                    String(property.city).toLowerCase() ===
                    String(currentHouse.city).toLowerCase();

                const localityMatch =
                    String(property.locality).toLowerCase() ===
                    String(currentHouse.locality).toLowerCase();

                const bedroomMatch =
                    Number(property.bedrooms) === Number(currentHouse.bedrooms);

                const areaDifference = Math.abs(
                    Number(property.area) - Number(currentHouse.area)
                );

                if (cityMatch) score += 5;
                if (localityMatch) score += 3;
                if (bedroomMatch) score += 4;

                if (areaDifference <= 200) score += 3;
                else if (areaDifference <= 500) score += 2;
                else if (areaDifference <= 1000) score += 1;

                const price = Number(
                    property.price ??
                    property.predictedPrice ??
                    property.predicted_price ??
                    0
                );

                return {
                    property,
                    score,
                    price
                };

            })
            .filter(item => item.price > 0);

        // Sort by similarity score
        recommendations.sort((a, b) => b.score - a.score);

        // Display only top 3 recommendations
        const topRecommendations = recommendations.slice(0, 3);

        if (topRecommendations.length === 0) {

            results.textContent =
                "No similar properties found. Save more house predictions to get recommendations.";

            return;
        }

        topRecommendations.forEach((item, index) => {

            const property = item.property;

            const card = document.createElement("div");
            card.className = "recommendation-card";

            const heading = document.createElement("h3");
            heading.textContent = `Recommendation ${index + 1}`;

            const city = document.createElement("p");
            city.textContent = `City: ${property.city || "N/A"}`;

            const locality = document.createElement("p");
            locality.textContent = `Locality: ${property.locality || "N/A"}`;

            const area = document.createElement("p");
            area.textContent = `Area: ${property.area || "N/A"} sq.ft`;

            const bedrooms = document.createElement("p");
            bedrooms.textContent = `Bedrooms: ${property.bedrooms || "N/A"}`;

            const price = document.createElement("p");
            price.textContent = `Predicted Price: ₹${item.price} Lakhs`;

            card.append(
                heading,
                city,
                locality,
                area,
                bedrooms,
                price
            );

            results.appendChild(card);

        });

    } catch (error) {

        console.error("Recommendation error:", error);

    }
}

// =====================================
// FEATURE 8 - FAVORITE PROPERTIES
// =====================================


// GET SAVED FAVORITES

function getFavorites() {

    return JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "[]"
    );

}


// SAVE FAVORITES

function saveFavorites(favorites) {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );

}


// ADD PROPERTY TO FAVORITES

function addToFavorites(property) {

    let favorites = getFavorites();

    const exists = favorites.some(
        item => item.id === property.id
    );

    if (exists) {

        alert("Property already added to Favorites!");

        return;

    }

    favorites.push(property);

    saveFavorites(favorites);

    displayFavorites();

    alert("Property added to Favorites ❤️");

}


// REMOVE PROPERTY FROM FAVORITES

function removeFavorite(propertyId) {

    let favorites = getFavorites();

    favorites = favorites.filter(
        item => item.id !== propertyId
    );

    saveFavorites(favorites);

    displayFavorites();

}


// DISPLAY FAVORITES

function displayFavorites() {

    const container = document.getElementById(
        "favorites-container"
    );

    if (!container) return;

    const favorites = getFavorites();

    container.innerHTML = "";

    if (favorites.length === 0) {

        container.innerHTML = `
            <div class="no-favorites">
                ❤️ No Favorite Properties Yet!
                <p>Add properties you like.</p>
            </div>
        `;

        return;

    }

    favorites.forEach(property => {

        const card = document.createElement("div");

        card.className = "favorite-card";

        const details = document.createElement("div");

        details.className = "favorite-details";

        const title = document.createElement("h3");
        title.textContent = property.title || "Property";

        const city = document.createElement("p");
        city.textContent = "City: " + (property.city || "N/A");

        const price = document.createElement("p");
        price.textContent = "Price: " + (property.price || "N/A");

        details.append(title, city, price);

        const actions = document.createElement("div");

        actions.className = "favorite-actions";

        const removeButton = document.createElement("button");

        removeButton.className = "remove-favorite-btn";

        removeButton.textContent = "❌ Remove";

        removeButton.addEventListener("click", () => {

            removeFavorite(property.id);

        });

        actions.appendChild(removeButton);

        card.append(details, actions);

        container.appendChild(card);

    });

}


// LOAD FAVORITES WHEN PAGE OPENS

document.addEventListener(
    "DOMContentLoaded",
    displayFavorites
);


// ================================================
// FEATURE 9: HOUSE PRICE TREND ANALYSIS
// ================================================

// Store Feature 9 charts separately
let houseTrendCharts = {};


// Convert saved date into a valid Date object
function getTrendDate(property) {

    const date = new Date(property.date);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}


// Format price for display
function formatTrendPrice(price) {

    return "₹" + Number(price).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


// Group properties and calculate average prices
function calculateTrendGroups(properties, getKey) {

    const groups = {};

    properties.forEach(property => {

        const price = Number(getRecordPrice(property));
        const date = getTrendDate(property);

        if (!date || !Number.isFinite(price) || price <= 0) {
            return;
        }

        const key = getKey(property, date);

        if (!groups[key]) {
            groups[key] = {
                total: 0,
                count: 0
            };
        }

        groups[key].total += price;
        groups[key].count++;
    });

    return Object.keys(groups).sort().map(key => ({
        label: key,
        average: groups[key].total / groups[key].count
    }));
}


// Create or update a chart
function createHouseTrendChart(canvasId, type, labels, data, label) {

    const canvas = document.getElementById(canvasId);

    if (!canvas) return;

    if (houseTrendCharts[canvasId]) {
        houseTrendCharts[canvasId].destroy();
    }

    houseTrendCharts[canvasId] = new Chart(canvas, {

        type: type,

        data: {
            labels: labels,

            datasets: [{
                label: label,
                data: data,

                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.15)",

                borderWidth: 3,
                tension: 0.3,
                fill: type === "line",
                pointRadius: 4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return "₹" + value.toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}


// Main Feature 9 function
function displayHousePriceTrends() {

    const history = getHistory();

    const message = document.getElementById("trendMessage");

    if (!history || history.length === 0) {

        message.textContent =
            "No prediction history available. Please predict house prices first.";

        return;
    }


    // --------------------------------
    // 1. Prepare valid records
    // --------------------------------

    const properties = history.filter(property => {

        const price = Number(getRecordPrice(property));

        return (
            getTrendDate(property) !== null &&
            Number.isFinite(price) &&
            price > 0
        );
    });


    if (properties.length === 0) {

        message.textContent =
            "No valid price and date records found.";

        return;
    }


    // --------------------------------
    // 2. Highest and Lowest Price
    // --------------------------------

    const prices = properties.map(property =>
        Number(getRecordPrice(property))
    );

    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);

    document.getElementById("highestTrendPrice").textContent =
        formatTrendPrice(highest);

    document.getElementById("lowestTrendPrice").textContent =
        formatTrendPrice(lowest);


    // --------------------------------
    // 3. Monthly Price Trends
    // --------------------------------

    const monthlyData = calculateTrendGroups(
        properties,

        (property, date) =>
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0")
    );

    createHouseTrendChart(
        "monthlyTrendChart",
        "line",
        monthlyData.map(item => item.label),
        monthlyData.map(item => item.average),
        "Monthly Average House Price"
    );


    // --------------------------------
    // 4. Yearly Price Trends
    // --------------------------------

    const yearlyData = calculateTrendGroups(
        properties,

        (property, date) =>
            String(date.getFullYear())
    );

    createHouseTrendChart(
        "yearlyTrendChart",
        "bar",
        yearlyData.map(item => item.label),
        yearlyData.map(item => item.average),
        "Yearly Average House Price"
    );


    // --------------------------------
    // 5. City-wise Price Trends
    // --------------------------------

    const cityGroups = {};

    properties.forEach(property => {

        const city = (property.city || "Unknown").trim();

        const price = Number(getRecordPrice(property));

        if (!cityGroups[city]) {
            cityGroups[city] = {
                total: 0,
                count: 0
            };
        }

        cityGroups[city].total += price;
        cityGroups[city].count++;
    });


    const cityData = Object.keys(cityGroups).sort().map(city => ({
        city: city,
        average:
            cityGroups[city].total /
            cityGroups[city].count
    }));


    createHouseTrendChart(
        "cityTrendChart",
        "bar",
        cityData.map(item => item.city),
        cityData.map(item => item.average),
        "City-wise Average House Price"
    );


    // --------------------------------
    // 6. Increase and Decrease Percentage
    // --------------------------------

    let increase = 0;
    let decrease = 0;

    if (monthlyData.length >= 2) {

        const firstPrice = monthlyData[0].average;

        const lastPrice =
            monthlyData[monthlyData.length - 1].average;

        const percentage =
            ((lastPrice - firstPrice) / firstPrice) * 100;

        if (percentage > 0) {
            increase = percentage;
        } else if (percentage < 0) {
            decrease = Math.abs(percentage);
        }
    }


    document.getElementById("priceIncreasePercent").textContent =
        increase.toFixed(2) + "%";

    document.getElementById("priceDecreasePercent").textContent =
        decrease.toFixed(2) + "%";


    // --------------------------------
    // 7. Overall Trend Graph
    // --------------------------------

    createHouseTrendChart(
        "overallTrendChart",
        "line",
        monthlyData.map(item => item.label),
        monthlyData.map(item => item.average),
        "Overall House Price Trend"
    );


    // --------------------------------
    // Final Message
    // --------------------------------

    if (monthlyData.length < 2) {

        message.textContent =
            "Add predictions from different months to calculate price increase and decrease trends.";

    } else {

        const firstPrice = monthlyData[0].average;
        const lastPrice = monthlyData[monthlyData.length - 1].average;

        if (lastPrice > firstPrice) {

            message.textContent =
                "Overall trend: House prices have increased in your saved prediction history.";

        } else if (lastPrice < firstPrice) {

            message.textContent =
                "Overall trend: House prices have decreased in your saved prediction history.";

        } else {

            message.textContent =
                "Overall trend: House prices remained the same in your saved prediction history.";
        }
    }
}


// Load Feature 9 when the page opens
document.addEventListener("DOMContentLoaded", function() {

    displayHousePriceTrends();

});


// ================================================
// FEATURE 10: SMART PROPERTY COMPARISON
// ================================================


// Display saved properties for comparison
function displayComparisonProperties() {

    const history = getHistory();

    const container =
        document.getElementById("comparisonPropertyList");

    const result =
        document.getElementById("comparisonResult");

    if (!container) return;

    container.innerHTML = "";
    result.innerHTML = "";

    if (!history || history.length === 0) {

        container.textContent =
            "No saved properties available. Predict a house price first.";

        return;
    }

    history.forEach((property, index) => {

        const card = document.createElement("div");

        card.className = "comparison-property-card";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "compare-property-checkbox";
        checkbox.value = index;

        const label = document.createElement("label");

        label.appendChild(checkbox);

        const title = document.createElement("span");

        title.textContent =
            `${property.locality || "Property"}, ${property.city || "Unknown City"}`;

        label.appendChild(title);

        const price = document.createElement("p");

        price.textContent =
            "Price: " + Number(getRecordPrice(property)).toLocaleString("en-IN") + " Lakhs";

        const area = document.createElement("p");

        area.textContent =
            "Area: " + (property.area || "N/A");

        const bedrooms = document.createElement("p");

        bedrooms.textContent =
            "Bedrooms: " + (property.bedrooms || "N/A");

        const bathrooms = document.createElement("p");

        bathrooms.textContent =
            "Bathrooms: " + (property.bathrooms || "N/A");

        card.append(
            label,
            price,
            area,
            bedrooms,
            bathrooms
        );

        container.appendChild(card);
    });
}


// Compare selected properties
function compareSelectedProperties() {

    const history = getHistory();

    const result =
        document.getElementById("comparisonResult");

    const selectedCheckboxes =
        document.querySelectorAll(
            ".compare-property-checkbox:checked"
        );

    const selectedProperties = [];

    selectedCheckboxes.forEach(checkbox => {

        const index = Number(checkbox.value);

        if (history[index]) {
            selectedProperties.push(history[index]);
        }
    });


    // Check selection count
    if (selectedProperties.length < 2) {

        result.innerHTML = "";

        const message = document.createElement("p");

        message.className = "comparison-message";

        message.textContent =
            "Please select at least 2 properties to compare.";

        result.appendChild(message);

        return;
    }


    // Find lowest price
    const prices = selectedProperties.map(property =>
        Number(getRecordPrice(property))
    );

    const lowestPrice = Math.min(...prices);


    // Create comparison table
    const table = document.createElement("table");

    table.className = "comparison-table";

    const thead = document.createElement("thead");

    const headerRow = document.createElement("tr");

    const firstHeading = document.createElement("th");

    firstHeading.textContent = "Property Details";

    headerRow.appendChild(firstHeading);


    selectedProperties.forEach((property, index) => {

        const heading = document.createElement("th");

        heading.textContent =
            property.locality || `Property ${index + 1}`;

        headerRow.appendChild(heading);
    });

    thead.appendChild(headerRow);

    table.appendChild(thead);


    // Table rows
    const tbody = document.createElement("tbody");


    const comparisonRows = [

        {
            label: "City",
            value: property => property.city || "N/A"
        },

        {
            label: "Locality",
            value: property => property.locality || "N/A"
        },

        {
            label: "Price",
            value: property =>
                Number(getRecordPrice(property)).toLocaleString("en-IN") + " Lakhs"
        },

        {
            label: "Area",
            value: property => property.area || "N/A"
        },

        {
            label: "Bedrooms",
            value: property => property.bedrooms || "N/A"
        },

        {
            label: "Bathrooms",
            value: property => property.bathrooms || "N/A"
        },

        {
            label: "Date",
            value: property => property.date || "N/A"
        }
    ];


    comparisonRows.forEach(row => {

        const tr = document.createElement("tr");

        const heading = document.createElement("th");

        heading.textContent = row.label;

        tr.appendChild(heading);


        selectedProperties.forEach(property => {

            const td = document.createElement("td");

            td.textContent = row.value(property);

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });


    table.appendChild(tbody);

    result.innerHTML = "";

    result.appendChild(table);


    // Lowest price information
    const lowestMessage = document.createElement("p");

    lowestMessage.className = "trend-message";

    lowestMessage.textContent =
        "Lowest listed price among selected properties: " +
        lowestPrice.toLocaleString("en-IN") +
        " Lakhs";

    result.appendChild(lowestMessage);
}


// Button click event
document.addEventListener("DOMContentLoaded", function() {

    displayComparisonProperties();

    const compareButton =
        document.getElementById("comparePropertiesBtn");

    if (compareButton) {

        compareButton.addEventListener(
            "click",
            compareSelectedProperties
        );
    }

});


// ================================================
// FEATURE 11: HOME LOAN EMI CALCULATOR
// ================================================

function calculateHomeLoanEMI() {

    // Get input values
    const loanAmountLakhs =
        Number(document.getElementById("loanAmount").value);

    const annualInterestRate =
        Number(document.getElementById("interestRate").value);

    const loanYears =
        Number(document.getElementById("loanDuration").value);

    const error = document.getElementById("emiError");


    // Validate inputs
    if (
        !Number.isFinite(loanAmountLakhs) ||
        !Number.isFinite(annualInterestRate) ||
        !Number.isFinite(loanYears) ||
        loanAmountLakhs <= 0 ||
        annualInterestRate < 0 ||
        loanYears <= 0 ||
        !Number.isInteger(loanYears)
    ) {

        error.textContent =
            "Please enter valid loan amount, interest rate and duration.";

        return;
    }


    // Convert Lakhs into Rupees
    const principal = loanAmountLakhs * 100000;

    // Convert annual interest into monthly interest
    const monthlyRate =
        annualInterestRate / 12 / 100;

    // Convert years into months
    const months = loanYears * 12;


    // Calculate monthly EMI
    let emi;

    if (monthlyRate === 0) {

        emi = principal / months;

    } else {

        const power = Math.pow(1 + monthlyRate, months);

        emi =
            principal *
            monthlyRate *
            power /
            (power - 1);
    }


    // Calculate total payment and interest
    const totalPayment = emi * months;

    const totalInterest = totalPayment - principal;


    // Display results
    document.getElementById("monthlyEMI").textContent =
        formatEMIAmount(emi);

    document.getElementById("totalInterest").textContent =
        formatEMIAmount(totalInterest);

    document.getElementById("totalPayment").textContent =
        formatEMIAmount(totalPayment);


    // Display summary
    document.getElementById("emiSummary").textContent =
        "For a loan of " +
        formatEMIAmount(principal) +
        " over " + loanYears +
        " years at " + annualInterestRate +
        "% annual interest, your estimated monthly EMI is " +
        formatEMIAmount(emi) + ".";

    error.textContent = "";
}


// Format Indian currency
function formatEMIAmount(amount) {

    return "₹" + amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


// Reset calculator
function resetHomeLoanEMI() {

    document.getElementById("loanAmount").value = "";

    document.getElementById("interestRate").value = "";

    document.getElementById("loanDuration").value = "";

    document.getElementById("monthlyEMI").textContent = "₹0";

    document.getElementById("totalInterest").textContent = "₹0";

    document.getElementById("totalPayment").textContent = "₹0";

    document.getElementById("emiSummary").textContent =
        "Enter loan details to calculate your EMI.";

    document.getElementById("emiError").textContent = "";
}


// Button events
document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("calculateEMIButton")
        .addEventListener("click", calculateHomeLoanEMI);

    document.getElementById("resetEMIButton")
        .addEventListener("click", resetHomeLoanEMI);

});

// ==========================================
// USER LOGIN AND LOGOUT
// ==========================================

async function checkLoginStatus() {

    try {

        const response = await fetch("/auth-status");
        const data = await response.json();

        const loginLink = document.getElementById("loginLink");
        const signupLink = document.getElementById("signupLink");
        const logoutButton = document.getElementById("logoutButton");

        if (data.logged_in) {

            loginLink.style.display = "none";
            signupLink.style.display = "none";
            logoutButton.style.display = "inline-block";

        } else {

            loginLink.style.display = "inline-block";
            signupLink.style.display = "inline-block";
            logoutButton.style.display = "none";

            window.location.href = "/";

        }

    } catch (error) {

        console.error("Login status error:", error);

    }
}


// LOGOUT FUNCTION

async function logoutUser() {

    try {

        const response = await fetch("/logout", {
            method: "POST"
        });

        if (response.ok) {

            alert("Logged out successfully!");

            window.location.href = "/";

        }

    } catch (error) {

        console.error("Logout error:", error);

        alert("Logout failed. Please try again.");

    }

}


// CHECK LOGIN WHEN DASHBOARD OPENS

document.addEventListener("DOMContentLoaded", checkLoginStatus);