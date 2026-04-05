import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Divider,
  Tag,
  Grid
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  CompassOutlined,
  CarOutlined,
  EnvironmentOutlined,
  BellOutlined,
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  MenuOutlined,
  CloseOutlined,
  BankOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Content, Header, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

/* ─── Original Color Theme Tokens ─── */
const PRIMARY = '#1677ff'; // Ant Design Primary Blue
const PRIMARY_LIGHT = '#93c5fd'; // Light Blue gradient end
const ACCENT = '#facc15'; // Yellow Accent
const BG_PAGE = '#f0f2f5'; // Standard Ant Design gray background
const BG_WHITE = '#ffffff';

// Original Bright Blue Gradient
const HERO_GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`;

const sectionPad = { padding: '80px 0' };
const wrap = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

/* ─── Data ─── */
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Roles', href: '#roles' },
  { label: 'Contact', href: '#contact' },
];

const MODULES = [
  {
    icon: <FileTextOutlined style={{ fontSize: 24, color: PRIMARY }} />,
    title: 'Order Request System',
    tag: 'Intake',
    desc: 'Departments raise requests instantly. Track statuses through a structured pipeline: Pending → In Transit → Completed.',
  },
  {
    icon: <CalendarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
    title: 'Trip Planning & Scheduling',
    tag: 'Scheduling',
    desc: 'Admins assign approved requests to vehicles via a priority algorithm factoring in urgency and live availability.',
  },
  {
    icon: <CompassOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    title: 'Route Optimization API',
    tag: 'Google API',
    desc: 'Native integration with Google Maps to compute the most efficient delivery sequence and minimise distances.',
  },
  {
    icon: <CarOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    title: 'Vehicle & Vendor Control',
    tag: 'Fleet',
    desc: 'Maintain a live registry of your entire fleet, vendor contracts, capacity ratings, and availability windows.',
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
    title: 'Execution & Tracking',
    tag: 'Live GPS',
    desc: 'Drivers receive interactive trip sheets on the mobile app. GPS tracking streams location to the dashboard.',
  },
  {
    icon: <BellOutlined style={{ fontSize: 24, color: '#fadb14' }} />,
    title: 'Automated Notifications',
    tag: 'Alerts',
    desc: 'System-generated alerts keep departments instantly informed when a shipment is accepted or delivered.',
  },
];

const STEPS = [
  { title: 'Request', desc: 'Department submits logistics request.' },
  { title: 'Schedule', desc: 'Admin assigns vehicle and priority.' },
  { title: 'Optimise', desc: 'Google API computes exact sequence.' },
  { title: 'Execute', desc: 'Driver confirms drops via mobile.' },
  { title: 'Track', desc: 'Live GPS updates operations desk.' },
];

const ROLES = [
  {
    icon: <TeamOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    role: 'Admin',
    color: 'purple',
    subtitle: 'Fleet Control',
    capabilities: [
      'Schedule & assign trips to vehicles',
      'Trigger precise route optimisation',
      'Monitor live trips on map dashboard',
      'Manage users, vendors & metrics',
    ],
  },
  {
    icon: <UserOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
    role: 'Department User',
    color: 'cyan',
    subtitle: 'Track Requests',
    capabilities: [
      'Raise logistics requests instantly',
      'Specify pickup, destination & priority',
      'Receive automated status alerts',
      'View total history of past deliveries',
    ],
  },
  {
    icon: <IdcardOutlined style={{ fontSize: 28, color: '#fa541c' }} />,
    role: 'Driver',
    color: 'volcano',
    subtitle: 'Mobile Execution',
    capabilities: [
      'Access trip sheets on mobile app',
      'Follow optimised route sequence',
      'Update delivery status at each stop',
      'Broadcast real-time GPS locations',
    ],
  },
];

const BENEFITS = [
  { icon: <ClockCircleOutlined />, title: 'Faster Turnaround', desc: 'Automated scheduling algorithms eliminate manual dispatch delays.' },
  { icon: <CompassOutlined />, title: 'Lower Fuel Costs', desc: 'Google Route Optimization ensures vehicles take the shortest path.' },
  { icon: <BarChartOutlined />, title: 'Higher Utilisation', desc: 'Capacity tracking prevents over-allocation and empty runs.' },
  { icon: <DashboardOutlined />, title: '100% Visibility', desc: 'End-to-end GPS lifecycles provide unquestionable ground truth.' },
];

/* ─── Navbar Component ─── */
function NavBar({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href) => {
    setDrawerOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Header
      style={{
        position: 'fixed', zIndex: 999, width: '100%', padding: 0,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        borderBottom: `1px solid ${scrolled ? '#f0f0f0' : 'rgba(255,255,255,0.1)'}`,
        transition: 'all 0.3s'
      }}
    >
      <div style={{ ...wrap, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Space align="center" size={12} style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            boxShadow: scrolled ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: BG_WHITE, border: scrolled ? '1px solid #f0f0f0' : 'none'
          }}>
            <BankOutlined style={{ color: ACCENT, fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: scrolled ? '#1f2937' : '#ffffff', letterSpacing: '-0.5px' }}>
            Enterprise <span style={{ color: scrolled ? PRIMARY : '#bfdbfe' }}>Logistics</span>
          </Title>
        </Space>

        {/* Desktop Menu */}
        {screens.md && (
          <Space size={32}>
            {NAV_LINKS.map(link => (
              <a key={link.href} onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                style={{
                  color: scrolled ? '#4b5563' : 'rgba(255,255,255,0.85)',
                  fontWeight: 500, fontSize: 15, transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = scrolled ? PRIMARY : '#ffffff'}
                onMouseLeave={e => e.target.style.color = scrolled ? '#4b5563' : 'rgba(255,255,255,0.85)'}
              >
                {link.label}
              </a>
            ))}
          </Space>
        )}

        {/* CTA Buttons */}
        <Space size={16}>
          {screens.md && (
            <Button type="text"
              style={{ fontWeight: 500, color: scrolled ? '#4b5563' : '#ffffff' }}
              onClick={() => navigate('/login')}>
              Log In
            </Button>
          )}
          <Button type="primary"
            style={{
              fontWeight: 600, padding: '0 24px', borderRadius: 6,
              background: scrolled ? PRIMARY : BG_WHITE,
              color: scrolled ? BG_WHITE : PRIMARY,
              border: 'none',
              boxShadow: scrolled ? '0 2px 0 rgba(0,0,0,0.045)' : '0 4px 14px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/login')}>
            Get Started
          </Button>
          {!screens.md && (
            <Button type="text" icon={drawerOpen ? <CloseOutlined /> : <MenuOutlined />}
              style={{ color: scrolled ? '#1f2937' : '#ffffff', fontSize: 20 }}
              onClick={() => setDrawerOpen(!drawerOpen)} />
          )}
        </Space>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && !screens.md && (
        <div style={{ background: BG_WHITE, padding: '16px 24px', position: 'absolute', width: '100%', borderBottom: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {NAV_LINKS.map(link => (
            <div key={link.href} style={{ padding: '12px 0' }}>
              <a onClick={(e) => { e.preventDefault(); scrollTo(link.href); }} style={{ color: '#1f2937', fontSize: 16, fontWeight: 500 }}>
                {link.label}
              </a>
            </div>
          ))}
          <Divider style={{ margin: '12px 0' }} />
          <Button block type="primary" size="large" onClick={() => { setDrawerOpen(false); navigate('/login'); }}>
            Log In to Portal
          </Button>
        </div>
      )}
    </Header>
  );
}

/* ─── Main Landing Page Content ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  return (
    <Layout style={{ minHeight: '100vh', background: BG_PAGE }}>
      <NavBar navigate={navigate} />

      <Content>
        {/* ══ 1. HERO SECTION (Original Bright Theme) ══ */}
        <section id="home" style={{
          background: HERO_GRADIENT,
          padding: '160px 0 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle decoration to breakup completely flat background */}
          <div style={{ position: 'absolute', top: -100, left: -50, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -150, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

          <div style={{ ...wrap, position: 'relative', zIndex: 1 }}>

            {/* System Title Pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20, padding: '6px 16px', marginBottom: 28,
            }}>
              <AppstoreOutlined style={{ color: ACCENT }} />
              <Text style={{ color: BG_WHITE, fontWeight: 500, fontSize: 13, letterSpacing: 0.5 }}>
                Inbound Logistics Cluster Management System
              </Text>
            </div>

            {/* Main Headline */}
            <Row justify="center">
              <Col xs={24} md={20} lg={16}>
                <Title style={{
                  color: BG_WHITE,
                  fontSize: 'clamp(38px, 5vw, 56px)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  marginBottom: 24,
                }}>
                  Automate, Optimise, and Track <br />
                  <span style={{ color: ACCENT }}>Every Logistics Trip</span> — End to End
                </Title>

                <Paragraph style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 'clamp(16px, 2vw, 18px)',
                  lineHeight: 1.6,
                  maxWidth: 680, margin: '0 auto 40px',
                }}>
                  Replace manual coordination with an integrated platform. Unify request intake,
                  priority scheduling, Google-powered route optimisation, and real-time GPS tracking.
                </Paragraph>

                {/* Hero CTA Buttons */}
                <Space size={16} wrap justify="center">
                  <Button size="large" onClick={() => navigate('/login')}
                    style={{
                      height: 50, paddingInline: 32, fontSize: 16,
                      background: BG_WHITE, color: PRIMARY, borderColor: BG_WHITE,
                      fontWeight: 600, borderRadius: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                    }}>
                    Access the System <ArrowRightOutlined />
                  </Button>
                  <Button size="large" onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      height: 50, paddingInline: 32, fontSize: 16,
                      background: 'transparent', color: BG_WHITE, borderColor: 'rgba(255,255,255,0.4)',
                      fontWeight: 500, borderRadius: 6
                    }}>
                    Explore Features
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Clean Stats Row (Properly aligned instead of random dots) */}
            <div style={{ marginTop: 72 }}>
              <Row justify="center" gutter={[32, 24]}>
                {[
                  { label: '6 Integrated Modules', icon: <AppstoreOutlined /> },
                  { label: '3 Dedicated Roles', icon: <TeamOutlined /> },
                  { label: 'Real-Time GPS Tracking', icon: <EnvironmentOutlined /> },
                  { label: 'Google Route API', icon: <CompassOutlined /> },
                ].map((stat, i) => (
                  <Col key={i}>
                    <Space align="center" style={{ color: BG_WHITE, fontSize: 15, fontWeight: 500 }}>
                      <span style={{ color: ACCENT, fontSize: 18 }}>{stat.icon}</span>
                      {stat.label}
                    </Space>
                  </Col>
                ))}
              </Row>
            </div>

          </div>
        </section>

        {/* ══ 2. ABOUT THE SYSTEM ══ */}
        <section id="features" style={{ ...sectionPad, background: BG_WHITE }}>
          <div style={wrap}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={10}>
                <Tag color="blue" style={{ marginBottom: 16, padding: '4px 12px', borderRadius: 4, fontWeight: 600 }}>THE PROBLEM</Tag>
                <Title level={2} style={{ fontWeight: 800, color: '#1f2937', marginBottom: 20 }}>
                  Eliminating Manual Logistics Bottlenecks
                </Title>
                <Paragraph style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.8, marginBottom: 16 }}>
                  Most operations rely on scattered spreadsheets, calls, and ad-hoc department coordination.
                  This causes delayed deliveries, un-utilised fleet vehicles, and zero operations visibility.
                </Paragraph>
                <Paragraph style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.8 }}>
                  Our platform replaces this fragmentation with a <strong>centralised control tower</strong> —
                  unifying intake, automated scheduling, mapping, and driver GPS into one single pane of glass.
                </Paragraph>
              </Col>

              <Col xs={24} lg={14}>
                <Row gutter={[20, 20]}>
                  {BENEFITS.map((item, idx) => (
                    <Col xs={24} sm={12} key={idx}>
                      <Card bordered={false} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ color: PRIMARY, fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
                        <Title level={5} style={{ margin: '0 0 8px 0', color: '#111827' }}>{item.title}</Title>
                        <Text style={{ color: '#6b7280', fontSize: 14 }}>{item.desc}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </div>
        </section>

        {/* ══ 3. CORE MODULES ══ */}
        <section id="modules" style={{ ...sectionPad, background: BG_PAGE }}>
          <div style={wrap}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Tag color="cyan" style={{ marginBottom: 16, padding: '4px 12px', borderRadius: 4, fontWeight: 600 }}>SYSTEM ARCHITECTURE</Tag>
              <Title level={2} style={{ fontWeight: 800, color: '#1f2937', margin: '0 0 16px' }}>
                Six Modules, One Integrated Core
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#4b5563', maxWidth: 600, margin: '0 auto' }}>
                Every module is strictly purpose-built to execute its phase perfectly while seamlessly
                handing logic to the next without human interruption.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              {MODULES.map((m, idx) => (
                <Col xs={24} sm={12} lg={8} key={idx}>
                  <Card bordered={false} hoverable style={{ height: '100%', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 8 }}>{m.icon}</div>
                      <Tag color="blue" bordered={false}>{m.tag}</Tag>
                    </div>
                    <Title level={4} style={{ fontSize: 18, color: '#1f2937', marginBottom: 8 }}>{m.title}</Title>
                    <Paragraph style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{m.desc}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* ══ 4. HOW IT WORKS FLOW ══ */}
        <section style={{ ...sectionPad, background: BG_WHITE }}>
          <div style={wrap}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Tag color="volcano" style={{ marginBottom: 16, padding: '4px 12px', borderRadius: 4, fontWeight: 600 }}>WORKFLOW</Tag>
              <Title level={2} style={{ fontWeight: 800, color: '#1f2937', margin: '0 0 16px' }}>
                End-to-End Automation Flow
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#4b5563', maxWidth: 600, margin: '0 auto' }}>
                The lifecycle of a logistics trip is perfectly mapped out and automated at every single stage.
              </Paragraph>
            </div>

            <Row justify="center">
              <Col xs={24} lg={22}>
                <Row gutter={[16, 24]}>
                  {STEPS.map((step, idx) => (
                    <Col xs={24} md={12} lg={24 / STEPS.length} key={idx} style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {screens.lg && idx !== STEPS.length - 1 && (
                          <div style={{ position: 'absolute', top: 30, right: '-50%', width: '100%', height: 2, background: '#e5e7eb', zIndex: 0 }} />
                        )}
                        <div style={{
                          width: 60, height: 60, margin: '0 auto 16px', borderRadius: '50%',
                          background: BG_WHITE, border: `2px solid ${PRIMARY}`, color: PRIMARY,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, fontWeight: 800, position: 'relative', zIndex: 1,
                          boxShadow: '0 4px 12px rgba(22,119,255,0.1)'
                        }}>
                          0{idx + 1}
                        </div>
                        <Title level={5} style={{ color: '#1f2937', margin: '0 0 8px 0' }}>{step.title}</Title>
                        <Text style={{ color: '#6b7280', fontSize: 13 }}>{step.desc}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </div>
        </section>

        {/* ══ 5. ROLES SECTION ══ */}
        <section id="roles" style={{ ...sectionPad, background: BG_PAGE, borderTop: '1px solid #e5e7eb' }}>
          <div style={wrap}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Tag color="purple" style={{ marginBottom: 16, padding: '4px 12px', borderRadius: 4, fontWeight: 600 }}>ACCESS CONTROL</Tag>
              <Title level={2} style={{ fontWeight: 800, color: '#1f2937', margin: '0 0 16px' }}>
                Tailored Stakeholder Portals
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#4b5563', maxWidth: 600, margin: '0 auto' }}>
                Three distinct user roles, each equipped with the exact tracking, execution, and dispatching capabilities they need to succeed.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]} justify="center">
              {ROLES.map((r, idx) => (
                <Col xs={24} md={8} key={idx}>
                  <Card bordered={false} style={{ height: '100%', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, margin: '0 auto 12px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {r.icon}
                      </div>
                      <Title level={4} style={{ margin: '0 0 4px 0', color: '#1f2937' }}>{r.role}</Title>
                      <Tag color={r.color} bordered={false}>{r.subtitle}</Tag>
                    </div>
                    <Divider style={{ margin: '16px 0' }} />
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                      {r.capabilities.map((cap, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                          <Text style={{ color: '#4b5563' }}>{cap}</Text>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* ══ 6. FINAL CTA & FOOTER STRIP ══ */}
        <section id="contact" style={{ padding: '80px 0 0 0', background: BG_WHITE }}>
          <div style={wrap}>
            <div style={{
              background: HERO_GRADIENT,
              borderRadius: 16, padding: screens.md ? '48px 64px' : '32px 24px',
              display: 'flex', flexDirection: screens.md ? 'row' : 'column',
              alignItems: 'center', justifyContent: 'space-between', gap: 32,
              boxShadow: '0 20px 40px -10px rgba(22,119,255,0.25)'
            }}>
              <div style={{ flex: 1, textAlign: screens.md ? 'left' : 'center' }}>
                <Title level={2} style={{ color: BG_WHITE, margin: '0 0 12px 0', fontWeight: 800 }}>Streamline Operations Today</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0 }}>
                  Log in now. Admins can initiate planning, and drivers can instantly pull their assignments via mobile.
                </Paragraph>
              </div>
              <Button size="large" onClick={() => navigate('/login')}
                style={{ height: 50, padding: '0 40px', fontWeight: 700, borderRadius: 6, color: PRIMARY, border: 'none' }}>
                Launch Platform
              </Button>
            </div>

            {/* Quick Contact Line */}
            <Row justify="center" gutter={[32, 16]} style={{ padding: '48px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Col><Space><MailOutlined style={{ color: PRIMARY }} /><Text type="secondary">support@enterpriselogistics.com</Text></Space></Col>
              <Col><Space><PhoneOutlined style={{ color: PRIMARY }} /><Text type="secondary">+1 (800) LOGISTICS DESK</Text></Space></Col>
            </Row>
          </div>
        </section>
      </Content>

      <Footer style={{ background: BG_WHITE, padding: '24px 0' }}>
        <div style={wrap}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Space align="center">
                <BankOutlined style={{ color: PRIMARY, fontSize: 16 }} />
                <Text strong style={{ color: '#1f2937' }}>Enterprise Logistics Platform</Text>
              </Space>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>&copy; {new Date().getFullYear()} Operations App. All rights reserved.</Text>
            </Col>
          </Row>
        </div>
      </Footer>
    </Layout>
  );
}
