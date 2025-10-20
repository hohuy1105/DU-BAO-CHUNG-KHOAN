import React, { useContext } from 'react';
import { Layout, Button, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
    const { currentUser, logout } = useContext(AuthContext);

    return (
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <h1 style={{ margin: 0 }}>Trạm phân tích Cổ phiếu</h1>
            <Space>
                {currentUser ? (
                    <>
                        <Text>Chào, {currentUser.email}</Text>
                        <Button type="primary" onClick={logout}>Đăng xuất</Button>
                    </>
                ) : (
                    <>
                        <Link to="/login"><Button>Đăng nhập</Button></Link>
                        <Link to="/register"><Button type="primary">Đăng ký</Button></Link>
                    </>
                )}
            </Space>
        </Header>
    );
};

export default AppHeader;