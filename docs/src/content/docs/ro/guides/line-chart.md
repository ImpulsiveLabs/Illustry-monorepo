---
title: Grafic liniar
description: Diagramă cu linii doc
---

Vizualizarea **Line Chart** este un instrument versatil pentru reprezentarea tendințelor și modelelor în date numerice de-a lungul timpului. Este utilizat pe scară largă pentru vizualizarea relației dintre două variabile continue și evidențierea tendințelor sau fluctuațiilor.

## Structura de date grafică cu linii

Pentru a reprezenta o diagramă cu linii, puteți utiliza următoarea interfață `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atribute cheie

- **anteturi:** o matrice de șiruri reprezentând categoriile sau dimensiunile de-a lungul uneia dintre axe.
- **valori:** un dicționar în care fiecare cheie este o categorie sau o dimensiune, iar valoarea corespunzătoare este o matrice de valori numerice de-a lungul celeilalte axe.


### Argumente pro şi contra

#### Pro
- **Comparație multi-dimensională:** Diagramele cu linii excelează la compararea mai multor dimensiuni simultan, oferind o vedere cuprinzătoare a datelor.

- **Reprezentare clară a valorii:** Valorile numerice sunt reprezentate clar de-a lungul axelor X și Y, facilitând interpretarea și compararea utilizatorilor.

#### Contra
- **Complexitate cu categorii excesive:** Când aveți de-a face cu un număr mare de categorii sau dimensiuni, vizualizarea poate deveni aglomerată și dificil de interpretat.

- **Limitat pentru date categorice:** Diagramele cu linii sunt cele mai eficiente pentru date numerice și este posibil să nu fie alegerea optimă pentru reprezentarea datelor categoriale.

## Exemplu de diagramă cu linii

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
