---
title: Carte des arbres
description: Document Carte des arbres
---

La visualisation **Tree Map** est une manière dynamique et hiérarchique de représenter les données qui fournit un aperçu clair des structures complexes. En utilisant des rectangles imbriqués, le Treemap visualise efficacement les relations hiérarchiques entre les données, ce qui en fait un outil inestimable pour transmettre à la fois l'ensemble et les parties d'un ensemble de données.

## Structure des données de la carte arborescente

Pour représenter des données de carte arborescente, vous pouvez utiliser l'interface `HierarchyData` suivante :

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
- **Compréhension hiérarchique :** Les Treemaps excellent dans l'affichage des structures de données hiérarchiques, fournissant une hiérarchie visuelle qui aide à comprendre les relations entre les différents niveaux.

- **Représentation proportionnelle :** La taille proportionnelle des rectangles permet une représentation intuitive des valeurs ou tailles relatives des différentes catégories de données.

- **Efficacité spatiale :** Les Treemaps utilisent efficacement l'espace, permettant aux utilisateurs de visualiser de grands ensembles de données sans encombrer l'écran.

- **Identification rapide des modèles :** Les utilisateurs peuvent identifier rapidement les modèles, les valeurs aberrantes et les concentrations au sein de l'ensemble de données grâce à la disposition visuelle des rectangles.

#### Inconvénients
- **Complexité avec les étiquettes qui se chevauchent :** Dans les cas où les étiquettes se chevauchent, en particulier dans les Treemaps densément peuplées, la lisibilité peut être un défi.

- **Difficulté de précision :** Bien que les Treemaps fournissent un aperçu général, il peut être difficile d'établir des comparaisons précises entre des points de données individuels en raison de leur nature hiérarchique.

- **Limité aux données hiérarchiques :** Les arborescences sont plus efficaces lors de la visualisation de données hiérarchiques ; pour les ensembles de données non hiérarchiques, des visualisations alternatives peuvent être plus adaptées.

## Exemple de carte d'arborescence

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
