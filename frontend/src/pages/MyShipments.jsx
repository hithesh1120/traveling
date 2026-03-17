import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Table, Tag, Typography, Button, message, Card, Modal, Select, Form, Input, InputNumber, Space, DatePicker, Row, Col } from 'antd';
import { EyeOutlined, CompassOutlined, PlusOutlined, ClockCircleOutlined, SendOutlined, CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdvancedFilterBar from '../components/AdvancedFilterBar';

const { Title } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
    PENDING: 'default', ASSIGNED: 'default', PICKED_UP: 'default',
    IN_TRANSIT: 'default', DELIVERED: 'default', CONFIRMED: 'default', CANCELLED: 'default',
};

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function MyShipments() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize filters from URL params
    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        return status ? { status: [status] } : {};
    });

    // Bulk Assignment State
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [assigning, setAssigning] = useState(false);

    // New Shipment State (for MSME)
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);
    const [volume, setVolume] = useState(0);
    const [myCompany, setMyCompany] = useState(null);
    const [otherCompanies, setOtherCompanies] = useState([]);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };
    const basePath = user?.role === 'MSME' ? '/msme' : user?.role === 'DRIVER' ? '/driver' : '/admin';

    const fetchShipments = useCallback(async (currentFilters = {}) => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (currentFilters.q) params.append('q', currentFilters.q);
            if (currentFilters.status && currentFilters.status.length > 0) {
                currentFilters.status.forEach(s => params.append('status', s));
            }
            if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
            if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);

            // New filters
            if (currentFilters.driver_id) params.append('driver_id', currentFilters.driver_id);
            if (currentFilters.vehicle_id) params.append('vehicle_id', currentFilters.vehicle_id);
            if (currentFilters.delayed) params.append('delayed', 'true');

            const res = await axios.get(`${API}/shipments?${params.toString()}`, { headers });
            setShipments(res.data);
        } catch (err) {
            console.error(err);
            message.error('Failed to load shipments');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchVehicles = useCallback(async () => {
        if (user?.role === 'ADMIN') {
            try {
                const res = await axios.get(`${API}/vehicles`, { headers });
                setVehicles(res.data);
            } catch (err) {
                console.error("Failed to load vehicles");
            }
        }
    }, [user, token]);

    const fetchCompanies = useCallback(async () => {
        if (user?.role !== 'MSME') return;
        setLoadingCompanies(true);
        try {
            const [meRes, othersRes, addrRes] = await Promise.all([
                axios.get(`${API}/companies/me`, { headers }),
                axios.get(`${API}/companies/others`, { headers }),
                axios.get(`${API}/addresses`, { headers }),
            ]);
            setMyCompany(meRes.data);
            setOtherCompanies(othersRes.data);
            setSavedAddresses(addrRes.data);
        } catch { message.warning('Could not load company data'); }
        setLoadingCompanies(false);
    }, [user, token]);

    useEffect(() => {
        fetchShipments(filters);
        fetchVehicles();
        fetchCompanies();
    }, [fetchShipments, fetchVehicles, fetchCompanies]);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: !['PENDING', 'ASSIGNED'].includes(record.status), // Allow pending and assigned
        }),
    };

    const handleBulkAssign = async () => {
        if (!selectedVehicle) {
            message.error("Please select a vehicle");
            return;
        }

        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        if (!vehicle) return;

        if (!vehicle.current_driver_id) {
            message.error("Selected vehicle does not have an assigned driver. Please assign a driver to the vehicle first.");
            return;
        }

        setAssigning(true);
        let successCount = 0;
        let failCount = 0;

        try {
            await Promise.all(selectedRowKeys.map(async (shipmentId) => {
                try {
                    await axios.post(`${API}/shipments/${shipmentId}/assign`, {
                        vehicle_id: vehicle.id,
                        driver_id: vehicle.current_driver_id
                    }, { headers });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to assign shipment ${shipmentId}`, error);
                    failCount++;
                }
            }));

            if (successCount > 0) message.success(`Successfully assigned ${successCount} shipments`);
            if (failCount > 0) message.error(`Failed to assign ${failCount} shipments`);

            setIsModalOpen(false);
            setSelectedRowKeys([]);
            setSelectedVehicle(null);
            fetchShipments(filters);
            fetchVehicles(); // Update vehicle capacities
        } catch (error) {
            message.error("Bulk assignment failed");
        } finally {
            setAssigning(false);
        }
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
            const selectedValue = values.vendor_location;
            let selectedLoc = null;

            if (typeof selectedValue === 'string' && selectedValue.startsWith('company-')) {
                const compId = parseInt(selectedValue.replace('company-', ''));
                const comp = otherCompanies.find(c => c.id === compId);
                if (comp) selectedLoc = { address: comp.address, lat: comp.lat, lng: comp.lng, name: comp.name };
            } else if (typeof selectedValue === 'string' && selectedValue.startsWith('addr-')) {
                const addrId = parseInt(selectedValue.replace('addr-', ''));
                const addr = savedAddresses.find(a => a.id === addrId);
                if (addr) selectedLoc = { address: addr.address, lat: addr.lat, lng: addr.lng, name: addr.label };
            }

            if (!selectedLoc) {
                message.error("Please select a valid location.");
                setCreating(false);
                return;
            }
            if (!myCompany || !myCompany.lat || !myCompany.lng) {
                message.error("Your company has no registered location. Please ask your admin to update it.");
                setCreating(false);
                return;
            }

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

            let finalPickupAddress, finalPickupContact, finalPickupPhone, finalPickupLat, finalPickupLng;
            let finalDropAddress, finalDropContact, finalDropPhone, finalDropLat, finalDropLng;

            if (values.order_type === 'Collection') {
                finalPickupAddress = selectedLoc.address;
                finalPickupContact = selectedLoc.name;
                finalPickupPhone = '';
                finalPickupLat = selectedLoc.lat;
                finalPickupLng = selectedLoc.lng;

                finalDropAddress = myCompany.address;
                finalDropContact = myCompany.name;
                finalDropPhone = '';
                finalDropLat = myCompany.lat;
                finalDropLng = myCompany.lng;
            } else {
                finalPickupAddress = myCompany.address;
                finalPickupContact = myCompany.name;
                finalPickupPhone = '';
                finalPickupLat = myCompany.lat;
                finalPickupLng = myCompany.lng;

                finalDropAddress = selectedLoc.address;
                finalDropContact = selectedLoc.name;
                finalDropPhone = '';
                finalDropLat = selectedLoc.lat;
                finalDropLng = selectedLoc.lng;
            }

            await axios.post(`${API}/shipments`, {
                pickup_address: finalPickupAddress, pickup_contact: finalPickupContact, pickup_phone: finalPickupPhone,
                pickup_lat: finalPickupLat, pickup_lng: finalPickupLng,
                drop_address: finalDropAddress, drop_contact: finalDropContact, drop_phone: finalDropPhone,
                drop_lat: finalDropLat, drop_lng: finalDropLng,
                total_weight: totalWeight, total_volume: totalVolume,
                description: `PO: ${values.po_number || '-'} | Order Type: ${values.order_type || '-'} | Requested By: ${values.requested_by || '-'}`,
                special_instructions: values.special_instructions, items,
            }, { headers });
            message.success('Order created successfully!');
            setCreateModalOpen(false);
            form.resetFields();
            setVolume(0);
            fetchShipments(filters);
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to create order');
        }
        setCreating(false);
    };

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
        fetchShipments(newFilters);
    };

    const columns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking',
            render: (t, r) => <a onClick={() => navigate(`${basePath}/shipments/${r.id}`)}>{t}</a>
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
        {
            title: 'Item', dataIndex: 'items', key: 'items',
            render: (items) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {items?.length > 0 ? items.map(i => (
                        <span key={i.id} style={{ fontSize: 13 }}>{i.name}</span>
                    )) : <span style={{ color: '#999' }}>-</span>}
                </div>
            )
        },
        {
            title: 'Company',
            key: 'company',
            render: (_, r) => {
                const isCollection = r.description && r.description.includes('Order Type: Collection');
                // For Collection, vendor is the pickup location. For Delivery, vendor is the drop location.
                return <span>{isCollection ? r.pickup_contact : r.drop_contact}</span>;
            },
            ellipsis: true,
            width: 250,
        },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => `${v} kg`, width: 90 },
        { title: 'Volume', dataIndex: 'total_volume', key: 'volume', render: v => `${v} m³`, width: 90 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: s => <span style={{ fontWeight: 500 }}>{s.replace(/_/g, ' ')}</span>
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created', width: 110,
            render: d => new Date(d).toLocaleDateString()
        },
        {
            title: '', key: 'actions', width: 100,
            render: (_, r) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`${basePath}/shipments/${r.id}`)} />
                </div>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>All Shipments</Title>
                {user?.role === 'MSME' && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                        New Shipment
                    </Button>
                )}
            </div>

            <AdvancedFilterBar
                onFilter={handleFilter}
                statusOptions={STATUS_OPTIONS}

            />

            {user?.role === 'ADMIN' && selectedRowKeys.length > 0 && (
                <div style={{ marginBottom: 16, padding: '8px 16px', background: '#fffbeb', border: '1px solid #93c5fd', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a8071a', fontWeight: 500 }}>Selected {selectedRowKeys.length} items</span>
                    <Button type="primary" danger onClick={() => setIsModalOpen(true)}>
                        Assign / Reassign to Vehicle
                    </Button>
                </div>
            )}

            <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Table
                    rowSelection={user?.role === 'ADMIN' ? rowSelection : undefined}
                    columns={columns}
                    dataSource={shipments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title="Bulk Assign Shipments"
                open={isModalOpen}
                onOk={handleBulkAssign}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={assigning}
                okText="Assign"
            >
                <p>Assign <b>{selectedRowKeys.length}</b> shipments to:</p>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Select a Vehicle"
                    onChange={setSelectedVehicle}
                    value={selectedVehicle}
                    options={vehicles.map(v => {
                        const remainingWt = v.weight_capacity - v.current_weight_used;
                        const remainingVol = v.volume_capacity - v.current_volume_used;
                        return {
                            value: v.id,
                            label: (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{v.plate_number} ({v.name})</span>
                                    <span style={{ fontSize: 11, color: '#999' }}>
                                        {v.current_driver_id ? 'Has Driver' : 'No Driver'} | {remainingWt}kg left
                                    </span>
                                </div>
                            ),
                            disabled: !v.current_driver_id // Disable vehicles without drivers
                        };
                    })}
                />
                {!selectedVehicle && <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>Only vehicles with assigned drivers are shown.</p>}
            </Modal>

            {/* ─── New Shipment Modal ─── */}
            <Modal
                title="Add Order"
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); setVolume(0); }}
                footer={null}
                width={680}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}
                    initialValues={{ requested_by: user?.name || '' }}>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.order_type !== cur.order_type}>
                                {({ getFieldValue }) => {
                                    const isCollection = getFieldValue('order_type') === 'Collection';
                                    return (
                                        <Form.Item name="vendor_location" label={isCollection ? "Pickup Location" : "Drop-off Location"}
                                            rules={[{ required: true, message: 'Please select a location' }]}>
                                            <Select
                                                placeholder={loadingCompanies ? 'Loading...' : 'Select location'}
                                                loading={loadingCompanies}
                                                showSearch
                                                filterOption={(input, option) => (option.label || '').toLowerCase().includes(input.toLowerCase())}
                                                notFoundContent={otherCompanies.length === 0 && savedAddresses.length === 0 && !loadingCompanies ? 'No locations available' : null}
                                                options={[
                                                    ...(otherCompanies.length > 0 ? [{
                                                        label: 'Companies',
                                                        options: otherCompanies.map(c => ({ label: c.name, value: `company-${c.id}` }))
                                                    }] : []),
                                                    ...(savedAddresses.length > 0 ? [{
                                                        label: 'Saved Locations',
                                                        options: savedAddresses.map(a => ({ label: a.label, value: `addr-${a.id}` }))
                                                    }] : []),
                                                ]}
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

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="order_type" label="Order Type" rules={[{ required: true, message: 'Select order type' }]}>
                                <Select placeholder="Select type" options={[
                                    { label: 'Collection', value: 'Collection' },
                                    { label: 'Delivery', value: 'Delivery' },
                                ]} onChange={() => form.resetFields(['vendor_location'])} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="po_number" label="PO Number">
                                <Input placeholder="Enter PO number" />
                            </Form.Item>
                        </Col>
                    </Row>

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

                    <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 16px', textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>
                        Volume: {isNaN(volume) || volume === 0 ? '0' : volume.toFixed(4)} cubic meter
                    </div>

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

