---
title: Éclat de soleil
description: Documentation Sun Burst
---

La visualisation **Sun Burst Chart** est une représentation dynamique et attrayante de données hiérarchiques. Il utilise une disposition radiale pour transmettre la hiérarchie des éléments et leurs relations au sein d'un ensemble de données.


## Structure des données Sun Burst

Pour représenter des données cartographiques, vous pouvez utiliser l'interface `HierarchyData` suivante :

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Attributs clés

- **name :** Le nom du nœud.
- **valeur :** Un nombre qui représente une métrique permettant de déterminer la taille de ce nœud.
- **category :** Décrit la catégorie ou le type auquel appartient le nœud.
- **children :** Cette propriété est facultative et représente un tableau d'objets HierarchyNode. Cela signifie que le nœud peut avoir des nœuds enfants, créant ainsi une structure hiérarchique. Chaque nœud enfant suit la même structure HierarchyNode, permettant la représentation d'une hiérarchie arborescente.

### Avantages et inconvénients

#### Avantages
- **Compréhension hiérarchique :** Les Sunbursts excellent dans l'affichage de structures de données hiérarchiques, fournissant une hiérarchie visuelle qui aide à comprendre les relations entre les différents niveaux.

- **Disposition radiale :** La disposition radiale fournit une représentation visuellement attrayante et organisée des structures hiérarchiques.

#### Inconvénients
- **Encombrement potentiel :** Dans les cas comportant un grand nombre de segments, le graphique peut devenir encombré, affectant la lisibilité.

- **Limité aux données hiérarchiques :** Les arborescences sont plus efficaces lors de la visualisation de données hiérarchiques ; pour les ensembles de données non hiérarchiques, des visualisations alternatives peuvent être plus adaptées.

## Exemple d'éclatement de soleil

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
