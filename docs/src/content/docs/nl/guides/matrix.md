---
title: Matrix
description: Matrix-doc
---

De **Matrix**-visualisatie is een multidimensionale visualisatie, waarbij knooppunten van 2 categorieën kunnen worden gevisualiseerd als complementair aan elkaar

## Matrixgegevensstructuur

Om een ​​matrix weer te geven, kunt u de volgende `NodeLinkData`-interface gebruiken:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Belangrijkste kenmerken

- **naam:** Een unieke identificatie voor het knooppunt.
- **categorie:** Categoriseert het knooppunt in een specifieke groep of cluster.
- **labels:** Zijn een reeks naamwaarden die specifieke kenmerken van het knooppunt vertegenwoordigen.
- **bron:** Identificeert het bronknooppunt van de link.
- **doel:** Identificeert het doelknooppunt van de link.
- **waarde:** vertegenwoordigt een numerieke waarde die aan de link is gekoppeld en die aangeeft hoe sterk de knooppunten zijn verbonden.

### Voors en tegens

#### Pluspunten
- **Grote gegevens:** Er kan een zeer grote hoeveelheid gegevens in één venster worden weergegeven.

- **Filteren:** Filteren op de rijen en op de kolommen.

#### Nadelen
- **Scrollen nodig:** Het kan zijn dat te veel gegevens moeten worden gescrolld om ze allemaal te kunnen zien.


## Matrixvoorbeeld

![Matrix Example](/Illustry-monorepo/matrix.gif)
