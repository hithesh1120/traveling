import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Statistic, Button, Table, Tag, Modal, Form, Input, InputNumber, Typography, Space, message, Divider, Select } from 'antd';
import { SendOutlined, PlusOutlined, BoxPlotOutlined, CheckCircleOutlined, ClockCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationAutocomplete from '../components/LocationAutocomplete';
import MSMEAnalyticsGraph from '../components/MSMEAnalyticsGraph';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MSMEDashboard() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchShipments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/shipments`, { headers });
            setShipments(res.data);
        } catch { message.error('Failed to load shipments'); }
        setLoading(false);
    };

    useEffect(() => { fetchShipments(); }, []);

    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'PENDING').length,
        active: shipments.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length,
        delivered: shipments.filter(s => ['DELIVERED', 'CONFIRMED'].includes(s.status)).length,
    };

    const [savedAddresses, setSavedAddresses] = useState([]);

    useEffect(() => {
        if (token) {
            setSavedAddresses([
                { id: 1, label: 'Warehouse A - 123 Logistics Way', address: '123 Logistics Way, Ind. Park', lat: 12.9716, lng: 77.5946 },
                { id: 2, label: 'Factory B - 456 Manuf. Rd', address: '456 Manuf. Rd, Ind. Zone', lat: 13.0827, lng: 80.2707 },
                { id: 3, label: 'Office HQ - 789 Corp Blvd', address: '789 Corp Blvd, City Center', lat: 28.7041, lng: 77.1025 },
            ]);
        }
    }, [token]);

    const handleAddressSelect = (type, value) => {
        const selected = savedAddresses.find(a => a.id === value);
        if (!selected) return;

        if (type === 'pickup') {
            form.setFieldsValue({
                pickup_address: selected.address,
            });
        } else {
            form.setFieldsValue({
                drop_address: selected.address,
                drop_lat: selected.lat,
                drop_lng: selected.lng
            });
        }
    };

    const handleCreate = async (values) => {
        setCreating(true);
        try {
            const qty = values.item_qty || 1;
            const weight = values.item_weight || 0;
            const length = values.item_length || 0;
            const width = values.item_width || 0;
            const height = values.item_height || 0;

            const itemVolume = length * width * height;
            const totalVolume = itemVolume * qty;
            const totalWeight = weight * qty;

            const items = values.item_name ? [{
                name: values.item_name,
                quantity: qty,
                weight: weight,
                length, width, height
            }] : [];

            await axios.post(`${API}/shipments`, {
                pickup_address: values.pickup_address,
                pickup_contact: values.pickup_contact,
                pickup_phone: values.pickup_phone,
                drop_address: values.drop_address,
                drop_contact: values.drop_contact,
                drop_phone: values.drop_phone,
                total_weight: totalWeight,
                total_volume: totalVolume,
                description: values.description,
                special_instructions: values.special_instructions,
                items,
            }, { headers });
            message.success('Shipment created!');
            setModalOpen(false);
            form.resetFields();
            fetchShipments();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to create shipment');
        }
        setCreating(false);
    };

    const statusColor = {
        PENDING: 'gold', ASSIGNED: 'blue', PICKED_UP: 'cyan',
        IN_TRANSIT: 'processing', DELIVERED: 'green', CONFIRMED: 'success', CANCELLED: 'red',
    };

    const columns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking_number',
            render: (t, r) => <a onClick={() => navigate(r.id.toString())} style={{ fontWeight: 600, color: '#4F46E5' }}>{t}</a>
        },
        {
            title: 'Item', dataIndex: 'items', key: 'items',
            render: (items) => (
                <Space direction="vertical" size={0}>
                    {items?.length > 0 ? items.map(i => (
                        <Text key={i.id} style={{ fontSize: 13 }}>{i.name}</Text>
                    )) : <Text type="secondary">-</Text>}
                </Space>
            )
        },
        { title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true },
        { title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => <Text type="secondary">{v} kg</Text> },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: s => (
                <Tag color={statusColor[s] || 'default'}>
                    {s.replace(/_/g, ' ')}
                </Tag>
            )
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created_at',
            render: d => <Text type="secondary">{new Date(d).toLocaleDateString()}</Text>
        },
    ];

    const statCards = [
        { title: 'Total Shipments', value: stats.total, icon: <ShoppingOutlined style={{ fontSize: 24, color: '#4F46E5' }} />, bg: '#EEF2FF' },
        { title: 'Pending', value: stats.pending, icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#F59E0B' }} />, bg: '#FEF3C7' },
        { title: 'Active', value: stats.active, icon: <SendOutlined style={{ fontSize: 24, color: '#0EA5E9' }} />, bg: '#E0F2FE' },
        { title: 'Delivered', value: stats.delivered, icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981' }} />, bg: '#D1FAE5' },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>MSME Portal</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Manage your logistics and shipments</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} size="large" style={{ borderRadius: 8 }}>
                    New Shipment
                </Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {statCards.map((s, i) => (
                    <Col xs={24} sm={12} md={6} key={i}>
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
            </Row>

            <Card
                bordered={false}
                className="mb-6"
                style={{
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginBottom: 32,
                    overflow: 'hidden'
                }}
            >
                <div style={{ padding: '24px 24px 0' }}>
                    <Title level={4} style={{ margin: 0 }}>Shipment Volume</Title>
                </div>
                <MSMEAnalyticsGraph data={shipments} />
            </Card>

            <Card
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>Recent Shipments</span>}
                bordered={false}
                style={{
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <Table
                    columns={columns}
                    dataSource={shipments.slice(0, 5)}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="middle"
                />
            </Card>

            <Modal
                title="Create New Shipment"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={700}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 24 }}>
                    {/* Pickup Details Removed as per request. Auto-filling default. */}
                    <Form.Item name="pickup_address" initialValue="Default Warehouse - 123 Main St" hidden><Input /></Form.Item>
                    <Form.Item name="pickup_contact" initialValue="Dispatch Manager" hidden><Input /></Form.Item>
                    <Form.Item name="pickup_phone" initialValue="9999999999" hidden><Input /></Form.Item>

                    <Divider orientation="left" style={{ borderColor: '#E2E8F0' }}><Text strong style={{ color: '#4F46E5' }}>Drop Details</Text></Divider>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item label="Saved Drop Location">
                                <Select
                                    placeholder="Select a saved location"
                                    onChange={(val) => handleAddressSelect('drop', val)}
                                    options={savedAddresses.map(a => ({ label: a.label, value: a.id }))}
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="drop_lat" label="Drop Latitude" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} precision={6} size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="drop_lng" label="Drop Longitude" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} precision={6} size="large" />
                            </Form.Item>
                        </Col>
                        <Form.Item name="drop_address" hidden><Input /></Form.Item>

                        <Col span={12}>
                            <Form.Item name="drop_contact" label="Contact Name"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="drop_phone" label="Phone"><Input size="large" /></Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" style={{ borderColor: '#E2E8F0' }}><Text strong style={{ color: '#4F46E5' }}>Cargo Details</Text></Divider>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="item_name" label="Item Name"><Input size="large" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_qty" label="Qty"><InputNumber min={1} style={{ width: '100%' }} size="large" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_weight" label="Item Weight (kg)"><InputNumber min={0} style={{ width: '100%' }} size="large" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_length" label="Length (m)"><InputNumber min={0} style={{ width: '100%' }} size="large" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_width" label="Width (m)"><InputNumber min={0} style={{ width: '100%' }} size="large" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_height" label="Height (m)"><InputNumber min={0} style={{ width: '100%' }} size="large" /></Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
                    <Form.Item name="special_instructions" label="Special Instructions"><Input.TextArea rows={2} /></Form.Item>

                    <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={creating} block size="large" style={{ borderRadius: 8, height: 48, fontWeight: 600 }}>
                            Create Shipment
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
