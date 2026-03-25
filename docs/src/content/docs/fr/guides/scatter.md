---
title: Nuage de points
description: Document dispersé
---

La visualisation **Scatter Plot** est un outil puissant pour visualiser les relations entre deux variables numériques. Il utilise des points sur un plan cartésien pour représenter des points de données individuels, ce qui facilite l'identification de modèles, de corrélations et de valeurs aberrantes.


## Structure des données du nuage de points

Pour représenter un nuage de points, vous pouvez utiliser l'interface `ScatterData` suivante :

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Attributs clés

- **valeur :** un tableau de deux valeurs numériques [x, y], représentant les coordonnées d'un point de données sur les axes X et Y.
- **values :** Une chaîne indiquant la catégorie ou le groupe auquel appartient le point de données.


### Avantages et inconvénients

#### Avantages
- **Identification des relations :** Les nuages ​​de points excellent dans la révélation des relations, des modèles et des tendances entre deux variables numériques.

- **Détection des valeurs aberrantes :** Les valeurs aberrantes, ou les points de données qui s'écartent considérablement de la norme, sont facilement identifiés sur un nuage de points.

#### Inconvénients

- **Surtraçage potentiel :** Dans les cas où la densité de points de données est élevée, un surtraçage peut se produire, affectant la visibilité des points individuels.

## Exemple de nuage de points

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
