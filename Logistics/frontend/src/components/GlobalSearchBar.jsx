
import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Tag, Avatar, Spin, Typography } from 'antd';
import { SearchOutlined, UserOutlined, CarOutlined, CodeSandboxOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GlobalSearchBar = () => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const debounceRef = useRef(null);

    const getPrefix = () => {
        switch (user?.role) {
            case 'SUPER_ADMIN': return '/admin';
            case 'MSME': return '/msme';
            case 'FLEET_MANAGER': return '/fleet';
            case 'DRIVER': return '/driver';
            default: return '/';
        }
    };

    const getRecent = () => {
        try {
            return JSON.parse(localStorage.getItem('recent_logistics_search') || '[]');
        } catch { return []; }
    };

    const addToHistory = (item, type, value) => {
        const recent = getRecent();
        const newItem = { item, type, value, timestamp: Date.now() };
        // Determine label string for storage
        if (type === 'shipment') newItem.labelStr = `${item.tracking_number}`;
        else if (type === 'driver') newItem.labelStr = item.name || item.email;
        else if (type === 'vehicle') newItem.labelStr = item.plate_number;

        // Dedupe by value
        const filtered = recent.filter(r => r.value !== value);
        filtered.unshift(newItem);
        localStorage.setItem('recent_logistics_search', JSON.stringify(filtered.slice(0, 5)));
    };

    // --- Highlighting Helper ---
    const getHighlightedText = (text, highlight) => {
        if (!text) return "";
        if (!highlight || highlight.length < 2) return text;

        const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} style={{ backgroundColor: '#fffb8f', fontWeight: 'bold' }}>{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const renderOption = (type, item, searchTerm) => {
        if (type === 'shipment') {
            return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                        <CodeSandboxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <Text strong>{getHighlightedText(item.tracking_number, searchTerm)}</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            {item.pickup_address?.split(',')[0]} → {item.drop_address?.split(',')[0]}
                        </Text>
                    </span>
                    <Tag>{item.status}</Tag>
                </div>
            );
        }
        if (type === 'driver') {
            return (
                <div>
                    <UserOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                    {getHighlightedText(item.name || item.email, searchTerm)}
                    {item.phone && <Text type="secondary" style={{ marginLeft: 8 }}>📞 {getHighlightedText(item.phone, searchTerm)}</Text>}
                </div>
            );
        }
        if (type === 'vehicle') {
            return (
                <div>
                    <CarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    {getHighlightedText(item.plate_number, searchTerm)} ({item.name})
                </div>
            );
        }
        return null;
    };

    const handleSearch = (value) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value) {
            showRecent();
            return;
        }
        if (value.length < 2) {
            setOptions([]);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`${API}/search/global`, {
                    params: { q: value },
                    headers: { Authorization: `Bearer ${token}` }
                });

                const { shipments, drivers, vehicles } = res.data;
                const newOptions = [];

                if (shipments?.length > 0) {
                    newOptions.push({
                        label: <Text strong style={{ color: '#1890ff' }}>Shipments</Text>,
                        options: shipments.map(s => ({
                            value: `shipment-${s.id}`,
                            type: 'shipment',
                            item: s,
                            label: renderOption('shipment', s, value),
                        })),
                    });
                }

                if (drivers?.length > 0) {
                    newOptions.push({
                        label: <Text strong style={{ color: '#fa8c16' }}>Drivers</Text>,
                        options: drivers.map(d => ({
                            value: `driver-${d.id}`,
                            type: 'driver',
                            item: d,
                            label: renderOption('driver', d, value),
                        })),
                    });
                }

                if (vehicles?.length > 0) {
                    newOptions.push({
                        label: <Text strong style={{ color: '#52c41a' }}>Vehicles</Text>,
                        options: vehicles.map(v => ({
                            value: `vehicle-${v.id}`,
                            type: 'vehicle',
                            item: v,
                            label: renderOption('vehicle', v, value),
                        })),
                    });
                }

                setOptions(newOptions);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 400);
    };

    const showRecent = () => {
        const recent = getRecent();
        if (recent.length > 0) {
            setOptions([{
                label: <Text strong style={{ color: '#8c8c8c' }}>Recent</Text>,
                options: recent.map(r => ({
                    value: r.value,
                    type: r.type,
                    item: r.item,
                    label: (
                        <div style={{ color: '#8c8c8c' }}>
                            <HistoryOutlined style={{ marginRight: 8 }} />
                            {r.labelStr}
                        </div>
                    )
                }))
            }]);
        } else {
            setOptions([]);
        }
    };

    const onSelect = (value, option) => {
        addToHistory(option.item, option.type, value);

        const prefix = getPrefix();
        if (option.type === 'shipment') {
            navigate(`${prefix}/shipments/${option.item.id}`);
        } else if (option.type === 'driver') {
            if (user.role === 'SUPER_ADMIN') navigate(`/admin/users`);
            else if (user.role === 'FLEET_MANAGER') navigate(`/fleet/analytics`);
        } else if (option.type === 'vehicle') {
            navigate(`${prefix}/vehicles`);
        }
    };

    return (
        <AutoComplete
            dropdownMatchSelectWidth={500}
            style={{ width: 400 }}
            options={options}
            onSelect={onSelect}
            onSearch={handleSearch}
            onFocus={showRecent}
        >
            <Input.Search
                placeholder="Search shipments, phone, drivers..."
                loading={loading}
                allowClear
            />
        </AutoComplete>
    );
};

export default GlobalSearchBar;
