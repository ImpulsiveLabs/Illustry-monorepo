---
title: Matrix
description: Matrix-Dokument
---

Bei der **Matrix**-Visualisierung handelt es sich um eine mehrdimensionale Visualisierung, bei der Knoten zweier Kategorien als komplementär zueinander visualisiert werden können

## Matrix-Datenstruktur

Um eine Matrix darzustellen, können Sie die folgende `NodeLinkData`-Schnittstelle verwenden:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Schlüsselattribute

- **Name:** Eine eindeutige Kennung für den Knoten.
- **Kategorie:** Kategorisiert den Knoten in eine bestimmte Gruppe oder einen bestimmten Cluster.
- **Labels:** Sind ein Array von Namenswerten, die bestimmte Attribute des Knotens darstellen.
- **Quelle:** Identifiziert den Quellknoten des Links.
- **Ziel:** Identifiziert den Zielknoten des Links.
- **Wert:** Stellt einen mit dem Link verknüpften numerischen Wert dar, der angibt, wie stark die Knoten miteinander verbunden sind.

### Für und Wider

#### Vorteile
- **Große Datenmenge:** Sehr große Datenmengen können in einem einzigen Fenster angezeigt werden.

- **Filterung:** Filterung nach Zeilen und Spalten.

#### Nachteile
- **Scrollen erforderlich:** Bei zu vielen Daten könnte ein Scrollen erforderlich sein, um sie alle zu sehen.


## Matrixbeispiel

![Matrix Example](/Illustry-monorepo/matrix.gif)
