---
title: Nor de cuvinte
description: Word cloud document
---

Vizualizarea **Word Cloud** este folosită pentru a reprezenta datele textuale într-un mod captivant și informativ din punct de vedere vizual. Transformă cuvintele în elemente grafice, mărimea fiecărui cuvânt indicând frecvența sau importanța acestuia în setul de date dat.

## Structura de date Word Cloud

Pentru a reprezenta un Word Cloud, puteți utiliza următoarea interfață `WordCloudData`:

```typescript
{{WordType}}

{{WordCloudData}}

```
### Atribute cheie

- **nume:** Cuvântul în sine.
- **valoare:** un număr care reprezintă o valoare pentru a determina cât de important este acel cuvânt.


### Argumente pro şi contra

#### Pro
- **Simplitate:** Word Clouds distilează datele textuale într-un format simplu și accesibil vizual.

- **Analiză rapidă:** Utilizatorii pot analiza și identifica rapid cuvintele cele mai semnificative fără a pătrunde în textul detaliat.

#### Contra
- **Pierderea contextului:** În timp ce norii de cuvinte evidențiază cuvinte individuale, este posibil să le lipsească contextul oferit de textul integral sau de vizualizări mai complexe.

- **Subiectivitate:** Interpretarea unui nor de cuvinte poate fi subiectivă, iar importanța unui cuvânt poate varia în funcție de indivizi.

## Exemplu de cloud de cuvinte

![Word Cloud Example](/Illustry-monorepo/word-cloud.gif)
