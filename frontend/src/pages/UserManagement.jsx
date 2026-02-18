import { API_BASE_URL } from '../apiConfig';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Table,
    Button,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Tag,
    message,
    Switch,
    Card,
    Avatar
} from 'antd';
import { PlusOutlined, ReloadOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ROLE_COLORS = {
    SUPER_ADMIN: 'purple',
    MSME: 'cyan',
    DRIVER: 'magenta',
};

const VALID_ROLES = ['SUPER_ADMIN', 'MSME', 'DRIVER'];

export default function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const filtered = res.data.filter(u => VALID_ROLES.includes(u.role));
            setUsers(filtered);
        } catch (err) {
            console.error(err);
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/users/${userId}/status?is_active=${!currentStatus}`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
            fetchUsers();
        } catch (err) {
            message.error('Failed to update status');
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar style={{ backgroundColor: ROLE_COLORS[record.role] || '#1890ff' }} icon={<UserOutlined />} />
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.name || 'Unknown User'}</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>{record.email}</Text>
                    </div>
                </div>
            ),
            sorter: (a, b) => (a.name || a.email).localeCompare(b.name || b.email),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={ROLE_COLORS[role]}>
                    {role?.replace(/_/g, ' ')}
                </Tag>
            ),
            filters: Object.keys(ROLE_COLORS).map(r => ({ text: r.replace('_', ' '), value: r })),
            onFilter: (value, record) => record.role === value,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Switch
                    checked={record.is_active}
                    onChange={() => handleToggleStatus(record.id, record.is_active)}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    disabled={record.email === 'admin@example.com'}
                />
            ),
            filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false },
            ],
            onFilter: (value, record) => record.is_active === value,
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text ? <Text>{text}</Text> : <Text type="secondary">-</Text>,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (r) => r ? <Tag color="gold">{r} ★</Tag> : <Text type="secondary">-</Text>
        },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (val) => val ? <Text type="secondary">{new Date(val).toLocaleDateString()}</Text> : '-',
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>User Management</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Manage system users and access controls</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchUsers} size="large">Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="large">
                        Add User
                    </Button>
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
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </Card>

            <AddUserModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchUsers();
                }}
            />
        </div>
    );
}

function AddUserModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/users`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('User created successfully');
            form.resetFields();
            onSuccess();
        } catch (err) {
            message.error('Failed to create user: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title="Add New User"
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Create User"
            destroyOnClose
            centered
            width={500}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
                <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                    <Input placeholder="John Doe" size="large" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                    <Input placeholder="user@company.com" size="large" />
                </Form.Item>
                <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Phone is required' }]}>
                    <Input placeholder="9876543210" size="large" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                    <Input.Password placeholder="••••••••" size="large" />
                </Form.Item>
                <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
                    <Select placeholder="Select role" size="large">
                        {VALID_ROLES.map(role => (
                            <Select.Option key={role} value={role}>{role.replace(/_/g, ' ')}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                >
                    {({ getFieldValue }) =>
                        getFieldValue('role') === 'DRIVER' ? (
                            <Form.Item name="license_number" label="License Number" rules={[{ required: true }]}>
                                <Input placeholder="DL-1234567890" size="large" />
                            </Form.Item>
                        ) : null
                    }
                </Form.Item>
                <Form.Item name="rating" label="Initial Rating" initialValue={5.0}>
                    <Input type="number" step="0.1" min={0} max={5} size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
