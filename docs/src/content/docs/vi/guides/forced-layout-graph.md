---
title: Biểu đồ bố trí ép buộc
description: Name
---

Bộ đồ thị bố trí cao cấp ** Tưởng tượng là một hình ảnh sống động và hấp dẫn của dữ liệu liên kết. Nó sử dụng thuật toán bố trí lực để truyền tải các mối quan hệ giữa các thực thể trong bộ dữ liệu.

## Cấu trúc dữ liệu bố trí ép buộc

Để biểu diễn Forced Layout Graph, bạn có thể sử dụng giao diện `NodeLinkData` sau:

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
- ** Hiển thị quang cảnh:** Rõ ràng đại diện cho mối quan hệ giữa các thực thể qua các nút nối và liên kết.

- **Cha trí:** Sử dụng một bố trí được định hướng bởi lực cho một hình ảnh hữu cơ và hấp dẫn.

#### Con
- ** Sự bối rối với đồ thị dày đặc:** Trong đồ thị liên kết mật độ, sự lộn xộn về thị giác có thể ảnh hưởng đến khả năng đọc.

- **Đã bắt chước dữ liệu mạng:** Hiệu quả nhất cho việc hình ảnh hóa mạng lưới hoặc dữ liệu dựa trên mối quan hệ; có thể không thích hợp cho tất cả các loại dữ liệu.

## Name

![Forced Layout Graph Example](/Illustry-monorepo/forced-layout-graph.gif)