import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Statistic, Table, Tag, Button, Typography, Space, message, Spin, Modal, Form, Input } from 'antd';
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, SendOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
    PENDING: 'gold', ASSIGNED: 'blue', PICKED_UP: 'cyan',
    IN_TRANSIT: 'processing', DELIVERED: 'green', CONFIRMED: 'success', CANCELLED: 'red',
};

// Map backend statuses to display labels
const STATUS_DISPLAY = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    PICKED_UP: 'STARTED',
    IN_TRANSIT: 'STARTED',
    DELIVERED: 'DELIVERED',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
};

function getOrderType(shipment) {
    if (shipment.description?.includes('Order Type: Collection')) return 'Collection';
    if (shipment.description?.includes('Order Type: Delivery')) return 'Delivery';
    return null;
}

export default function DriverDashboard() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [deliverModalOpen, setDeliverModalOpen] = useState(false);
    const [deliverShipmentId, setDeliverShipmentId] = useState(null);
    const [deliverForm] = Form.useForm();
    const [delivering, setDelivering] = useState(false);

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

    // "Start" = pickup + in-transit in one step
    const handleStart = async (id) => {
        setActionLoading(id);
        try {
            // First: pickup
            await axios.post(`${API}/shipments/${id}/pickup`, {}, { headers });
            // Then: in-transit
            await axios.post(`${API}/shipments/${id}/in-transit`, {}, { headers });
            message.success('Shipment started! Status: In Transit');
            fetchData();
        } catch (err) {
            // If already picked up, try just in-transit
            try {
                await axios.post(`${API}/shipments/${id}/in-transit`, {}, { headers });
                message.success('Shipment started! Status: In Transit');
                fetchData();
            } catch (err2) {
                message.error(err2.response?.data?.detail || 'Failed to start shipment');
            }
        }
        setActionLoading(null);
    };

    const openDeliverModal = (id) => {
        setDeliverShipmentId(id);
        setDeliverModalOpen(true);
    };

    const handleDeliver = async (values) => {
        if (!deliverShipmentId) return;
        setDelivering(true);
        try {
            await axios.post(`${API}/shipments/${deliverShipmentId}/deliver`, values, { headers });
            message.success('Shipment delivered successfully!');
            setDeliverModalOpen(false);
            deliverForm.resetFields();
            setDeliverShipmentId(null);
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Delivery failed');
        }
        setDelivering(false);
    };

    const columns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking',
            render: (t, r) => <a onClick={() => navigate(`/driver/shipments/${r.id}`)}>{t}</a>
        },
        {
            title: 'Type', key: 'order_type', width: 110,
            render: (_, r) => {
                const type = getOrderType(r);
                if (!type) return <span style={{ color: '#bfbfbf' }}>—</span>;
                return <Tag color={type === 'Collection' ? 'orange' : 'blue'}>{type}</Tag>;
            }
        },
        { title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true },
        { title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => `${v} kg`, width: 90 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: s => {
                const label = STATUS_DISPLAY[s] || s.replace(/_/g, ' ');
                const color = STATUS_COLORS[s] || 'default';
                return <Tag color={color} style={{ fontWeight: 500 }}>{label}</Tag>;
            }
        },
        {
            title: 'Action', key: 'action', width: 120,
            render: (_, r) => {
                if (r.status === 'ASSIGNED') {
                    return (
                        <Button
                            size="small"
                            type="primary"
                            loading={actionLoading === r.id}
                            onClick={() => handleStart(r.id)}
                            style={{ background: '#1677ff' }}
                        >
                            Start
                        </Button>
                    );
                }
                if (r.status === 'PICKED_UP' || r.status === 'IN_TRANSIT') {
                    return (
                        <Button
                            size="small"
                            type="primary"
                            loading={actionLoading === r.id}
                            onClick={() => openDeliverModal(r.id)}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Deliver
                        </Button>
                    );
                }
                return <Tag color={STATUS_COLORS[r.status] || 'default'} style={{ fontWeight: 500 }}>{STATUS_DISPLAY[r.status] || r.status.replace(/_/g, ' ')}</Tag>;
            },
        },
    ];

    const activeShipments = shipments.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status));
    const completedShipments = shipments.filter(s => ['DELIVERED', 'CONFIRMED'].includes(s.status));

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Driver Dashboard</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic title="Active Shipments" value={stats.active_shipments || 0} prefix={<SendOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic title="Completed Today" value={stats.completed_today || 0} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        <Statistic title="Total Completed" value={stats.total_completed || 0} prefix={<DashboardOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}>
                        {stats.vehicle ? (
                            <div>
                                <Statistic title="Vehicle" value={stats.vehicle.name} prefix={<CarOutlined />} valueStyle={{ fontSize: 18 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>{stats.vehicle.plate_number}</Text>
                            </div>
                        ) : (
                            <Statistic title="Vehicle" value="None Assigned" prefix={<CarOutlined />} valueStyle={{ fontSize: 16 }} />
                        )}
                    </Card>
                </Col>
            </Row>

            <Card title={`Active Shipments (${activeShipments.length})`} bordered={false} style={{ marginBottom: 24 }}>
                <Table columns={columns} dataSource={activeShipments} rowKey="id" loading={loading} pagination={false} size="middle" scroll={{ x: 900 }} />
            </Card>

            <Card title={`Completed (${completedShipments.length})`} bordered={false}>
                <Table
                    columns={columns.filter(c => c.key !== 'action')}
                    dataSource={completedShipments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 900 }}
                />
            </Card>

            {/* Deliver Modal */}
            <Modal
                title="Confirm Delivery"
                open={deliverModalOpen}
                onCancel={() => { setDeliverModalOpen(false); deliverForm.resetFields(); }}
                footer={null}
            >
                <Form form={deliverForm} layout="vertical" onFinish={handleDeliver}>
                    <Form.Item name="receiver_name" label="Receiver Name" rules={[{ required: true, message: 'Please enter receiver name' }]}>
                        <Input placeholder="Name of the person receiving" />
                    </Form.Item>
                    <Form.Item name="receiver_phone" label="Receiver Phone">
                        <Input placeholder="Phone number" />
                    </Form.Item>
                    <Form.Item name="photo_url" label="Proof of Delivery (Photo URL)">
                        <Input placeholder="https://example.com/photo.jpg" />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={2} placeholder="Any notes about the delivery" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={delivering} block style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        Confirm Delivery
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
