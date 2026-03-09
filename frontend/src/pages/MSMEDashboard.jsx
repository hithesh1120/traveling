import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Card, Row, Col, Statistic, Button, Table, Modal, Form, Input,
    InputNumber, Typography, Space, message, Select, Tag
} from 'antd';
import { DatePicker } from 'antd';
import {
    SendOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined,
    ShoppingOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MSMEAnalyticsGraph from '../components/MSMEAnalyticsGraph';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MSMEDashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const headers = { Authorization: `Bearer ${token}` };

    // ── Shipment State ──
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);
    const [volume, setVolume] = useState(0);

    // ── Locations from admin (read-only for users) ──
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [companyAddresses, setCompanyAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    // ── Fetch Functions ──
    const fetchShipments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/shipments`, { headers });
            setShipments(res.data);
        } catch { message.error('Failed to load shipments'); }
        setLoading(false);
    };

    const fetchLocations = async () => {
        setLoadingAddresses(true);
        try {
            const res = await axios.get(`${API}/addresses`, { headers });
            setSavedAddresses(res.data);
            setCompanyAddresses(res.data.filter(a => a.company_id === user.company_id));
        } catch { message.warning('Could not load locations'); }
        setLoadingAddresses(false);
    };

    useEffect(() => {
        fetchShipments();
        fetchLocations();
    }, []);

    // ── Shipment Stats ──
    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'PENDING').length,
        active: shipments.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length,
        delivered: shipments.filter(s => ['DELIVERED', 'CONFIRMED'].includes(s.status)).length,
    };

    // ── Form Handlers ──
    const handleAddressSelect = (locationId) => {
        const selected = savedAddresses.find(a => a.id === locationId);
        if (!selected) return;
        // For Delivery: vendor location sets drop_address
        // For Collection: vendor location sets drop_address (vendor is the pickup)
        form.setFieldsValue({
            drop_address: selected.address,
            drop_contact: selected.contact || '',
            drop_phone: selected.phone || '',
        });
    };

    const handleCompanyLocationSelect = (locationId) => {
        const selected = savedAddresses.find(a => a.id === locationId);
        if (!selected) return;
        form.setFieldsValue({
            pickup_address: selected.address,
            pickup_contact: selected.contact || '',
            pickup_phone: selected.phone || '',
        });
    };

    const recalcVolume = () => {
        const l = form.getFieldValue('item_length') || 0;
        const b = form.getFieldValue('item_width') || 0;
        const h = form.getFieldValue('item_height') || 0;
        setVolume(l * b * h);
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
            const items = values.material_description ? [{
                name: values.material_description, quantity: qty, weight, length, width, height
            }] : [];

            let finalPickupAddress = values.pickup_address || 'Default Warehouse';
            let finalPickupContact = values.pickup_contact || 'Dispatch';
            let finalPickupPhone = values.pickup_phone || '9999999999';
            let finalDropAddress = values.drop_address;
            let finalDropContact = values.drop_contact || '';
            let finalDropPhone = values.drop_phone || '';

            if (values.order_type === 'Collection') {
                // Collection: driver picks up FROM vendor (the location selected as "Pickup Location")
                // and drops TO company location (selected in "Your Company Location")
                // In our form: vendor = drop_address (set by handleAddressSelect), company = pickup_address (set by handleCompanyLocationSelect)
                finalPickupAddress = values.drop_address;             // vendor location (driver picks up from here)
                finalPickupContact = values.drop_contact || '';
                finalPickupPhone = values.drop_phone || '';
                finalDropAddress = values.pickup_address || 'Company Warehouse';  // company location (driver drops here)
                finalDropContact = values.pickup_contact || '';
                finalDropPhone = values.pickup_phone || '';
            }

            await axios.post(`${API}/shipments`, {
                pickup_address: finalPickupAddress, pickup_contact: finalPickupContact, pickup_phone: finalPickupPhone,
                drop_address: finalDropAddress, drop_contact: finalDropContact, drop_phone: finalDropPhone,
                total_weight: totalWeight, total_volume: totalVolume,
                description: `PO: ${values.po_number || '-'} | Order Type: ${values.order_type || '-'} | Requested By: ${values.requested_by || '-'}`,
                special_instructions: values.special_instructions, items,
            }, { headers });
            message.success('Order created successfully!');
            setModalOpen(false);
            form.resetFields();
            setVolume(0);
            fetchShipments();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to create order');
        }
        setCreating(false);
    };

    // ── Columns ──
    const shipmentColumns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking_number',
            render: (t, r) => <a onClick={() => navigate(`/msme/shipments/${r.id}`)}>{t}</a>
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
        {
            title: 'Type', key: 'order_type', width: 100,
            render: (_, r) => {
                if (r.description && r.description.includes('Order Type: Collection')) {
                    return <Tag color="orange">Collection</Tag>;
                }
                if (r.description && r.description.includes('Order Type: Delivery')) {
                    return <Tag color="blue">Delivery</Tag>;
                }
                return null;
            }
        },
        { title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true },
        { title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => `${v} kg`, width: 90 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: s => <span style={{ fontWeight: 500 }}>{s.replace(/_/g, ' ')}</span>
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 110,
            render: d => new Date(d).toLocaleDateString()
        },
        {
            title: '', key: 'actions', width: 50,
            render: (_, r) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/msme/shipments/${r.id}`)} />
            )
        },
    ];

    return (
        <div>
            {/* ─── Header ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>User Dashboard</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                    New Shipment
                </Button>
            </div>

            {/* ─── Stats ─── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card bordered={false}><Statistic title="Total Shipments" value={stats.total} prefix={<ShoppingOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}><Statistic title="Pending" value={stats.pending} prefix={<ClockCircleOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}><Statistic title="Active" value={stats.active} prefix={<SendOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false}><Statistic title="Delivered" value={stats.delivered} prefix={<CheckCircleOutlined />} /></Card>
                </Col>
            </Row>

            {/* ─── Analytics ─── */}
            <MSMEAnalyticsGraph data={shipments} />

            {/* ─── All Shipments ─── */}
            <Card title="All Shipments" bordered={false}>
                <Table
                    columns={shipmentColumns}
                    dataSource={shipments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* ─── New Shipment Modal ─── */}
            <Modal
                title="Add Order"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); setVolume(0); }}
                footer={null}
                width={680}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}
                    initialValues={{ requested_by: user?.name || '' }}>
                    {/* Hidden fields for backend */}
                    <Form.Item name="pickup_address" hidden><Input /></Form.Item>
                    <Form.Item name="pickup_contact" hidden><Input /></Form.Item>
                    <Form.Item name="pickup_phone" hidden><Input /></Form.Item>
                    <Form.Item name="drop_address" hidden><Input /></Form.Item>
                    <Form.Item name="drop_contact" hidden><Input /></Form.Item>
                    <Form.Item name="drop_phone" hidden><Input /></Form.Item>

                    {/* Row 1: Location + Date */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.order_type !== cur.order_type}>
                                {({ getFieldValue }) => {
                                    const isCollection = getFieldValue('order_type') === 'Collection';
                                    return (
                                        <Form.Item name="vendor_location" label={isCollection ? "Pickup Location" : "Vendor / Location"}
                                            rules={[{ required: true, message: 'Please select a location' }]}>
                                            <Select
                                                placeholder={loadingAddresses ? 'Loading...' : 'Select location'}
                                                loading={loadingAddresses}
                                                onChange={handleAddressSelect}
                                                options={savedAddresses.map(a => ({ label: a.label, value: a.id }))}
                                                showSearch
                                                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                                                notFoundContent={savedAddresses.length === 0 && !loadingAddresses ? 'No locations available — contact your admin' : null}
                                            />
                                        </Form.Item>
                                    );
                                }}
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="order_date" label="Date" rules={[{ required: true, message: 'Please select a date' }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Row 2: Order Type + PO Number */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="order_type" label="Order Type" rules={[{ required: true, message: 'Select order type' }]}>
                                <Select placeholder="Select type" options={[
                                    { label: 'Collection', value: 'Collection' },
                                    { label: 'Delivery', value: 'Delivery' },
                                ]} onChange={() => form.resetFields(['vendor_location', 'company_location'])} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="po_number" label="PO Number">
                                <Input placeholder="Enter PO number" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Row 2b: Company location selector (Collection only) */}
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.order_type !== cur.order_type}>
                        {({ getFieldValue }) => {
                            const isCollection = getFieldValue('order_type') === 'Collection';
                            if (!isCollection) return null;
                            return (
                                <Form.Item
                                    name="company_location"
                                    label="Your Company Location (Drop-off Point)"
                                    rules={[{ required: true, message: 'Please select your company location' }]}
                                    extra="Items will be collected and delivered to this location"
                                >
                                    <Select
                                        placeholder={loadingAddresses ? 'Loading...' : 'Select your company location'}
                                        loading={loadingAddresses}
                                        onChange={handleCompanyLocationSelect}
                                        options={savedAddresses.map(a => ({ label: `${a.label} – ${a.address}`, value: a.id }))}
                                        showSearch
                                        filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                                        notFoundContent={savedAddresses.length === 0 && !loadingAddresses ? 'No locations available — contact your admin' : null}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    {/* Row 3: Material + Quantity */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="material_description" label="Material Description" rules={[{ required: true, message: 'Enter material description' }]}>
                                <Input placeholder="Describe the material" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="item_qty" label="Quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
                                <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 10" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Row 4: Weight + Requested By */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="item_weight" label="Weight (kgs)" rules={[{ required: true, message: 'Enter weight' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 50" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="requested_by" label="Requested By">
                                <Input placeholder="Your name" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Volume display */}
                    <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 16px', textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>
                        Volume: {isNaN(volume) || volume === 0 ? '0' : volume.toFixed(4)} cubic meter
                    </div>

                    {/* Row 5: Dimensions */}
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="item_length" label="Length (m)" rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} onChange={recalcVolume} placeholder="e.g. 1.2" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_width" label="Breadth (m)" rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} onChange={recalcVolume} placeholder="e.g. 0.8" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="item_height" label="Height (m)" rules={[{ required: true, message: 'Required' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} onChange={recalcVolume} placeholder="e.g. 0.5" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginTop: 8 }}>
                        <Button type="primary" htmlType="submit" loading={creating} block size="large">
                            Submit Order
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
