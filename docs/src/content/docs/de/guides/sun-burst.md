---
title: Sonnenstrahl
description: Sun Burst-Dokument
---

Die Visualisierung **Sun Burst Chart** ist eine dynamische und ansprechende Darstellung hierarchischer Daten. Es verwendet ein radiales Layout, um die Hierarchie der Elemente und ihre Beziehungen innerhalb eines Datensatzes zu vermitteln.


## Sun Burst-Datenstruktur

Um Kartendaten darzustellen, können Sie die folgende `HierarchyData`-Schnittstelle verwenden:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Schlüsselattribute

- **Name:** Der Knotenname.
- **Wert:** Eine Zahl, die eine Metrik darstellt, um zu bestimmen, wie groß dieser Knoten ist.
- **Kategorie:** Beschreibt die Kategorie oder den Typ, zu dem der Knoten gehört.
- **Kinder:** Diese Eigenschaft ist optional und stellt ein Array von HierarchyNode-Objekten dar. Es bedeutet, dass der Knoten untergeordnete Knoten haben kann, wodurch eine hierarchische Struktur entsteht. Jeder untergeordnete Knoten folgt derselben HierarchyNode-Struktur und ermöglicht so die Darstellung einer baumartigen Hierarchie.

### Für und Wider

#### Vorteile
- **Hierarchisches Verständnis:** Sunbursts zeichnen sich durch die Darstellung hierarchischer Datenstrukturen aus und bieten eine visuelle Hierarchie, die das Verständnis der Beziehungen zwischen verschiedenen Ebenen erleichtert.

- **Radiales Layout:** Das radiale Layout bietet eine optisch ansprechende und organisierte Darstellung hierarchischer Strukturen.

#### Nachteile
- **Potenzielle Unordnung:** In Fällen mit einer großen Anzahl von Segmenten kann das Diagramm unübersichtlich werden, was die Lesbarkeit beeinträchtigt.

- **Beschränkt auf hierarchische Daten:** Baumkarten sind am effektivsten bei der Visualisierung hierarchischer Daten; Für nicht hierarchische Datensätze sind alternative Visualisierungen möglicherweise besser geeignet.

## Beispiel eines Sonnenausbruchs

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
