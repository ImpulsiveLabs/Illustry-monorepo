---
title: Graphe en disposition de force
description: Document Graphique à mise en page forcée
---

La visualisation **Forced Layout Graph** est une représentation dynamique et attrayante de données interconnectées. Il utilise un algorithme de mise en page dirigé par force pour transmettre visuellement les relations entre les entités au sein d'un ensemble de données.

## Structure de données de graphique à mise en page forcée

Pour représenter un graphique à mise en page forcée, vous pouvez utiliser l'interface `NodeLinkData` suivante :

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
- **Visualisation des relations :** Représente clairement les relations entre les entités via des nœuds et des liens connectés.

- **Mise en page dynamique :** utilise une mise en page dirigée par la force pour une représentation organique et visuellement attrayante.

#### Inconvénients
- **Complexité avec les graphiques denses :** Dans les graphiques densément interconnectés, l'encombrement visuel peut affecter la lisibilité.

- **Limité aux données réseau :** Très efficace pour visualiser des données basées sur un réseau ou des relations ; peut ne pas convenir à tous les types d’ensembles de données.

## Exemple de graphique à disposition forcée

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
