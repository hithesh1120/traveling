import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Descriptions, Tag, Timeline, Typography, Button, Space, Divider, Row, Col, message, Modal, Form, Input, Spin, Table, Steps } from 'antd';
import {
    CheckCircleOutlined, ClockCircleOutlined, CarOutlined, SendOutlined,
    ExclamationCircleOutlined, StopOutlined, UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
    PENDING: 'gold', ASSIGNED: 'blue', PICKED_UP: 'cyan',
    IN_TRANSIT: 'processing', DELIVERED: 'green', CONFIRMED: 'success', CANCELLED: 'red',
};

// Map raw statuses to timeline labels
const TIMELINE_LABEL_MAP = {
    PENDING: 'Order Created',
    ASSIGNED: 'Assigned',
    PICKED_UP: 'Started',
    IN_TRANSIT: 'Started',
    DELIVERED: 'Delivered',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
};

// Progress steps for the visual stepper
const PROGRESS_STEPS = [
    { key: 'ASSIGNED', label: 'Assigned', statuses: ['ASSIGNED'] },
    { key: 'STARTED', label: 'Started', statuses: ['PICKED_UP', 'IN_TRANSIT'] },
    { key: 'DELIVERED', label: 'Delivered', statuses: ['DELIVERED'] },
    { key: 'CONFIRMED', label: 'Confirmed', statuses: ['CONFIRMED'] },
];

function getStepIndex(status) {
    if (['CONFIRMED'].includes(status)) return 3;
    if (['DELIVERED'].includes(status)) return 2;
    if (['PICKED_UP', 'IN_TRANSIT'].includes(status)) return 1;
    if (['ASSIGNED'].includes(status)) return 0;
    return -1;
}

export default function ShipmentDetail() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deliverModalOpen, setDeliverModalOpen] = useState(false);
    const [deliverForm] = Form.useForm();

    const headers = { Authorization: `Bearer ${token}` };

    const fetchShipment = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/shipments/${id}`, { headers });
            setShipment(res.data);
        } catch { message.error('Failed to load shipment'); }
        setLoading(false);
    };

    useEffect(() => { fetchShipment(); }, [id]);

    const performAction = async (action, body = null) => {
        setActionLoading(true);
        try {
            if (body) {
                await axios.post(`${API}/shipments/${id}/${action}`, body, { headers });
            } else {
                await axios.post(`${API}/shipments/${id}/${action}`, {}, { headers });
            }
            message.success(`Action completed`);
            fetchShipment();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Action failed');
        }
        setActionLoading(false);
    };

    // "Start" combines pickup + in-transit
    const handleStart = async () => {
        setActionLoading(true);
        try {
            await axios.post(`${API}/shipments/${id}/pickup`, {}, { headers });
            await axios.post(`${API}/shipments/${id}/in-transit`, {}, { headers });
            message.success('Shipment started!');
            fetchShipment();
        } catch (err) {
            // If already picked up, try just in-transit
            try {
                await axios.post(`${API}/shipments/${id}/in-transit`, {}, { headers });
                message.success('Shipment started!');
                fetchShipment();
            } catch (err2) {
                message.error(err2.response?.data?.detail || 'Failed to start shipment');
            }
        }
        setActionLoading(false);
    };

    const handleDeliver = async (values) => {
        await performAction('deliver', values);
        setDeliverModalOpen(false);
        deliverForm.resetFields();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!shipment) return <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">Shipment not found</Text></div>;

    const isDriver = user?.role === 'DRIVER';
    const isAdmin = user?.role === 'ADMIN';
    const isSender = user?.role === 'MSME';

    // Build deduplicated timeline entries (merge PICKED_UP + IN_TRANSIT into "Started")
    const rawTimeline = (shipment.timeline || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Deduplicate: if both PICKED_UP and IN_TRANSIT exist, only show one "Started" entry (the IN_TRANSIT one)
    const seenStarted = false;
    const dedupedTimeline = rawTimeline.reduce((acc, entry) => {
        const label = TIMELINE_LABEL_MAP[entry.status] || entry.status;
        // Skip PICKED_UP if IN_TRANSIT already exists or will exist
        if (entry.status === 'PICKED_UP') {
            const hasInTransit = rawTimeline.some(e => e.status === 'IN_TRANSIT');
            if (hasInTransit) return acc; // skip, IN_TRANSIT will cover it
        }
        acc.push({ ...entry, displayLabel: label });
        return acc;
    }, []);

    const stepIndex = getStepIndex(shipment.status);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space>
                    <Title level={3} style={{ margin: 0 }}>{shipment.tracking_number}</Title>
                    <Tag color={STATUS_COLORS[shipment.status] || 'default'} style={{ fontSize: 13, padding: '2px 10px' }}>
                        {TIMELINE_LABEL_MAP[shipment.status] || shipment.status.replace(/_/g, ' ')}
                    </Tag>
                </Space>

                <Space>
                    {/* Driver actions — simplified to Start + Deliver */}
                    {isDriver && shipment.status === 'ASSIGNED' && (
                        <Button type="primary" onClick={handleStart} loading={actionLoading} style={{ background: '#1677ff' }}>
                            Start
                        </Button>
                    )}
                    {isDriver && (shipment.status === 'PICKED_UP' || shipment.status === 'IN_TRANSIT') && (
                        <Button type="primary" onClick={() => setDeliverModalOpen(true)} loading={actionLoading} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                            Deliver
                        </Button>
                    )}

                    {/* Sender/Admin confirmation */}
                    {(isSender || isAdmin) && shipment.status === 'DELIVERED' && (
                        <Button type="primary" style={{ background: '#52c41a' }} onClick={() => performAction('confirm-receipt')} loading={actionLoading}>
                            Confirm Receipt
                        </Button>
                    )}

                    {/* Admin dispatch */}
                    {isAdmin && shipment.status === 'PENDING' && (
                        <Button type="primary" onClick={() => performAction('dispatch')} loading={actionLoading}>
                            Auto Dispatch
                        </Button>
                    )}

                    {/* Receipt Link */}
                    {['DELIVERED', 'CONFIRMED'].includes(shipment.status) && (
                        <Button onClick={() => window.open(`/receipt/${shipment.id}`, '_blank')}>
                            View Receipt
                        </Button>
                    )}
                </Space>
            </div>

            {/* Progress Steps */}
            {!['PENDING', 'CANCELLED'].includes(shipment.status) && (
                <Card bordered={false} style={{ marginBottom: 24 }}>
                    <Steps
                        current={stepIndex}
                        size="small"
                        items={PROGRESS_STEPS.map((step, idx) => ({
                            title: step.label,
                            status: idx < stepIndex ? 'finish' : idx === stepIndex ? 'process' : 'wait',
                        }))}
                        style={{ padding: '8px 0' }}
                    />
                </Card>
            )}

            <Row gutter={[24, 24]}>
                {/* 1. Timeline & Assignment (Side by Side) */}
                <Col xs={24} lg={12}>
                    <Card title="Timeline" bordered={false} style={{ height: '100%' }}>
                        {dedupedTimeline.length > 0 ? (
                            <Timeline
                                items={dedupedTimeline.map(entry => ({
                                    color: entry.status === 'CONFIRMED' ? 'green' : entry.status === 'DELIVERED' ? 'blue' : entry.status === 'CANCELLED' ? 'red' : 'gray',
                                    dot: <div style={{
                                        width: 14, height: 14, border: '2px solid',
                                        borderColor: entry.status === 'CONFIRMED' ? '#52c41a' : entry.status === 'DELIVERED' ? '#1677ff' : entry.status === 'CANCELLED' ? '#ff4d4f' : '#facc15',
                                        borderRadius: '50%', backgroundColor: 'transparent'
                                    }} />,
                                    children: (
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                                                {entry.displayLabel}
                                            </div>
                                            {entry.notes && <div><Text type="secondary" style={{ fontSize: 13 }}>{entry.notes}</Text></div>}
                                            {entry.updated_by && (
                                                <div><Text type="secondary" style={{ fontSize: 12 }}>
                                                    by {entry.updated_by.name || entry.updated_by.email}
                                                </Text></div>
                                            )}
                                            <div><Text type="secondary" style={{ fontSize: 11 }}>
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </Text></div>
                                        </div>
                                    ),
                                }))}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#bfbfbf' }}>
                                <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                <div>No timeline entries yet.</div>
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Assignment" bordered={false} style={{ height: '100%' }}>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Vehicle">
                                {shipment.assigned_vehicle
                                    ? <span style={{ color: '#1677ff', fontWeight: 500 }}>{shipment.assigned_vehicle.plate_number} ({shipment.assigned_vehicle.name})</span>
                                    : shipment.assigned_vehicle_id
                                        ? <span style={{ color: '#1677ff' }}>Vehicle #{shipment.assigned_vehicle_id}</span>
                                        : <span style={{ color: '#ff4d4f' }}>Not assigned</span>
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="Driver">
                                {shipment.assigned_driver
                                    ? <span style={{ color: '#1677ff', fontWeight: 500 }}>{shipment.assigned_driver.name || shipment.assigned_driver.email}</span>
                                    : shipment.assigned_driver_id
                                        ? <span style={{ color: '#1677ff' }}>Driver #{shipment.assigned_driver_id}</span>
                                        : <span style={{ color: '#ff4d4f' }}>Not assigned</span>
                                }
                            </Descriptions.Item>
                            {shipment.assigned_at && (
                                <Descriptions.Item label="Assigned At">
                                    {new Date(shipment.assigned_at).toLocaleString()}
                                </Descriptions.Item>
                            )}
                            {shipment.delivered_at && (
                                <Descriptions.Item label="Delivered At">
                                    {new Date(shipment.delivered_at).toLocaleString()}
                                </Descriptions.Item>
                            )}
                            {shipment.confirmed_at && (
                                <Descriptions.Item label="Confirmed At">
                                    {new Date(shipment.confirmed_at).toLocaleString()}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Special Instructions">
                                {shipment.special_instructions || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                {/* 2. Shipment Details (Full Width Table) */}
                <Col span={24}>
                    <Card title="Shipment Details" bordered={false}>
                        <Table
                            dataSource={[shipment]}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: text => <Tag color={STATUS_COLORS[text]}>{TIMELINE_LABEL_MAP[text] || text}</Tag> },
                                { title: 'Created', dataIndex: 'created_at', key: 'created', render: d => new Date(d).toLocaleString() },
                                { title: 'Total Weight', dataIndex: 'total_weight', key: 'weight', render: v => `${v} kg` },
                                { title: 'Total Volume', dataIndex: 'total_volume', key: 'volume', render: v => `${v} m³` },
                                { title: 'Pickup Address', dataIndex: 'pickup_address', key: 'pickup' },
                                { title: 'Pickup Contact', dataIndex: 'pickup_contact', key: 'p_contact' },
                                { title: 'Pickup Phone', dataIndex: 'pickup_phone', key: 'p_phone' },
                                { title: 'Drop Address', dataIndex: 'drop_address', key: 'drop' },
                                { title: 'Drop Contact', dataIndex: 'drop_contact', key: 'd_contact' },
                                { title: 'Drop Phone', dataIndex: 'drop_phone', key: 'd_phone' },
                                { title: 'Description', dataIndex: 'description', key: 'desc' },
                            ]}
                        />
                    </Card>
                </Col>

                {/* 3. Items (Full Width) */}
                <Col span={24}>
                    {shipment.items?.length > 0 ? (
                        <Card title={`Items (${shipment.items.length})`} bordered={false}>
                            <Row gutter={[16, 16]}>
                                {shipment.items.map((item, i) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                                        <Card type="inner" size="small" style={{ background: '#fafafa' }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                                            <div style={{ fontSize: 13, color: '#666' }}>
                                                Qty: {item.quantity} <br/>
                                                Weight: {item.weight} kg
                                            </div>
                                            {item.description && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.description}</div>}
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    ) : (
                        <Card title="Items" bordered={false}><Text type="secondary">No items found.</Text></Card>
                    )}
                </Col>
            </Row>

            {/* Deliver modal */}
            <Modal title="Confirm Delivery" open={deliverModalOpen} onCancel={() => setDeliverModalOpen(false)} footer={null}>
                <Form form={deliverForm} layout="vertical" onFinish={handleDeliver}>
                    <Form.Item name="receiver_name" label="Receiver Name" rules={[{ required: true }]}>
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
                    <Button type="primary" htmlType="submit" loading={actionLoading} block style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        Confirm Delivery
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
