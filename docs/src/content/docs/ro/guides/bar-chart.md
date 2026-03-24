---
title: Grafic cu bare
description: Diagramă cu bare doc
---

Vizualizarea **Grafic cu bare** este un instrument versatil și eficient pentru reprezentarea datelor categorice într-o manieră captivantă din punct de vedere vizual. Folosește bare orizontale sau verticale pentru a afișa valorile diferitelor categorii, facilitând compararea și înțelegerea distribuțiilor de date pentru utilizatori.

## Structura datelor diagramei cu bare

Pentru a reprezenta o diagramă cu bare, puteți utiliza următoarea interfață `AxisChartData`:

```typescript
{{AxisChartData}}
```
### Atribute cheie

- **anteturi:** o matrice de șiruri reprezentând categoriile sau dimensiunile de-a lungul uneia dintre axe.
- **valori:** un dicționar în care fiecare cheie este o categorie sau o dimensiune, iar valoarea corespunzătoare este o matrice de valori numerice de-a lungul celeilalte axe.


### Argumente pro şi contra

#### Pro
- **Comparație multi-dimensională:** Diagramele cu bare excelează la compararea mai multor dimensiuni simultan, oferind o vedere cuprinzătoare a datelor.

- **Reprezentare clară a valorii:** Valorile numerice sunt reprezentate clar de-a lungul axelor X și Y, facilitând interpretarea și compararea utilizatorilor.

#### Contra
- **Complexitate cu categorii excesive:** Când aveți de-a face cu un număr mare de categorii sau dimensiuni, vizualizarea poate deveni aglomerată și dificil de interpretat.

- **Limitat pentru date categorice:** Diagramele cu bare sunt cele mai eficiente pentru date numerice și este posibil să nu fie alegerea optimă pentru reprezentarea datelor categoriale.

## Exemplu de diagramă cu bare

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
