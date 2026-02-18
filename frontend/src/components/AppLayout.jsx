import { useState, useEffect } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag, Badge, theme, Tooltip, Button } from 'antd';
import axios from 'axios';
import {
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  FundOutlined,
  SendOutlined,
  BellOutlined,
  AimOutlined,
  HomeOutlined,
  SettingOutlined,
  HistoryOutlined,
  BankOutlined,
  CompassOutlined,
  BoxPlotOutlined,
  DownOutlined,
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  VENDOR: 'Vendor (Factory)', // Keeping as is but restricted
  MSME: 'Business (MSME)',
  DRIVER: 'Driver',
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'purple',
  VENDOR: 'blue',
  MSME: 'cyan',
  DRIVER: 'volcano',
};

const getSettingsPath = (role) => {
  switch (role) {
    case 'SUPER_ADMIN': return '/admin/settings';
    case 'MSME': return '/msme/settings';
    case 'DRIVER': return '/driver/settings';
    default: return '/settings';
  }
};

const getMenuItems = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Dashboard</Link> },
        { type: 'divider' },
        { key: '/admin/shipments', icon: <SendOutlined />, label: <Link to="/admin/shipments">Shipments</Link> },
        { key: '/admin/locations', icon: <EnvironmentOutlined />, label: <Link to="/admin/locations">Saved Locations</Link> },
        { key: '/admin/vehicles', icon: <CarOutlined />, label: <Link to="/admin/vehicles">Vehicles</Link> },

        { key: '/admin/analytics', icon: <FundOutlined />, label: <Link to="/admin/analytics">Analytics</Link> },
        { type: 'divider' },
        { key: '/admin/reports', icon: <BarChartOutlined />, label: <Link to="/admin/reports">Reports</Link> },
        { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Users</Link> },
        { type: 'divider' },
        { key: '/admin/settings', icon: <SettingOutlined />, label: <Link to="/admin/settings">Settings</Link> },
      ];
    case 'MSME':
      return [
        { key: '/msme', icon: <DashboardOutlined />, label: <Link to="/msme">Dashboard</Link> },
        { key: '/msme/shipments', icon: <SendOutlined />, label: <Link to="/msme/shipments">My Shipments</Link> },
        { key: '/msme/locations', icon: <EnvironmentOutlined />, label: <Link to="/msme/locations">Saved Company Locations</Link> },
        { type: 'divider' },
        { key: '/msme/settings', icon: <SettingOutlined />, label: <Link to="/msme/settings">Settings</Link> },
      ];
    case 'DRIVER':
      return [
        { key: '/driver', icon: <DashboardOutlined />, label: <Link to="/driver">Dashboard</Link> },
        { key: '/driver/history', icon: <HistoryOutlined />, label: <Link to="/driver/history">Delivery History</Link> },
        { type: 'divider' },
        { key: '/driver/settings', icon: <SettingOutlined />, label: <Link to="/driver/settings">Settings</Link> },
      ];
    default:
      return [];
  }
};

export default function AppLayout({ children }) {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { token: themeToken } = theme.useToken();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setNotifications(res.data.slice(0, 5)); // Keep top 5
          setUnreadCount(res.data.filter(n => !n.read).length);
        })
        .catch(() => { });
    }
  }, [token, location.pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const menuItems = getMenuItems(user?.role);

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600 }}>{user?.name || user?.email}</div>
          <Tag color={ROLE_COLORS[user?.role]} style={{ marginTop: 4 }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </Tag>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate(getSettingsPath(user?.role)),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={256}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          boxShadow: 'none', // Remove shadow for cleaner look
          zIndex: 100
        }}
        trigger={null}
        theme="light"
        className="custom-sider"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo - Matches Landing Page */}
          <div
            style={{
              height: 64, // Reduced height
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0' : '0 24px',
              borderBottom: '1px solid #E2E8F0',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 32, // Slightly smaller logo
              height: 32,
              background: '#4F46E5', // Indigo-600
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BankOutlined style={{ fontSize: 16, color: '#fff' }} />
            </div>

            {!collapsed && (
              <span
                style={{
                  color: '#0F172A', // Slate-900
                  fontSize: 15,
                  fontWeight: 600,
                  marginLeft: 12,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em'
                }}
              >
                Enterprise Logistics
              </span>
            )}
          </div>

          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{
              borderRight: 0,
              marginTop: 8,
              background: 'transparent',
              flex: 1,
              overflowY: 'auto',
              padding: '0 8px' // Tighter padding
            }}
            className="custom-sidebar-menu"
          />
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'all 0.2s', background: '#F8FAFC', minHeight: '100vh' }}>
        {/* Header */}
        <Header
          style={{
            background: '#FFFFFF',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            height: 64, // Reduced height from 72
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                onClick={() => setCollapsed(false)}
                style={{ fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              />
            ) : (
              <MenuFoldOutlined
                onClick={() => setCollapsed(true)}
                style={{ fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              />
            )}
            <div style={{ height: 24, paddingLeft: 16, borderLeft: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>
                Operations Dashboard
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="Back to Home">
              <Button
                type="text"
                icon={<HomeOutlined />}
                onClick={() => {
                  const paths = {
                    SUPER_ADMIN: '/admin',
                    MSME: '/msme',
                    DRIVER: '/driver'
                  };
                  navigate(paths[user?.role] || '/');
                }}
                style={{ color: '#64748B', fontSize: 16 }}
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: notifications.length > 0 ? [
                  {
                    label: <Text type="secondary" style={{ fontSize: 12 }}>Recent Notifications</Text>,
                    key: 'header',
                    disabled: true
                  },
                  { type: 'divider' },
                  ...notifications.map(n => ({
                    key: n.id,
                    label: (
                      <div style={{ padding: '8px 0', maxWidth: 260 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text strong={!n.read} style={{ fontSize: 13, color: '#1E293B' }}>{n.title}</Text>
                          {!n.read && <Badge status="processing" color="#4F46E5" />}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    ),
                  })),
                  { type: 'divider' },
                  {
                    label: <div style={{ textAlign: 'center', color: '#4F46E5', fontWeight: 500 }}>View All Notifications</div>,
                    key: 'view-all',
                    onClick: () => {
                      const prefix = {
                        SUPER_ADMIN: '/admin',
                        MSME: '/msme',
                        DRIVER: '/driver'
                      }[user?.role] || '';
                      navigate(`${prefix}/notifications`);
                    }
                  }
                ] : [{ label: 'No new notifications', key: 'empty', disabled: true }]
              }}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ width: 320 }}
            >
              <div style={{ cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                <Badge count={unreadCount} size="small" offset={[0, 0]} color="#EF4444">
                  <BellOutlined style={{ fontSize: 18, color: '#64748B' }} />
                </Badge>
              </div>
            </Dropdown>

            <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 4px' }} />

            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 999,
                  transition: 'background 0.2s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <Avatar
                  style={{ backgroundColor: ROLE_COLORS[user?.role] || themeToken.colorPrimary }}
                  icon={<UserOutlined />}
                  size="small"
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                    {user?.name || user?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    {ROLE_LABELS[user?.role] || user?.role}
                  </div>
                </div>
                <DownOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: 32,
            background: 'transparent',
            minHeight: 'calc(100vh - 72px)',
            maxWidth: 1600,
            width: '100%',
            margin: '0 auto'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
