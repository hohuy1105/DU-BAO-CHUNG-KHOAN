
<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
 🏥 HỆ THỐNG QUẢN LÝ HỒ SƠ BỆNH ÁN ĐIỆN TỬ PHI TẬP TRUNG
<br>TRIỂN KHAI TRÊN NỀN TẢNG CÔNG NGHỆ WEB3 BLOCKCHAIN
</h2>
<div align="center">
    <p align="center">
      <img src="https://github.com/Tank97king/LapTrinhMang/blob/main/CHAT%20TCP/%E1%BA%A2nh/fitdnu_logo.png?raw=true" alt="FITDNU Logo" width="180"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

---

## 📖 1. Giới thiệu tổng quan hệ thống đề tài

### 1.1. Bối cảnh thực tiễn và Đặt vấn đề
[cite_start]Trong kỷ nguyên chuyển đổi số y khoa, việc số hóa hồ sơ bệnh án điện tử là một nhu cầu cấp thiết[cite: 71, 72]. [cite_start]Tuy nhiên, các kiến trúc phần mềm truyền thống thuộc thế hệ Web2 hầu hết đều vận hành dựa trên mô hình lưu trữ cơ sở dữ liệu tập trung (Centralized Database)[cite: 74, 75]. [cite_start]Mô hình này bộc lộ những lỗ hổng bảo mật nghiêm trọng[cite: 75]:
- [cite_start]**Nguy cơ can thiệp dữ liệu (Data Tampering):** Lịch sử chẩn đoán lâm sàng của bệnh nhân có thể bị chỉnh sửa lén lút bởi quản trị viên hệ thống hoặc tin tặc nhằm mục đích trục lợi bảo hiểm hoặc trốn tránh trách nhiệm pháp lý y khoa[cite: 75, 93].
- [cite_start]**Điểm nghẽn hệ thống (Single Point of Failure - SPOF):** Khi máy chủ trung tâm của bệnh viện bị tấn công mã hóa tống tiền (Ransomware) hoặc gặp sự cố kỹ thuật, toàn bộ quy trình tra cứu hồ sơ bệnh lý bị đóng băng, gây nguy hiểm trực tiếp đến tính mạng bệnh nhân trong các tình huống cấp cứu[cite: 76, 91].
- [cite_start]**Sự cố rò rỉ quyền riêng tư (Privacy Leaks):** Thông tin bệnh học nhạy cảm dễ bị khai thác và mua bán trái phép do thiếu cơ chế xác thực mã hóa mạnh mẽ phân quyền cá nhân[cite: 75, 88].

### 1.2. Giải pháp ứng dụng "MedicalBlockchain"
[cite_start]Dự án mang tên **`MedicalBlockchain`** ra đời nhằm giải quyết triệt để các thách thức trên bằng cách ứng dụng nền tảng công nghệ mạng lưới chuỗi khối phi tập trung[cite: 80]. Bằng cách di chuyển luồng dữ liệu cốt lõi lên Blockchain, hệ thống đạt được các tính chất ưu việt:
- [cite_start]**Tính bất biến tuyệt đối (Immutability):** Dữ liệu chẩn đoán một khi đã được đóng khối thì không một thế lực nào có thể chỉnh sửa hay xóa bỏ[cite: 78, 97].
- [cite_start]**Định danh bằng mật mã học (Web3 Identity):** Y bác sĩ tương tác với hệ thống hoàn toàn thông qua cặp khóa công khai/khóa bí mật của ví điện tử cá nhân (MetaMask), loại bỏ cơ chế tài khoản-mật khẩu truyền thống dễ bị đánh cắp[cite: 79, 99].
- [cite_start]**Kiến trúc đồng bộ lai (Hybrid Architecture):** Hệ thống tích hợp phân hệ Mock Storage nội bộ kết hợp thuật toán băm Keccak-256 [cite: 156, 295][cite_start], vừa bắt MetaMask ký số thực hiện giao dịch On-chain thật [cite: 192][cite_start], vừa đồng bộ bộ nhớ đệm tại Client nhằm đảm bảo trải nghiệm kết xuất dữ liệu mượt mà, phản hồi tức thời dưới vài mili-giây[cite: 221].

---

## 🔧 2. Kiến trúc phân hệ và Công nghệ sử dụng

[cite_start]Hệ thống được phát triển theo mô hình ứng dụng phi tập trung (dApp) phân tầng công nghệ chặt chẽ[cite: 106]:

[ Giao diện Bác sĩ (HTML5/CSS3/Vanilla JS) ]
│
┌───────────┴───────────┐
▼ (Tương tác Web3)       ▼ (Đồng bộ cục bộ)
[ Ví MetaMask ]          [ Mock Storage Bộ nhớ đệm ]
│                        │
▼ (RPC Cổng 8545)        ▼
[ Hardhat Local Blockchain ] ──► [ Kết xuất Lịch sử Bệnh án ]

### 2.1. Phân hệ Sổ cái Chuỗi khối (Web3 Backend)
- **Solidity (v0.8.28):** Ngôn ngữ lập trình hướng đối tượng kiểu tĩnh dùng để biên soạn hợp đồng thông minh y tế lõi[cite: 167, 168, 423].
- **Hardhat Framework:** Môi trường phát triển và giả lập chuỗi khối Ethereum cục bộ tốc độ cao, cung cấp mạng lưới RPC cục bộ tại cổng giao thức `8545`[cite: 182, 186, 431].
- **MetaMask Wallet:** Ví điện tử đóng vai trò là Web3 Provider và Signer tối cao, thực hiện ký số các hash giao dịch bằng thuật toán khóa công khai mật mã[cite: 191, 192].

### 2.2. Phân hệ Giao diện & Điều phối Tương tác (Frontend)
- **HTML5 & CSS3 (Bản quyền Giao diện Tối - Dark Mode UI):** Thiết kế responsive đáp ứng, trực quan hóa các trạng thái kết nối ví bằng các mã màu tiêu chuẩn (Xanh lá - Connected, Xanh dương - Action, Tím - History view).
- **JavaScript thuần (Vanilla JS):** Xử lý toàn bộ logic bất đồng bộ (`async/await`), điều phối các cuộc gọi JSON-RPC tới mạng Blockchain và quản lý mảng cấu trúc bộ nhớ đệm đồng bộ.
- **Ethers.js (v5.7.2):** Thư viện JavaScript cầu nối giúp khởi tạo các thực thể `Web3Provider` và kết nối trực tiếp đến mã nhị phân giao diện ứng dụng ABI của Smart Contract[cite: 194, 195].

---

## 📜 3. Thiết kế kỹ thuật Hợp đồng thông minh (`MedicalRecords.sol`)

Hợp đồng thông minh định nghĩa cấu trúc dữ liệu mật mã và các hàm thành viên quản lý quyền ghi bệnh án:

### 3.1. Cấu trúc dữ liệu Hồ sơ Bệnh án (`Record` Struct)
```solidity
struct Record {
    string patientId;    // Mã số căn cước hoặc ID định danh độc bản của bệnh nhân
    string diagnosis;    // Nội dung văn bản chẩn đoán lâm sàng, phác đồ điều trị
    bytes32 dataHash;    // Mã băm Keccak-256 dùng làm dấu chứng thực toàn vẹn dữ liệu
    uint256 timestamp;   // Mốc thời gian Unix thực tế của khối (block.timestamp)
}
3.2. Cấu trúc ánh xạ phân quyền (Mapping)
Solidity
// Ánh xạ địa chỉ ví của riêng từng Bác sĩ sang mảng động chứa danh sách bệnh án do họ quản lý
mapping(address => Record[]) private doctorRecords;
Ghi chú bảo mật: Mảng lưu trữ được cấu hình ở phạm vi private để đóng gói an toàn, mọi hành vi truy vấn bắt buộc phải đi qua các hàm view được thiết kế sẵn.  
DOCX
3.3. Đặc tả các hàm thành viên lõi
addRecord(string patientId, string diagnosis): Tiếp nhận dữ liệu, thực hiện tính toán hàm băm mật mã học keccak256(bytes(diagnosis)) làm dấu chứng thực toàn vẹn. Tiến hành push bản ghi mới vào ánh xạ ví người gọi (msg.sender) và phát ra (emit) sự kiện RecordAdded.  
DOCX
getRecordCount(address doctor): Trả về một số nguyên uint256 biểu thị tổng số lượng bệnh án đã được tạo lập bởi địa chỉ ví của một bác sĩ nhất định.  
DOCX
getRecord(address doctor, uint256 index): Cho phép truy xuất chi tiết từng bộ thuộc tính của bệnh án tại một chỉ mục vị trí cụ thể trong mảng để đối chiếu chéo cấu trúc.  
DOCX
🚀 4. Hình ảnh minh chứng các chức năng vận hành
📝 5. Hướng dẫn chi tiết Quy trình Cài đặt và Khởi chạy
💻 Bước 1: Mở Terminal và di chuyển đường dẫn tuyệt đối
Mở phần mềm Terminal có sẵn trên hệ điều hành máy tính của bạn và dùng lệnh cd để đi thẳng vào thư mục chứa mã nguồn đồ án:
Bash
cd ~/blockchain_duan
(Nếu bạn đang sử dụng hệ điều hành Windows, có thể thay đổi đường dẫn tương đương ví dụ: cd C:\Users\Admin\Downloads\blockchain_duan).
🔌 Bước 2: Khởi động mạng lưới Blockchain ảo nội bộ
Tại ô dòng lệnh Terminal vừa điều hướng, gõ chính xác cú pháp sau đây rồi nhấn nút Enter:
Bash
npx hardhat node
Hiện tượng chuẩn: Mạng lưới Hardhat sẽ tự động sinh ra danh sách 20 tài khoản ví mật mã ngẫu nhiên kèm số dư ảo sẵn có là 10000 ETH và lắng nghe kết nối JSON-RPC tại cổng địa chỉ http://127.0.0.1:8545. Tuyệt đối không tắt cửa sổ dòng lệnh này đi nhe.  
DOCX
+ 2
🛰️ Bước 3: Deploy Hợp đồng thông minh lên mạng lưới
Mở thêm một tab Terminal mới tinh độc lập, thực hiện lệnh điều hướng vào thư mục và chạy script tự động để đẩy mã bytecode của contract y tế lên chuỗi khối:
Bash
cd ~/blockchain_duan
npx hardhat run scripts/deploy_manual.js --network localhost
Hiện tượng chuẩn: Hệ thống sẽ in ra màn hình một chuỗi mã băm biểu thị địa chỉ phân phối thành công, có dạng: MedicalRecords deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3. Hãy sao chép chuỗi 0x... này.
✍️ Bước 4: Cấu hình mã nguồn Frontend trong VS Code
Khởi chạy phần mềm chỉnh sửa mã nguồn VS Code và chọn mở thư mục dự án blockchain_duan.
Truy cập vào tệp tin index.html.
Cuộn chuột tìm đến khu vực thẻ <script> (khoảng dòng 120) và tìm hằng số:
JavaScript
const contractAddress = "NHẬP_ĐỊA_CHỈ_VỪA_COPY_TẠI_ĐÂY";
Thực hiện dán đè chuỗi địa chỉ ví contract mới vừa tạo ở Bước 3 vào giữa hai dấu ngoặc kép và nhấn tổ hợp phím Cmd + S (hoặc Ctrl + S trên Windows) để ghi nhận lưu file an toàn.
🌐 Bước 5: Kích hoạt Giao diện làm việc (Live Server)
Tại giao diện file index.html trong VS Code, Huy nhấp chuột phải vào vùng soạn thảo code và chọn dòng Open with Live Server (hoặc click vào nút Go Live ở thanh trạng thái nằm tại góc dưới cùng bên phải màn hình).
Trình duyệt Google Chrome sẽ tự động mở ra trang web tại liên kết mặc định: http://127.0.0.1:5500/index.html.
Bật tiện ích mở rộng MetaMask trên trình duyệt, nhấn chọn kết nối mạng nội bộ là Hardhat Local / Localhost 8545.  
DOCX
+ 1
Tiến hành thực hiện chu trình kiểm tra chức năng: Bấm Nút số 1 để kết nối ví → Nhập thông tin bệnh lý → Bấm Nút số 2 và duyệt bảng đen Xác nhận giao dịch trên MetaMask → Bấm Nút số 3 để hiển thị lịch sử bệnh lý bóng loáng dưới đáy giao diện!
📊 6. Ma trận kết quả Kiểm thử Hệ thống (System Testing)
Quá trình kiểm thử tích hợp toàn diện hệ thống được ghi nhận cụ thể qua bảng ma trận chức năng dưới đây:  
DOCX
STT	Kịch bản kiểm thử (Test Case)	Dữ liệu đầu vào (Inputs)	Kết quả mong đợi (Expected)	Kết quả thực tế (Actual)	Trạng thái
1	
Kiểm tra hệ thống khi trình duyệt chưa thiết lập tích hợp ví.  
DOCX
Truy cập dApp bằng trình duyệt ẩn danh không cài MetaMask. 
DOCX
Hệ thống nhận diện, hiển thị thông báo yêu cầu cài đặt và khóa các nút chức năng.  
DOCX
Hiển thị đúng chuỗi cảnh báo, vô hiệu hóa toàn bộ form nhập liệu. 
DOCX
ĐẠT   
DOCX
2	
Kiểm tra chức năng Đăng ký/Kết nối danh tính người dùng Web3. 
DOCX
Bác sĩ nhấp nút "1. KẾT NỐI VÍ METAMASK" và duyệt quyền.  
DOCX
Hệ thống nhận diện thành công, chuyển đổi trạng thái giao diện và lấy địa chỉ ví làm định danh.  
DOCX
+ 1
Địa chỉ ví hệ Hex (0x...) hiển thị chính xác, hộp đen đổi sang màu xanh báo thành công.  
DOCX
+ 1
ĐẠT   
DOCX
3	
Kiểm tra chức năng Tạo hồ sơ bệnh án và Ghi dữ liệu chuỗi khối. 
DOCX
Điền mã bệnh nhân BN-99 và nội dung chẩn đoán bệnh. Nhấn nút số 2.  
DOCX
+ 1
MetaMask tự động kích hoạt pop-up, yêu cầu ký số xác thực và tính phí gas.  
DOCX
+ 1
Giao dịch được khai thác đóng khối thành công, Hardhat Terminal sinh mã transaction hash.  
DOCX
+ 1
ĐẠT   
DOCX
4	
Kiểm tra chức năng Đồng bộ và Kết xuất dữ liệu lịch sử.  
DOCX
Nhấp chọn nút số 3 "3. XEM LỊCH SỬ HỒ SƠ" ngay sau khi đóng khối thành công.  
DOCX
Hệ thống thực thi vòng lặp quét, đồng bộ và hiển thị thông tin bệnh án trực quan ra màn hình.  
DOCX
+ 1
Bảng danh sách bệnh lý xuất hiện mượt mà dưới đáy giao diện với đầy đủ mốc thời gian Unix thực tế.  
DOCX
ĐẠT   
DOCX
5. 👤 Thông tin bản quyền và liên hệ học phần
Sinh viên thực hiện: Hồ Quang Huy   
DOCX
Mã số sinh viên: 1671020137   
DOCX
Lớp chuyên ngành: 16-01 CNTT   
DOCX
Giảng viên hướng dẫn khoa học: TS. Trần Đăng Công   
DOCX
+ 1
Cơ quan chủ quản: Khoa Công nghệ thông tin - Trường Đại học Đại Nam   
DOCX
Hộp thư điện tử chính thức: hoquanghuy1105@gmail.com
© 2026 AIoTLab, Faculty of Information Technology, DaiNam University. All rights reserved.
