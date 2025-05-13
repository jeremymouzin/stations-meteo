# Recherche de Station Météo

Application web permettant de trouver la station météorologique la plus proche d'un point géographique donné.

## Fonctionnalités

- Saisie manuelle des coordonnées (latitude/longitude)
- Utilisation de la géolocalisation du navigateur
- Affichage de la station météo la plus proche
- Affichage sur une carte interactive
- Visualisation des stations environnantes
- Calcul de la distance entre votre position et la station

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Styles** : TailwindCSS et DaisyUI
- **Cartographie** : Leaflet
- **Données** : Fichier GeoJSON des stations météorologiques

## Comment utiliser

1. Ouvrez l'application dans un navigateur web moderne
2. Entrez des coordonnées manuellement (latitude et longitude) ou utilisez le bouton "Utiliser ma position actuelle"
3. Cliquez sur "Rechercher"
4. Visualisez les informations de la station la plus proche et la carte

## Structure du projet

- `index.html` - Structure HTML principale
- `style.css` - Styles CSS supplémentaires
- `script.js` - Logique JavaScript 
- `stations-geojson.json` - Données des stations météorologiques

## Calcul de distance

L'application utilise la formule de Haversine pour calculer la distance entre deux points géographiques, en prenant en compte la courbure de la Terre.

## Démarrage rapide

1. Clonez ce dépôt
2. Ouvrez `index.html` dans votre navigateur

Aucune installation spécifique n'est requise car l'application utilise des CDN pour charger les bibliothèques externes.

## Licence

Libre d'utilisation. 