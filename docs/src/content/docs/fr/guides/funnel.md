---
title: Entonnoir
description: Document sur l'entonnoir
---

La visualisation **Funnel** est un outil puissant pour suivre la progression et les taux de conversion d'une série d'étapes d'un processus. Il fournit une représentation visuelle de la façon dont les entités évoluent à travers les différentes étapes d'un flux de travail défini.



## Structure des données de l'entonnoir

Pour représenter un entonnoir, vous pouvez utiliser l'interface `FunnelData` suivante :

```typescript
{{FunnelData}}
```
### Attributs clés

- **valeurs :** Un dictionnaire dans lequel chaque clé est une catégorie ou une dimension et la valeur correspondante est une valeur numérique.


### Avantages et inconvénients

#### Avantages
- **Mesures de performance :** Les graphiques en entonnoir sont excellents pour visualiser les mesures de performance, permettant aux équipes de suivre et d'améliorer les indicateurs clés.

- **Analyse segmentée :** Chaque étape de l'entonnoir permet une analyse segmentée, aidant à identifier les domaines spécifiques d'amélioration ou de réussite.

- ** Insights prédictifs :** Les graphiques en entonnoir peuvent fournir des informations prédictives sur les performances futures en fonction des taux de conversion historiques.

#### Inconvénients

- **Défi lié aux processus complexes :** Dans les scénarios où les processus impliquent de nombreuses branches ou boucles complexes, les graphiques en entonnoir peuvent avoir du mal à représenter efficacement la complexité.


## Exemple d'entonnoir

![Funnel Example](/Illustry-monorepo/funnel.gif)
