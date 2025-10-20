import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form, Input, Button, List, Spin, Alert, Typography, Tag, Space, Divider, Tooltip } from "antd";
import { RobotOutlined, UserOutlined, SendOutlined, InfoCircleOutlined } from "@ant-design/icons";
import axiosClient from "../api/axiosClient";

const { Title, Text } = Typography;

const SYSTEM_PROMPT = `Bạn là Trợ lý Phân tích Chứng khoán. Mục tiêu: trả lời NGẮN, RÕ, DỰA TRÊN DỮ LIỆU cung cấp.
# NGUYÊN TẮC
- Không khuyến nghị mua/bán trực tiếp → luôn kèm cảnh báo “Không phải lời khuyên đầu tư”.
- Chỉ dùng dữ liệu trong {CONTEXT}. Nếu thiếu dữ liệu, nói "chưa có dữ liệu".
- Ưu tiên dữ liệu mới nhất. 
# ĐẦU RA BẮT BUỘC
1) TL;DR (1 câu)
2) Điểm Bullish (0–100) + 3–5 lý do
3) Tín hiệu kỹ thuật (MA/RSI/MACD) nếu có
4) Rủi ro & lưu ý (2–3 ý)
5) Tin đáng chú ý (tối đa 2 dòng)
6) Kịch bản 1–3 tháng (Tăng/Đi ngang/Giảm + điều kiện)
7) Disclaimer
`;

const QUICK_QUESTIONS = [
    "Rủi ro chính là gì?",
    "Kịch bản 3 tháng?",
    "Điểm bullish/bearish & lý do?",
    "Định giá hiện tại có hợp lý không?",
];

const AIChat = ({
    symbols = [],
    selectedSymbol,
    overview,
    prices,
    analysis,
    news,
    indicators,
    selectedIndicators = [],
}) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form] = Form.useForm();
    const listRef = useRef(null);

    // Tải lịch sử chat theo symbol
    useEffect(() => {
        if (!selectedSymbol) return;
        const raw = localStorage.getItem(`chat_${selectedSymbol}`);
        try {
            const arr = raw ? JSON.parse(raw) : [];
            setMessages(Array.isArray(arr) ? arr : []);
        } catch {
            setMessages([]);
        }
    }, [selectedSymbol]);

    // Auto scroll xuống cuối
    useEffect(() => {
        listRef.current?.scrollTo(0, listRef.current.scrollHeight);
    }, [messages, loading]);

    // Đổ symbol vào form khi đổi
    useEffect(() => {
        if (selectedSymbol) form.setFieldsValue({ symbol: selectedSymbol });
    }, [selectedSymbol, form]);

    // Lưu lịch sử khi thay đổi messages
    const persistHistory = (arr) => {
        if (!selectedSymbol) return;
        try {
            localStorage.setItem(`chat_${selectedSymbol}`, JSON.stringify(arr));
        } catch { }
    };

    // Build context gửi kèm
    const buildContext = () => {
        const cap = 300;
        const sliceTail = (arr = [], n = cap) => (Array.isArray(arr) ? arr.slice(-n) : []);
        const toNum = (v) => (v == null ? null : Number(v));

        const pricesRaw = sliceTail(prices || [], cap).map(({ time, open, high, low, close, volume }) => ({
            time,
            open: toNum(open),
            high: toNum(high),
            low: toNum(low),
            close: toNum(close),
            volume: toNum(volume),
        }));

        const lastClose = pricesRaw.length ? pricesRaw[pricesRaw.length - 1].close : null;
        const chgN = (n) => {
            if (pricesRaw.length < n + 1) return null;
            const prev = pricesRaw[pricesRaw.length - 1 - n].close;
            return prev ? (lastClose - prev) / prev : null;
        };

        const indicatorsRaw = (Array.isArray(indicators) ? indicators : []).map((ind) => {
            const name = ind?.name || "";
            if (/MACD/i.test(name)) {
                const data = sliceTail(ind.data, cap).map((d) => ({
                    time: d.time,
                    macd: toNum(d.macd),
                    signal: toNum(d.signal),
                    hist: toNum(d.hist),
                }));
                return { name, type: "macd", data };
            }
            const data = sliceTail(ind.data, cap).map((d) => ({ time: d.time, value: toNum(d.value) }));
            return { name, type: /RSI/i.test(name) ? "rsi" : /EMA|SMA|BB/i.test(name) ? "ma_like" : "other", data };
        });

        const compactNews = news && Array.isArray(news.articles)
            ? {
                summary: news.summary,
                articles: sliceTail(news.articles || [], 10).map((n) => ({
                    title: n.title || n.headline,
                    url: n.url || n.article_url,
                    published: n.published_utc || n.datetime,
                    sentiment: n.sentiment || n.overall_sentiment_label,
                })),
            }
            : null;

        const compactOverview = overview && overview.Symbol
            ? {
                Symbol: overview.Symbol,
                Name: overview.Name,
                Sector: overview.Sector,
                MarketCap: overview.MarketCapitalization,
                PERatio: overview.PERatio,
                EPS: overview.EPS,
                DividendYield: overview.DividendYield,
            }
            : null;

        const compactAnalysis = analysis
            ? {
                trend: analysis.trend,
                confidence_score: analysis.confidence_score,
                summary: analysis.summary?.slice(0, 1200),
            }
            : null;

        const meta = {
            symbol: selectedSymbol,
            selectedIndicators,
            stats: {
                lastClose,
                pctChange5: chgN(5),
                pctChange20: chgN(20),
            },
        };

        return {
            meta,
            overview: compactOverview,
            prices: pricesRaw,
            indicators: indicatorsRaw,
            news: compactNews,
            analysis: compactAnalysis,
        };
    };

    // Highlight số %/$ trong câu trả lời AI
    const formatAIText = (text = "") => {
        const regex = /([+-]?\d+(?:\.\d+)?%|\$[0-9.,]+|[0-9.,]+\\s?(?:USD|VND|VNĐ|đ))/g;
        const parts = [];
        let lastIndex = 0;
        let m;
        while ((m = regex.exec(text)) !== null) {
            const [match] = m;
            const start = m.index;
            if (start > lastIndex) parts.push(text.slice(lastIndex, start));
            const isNeg = match.trim().startsWith("-");
            const isPos = match.trim().startsWith("+");
            const color = isNeg ? "red" : isPos ? "green" : "blue";
            parts.push(<Tag color={color} key={`${match}-${start}`}>{match}</Tag>);
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) parts.push(text.slice(lastIndex));
        return parts;
    };

    // Gửi câu hỏi
    const handleSend = async (values) => {
        const symbol = values.symbol || selectedSymbol;
        const { question } = values;
        if (!symbol || !question) return;

        const userMessage = { author: "You", type: "user", content: `[${symbol}] ${question}` };
        const nextUser = [...messages, userMessage];
        setMessages(nextUser);
        persistHistory(nextUser);

        setLoading(true);
        setError("");
        form.resetFields(["question"]);

        try {
            const res = await axiosClient.post("/chat", {
                symbol,
                question,
                context: buildContext(),
                systemPrompt: SYSTEM_PROMPT,
                guardrails: { disclaimer: true, no_financial_advice: true },
            });

            const aiMessage = {
                author: "AI",
                type: "ai",
                content: res.data.answer,
                sources: res.data.sources,
            };
            const nextAll = [...nextUser, aiMessage];
            setMessages(nextAll);
            persistHistory(nextAll);
        } catch (err) {
            console.error(err);
            setError("AI đang gặp sự cố, vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const onQuickAsk = (q) => {
        if (!selectedSymbol) return;
        form.setFieldsValue({ question: q, symbol: selectedSymbol });
        handleSend({ symbol: selectedSymbol, question: q });
    };

    const renderBubble = (item) => {
        const isAI = item.author === "AI";
        const isSystem = item.type === "tip";
        return (
            <div style={{ display: "flex", justifyContent: isAI || isSystem ? "flex-start" : "flex-end" }}>
                <div
                    style={{
                        maxWidth: 560,
                        background: isSystem ? "#fffbe6" : isAI ? "#f5f5f5" : "#1677ff",
                        color: isSystem ? "#614700" : isAI ? "#000" : "#fff",
                        border: isSystem ? "1px dashed #faad14" : "none",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                >
                    <Space align="start">
                        {isSystem ? <InfoCircleOutlined /> : isAI ? <RobotOutlined /> : <UserOutlined />}
                        <div>
                            <Text strong>{item.author}</Text>
                            <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                                {isAI ? formatAIText(item.content) : item.content}
                            </div>

                            {item.sources?.length > 0 && (
                                <>
                                    <Divider style={{ margin: "8px 0" }} />
                                    <Text type="secondary">Nguồn tham khảo:</Text>
                                    <ul style={{ margin: "6px 0 0 18px" }}>
                                        {item.sources.map((s, idx) => (
                                            <li key={idx}>
                                                <a href={s.url} target="_blank" rel="noreferrer">
                                                    {s.title || s.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            {isAI && (
                                <div style={{ marginTop: 8 }}>
                                    <Tag color="gold">Không phải lời khuyên đầu tư</Tag>
                                </div>
                            )}
                        </div>
                    </Space>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Title level={4} style={{ marginBottom: 12 }}>Trợ lý AI</Title>

            {/* Quick actions */}
            <Space wrap style={{ marginBottom: 8 }}>
                {QUICK_QUESTIONS.map((q) => (
                    <Button key={q} size="small" onClick={() => onQuickAsk(q)}>
                        {q}
                    </Button>
                ))}
            </Space>

            <div
                ref={listRef}
                style={{
                    flexGrow: 1,
                    overflowY: "auto",
                    marginBottom: 12,
                    background: "#fafafa",
                    padding: 8,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                }}
            >
                <List
                    dataSource={messages}
                    renderItem={(item) => <List.Item style={{ border: "none" }}>{renderBubble(item)}</List.Item>}
                />
                {loading && (
                    <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
                        <Spin />
                    </div>
                )}
            </div>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 8 }} />}

            <Form form={form} onFinish={handleSend} layout="vertical" initialValues={{ symbol: selectedSymbol }}>
                <Form.Item name="symbol" hidden>
                    <input />
                </Form.Item>

                <Form.Item
                    name="question"
                    label={
                        <Space>
                            <span>Câu hỏi của bạn</span>
                            <Tooltip title="Ví dụ: 'Định giá có đắt không?', 'Rủi ro lớn nhất là gì?', 'Kịch bản 1-3 tháng tới?'">
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Space>
                    }
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={3} placeholder="Ví dụ: Phân tích các rủi ro của công ty này." />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} block>
                        Gửi
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default AIChat;
