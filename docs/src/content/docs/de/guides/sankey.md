---
title: Sankey-Diagramm
description: Sankey
---

Die **Sankey-Diagramm**-Visualisierung ist ein leistungsstarkes Tool zur Visualisierung von Flüssen und Beziehungen zwischen Entitäten in einem Datensatz. Es ist besonders nützlich, um die Verteilung und Transformation von Werten in einem System oder Prozess darzustellen.

## Datenstruktur des Sankey-Diagramms

Um ein Sankey-Diagramm darzustellen, können Sie die folgende `NodeLinkData`-Schnittstelle verwenden:

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
- **Flussdarstellung:** Visualisiert effektiv den Fluss von Werten oder Mengen zwischen Entitäten in einem System oder Prozess.

- **Einblick in die Verteilung:** Bietet Einblicke in die Art und Weise, wie Werte in jeder Phase verteilt und transformiert werden.

#### Nachteile
- **Komplexität bei zahlreichen Knoten:** Bei einer großen Anzahl von Knoten kann es zu visuellem Durcheinander kommen, das die Lesbarkeit beeinträchtigt.

- **Spezialisierter Anwendungsfall:** Hauptsächlich für die Visualisierung von Durchfluss und Verteilung konzipiert; ist möglicherweise nicht für alle Arten von Datensätzen geeignet.

## Beispiel für ein Sankey-Diagramm

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
