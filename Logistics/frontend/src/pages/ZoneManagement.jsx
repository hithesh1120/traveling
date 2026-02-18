import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Table, Card, Tag, Button, Modal, Form, Input, Select, Typography, Space, message, ColorPicker, Avatar } from 'antd';
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'default', MAINTENANCE: 'warning' };

export default function ZoneManagement() {
    const { token } = useAuth();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [form] = Form.useForm();

    const headers = { Authorization: `Bearer ${token}` };

    const fetchZones = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/zones`, { headers });
            setZones(res.data);
        } catch { message.error('Failed to load zones'); }
        setLoading(false);
    };

    useEffect(() => { fetchZones(); }, []);

    const handleSave = async (values) => {
        try {
            const color = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff';
            const payload = { ...values, color };

            if (editingZone) {
                await axios.put(`${API}/zones/${editingZone.id}`, payload, { headers });
                message.success('Zone updated');
            } else {
                await axios.post(`${API}/zones`, payload, { headers });
                message.success('Zone created');
            }
            setModalOpen(false);
            form.resetFields();
            setEditingZone(null);
            fetchZones();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to save zone');
        }
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Delete Zone?',
            content: 'This will remove the zone. This cannot be undone.',
            okType: 'danger',
            onOk: async () => {
                try {
                    await axios.delete(`${API}/zones/${id}`, { headers });
                    message.success('Zone deleted');
                    fetchZones();
                } catch (err) {
                    message.error(err.response?.data?.detail || 'Failed to delete zone');
                }
            },
        });
    };

    const openEdit = (zone) => {
        setEditingZone(zone);
        form.setFieldsValue({ ...zone });
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditingZone(null);
        form.resetFields();
        setModalOpen(true);
    };

    const columns = [
        {
            title: 'Zone Name', dataIndex: 'name', key: 'name',
            render: (t, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar
                        shape="square"
                        icon={<EnvironmentOutlined />}
                        style={{ backgroundColor: r.color + '22', color: r.color, border: `1px solid ${r.color}` }}
                    />
                    <Text strong>{t}</Text>
                </div>
            ),
        },
        { title: 'Description', dataIndex: 'description', key: 'desc', ellipsis: true },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: s => <Tag color={STATUS_COLORS[s]}>{s}</Tag>
        },
        {
            title: 'Max Capacity',
            dataIndex: 'max_capacity',
            key: 'cap',
            render: v => v ? <Tag>{v} Vehicles</Tag> : <Text type="secondary">Unlimited</Text>
        },
        {
            title: '', key: 'actions', width: 100,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.id)} />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>Zone Management</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Manage operational zones and capacities</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchZones} size="large">Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">Add Zone</Button>
                </Space>
            </div>

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
                    dataSource={zones}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </Card>

            <Modal
                title={editingZone ? 'Edit Zone' : 'Add Zone'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); setEditingZone(null); form.resetFields(); }}
                footer={null}
                width={500}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 24 }}>
                    <Form.Item name="name" label="Zone Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. North Zone" size="large" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Coverage area description" />
                    </Form.Item>
                    <Form.Item name="color" label="Zone Color" initialValue="#1890ff">
                        <ColorPicker format="hex" showText />
                    </Form.Item>
                    <Form.Item name="max_capacity" label="Max Vehicle Capacity">
                        <Input type="number" placeholder="Max vehicles in zone" size="large" />
                    </Form.Item>
                    {editingZone && (
                        <Form.Item name="status" label="Status">
                            <Select size="large" options={[
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'INACTIVE', label: 'Inactive' },
                                { value: 'MAINTENANCE', label: 'Maintenance' },
                            ]} />
                        </Form.Item>
                    )}
                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" block size="large" style={{ fontWeight: 600 }}>
                            {editingZone ? 'Update Zone' : 'Create Zone'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
