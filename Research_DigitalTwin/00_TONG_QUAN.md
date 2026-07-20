# Nghiên cứu Digital Twin trên thế giới — Tổng quan

> **Ngày nghiên cứu:** 20/07/2026
> **Phạm vi:** Các sản phẩm digital twin (bản sao số) tiêu biểu trên thế giới xây dựng bằng Unity, Unreal Engine, NVIDIA Omniverse và nền tảng web 3D; trọng tâm là digital twin đô thị (smart city), campus và sân vận động.
> **Mục đích:** Rút ra bài học áp dụng cho dự án digital twin Smart City tại Vinhomes Ocean Park (Technopark, VinUni) và hai sân vận động Trống Đồng, PVF.

## 1. Câu hỏi nghiên cứu

1. Các dự án digital twin đô thị/sân vận động tiêu biểu trên thế giới dùng công nghệ gì (engine, dữ liệu, kiến trúc)?
2. Unity và Unreal Engine khác nhau thế nào khi làm digital twin, và khi nào nên dùng web 3D thuần (three.js / CesiumJS)?
3. Dự án hiện tại (pipeline Blender → GLB → web dashboard IOC) nên kế thừa gì và nâng cấp gì?

## 2. Phương pháp

- Khảo sát tài liệu chính thức của Unity, Epic Games (Unreal), Cesium, NVIDIA và các bài báo khoa học (MDPI, Springer, arXiv, PMC) về digital twin đô thị, campus, sân vận động.
- Phân tích case study theo 4 tiêu chí: **quy mô mô hình**, **nguồn dữ liệu thời gian thực**, **công nghệ hiển thị/phân phối**, **giá trị vận hành**.
- Đối chiếu với hiện trạng dự án SVF_Stadium_Smartcity để đưa ra khuyến nghị.

## 3. Cấu trúc bộ tài liệu

| File | Nội dung |
|---|---|
| [01_CASE_STUDY_UNITY.md](01_CASE_STUDY_UNITY.md) | Case study digital twin làm bằng Unity (Singapore Punggol, Orlando, Port of Oulu...) |
| [02_CASE_STUDY_UNREAL_OMNIVERSE.md](02_CASE_STUDY_UNREAL_OMNIVERSE.md) | Case study Unreal Engine + Cesium + NVIDIA Omniverse (51World Shanghai, SNCF...) |
| [03_DIGITAL_TWIN_SAN_VAN_DONG.md](03_DIGITAL_TWIN_SAN_VAN_DONG.md) | Digital twin sân vận động (SoFi Stadium, Bernabéu, FIFA 2026) |
| [04_SO_SANH_CONG_NGHE.md](04_SO_SANH_CONG_NGHE.md) | So sánh Unity vs Unreal vs Omniverse vs Web 3D; Cesium 3D Tiles |
| [05_AP_DUNG_VAO_DU_AN.md](05_AP_DUNG_VAO_DU_AN.md) | Khuyến nghị áp dụng cho Ocean Park, Technopark, VinUni, SVĐ Trống Đồng & PVF |

## 4. Kết luận chính (Executive Summary)

1. **Digital twin đô thị thành công không nằm ở đồ họa mà ở dữ liệu**: các dự án hàng đầu (Punggol Singapore, 51World Shanghai, SoFi Stadium) đều lấy tích hợp IoT/GIS/BIM thời gian thực làm lõi; engine 3D chỉ là lớp hiển thị.
2. **Unity chiếm ưu thế ở khả năng đa nền tảng và WebGL**; **Unreal chiếm ưu thế ở độ chân thực (Nanite/Lumen) qua Pixel Streaming**; **Omniverse mạnh về mô phỏng vật lý/AI quy mô lớn (OpenUSD)**.
3. **Chuẩn mở Cesium 3D Tiles (OGC)** là "chất keo" liên thông: cùng một dữ liệu địa không gian dùng được cho CesiumJS (web), Unity, Unreal và Omniverse — nên thiết kế dữ liệu theo chuẩn này ngay từ đầu.
4. **Digital twin sân vận động** có 2 hướng giá trị đã được chứng minh: (a) vận hành – bảo trì (SoFi Stadium/Willow: 3,1 triệu ft², ~1.700 mô hình BIM, quản lý trên iPad) và (b) trải nghiệm khán giả/thương mại hóa (Bernabéu: Realmadrid Games, Infinite Bernabéu trên Apple Vision Pro).
5. **Với dự án hiện tại**, hướng đi hợp lý là **web-first** (giữ pipeline Blender → GLB → three.js cho dashboard IOC), chuẩn hóa dữ liệu theo GIS/3D Tiles, và bổ sung một bản demo Unreal/Unity chất lượng cao cho mục đích showcase — chi tiết ở file 05.
