import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Divider, Flex } from "antd";
import { MailOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined, UserAddOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const { Title, Text } = Typography;

// Giữ cùng background để đồng bộ giao diện với LoginPage
const BG_IMAGE_URL =
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=2400&auto=format&fit=crop";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axiosClient.post("/auth/register", {
        email: values.email,
        password: values.password,
      });
      setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Background */}
      <div style={{ ...styles.bg, backgroundImage: `url(${BG_IMAGE_URL})` }} />
      <div style={styles.overlay} />

      <Card style={styles.card} bodyStyle={{ padding: 28 }} bordered={false}>
        <Flex vertical align="center" gap={2}>
          <Title level={3} style={{ marginBottom: 4 }}>Đăng ký tài khoản</Title>
          <Text type="secondary">Tạo tài khoản mới để bắt đầu 🚀</Text>
        </Flex>

        <Divider style={{ margin: "18px 0 22px" }} />

        <Form
          name="register"
          layout="vertical"
          size="large"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="you@example.com" prefix={<MailOutlined />} allowClear autoComplete="email" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="••••••••"
              prefix={<LockOutlined />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Nhập lại mật khẩu"
              prefix={<LockOutlined />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item name="terms" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject(new Error("Bạn cần đồng ý điều khoản")) }]}>
            <Checkbox>
              Tôi đồng ý với <Link to="/terms">điều khoản</Link> & <Link to="/privacy">chính sách</Link>
            </Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<UserAddOutlined />}
            loading={loading}
            block
            style={{ height: 44, fontWeight: 600 }}
          >
            Tạo tài khoản
          </Button>

          {error && (
            <Alert style={{ marginTop: 14 }} message={error} type="error" showIcon />
          )}
          {success && (
            <Alert style={{ marginTop: 14 }} message={success} type="success" showIcon />
          )}
        </Form>

        <Divider>
          <Text type="secondary">hoặc</Text>
        </Divider>

        <Flex justify="center" gap={8}>
          <Text type="secondary">Đã có tài khoản?</Text>
          <Link to="/login">Đăng nhập</Link>
        </Flex>
      </Card>

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
    background: "linear-gradient(120deg, rgba(10,14,23,0.55), rgba(10,14,23,0.25))",
  },
  card: {
    width: 480,
    maxWidth: "94vw",
    backdropFilter: "saturate(140%) blur(8px)",
    background: "rgba(255,255,255,0.86)",
    boxShadow: "0 6px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)",
    borderRadius: 16,
  },
  footerNote: {
    position: "absolute",
    bottom: 10,
    textAlign: "center",
  },
};

export default RegisterPage;

