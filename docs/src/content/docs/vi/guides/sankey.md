---
title: Sơ đồ Sankey
description: Sankey
---

Trực quan hóa **Sơ đồ Sankey** là một công cụ mạnh mẽ để trực quan hóa luồng và mối quan hệ giữa các thực thể trong tập dữ liệu. Nó đặc biệt hữu ích để thể hiện sự phân phối và chuyển đổi các giá trị trên một hệ thống hoặc quy trình.

## Cấu trúc dữ liệu sơ đồ Sankey

Để biểu diễn Sơ đồ Sankey, bạn có thể sử dụng giao diện `NodeLinkData` sau:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Thuộc tính chính

- **tên:** Mã định danh duy nhất cho nút.
- **danh mục:** Phân loại nút thành một nhóm hoặc cụm cụ thể.
- **nguồn:** Xác định nút nguồn của liên kết.
- **target:** Xác định nút đích của liên kết.
- **value:** Biểu thị một giá trị số được liên kết với liên kết cho biết mức độ kết nối của các nút.

### Ưu và nhược điểm

#### Ưu điểm
- **Biểu diễn dòng:** Trực quan hóa một cách hiệu quả dòng giá trị hoặc số lượng giữa các thực thể trong một hệ thống hoặc quy trình.

- **Thông tin chuyên sâu về phân phối:** Cung cấp thông tin chuyên sâu về cách các giá trị được phân phối và chuyển đổi ở từng giai đoạn.

#### Nhược điểm
- **Sự phức tạp với nhiều nút:** Sự lộn xộn về hình ảnh có thể xảy ra với số lượng nút lớn, ảnh hưởng đến khả năng đọc.

- **Trường hợp sử dụng chuyên biệt:** Được thiết kế chủ yếu để trực quan hóa dòng chảy và phân phối; có thể không phù hợp với tất cả các loại dữ liệu.

## Ví dụ về sơ đồ Sankey

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)
