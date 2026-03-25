---
title: Grafic scatter
description: Scatter doc
---

Vizualizarea **Scatter Plot** este un instrument puternic pentru vizualizarea relațiilor dintre două variabile numerice. Folosește puncte de pe un plan cartezian pentru a reprezenta puncte de date individuale, facilitând identificarea modelelor, corelațiilor și valorii aberante.


## Structura datelor diagramei de dispersie

Pentru a reprezenta un diagramă de dispersie, puteți utiliza următoarea interfață `ScatterData`:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Atribute cheie

- **valoare:** O matrice de două valori numerice [x, y], reprezentând coordonatele unui punct de date pe axele X și Y.
- **valori:** Un șir care indică categoria sau grupul căruia îi aparține punctul de date.


### Argumente pro şi contra

#### Pro
- **Identificarea relațiilor:** Scatter Plots excelează la dezvăluirea relațiilor, modelelor și tendințelor dintre două variabile numerice.

- **Detecție valori aberante:** valorile aberante sau punctele de date care se abat semnificativ de la normă, sunt ușor identificate pe un diagramă de dispersie.

#### Contra

- **Potențial supraplotare:** În cazurile cu o densitate mare de puncte de date, poate apărea supraplotarea, care afectează vizibilitatea punctelor individuale.

## Exemplu de diagramă de dispersie

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
