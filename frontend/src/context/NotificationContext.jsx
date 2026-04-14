import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { message } from 'antd';

const NotificationContext = createContext();
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    
    const prevUnreadRef = useRef(0);

    const fetchNotifications = useCallback(async () => {
        if (!token) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }
        
        try {
            const res = await axios.get(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data;
            const newUnread = data.filter(n => !n.read).length;

            if (newUnread > prevUnreadRef.current) {
                setHasNewNotif(true);
                setTimeout(() => setHasNewNotif(false), 3000);
            }
            prevUnreadRef.current = newUnread;

            setNotifications(data);
            setUnreadCount(newUnread);
        } catch (error) {
            console.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
        if (token) {
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [fetchNotifications, token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
        } catch (error) {
            message.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            prevUnreadRef.current = 0;
            message.success('All notifications marked as read');
        } catch (error) {
            message.error('Failed to mark all as read');
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            hasNewNotif,
            markAsRead,
            markAllRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
