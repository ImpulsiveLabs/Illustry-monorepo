---
title: Regroupement hierarchique des aretes
description: Document sur le regroupement hiérarchique des périphéries
---

La visualisation **Hierarchical Edge Bundling** est une technique sophistiquée permettant de représenter les relations et les connexions hiérarchiques au sein d'un ensemble de données. Il exploite le regroupement des bords pour réduire l’encombrement visuel tout en mettant en évidence la structure des relations de manière hiérarchique.

## Structure de données de regroupement hiérarchique

Pour représenter un regroupement hiérarchique de périphérie, vous pouvez utiliser l'interface `NodeLinkData` suivante :

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
- **Esthétique et lisibilité améliorées :** Les bords regroupés contribuent à une visualisation plus propre et plus esthétique. En réduisant l'encombrement visuel, les utilisateurs peuvent interpréter plus facilement les relations entre les nœuds, améliorant ainsi la lisibilité globale.

- **Amélioration de l'accent mis sur les relations clés :** Le regroupement Edge permet aux utilisateurs de se concentrer sur les relations clés au sein de la structure hiérarchique, en mettant l'accent sur les connexions les plus importantes. Cela peut aider à identifier les chemins critiques ou les nœuds centraux dans des ensembles de données complexes.

#### Inconvénients
- **Difficulté à identifier les chemins parallèles :** L'identification de chemins ou de connexions parallèles dans une zone densément regroupée peut poser des défis aux utilisateurs. Faire la distinction entre des arêtes très rapprochées représentant différentes relations peut s'avérer complexe, affectant la précision de l'analyse.

- **Défis liés à la perception de la directionnalité :** Les utilisateurs peuvent rencontrer des difficultés à percevoir la directionnalité des bords regroupés, en particulier dans les scénarios où il existe un degré élevé de chevauchement. Cela peut avoir un impact sur l’interprétation précise du flux des relations.

## Exemple de regroupement hiérarchique des bords

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
