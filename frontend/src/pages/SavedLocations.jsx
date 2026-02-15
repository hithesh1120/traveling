import { useState } from 'react';
import { Card, Table, Button, Typography, Tag, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function SavedLocations() {
    // Shared mock data (in a real app, this would come from an API context or Redux)
    const [locations, setLocations] = useState([
        { id: 1, label: 'Warehouse A - 123 Logistics Way', address: '123 Logistics Way, Ind. Park', lat: 12.9716, lng: 77.5946, contact: 'John Doe', phone: '9876543210' },
        { id: 2, label: 'Factory B - 456 Manuf. Rd', address: '456 Manuf. Rd, Ind. Zone', lat: 13.0827, lng: 80.2707, contact: 'Jane Smith', phone: '9123456780' },
        { id: 3, label: 'Office HQ - 789 Corp Blvd', address: '789 Corp Blvd, City Center', lat: 28.7041, lng: 77.1025, contact: 'Admin', phone: '9988776655' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);

    const handleAddEdit = (values) => {
        if (editingId) {
            setLocations(locations.map(loc => loc.id === editingId ? { ...loc, ...values } : loc));
            message.success('Location updated successfully');
        } else {
            const newLoc = { ...values, id: Date.now() }; // Mock ID
            setLocations([...locations, newLoc]);
            message.success('Location added successfully');
        }
        setIsModalOpen(false);
        form.resetFields();
        setEditingId(null);
    };

    const openEdit = (record) => {
        setEditingId(record.id);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Are you sure?',
            content: 'This location will be removed from your saved list.',
            onOk: () => {
                setLocations(locations.filter(l => l.id !== id));
                message.success('Location deleted');
            }
        });
    };

    const columns = [
        { title: 'Label', dataIndex: 'label', key: 'label', render: t => <span style={{ fontWeight: 500 }}>{t}</span> },
        { title: 'Address', dataIndex: 'address', key: 'address' },
        {
            title: 'Coordinates', key: 'coords',
            render: (_, r) => <Tag icon={<EnvironmentOutlined />}>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</Tag>
        },
        { title: 'Contact', dataIndex: 'contact', key: 'contact' },
        { title: 'Phone', dataIndex: 'phone', key: 'phone' },
        {
            title: 'Actions', key: 'actions',
            render: (_, r) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(r.id)} />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Saved Company Locations</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
                    Add Location
                </Button>
            </div>

            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={locations}
                    rowKey="id"
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
                    <Form.Item name="label" label="Label (e.g. Warehouse A)" rules={[{ required: true }]}>
                        <Input placeholder="Friendly name for this location" />
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
                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save Location</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
