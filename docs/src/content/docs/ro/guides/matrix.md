---
title: Matrice
description: Matrix doc
---

Vizualizarea **Matrix** este o vizualizare multidimensională, în care nodurile din 2 categorii pot fi vizualizate ca fiind complementare unul cu celălalt

## Structura datelor matriceale

Pentru a reprezenta o matrice, puteți utiliza următoarea interfață `NodeLinkData`:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Atribute cheie

- **nume:** Un identificator unic pentru nod.
- **categorie:** Clasifică nodul într-un anumit grup sau cluster.
- **etichete:** sunt o matrice de valori de nume care reprezintă atribute specifice ale nodului.
- **sursa:** Identifică nodul sursă al legăturii.
- **țintă:** Identifică nodul țintă al legăturii.
- **valoare:** reprezintă o valoare numerică asociată cu legătura care sugerează cât de puternic sunt conectate nodurile.

### Argumente pro şi contra

#### Pro
- **Date mari:** O cantitate foarte mare de date poate fi afișată într-o singură fereastră.

- **Filtrare:** Filtrare pe rânduri și pe coloane.

#### Contra
- **Defilare necesară:** Prea multe date ar putea avea nevoie de un defilare pentru a le vedea pe toate.


## Exemplu de matrice

![Matrix Example](/Illustry-monorepo/matrix.gif)
