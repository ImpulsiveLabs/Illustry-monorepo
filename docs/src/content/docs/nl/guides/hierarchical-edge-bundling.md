---
title: Hiërarchische randbundeling
description: Document over hiërarchische randbundeling
---

De visualisatie **Hierarchical Edge Bundling** is een geavanceerde techniek voor het weergeven van hiërarchische relaties en verbindingen binnen een gegevensset. Het maakt gebruik van edge-bundeling om visuele rommel te verminderen en tegelijkertijd de structuur van relaties op een hiërarchische manier te benadrukken.

## Hiërarchische edge-bundeling-gegevensstructuur

Om een ​​hiërarchische randbundeling weer te geven, kunt u de volgende `NodeLinkData`-interface gebruiken:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Belangrijkste kenmerken

- **naam:** Een unieke identificatie voor het knooppunt.
- **categorie:** Categoriseert het knooppunt in een specifieke groep of cluster.
- **bron:** Identificeert het bronknooppunt van de link.
- **doel:** Identificeert het doelknooppunt van de link.
- **waarde:** vertegenwoordigt een numerieke waarde die aan de link is gekoppeld en die aangeeft hoe sterk de knooppunten zijn verbonden.

### Voors en tegens

#### Pluspunten
- **Verbeterde esthetiek en leesbaarheid:** De gebundelde randen dragen bij aan een schonere en esthetisch aantrekkelijkere visualisatie. Door de visuele rommel te verminderen, kunnen gebruikers de relaties tussen knooppunten gemakkelijker interpreteren, waardoor de algehele leesbaarheid wordt verbeterd.

- **Verbeterde focus op sleutelrelaties:** Edge-bundeling stelt gebruikers in staat zich te concentreren op belangrijke relaties binnen de hiërarchische structuur, waarbij de belangrijkste verbindingen worden benadrukt. Dit kan helpen bij het identificeren van kritieke paden of centrale knooppunten in complexe datasets.

#### Nadelen
- **Moeilijkheden bij het identificeren van parallelle paden:** Het identificeren van parallelle paden of verbindingen in een dicht gebundeld gebied kan voor gebruikers problemen opleveren. Het kan complex zijn om onderscheid te maken tussen dicht opeengepakte randen die verschillende relaties vertegenwoordigen, wat de nauwkeurigheid van de analyse beïnvloedt.

- **Uitdagingen bij perceptie van directionaliteit:** Gebruikers kunnen problemen ondervinden bij het waarnemen van de directionaliteit van gebundelde randen, vooral in scenario's met een hoge mate van overlap. Dit kan van invloed zijn op de nauwkeurige interpretatie van de stroom van relaties.

## Voorbeeld van hiërarchische randbundeling

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
