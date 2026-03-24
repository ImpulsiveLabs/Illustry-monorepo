---
title: Hierarchisches Edge-Bundling
description: Hierarchisches Edge-Bündelungsdokument
---

Die **Hierarchical Edge Bundling**-Visualisierung ist eine ausgefeilte Technik zur Darstellung hierarchischer Beziehungen und Verbindungen innerhalb eines Datensatzes. Es nutzt Kantenbündelung, um visuelle Unordnung zu reduzieren und gleichzeitig die Struktur von Beziehungen auf hierarchische Weise hervorzuheben.

## Hierarchische Edge-Bündelungsdatenstruktur

Um eine hierarchische Kantenbündelung darzustellen, können Sie die folgende `NodeLinkData`-Schnittstelle verwenden:

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
- **Verbesserte Ästhetik und Lesbarkeit:** Die gebündelten Kanten tragen zu einer saubereren und ästhetisch ansprechenderen Visualisierung bei. Durch die Reduzierung der visuellen Unordnung können Benutzer die Beziehungen zwischen Knoten einfacher interpretieren und so die allgemeine Lesbarkeit verbessern.

- **Verstärkter Fokus auf Schlüsselbeziehungen:** Edge-Bündelung ermöglicht es Benutzern, sich auf Schlüsselbeziehungen innerhalb der hierarchischen Struktur zu konzentrieren und die wichtigsten Verbindungen hervorzuheben. Dies kann bei der Identifizierung kritischer Pfade oder zentraler Knoten in komplexen Datensätzen hilfreich sein.

#### Nachteile
- **Schwierigkeit beim Identifizieren paralleler Pfade:** Das Identifizieren paralleler Pfade oder Verbindungen in einem dicht gebündelten Gebiet kann für Benutzer eine Herausforderung darstellen. Die Unterscheidung zwischen dicht gepackten Kanten, die unterschiedliche Beziehungen darstellen, kann komplex sein und die Genauigkeit der Analyse beeinträchtigen.

- **Herausforderungen bei der Wahrnehmung der Direktionalität:** Benutzer können Schwierigkeiten haben, die Direktionalität gebündelter Kanten wahrzunehmen, insbesondere in Szenarien mit einem hohen Grad an Überlappung. Dies kann Auswirkungen auf die genaue Interpretation des Beziehungsflusses haben.

## Beispiel für hierarchische Kantenbündelung

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)
