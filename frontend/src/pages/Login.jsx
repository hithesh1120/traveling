import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined, BankOutlined, HomeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setError('');
        setLoading(true);

        try {
            const role = await login(values.email, values.password);

            if (role === 'SUPER_ADMIN') navigate('/admin');
            else if (role === 'VENDOR') navigate('/vendor');
            else if (role === 'MSME') navigate('/msme');
            else if (role === 'DRIVER') navigate('/driver');
            else setError('Unknown role');
        } catch (err) {
            console.error(err);
            // Use specific error from backend if available, otherwise generic
            const backendError = err.response?.data?.detail;
            setError(backendError || 'Invalid credentials or server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left Hero Panel */}
            <div
                className="auth-hero"
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #10B981 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 48,
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                    <div
                        style={{
                            width: 36, // Matched to Landing Page
                            height: 36, // Matched to Landing Page
                            background: '#3B82F6', // Keep compatible or match theme? Landing uses #3B82F6 in CSS but Indigo #4F46E5 in theme. Let's stick to LandingPage.css value (.nav-logo) which is #3B82F6.
                            borderRadius: 9, // Landing Page is 9px
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <BankOutlined style={{ fontSize: 20, color: '#fff' }} /> {/* Font size 20 matches Landing Page */}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>Enterprise Logistics</span>
                </div>

                {/* Tagline */}
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
                    <h1 style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, marginBottom: 20, color: '#fff' }}>
                        Enterprise logistics, simplified.
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                        End-to-end visibility from shipment creation to delivery confirmation. Fleet management, dispatch automation, and real-time analytics.
                    </p>
                    <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> {/* Changed to white/light for visibility on green/indigo */}
                            <span style={{ fontSize: 14, opacity: 0.9 }}>Bank-grade Security</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                            <span style={{ fontSize: 14, opacity: 0.9 }}>99.9% Uptime</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'relative', zIndex: 1, fontSize: 13, opacity: 0.6 }}>
                    © 2026 Enterprise Logistics Platform
                </div>
            </div>

            {/* Right Login Panel */}
            <div
                style={{
                    flex: 1,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '48px max(48px, 12%)',
                    maxWidth: 640,
                }}
            >
                {/* Back to Home */}
                <div style={{ marginBottom: 24 }}>
                    <Link to="/" style={{ color: '#64748B', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                        <HomeOutlined /> Back to Home
                    </Link>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ marginBottom: 8, color: '#0F172A', fontWeight: 700 }}>
                        Welcome back
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>Sign in to Enterprise Logistics Operations</Text>
                </div>

                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24 }}
                        closable
                        onClose={() => setError('')}
                    />
                )}

                <Form
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                    autoComplete="off"
                    requiredMark={false} // Cleaner look
                >
                    <Form.Item
                        name="email"
                        label={<span style={{ fontWeight: 500, color: '#334155' }}>Email Address</span>}
                        rules={[
                            { required: true, message: 'Email is required' },
                            { type: 'email', message: 'Enter a valid email' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
                            placeholder="you@company.com"
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span style={{ fontWeight: 500, color: '#334155' }}>Password</span>}
                        rules={[{ required: true, message: 'Password is required' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
                            placeholder="••••••••"
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<LoginOutlined />}
                            block
                            style={{
                                height: 48,
                                fontWeight: 600,
                                fontSize: 16,
                                borderRadius: 8,
                                background: '#4F46E5', // Indigo-600
                                borderColor: '#4F46E5',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                            }}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <Divider style={{ margin: '8px 0 16px' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>or</Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ fontWeight: 600 }}>
                            Create Account
                        </Link>
                    </Text>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .auth-hero { display: none !important; }
                }
            `}</style>
        </div>
    );
}
