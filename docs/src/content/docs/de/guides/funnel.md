---
title: Trichter
description: Trichterdokument
---

Die **Trichter**-Visualisierung ist ein leistungsstarkes Tool zur Verfolgung des Fortschritts und der Konversionsraten einer Reihe von Phasen in einem Prozess. Es bietet eine visuelle Darstellung, wie sich Entitäten durch verschiedene Phasen eines definierten Workflows bewegen.



## Trichterdatenstruktur

Um einen Funnel darzustellen, können Sie die folgende `FunnelData`-Schnittstelle verwenden:

```typescript
{{FunnelData}}
```
### Schlüsselattribute

- **Werte:** Ein Wörterbuch, in dem jeder Schlüssel eine Kategorie oder Dimension ist und der entsprechende Wert ein numerischer Wert ist.


### Für und Wider

#### Vorteile
- **Leistungskennzahlen:** Trichterdiagramme eignen sich hervorragend zur Visualisierung von Leistungskennzahlen und ermöglichen es Teams, Schlüsselindikatoren zu verfolgen und zu verbessern.

- **Segmentierte Analyse:** Jede Phase im Trichter ermöglicht eine segmentierte Analyse, die dabei hilft, bestimmte Verbesserungs- oder Erfolgsbereiche zu identifizieren.

- **Vorausschauende Erkenntnisse:** Trichterdiagramme können auf der Grundlage historischer Konversionsraten prädiktive Einblicke in die zukünftige Leistung liefern.

#### Nachteile

- **Herausforderung bei komplexen Prozessen:** In Szenarien, in denen Prozesse zahlreiche komplizierte Verzweigungen oder Schleifen umfassen, kann es sein, dass Trichterdiagramme Schwierigkeiten haben, die Komplexität effektiv darzustellen.


## Beispiel für einen Trichter

![Funnel Example](/Illustry-monorepo/funnel.gif)
