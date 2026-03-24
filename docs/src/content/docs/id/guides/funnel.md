---
title: Corong
description: Dokumen corong
---

Visualisasi **Funnel** adalah alat yang ampuh untuk melacak perkembangan dan tingkat konversi dari serangkaian tahapan dalam suatu proses. Ini memberikan representasi visual tentang bagaimana entitas bergerak melalui berbagai tahapan alur kerja yang ditentukan.



## Struktur Data Corong

Untuk mewakili Corong, Anda dapat menggunakan antarmuka `FunnelData` berikut:

```typescript
{{FunnelData}}
```
### Atribut Utama

- **nilai:** Kamus yang setiap kuncinya merupakan kategori atau dimensi, dan nilai terkaitnya adalah nilai numerik.


### Pro dan Kontra

#### Kelebihan
- **Metrik Kinerja:** Bagan Corong sangat bagus untuk memvisualisasikan metrik kinerja, memungkinkan tim melacak dan meningkatkan indikator utama.

- **Analisis Tersegmentasi:** Setiap tahapan dalam corong memungkinkan analisis tersegmentasi, membantu mengidentifikasi area peningkatan atau keberhasilan tertentu.

- **Wawasan Prediktif:** Diagram Corong dapat memberikan wawasan prediktif mengenai kinerja masa depan berdasarkan rasio konversi historis.

#### Kontra

- **Tantangan dengan Proses yang Kompleks:** Dalam skenario ketika proses melibatkan banyak cabang atau loop yang rumit, Bagan Corong mungkin kesulitan untuk merepresentasikan kompleksitas secara efektif.


## Contoh Corong

![Funnel Example](/Illustry-monorepo/funnel.gif)
