import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Table, Card, Tag, Button, Modal, Form, Input, InputNumber, Select, Typography, Space, Progress, message, Switch, Tooltip, Avatar } from 'antd';
import { PlusOutlined, CarOutlined, EditOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import TruckCargoVisualizer from '../components/TruckCargoVisualizer';

import { API_BASE_URL } from '../apiConfig';

const { Title, Text } = Typography;
const API = API_BASE_URL;

const STATUS_COLORS = { AVAILABLE: 'success', ON_TRIP: 'processing', MAINTENANCE: 'warning', INACTIVE: 'default' };
const TYPE_LABELS = { TRUCK: 'Truck', VAN: 'Van', PICKUP: 'Pickup', FLATBED: 'Flatbed', CONTAINER: 'Container' };

// Filter Section
const FilterSection = ({ onFilter }) => {
    const [form] = Form.useForm();
    return (
        <Card
            bordered={false}
            style={{
                marginBottom: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid #F1F5F9',
            }}
            bodyStyle={{ padding: 24 }}
        >
            <Form form={form} layout="inline" onFinish={onFilter} style={{ alignItems: 'center' }}>
                <Form.Item name="status" style={{ minWidth: 200, marginBottom: 0 }}>
                    <Select placeholder="Filter by Status" allowClear mode="multiple" size="large">
                        {Object.entries(STATUS_COLORS).map(([k, v]) => (
                            <Select.Option key={k} value={k}>{k.replace('_', ' ')}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="overloaded_check" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text>Overloaded Only</Text>
                        <Switch />
                    </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" icon={<FilterOutlined />} size="large">Filter</Button>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button onClick={() => { form.resetFields(); onFilter({}); }} size="large">Reset</Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default function VehicleManagement() {
    const { token } = useAuth();
    const [vehicles, setVehicles] = useState([]);

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [form] = Form.useForm();
    const [cargoViewVehicle, setCargoViewVehicle] = useState(null);


    const fetchData = async (filters = {}) => {
        setLoading(true);

        const params = new URLSearchParams();
        if (filters.status && filters.status.length) filters.status.forEach(s => params.append('status', s));
        if (filters.overloaded_check) params.append('overloaded', 'true');

        const authHeaders = { Authorization: `Bearer ${token}` };

        // 1. Fetch Vehicles
        try {
            const vehicleUrl = `${API}/vehicles?${params.toString()}`;
            const vRes = await axios.get(vehicleUrl, { headers: authHeaders });
            setVehicles(vRes.data);
        } catch (error) {
            console.error("Vehicle fetch error:", error);
            message.error(`Failed to load vehicles: ${error.message}`);
        }

        // 2. Fetch Drivers
        try {
            const userUrl = `${API}/users`;
            const uRes = await axios.get(userUrl, { headers: authHeaders });
            setDrivers(uRes.data.filter(u => u.role === 'DRIVER'));
        } catch (error) {
            console.error("User fetch error:", error);
            message.error(`Failed to load drivers: ${error.message}`);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleSave = async (values) => {
        try {
            const authHeaders = { Authorization: `Bearer ${token}` };
            if (editingVehicle) {
                await axios.put(`${API}/vehicles/${editingVehicle.id}`, values, { headers: authHeaders });
                message.success('Vehicle updated');
            } else {
                await axios.post(`${API}/vehicles`, values, { headers: authHeaders });
                message.success('Vehicle created');
            }
            setModalOpen(false);
            form.resetFields();
            setEditingVehicle(null);
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to save vehicle');
        }
    };

    const openEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        form.setFieldsValue(vehicle);
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditingVehicle(null);
        form.resetFields();
        setModalOpen(true);
    };

    const columns = [
        {
            title: 'Vehicle Info',
            dataIndex: 'name',
            key: 'name',
            render: (t, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar shape="square" size="large" icon={<CarOutlined />} style={{ backgroundColor: '#F1F5F9', color: '#64748B' }} />
                    <div>
                        <Text strong style={{ display: 'block' }}>{t}</Text>
                        <Tag style={{ margin: 0 }}>{r.plate_number}</Tag>
                    </div>
                </div>
            )
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: s => <Tag color={STATUS_COLORS[s]}>{s.replace('_', ' ')}</Tag>
        },
        {
            title: 'Weight Capacity', key: 'weight_cap',
            render: (_, r) => {
                const pct = r.weight_capacity > 0 ? (r.current_weight_used / r.weight_capacity) * 100 : 0;
                return (
                    <div style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Weight</Text>
                            <Text style={{ fontSize: 11 }}>{r.current_weight_used} / {r.weight_capacity} kg</Text>
                        </div>
                        <Progress percent={Math.round(pct)} size="small" strokeColor={pct > 90 ? '#EF4444' : '#10B981'} showInfo={false} />
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Volume</Text>
                            <Text style={{ fontSize: 11 }}>{r.current_volume_used} / {r.volume_capacity} m³</Text>
                        </div>
                        <Progress percent={Math.round(pct)} size="small" strokeColor={pct > 90 ? '#EF4444' : '#10B981'} showInfo={false} />
                    </div>
                );
            },
        },

        {
            title: 'Assigned Driver', dataIndex: 'current_driver_id', key: 'driver',
            render: did => {
                const driver = drivers.find(d => d.id === did);
                return driver ? <Text>{driver.name}</Text> : <Text type="secondary">Unassigned</Text>;
            }
        },
        {
            title: '', key: 'actions', width: 100,
            render: (_, r) => (
                <Space size={8}>
                    <Tooltip title="Edit vehicle">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Tooltip title="3D Cargo View">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setCargoViewVehicle(r)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>Vehicle Management</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Manage fleet vehicles and drivers</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">Add Vehicle</Button>
            </div>

            <FilterSection onFilter={fetchData} />

            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #F1F5F9',
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={vehicles}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); setEditingVehicle(null); form.resetFields(); }}
                footer={null}
                width={600}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 24 }}>
                    <Form.Item name="name" label="Vehicle Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Truck-01" size="large" />
                    </Form.Item>
                    <Form.Item name="plate_number" label="Plate Number" rules={[{ required: true }]}>
                        <Input placeholder="e.g. KA-01-AB-1234" size="large" />
                    </Form.Item>
                    <Form.Item name="vehicle_type" initialValue="TRUCK" hidden>
                        <Input />
                    </Form.Item>
                    <Space style={{ width: '100%' }} size="middle">
                        <Form.Item name="weight_capacity" label="Weight Capacity (kg)" initialValue={1000} style={{ width: '100%' }}>
                            <InputNumber min={0} style={{ width: '100%' }} size="large" />
                        </Form.Item>
                        <Form.Item name="volume_capacity" label="Volume Capacity (m³)" initialValue={10} style={{ width: '100%' }}>
                            <InputNumber min={0} style={{ width: '100%' }} size="large" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="current_driver_id" label="Assigned Driver">
                        <Select allowClear placeholder="Select driver" size="large" options={
                            drivers.map(d => {
                                // Check if driver is assigned to ANY vehicle
                                const assignedVehicle = vehicles.find(v => v.current_driver_id === d.id);
                                const isAssignedToOther = assignedVehicle && assignedVehicle.id !== editingVehicle?.id;

                                return {
                                    value: d.id,
                                    label: `${d.name} (${d.email}) ${isAssignedToOther ? `[Assigned to ${assignedVehicle.plate_number}]` : ''}`,
                                    disabled: isAssignedToOther
                                };
                            })
                        } />
                    </Form.Item>
                    {editingVehicle && (
                        <Form.Item name="status" label="Status">
                            <Select size="large" options={Object.entries(STATUS_COLORS).map(([k]) => ({ value: k, label: k.replace('_', ' ') }))} />
                        </Form.Item>
                    )}
                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block size="large" style={{ fontWeight: 600 }}>
                            {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 3D Cargo View Modal */}
            <Modal
                title={
                    <Space>
                        <CarOutlined />
                        <span>{cargoViewVehicle?.name} ({cargoViewVehicle?.plate_number})</span>
                    </Space>
                }
                open={!!cargoViewVehicle}
                onCancel={() => setCargoViewVehicle(null)}
                footer={null}
                width={800}
                centered
                bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: '0 0 12px 12px', height: 500 }}
                destroyOnClose
            >
                {cargoViewVehicle && (
                    <div style={{ height: '100%', background: '#f8fafc', position: 'relative' }}>
                        <TruckCargoVisualizer
                            weightUsed={cargoViewVehicle.current_weight_used}
                            weightCapacity={cargoViewVehicle.weight_capacity}
                            volumeUsed={cargoViewVehicle.current_volume_used}
                            volumeCapacity={cargoViewVehicle.volume_capacity}
                            vehicleType={cargoViewVehicle.vehicle_type}
                            vehicleName={cargoViewVehicle.name}
                            plateNumber={cargoViewVehicle.plate_number}
                            height="100%"
                            style={{ width: '100%', height: '100%' }}
                            showLabels={false}
                        />
                        <div style={{
                            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)',
                            padding: '8px 24px', borderRadius: 100,
                            display: 'flex', gap: 24, alignItems: 'center',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                        }}>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>🖱️ Drag to Rotate</Text>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>🔍 Scroll to Zoom</Text>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
