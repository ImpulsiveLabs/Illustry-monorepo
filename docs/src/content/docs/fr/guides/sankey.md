---
title: Diagramme de Sankey
description: Sankey
---

La visualisation **Diagramme Sankey** est un outil puissant pour visualiser le flux et les relations entre les entités d'un ensemble de données. Il est particulièrement utile pour présenter la distribution et la transformation des valeurs à travers un système ou un processus.

## Structure des données du diagramme de Sankey

Pour représenter un diagramme de Sankey, vous pouvez utiliser l'interface `NodeLinkData` suivante :

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Attributs clés

- **name :** Un identifiant unique pour le nœud.
- **category :** Classifie le nœud dans un groupe ou un cluster spécifique.
- **source :** Identifie le nœud source du lien.
- **target :** Identifie le nœud cible du lien.
- **value :** Représente une valeur numérique associée au lien qui suggère le degré de connexion des nœuds.

### Avantages et inconvénients

#### Avantages
- **Représentation de flux :** visualise efficacement le flux de valeurs ou de quantités entre les entités d'un système ou d'un processus.

- **Aperçu de la distribution :** Offre un aperçu de la manière dont les valeurs sont distribuées et transformées à chaque étape.

#### Inconvénients
- **Complexité avec de nombreux nœuds :** Un fouillis visuel peut survenir avec un grand nombre de nœuds, affectant la lisibilité.

- **Cas d'utilisation spécialisé :** Principalement conçu pour visualiser le flux et la distribution ; peut ne pas convenir à tous les types d’ensembles de données.

## Exemple de diagramme de Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
