---
title: Diagrama circulara
description: Diagramă circulară doc
---

Vizualizarea **Pie Chart** este o modalitate concisă și de impact vizual de a reprezenta distribuția părților într-un întreg. Este deosebit de eficient pentru afișarea proporțiilor și procentelor într-un format circular.


## Structura datelor diagramei circulare

Pentru a reprezenta o diagramă circulară, puteți utiliza următoarea interfață `PieChartData`:

```typescript
{{PieChartData}}
```
### Atribute cheie

- **valori:** un dicționar în care fiecare cheie este o categorie sau o dimensiune, iar valoarea corespunzătoare este o valoare numerică.


### Argumente pro şi contra

#### Pro
- **Reprezentare procentuală:** Diagramele circulare oferă o reprezentare clară a contribuției procentuale a fiecărei categorii la ansamblu.

- **Simplitate vizuală:** Forma circulară și simplitatea diagramelor circulare le fac ușor de înțeles de către utilizatori dintr-o privire.

#### Contra
- **Limitat pentru mai multe categorii:** atunci când aveți de-a face cu numeroase categorii, diagramele circulare pot deveni aglomerate și dificil de interpretat.


## Exemplu de diagramă circulară

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)
