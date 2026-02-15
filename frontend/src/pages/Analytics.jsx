import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Space, message, Spin, Progress, Button } from 'antd';
import {
    CarOutlined, SendOutlined, CheckCircleOutlined, ClockCircleOutlined,
    ThunderboltOutlined, TeamOutlined, BarChartOutlined, RiseOutlined, DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Analytics() {
    const { token } = useAuth();
    const [fleetAnalytics, setFleetAnalytics] = useState({});
    const [shipmentAnalytics, setShipmentAnalytics] = useState({});
    const [driverAnalytics, setDriverAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fleet, shipments, drivers] = await Promise.all([
                    axios.get(`${API}/analytics/fleet`, { headers }),
                    axios.get(`${API}/analytics/shipments`, { headers }),
                    axios.get(`${API}/analytics/drivers`, { headers }),
                ]);
                setFleetAnalytics(fleet.data);
                setShipmentAnalytics(shipments.data);
                setDriverAnalytics(drivers.data);
            } catch { message.error('Failed to load analytics'); }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API}/admin/reports/export`, {
                headers,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `shipments_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch {
            message.error('Failed to export CSV');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

    const fleetData = [
        { name: 'Available', value: fleetAnalytics.available || 0 },
        { name: 'On Trip', value: fleetAnalytics.on_trip || 0 },
        { name: 'Maintenance', value: fleetAnalytics.maintenance || 0 },
    ];

    const driverColumns = [
        {
            title: 'Driver', dataIndex: 'name', key: 'name',
            render: (n, r) => <Space><TeamOutlined /><Text strong>{n || r.email}</Text></Space>
        },
        { title: 'Total', dataIndex: 'total_shipments', key: 'total' },
        {
            title: 'Completed', dataIndex: 'completed', key: 'completed',
            render: v => <Tag color="green">{v}</Tag>
        },
        {
            title: 'Active', dataIndex: 'active', key: 'active',
            render: v => <Tag color="blue">{v}</Tag>
        },
        {
            title: 'Completion Rate', key: 'rate',
            render: (_, r) => {
                const rate = r.total_shipments > 0 ? Math.round((r.completed / r.total_shipments) * 100) : 0;
                return <Progress percent={rate} size="small" strokeColor={rate > 80 ? '#52c41a' : rate > 50 ? '#faad14' : '#ff4d4f'} />;
            },
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ marginBottom: 0 }}>Analytics Dashboard</Title>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                    Export Report (CSV)
                </Button>
            </div>

            {/* KPIs */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Total" value={shipmentAnalytics.total} prefix={<SendOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Pending" value={shipmentAnalytics.pending} valueStyle={{ color: '#faad14' }} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Active" value={shipmentAnalytics.active} valueStyle={{ color: '#1890ff' }} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Delivered" value={shipmentAnalytics.delivered} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Confirmed" value={shipmentAnalytics.confirmed} valueStyle={{ color: '#389e0d' }} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Utilization" value={fleetAnalytics.utilization_rate} suffix="%" prefix={<CarOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Today" value={shipmentAnalytics.today} prefix={<BarChartOutlined />} /></Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <Card bordered={false}><Statistic title="Rate" value={shipmentAnalytics.completion_rate} suffix="%" prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                {/* Visualizations */}
                <Col xs={24} lg={16}>
                    <Card title="Shipment Volume (Last 7 Days)" bordered={false} style={{ marginBottom: 24 }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={shipmentAnalytics.chart_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#1890ff" activeDot={{ r: 8 }} name="Shipments" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Driver Performance" bordered={false}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={driverAnalytics.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="completed" fill="#52c41a" name="Completed" />
                                    <Bar dataKey="active" fill="#1890ff" name="Active" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Fleet Status" bordered={false} style={{ marginBottom: 24 }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={fleetData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {fleetData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#52c41a', '#1890ff', '#faad14'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <Statistic title="Total Vehicles" value={fleetAnalytics.total_vehicles} />
                        </div>
                    </Card>

                    <Card title="Top Drivers" bordered={false}>
                        <Table
                            columns={driverColumns.slice(0, 3)} // Simplified columns
                            dataSource={driverAnalytics.slice(0, 5)}
                            rowKey="driver_id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
