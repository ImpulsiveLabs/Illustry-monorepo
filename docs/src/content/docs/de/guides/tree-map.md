---
title: Baumkarte
description: Baumkartendokument
---

Die **Tree Map**-Visualisierung ist eine dynamische und hierarchische Art der Datendarstellung, die einen klaren Überblick über komplexe Strukturen bietet. Durch die Verwendung verschachtelter Rechtecke visualisiert die Treemap hierarchische Datenbeziehungen effizient und macht sie zu einem unschätzbar wertvollen Werkzeug für die Darstellung sowohl des Ganzen als auch der Teile innerhalb eines Datensatzes.

## Datenstruktur der Baumkarte

Um Baumkartendaten darzustellen, können Sie die folgende `HierarchyData`-Schnittstelle verwenden:

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
- **Hierarchisches Verständnis:** Baumkarten zeichnen sich durch die Darstellung hierarchischer Datenstrukturen aus und bieten eine visuelle Hierarchie, die das Verständnis der Beziehungen zwischen verschiedenen Ebenen erleichtert.

- **Proportionale Darstellung:** Die proportionale Größe von Rechtecken ermöglicht eine intuitive Darstellung der relativen Werte oder Größen verschiedener Datenkategorien.

- **Platzeffizienz:** Treemaps nutzen den Platz effizient und ermöglichen Benutzern die Visualisierung großer Datensätze, ohne den Bildschirm zu überladen.

- **Schnelle Identifizierung von Mustern:** Benutzer können Muster, Ausreißer und Konzentrationen innerhalb des Datensatzes durch die visuelle Anordnung von Rechtecken schnell identifizieren.

#### Nachteile
- **Komplexität bei überlappenden Beschriftungen:** In Fällen, in denen sich Beschriftungen überlappen, insbesondere in dicht besiedelten Treemaps, kann die Lesbarkeit eine Herausforderung darstellen.

- **Schwierigkeit bei der Präzision:** Während Treemaps einen umfassenden Überblick bieten, kann es aufgrund der hierarchischen Natur schwierig sein, präzise Vergleiche zwischen einzelnen Datenpunkten zu erzielen.

- **Beschränkt auf hierarchische Daten:** Baumkarten sind am effektivsten bei der Visualisierung hierarchischer Daten; Für nicht hierarchische Datensätze sind alternative Visualisierungen möglicherweise besser geeignet.

## Beispiel für eine Baumkarte

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
