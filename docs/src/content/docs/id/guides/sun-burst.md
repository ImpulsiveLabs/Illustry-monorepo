---
title: Ledakan Matahari
description: dokumen Sun Burst
---

Visualisasi **Sun Burst Chart** adalah representasi data hierarki yang dinamis dan menarik. Ia menggunakan tata letak radial untuk menyampaikan hierarki elemen dan hubungannya dalam kumpulan data.


## Struktur Data Sun Burst

Untuk mewakili Data Peta, Anda dapat menggunakan antarmuka `HierarchyData` berikut:

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
- **Pemahaman Hierarki:** Sunburst unggul dalam menampilkan struktur data hierarki, memberikan hierarki visual yang membantu memahami hubungan antara berbagai tingkat.

- **Tata Letak Radial:** Tata letak radial memberikan representasi struktur hierarki yang menarik dan terorganisir secara visual.

#### Kontra
- **Potensi Berantakan:** Dalam kasus dengan jumlah segmen yang banyak, diagram mungkin menjadi berantakan sehingga memengaruhi keterbacaan.

- **Terbatas pada Data Hierarki:** Peta Hierarki paling efektif saat memvisualisasikan data hierarki; untuk kumpulan data non-hierarki, visualisasi alternatif mungkin lebih cocok.

## Contoh Semburan Matahari

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)
