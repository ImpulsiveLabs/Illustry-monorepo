---
title: Matrice
description: Document matriciel
---

La visualisation **Matrix** est une visualisation multidimensionnelle, où les nœuds de 2 catégories peuvent être visualisés comme complémentaires les uns des autres.

## Structure des données matricielles

Pour représenter une matrice, vous pouvez utiliser l'interface `NodeLinkData` suivante :

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Attributs clés

- **name :** Un identifiant unique pour le nœud.
- **category :** Classifie le nœud dans un groupe ou un cluster spécifique.
- **labels :** sont un tableau de valeurs de nom qui représentent des attributs spécifiques du nœud.
- **source :** Identifie le nœud source du lien.
- **target :** Identifie le nœud cible du lien.
- **value :** Représente une valeur numérique associée au lien qui suggère le degré de connexion des nœuds.

### Avantages et inconvénients

#### Avantages
- **Données volumineuses :** Une très grande quantité de données peut être affichée sur une seule fenêtre.

- **Filtrage :** Filtrage sur les lignes et sur les colonnes.

#### Inconvénients
- **Défilement nécessaire :** Trop de données pourraient nécessiter un défilement pour les voir toutes.


## Exemple de matrice

![Matrix Example](/Illustry-monorepo/matrix.gif)
