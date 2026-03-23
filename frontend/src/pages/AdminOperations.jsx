import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Table, Card, Tag, Button, Modal, Form, Input, InputNumber, Select,
    Typography, Space, Progress, message, Switch, Tooltip, Checkbox, Steps, Divider
} from 'antd';
import {
    PlusOutlined, CarOutlined, EditOutlined, EyeOutlined, SendOutlined,
    EnvironmentOutlined, DeleteOutlined, CompassOutlined, GlobalOutlined,
    BranchesOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AdvancedFilterBar from '../components/AdvancedFilterBar';

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
    const routerLocation = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
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
    const [assigning, setAssigning] = useState(false);

    // ── Vehicle State ──
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehLoading, setVehLoading] = useState(true);

    // ── Address labels (for company name lookup) ──
    const [addressMap, setAddressMap] = useState({});

    // ── Create Trip State ──
    const [tripModal, setTripModal] = useState(false);
    const [tripVehicleId, setTripVehicleId] = useState(null);
    const [tripDriverId, setTripDriverId] = useState(null);
    const [creatingTrip, setCreatingTrip] = useState(false);



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



    const fetchAddresses = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/addresses`, { headers });
            // Build a map: address text => label for fast lookup
            const map = {};
            res.data.forEach(a => { if (a.address) map[a.address.trim()] = a.label; });
            setAddressMap(map);
        } catch { /* non-critical, skip silently */ }
    }, [token]);

    useEffect(() => {
        fetchShipments(filters);
        fetchVehiclesAndDrivers();
        fetchAddresses();
    }, []);



    // ═══════════════════════════════════════════════
    // SHIPMENT HANDLERS
    // ═══════════════════════════════════════════════
    const handleFilter = (newFilters) => { setFilters(newFilters); fetchShipments(newFilters); };

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        getCheckboxProps: (record) => ({ disabled: record.status !== 'PENDING' }),
    };

    const handleAssignToVehicle = async (vehicleId) => {
        if (selectedRowKeys.length === 0) { message.error("Please select shipments first"); return; }
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle?.current_driver_id) { message.error("Vehicle has no driver assigned."); return; }
        Modal.confirm({
            title: `Assign ${selectedRowKeys.length} shipment(s) to ${vehicle.name}?`,
            content: 'This will dispatch the shipment(s) to the driver of this vehicle.',
            onOk: async () => {
                setAssigning(true);
                let ok = 0, fail = 0;
                try {
                    await Promise.all(selectedRowKeys.map(async (sid) => {
                        try {
                            await axios.post(`${API}/shipments/${sid}/assign`, { vehicle_id: vehicle.id, driver_id: vehicle.current_driver_id }, { headers });
                            ok++;
                        } catch { fail++; }
                    }));
                    if (ok) message.success(`Assigned ${ok} shipment(s)`);
                    if (fail) message.error(`Failed ${fail}`);
                    setSelectedRowKeys([]);
                    fetchShipments(filters); fetchVehiclesAndDrivers();
                } catch { message.error("Bulk assignment failed"); }
                setAssigning(false);
            }
        });
    };

    // ── Create Trip Handler (SRS §4.2) ──
    const handleCreateTrip = async () => {
        if (selectedRowKeys.length === 0) { message.error('Select at least one pending shipment'); return; }
        if (!tripVehicleId) { message.error('Select a vehicle'); return; }
        if (!tripDriverId) { message.error('Select a driver'); return; }
        setCreatingTrip(true);
        try {
            const res = await axios.post(`${API}/trips`, {
                shipment_ids: selectedRowKeys,
                vehicle_id: tripVehicleId,
                driver_id: tripDriverId,
            }, { headers });
            message.success(`Trip ${res.data.trip_number} created with ${res.data.stops.length} stops!`);
            setTripModal(false);
            setSelectedRowKeys([]);
            setTripVehicleId(null);
            setTripDriverId(null);
            fetchShipments(filters);
            fetchVehiclesAndDrivers();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to create trip');
        }
        setCreatingTrip(false);
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
            title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup',
            ellipsis: true, width: 200,
            render: v => <span style={{ fontSize: 13 }}>{v || '—'}</span>
        },
        {
            title: 'Drop', dataIndex: 'drop_address', key: 'drop',
            ellipsis: true, width: 200,
            render: v => <span style={{ fontSize: 13 }}>{v || '—'}</span>
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
                </Space>
            )
        },
    ];

    const vehicleColumns = [
        ...(selectedRowKeys.length > 0 ? [{
            title: '',
            key: 'select',
            width: 48,
            render: (_, r) => {
                const noDriver = !r.current_driver_id;
                const tooltipMsg = noDriver
                    ? 'No driver assigned to this vehicle'
                    : `Dispatch ${selectedRowKeys.length} shipment(s) to ${r.name}`;
                return (
                    <Tooltip title={tooltipMsg}
                        overlayInnerStyle={{ color: '#262626', background: '#fff' }}
                        overlayStyle={{ maxWidth: 240 }}
                    >
                        <Checkbox
                            disabled={noDriver}
                            checked={false}
                            onChange={(e) => {
                                if (e.target.checked) handleAssignToVehicle(r.id);
                            }}
                        />
                    </Tooltip>
                );
            }
        }] : []),
        { title: 'Name', dataIndex: 'name', key: 'name', render: t => <Space><CarOutlined /><Text strong>{t}</Text></Space> },
        { title: 'Plate #', dataIndex: 'plate_number', key: 'plate', render: t => <Tag>{t}</Tag> },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: s => {
                const colorMap = { AVAILABLE: 'success', ON_TRIP: 'processing', MAINTENANCE: 'warning', INACTIVE: 'default' };
                return <Tag color={colorMap[s] || 'default'}>{s.replace('_', ' ')}</Tag>;
            }
        },
        {
            title: 'Driver', dataIndex: 'current_driver_id', key: 'driver',
            render: did => drivers.find(d => d.id === did)?.name || <Text type="secondary">No driver</Text>
        },
    ];



    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════
    return (
        <>
            {/* ─── SECTION 1: SHIPMENTS ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>All Shipments</Title>
            </div>

            <AdvancedFilterBar onFilter={handleFilter} statusOptions={STATUS_OPTIONS} />

            {selectedRowKeys.length > 0 && (
                <div style={{ marginBottom: 16, padding: '10px 16px', background: '#262626', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: '#fff' }}>
                        {selectedRowKeys.length} shipment(s) selected
                    </span>
                    <Space>
                        <Button
                            type="primary"
                            icon={<BranchesOutlined />}
                            onClick={() => setTripModal(true)}
                            id="create-trip-btn"
                            style={{ background: '#facc15', color: '#000', border: 'none' }}
                        >
                            Create Trip
                        </Button>
                        <Button size="small" type="text" style={{ color: '#facc15' }} onClick={() => setSelectedRowKeys([])}>Clear</Button>
                    </Space>
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

            {/* ─── SECTION 2: VEHICLES (for assignment) ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Vehicle Fleet</Title>
                {selectedRowKeys.length > 0 && (
                    <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                        ✓ Check a vehicle below to assign the selected shipments
                    </span>
                )}
            </div>

            <Card bordered={false}>
                <Table
                    columns={vehicleColumns}
                    dataSource={vehicles}
                    rowKey="id"
                    loading={vehLoading}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* ─── Create Trip Modal ─── */}
            <Modal
                title={<Space><BranchesOutlined /> Create Optimized Trip</Space>}
                open={tripModal}
                onOk={handleCreateTrip}
                onCancel={() => setTripModal(false)}
                okText="Create Trip & Notify Drivers"
                confirmLoading={creatingTrip}
                okButtonProps={{ style: { background: '#1677ff' } }}
                width={520}
            >
                <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">{selectedRowKeys.length} shipment(s) selected</Tag>
                    <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
                        Stops will be automatically ordered using route optimization.
                        Notifications will be sent to all requestors and the assigned driver.
                    </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Select Vehicle</div>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Choose a vehicle"
                        value={tripVehicleId}
                        onChange={setTripVehicleId}
                        id="trip-vehicle-select"
                        options={vehicles
                            .filter(v => v.status === 'AVAILABLE' || v.current_driver_id)
                            .map(v => ({
                                label: `${v.name} · ${v.plate_number} · ${v.status}`,
                                value: v.id,
                            }))
                        }
                    />
                </div>
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Assign Driver</div>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Choose a driver"
                        value={tripDriverId}
                        onChange={setTripDriverId}
                        id="trip-driver-select"
                        options={drivers.map(d => ({
                            label: `${d.name || d.email}${d.phone ? ` · ${d.phone}` : ''}`,
                            value: d.id,
                        }))}
                    />
                </div>
            </Modal>
        </>
    );
}
