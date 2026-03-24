---
title: Kraftbasiertes Graph-Layout
description: Dokument zum Diagramm mit erzwungenem Layout
---

Die Visualisierung **Forced Layout Graph** ist eine dynamische und ansprechende Darstellung miteinander verbundener Daten. Es verwendet einen erzwungenen Layout-Algorithmus, um Beziehungen zwischen Entitäten innerhalb eines Datensatzes visuell darzustellen.

## Datenstruktur des Diagramms mit erzwungenem Layout

Um ein Diagramm mit erzwungenem Layout darzustellen, können Sie die folgende `NodeLinkData`-Schnittstelle verwenden:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Schlüsselattribute

- **Name:** Eine eindeutige Kennung für den Knoten.
- **Kategorie:** Kategorisiert den Knoten in eine bestimmte Gruppe oder einen bestimmten Cluster.
- **Quelle:** Identifiziert den Quellknoten des Links.
- **Ziel:** Identifiziert den Zielknoten des Links.
- **Wert:** Stellt einen mit dem Link verknüpften numerischen Wert dar, der angibt, wie stark die Knoten miteinander verbunden sind.

### Für und Wider

#### Vorteile
- **Beziehungsvisualisierung:** Stellt Beziehungen zwischen Entitäten durch verbundene Knoten und Links klar dar.

- **Dynamisches Layout:** Verwendet ein erzwungenes Layout für eine organische und optisch ansprechende Darstellung.

#### Nachteile
- **Komplexität bei dichten Diagrammen:** In dicht verbundenen Diagrammen kann visuelle Unordnung die Lesbarkeit beeinträchtigen.

- **Beschränkt auf Netzwerkdaten:** Am effektivsten für die Visualisierung von Netzwerk- oder beziehungsbasierten Daten; ist möglicherweise nicht für alle Arten von Datensätzen geeignet.

## Beispiel für ein Diagramm mit erzwungenem Layout

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
