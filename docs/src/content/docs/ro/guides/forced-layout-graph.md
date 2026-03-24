---
title: Graf cu layout fortat
description: Doc. Grafic cu aspect forțat
---

Vizualizarea **Forced Layout Graph** este o reprezentare dinamică și captivantă a datelor interconectate. Utilizează un algoritm de layout direcționat prin forță pentru a transmite vizual relațiile dintre entitățile dintr-un set de date.

## Structura datelor grafice cu aspect forțat

Pentru a reprezenta un grafic de layout forțat, puteți utiliza următoarea interfață `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}

```
### Atribute cheie

- **nume:** Un identificator unic pentru nod.
- **categorie:** Clasifică nodul într-un anumit grup sau cluster.
- **sursa:** Identifică nodul sursă al legăturii.
- **țintă:** Identifică nodul țintă al legăturii.
- **valoare:** reprezintă o valoare numerică asociată cu legătura care sugerează cât de puternic sunt conectate nodurile.

### Argumente pro şi contra

#### Pro
- **Vizualizarea relațiilor:** reprezintă clar relațiile dintre entități prin noduri și legături conectate.

- **Aspect dinamic:** Utilizează un aspect direcționat forțat pentru o reprezentare organică și atrăgătoare vizual.

#### Contra
- **Complexitate cu grafice dense:** În graficele dens interconectate, dezordinea vizuală poate afecta lizibilitatea.

- **Limitat la date de rețea:** Cel mai eficient pentru vizualizarea datelor bazate pe rețea sau relații; poate să nu fie potrivit pentru toate tipurile de seturi de date.

## Exemplu de grafic cu aspect forțat

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)
