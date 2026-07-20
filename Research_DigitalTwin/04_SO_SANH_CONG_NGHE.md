# So sánh công nghệ hiển thị 3D cho Digital Twin

## 1. Bảng so sánh tổng hợp

| Tiêu chí | Unity | Unreal Engine 5 | NVIDIA Omniverse | Web 3D (three.js / CesiumJS) |
|---|---|---|---|---|
| Độ chân thực đồ họa | Khá – tốt | **Xuất sắc** (Nanite, Lumen, ray tracing) | Xuất sắc (RTX) | Trung bình – khá |
| Chạy trên trình duyệt | **WebGL export trực tiếp** (có đánh đổi hiệu năng) | Không hỗ trợ WebGL native → phải **Pixel Streaming** (render server, stream video) | Stream qua cloud (GDN) | **Native** — mở link là chạy |
| Đa nền tảng (mobile/tablet/kiosk) | **Mạnh nhất** | Tốt (app native), nặng | Yếu (cần GPU RTX) | Mạnh (mọi thiết bị có browser) |
| Ngôn ngữ / tốc độ phát triển | C# — nhanh, dễ tuyển | C++/Blueprint — chậm hơn, chất lượng cao | Python/USD — chuyên biệt | JavaScript — nhanh nhất |
| Tích hợp GIS | Cesium for Unity | Cesium for Unreal, Datasmith | Cesium/OpenUSD | **CesiumJS gốc** |
| Tích hợp IoT | MQTT/REST qua C# | MQTT/REST qua plugin | Omniverse Connect | MQTT over WebSocket / SSE — đơn giản nhất |
| Mô phỏng vật lý/AI quy mô lớn | Trung bình | Tốt | **Mạnh nhất** (PhysX, Metropolis) | Yếu |
| Chi phí hạ tầng khi phân phối web | Thấp (client render) | **Cao** (server GPU cho Pixel Streaming, trả theo phiên) | Cao | **Thấp nhất** |
| Phù hợp nhất cho | Dashboard tương tác đa thiết bị, app vận hành | Showcase/marketing chất lượng điện ảnh, phòng điều hành lớn | Mô phỏng kỹ thuật, huấn luyện AI, video analytics | Dashboard IOC truy cập rộng rãi, chi phí thấp |

## 2. Ba mô hình phân phối (deployment) và khi nào dùng

1. **Client-side web rendering (three.js/CesiumJS/Unity WebGL)** — render trên máy người dùng.
   - ✅ Không tốn server GPU, truy cập tức thì, dễ nhúng vào dashboard IOC.
   - ❌ Giới hạn bởi GPU thiết bị người dùng; cần tối ưu polygon/texture (LOD, draco, KTX2).
2. **Pixel Streaming (Unreal/Unity chạy trên server GPU, stream video về browser)**.
   - ✅ Chất lượng điện ảnh trên mọi thiết bị; bảo mật model (không tải asset về client).
   - ❌ Chi phí GPU theo số phiên đồng thời; độ trễ phụ thuộc mạng — phù hợp demo/showroom, không phù hợp dashboard nhiều người dùng thường xuyên.
3. **Native app (Unreal/Unity build desktop)** — cho phòng điều hành (control room) với màn hình lớn, một số máy cấu hình mạnh.

## 3. Chuẩn dữ liệu — yếu tố quyết định khả năng liên thông

- **OGC 3D Tiles (Cesium):** chuẩn mở stream dữ liệu địa không gian lớn (photogrammetry, LiDAR, BIM/CAD); được hỗ trợ đồng thời bởi CesiumJS, Unity, Unreal, Omniverse, deck.gl ⇒ đầu tư 1 lần, dùng mọi engine. Google Photorealistic 3D Tiles cung cấp sẵn mô hình 3D của 2.500+ thành phố.
- **glTF/GLB:** chuẩn trao đổi model tối ưu cho web (dự án đang dùng — đúng hướng).
- **OpenUSD:** chuẩn scene tổng hợp của Omniverse, đang lớn dần thành chuẩn công nghiệp.
- **MQTT:** giao thức IoT được cả các twin học thuật (RWTH Aachen) lẫn công nghiệp dùng để đồng bộ 2 chiều sensor ↔ twin.

## 4. Kết luận so sánh

- Không có "engine tốt nhất" tuyệt đối; các dự án lớn thường **kết hợp**: web 3D cho vận hành rộng rãi + Unreal cho showcase + Omniverse khi cần mô phỏng AI.
- Quyết định quan trọng nhất không phải chọn engine, mà là **chuẩn hóa dữ liệu (3D Tiles + glTF + MQTT)** để không bị khóa vào một công nghệ.

## Nguồn

- [Vagon — Pixel Streaming vs WebGL vs WebGPU for Unreal](https://vagon.io/blog/pixel-streaming-vs-webgl-vs-webgpu-the-best-solution-for-unreal-engine-web-deployment)
- [Smart Spatial — Omniverse vs Unreal Engine for digital twins](https://smartspatial.com/post/omniverse-vs-unreal-engine-the-digital-twin-sledgehammer-and-the-scalpel)
- [RealUseScore — NVIDIA Omniverse vs Unity vs Unreal guide](https://realusescore.com/nvidia-omniverse-vs-unity-vs-unreal/)
- [RaveSpace — Pixel Streaming vs WebGL/three.js analysis](https://ravespace.io/blog/pixel-streaming-vs-webgl-three-js-2025-s-scientific-verdict-on-3d-web-technologies)
- [Cesium — 3D Tiles resources](https://github.com/CesiumGS/3d-tiles/blob/main/RESOURCES.md)
- [Google — 3D Tiles renderer documentation](https://developers.google.com/maps/documentation/tile/use-renderer)
- [Program-Ace — Building digital twins with Cesium, Unreal, Twinmotion](https://program-ace.com/blog/building-immersive-digital-twins-with-cesium-unreal-engine-and-twinmotion/)
