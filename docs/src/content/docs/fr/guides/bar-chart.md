---
title: Graphique en barres
description: Document Graphique à barres
---

La visualisation **Bar Chart** est un outil polyvalent et efficace pour représenter les données catégorielles de manière visuellement attrayante. Il utilise des barres horizontales ou verticales pour afficher les valeurs des différentes catégories, permettant ainsi aux utilisateurs de comparer et de comprendre facilement les distributions de données.

## Structure des données du graphique à barres

Pour représenter un graphique à barres, vous pouvez utiliser l'interface `AxisChartData` suivante :

```typescript
{{AxisChartData}}
```
### Attributs clés

- **en-têtes :** un tableau de chaînes représentant les catégories ou les dimensions le long de l'un des axes.
- **valeurs :** Un dictionnaire dans lequel chaque clé est une catégorie ou une dimension et la valeur correspondante est un tableau de valeurs numériques le long de l'autre axe.


### Avantages et inconvénients

#### Avantages
- **Comparaison multidimensionnelle :** Les graphiques à barres excellent dans la comparaison simultanée de plusieurs dimensions, offrant une vue complète des données.

- **Représentation claire des valeurs :** Les valeurs numériques sont clairement représentées le long des axes X et Y, ce qui facilite l'interprétation et la comparaison par les utilisateurs.

#### Inconvénients
- **Complexité avec des catégories excessives :** Lorsqu'il s'agit d'un grand nombre de catégories ou de dimensions, la visualisation peut devenir encombrée et difficile à interpréter.

- **Limité pour les données catégorielles :** Les graphiques à barres sont plus efficaces pour les données numériques et peuvent ne pas constituer le choix optimal pour représenter des données catégorielles.

## Exemple de graphique à barres

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
