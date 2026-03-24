---
title: Chronologie
description: Document sur la chronologie
---

La **Timeline** est une visualisation polyvalente qui affiche les événements ou les activités de manière chronologique au fil du temps. Il offre une vue complète des événements historiques ou futurs, fournissant un aperçu des modèles, des durées et des relations.


## Structure des données de la chronologie

Pour représenter des données chronologiques, vous pouvez utiliser l'interface `TimelineData` suivante :

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Attributs clés

#### TimelineEventTag
- **name :** Le nom de la balise associée à un événement Timeline.

#### ChronologieÉvénement
- **résumé :** Un bref résumé ou le titre de l'événement.
- **date :** La date à laquelle l'événement s'est produit.
- **type :** Le type ou la catégorie de l'événement.
- **auteur :** L'auteur ou le créateur de l'événement.
- **tags :** un tableau de balises associées à l'événement.
- **description :** Une description détaillée de l'événement.

#### Données chronologiques
- **[date] :** Clé de date représentant une plage de dates spécifique.
  - **résumé:**
    - **titre :** un titre récapitulatif pour la plage de dates.
  - **événements :** Un tableau d'objets `TimelineEvent` associés à cette date.

### Avantages et inconvénients

#### Avantages
- **Compréhension chronologique :** Les chronologies offrent une représentation chronologique des événements, permettant une compréhension claire de l'ordre dans lequel ils se sont produits.

- **Catégorisation des événements :** La possibilité de catégoriser les événements à l'aide de balises permet un regroupement organisé et efficace, facilitant ainsi l'analyse de types spécifiques d'événements.

- **Visualisation flexible :** Les chronologies sont flexibles et peuvent s'adapter à différents types de données, ce qui les rend adaptées à la représentation d'un large éventail d'événements et d'activités.

#### Inconvénients
- **Encombrement potentiel :** Dans les chronologies comportant une forte densité d'événements, il existe un risque d'encombrement visuel et une difficulté potentielle à distinguer les événements individuels.

- **Limité pour certains types de données :** Bien que les chronologies soient polyvalentes, elles peuvent ne pas être les plus efficaces pour représenter certaines relations ou structures de données complexes.

- **Subjectivité dans l'importance des événements :** L'importance des événements peut être subjective et leur représentation sur une chronologie peut ne pas refléter la signification nuancée perçue par les individus.

## Exemple de chronologie

![Timeline Example](/Illustry-monorepo/timeline.gif)
