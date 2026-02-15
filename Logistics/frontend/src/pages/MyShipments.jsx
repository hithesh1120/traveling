import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Table, Tag, Typography, Button, message, Card } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdvancedFilterBar from '../components/AdvancedFilterBar';

const { Title } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
    PENDING: 'gold', ASSIGNED: 'blue', PICKED_UP: 'cyan',
    IN_TRANSIT: 'processing', DELIVERED: 'green', CONFIRMED: 'success', CANCELLED: 'red',
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
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

    const headers = { Authorization: `Bearer ${token}` };
    const basePath = user?.role === 'MSME' ? '/msme' : user?.role === 'DRIVER' ? '/driver' : user?.role === 'FLEET_MANAGER' ? '/fleet' : '/admin';

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

    useEffect(() => {
        fetchShipments(filters);
    }, [fetchShipments]); // filters dependency removed to avoid loop if object changes, but we call fetch on filter change

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
        fetchShipments(newFilters);
    };

    const columns = [
        {
            title: 'Tracking #', dataIndex: 'tracking_number', key: 'tracking',
            render: (t, r) => <a onClick={() => navigate(`${basePath}/shipments/${r.id}`)}>{t}</a>
        },
        { title: 'Pickup', dataIndex: 'pickup_address', key: 'pickup', ellipsis: true, width: 200 },
        { title: 'Drop', dataIndex: 'drop_address', key: 'drop', ellipsis: true, width: 200 },
        { title: 'Weight', dataIndex: 'total_weight', key: 'weight', render: v => `${v} kg`, width: 90 },
        { title: 'Volume', dataIndex: 'total_volume', key: 'volume', render: v => `${v} m³`, width: 90 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: s => <Tag color={STATUS_COLORS[s]}>{s.replace(/_/g, ' ')}</Tag>
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created', width: 110,
            render: d => new Date(d).toLocaleDateString()
        },
        {
            title: '', key: 'actions', width: 60,
            render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`${basePath}/shipments/${r.id}`)} />
        },
    ];

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>All Shipments</Title>

            <AdvancedFilterBar
                onFilter={handleFilter}
                statusOptions={STATUS_OPTIONS}
            />

            <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={shipments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    size="middle"
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
}

