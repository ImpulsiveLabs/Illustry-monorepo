---
title: Garis Waktu
description: Dokumen garis waktu
---

**Garis Waktu** adalah visualisasi serbaguna yang menampilkan peristiwa atau aktivitas secara kronologis dari waktu ke waktu. Ini menawarkan pandangan komprehensif tentang kejadian historis atau masa depan, memberikan wawasan tentang pola, jangka waktu, dan hubungan.


## Struktur Data Garis Waktu

Untuk mewakili Data Timeline, Anda dapat menggunakan antarmuka `TimelineData` berikut:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Atribut Utama

#### TimelineEventTag
- **name:** Nama tag yang dikaitkan dengan peristiwa Timeline.

#### Peristiwa Garis Waktu
- **ringkasan:** Rangkuman singkat atau judul acara.
- **tanggal:** Tanggal terjadinya peristiwa.
- **type:** Jenis atau kategori acara.
- **penulis:** Penulis atau pembuat acara.
- **tags:** Serangkaian tag yang terkait dengan acara.
- **deskripsi:** Penjelasan rinci tentang acara tersebut.

#### Data Garis Waktu
- **[tanggal]:** Kunci tanggal yang mewakili rentang tanggal tertentu.
  - **ringkasan:**
    - **judul:** Judul ringkasan untuk rentang tanggal.
  - **events:** Serangkaian objek `TimelineEvent` yang dikaitkan dengan tanggal tersebut.

### Pro dan Kontra

#### Kelebihan
- **Pemahaman Kronologis:** Garis waktu menawarkan representasi kronologis peristiwa, memberikan pemahaman yang jelas tentang urutan terjadinya peristiwa tersebut.

- **Kategorisasi Peristiwa:** Kemampuan untuk mengkategorikan peristiwa menggunakan tag memungkinkan pengelompokan terorganisir dan efisien, sehingga membantu dalam analisis jenis peristiwa tertentu.

- **Visualisasi Fleksibel:** Garis waktu fleksibel dan dapat beradaptasi dengan berbagai jenis data, sehingga cocok untuk mewakili berbagai peristiwa dan aktivitas.

#### Kontra
- **Potensi Kerumunan:** Dalam garis waktu dengan kepadatan peristiwa yang tinggi, terdapat risiko kekacauan visual dan potensi kesulitan dalam membedakan peristiwa-peristiwa tertentu.

- **Terbatas untuk Tipe Data Tertentu:** Meskipun garis waktu bersifat serbaguna, garis waktu mungkin bukan yang paling efektif untuk mewakili hubungan kompleks atau struktur data tertentu.

- **Subjektivitas dalam Pentingnya Peristiwa:** Pentingnya suatu peristiwa mungkin bersifat subyektif, dan representasinya dalam garis waktu mungkin tidak menangkap nuansa signifikansi yang dirasakan oleh individu.

## Contoh Garis Waktu

![Timeline Example](/Illustry-monorepo/timeline.gif)
