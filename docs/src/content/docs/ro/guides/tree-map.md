---
title: Harta arborelui
description: Harta copacului doc
---

Vizualizarea **Harta arborelui** este un mod dinamic și ierarhic de reprezentare a datelor care oferă o imagine de ansamblu clară a structurilor complexe. Folosind dreptunghiuri imbricate, Arborele vizualizează eficient relațiile de date ierarhice, făcându-l un instrument neprețuit pentru transmiterea atât a întregului, cât și a părților dintr-un set de date.

## Structura de date a hărții arborelui

Pentru a reprezenta o hartă arbore de date, puteți utiliza următoarea interfață `HierarchyData`:

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
- **Înțelegerea ierarhică:** Hărțile arbore excelează în afișarea structurilor de date ierarhice, oferind o ierarhie vizuală care ajută la înțelegerea relațiilor dintre diferite niveluri.

- **Reprezentare proporțională:** Dimensiunea proporțională a dreptunghiurilor permite o reprezentare intuitivă a valorilor sau dimensiunilor relative ale diferitelor categorii de date.

- **Eficiența spațiului:** Hărțile arborescente utilizează în mod eficient spațiul, permițând utilizatorilor să vizualizeze seturi mari de date fără a aglomera ecranul.

- **Identificare rapidă a modelelor:** utilizatorii pot identifica rapid modelele, valorile aberante și concentrațiile din setul de date prin aranjarea vizuală a dreptunghiurilor.

#### Contra
- **Complexitate cu etichete suprapuse:** în cazurile în care etichetele se suprapun, în special în hărțile arborescente dens populate, lizibilitatea poate fi o provocare.

- **Dificultate în precizie:** În timp ce Mapele arbore oferă o imagine de ansamblu amplă, realizarea unor comparații precise între punctele de date individuale ar putea fi dificilă din cauza naturii ierarhice.

- **Limitat la date ierarhice:** Hărțile arborescente sunt cele mai eficiente atunci când se vizualizează date ierarhice; pentru seturile de date non-ierarhice, vizualizările alternative pot fi mai potrivite.

## Exemplu de hartă arboreală

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
