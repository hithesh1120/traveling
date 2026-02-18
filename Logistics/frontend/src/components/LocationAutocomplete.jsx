import { useState, useEffect } from 'react';
import { AutoComplete, Input, message } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LocationAutocomplete({
    value,
    onChange,
    placeholder = "Enter address",
    style
}) {
    const { token } = useAuth();
    const [options, setOptions] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (val) => {
        if (!val || val.length < 2) {
            setOptions([]);
            return;
        }

        setSearching(true);
        try {
            const res = await axios.get(`${API}/locations/autocomplete?q=${encodeURIComponent(val)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOptions(res.data.map(addr => ({
                value: addr,
                label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: '#1890ff' }} />
                        <span>{addr}</span>
                    </div>
                )
            })));
        } catch (err) {
            console.error("Autocomplete failed", err);
        } finally {
            setSearching(false);
        }
    };

    return (
        <AutoComplete
            value={value}
            onChange={onChange}
            options={options}
            onSearch={handleSearch}
            style={style}
        >
            <Input.TextArea
                placeholder={placeholder}
                rows={2}
                style={{ resize: 'none' }}
                allowClear
            />
        </AutoComplete>
    );
}
