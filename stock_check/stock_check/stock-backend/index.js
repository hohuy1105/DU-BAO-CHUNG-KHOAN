// --- 1. KHỞI TẠO VÀ CẤU HÌNH ---
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
const { SMA, RSI, MACD } = require('technicalindicators');

const fs = require('fs');
const path = require('path');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

// Lấy API Keys
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!POLYGON_API_KEY || !GEMINI_API_KEY || !ALPHA_VANTAGE_API_KEY) {
    console.error("[ERROR] LỖI KHỞI TẠO: Vui lòng thiết lập đủ POLYGON_API_KEY, ALPHA_VANTAGE_API_KEY và GEMINI_API_KEY trong file .env");
    process.exit(1);
}

// Cấu hình Axios với header xác thực cho Polygon
const polygonAxios = axios.create({
    headers: { 'Authorization': `Bearer ${POLYGON_API_KEY}` }
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

let cachedSymbols = null;
let cacheTimestamp = null;

// --- CÁC HÀM HỖ TRỢ ĐỌC/GHI FILE USER ---
const usersFilePath = path.join(__dirname, 'users.json');

const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Không thể đọc file users.json, trả về mảng rỗng.", error);
        return []; // Nếu file không tồn tại hoặc lỗi, bắt đầu với mảng rỗng
    }
};

const writeUsers = (users) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Không thể ghi vào file users.json.", error);
    }
};

// --- 2. CÁC API ENDPOINTS ---

app.get('/', (req, res) => {
    console.log("[LOG] Root endpoint '/' được gọi.");
    res.json({ message: 'Backend Phân tích Chứng khoán - Phiên bản Polygon.io!' });
});

let allSymbols = [];
try {
    console.log("[INIT] Đang đọc file all_tickers.txt...");
    const filePath = path.join(__dirname, 'all_tickers.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    allSymbols = fileContent
        .trim()
        .split(/\r?\n/)
        .map(line => {
            const symbol = line.trim();
            if (symbol) {
                return {
                    symbol: symbol,
                    name: symbol,
                    exchange: 'N/A',
                    assetType: 'Stock'
                };
            }
            return null;
        })
        .filter(item => item !== null);

    console.log(`[INIT] Đã tải thành công ${allSymbols.length} mã cổ phiếu từ file.`);
} catch (error) {
    console.error(`[ERROR] Không thể đọc file all_tickers.txt: ${error.message}`);
    console.error("[ERROR] Vui lòng kiểm tra file all_tickers.txt có tồn tại và đúng định dạng không.");
}

// === LẤY DANH SÁCH CÁC MÃ CỔ PHIẾU ===
app.get('/api/symbols', async (req, res) => {
    console.log("[LOG] Yêu cầu lấy danh sách cổ phiếu từ bộ nhớ.");
    res.json(allSymbols);
});

// === LẤY PHÂN TÍCH XU HƯỚNG BẰNG AI ===
app.get('/api/analyze/:symbol', async (req, res) => {
    const { symbol } = req.params;
    console.log(`[LOG] Yêu cầu phân tích AI cho mã: ${symbol.toUpperCase()}`);
    try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0];
        console.log(`  -> [API] Đang lấy dữ liệu giá của ${symbol.toUpperCase()} từ Polygon...`);
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${from}/${to}`;
        const response = await polygonAxios.get(url);

        if (!response.data.results || response.data.results.length === 0) {
            console.error(`  -> [ERROR] Không tìm thấy dữ liệu trên Polygon cho mã ${symbol.toUpperCase()}`);
            return res.status(404).json({ detail: `Không có dữ liệu để phân tích cho mã: ${symbol}` });
        }

        console.log(`  -> [AI] Đã có dữ liệu, đang gửi đến Gemini AI với prompt đã được cải tiến...`);

        // --- PROMPT MỚI, NGHIÊM NGẶT HƠN ---
        const prompt = `
            **Vai trò:** Bạn là một API chỉ trả về dữ liệu JSON.
            **Nhiệm vụ:** Phân tích dữ liệu giá cổ phiếu và trả về kết quả dưới dạng một đối tượng JSON.
            
            **Dữ liệu đầu vào cho mã '${symbol}':**
            ${JSON.stringify(response.data.results)}

            **Yêu cầu đầu ra:**
            Chỉ trả về một đối tượng JSON hợp lệ và duy nhất. KHÔNG thêm bất kỳ văn bản, giải thích, lời chào, hay ký tự markdown nào bên ngoài đối tượng JSON.
            Đối tượng JSON phải chứa chính xác 3 trường sau:
            1. "trend": (String) Một trong ba giá trị: "Tăng", "Giảm", "Đi ngang".
            2. "summary": (String) Một đoạn tóm tắt phân tích kỹ thuật ngắn gọn (2-3 câu).
            3. "confidence_score": (Number) Một số từ 0.0 đến 1.0.

            **Ví dụ định dạng đầu ra mong muốn:**
            {
              "trend": "Tăng",
              "summary": "Cổ phiếu cho thấy dấu hiệu tăng giá khi vượt qua đường trung bình động quan trọng với khối lượng lớn.",
              "confidence_score": 0.85
            }
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const responseText = aiResponse.text().replace(/```json|```/g, '').trim();

        console.log(`  -> [PROCESS] Đã nhận phản hồi từ AI, đang xử lý JSON...`);
        const analysisResult = JSON.parse(responseText);

        console.log(`  -> [SUCCESS] Phân tích AI cho ${symbol.toUpperCase()} hoàn tất.`);
        res.json(analysisResult);
    } catch (error) {
        // Log thêm lỗi để dễ debug nếu AI trả về sai định dạng
        if (error instanceof SyntaxError) {
            console.error(`[ERROR] Lỗi phân tích JSON từ AI. Phản hồi của AI không hợp lệ.`);
        }
        console.error(`[ERROR] Lỗi trong /api/analyze/${symbol.toUpperCase()}: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});


// === LẤY DỮ LIỆU GIÁ ĐỂ VẼ BIỂU ĐỒ ===
app.get('/api/prices/:symbol', async (req, res) => {
    const { symbol } = req.params;
    console.log(`[LOG] Yêu cầu dữ liệu giá cho mã: ${symbol.toUpperCase()}`);
    try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0];
        console.log(`  -> [API] Đang lấy dữ liệu giá của ${symbol.toUpperCase()} từ Polygon...`);
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${from}/${to}`;
        const response = await polygonAxios.get(url);
        if (!response.data.results || response.data.results.length === 0) {
            console.error(`  -> [ERROR] Không tìm thấy dữ liệu giá trên Polygon cho mã ${symbol.toUpperCase()}`);
            return res.status(404).json({ detail: `Không tìm thấy dữ liệu giá cho mã: ${symbol}` });
        }
        console.log(`  -> [PROCESS] Đã có dữ liệu, đang định dạng lại cho biểu đồ...`);
        const formattedPriceData = response.data.results.map(item => ({
            time: new Date(item.t).toISOString().split('T')[0],
            open: item.o, high: item.h, low: item.l, close: item.c, volume: item.v
        }));
        console.log(`  -> [SUCCESS] Định dạng dữ liệu giá cho ${symbol.toUpperCase()} hoàn tất.`);
        res.json(formattedPriceData);
    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/prices/${symbol.toUpperCase()}: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// === TÍNH TOÁN CHỈ BÁO KỸ THUẬT THEO YÊU CẦU ===
app.get('/api/indicators/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { name, period } = req.query;
    console.log(`[LOG] Yêu cầu chỉ báo ${name}(${period}) cho mã: ${symbol.toUpperCase()}`);
    if (!name || !period) return res.status(400).json({ detail: 'Cần cung cấp tham số: name và period.' });
    try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0];
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${from}/${to}`;
        const response = await polygonAxios.get(url);
        const results = response.data.results;
        if (!results || results.length === 0) {
            console.error(`  -> [ERROR] Không tìm thấy dữ liệu để tính chỉ báo cho mã ${symbol.toUpperCase()}`);
            return res.status(404).json({ detail: `Không tìm thấy dữ liệu giá cho mã: ${symbol}` });
        }
        console.log(`  -> [PROCESS] Đã có dữ liệu, đang tính toán chỉ báo ${name.toUpperCase()}...`);
        const inputData = results.map(item => item.c);
        let indicatorData;
        switch (name.toUpperCase()) {
            case 'SMA': indicatorData = SMA.calculate({ period: parseInt(period), values: inputData }); break;
            case 'RSI': indicatorData = RSI.calculate({ period: parseInt(period), values: inputData }); break;
            default: return res.status(400).json({ detail: `Chỉ báo '${name}' không được hỗ trợ.` });
        }
        const offset = inputData.length - indicatorData.length;
        const finalResult = indicatorData.map((value, index) => ({
            time: new Date(results[index + offset].t).toISOString().split('T')[0], value
        }));
        console.log(`  -> [SUCCESS] Tính toán chỉ báo ${name.toUpperCase()} cho ${symbol.toUpperCase()} hoàn tất.`);
        res.json(finalResult);
    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/indicators/${symbol.toUpperCase()}: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// === LẤY THÔNG TIN CƠ BẢN CỦA CÔNG TY ===
app.get('/api/company/:symbol/overview', async (req, res) => {
    const { symbol } = req.params;
    console.log(`[LOG] Yêu cầu thông tin tổng quan cho mã: ${symbol.toUpperCase()}`);
    try {
        console.log(`  -> [API] Đang lấy thông tin tổng quan của ${symbol.toUpperCase()} từ Polygon...`);
        const url = `https://api.polygon.io/v3/reference/tickers/${symbol.toUpperCase()}`;
        const response = await polygonAxios.get(url);
        const profile = response.data.results;
        if (!profile) {
            console.error(`  -> [ERROR] Không tìm thấy thông tin tổng quan cho mã ${symbol.toUpperCase()}`);
            return res.status(404).json({ detail: "Không có dữ liệu tổng quan cho mã này." });
        }
        console.log(`  -> [PROCESS] Đã có dữ liệu, đang định dạng lại...`);
        const overview = {
            Symbol: profile.ticker, Name: profile.name, Description: profile.description,
            MarketCapitalization: profile.market_cap, Exchange: profile.primary_exchange,
            PERatio: 'N/A', EPS: 'N/A', DividendPerShare: 'N/A'
        };
        console.log(`  -> [SUCCESS] Lấy thông tin tổng quan cho ${symbol.toUpperCase()} hoàn tất.`);
        res.json(overview);
    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/company/${symbol.toUpperCase()}/overview: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// === LẤY BỐI CẢNH THỊ TRƯỜNG VĨ MÔ ===
app.get('/api/market/dashboard', async (req, res) => {
    console.log("[LOG] Yêu cầu dữ liệu tổng quan thị trường...");
    try {
        console.log("  -> [API] Đang lấy dữ liệu Oil, Treasury từ Alpha Vantage và S&P 500 từ Polygon...");
        const [oilResponse, treasuryResponse, spyResponse] = await Promise.all([
            axios.get(`https://www.alphavantage.co/query?function=WTI&interval=monthly&apikey=${ALPHA_VANTAGE_API_KEY}`),
            axios.get(`https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=monthly&maturity=10year&apikey=${ALPHA_VANTAGE_API_KEY}`),
            polygonAxios.get(`https://api.polygon.io/v2/aggs/ticker/SPY/range/1/day/${new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0]}/${new Date().toISOString().split('T')[0]}`)
        ]);

        console.log("  -> [PROCESS] Đã có dữ liệu, đang xử lý...");

        // BƯỚC SỬA LỖI: Kiểm tra dữ liệu từ Alpha Vantage trước khi sử dụng
        const oilData = oilResponse.data && oilResponse.data.data ? oilResponse.data.data[0] : { value: 'N/A' };
        if (oilData.value === 'N/A') {
            console.warn("  -> [WARN] Không nhận được dữ liệu giá dầu từ Alpha Vantage.");
        }

        const treasuryData = treasuryResponse.data && treasuryResponse.data.data ? treasuryResponse.data.data[0] : { value: 'N/A' };
        if (treasuryData.value === 'N/A') {
            console.warn("  -> [WARN] Không nhận được dữ liệu lợi suất trái phiếu từ Alpha Vantage.");
        }

        // Xử lý dữ liệu S&P 500 từ Polygon
        const spyResults = spyResponse.data.results;
        const latestClose = spyResults[spyResults.length - 1].c;
        const prevClose = spyResults[spyResults.length - 2].c;
        const spyChange = ((latestClose - prevClose) / prevClose * 100).toFixed(2);

        console.log("  -> [SUCCESS] Lấy dữ liệu tổng quan thị trường hoàn tất.");
        res.json({
            oil_wti: oilData,
            us_10yr_treasury: treasuryData,
            sp500_daily_change_percent: parseFloat(spyChange)
        });

    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/market/dashboard: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// === LẤY VÀ PHÂN TÍCH TIN TỨC BẰNG AI ===
app.get('/api/company/:symbol/news-sentiment', async (req, res) => {
    const { symbol } = req.params;
    console.log(`[LOG] Yêu cầu phân tích tin tức cho mã: ${symbol.toUpperCase()}`);
    try {
        console.log(`  -> [API] Đang lấy tin tức của ${symbol.toUpperCase()} từ Polygon...`);
        const url = `https://api.polygon.io/v2/reference/news?ticker=${symbol.toUpperCase()}`;
        const response = await polygonAxios.get(url);
        const newsData = response.data.results || [];
        if (newsData.length === 0) {
            console.log(`  -> [INFO] Không có tin tức nào cho mã ${symbol.toUpperCase()}.`);
            return res.json({ sentiment: "Không có tin tức", summary: "Không có tin tức gần đây để phân tích.", articles: newsData });
        }
        console.log(`  -> [AI] Đã có ${newsData.length} tin tức, đang gửi đến Gemini AI...`);
        const articlesForAI = newsData.slice(0, 10).map(a => ({ title: a.title, summary: a.description }));
        const prompt = `Bạn là nhà phân tích tài chính. Dựa trên các tin tức về '${symbol}': ${JSON.stringify(articlesForAI)}, hãy trả về JSON DUY NHẤT chứa: "sentiment" ("Tích cực", "Tiêu cực", "Trung lập") và "summary" (tóm tắt các chủ đề chính trong 1 câu).`;
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const responseText = aiResponse.text().replace(/```json|```/g, '').trim();
        const aiAnalysis = JSON.parse(responseText);
        console.log(`  -> [SUCCESS] Phân tích tin tức cho ${symbol.toUpperCase()} hoàn tất.`);
        res.json({ ...aiAnalysis, articles: newsData });
    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/company/${symbol.toUpperCase()}/news-sentiment: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// === CHATBOT VỚI AI ===
app.post('/api/chat', async (req, res) => {
    const { symbol, question } = req.body;
    console.log(`[LOG] Yêu cầu Chatbot cho mã: ${symbol} với câu hỏi: "${question}"`);
    if (!symbol || !question) {
        console.error("  -> [ERROR] Yêu cầu thiếu symbol hoặc question.");
        return res.status(400).json({ detail: 'Cần cung cấp "symbol" và "question".' });
    }
    const prompt = `Bạn là trợ lý AI tên Gemini. Trả lời câu hỏi của người dùng về mã '${symbol}': "${question}". Không đưa ra lời khuyên mua/bán. Luôn kết thúc bằng câu: "Lưu ý: Thông tin này chỉ mang tính tham khảo, không phải là lời khuyên đầu tư."`;
    try {
        console.log(`  -> [AI] Đang gửi câu hỏi đến Gemini AI...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(`  -> [SUCCESS] Đã nhận câu trả lời từ Chatbot.`);
        res.json({ answer: response.text() });
    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/chat: ${error.message}`);
        res.status(500).json({ detail: `Lỗi giao tiếp với AI: ${error.message}` });
    }
});

// API ĐĂNG KÝ
app.post('/api/auth/register', async (req, res) => {
    console.log("[LOG] Yêu cầu đăng ký tài khoản mới...");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ detail: "Vui lòng nhập đủ email và mật khẩu." });
        }

        const users = readUsers();

        // Kiểm tra email đã tồn tại chưa
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            console.log(`  -> [WARN] Email ${email} đã tồn tại.`);
            return res.status(400).json({ detail: "Email đã tồn tại." });
        }

        // Mã hóa mật khẩu
        console.log(`  -> [PROCESS] Đang mã hóa mật khẩu cho ${email}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo người dùng mới
        const newUser = {
            id: Date.now().toString(), // Tạo ID đơn giản
            email: email,
            password: hashedPassword
        };

        users.push(newUser);
        writeUsers(users); // Lưu lại vào file

        console.log(`  -> [SUCCESS] Tạo tài khoản thành công cho ${email}.`);
        res.status(201).json({ message: "Tạo tài khoản thành công." });

    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/auth/register: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});

// API ĐĂNG NHẬP
app.post('/api/auth/login', async (req, res) => {
    console.log(`[LOG] Yêu cầu đăng nhập từ ${req.body.email}...`);
    try {
        const { email, password } = req.body;
        const users = readUsers();

        const user = users.find(u => u.email === email);
        if (!user) {
            console.log(`  -> [WARN] Đăng nhập thất bại: Không tìm thấy email ${email}.`);
            return res.status(401).json({ detail: "Email hoặc mật khẩu không chính xác." });
        }

        console.log(`  -> [PROCESS] Đang so sánh mật khẩu cho ${email}...`);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`  -> [WARN] Đăng nhập thất bại: Sai mật khẩu cho email ${email}.`);
            return res.status(401).json({ detail: "Email hoặc mật khẩu không chính xác." });
        }

        // Tạo và gửi về token
        console.log(`  -> [PROCESS] Mật khẩu chính xác, đang tạo token...`);
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '3d' } // Token hết hạn sau 3 ngày
        );

        console.log(`  -> [SUCCESS] Đăng nhập thành công cho ${email}.`);
        res.status(200).json({ email: user.email, accessToken: token });

    } catch (error) {
        console.error(`[ERROR] Lỗi trong /api/auth/login: ${error.message}`);
        res.status(500).json({ detail: `Lỗi máy chủ: ${error.message}` });
    }
});


// --- 3. KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});