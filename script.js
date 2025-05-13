// Variables globales
let stations = [];
let stationsMap = {}; // Pour conserver les identifiants originaux
let communes = []; // Pour stocker les communes
let map;
let userMarker;
let closestStationMarker;
let stationMarkers = [];
let currentFocusIndex = -1; // Indice de l'élément actuellement sélectionné dans la liste

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation de la carte
    initMap();

    // Chargement des données des stations
    try {
        await loadStations();
        console.log(`${stations.length} stations météo chargées`);
    } catch (error) {
        console.error('Erreur lors du chargement des stations:', error);
        alert('Erreur lors du chargement des données des stations météo.');
    }

    // Chargement des données des communes
    try {
        await loadCommunes();
        console.log(`${communes.length} communes chargées`);
    } catch (error) {
        console.error('Erreur lors du chargement des communes:', error);
        alert('Erreur lors du chargement des données des communes.');
    }

    // Gestionnaires d'événements
    document.getElementById('coordsForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('useLocation').addEventListener('click', handleLocationRequest);
    document.getElementById('communeForm').addEventListener('submit', handleCommuneFormSubmit);

    // Gestionnaire pour la recherche de commune
    const communeSearchInput = document.getElementById('communeSearch');
    communeSearchInput.addEventListener('input', handleCommuneSearch);

    // Ajout des gestionnaires pour la navigation au clavier
    communeSearchInput.addEventListener('keydown', handleKeyNavigation);

    // Gestionnaire pour les onglets
    document.getElementById('tab-coords').addEventListener('click', () => switchTab('coords'));
    document.getElementById('tab-commune').addEventListener('click', () => switchTab('commune'));
});

// Fonction pour changer d'onglet
function switchTab(tabId) {
    // Mettre à jour les styles des onglets
    if (tabId === 'coords') {
        document.querySelector('#tab-coords a').classList.remove('bg-base-200', 'text-base-content');
        document.querySelector('#tab-coords a').classList.add('bg-primary', 'text-white');

        document.querySelector('#tab-commune a').classList.remove('bg-primary', 'text-white');
        document.querySelector('#tab-commune a').classList.add('bg-base-200', 'text-base-content');
    } else {
        document.querySelector('#tab-commune a').classList.remove('bg-base-200', 'text-base-content');
        document.querySelector('#tab-commune a').classList.add('bg-primary', 'text-white');

        document.querySelector('#tab-coords a').classList.remove('bg-primary', 'text-white');
        document.querySelector('#tab-coords a').classList.add('bg-base-200', 'text-base-content');
    }

    // Affichage du formulaire correspondant
    document.getElementById('form-coords').classList.add('hidden');
    document.getElementById('form-commune').classList.add('hidden');
    document.getElementById('form-' + tabId).classList.remove('hidden');
}

// Initialisation de la carte Leaflet
function initMap() {
    map = L.map('map').setView([46.603354, 1.888334], 5); // Centre sur la France

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
}

// Chargement des données des stations météo
async function loadStations() {
    const response = await fetch('stations-geojson.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Conversion de l'objet en tableau tout en conservant les identifiants
    for (const key in data.features) {
        if (data.features.hasOwnProperty(key)) {
            const station = data.features[key];
            station._id = key; // Stockage de l'identifiant original
            stations.push(station);
            stationsMap[key] = station; // Conservation d'une référence avec l'identifiant
        }
    }
}

// Chargement des données des communes
async function loadCommunes() {
    const response = await fetch('communes.csv');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Ignorer la première ligne (en-tête)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [nom, codePostal, latitude, longitude] = line.split(';');
            communes.push({
                nom: nom,
                codePostal: codePostal,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            });
        }
    }

    // Tri des communes par nom pour un affichage plus logique
    communes.sort((a, b) => a.nom.localeCompare(b.nom));
}

// Gestion de la navigation au clavier dans la liste des communes
function handleKeyNavigation(event) {
    const resultsContainer = document.getElementById('communeResults');
    const items = resultsContainer.getElementsByTagName('li');

    // Si la liste n'est pas visible ou vide, on ne fait rien
    if (resultsContainer.classList.contains('hidden') || items.length === 0) {
        currentFocusIndex = -1;
        return;
    }

    // Navigation avec les touches directionnelles
    if (event.key === 'ArrowDown') {
        event.preventDefault(); // Empêcher le défilement de la page
        currentFocusIndex++;
        // Bouclage à la fin de la liste
        if (currentFocusIndex >= items.length) currentFocusIndex = 0;
        setActiveCommuneItem(items);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault(); // Empêcher le défilement de la page
        currentFocusIndex--;
        // Bouclage au début de la liste
        if (currentFocusIndex < 0) currentFocusIndex = items.length - 1;
        setActiveCommuneItem(items);
    } else if (event.key === 'Enter' && currentFocusIndex >= 0) {
        event.preventDefault(); // Empêcher la soumission du formulaire
        if (currentFocusIndex < items.length) {
            items[currentFocusIndex].click(); // Simuler un clic sur l'élément sélectionné
        }
    } else if (event.key === 'Escape') {
        // Fermer la liste si Escape est pressé
        resultsContainer.classList.add('hidden');
        currentFocusIndex = -1;
    }
}

// Fonction pour définir l'élément actif dans la liste
function setActiveCommuneItem(items) {
    // Supprimer la classe 'active' de tous les éléments
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
    }

    // Ajouter la classe 'active' à l'élément sélectionné
    if (currentFocusIndex >= 0 && currentFocusIndex < items.length) {
        items[currentFocusIndex].classList.add('active');

        // Faire défiler la liste pour que l'élément actif soit visible
        const container = document.getElementById('communeResults');
        const activeItem = items[currentFocusIndex];

        // Calculer la position de l'élément par rapport au conteneur
        const containerRect = container.getBoundingClientRect();
        const activeItemRect = activeItem.getBoundingClientRect();

        // Vérifier si l'élément est en dehors de la zone visible
        if (activeItemRect.top < containerRect.top || activeItemRect.bottom > containerRect.bottom) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }
}

// Gestion de la recherche de commune
function handleCommuneSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();
    const resultsContainer = document.getElementById('communeResults');
    const submitButton = document.getElementById('communeSubmitBtn');

    // Réinitialiser l'index actif
    currentFocusIndex = -1;

    // Vider le champ caché et désactiver le bouton
    document.getElementById('selectedCommune').value = '';
    submitButton.disabled = true;

    // Si la recherche est vide, masquer les résultats
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('hidden');
        return;
    }

    // Filtrer les communes correspondant à la recherche
    const filteredCommunes = communes.filter(commune => {
        // Recherche par nom de commune
        const nameMatch = commune.nom.toLowerCase().includes(searchTerm);
        // Recherche par code postal
        const postalMatch = commune.codePostal && commune.codePostal.toString().includes(searchTerm);

        return nameMatch || postalMatch;
    }).slice(0, 10); // Limiter à 10 résultats pour ne pas surcharger

    // Afficher les résultats
    resultsContainer.innerHTML = '';

    if (filteredCommunes.length === 0) {
        const noResultItem = document.createElement('li');
        noResultItem.textContent = 'Aucune commune trouvée';
        noResultItem.classList.add('text-gray-500', 'text-center', 'py-2');
        resultsContainer.appendChild(noResultItem);
    } else {
        filteredCommunes.forEach((commune, index) => {
            const item = document.createElement('li');
            item.setAttribute('data-index', index);
            item.innerHTML = `
                <div class="commune-item">
                    <span class="commune-name">${commune.nom}</span>
                    <span class="commune-postal">${commune.codePostal}</span>
                </div>
            `;

            // Ajouter un événement au clic
            item.addEventListener('click', () => {
                // Mettre à jour l'input avec le nom de la commune
                document.getElementById('communeSearch').value = `${commune.nom} (${commune.codePostal})`;

                // Stocker les coordonnées dans un champ caché
                document.getElementById('selectedCommune').value = JSON.stringify({
                    nom: commune.nom,
                    codePostal: commune.codePostal,
                    latitude: commune.latitude,
                    longitude: commune.longitude
                });

                // Activer le bouton de recherche (pour la cohérence visuelle)
                submitButton.disabled = false;

                // Masquer les résultats
                resultsContainer.classList.add('hidden');

                // Lancer immédiatement la recherche de station
                findClosestStation(
                    commune.latitude,
                    commune.longitude,
                    `${commune.nom} (${commune.codePostal})`
                );
            });

            resultsContainer.appendChild(item);
        });
    }

    // Afficher les résultats
    resultsContainer.classList.remove('hidden');
}

// Gestion de la soumission du formulaire de commune
function handleCommuneFormSubmit(event) {
    event.preventDefault();

    const selectedCommuneJson = document.getElementById('selectedCommune').value;

    if (!selectedCommuneJson) {
        alert('Veuillez sélectionner une commune dans la liste.');
        return;
    }

    const selectedCommune = JSON.parse(selectedCommuneJson);

    // Rechercher la station la plus proche
    findClosestStation(
        selectedCommune.latitude,
        selectedCommune.longitude,
        `${selectedCommune.nom} (${selectedCommune.codePostal})`
    );
}

// Gestion de la soumission du formulaire
function handleFormSubmit(event) {
    event.preventDefault();

    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);

    if (isNaN(latitude) || isNaN(longitude)) {
        alert('Veuillez entrer des coordonnées valides.');
        return;
    }

    findClosestStation(latitude, longitude);
}

// Gestion de la demande de géolocalisation
function handleLocationRequest() {
    if (!navigator.geolocation) {
        alert('La géolocalisation n\'est pas supportée par votre navigateur.');
        return;
    }

    // Affichage de l'indicateur de chargement
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('noResult').classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude;
            document.getElementById('longitude').value = position.coords.longitude;

            findClosestStation(position.coords.latitude, position.coords.longitude, 'Votre position');
        },
        (error) => {
            document.getElementById('loadingIndicator').classList.add('hidden');
            console.error('Erreur de géolocalisation:', error);

            let message;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Vous avez refusé la demande de géolocalisation.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Information de localisation non disponible.';
                    break;
                case error.TIMEOUT:
                    message = 'La demande de localisation a expiré.';
                    break;
                default:
                    message = 'Une erreur inconnue est survenue.';
            }

            alert(`Erreur de géolocalisation: ${message}`);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Calcul de la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en kilomètres

    return distance;
}

// Conversion degrés en radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Recherche de la station la plus proche
function findClosestStation(latitude, longitude, positionLabel = 'Position sélectionnée') {
    // Affichage de l'indicateur de chargement
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('noResult').classList.add('hidden');

    // Nettoyage des marqueurs précédents
    clearAllMarkers();

    // Ajout du marqueur de l'utilisateur
    userMarker = L.marker([latitude, longitude], {
        icon: L.divIcon({
            className: 'bg-blue-500 w-4 h-4 rounded-full border-2 border-white',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    userMarker.bindPopup(positionLabel).openPopup();

    // Recherche de la station la plus proche
    let closestStation = null;
    let minDistance = Infinity;

    for (const station of stations) {
        if (station.geometry && station.geometry.coordinates && station.geometry.coordinates.length >= 2) {
            const stationLon = station.geometry.coordinates[0];
            const stationLat = station.geometry.coordinates[1];

            const distance = calculateDistance(latitude, longitude, stationLat, stationLon);

            if (distance < minDistance) {
                minDistance = distance;
                closestStation = station;
            }
        }
    }

    document.getElementById('loadingIndicator').classList.add('hidden');

    if (closestStation) {
        displayStationResult(closestStation, minDistance);
        addStationMarkers(closestStation, latitude, longitude);

        // Ajustement de la vue de la carte
        const bounds = L.latLngBounds(
            [latitude, longitude],
            [closestStation.geometry.coordinates[1], closestStation.geometry.coordinates[0]]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        document.getElementById('noResult').classList.remove('hidden');
    }
}

// Affichage du résultat
function displayStationResult(station, distance) {
    const result = document.getElementById('result');

    document.getElementById('stationName').textContent = station.properties.NOM_USUEL || 'Non spécifié';
    document.getElementById('stationCommune').textContent = station.properties.COMMUNE || 'Non spécifié';
    document.getElementById('stationAltitude').textContent = station.properties.ALTI || 'Non spécifié';
    document.getElementById('stationLat').textContent = station.geometry.coordinates[1].toFixed(6);
    document.getElementById('stationLon').textContent = station.geometry.coordinates[0].toFixed(6);
    document.getElementById('stationDistance').textContent = distance.toFixed(2);

    // Affichage du numéro de poste et du département
    document.getElementById('stationNumPoste').textContent = station.properties.NUM_POSTE || 'Non spécifié';
    document.getElementById('stationDepartement').textContent = station.properties.NUM_DEP || 'Non spécifié';

    // Affichage de l'identifiant (index)
    document.getElementById('stationId').textContent = station._id || 'Non spécifié';

    result.classList.remove('hidden');
    result.classList.add('highlight-result');

    // Retirer l'animation après un délai
    setTimeout(() => {
        result.classList.remove('highlight-result');
    }, 2000);
}

// Ajout des marqueurs des stations sur la carte
function addStationMarkers(closestStation, userLat, userLon) {
    // Marqueur pour la station la plus proche
    const stationLat = closestStation.geometry.coordinates[1];
    const stationLon = closestStation.geometry.coordinates[0];

    closestStationMarker = L.marker([stationLat, stationLon], {
        icon: L.divIcon({
            className: 'bg-red-500 w-4 h-4 rounded-full closest-station-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);

    const popupContent = `
        <div class="station-popup">
            <div class="station-name">${closestStation.properties.NOM_USUEL || 'Station'}</div>
            <div class="station-details">
                <span>ID:</span>
                <span>${closestStation._id || 'Non spécifié'}</span>
                <span>Commune:</span>
                <span>${closestStation.properties.COMMUNE || 'Non spécifié'}</span>
                <span>Altitude:</span>
                <span>${closestStation.properties.ALTI || 'Non spécifié'} m</span>
                <span>Numéro:</span>
                <span>${closestStation.properties.NUM_POSTE || 'Non spécifié'}</span>
                <span>Département:</span>
                <span>${closestStation.properties.NUM_DEP || 'Non spécifié'}</span>
                <span>Distance:</span>
                <span>${calculateDistance(userLat, userLon, stationLat, stationLon).toFixed(2)} km</span>
            </div>
        </div>
    `;

    closestStationMarker.bindPopup(popupContent);

    // Ligne entre l'utilisateur et la station la plus proche
    L.polyline([
        [userLat, userLon],
        [stationLat, stationLon]
    ], {
        color: '#ef4444',
        dashArray: '5, 5',
        weight: 2
    }).addTo(map);

    // Ajouter d'autres stations proches si nécessaire
    addNearbyStations(userLat, userLon, closestStation);
}

// Ajout des stations proches sur la carte
function addNearbyStations(userLat, userLon, closestStation) {
    // Calcul des distances et tri
    const stationsWithDistance = stations.map(station => {
        if (station.geometry && station.geometry.coordinates && station.geometry.coordinates.length >= 2) {
            const stationLat = station.geometry.coordinates[1];
            const stationLon = station.geometry.coordinates[0];
            const distance = calculateDistance(userLat, userLon, stationLat, stationLon);
            return { station, distance };
        }
        return null;
    }).filter(item => item !== null);

    // Tri par distance
    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    // Afficher les 5 stations les plus proches (en excluant la plus proche déjà affichée)
    const nearbyStations = stationsWithDistance.slice(1, 6);

    nearbyStations.forEach(({ station, distance }) => {
        const stationLat = station.geometry.coordinates[1];
        const stationLon = station.geometry.coordinates[0];

        const marker = L.marker([stationLat, stationLon], {
            icon: L.divIcon({
                className: 'bg-blue-500 w-3 h-3 rounded-full station-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);

        const popupContent = `
            <div class="station-popup">
                <div class="station-name">${station.properties.NOM_USUEL || 'Station'}</div>
                <div class="station-details">
                    <span>ID:</span>
                    <span>${station._id || 'Non spécifié'}</span>
                    <span>Commune:</span>
                    <span>${station.properties.COMMUNE || 'Non spécifié'}</span>
                    <span>Altitude:</span>
                    <span>${station.properties.ALTI || 'Non spécifié'} m</span>
                    <span>Numéro:</span>
                    <span>${station.properties.NUM_POSTE || 'Non spécifié'}</span>
                    <span>Département:</span>
                    <span>${station.properties.NUM_DEP || 'Non spécifié'}</span>
                    <span>Distance:</span>
                    <span>${distance.toFixed(2)} km</span>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        stationMarkers.push(marker);
    });
}

// Supprime tous les marqueurs de la carte
function clearAllMarkers() {
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    if (closestStationMarker) {
        map.removeLayer(closestStationMarker);
    }

    // Supprimer tous les marqueurs de stations
    stationMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    stationMarkers = [];

    // Supprimer toutes les polylines (lignes entre points)
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            map.removeLayer(layer);
        }
    });
} 