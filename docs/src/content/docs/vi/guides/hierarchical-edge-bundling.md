---
title: Gói Cho cạnh bậc hai
description: Bác sĩ Bunling cạnh bậc hai
---

**Sự tưởng tượng về cạnh chính thống ** là một kỹ thuật phức tạp để mô tả các mối quan hệ giai cấp và kết nối trong một bộ dữ liệu. Nó làm tăng tốc độ co giật để giảm sự lộn xộn thị giác trong khi làm nổi bật cấu trúc các mối quan hệ theo thứ bậc.

## Cấu trúc dữ liệu cho thuê cạnh bậc hai

Để biểu diễn Hierarchical Edge Bundling, bạn có thể sử dụng giao diện `NodeLinkData` sau:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Thuộc tính chính

- ** Tên:** Một bộ nhận diện độc đáo cho nút.
- **category:** Phân loại lõi thành một nhóm hoặc cụm cụ thể.
- ** Nguồn:** Xác định nút gốc của liên kết.
- **Tearget:** Nhận diện nút đích của liên kết.
- ** Giá trị:** đại diện cho một giá trị số liên kết với liên kết cho thấy các nút liên kết chặt chẽ với nhau như thế nào.

### Pros và Cons

#### Ưu điểm
- **Mặc định gây mê và khả năng đọc:** Những cạnh được bó lại góp phần làm đẹp và sạch sẽ hơn. Bằng cách giảm sự lộn xộn về thị giác, người dùng có thể dễ dàng giải thích các mối quan hệ giữa các nút, làm tăng khả năng đọc tổng thể.

- ** Tập trung vào các mối quan hệ then chốt:** Việc co bóp cạnh cho phép người dùng tập trung vào các mối quan hệ then chốt trong cấu trúc bậc thang, nhấn mạnh đến những kết nối quan trọng nhất. Điều này có thể giúp xác định các đường dẫn quan trọng hoặc nút giữa trong bộ dữ liệu phức tạp.

#### Con
- **Difficulty trong nhận diện đường song song:** Nhận ra những đường đi song song hoặc kết nối trong khu vực đông đúc có thể là thử thách đối với người dùng. Sự phân biệt giữa những cạnh chặt chẽ tượng trưng cho những mối quan hệ khác nhau có thể phức tạp, ảnh hưởng đến độ chính xác của việc phân tích.

- **Challenges với khả năng nhận thức hướng dẫn:** Người dùng có thể gặp khó khăn trong việc nhận ra tính hướng của các cạnh bó, đặc biệt trong trường hợp có sự chồng chéo cao. Điều này có thể tác động đến cách giải thích chính xác về dòng chảy của các mối quan hệ.

## Ví dụ cho vay cạnh bậc hai

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)