import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form, Input, Select, Button, Typography, Alert, Steps, Divider } from 'antd';
import {
    MailOutlined, LockOutlined, UserOutlined, RocketOutlined, HomeOutlined,
    BankOutlined, EnvironmentOutlined, ArrowLeftOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import LocationPickerMap from '../components/LocationPickerMap';

const { Title, Text } = Typography;

export default function Signup() {
    const navigate = useNavigate();
    const { signupMSME } = useAuth();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form] = Form.useForm();

    const [formData, setFormData] = useState({
        companyName: '',
        gstNumber: '',
        industry: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        latitude: null,
        longitude: null,
    });

    const handleStep1 = async () => {
        try {
            await form.validateFields(['companyName', 'gstNumber', 'email', 'password', 'confirmPassword']);
            const values = form.getFieldsValue();
            if (values.password !== values.confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            setFormData(prev => ({ ...prev, ...values }));
            setError(null);
            setStep(1);
        } catch {
            // validation errors shown by antd
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            await signupMSME({
                email: formData.email,
                password: formData.password,
                company_name: formData.companyName,
                gst_number: formData.gstNumber,
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
            });
            navigate('/msme');
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left Hero Panel — same as Login */}
            <div
                className="auth-hero"
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 48,
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(24,144,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(24,144,255,0.06)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 40, height: 40, background: '#1890ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RocketOutlined style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>Enterprise Logistics</span>
                </div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
                    <h1 style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, marginBottom: 20, color: '#fff' }}>
                        Start shipping smarter today.
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                        Create your MSME partner account and get instant access to our logistics platform. Manage shipments, track deliveries, and grow your business.
                    </p>
                    <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                            <span style={{ fontSize: 14, opacity: 0.8 }}>Free to Get Started</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                            <span style={{ fontSize: 14, opacity: 0.8 }}>No Credit Card Required</span>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, fontSize: 13, opacity: 0.4 }}>
                    © 2026 Enterprise Logistics Platform
                </div>
            </div>

            {/* Right Signup Panel */}
            <div
                style={{
                    flex: 1,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '36px max(36px, 8%)',
                    maxWidth: 640,
                    overflowY: 'auto',
                }}
            >
                {/* Back to Home */}
                <div style={{ marginBottom: 16 }}>
                    <Link to="/" style={{ color: '#8c8c8c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HomeOutlined /> Back to Home
                    </Link>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                        Create your account
                    </Title>
                    <Text type="secondary">Register as an MSME partner to start shipping</Text>
                </div>

                {/* Step Indicator */}
                <Steps
                    current={step}
                    size="small"
                    style={{ marginBottom: 28 }}
                    items={[
                        { title: 'Company & Account', icon: <BankOutlined /> },
                        { title: 'Location', icon: <EnvironmentOutlined /> },
                    ]}
                />

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        style={{ marginBottom: 20 }}
                    />
                )}

                {/* Step 1: Company & Account Info */}
                {step === 0 && (
                    <Form form={form} layout="vertical" size="large" initialValues={formData}>
                        <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Company name is required' }]}>
                            <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} placeholder="Acme Logistics Ltd." />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Form.Item name="gstNumber" label="GST Number" rules={[{ required: true, message: 'GST is required' }]}>
                                <Input placeholder="22AAAAA0000A1Z5" />
                            </Form.Item>
                            <Form.Item name="industry" label="Industry">
                                <Select placeholder="Select Industry">
                                    <Select.Option value="manufacturing">Manufacturing</Select.Option>
                                    <Select.Option value="textiles">Textiles</Select.Option>
                                    <Select.Option value="electronics">Electronics</Select.Option>
                                    <Select.Option value="food">Food & Beverage</Select.Option>
                                    <Select.Option value="other">Other</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="email"
                            label="Official Email"
                            rules={[
                                { required: true, message: 'Email is required' },
                                { type: 'email', message: 'Enter a valid email' },
                            ]}
                        >
                            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="jane@company.com" />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Form.Item
                                name="password"
                                label="Password"
                                rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'Min 6 characters' }]}
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Min 6 characters" />
                            </Form.Item>
                            <Form.Item
                                name="confirmPassword"
                                label="Confirm Password"
                                rules={[{ required: true, message: 'Please confirm password' }]}
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Confirm password" />
                            </Form.Item>
                        </div>

                        <Button
                            type="primary"
                            onClick={handleStep1}
                            block
                            icon={<ArrowRightOutlined />}
                            style={{ height: 48, fontWeight: 600, fontSize: 15, marginTop: 8 }}
                        >
                            Continue to Location
                        </Button>
                    </Form>
                )}

                {/* Step 2: Location & Address */}
                {step === 1 && (
                    <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            Click on the map to pin your business location. This helps us assign the right delivery zones.
                        </Text>

                        <div style={{ height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9', marginBottom: 16 }}>
                            <LocationPickerMap onLocationSelect={(loc) => setFormData(prev => ({
                                ...prev,
                                latitude: loc.lat,
                                longitude: loc.lng,
                                address: loc.address || prev.address
                            }))} />
                        </div>

                        {formData.latitude && (
                            <Alert
                                type="success"
                                message={`Location captured: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`}
                                description={formData.address || 'Address detected from map'}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <Button
                                onClick={() => setStep(0)}
                                icon={<ArrowLeftOutlined />}
                                style={{ height: 48, flex: 1 }}
                            >
                                Back
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                block
                                style={{ height: 48, flex: 2, fontWeight: 600, fontSize: 15 }}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </div>
                    </div>
                )}

                <Divider style={{ margin: '16px 0 12px' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>or</Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ fontWeight: 600 }}>
                            Sign In
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
