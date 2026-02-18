import { API_BASE_URL } from '../apiConfig';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AssignOrdersModal from '../components/AssignOrdersModal';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Timeline,
    Button,
    Spin,
    Tag,
    Space,
    Divider,
    Skeleton,
    Dropdown,
} from 'antd';
import {
    CalendarOutlined,
    WarningOutlined,
    CarOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ArrowRightOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    DownOutlined,
    PlusCircleOutlined,
    SwapOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        scheduled_today: 0,
        vehicles_on_site: 0,
        pending_requests: 0,
        active_shipments: 0,
        completed_shipments: 0,
    });
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignMode, setAssignMode] = useState('PENDING');

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, logsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/stats`),
                axios.get(`${API_BASE_URL}/admin/audit-logs`),
            ]);
            setStats(statsRes.data);
            setAuditLogs(logsRes.data);
        } catch (err) {
            console.error('Failed to fetch admin dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statCards = [
        {
            title: 'Created Today',
            value: stats.scheduled_today,
            icon: <CalendarOutlined style={{ fontSize: 24, color: '#4F46E5' }} />,
            bg: '#EEF2FF', // Indigo-50
        },
        {
            title: 'Delayed',
            value: stats.delayed_deliveries || 0,
            icon: <WarningOutlined style={{ fontSize: 24, color: '#EF4444' }} />,
            bg: '#FEF2F2', // Red-50
        },
        {
            title: 'In Transit',
            value: stats.vehicles_on_site,
            icon: <CarOutlined style={{ fontSize: 24, color: '#0EA5E9' }} />,
            bg: '#E0F2FE', // Sky-50
        },
        {
            title: 'Pending',
            value: stats.pending_approvals,
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#F59E0B' }} />,
            bg: '#FEF3C7', // Amber-50
        },
        {
            title: 'Active Drivers',
            value: stats.dock_utilization,
            icon: <TeamOutlined style={{ fontSize: 24, color: '#10B981' }} />,
            bg: '#D1FAE5', // Emerald-50
        },
    ];

    const moduleCards = [
        {
            title: 'Operations Monitor',
            desc: 'Real-time tracking & alerts',
            icon: <ClockCircleOutlined style={{ fontSize: 20, color: '#4F46E5' }} />,
            path: '/admin/operations',
        },
        {
            title: 'System Users',
            desc: 'RBAC & Role Management',
            icon: <TeamOutlined style={{ fontSize: 20, color: '#4F46E5' }} />,
            path: '/admin/users',
        },
        {
            title: 'Analytics',
            desc: 'Performance metrics',
            icon: <AppstoreOutlined style={{ fontSize: 20, color: '#4F46E5' }} />,
            path: '/admin/analytics',
        },
        {
            title: 'Shipments',
            desc: 'Track & manage shipments',
            icon: <CarOutlined style={{ fontSize: 20, color: '#4F46E5' }} />,
            path: '/admin/shipments',
        },
        {
            title: 'Fleet',
            desc: 'Manage vehicles',
            icon: <CarOutlined style={{ fontSize: 20, color: '#4F46E5' }} />,
            path: '/admin/vehicles',
        },
    ];

    const getTimelineColor = (action) => {
        if (action?.includes('GATE')) return 'orange';
        if (action?.includes('RECEIVED') || action?.includes('CLOSED')) return 'green';
        if (action?.includes('APPROVED')) return 'blue';
        if (action?.includes('CANCELLED')) return 'red';
        return 'blue';
    };

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                <Skeleton active paragraph={{ rows: 1 }} />
                <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Col xs={24} sm={12} lg={6} key={i}>
                            <Card bordered={false}><Skeleton active avatar paragraph={false} /></Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>Dashboard</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Overview of today's logistics performance</Text>
                </div>
                <Space size={12}>
                    <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} size="large">Refresh</Button>
                    <Dropdown menu={{
                        items: [
                            {
                                key: 'assign',
                                label: 'Assign Orders',
                                icon: <PlusCircleOutlined />,
                                onClick: () => { setAssignMode('PENDING'); setAssignModalOpen(true); }
                            },
                            {
                                key: 'reassign',
                                label: 'Reassign Orders',
                                icon: <SwapOutlined />,
                                onClick: () => { setAssignMode('ASSIGNED'); setAssignModalOpen(true); }
                            }
                        ]
                    }}>
                        <Button type="primary" icon={<ArrowRightOutlined />} size="large">
                            Manage Shipments <DownOutlined />
                        </Button>
                    </Dropdown>
                </Space>
            </div>

            {/* Stats Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map((s, i) => (
                    <Col xs={24} sm={12} lg={4} flex="auto" key={i}>
                        <Card
                            bordered
                            hoverable
                            style={{
                                height: '100%',
                                borderRadius: 6, // Matching theme
                                boxShadow: 'none',
                                border: '1px solid #E2E8F0'
                            }}
                            bodyStyle={{ padding: '20px 24px' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {s.title}
                                    </Text>
                                    {s.icon}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                                        {s.value}
                                    </span>
                                    {s.title === 'Delayed' && s.value > 0 && <Tag color="red" style={{ margin: 0 }}>Action Req.</Tag>}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Main Content Grid */}
            <Row gutter={[32, 32]}>
                {/* Modules */}
                <Col xs={24} lg={16}>
                    <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Title level={4} style={{ margin: 0 }}>Quick Access</Title>
                    </div>
                    <Row gutter={[24, 24]}>
                        {moduleCards.map((m, i) => (
                            <Col xs={24} sm={8} key={i}>
                                <Link to={m.path} style={{ textDecoration: 'none' }}>
                                    <Card
                                        hoverable
                                        bordered
                                        style={{
                                            borderRadius: 6,
                                            border: '1px solid #E2E8F0',
                                            boxShadow: 'none',
                                            height: '100%'
                                        }}
                                        bodyStyle={{ padding: 24 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            <div style={{
                                                padding: 8,
                                                borderRadius: 6,
                                                background: '#F1F5F9', // Slate-100
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                {m.icon}
                                            </div>
                                            <Text strong style={{ fontSize: 15, color: '#0F172A' }}>{m.title}</Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5, display: 'block' }}>
                                            {m.desc}
                                        </Text>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </Col>

                {/* Activity Feed */}
                <Col xs={24} lg={8}>
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}>Recent Activity</span>}
                        extra={<Tag color="blue">Live</Tag>}
                        bordered={false}
                        style={{
                            borderRadius: 12,
                            border: '1px solid #F1F5F9',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            height: '100%'
                        }}
                        bodyStyle={{ maxHeight: 500, overflowY: 'auto', padding: '0 24px 24px' }}
                    >
                        {auditLogs.length === 0 ? (
                            <div style={{ padding: '32px 0', textAlign: 'center' }}>
                                <Text type="secondary">No activity recorded yet.</Text>
                            </div>
                        ) : (
                            <div style={{ paddingTop: 24 }}>
                                <Timeline
                                    items={auditLogs.map((log) => ({
                                        color: getTimelineColor(log.action),
                                        children: (
                                            <div style={{ paddingBottom: 12 }}>
                                                <Text style={{ fontSize: 13, color: '#334155' }}>{log.details}</Text>
                                                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Tag style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>{log.user?.role}</Tag>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </div>
                                            </div>
                                        ),
                                    }))}
                                />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            <AssignOrdersModal
                open={assignModalOpen}
                onCancel={() => setAssignModalOpen(false)}
                mode={assignMode}
                onSuccess={fetchDashboardData}
            />
        </div>
    );
}
