# Case study Digital Twin xây dựng bằng Unity

## 1. Punggol Digital District — Singapore (JTC Open Digital Platform)

- **Bối cảnh:** Khu đô thị thông minh đầu tiên của Singapore vận hành hoàn toàn bằng nền tảng số. JTC xây dựng Open Digital Platform (ODP) làm hạ tầng dữ liệu chung cho cả quận.
- **Công nghệ:** Digital twin thời gian thực trên Unity, tích hợp và giám sát dữ liệu tòa nhà, năng lượng, giao thông nội khu.
- **Kết quả đo được:** Thử nghiệm tại trụ sở JTC cho thấy tiết kiệm dự kiến **~30% năng lượng làm mát** tòa nhà.
- **Bài học:** Digital twin cấp *quận/khu chức năng* (district-level) là quy mô khả thi và sinh ra ROI nhanh hơn twin toàn thành phố. Rất giống quy mô Ocean Park + Technopark.

## 2. Orlando Regional Digital Twin — Mỹ (Orlando Economic Partnership × Unity)

- **Bối cảnh:** Dùng digital twin làm công cụ **xúc tiến đầu tư** thay vì chỉ vận hành.
- **Công nghệ:** Unity Accelerate Solutions; mô hình ~800 dặm vuông (~2.000 km²), xếp lớp dữ liệu công/tư (dân số, hạ tầng, bất động sản) lên mô hình 3D.
- **Bài học:** Digital twin có giá trị *thương mại/marketing* rõ rệt — nhà đầu tư "đi thăm" khu đô thị trong 3D trước khi quyết định. Áp dụng trực tiếp cho việc giới thiệu Technopark với doanh nghiệp thuê văn phòng.

## 3. Port of Oulu — Phần Lan (Sitowise, nền tảng Aura trên Unity)

- **Bối cảnh:** Cảng biển muốn số hóa hạ tầng và kết nối cảm biến IoT.
- **Công nghệ:** Nền tảng Aura (xây trên Unity) hợp nhất mô hình 3D chất lượng cao + IoT + nguồn dữ liệu vận hành; mục tiêu giảm tác động môi trường.
- **Bài học:** Mô hình "nền tảng twin dùng lại được" (một platform, nhiều site) — phù hợp tư duy làm 1 nền tảng dùng chung cho Ocean Park + 2 sân vận động.

## 4. Nghiên cứu học thuật đáng chú ý (Unity)

| Nghiên cứu | Nội dung | Điểm rút ra |
|---|---|---|
| Urban traffic digital twin in Unity (PMC, 2024) | Twin giao thông đô thị: SUMO/dữ liệu giao thông → mô phỏng trong Unity | Unity làm tốt lớp mô phỏng giao thông — đúng bài toán "car logic" dự án đang làm |
| Smart City Platform Based on Digital Twin (MDPI Sustainability, 2023) | Kiến trúc nền tảng twin hỗ trợ ra quyết định: IoT → data platform → 3D | Kiến trúc 3 tầng (thu thập – nền tảng dữ liệu – hiển thị) là chuẩn mực |
| Digital Twin Warehouse trên Unity3D (ACM IoTML 2024) | Twin kho vận: Unity + IoT thời gian thực | Pattern gắn sensor → object 3D qua ID ánh xạ 1-1 |

## 5. Tổng hợp đặc điểm chung các dự án Unity

1. **Unity được chọn khi cần phủ nhiều thiết bị**: WebGL, mobile, tablet, kiosk — đúng nhu cầu dashboard IOC truy cập bằng trình duyệt.
2. **Kiến trúc chung:** IoT/GIS/BIM → nền tảng dữ liệu (API/MQTT) → Unity chỉ là *client hiển thị*. Twin "sống" nhờ dữ liệu, không nhờ mô hình.
3. **Quy mô hiệu quả nhất là cấp khu/quận**, không phải toàn thành phố.

## Nguồn

- [Unity — Sitowise case study](https://unity.com/case-study/sitowise)
- [Unity — Creating Cities of the Future with Digital Twins](https://create.unity.com/creating-smart-cities-digital-twins-article)
- [Unity Blog — Building smarter cities with digital twins](https://blog.unity.com/industry/building-smarter-cities-with-digital-twins)
- [Unity — Reimagining community with digital twin technology (Orlando)](https://unity.com/blog/industry/reimagining-community-with-digital-twin-technology)
- [Unity — Dynamic smart city digital twin (Digital Twin Technology GmbH, i2CAT)](https://unity.com/resources/digital-twin-technology-gmbh-i2cat-building-a-dynamic-smart-city-digital-twin)
- [MDPI — Smart City Platform Based on Digital Twin Technology](https://www.mdpi.com/2071-1050/15/18/14002)
- [PMC — Urban traffic digital twin system development in Unity](https://pmc.ncbi.nlm.nih.gov/articles/PMC12623771/)
- [ACM — Digital Twin Warehouse Management Platform Based on Unity3D](https://dl.acm.org/doi/10.1145/3697467.3697667)
- [Unity — 2025 Customer Success Story Round Up](https://unity.com/blog/industry-customer-success-stories-2025-round-up)
