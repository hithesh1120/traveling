import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Table, Card, Tag, Button, Modal, Form, Input, InputNumber, Select,
    Typography, Space, Progress, message, Switch, Tooltip, Checkbox
} from 'antd';
import {
    PlusOutlined, CarOutlined, EditOutlined, EyeOutlined, SendOutlined,
    EnvironmentOutlined, DeleteOutlined, CompassOutlined, GlobalOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdvancedFilterBar from '../components/AdvancedFilterBar';
import TruckCargoVisualizer from '../components/TruckCargoVisualizer';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const VEHICLE_STATUS_COLORS = { AVAILABLE: 'default', ON_TRIP: 'default', MAINTENANCE: 'default', INACTIVE: 'default' };

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOperations() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const headers = { Authorization: `Bearer ${token}` };

    // ── Shipment State ──
    const [shipments, setShipments] = useState([]);
    const [shipLoading, setShipLoading] = useState(true);
    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        return status ? { status: [status] } : {};
    });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState(null);
    const [assigning, setAssigning] = useState(false);

    // ── Vehicle State ──
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehLoading, setVehLoading] = useState(true);
    const [vehModalOpen, setVehModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [vehForm] = Form.useForm();
    const [cargoViewVehicle, setCargoViewVehicle] = useState(null);

    // ── Location State ──
    const [locations, setLocations] = useState([]);
    const [locLoading, setLocLoading] = useState(false);
    const [locModalOpen, setLocModalOpen] = useState(false);
    const [locForm] = Form.useForm();

    // ═══════════════════════════════════════════════
    // FETCH FUNCTIONS
    // ═══════════════════════════════════════════════
    const fetchShipments = useCallback(async (currentFilters = {}) => {
        setShipLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFilters.q) params.append('q', currentFilters.q);
            if (currentFilters.status?.length > 0) currentFilters.status.forEach(s => params.append('status', s));
            if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
            if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
            if (currentFilters.driver_id) params.append('driver_id', currentFilters.driver_id);
            if (currentFilters.vehicle_id) params.append('vehicle_id', currentFilters.vehicle_id);
            if (currentFilters.delayed) params.append('delayed', 'true');
            const res = await axios.get(`${API}/shipments?${params.toString()}`, { headers });
            setShipments(res.data);
        } catch { message.error('Failed to load shipments'); }
        setShipLoading(false);
    }, [token]);

    const fetchVehiclesAndDrivers = useCallback(async () => {
        setVehLoading(true);
        try {
            const [vRes, uRes] = await Promise.all([
                axios.get(`${API}/vehicles`, { headers }),
                axios.get(`${API}/users`, { headers }),
            ]);
            setVehicles(vRes.data);
            setDrivers(uRes.data.filter(u => u.role === 'DRIVER'));
        } catch { message.error('Failed to load vehicles'); }
        setVehLoading(false);
    }, [token]);

    const fetchLocations = useCallback(async () => {
        setLocLoading(true);
        try {
            const res = await axios.get(`${API}/addresses`, { headers });
            setLocations(res.data);
        } catch { message.error('Failed to load locations'); }
        setLocLoading(false);
    }, [token]);

    useEffect(() => {
        fetchShipments(filters);
        fetchVehiclesAndDrivers();
        fetchLocations();
    }, []);

    // ═══════════════════════════════════════════════
    // SHIPMENT HANDLERS
    // ═══════════════════════════════════════════════
    const handleFilter = (newFilters) => { setFilters(newFilters); fetchShipments(newFilters); };

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        getCheckboxProps: (record) => ({ disabled: !['PENDING', 'ASSIGNED'].includes(record.status) }),
    };

    const handleBulkAssign = async () => {
        if (!selectedVehicleForAssign) { message.error("Please select a vehicle"); return; }
        const vehicle = vehicles.find(v => v.id === selectedVehicleForAssign);
        if (!vehicle?.current_driver_id) { message.error("Vehicle has no driver assigned."); return; }
        setAssigning(true);
        let ok = 0, fail = 0;
        try {
            await Promise.all(selectedRowKeys.map(async (sid) => {
                try {
                    await axios.post(`${API}/shipments/${sid}/assign`, { vehicle_id: vehicle.id, driver_id: vehicle.current_driver_id }, { headers });
                    ok++;
                } catch { fail++; }
            }));
            if (ok) message.success(`Assigned ${ok} shipments`);
            if (fail) message.error(`Failed ${fail}`);
            setAssignModalOpen(false); setSelectedRowKeys([]); setSelectedVehicleForAssign(null);
            fetchShipments(filters); fetchVehiclesAndDrivers();
        } catch { message.error("Bulk assignment failed"); }
        setAssigning(false);
    };

    // ═══════════════════════════════════════════════
    // VEHICLE HANDLERS
    // ═══════════════════════════════════════════════
    const handleVehicleSave = async (values) => {
        try {
            if (editingVehicle) {
                await axios.put(`${API}/vehicles/${editingVehicle.id}`, values, { headers });
                message.success('Vehicle updated');
            } else {
                await axios.post(`${API}/vehicles`, values, { headers });
                message.success('Vehicle created');
            }
            setVehModalOpen(false); vehForm.resetFields(); setEditingVehicle(null);
            fetchVehiclesAndDrivers();
        } catch (err) { message.error(err.response?.data?.detail || 'Failed'); }
    };

    const openVehEdit = (v) => { setEditingVehicle(v); vehForm.setFieldsValue(v); setVehModalOpen(true); };
    const openVehCreate = () => { setEditingVehicle(null); vehForm.resetFields(); setVehModalOpen(true); };

    // ═══════════════════════════════════════════════
    // LOCATION HANDLERS
    // ═══════════════════════════════════════════════
    const handleAddLocation = async (values) => {
        try {
            await axios.post(`${API}/addresses`, values, { headers });
            message.success('Location added');
            setLocModalOpen(false); locForm.resetFields(); fetchLocations();
        } catch { message.error('Failed to add location'); }
    };

    const handleDeleteLocation = (id) => {
        Modal.confirm({
            title: 'Delete location?', content: 'This cannot be undone.',
            onOk: async () => {
                try { await axios.delete(`${API}/addresses/${id}`, { headers }); message.success('Deleted'); fetchLocations(); }
                catch { message.error('Failed'); }
            }
        });
    };

    // ═══════════════════════════════════════════════
    // COLUMNS
    // ═══════════════════════════════════════════════
    const shipmentColumns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking',
            render: (t, r) => <a onClick={() => navigate(`/admin/shipments/${r.id}`)}>{t}</a>
        },
        {
            title: 'Type', key: 'order_type', width: 100,
            render: (_, r) => {
                if (r.description?.includes('Order Type: Collection')) return <Tag color="orange">Collection</Tag>;
                if (r.description?.includes('Order Type: Delivery')) return <Tag color="blue">Delivery</Tag>;
                return null;
            }
        },
        {
            title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true, width: 180,
        },
        {
            title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true, width: 180,
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
            title: '', key: 'actions', width: 80,
            render: (_, r) => (
                <Space size={4}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/admin/shipments/${r.id}`)} />
                    {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(r.status) && (
                        <Button size="small" icon={<CompassOutlined />} onClick={() => navigate(`/admin/track/${r.id}`)} title="Track" />
                    )}
                </Space>
            )
        },
    ];

    const vehicleColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: t => <Space><CarOutlined /><Text strong>{t}</Text></Space> },
        { title: 'Plate #', dataIndex: 'plate_number', key: 'plate', render: t => <Tag>{t}</Tag> },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: s => <Tag color={VEHICLE_STATUS_COLORS[s]}>{s.replace('_', ' ')}</Tag>
        },
        {
            title: 'Weight', key: 'weight_cap',
            render: (_, r) => {
                const pct = r.weight_capacity > 0 ? (r.current_weight_used / r.weight_capacity) * 100 : 0;
                return (
                    <div style={{ minWidth: 120 }}>
                        <Progress percent={Math.round(pct)} size="small" strokeColor="#facc15" />
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.current_weight_used}/{r.weight_capacity} kg</Text>
                    </div>
                );
            },
        },
        {
            title: 'Volume', key: 'vol_cap',
            render: (_, r) => {
                const pct = r.volume_capacity > 0 ? (r.current_volume_used / r.volume_capacity) * 100 : 0;
                return (
                    <div style={{ minWidth: 120 }}>
                        <Progress percent={Math.round(pct)} size="small" strokeColor="#facc15" />
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.current_volume_used}/{r.volume_capacity} m³</Text>
                    </div>
                );
            },
        },
        {
            title: 'Driver', dataIndex: 'current_driver_id', key: 'driver',
            render: did => drivers.find(d => d.id === did)?.name || '-'
        },
        {
            title: '', key: 'actions', width: 80,
            render: (_, r) => (
                <Space size={4}>
                    <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => openVehEdit(r)} /></Tooltip>
                    <Tooltip title="3D Cargo"><Button size="small" icon={<EyeOutlined />} onClick={() => setCargoViewVehicle(r)} /></Tooltip>
                </Space>
            ),
        },
    ];

    const locationColumns = [
        {
            title: 'Label', key: 'label',
            render: (_, r) => (
                <Space>
                    <span style={{ fontWeight: 500 }}>{r.label}</span>
                    {r.is_global && <Tag color="gold" icon={<GlobalOutlined />}>Global</Tag>}
                </Space>
            )
        },
        { title: 'Address', dataIndex: 'address', key: 'address' },
        {
            title: 'Coordinates', key: 'coords',
            render: (_, r) => r.lat && r.lng ? (
                <Tag icon={<EnvironmentOutlined />}>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</Tag>
            ) : <span style={{ color: '#ccc' }}>N/A</span>
        },
        {
            title: 'Actions', key: 'actions', width: 80,
            render: (_, r) => (
                <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteLocation(r.id)}
                    disabled={r.is_global && user?.role !== 'ADMIN'} />
            )
        }
    ];

    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════
    return (
        <div>
            {/* ─── SECTION 1: SHIPMENTS ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>All Shipments</Title>
            </div>

            <AdvancedFilterBar onFilter={handleFilter} statusOptions={STATUS_OPTIONS} />

            {selectedRowKeys.length > 0 && (
                <div style={{ marginBottom: 16, padding: '8px 16px', background: '#fffbeb', border: '1px solid #93c5fd', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>Selected {selectedRowKeys.length} items</span>
                    <Button type="primary" danger onClick={() => setAssignModalOpen(true)}>Assign / Reassign to Vehicle</Button>
                </div>
            )}

            <Card bordered={false} style={{ marginBottom: 32 }}>
                <Table
                    rowSelection={rowSelection}
                    columns={shipmentColumns}
                    dataSource={shipments}
                    rowKey="id"
                    loading={shipLoading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* ─── SECTION 2: VEHICLES ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Vehicle Fleet</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openVehCreate}>Add Vehicle</Button>
            </div>

            <Card bordered={false} style={{ marginBottom: 32 }}>
                <Table
                    columns={vehicleColumns}
                    dataSource={vehicles}
                    rowKey="id"
                    loading={vehLoading}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 1100 }}
                />
            </Card>

            {/* ─── SECTION 3: SAVED LOCATIONS ─── */}
            <Card
                title={<Title level={4} style={{ margin: 0 }}>Saved Locations</Title>}
                bordered={false}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { locForm.resetFields(); setLocModalOpen(true); }}>
                        Add Location
                    </Button>
                }
            >
                <Table
                    columns={locationColumns}
                    dataSource={locations}
                    rowKey="id"
                    loading={locLoading}
                    pagination={false}
                    size="middle"
                />
            </Card>

            {/* ─── MODALS ─── */}

            {/* Assign Shipments Modal */}
            <Modal title="Bulk Assign Shipments" open={assignModalOpen} onOk={handleBulkAssign}
                onCancel={() => setAssignModalOpen(false)} confirmLoading={assigning} okText="Assign">
                <p>Assign <b>{selectedRowKeys.length}</b> shipments to:</p>
                <Select style={{ width: '100%' }} placeholder="Select a Vehicle"
                    onChange={setSelectedVehicleForAssign} value={selectedVehicleForAssign}
                    options={vehicles.map(v => {
                        const remWt = v.weight_capacity - v.current_weight_used;
                        return {
                            value: v.id,
                            label: (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{v.plate_number} ({v.name})</span>
                                    <span style={{ fontSize: 11, color: '#999' }}>
                                        {v.current_driver_id ? 'Has Driver' : 'No Driver'} | {remWt}kg left
                                    </span>
                                </div>
                            ),
                            disabled: !v.current_driver_id
                        };
                    })}
                />
            </Modal>

            {/* Add/Edit Vehicle Modal */}
            <Modal title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} open={vehModalOpen}
                onCancel={() => { setVehModalOpen(false); setEditingVehicle(null); vehForm.resetFields(); }}
                footer={null} width={540}>
                <Form form={vehForm} layout="vertical" onFinish={handleVehicleSave}>
                    <Form.Item name="name" label="Vehicle Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Truck-01" />
                    </Form.Item>
                    <Form.Item name="plate_number" label="Plate Number" rules={[{ required: true }]}>
                        <Input placeholder="e.g. KA-01-AB-1234" />
                    </Form.Item>
                    <Form.Item name="vehicle_type" initialValue="TRUCK" hidden><Input /></Form.Item>
                    <Space style={{ width: '100%' }} size="middle">
                        <Form.Item name="weight_capacity" label="Weight Capacity (kg)" initialValue={1000}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="volume_capacity" label="Volume Capacity (m³)" initialValue={10}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Space>
                    <Form.Item name="current_driver_id" label="Assigned Driver">
                        <Select allowClear placeholder="Select driver" options={
                            drivers.map(d => {
                                const assignedVeh = vehicles.find(v => v.current_driver_id === d.id);
                                const isOther = assignedVeh && assignedVeh.id !== editingVehicle?.id;
                                return {
                                    value: d.id,
                                    label: `${d.name} (${d.email}) ${isOther ? `[Assigned to ${assignedVeh.plate_number}]` : ''}`,
                                    disabled: isOther
                                };
                            })
                        } />
                    </Form.Item>
                    {editingVehicle && (
                        <Form.Item name="status" label="Status">
                            <Select options={Object.entries(VEHICLE_STATUS_COLORS).map(([k]) => ({ value: k, label: k.replace('_', ' ') }))} />
                        </Form.Item>
                    )}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large">
                            {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 3D Cargo View Modal */}
            <Modal
                title={<Space><CarOutlined /><span>{cargoViewVehicle?.name} ({cargoViewVehicle?.plate_number})</span></Space>}
                open={!!cargoViewVehicle} onCancel={() => setCargoViewVehicle(null)} footer={null}
                width={800} centered bodyStyle={{ padding: 0, overflow: 'hidden' }} destroyOnClose>
                {cargoViewVehicle && (
                    <div style={{ height: 500, background: '#f8fafc', position: 'relative' }}>
                        <TruckCargoVisualizer
                            weightUsed={cargoViewVehicle.current_weight_used} weightCapacity={cargoViewVehicle.weight_capacity}
                            volumeUsed={cargoViewVehicle.current_volume_used} volumeCapacity={cargoViewVehicle.volume_capacity}
                            vehicleType={cargoViewVehicle.vehicle_type} vehicleName={cargoViewVehicle.name}
                            plateNumber={cargoViewVehicle.plate_number} height="100%"
                            style={{ width: '100%', height: '100%' }} showLabels={false}
                        />
                        <div style={{
                            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)',
                            padding: '6px 16px', borderRadius: 20, display: 'flex', gap: 16, pointerEvents: 'none',
                        }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>🖱️ Drag to Rotate</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>🔍 Scroll to Zoom</Text>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Location Modal */}
            <Modal title="Add New Location" open={locModalOpen} onCancel={() => setLocModalOpen(false)} footer={null}>
                <Form form={locForm} layout="vertical" onFinish={handleAddLocation}>
                    <Form.Item name="label" label="Label (e.g. Warehouse A)" rules={[{ required: true }]}>
                        <Input placeholder="Friendly name" />
                    </Form.Item>
                    <Form.Item name="address" label="Full Address" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Complete address" />
                    </Form.Item>
                    <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item name="lat" label="Latitude" rules={[{ required: true }]}>
                            <InputNumber style={{ width: 140 }} precision={6} />
                        </Form.Item>
                        <Form.Item name="lng" label="Longitude" rules={[{ required: true }]}>
                            <InputNumber style={{ width: 140 }} precision={6} />
                        </Form.Item>
                    </Space>
                    <Space style={{ display: 'flex' }} align="baseline">
                        <Form.Item name="contact" label="Contact Person">
                            <Input style={{ width: 140 }} />
                        </Form.Item>
                        <Form.Item name="phone" label="Phone Number">
                            <Input style={{ width: 140 }} />
                        </Form.Item>
                    </Space>
                    <Form.Item name="is_global" valuePropName="checked">
                        <Checkbox>Share with everyone (Global)</Checkbox>
                    </Form.Item>
                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={() => setLocModalOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save Location</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
