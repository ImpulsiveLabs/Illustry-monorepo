---
title: Explozie solară
description: Document despre explozia solară
---

Vizualizarea **Sun Burst Chart** este o reprezentare dinamică și captivantă a datelor ierarhice. Utilizează un aspect radial pentru a transmite ierarhia elementelor și relațiile lor în cadrul unui set de date.


## Structura de date Sun Burst

Pentru a reprezenta o hartă de date, puteți utiliza următoarea interfață `HierarchyData`:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Atribute cheie

- **nume:** Numele nodului.
- **valoare:** un număr care reprezintă o valoare pentru a determina cât de mare este acel nod.
- **categorie:** Descrie categoria sau tipul căruia îi aparține nodul.
- **copii:** Această proprietate este opțională și reprezintă o matrice de obiecte HierarchyNode. Aceasta înseamnă că nodul poate avea noduri copii, creând o structură ierarhică. Fiecare nod copil urmează aceeași structură HierarchyNode, permițând reprezentarea unei ierarhii de tip arbore.

### Argumente pro şi contra

#### Pro
- **Înțelegerea ierarhică:** Sunbursts excelează în afișarea structurilor de date ierarhice, oferind o ierarhie vizuală care ajută la înțelegerea relațiilor dintre diferite niveluri.

- **Dispoziție radială:** Aspectul radial oferă o reprezentare atrăgătoare și organizată din punct de vedere vizual a structurilor ierarhice.

#### Contra
- **Potențial dezordine:** în cazurile cu un număr mare de segmente, diagrama poate deveni aglomerată, afectând lizibilitatea.

- **Limitat la date ierarhice:** Hărțile arborescente sunt cele mai eficiente atunci când se vizualizează date ierarhice; pentru seturile de date non-ierarhice, vizualizările alternative pot fi mai potrivite.

## Sun Burst Exemplu

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
