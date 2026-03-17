import { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Tag, Space, Modal, Form, Input, InputNumber, message, Checkbox } from 'antd';
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const { Title } = Typography;

export default function SavedLocations() {
    const { token, user } = useAuth();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/addresses`, { headers });
            setLocations(res.data);
        } catch (error) {
            message.error('Failed to load locations');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleAddEdit = async (values) => {
        try {
            const payload = { ...values, is_global: true };
            if (editingId) {
                // Editing not fully supported by backend yet (only create/delete), 
                // but if we added PUT it would go here. For now, we'll just re-create or show error.
                // Assuming we might add PUT later, but current task only asked for Create/List/Delete logic in snippets.
                // Let's implement CREATE for now as user asked to "add locations".
                message.info('Editing is not supported yet, please delete and re-create.');
            } else {
                await axios.post(`${API}/addresses`, payload, { headers });
                message.success('Location added successfully');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingId(null);
            fetchLocations();
        } catch (error) {
            message.error('Operation failed');
        }
    };

    const openEdit = (record) => {
        setEditingId(record.id);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Are you sure?',
            content: 'This location will be removed.',
            onOk: async () => {
                try {
                    await axios.delete(`${API}/addresses/${id}`, { headers });
                    message.success('Location deleted');
                    fetchLocations();
                } catch (error) {
                    message.error('Failed to delete location');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Company', key: 'label',
            render: (_, r) => (
                <span style={{ fontWeight: 500 }}>{r.label}</span>
            )
        },
        { title: 'Address', dataIndex: 'address', key: 'address' },
        {
            title: 'Contact Details', key: 'contact',
            render: (_, r) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{r.label.split(' ')[0]} Manager</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>+91 98765 43210</span>
                </div>
            )
        },
        {
            title: 'Actions', key: 'actions', width: 80,
            render: (_, r) => (
                <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(r.id)} />
            )
        }
    ];

    // Remove Actions column for MSME users
    const filteredColumns = user?.role === 'ADMIN' ? columns : columns.filter(c => c.key !== 'actions');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Saved Company Locations</Title>
                {user?.role === 'ADMIN' && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
                        Add Location
                    </Button>
                )}
            </div>

            <Card bordered={false}>
                <Table
                    columns={filteredColumns}
                    dataSource={locations}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingId ? "Edit Location" : "Add New Location"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddEdit}>
                    <Form.Item name="label" label="Company Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Sanathnagar Industrial Park" />
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
                    <Space style={{ display: 'flex', marginBottom: 24 }} align="baseline">
                        <Form.Item name="contact" label="Contact Person">
                            <Input style={{ width: 140 }} />
                        </Form.Item>
                        <Form.Item name="phone" label="Phone Number">
                            <Input style={{ width: 140 }} />
                        </Form.Item>
                    </Space>

                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save Location</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
