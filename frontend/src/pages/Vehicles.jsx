import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Table, Card, Tag, Button, Modal, Form, Input, InputNumber, Select,
    Typography, Space, message, Tooltip, Row, Col
} from 'antd';
import {
    PlusOutlined, CarOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const VEHICLE_STATUS_COLORS = { 
    AVAILABLE: 'success', 
    ON_TRIP: 'processing', 
    MAINTENANCE: 'warning', 
    INACTIVE: 'default' 
};

export default function Vehicles() {
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [form] = Form.useForm();

    const fetchVehiclesAndDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const [vRes, uRes] = await Promise.all([
                axios.get(`${API}/vehicles`, { headers }),
                axios.get(`${API}/users`, { headers }),
            ]);
            setVehicles(vRes.data);
            setDrivers(uRes.data.filter(u => u.role === 'DRIVER'));
        } catch { 
            message.error('Failed to load vehicles'); 
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchVehiclesAndDrivers();
    }, [fetchVehiclesAndDrivers]);

    const handleSave = async (values) => {
        try {
            if (editingVehicle) {
                await axios.put(`${API}/vehicles/${editingVehicle.id}`, values, { headers });
                message.success('Vehicle updated');
            } else {
                await axios.post(`${API}/vehicles`, values, { headers });
                message.success('Vehicle created');
            }
            setIsModalOpen(false); 
            form.resetFields(); 
            setEditingVehicle(null);
            fetchVehiclesAndDrivers();
        } catch (err) { 
            message.error(err.response?.data?.detail || 'Failed to save vehicle'); 
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete vehicle?',
            content: 'This action cannot be undone and may affect active shipments.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await axios.delete(`${API}/vehicles/${id}`, { headers });
                    message.success('Vehicle deleted');
                    fetchVehiclesAndDrivers();
                } catch {
                    message.error('Failed to delete vehicle');
                }
            }
        });
    };

    const columns = [
        { 
            title: 'Name', 
            dataIndex: 'name', 
            key: 'name', 
            render: t => <Space><CarOutlined /><Text strong>{t}</Text></Space> 
        },
        { 
            title: 'Plate #', 
            dataIndex: 'plate_number', 
            key: 'plate', 
            render: t => <Tag>{t}</Tag> 
        },
        {
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: s => <Tag color={VEHICLE_STATUS_COLORS[s] || 'default'}>{s.replace('_', ' ')}</Tag>
        },
        {
            title: 'Driver', 
            dataIndex: 'current_driver_id', 
            key: 'driver',
            render: did => drivers.find(d => d.id === did)?.name || <Text type="secondary">Unassigned</Text>
        },
        {
            title: 'Capacity',
            key: 'capacity',
            render: (_, r) => <Text type="secondary">{r.weight_capacity}kg / {r.volume_capacity}m³</Text>
        },
        {
            title: 'Actions', 
            key: 'actions', 
            width: 120,
            render: (_, r) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button 
                            icon={<EditOutlined />} 
                            size="small" 
                            onClick={() => {
                                setEditingVehicle(r);
                                form.setFieldsValue(r);
                                setIsModalOpen(true);
                            }} 
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button 
                            icon={<DeleteOutlined />} 
                            size="small" 
                            danger 
                            onClick={() => handleDelete(r.id)} 
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Vehicle Fleet Management</Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => { 
                        setEditingVehicle(null); 
                        form.resetFields(); 
                        setIsModalOpen(true); 
                    }}
                    style={{ background: '#facc15', borderColor: '#facc15', color: '#000' }}
                >
                    Add Vehicle
                </Button>
            </div>

            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={vehicles}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </Card>

            <Modal 
                title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'} 
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setEditingVehicle(null); form.resetFields(); }}
                footer={null} 
                width={540}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Vehicle Name" rules={[{ required: true }]}>
                        <Input placeholder="Enter vehicle name" />
                    </Form.Item>
                    <Form.Item name="plate_number" label="Plate Number" rules={[{ required: true }]}>
                        <Input placeholder="Enter plate number" />
                    </Form.Item>
                    <Form.Item name="vehicle_type" initialValue="TRUCK" hidden><Input /></Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="weight_capacity" label="Weight Capacity (kg)" initialValue={1000}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="volume_capacity" label="Volume Capacity (m³)" initialValue={10}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="current_driver_id" label="Assigned Driver">
                        <Select allowClear placeholder="Select a driver" options={
                            drivers.map(d => {
                                const assignedVeh = vehicles.find(v => v.current_driver_id === d.id);
                                const isOther = assignedVeh && assignedVeh.id !== editingVehicle?.id;
                                return {
                                    value: d.id,
                                    label: `${d.name} (${d.email}) ${isOther ? `[Currently on ${assignedVeh.plate_number}]` : ''}`,
                                    disabled: isOther
                                };
                            })
                        } />
                    </Form.Item>

                    {editingVehicle && (
                        <Form.Item name="status" label="Status">
                            <Select options={Object.keys(VEHICLE_STATUS_COLORS).map(k => ({ 
                                value: k, 
                                label: k.replace('_', ' ') 
                            }))} />
                        </Form.Item>
                    )}

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#facc15', borderColor: '#facc15', color: '#000' }}>
                                {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
