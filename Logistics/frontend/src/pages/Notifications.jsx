import { useState, useEffect } from 'react';
import { List, Typography, Button, Tag, Card, Empty, Spin, message } from 'antd';
import { CheckOutlined, BellOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Notifications() {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            message.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchNotifications();
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            message.success('Marked as read');
        } catch (err) {
            message.error('Failed to update notification');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            message.success('All marked as read');
        } catch (err) {
            message.error('Failed to update notifications');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'ALERT': return 'red';
            case 'ASSIGNMENT': return 'blue';
            case 'SHIPMENT': return 'green';
            case 'OVERLOAD': return 'orange';
            default: return 'default';
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <BellOutlined /> Notifications
                </Title>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>Refresh</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={markAllAsRead}>
                        Mark All Read
                    </Button>
                </div>
            </div>

            <Card loading={loading}>
                {notifications.length === 0 ? (
                    <Empty description="No notifications found" />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    !item.read && (
                                        <Button type="link" onClick={() => markAsRead(item.id)}>
                                            Mark as Read
                                        </Button>
                                    )
                                ]}
                                style={{
                                    background: item.read ? 'transparent' : '#F0F9FF',
                                    padding: 16,
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    border: item.read ? '1px solid #f0f0f0' : '1px solid #BAE6FD'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div style={{
                                            marginTop: 4,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: item.read ? '#ccc' : '#1890ff'
                                        }} />
                                    }
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong={!item.read} style={{ fontSize: 16 }}>{item.title}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(item.created_at).toLocaleString()}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <div style={{ marginBottom: 8 }}>{item.message}</div>
                                            <Tag color={getTypeColor(item.type)}>{item.type}</Tag>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
}
