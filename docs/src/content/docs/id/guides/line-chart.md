---
title: Bagan Garis
description: Dokumen Bagan Garis
---

Visualisasi **Bagan Garis** adalah alat serbaguna untuk merepresentasikan tren dan pola dalam data numerik dari waktu ke waktu. Ini banyak digunakan untuk memvisualisasikan hubungan antara dua variabel berkelanjutan dan menyoroti tren atau fluktuasi.

## Struktur Data Bagan Garis

Untuk mewakili Bagan Garis, Anda dapat menggunakan antarmuka `AxisChartData` berikut:

```typescript
{{AxisChartData}}
```
### Atribut Utama

- **headers:** Serangkaian string yang mewakili kategori atau dimensi di sepanjang salah satu sumbu.
- **nilai:** Kamus yang setiap kuncinya merupakan kategori atau dimensi, dan nilai terkaitnya adalah larik nilai numerik di sepanjang sumbu lainnya.


### Pro dan Kontra

#### Kelebihan
- **Perbandingan Multidimensi:** Diagram Garis unggul dalam membandingkan beberapa dimensi secara bersamaan, sehingga memberikan tampilan data yang komprehensif.

- **Representasi Nilai yang Jelas:** Nilai numerik terwakili dengan jelas di sepanjang sumbu X dan Y, sehingga memudahkan pengguna untuk menafsirkan dan membandingkan.

#### Kontra
- **Kompleksitas dengan Kategori yang Berlebihan:** Saat berhadapan dengan sejumlah besar kategori atau dimensi, visualisasinya mungkin menjadi padat dan sulit untuk ditafsirkan.

- **Terbatas untuk Data Kategorikal:** Diagram Garis paling efektif untuk data numerik dan mungkin bukan pilihan optimal untuk mewakili data kategorikal.

## Contoh Bagan Garis

![Line Chart Example](/Illustry-monorepo/line-chart.gif)
