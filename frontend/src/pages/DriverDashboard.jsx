import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Statistic, Table, Tag, Button, Typography, Space, message, Spin } from 'antd';
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, SendOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
    PENDING: 'gold', ASSIGNED: 'blue', PICKED_UP: 'cyan',
    IN_TRANSIT: 'processing', DELIVERED: 'green', CONFIRMED: 'success', CANCELLED: 'red',
};

export default function DriverDashboard() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, shipmentsRes] = await Promise.all([
                axios.get(`${API}/driver/dashboard`, { headers }),
                axios.get(`${API}/shipments`, { headers }),
            ]);
            setStats(statsRes.data);
            setShipments(shipmentsRes.data);
        } catch { message.error('Failed to load driver data'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            if (action === 'deliver') {
                navigate(`/driver/shipments/${id}`);
                return;
            }
            await axios.post(`${API}/shipments/${id}/${action}`, {}, { headers });
            message.success('Status updated!');
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Action failed');
        }
        setActionLoading(null);
    };

    const columns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking',
            render: (t, r) => <a onClick={() => navigate(`/driver/shipments/${r.id}`)} style={{ fontWeight: 600, color: '#4F46E5' }}>{t}</a>
        },
        { title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true },
        { title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => <Text type="secondary">{v} kg</Text>, width: 90 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: s => (
                <Tag color={STATUS_COLORS[s] || 'default'}>
                    {s.replace(/_/g, ' ')}
                </Tag>
            )
        },
        {
            title: 'Action', key: 'action', width: 140,
            render: (_, r) => {
                if (r.status === 'ASSIGNED') return <Button size="small" type="primary" loading={actionLoading === r.id} onClick={() => handleAction(r.id, 'pickup')}>Pick Up</Button>;
                if (r.status === 'PICKED_UP') return <Button size="small" type="primary" loading={actionLoading === r.id} onClick={() => handleAction(r.id, 'in-transit')}>Start Transit</Button>;
                if (r.status === 'IN_TRANSIT') return <Button type="primary" size="small" style={{ background: '#10B981', borderColor: '#10B981' }} onClick={() => handleAction(r.id, 'deliver')}>Deliver</Button>;
                return <Text type="secondary" style={{ fontSize: 12 }}>No Action</Text>;
            },
        },
    ];

    const activeShipments = shipments.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status));
    const completedShipments = shipments.filter(s => ['DELIVERED', 'CONFIRMED'].includes(s.status));

    const statData = [
        { title: 'Active', value: stats.active_shipments || 0, icon: <SendOutlined style={{ fontSize: 24, color: '#0EA5E9' }} />, bg: '#E0F2FE' },
        { title: 'Completed Today', value: stats.completed_today || 0, icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981' }} />, bg: '#D1FAE5' },
        { title: 'Total Lifetime', value: stats.total_completed || 0, icon: <DashboardOutlined style={{ fontSize: 24, color: '#4F46E5' }} />, bg: '#EEF2FF' }
    ];

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>Driver Dashboard</Title>
                <Text type="secondary" style={{ fontSize: 16 }}>Welcome back, ready for the road?</Text>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {statData.map((s, i) => (
                    <Col xs={24} sm={8} key={i}>
                        <Card
                            bordered={false}
                            style={{
                                height: '100%',
                                borderRadius: 12,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                border: '1px solid #F1F5F9'
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: s.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {s.icon}
                                </div>
                            </div>
                            <Statistic
                                value={s.value}
                                valueStyle={{ fontSize: 32, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}
                            />
                            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</Text>
                        </Card>
                    </Col>
                ))}

                <Col xs={24} sm={24} md={12} lg={8}>
                    <Card
                        bordered={false}
                        style={{
                            height: '100%',
                            borderRadius: 12,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid #F1F5F9'
                        }}
                        bodyStyle={{ padding: 24 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: '#F1F5F9', // Slate-100
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <CarOutlined style={{ fontSize: 24, color: '#64748B' }} />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Current Vehicle</Text>
                                {stats.vehicle ? (
                                    <>
                                        <Text strong style={{ fontSize: 16, color: '#0F172A' }}>{stats.vehicle.name}</Text>
                                        <br />
                                        <Tag style={{ marginTop: 4 }}>{stats.vehicle.plate_number}</Tag>
                                    </>
                                ) : (
                                    <Text strong style={{ color: '#EF4444' }}>No Vehicle Assigned</Text>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Active Shipments ({activeShipments.length})</span>}
                bordered={false}
                style={{
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginBottom: 24
                }}
            >
                <Table
                    columns={columns}
                    dataSource={activeShipments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Card
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Completed History ({completedShipments.length})</span>}
                bordered={false}
                style={{
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <Table
                    columns={columns.filter(c => c.key !== 'action')}
                    dataSource={completedShipments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                />
            </Card>
        </div>
    );
}
