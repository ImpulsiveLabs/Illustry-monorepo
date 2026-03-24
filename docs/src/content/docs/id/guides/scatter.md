---
title: Plot Sebar
description: Sebarkan dok
---

Visualisasi **Scatter Plot** adalah alat yang ampuh untuk memvisualisasikan hubungan antara dua variabel numerik. Ia menggunakan titik-titik pada bidang Cartesian untuk mewakili titik-titik data individual, sehingga memudahkan untuk mengidentifikasi pola, korelasi, dan outlier.


## Struktur Data Plot Sebar

Untuk merepresentasikan Scatter Plot, Anda dapat menggunakan antarmuka `ScatterData` berikut:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Atribut Utama

- **nilai:** Array yang terdiri dari dua nilai numerik [x, y], yang mewakili koordinat titik data pada sumbu X dan Y.
- **nilai:** String yang menunjukkan kategori atau grup tempat titik data berada.


### Pro dan Kontra

#### Kelebihan
- **Identifikasi Hubungan:** Scatter Plot unggul dalam mengungkapkan hubungan, pola, dan tren antara dua variabel numerik.

- **Deteksi Pencilan:** Pencilan, atau titik data yang menyimpang secara signifikan dari norma, mudah diidentifikasi di Scatter Plot.

#### Kontra

- **Potensi Overploting:** Dalam kasus dengan kepadatan titik data yang tinggi, overplotting dapat terjadi sehingga memengaruhi visibilitas setiap titik.

## Contoh Plot Sebar

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)
