import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { Spin, Card, Typography, Divider, Row, Col, Button, Image, Tag, Space, message } from 'antd';
import { PrinterOutlined, DownloadOutlined, CheckCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DeliveryReceipt() {
    const { id } = useParams();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                // We use the public endpoint if available, or just the shipment details
                // Since our backend requires auth, this page typically requires login
                // For a public receipt, we'd need a tokenless endpoint, but for now assuming internal use
                const token = localStorage.getItem('token');
                if (!token) {
                    message.error('Authentication required');
                    return;
                }
                const res = await axios.get(`${API_BASE_URL}/shipments/${id}/receipt`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setShipment(res.data);
            } catch (err) {
                console.error(err);
                message.error('Failed to load receipt');
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!shipment) return <div style={{ textAlign: 'center', padding: 50 }}><Text type="danger">Receipt not found</Text></div>;

    const { receipt, items, assigned_vehicle, assigned_driver } = shipment;

    return (
        <div style={{ padding: 40, background: '#f5f5f5', minHeight: '100vh' }}>
            {/* Action Bar - Hidden in Print */}
            <div className="no-print" style={{ maxWidth: 800, margin: '0 auto 20px', display: 'flex', justifyContent: 'end', gap: 10 }}>
                <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Receipt</Button>
            </div>

            <Card
                className="receipt-card"
                style={{ maxWidth: 800, margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                bodyStyle={{ padding: 40 }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2} style={{ marginBottom: 0 }}>DELIVERY RECEIPT</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Tracking #: {shipment.tracking_number}</Text>
                    <br />
                    <Tag color="green" icon={<CheckCircleFilled />} style={{ marginTop: 10, fontSize: 14, padding: '4px 10px' }}>
                        DELIVERED & CONFIRMED
                    </Tag>
                </div>

                {/* Details Grid */}
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Title level={5}>FROM (SENDER)</Title>
                        <Text strong>Logistics Hub / Vendor</Text><br />
                        <Text>{shipment.pickup_address}</Text><br />
                        <Text>{shipment.pickup_contact} | {shipment.pickup_phone}</Text>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>TO (RECEIVER)</Title>
                        <Text strong>{receipt.receiver_name}</Text><br />
                        <Text>{shipment.drop_address}</Text><br />
                        <Text>{receipt.receiver_phone || shipment.drop_phone}</Text>
                    </Col>
                </Row>

                <Divider />

                {/* Logistics Info */}
                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Text type="secondary">Delivered At</Text><br />
                        <Text strong>{new Date(shipment.delivered_at).toLocaleString()}</Text>
                    </Col>
                    <Col span={8}>
                        <Text type="secondary">Vehicle</Text><br />
                        <Text strong>{assigned_vehicle?.plate_number} ({assigned_vehicle?.name})</Text>
                    </Col>
                    <Col span={8}>
                        <Text type="secondary">Driver</Text><br />
                        <Text strong>{assigned_driver?.name} (ID: {assigned_driver?.id})</Text>
                    </Col>
                </Row>

                <Divider />

                {/* Items */}
                <Title level={5}>ITEMS DELIVERED</Title>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                            <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: 8 }}>{item.name} <br /><Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text></td>
                                <td style={{ textAlign: 'right', padding: 8 }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', padding: 8 }}>{item.weight} kg</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={{ padding: 8, fontWeight: 'bold' }}>TOTAL</td>
                            <td style={{ textAlign: 'right', padding: 8, fontWeight: 'bold' }}>{items.reduce((s, i) => s + i.quantity, 0)}</td>
                            <td style={{ textAlign: 'right', padding: 8, fontWeight: 'bold' }}>{shipment.total_weight} kg</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Proof of Delivery */}
                <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, marginTop: 40 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Title level={5} style={{ marginTop: 0 }}>Proof of Delivery</Title>
                            {receipt.photo_url && (
                                <Image
                                    src={receipt.photo_url}
                                    alt="Proof of Delivery"
                                    style={{ maxHeight: 150, borderRadius: 4, border: '1px solid #d9d9d9' }}
                                />
                            )}
                            {!receipt.photo_url && <Text type="secondary">No photo proof provided.</Text>}
                        </Col>
                        <Col span={12}>
                            <Title level={5} style={{ marginTop: 0 }}>Notes & Exceptions</Title>
                            <Text>{receipt.notes || 'No notes provided.'}</Text>
                        </Col>
                    </Row>
                </div>

                {/* Signatures */}
                <Row gutter={40} style={{ marginTop: 60, textAlign: 'center' }}>
                    <Col span={12}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: 10 }}>
                            <Text strong>Driver Signature</Text><br />
                            <Text type="secondary">Confirmed Digital</Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: 10 }}>
                            <Text strong>Receiver Signature</Text><br />
                            <Text type="secondary">Confirmed Digital</Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .receipt-card { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                }
            `}</style>
        </div>
    );
}
