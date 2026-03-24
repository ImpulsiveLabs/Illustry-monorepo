---
title: Wortwolke
description: Word-Cloud-Dokument
---

Die **Wortwolke**-Visualisierung wird verwendet, um Textdaten auf visuell ansprechende und informative Weise darzustellen. Es wandelt Wörter in grafische Elemente um, wobei die Größe jedes Wortes seine Häufigkeit oder Bedeutung im gegebenen Datensatz angibt.

## Word Cloud-Datenstruktur

Um eine Wortwolke darzustellen, können Sie die folgende `WordCloudData`-Schnittstelle verwenden:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Schlüsselattribute

- **Name:** Das Wort selbst.
- **Wert:** Eine Zahl, die einen Messwert darstellt, um zu bestimmen, wie wichtig das Wort ist.


### Für und Wider

#### Vorteile
- **Einfachheit:** Word Clouds destillieren Textdaten in ein einfaches und visuell zugängliches Format.

- **Schnelle Analyse:** Benutzer können die wichtigsten Wörter schnell analysieren und identifizieren, ohne sich mit detaillierten Texten befassen zu müssen.

#### Nachteile
- **Kontextverlust:** Während Wortwolken einzelne Wörter hervorheben, fehlt ihnen möglicherweise der Kontext, der durch Volltext oder komplexere Visualisierungen bereitgestellt wird.

- **Subjektivität:** Die Interpretation einer Wortwolke kann subjektiv sein und die Bedeutung eines Wortes kann von Person zu Person unterschiedlich sein.

## Beispiel für eine Wortwolke

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)
