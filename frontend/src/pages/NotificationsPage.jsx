import React, { useState, useEffect, useCallback } from 'react';
import { List, Typography, Card, Button, Badge, Tag, Space, message, Spin } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NOTIFICATION_TYPE_COLORS = {
    ALERT: 'red',
    ASSIGNMENT: 'blue',
    OVERLOAD: 'orange',
    INFO: 'cyan'
};

export default function NotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            message.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            message.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            message.success('All notifications marked as read');
        } catch (error) {
            message.error('Failed to mark all as read');
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space>
                    <BellOutlined style={{ fontSize: 24 }} />
                    <Title level={3} style={{ margin: 0 }}>Notifications</Title>
                </Space>
                <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={markAllRead}
                    disabled={notifications.filter(n => !n.read).length === 0}
                >
                    Mark All as Read
                </Button>
            </div>

            <Card bordered={false}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    !item.read && <Button key="read" type="link" onClick={() => markAsRead(item.id)}>Mark Read</Button>
                                ]}
                                style={{
                                    background: item.read ? 'transparent' : 'rgba(22, 119, 255, 0.02)',
                                    padding: '16px 24px',
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    border: item.read ? '1px solid #f0f0f0' : '1px solid #e6f7ff'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Badge dot={!item.read} offset={[-2, 32]}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: item.read ? '#f5f5f5' : '#e6f7ff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <ClockCircleOutlined style={{ color: item.read ? '#bfbfbf' : '#1677ff' }} />
                                            </div>
                                        </Badge>
                                    }
                                    title={
                                        <Space>
                                            <Text strong={!item.read}>{item.title}</Text>
                                            <Tag color={NOTIFICATION_TYPE_COLORS[item.type] || 'default'}>{item.type}</Tag>
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <div style={{ marginBottom: 4 }}>{item.message}</div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(item.created_at).toLocaleString()}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                        locale={{ emptyText: 'No notifications found' }}
                    />
                )}
            </Card>
        </div>
    );
}
