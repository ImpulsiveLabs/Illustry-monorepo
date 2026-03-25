---
title: Calendrier
description: Document de calendrier
---

La visualisation **Calendrier** est une représentation unique conçue pour fournir des informations sur les relations temporelles au sein d'un ensemble de données. Il offre une approche distinctive pour visualiser des événements, des occurrences ou des entités au fil du temps.

## Structure des données du calendrier

Pour représenter un calendrier, vous pouvez utiliser l'interface `CalendarData` suivante :

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Attributs clés

- **date :** Une date unique d'une année spécifique.
- **valeur :** Quelle a été l'impact de cette date sur l'événement.
- **category :** Classifie les dates dans des événements spécifiques.


### Avantages et inconvénients

#### Avantages
- **Visualisation des relations :** La visualisation du calendrier offre un moyen intuitif et convivial d'explorer les relations temporelles, permettant ainsi aux utilisateurs de comprendre facilement les modèles au fil du temps.

- **Représentation compacte :** Un calendrier optimise l'espace en présentant les événements dans un format compact, permettant aux utilisateurs de visualiser une quantité importante de données temporelles sans surcharger les visuels.

- **Plusieurs années :** Si les événements se produisent sur une période de plusieurs années, davantage de visualisations de calendrier seront affichées.

#### Inconvénients
- **Complexité avec les graphiques denses :** En raison de sa nature compacte, un calendrier peut offrir un espace limité pour détailler chaque événement. Dans les scénarios nécessitant des informations détaillées, des interactions supplémentaires ou des vues supplémentaires peuvent être nécessaires.

- **Pas idéal pour les chevauchements d'événements denses :** Dans les cas où plusieurs événements se chevauchent étroitement dans le temps, la visualisation peut avoir du mal à maintenir la clarté et à éviter l'encombrement visuel lié au chevauchement.

## Exemple de calendrier

![Calendar Example](/Illustry-monorepo/calendar.gif)
