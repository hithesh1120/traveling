import { API_BASE_URL } from '../apiConfig';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AssignOrdersModal from '../components/AssignOrdersModal';
import Analytics from './Analytics';
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
            icon: <CalendarOutlined />,
            color: '#000000',
            bg: '#f5f5f5',
        },
        {
            title: 'Delayed Shipments',
            value: stats.delayed_deliveries || 0,
            icon: <WarningOutlined />,
            color: '#000000',
            bg: '#f5f5f5',
        },
        {
            title: 'Active Shipments',
            value: stats.vehicles_on_site,
            icon: <CarOutlined />,
            color: '#000000',
            bg: '#f5f5f5',
        },
        {
            title: 'Pending Assign',
            value: stats.pending_approvals,
            icon: <CheckCircleOutlined />,
            color: '#000000',
            bg: '#f5f5f5',
        },
        {
            title: 'Active Drivers',
            value: stats.dock_utilization,
            icon: <TeamOutlined />,
            color: '#000000',
            bg: '#f5f5f5',
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
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <Col xs={24} sm={12} md={8} lg={4} xl={4} key={i}>
                            <Card bordered={false}><Skeleton active avatar paragraph={false} /></Card>
                        </Col>
                    ))}
                </Row>
                <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={16}><Card bordered={false}><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
                    <Col xs={24} lg={8}><Card bordered={false}><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
                </Row>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Operations Overview</Title>
                    <Text type="secondary">Real-time logistics operations monitor</Text>
                </div>
            </div>


            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map((s, i) => (
                    <Col xs={24} sm={12} md={8} flex="1" key={i}>
                        <Card bordered={false} bodyStyle={{ padding: 20, height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Statistic
                                    title={<Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>}
                                    value={s.value}
                                    valueStyle={{ fontSize: 28, fontWeight: 700, color: '#262626' }}
                                />
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: s.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        color: s.color,
                                    }}
                                >
                                    {s.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={24}>
                    <Analytics embedded={true} />
                </Col>

                <Col xs={24} lg={24}>
                    <Card
                        title="Recent Activity"
                        extra={<Tag color="#facc15" style={{ color: '#000' }}>Live Feed</Tag>}
                        bordered={false}
                        bodyStyle={{ maxHeight: 450, overflowY: 'auto', padding: '12px 20px' }}
                    >
                        {auditLogs.length === 0 ? (
                            <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 40 }}>
                                No activity recorded yet.
                            </Text>
                        ) : (
                            <Timeline
                                items={auditLogs.map((log) => ({
                                    color: getTimelineColor(log.action),
                                    children: (
                                        <div>
                                            <Text style={{ fontSize: 13 }}>{log.details}</Text>
                                            <br />
                                            <Space size={4} style={{ marginTop: 4 }}>
                                                <Tag color="default" style={{ fontSize: 11 }}>{log.user?.role}</Tag>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </Text>
                                            </Space>
                                        </div>
                                    ),
                                }))}
                            />
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
