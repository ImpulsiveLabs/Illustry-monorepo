---
title: Peta Pohon
description: Dokumen Peta Pohon
---

Visualisasi **Peta Pohon** adalah cara dinamis dan hierarkis dalam merepresentasikan data yang memberikan gambaran jelas tentang struktur kompleks. Dengan memanfaatkan persegi panjang bersarang, Peta Pohon secara efisien memvisualisasikan hubungan data hierarkis, menjadikannya alat yang sangat berharga untuk menyampaikan keseluruhan dan bagian-bagian dalam kumpulan data.

## Struktur Data Peta Pohon

Untuk mewakili Data Peta Pohon, Anda dapat menggunakan antarmuka `HierarchyData` berikut:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Atribut Utama

- **nama:** Nama simpul.
- **nilai:** Angka yang mewakili metrik untuk menentukan seberapa besar node tersebut.
- **category:** Menjelaskan kategori atau jenis node.
- **anak-anak:** Properti ini opsional dan mewakili array objek HierarchyNode. Ini menandakan bahwa node dapat memiliki node anak, sehingga menciptakan struktur hierarki. Setiap node anak mengikuti struktur HierarchyNode yang sama, memungkinkan representasi hierarki seperti pohon.

### Pro dan Kontra

#### Kelebihan
- **Pemahaman Hierarki:** Peta Hierarki unggul dalam menampilkan struktur data hierarki, memberikan hierarki visual yang membantu memahami hubungan antara berbagai tingkat.

- **Representasi Proporsional:** Ukuran persegi panjang yang proporsional memungkinkan representasi intuitif dari nilai atau ukuran relatif berbagai kategori data.

- **Efisiensi Ruang:** Peta Hierarki menggunakan ruang secara efisien, memungkinkan pengguna memvisualisasikan kumpulan data besar tanpa mengacaukan layar.

- **Identifikasi Pola Cepat:** Pengguna dapat dengan cepat mengidentifikasi pola, outlier, dan konsentrasi dalam kumpulan data melalui susunan visual persegi panjang.

#### Kontra
- **Kompleksitas dengan Label yang Tumpang Tindih:** Jika label tumpang tindih, terutama pada Peta Pohon yang padat penduduk, keterbacaan dapat menjadi suatu tantangan.

- **Kesulitan dalam Presisi:** Meskipun Peta Hierarki memberikan gambaran umum yang luas, mencapai perbandingan yang tepat antara masing-masing titik data mungkin sulit dilakukan karena sifatnya yang hierarkis.

- **Terbatas pada Data Hierarki:** Peta Hierarki paling efektif saat memvisualisasikan data hierarki; untuk kumpulan data non-hierarki, visualisasi alternatif mungkin lebih cocok.

## Contoh Peta Pohon

![Tree Map Example](/Illustry-monorepo/tree-map.gif)
