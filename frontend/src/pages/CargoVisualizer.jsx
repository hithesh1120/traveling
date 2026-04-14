import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Card, Row, Col, Select, Typography, Space, Tag, Slider,
  Progress, Statistic, Segmented, Empty, Spin, message, Button, Tooltip,
} from 'antd';
import {
  CarOutlined, DashboardOutlined, BoxPlotOutlined,
  ExpandOutlined, ReloadOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import TruckCargoVisualizer from '../components/TruckCargoVisualizer';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TYPE_LABELS = { TRUCK: 'Truck', VAN: 'Van', PICKUP: 'Pickup', FLATBED: 'Flatbed', CONTAINER: 'Container' };
const STATUS_COLORS = { AVAILABLE: '#d4a017', ON_TRIP: '#e87a2e', MAINTENANCE: '#faad14', INACTIVE: '#d9d9d9' };
const STATUS_LABELS = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', MAINTENANCE: 'Maintenance', INACTIVE: 'Inactive' };

function getCapacityLevel(pct) {
  if (pct <= 25) return { label: 'Low', color: '#d4a017', bg: 'rgba(212, 160, 23, 0.08)' };
  if (pct <= 50) return { label: 'Medium', color: '#e87a2e', bg: 'rgba(232, 122, 46, 0.08)' };
  if (pct <= 75) return { label: 'High', color: '#e05545', bg: 'rgba(224, 85, 69, 0.08)' };
  return { label: 'Full', color: '#d32f2f', bg: 'rgba(211, 47, 47, 0.08)' };
}

export default function CargoVisualizer() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [viewMode, setViewMode] = useState('single');
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        axios.get(`${API}/vehicles`, { headers }),
        axios.get(`${API}/shipments`, { headers }),
      ]);
      setVehicles(vRes.data);
      setShipments(sRes.data);
      if (vRes.data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vRes.data[0].id);
      }
    } catch {
      message.error('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (filterType) result = result.filter(v => v.vehicle_type === filterType);
    if (filterStatus) result = result.filter(v => v.status === filterStatus);
    return result;
  }, [vehicles, filterType, filterStatus]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Fleet-wide stats
  const fleetStats = useMemo(() => {
    if (!vehicles.length) return { avgWeight: 0, avgVolume: 0, overloaded: 0, underutilized: 0, total: 0 };
    let totalWeightPct = 0, totalVolumePct = 0, overloaded = 0, underutilized = 0;
    vehicles.forEach(v => {
      const wp = v.weight_capacity > 0 ? (v.current_weight_used / v.weight_capacity) * 100 : 0;
      const vp = v.volume_capacity > 0 ? (v.current_volume_used / v.volume_capacity) * 100 : 0;
      totalWeightPct += wp;
      totalVolumePct += vp;
      if (wp > 90 || vp > 90) overloaded++;
      if (wp < 20 && vp < 20 && v.status === 'ON_TRIP') underutilized++;
    });
    return {
      avgWeight: Math.round(totalWeightPct / vehicles.length),
      avgVolume: Math.round(totalVolumePct / vehicles.length),
      overloaded,
      underutilized,
      total: vehicles.length,
    };
  }, [vehicles]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BoxPlotOutlined style={{ color: '#facc15' }} />
            3D Cargo Visualizer
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Interactive truck capacity visualization with real-time data
          </Text>
        </div>
        <Space>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'single', label: 'Single View' },
              { value: 'grid', label: 'Fleet View' },
            ]}
          />
          <Tooltip title="Refresh data">
            <Button icon={<ReloadOutlined />} onClick={fetchData} />
          </Tooltip>
        </Space>
      </div>

      {/* Fleet Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Total Vehicles" value={fleetStats.total} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Avg Weight Usage" value={fleetStats.avgWeight} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Avg Volume Usage" value={fleetStats.avgVolume} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Near Capacity"
              value={fleetStats.overloaded}
              valueStyle={{ color: 'inherit' }}
              suffix={<Text type="secondary" style={{ fontSize: 12 }}>vehicles</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Row */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12 }} bodyStyle={{ padding: '12px 16px' }}>
        <Space wrap size="middle">
          <Space>
            <Text strong style={{ fontSize: 13 }}>Filter:</Text>
            <Select
              placeholder="Vehicle Type"
              allowClear
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
              options={Object.entries(TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Select
              placeholder="Status"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Space>
          {viewMode === 'single' && (
            <Select
              showSearch
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              style={{ width: 280 }}
              placeholder="Select a vehicle"
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              options={filteredVehicles.map(v => {
                const wp = v.weight_capacity > 0 ? Math.round((v.current_weight_used / v.weight_capacity) * 100) : 0;
                return {
                  value: v.id,
                  label: `${v.name} (${v.plate_number}) – ${wp}% loaded`,
                };
              })}
            />
          )}
        </Space>
      </Card>

      {/* ── SINGLE VIEW ──────────────────────────── */}
      {viewMode === 'single' && selectedVehicle && (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ borderRadius: 16, overflow: 'hidden' }}>
              {(() => {
                // Only count ACTIVE shipments (not delivered) for capacity display
                const ACTIVE = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
                const vehicleShipments = shipments.filter(s =>
                  s.assigned_vehicle_id === selectedVehicle.id && ACTIVE.includes(s.status)
                );
                const allItems = vehicleShipments.flatMap(s => s.items || []);
                // Compute from items (items may be empty if API doesn't return them)
                const computedWeight = allItems.reduce((sum, it) => sum + (it.weight || 0) * (it.quantity || 1), 0);
                const computedVolume = allItems.reduce((sum, it) => {
                  const l = (it.length || 40) / 100;
                  const w = (it.width || 40) / 100;
                  const h = (it.height || 40) / 100;
                  return sum + l * w * h * (it.quantity || 1);
                }, 0);
                // Prefer vehicle counters from backend (dynamically computed server-side)
                const weightUsed = selectedVehicle.current_weight_used > 0
                  ? selectedVehicle.current_weight_used
                  : computedWeight;
                const volumeUsed = selectedVehicle.current_volume_used > 0
                  ? selectedVehicle.current_volume_used
                  : computedVolume;
                return (
                  <TruckCargoVisualizer
                    weightUsed={weightUsed}
                    weightCapacity={selectedVehicle.weight_capacity}
                    volumeUsed={volumeUsed}
                    volumeCapacity={selectedVehicle.volume_capacity}
                    vehicleType={selectedVehicle.vehicle_type}
                    vehicleName={selectedVehicle.name}
                    plateNumber={selectedVehicle.plate_number}
                    items={allItems}
                    height={480}
                  />
                );
              })()}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* Vehicle Details Card */}
              <Card
                bordered={false}
                style={{ borderRadius: 16 }}
                title={
                  <Space>
                    <CarOutlined style={{ color: '#facc15' }} />
                    <span>Vehicle Details</span>
                  </Space>
                }
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Name</Text>
                    <Text strong>{selectedVehicle.name}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Plate</Text>
                    <Tag style={{ fontFamily: 'monospace' }}>{selectedVehicle.plate_number}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Type</Text>
                    <Tag color="volcano">{TYPE_LABELS[selectedVehicle.vehicle_type] || selectedVehicle.vehicle_type}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Status</Text>
                    <Tag color={selectedVehicle.status === 'AVAILABLE' ? 'gold' : selectedVehicle.status === 'ON_TRIP' ? 'orange' : selectedVehicle.status === 'MAINTENANCE' ? 'warning' : 'default'}>
                      {STATUS_LABELS[selectedVehicle.status] || selectedVehicle.status}
                    </Tag>
                  </div>
                </Space>
              </Card>

              {/* Weight Capacity Card */}
              <Card bordered={false} style={{ borderRadius: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 14 }}>⚖️ Weight Capacity</Text>
                </div>
                {(() => {
                  const ACTIVE = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
                  const vehicleShipments = shipments.filter(s =>
                    s.assigned_vehicle_id === selectedVehicle.id && ACTIVE.includes(s.status)
                  );
                  const allItems = vehicleShipments.flatMap(s => s.items || []);
                  const computedWeight = allItems.reduce((sum, it) => sum + (it.weight || 0) * (it.quantity || 1), 0);
                  const weightUsed = selectedVehicle.current_weight_used > 0 ? selectedVehicle.current_weight_used : computedWeight;
                  const cap = selectedVehicle.weight_capacity;
                  const pct = cap > 0 ? (weightUsed / cap) * 100 : 0;
                  const pctDisplay = pct < 0.1 && pct > 0 ? pct.toFixed(2) : pct.toFixed(1);
                  const level = getCapacityLevel(pct);
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary">{weightUsed.toFixed(1)} kg used of {cap.toLocaleString()} kg</Text>
                        <Tag style={{ border: 0, background: '#f1f5f9', color: '#475569' }}>{level.label}</Tag>
                      </div>
                      <Progress
                        percent={Math.min(pct, 100)}
                        format={() => `${pctDisplay}%`}
                        strokeColor="#facc15"
                        trailColor="#f1f5f9"
                        strokeWidth={10}
                        style={{ marginBottom: 4 }}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Remaining: {Math.max(0, cap - weightUsed).toFixed(1)} kg
                      </Text>
                    </div>
                  );
                })()}
              </Card>

              {/* Volume Capacity Card */}
              <Card bordered={false} style={{ borderRadius: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 14 }}>📦 Volume Capacity</Text>
                </div>
                {(() => {
                  const ACTIVE = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
                  const vehicleShipments = shipments.filter(s =>
                    s.assigned_vehicle_id === selectedVehicle.id && ACTIVE.includes(s.status)
                  );
                  const allItems = vehicleShipments.flatMap(s => s.items || []);
                  const computedVolume = allItems.reduce((sum, it) => {
                    const l = (it.length || 40) / 100;
                    const w = (it.width || 40) / 100;
                    const h = (it.height || 40) / 100;
                    return sum + l * w * h * (it.quantity || 1);
                  }, 0);
                  const volumeUsed = selectedVehicle.current_volume_used > 0 ? selectedVehicle.current_volume_used : computedVolume;
                  const cap = selectedVehicle.volume_capacity;
                  const pct = cap > 0 ? (volumeUsed / cap) * 100 : 0;
                  const pctDisplay = pct < 0.1 && pct > 0 ? pct.toFixed(3) : pct < 1 ? pct.toFixed(2) : pct.toFixed(1);
                  // Smart volume display: show enough decimals so it's never "0.00" unless truly 0
                  const fmtVol = (v) => {
                    if (v === 0) return '0.000';
                    if (v < 0.001) return v.toFixed(6);
                    if (v < 0.01) return v.toFixed(4);
                    if (v < 1) return v.toFixed(3);
                    return v.toFixed(2);
                  };
                  const level = getCapacityLevel(pct);
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary">{fmtVol(volumeUsed)} m³ used of {cap.toFixed(2)} m³</Text>
                        <Tag style={{ border: 0, background: '#f1f5f9', color: '#475569' }}>{level.label}</Tag>
                      </div>
                      <Progress
                        percent={Math.min(pct, 100)}
                        format={() => `${pctDisplay}%`}
                        strokeColor="#facc15"
                        trailColor="#f1f5f9"
                        strokeWidth={10}
                        style={{ marginBottom: 4 }}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Remaining: {fmtVol(Math.max(0, cap - volumeUsed))} m³
                      </Text>
                    </div>
                  );
                })()}
              </Card>

              {/* Hint */}
              <div style={{
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(255, 77, 79, 0.04)',
                border: '1px solid rgba(255, 77, 79, 0.12)',
              }}>
                <Space>
                  <InfoCircleOutlined style={{ color: '#facc15', fontSize: 14 }} />
                  <Text style={{ fontSize: 12, color: '#cc4040' }}>
                    Drag to rotate · Scroll to zoom · Fill level = volume usage.
                  </Text>
                </Space>
              </div>

              {/* Assigned Shipments Panel */}
              {(() => {
                const vehicleShipments = shipments.filter(s =>
                  s.assigned_vehicle_id === selectedVehicle.id &&
                  ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)
                );
                if (vehicleShipments.length === 0) return (
                  <Card bordered={false} style={{ borderRadius: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>No active shipments on this vehicle.</Text>
                  </Card>
                );
                return (
                  <Card
                    bordered={false}
                    style={{ borderRadius: 16 }}
                    title={<Space><span>🚚 Loaded Shipments</span><Tag color="blue">{vehicleShipments.length}</Tag></Space>}
                    bodyStyle={{ padding: '8px 16px' }}
                  >
                    {vehicleShipments.map(s => (
                      <div key={s.id} style={{
                        padding: '8px 0', borderBottom: '1px solid #f0f0f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                      }}>
                        <div>
                          <Text strong style={{ fontSize: 12 }}>{s.tracking_number}</Text>
                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            <Tag style={{ fontSize: 10, margin: 0 }} color="processing">{s.status.replace('_', ' ')}</Tag>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#595959' }}>{(s.total_weight || 0).toFixed(0)} kg</div>
                          <div style={{ fontSize: 11, color: '#595959' }}>{(s.total_volume || 0).toFixed(2)} m³</div>
                        </div>
                      </div>
                    ))}
                  </Card>
                );
              })()}
            </Space>
          </Col>
        </Row>
      )}

      {viewMode === 'single' && !selectedVehicle && (
        <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: 48 }}>
          <Empty description="No vehicle selected. Please select a vehicle from the dropdown above." />
        </Card>
      )}

      {/* ── FLEET GRID VIEW ──────────────────────── */}
      {viewMode === 'grid' && (
        <Row gutter={[16, 16]}>
          {filteredVehicles.length === 0 && (
            <Col span={24}>
              <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: 48 }}>
                <Empty description="No vehicles match the current filters." />
              </Card>
            </Col>
          )}
          {filteredVehicles.map(v => {
            const vehicleShipments = shipments.filter(s => s.assigned_vehicle_id === v.id);
            const allItems = vehicleShipments.flatMap(s => s.items || []);
            const computedWeight = allItems.reduce((sum, it) => sum + (it.weight || 0) * (it.quantity || 1), 0);
            const computedVolume = allItems.reduce((sum, it) => {
              const l = (it.length || 40) / 100;
              const w2 = (it.width || 40) / 100;
              const h = (it.height || 40) / 100;
              return sum + l * w2 * h * (it.quantity || 1);
            }, 0);
            const weightUsed = v.current_weight_used > 0 ? v.current_weight_used : computedWeight;
            const volumeUsed = v.current_volume_used > 0 ? v.current_volume_used : computedVolume;
            const wp = v.weight_capacity > 0 ? Math.round((weightUsed / v.weight_capacity) * 100) : 0;
            const vp = v.volume_capacity > 0 ? Math.round((volumeUsed / v.volume_capacity) * 100) : 0;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={v.id}>
                <Card
                  bordered={false}
                  bodyStyle={{ padding: 0 }}
                  style={{
                    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                    border: selectedVehicleId === v.id ? '2px solid #facc15' : '2px solid transparent',
                    transition: 'all 0.3s',
                  }}
                  onClick={() => { setSelectedVehicleId(v.id); setViewMode('single'); }}
                  hoverable
                >
                  <TruckCargoVisualizer
                    weightUsed={weightUsed}
                    weightCapacity={v.weight_capacity}
                    volumeUsed={volumeUsed}
                    volumeCapacity={v.volume_capacity}
                    vehicleType={v.vehicle_type}
                    vehicleName={v.name}
                    plateNumber={v.plate_number}
                    items={allItems}
                    height={260}
                    showLabels={true}
                  />
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 13 }}>{v.name}</Text>
                      <Tag
                        color={v.status === 'AVAILABLE' ? 'gold' : v.status === 'ON_TRIP' ? 'orange' : v.status === 'MAINTENANCE' ? 'warning' : 'default'}
                        style={{ fontSize: 10 }}
                      >
                        {STATUS_LABELS[v.status]}
                      </Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>Weight</Text>
                        <Progress percent={wp} size="small" strokeColor="#facc15" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>Volume</Text>
                        <Progress percent={vp} size="small" strokeColor="#facc15" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
