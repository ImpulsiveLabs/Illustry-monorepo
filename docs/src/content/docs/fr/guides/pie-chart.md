---
title: Diagramme en secteurs
description: Document Diagramme à secteurs
---

La visualisation **Camembert** est une manière concise et visuellement percutante de représenter la répartition des parties au sein d'un tout. Il est particulièrement efficace pour afficher des proportions et des pourcentages dans un format circulaire.


## Structure des données du graphique à secteurs

Pour représenter un diagramme circulaire, vous pouvez utiliser l'interface `PieChartData` suivante :

```typescript
{{PieChartData}}
```
### Attributs clés

- **valeurs :** Un dictionnaire dans lequel chaque clé est une catégorie ou une dimension et la valeur correspondante est une valeur numérique.


### Avantages et inconvénients

#### Avantages
- **Représentation en pourcentage :** Les diagrammes circulaires fournissent une représentation claire de la contribution en pourcentage de chaque catégorie à l'ensemble.

- **Simplicité visuelle :** La forme circulaire et la simplicité des diagrammes circulaires les rendent faciles à comprendre par les utilisateurs en un coup d'œil.

#### Inconvénients
- **Limité pour de nombreuses catégories :** Lorsqu'il s'agit de nombreuses catégories, les diagrammes circulaires peuvent devenir encombrés et difficiles à interpréter.


## Exemple de graphique à secteurs

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
