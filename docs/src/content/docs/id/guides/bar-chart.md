---
title: Bagan Batang
description: Dokumen Bagan Batang
---

Visualisasi **Bagan Batang** adalah alat serbaguna dan efektif untuk merepresentasikan data kategorikal dengan cara yang menarik secara visual. Ini menggunakan bilah horizontal atau vertikal untuk menampilkan nilai dari berbagai kategori, sehingga memudahkan pengguna untuk membandingkan dan memahami distribusi data.

## Struktur Data Bagan Batang

Untuk mewakili Bar Chart, Anda dapat menggunakan antarmuka `AxisChartData` berikut:

```typescript
{{AxisChartData}}
```
### Atribut Utama

- **headers:** Serangkaian string yang mewakili kategori atau dimensi di sepanjang salah satu sumbu.
- **nilai:** Kamus yang setiap kuncinya merupakan kategori atau dimensi, dan nilai terkaitnya adalah larik nilai numerik di sepanjang sumbu lainnya.


### Pro dan Kontra

#### Kelebihan
- **Perbandingan Multidimensi:** Diagram Batang unggul dalam membandingkan beberapa dimensi secara bersamaan, sehingga memberikan tampilan data yang komprehensif.

- **Representasi Nilai yang Jelas:** Nilai numerik terwakili dengan jelas di sepanjang sumbu X dan Y, sehingga memudahkan pengguna untuk menafsirkan dan membandingkan.

#### Kontra
- **Kompleksitas dengan Kategori yang Berlebihan:** Saat berhadapan dengan sejumlah besar kategori atau dimensi, visualisasinya mungkin menjadi padat dan sulit untuk ditafsirkan.

- **Terbatas untuk Data Kategorikal:** Diagram Batang paling efektif untuk data numerik dan mungkin bukan pilihan optimal untuk merepresentasikan data kategorikal.

## Contoh Diagram Batang

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
