import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { Spin, Button, Tag, message } from 'antd';
import { PrinterOutlined, CheckCircleFilled, CarOutlined, UserOutlined, ClockCircleOutlined, EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';

export default function DeliveryReceipt() {
    const { id } = useParams();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { message.error('Authentication required'); return; }
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

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
            <Spin size="large" />
        </div>
    );
    if (!shipment) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
            <span style={{ color: '#ef4444', fontSize: 16 }}>Receipt not found</span>
        </div>
    );

    const { receipt, items, assigned_vehicle, assigned_driver } = shipment;
    const totalQty = items ? items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
    const totalWeight = items ? items.reduce((s, i) => s + (i.weight || 0) * (i.quantity || 1), 0) : (shipment.total_weight || 0);

    return (
        <div style={{ background: '#0f172a', minHeight: '100vh', padding: '32px 16px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            {/* Action bar */}
            <div className="no-print" style={{ maxWidth: 860, margin: '0 auto 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                    icon={<PrinterOutlined />}
                    onClick={() => window.print()}
                    style={{ background: '#facc15', borderColor: '#facc15', color: '#000', fontWeight: 600 }}
                >
                    Print Receipt
                </Button>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid #1e293b' }}>

                {/* Header */}
                <div style={{ background: '#1e293b', padding: '36px 40px', borderBottom: '3px solid #facc15' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, background: '#facc15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CarOutlined style={{ color: '#000', fontSize: 20 }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>DELIVERY RECEIPT</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Enterprise Logistics Operations</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Tracking Number</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#facc15', fontFamily: 'monospace', letterSpacing: 2 }}>{shipment.tracking_number}</div>
                            <div style={{ marginTop: 10 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#facc15', letterSpacing: 1 }}>
                                    <CheckCircleFilled style={{ fontSize: 12 }} /> DELIVERED &amp; CONFIRMED
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Route */}
                <div style={{ background: '#162032', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                            <EnvironmentOutlined style={{ color: '#facc15', marginRight: 4 }} />From
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{shipment.pickup_contact || 'Sender'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{shipment.pickup_address}</div>
                        {shipment.pickup_phone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{shipment.pickup_phone}</div>}
                    </div>
                    <div style={{ color: '#facc15', fontSize: 20, flexShrink: 0 }}><ArrowRightOutlined /></div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                            <EnvironmentOutlined style={{ color: '#ef4444', marginRight: 4 }} />To
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{receipt?.receiver_name || shipment.drop_contact || 'Receiver'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{shipment.drop_address}</div>
                        {(receipt?.receiver_phone || shipment.drop_phone) && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{receipt?.receiver_phone || shipment.drop_phone}</div>}
                    </div>
                </div>

                {/* Info cards */}
                <div style={{ background: '#0f172a', padding: '24px 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, borderBottom: '1px solid #1e293b' }}>
                    {[
                        {
                            icon: <ClockCircleOutlined style={{ color: '#facc15', fontSize: 18 }} />,
                            label: 'Delivered At',
                            value: shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleString() : 'N/A',
                            bg: 'rgba(250,204,21,0.08)',
                            border: 'rgba(250,204,21,0.2)',
                        },
                        {
                            icon: <CarOutlined style={{ color: '#34d399', fontSize: 18 }} />,
                            label: 'Vehicle',
                            value: assigned_vehicle ? assigned_vehicle.plate_number : 'N/A',
                            sub: assigned_vehicle?.name,
                            bg: 'rgba(52,211,153,0.08)',
                            border: 'rgba(52,211,153,0.2)',
                        },
                        {
                            icon: <UserOutlined style={{ color: '#60a5fa', fontSize: 18 }} />,
                            label: 'Driver',
                            value: assigned_driver ? assigned_driver.name : 'N/A',
                            sub: assigned_driver?.phone,
                            bg: 'rgba(96,165,250,0.08)',
                            border: 'rgba(96,165,250,0.2)',
                        },
                    ].map((card, i) => (
                        <div key={i} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {card.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{card.label}</div>
                                <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{card.value}</div>
                                {card.sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{card.sub}</div>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Items table */}
                <div style={{ background: '#0f172a', padding: '24px 40px', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Items Delivered</div>
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1e293b' }}>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left', width: 36 }}>#</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left' }}>Item</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Weight (kg)</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Dimensions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items && items.length > 0 ? items.map((item, idx) => (
                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#0f172a' : '#111827', borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>{idx + 1}</td>
                                        <td style={{ padding: '14px 16px', fontSize: 13, verticalAlign: 'top' }}>
                                            <span style={{ fontWeight: 600, color: '#f1f5f9', display: 'block', marginBottom: 2 }}>{item.name}</span>
                                            {item.description && <span style={{ fontSize: 11, color: '#475569' }}>{item.description}</span>}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#facc15', fontSize: 13 }}>{item.quantity}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, color: '#34d399', fontWeight: 600 }}>{item.weight ?? '—'} kg</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, color: '#475569' }}>
                                            {(item.length && item.width && item.height) ? `${item.length}×${item.width}×${item.height} cm` : '—'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#475569', fontSize: 13 }}>No items recorded</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#1e293b', borderTop: '2px solid #facc15' }}>
                                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#f1f5f9' }} colSpan={2}>TOTAL</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#facc15' }}>{totalQty}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#34d399' }}>{totalWeight.toFixed(1)} kg</td>
                                    <td style={{ padding: '14px 16px' }}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Proof & Notes */}
                <div style={{ background: '#0f172a', padding: '24px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderBottom: '1px solid #1e293b' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '20px 22px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>📷 Proof of Delivery</div>
                        {receipt?.photo_url
                            ? <img src={receipt.photo_url} alt="Proof" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #334155' }} />
                            : <span style={{ fontSize: 13, color: '#475569' }}>No photo proof provided.</span>
                        }
                    </div>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '20px 22px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>📝 Notes &amp; Exceptions</div>
                        <span style={{ fontSize: 13, color: receipt?.notes ? '#cbd5e1' : '#475569' }}>
                            {receipt?.notes || 'No notes provided.'}
                        </span>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ background: '#0f172a', padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                    {[
                        { label: 'Driver Signature', confirmed: receipt?.driver_confirmed, sub: receipt?.driver_confirmed ? '✓ Confirmed Digital' : 'Pending' },
                        { label: 'Receiver Signature', confirmed: receipt?.receiver_confirmed, sub: receipt?.receiver_confirmed ? '✓ Confirmed Digital' : 'Pending Confirmation' },
                    ].map((sig, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ height: 52, borderBottom: `2px solid ${sig.confirmed ? '#facc15' : '#334155'}`, marginBottom: 10 }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{sig.label}</div>
                            <div style={{ fontSize: 11, color: sig.confirmed ? '#facc15' : '#475569', marginTop: 4 }}>{sig.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ background: '#1e293b', borderTop: '1px solid #334155', textAlign: 'center', padding: '14px 40px', fontSize: 11, color: '#475569' }}>
                    Enterprise Logistics Operations &nbsp;·&nbsp; {shipment.tracking_number} &nbsp;·&nbsp; Generated {new Date().toLocaleDateString()}
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #0f172a !important; }
                }
            `}</style>
        </div>
    );
}
