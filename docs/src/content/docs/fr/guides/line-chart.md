---
title: Graphique en lignes
description: Document Graphique en courbes
---

La visualisation **Line Chart** est un outil polyvalent permettant de représenter les tendances et les modèles de données numériques au fil du temps. Il est largement utilisé pour visualiser la relation entre deux variables continues et mettre en évidence des tendances ou des fluctuations.

## Structure des données du graphique linéaire

Pour représenter un graphique linéaire, vous pouvez utiliser l'interface `AxisChartData` suivante :

```typescript
{{AxisChartData}}
```
### Attributs clés

- **en-têtes :** un tableau de chaînes représentant les catégories ou les dimensions le long de l'un des axes.
- **valeurs :** Un dictionnaire dans lequel chaque clé est une catégorie ou une dimension et la valeur correspondante est un tableau de valeurs numériques le long de l'autre axe.


### Avantages et inconvénients

#### Avantages
- **Comparaison multidimensionnelle :** Les graphiques linéaires excellent dans la comparaison simultanée de plusieurs dimensions, offrant une vue complète des données.

- **Représentation claire des valeurs :** Les valeurs numériques sont clairement représentées le long des axes X et Y, ce qui facilite l'interprétation et la comparaison par les utilisateurs.

#### Inconvénients
- **Complexité avec des catégories excessives :** Lorsqu'il s'agit d'un grand nombre de catégories ou de dimensions, la visualisation peut devenir encombrée et difficile à interpréter.

- **Limité pour les données catégorielles :** Les graphiques linéaires sont plus efficaces pour les données numériques et peuvent ne pas constituer le choix optimal pour représenter des données catégorielles.

## Exemple de graphique linéaire

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
