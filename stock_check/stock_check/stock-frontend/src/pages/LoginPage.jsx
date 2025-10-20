import React, { useState, useContext } from "react";
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider, Flex } from "antd";
import { MailOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";

const { Title, Text } = Typography;

/**
 * Tips:
 * - Đổi URL ảnh nền tại BG_IMAGE_URL cho phù hợp dự án của bạn
 * - Có thể đưa ảnh vào /public/images/bg.jpg rồi đổi thành "/images/bg.jpg"
 */
const BG_IMAGE_URL =
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=2400&auto=format&fit=crop";

const LoginPage = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const onFinish = async (values) => {
        setLoading(true);
        setError("");
        try {
            const res = await axiosClient.post("/auth/login", values);
            login(res.data);
            const from = (location.state && location.state.from && location.state.from.pathname) || "/";
            navigate(from, { replace: true });
        } catch (err) {
            setError(err?.response?.data?.detail || "Đã có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            {/* Background Layer */}
            <div style={{ ...styles.bg, backgroundImage: `url(${BG_IMAGE_URL})` }} />
            {/* Gradient overlay để chữ/khối nổi bật hơn */}
            <div style={styles.overlay} />

            <Card
                style={styles.card}
                bodyStyle={{ padding: 28 }}
                bordered={false}
            >
                <Flex vertical align="center" gap={2}>
                    <Title level={3} style={{ marginBottom: 4 }}>Đăng nhập</Title>
                    <Text type="secondary">Chào mừng bạn quay lại 👋</Text>
                </Flex>

                <Divider style={{ margin: "18px 0 22px" }} />

                <Form
                    name="login"
                    layout="vertical"
                    size="large"
                    onFinish={onFinish}
                    initialValues={{ remember: true }}
                    requiredMark={false}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            {
                                type: "email",
                                message: "Email không hợp lệ",
                            },
                        ]}
                    >
                        <Input
                            autoComplete="email"
                            placeholder="you@example.com"
                            prefix={<MailOutlined />}
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                    >
                        <Input.Password
                            autoComplete="current-password"
                            placeholder="••••••••"
                            prefix={<LockOutlined />}
                            iconRender={(visible) =>
                                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                            }
                        />
                    </Form.Item>

                    <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Ghi nhớ tôi</Checkbox>
                        </Form.Item>
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                    </Flex>

                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<LoginOutlined />}
                        loading={loading}
                        block
                        style={{ height: 44, fontWeight: 600 }}
                    >
                        Đăng nhập
                    </Button>

                    {error && (
                        <Alert
                            style={{ marginTop: 14 }}
                            message={error}
                            type="error"
                            showIcon
                        />
                    )}
                </Form>

                <Divider>
                    <Text type="secondary">hoặc</Text>
                </Divider>

                <Flex justify="center" gap={8}>
                    <Text type="secondary">Chưa có tài khoản?</Text>
                    <Link to="/register">Đăng ký ngay</Link>
                </Flex>
            </Card>

            {/* Footer small note */}
            <div style={styles.footerNote}>
                <Text type="secondary">© {new Date().getFullYear()} Your Company</Text>
            </div>
        </div>
    );
};

const styles = {
    wrapper: {
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 16,
    },
    bg: {
        position: "absolute",
        inset: 0,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(2px)",
        transform: "scale(1.02)",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background:
            "linear-gradient(120deg, rgba(10, 14, 23, 0.55), rgba(10, 14, 23, 0.25))",
    },
    card: {
        width: 420,
        maxWidth: "94vw",
        backdropFilter: "saturate(140%) blur(8px)",
        background: "rgba(255,255,255,0.86)",
        boxShadow:
            "0 6px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)",
        borderRadius: 16,
    },
    footerNote: {
        position: "absolute",
        bottom: 10,
        textAlign: "center",
    },
};

export default LoginPage;
