<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
  DỰ BÁO CHỨNG KHOÁN , DÙNG AI CỦA GEMINI ,
PHÂN TÍCH XU THẾ LÊN XUỐNG CỦA CHỨNG KHOÁN
</h2>
<div align="center">
    <p align="center">
      <img src="https://github.com/Tank97king/LapTrinhMang/blob/main/CHAT%20TCP/%E1%BA%A2nh/aiotlab_logo.png?raw=true" alt="AIoTLab Logo" width="170"/>
      <img src="https://github.com/Tank97king/LapTrinhMang/blob/main/CHAT%20TCP/%E1%BA%A2nh/fitdnu_logo.png?raw=true" alt="FITDNU Logo" width="180"/>
      <img src="https://github.com/Tank97king/LapTrinhMang/blob/main/CHAT%20TCP/%E1%BA%A2nh/dnu_logo.png?raw=true" alt="DaiNam University Logo" width="200"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>



## 📖 1. Giới thiệu hệ thống

`Stock Check` là một dự án mẫu gồm backend (API) và frontend (giao diện web) để theo dõi dữ liệu chứng khoán, hiển thị biểu đồ và cung cấp một số chỉ báo kỹ thuật. Hệ thống gồm:
- `stock-backend`: server nhỏ dùng Node.js + Express, cung cấp API cho frontend, xử lý xác thực (JWT), và một số endpoint phục vụ dữ liệu kỹ thuật.
- `stock-frontend`: ứng dụng SPA React + Vite, hiển thị dashboard, biểu đồ cùng các thành phần UI (Ant Design, ApexCharts, v.v.).

Mục tiêu của README này là hướng dẫn cài đặt và chạy nhanh cả hai phần trên môi trường phát triển.

## 🔧 2. Công nghệ sử dụng

- Backend: Node.js, Express, dotenv, cors, jsonwebtoken, bcryptjs, node-cache
- Frontend: React, Vite, Ant Design, ApexCharts, react-router-dom
- Các thư viện dùng chung: axios

Phiên bản cụ thể được khai báo trong các `package.json` tương ứng.



## 🚀 3. Hình ảnh các chức năng











## 📝 4. Hướng dẫn cài đặt và sử dụng

Hướng dẫn dưới đây giả định bạn đang sử dụng Windows PowerShell (mặc định trong môi trường này). Thay `npm` bằng `yarn` nếu bạn dùng Yarn.

1) Mở terminal và điều hướng vào thư mục gốc dự án:

```powershell
cd C:\Users\Admin\Downloads\stock_check\stock_check
```

2) Cài đặt dependencies cho backend và frontend

- Backend:

```powershell
cd stock-backend
npm install
```

- Frontend:

```powershell
cd ..\stock-frontend
npm install
```

3) Cấu hình biến môi trường (nếu cần)

- Backend có thể sử dụng một file `.env` nằm trong `stock-backend/`. Một số biến thường dùng (tùy code):

```
PORT=3001
JWT_SECRET=your_jwt_secret_here
API_KEY=...
```

Hãy kiểm tra mã nguồn trong `stock-backend` để biết tên biến môi trường cụ thể.

4) Chạy hệ thống ở môi trường phát triển

- Chạy backend (một số dự án dùng `node index.js` hoặc script khác). Nếu không có script `start` trong `package.json`, bạn có thể chạy trực tiếp `node index.js`:

```powershell
cd ..\stock-backend
node index.js
# hoặc (nếu có script start):
npm start
```

- Chạy frontend (dùng Vite):

```powershell
cd ..\stock-frontend
npm run dev
```

Sau khi frontend chạy, mặc định Vite sẽ xuất một URL (thường là http://localhost:5173) để truy cập giao diện.

5) Tương tác với API

- Endpoint và routes cụ thể nằm trong `stock-backend`. Bạn có thể dùng Postman hoặc curl để gọi API.

6) Build production

- Frontend: trong `stock-frontend` chạy

```powershell
npm run build
```

- Backend: tuỳ vào cách triển khai, bạn có thể tạo một service hoặc deploy lên nền tảng hosting Node (Heroku, VPS, Docker...).



## 5.👤Thông tin liên hệ  
Họ tên: Hồ Quang Huy  
Lớp: CNTT 16-01.  
Email: hoquanghuy1105@gmail.com.

© 2025 AIoTLab, Faculty of Information Technology, DaiNam University. All rights reserved.

---
Tôi đã viết hướng dẫn cơ bản; nếu bạn muốn README chi tiết hơn (mô tả endpoint, các biến .env đầy đủ, hướng dẫn test), cho tôi biết để tôi cập nhật.
