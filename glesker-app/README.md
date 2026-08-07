# Glesker App - Météo Bretagne

Une application Angular en TypeScript qui affiche les prévisions météo pour les principales villes de Bretagne.

## Fonctionnalités

- Affichage de la météo en temps réel pour 8 villes bretonnes
- Température actuelle, description météo, vitesse et direction du vent
- Prévisions quotidiennes (température max/min)
- Icônes météo basées sur les codes de l'API
- Design responsive adapté mobile/tablette/desktop
- Rafraîchissement manuel des données

## Villes couvertes

- Rennes
- Brest
- Quimper
- Lorient
- Vannes
- Saint-Brieuc
- Saint-Malo
- Fougères

## Technologie utilisée

- **Angular 22+** avec architecture standalone components
- **TypeScript** pour la typage forte
- **HttpClient** pour les requêtes API
- **RxJS** (forkJoin) pour gérer les requêtes multiples
- **Open-Meteo API** (gratuite, sans clé API)

## Installation

```bash
cd glesker-app
npm install
npm start
```

## Exécution

L'application sera disponible sur http://localhost:4200

## API utilisée

L'application utilise [Open-Meteo API](https://open-meteo.com/) - gratuite, sans clé API.

## Personnalisation

Modifiez `src/app/weather/weather.service.ts` pour ajouter/supprimer des villes ou changer l'API.

## Compatibilité

Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge) et mobile.
