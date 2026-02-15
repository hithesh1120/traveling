import { useEffect, useRef, useState } from 'react';

/**
 * LocationPickerMap — Leaflet-based map for selecting a pickup/drop location.
 * Renders an interactive map; clicking sets a marker and reverse-geocodes the address.
 * Props:
 *   onLocationSelect({ lat, lng, address }) — called when user picks a location.
 *   initialPosition — optional [lat, lng] to start from.
 */
export default function LocationPickerMap({ onLocationSelect, initialPosition }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if Leaflet is already loaded
        if (window.L && mapRef.current && !mapInstanceRef.current) {
            initMap();
            return;
        }

        // Dynamically load Leaflet CSS + JS if not present
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => initMap();
            document.head.appendChild(script);
        } else {
            initMap();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const initMap = () => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const defaultCenter = initialPosition || [12.97, 77.59]; // Bangalore default

        const map = window.L.map(mapRef.current).setView(defaultCenter, 13);
        mapInstanceRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        setLoading(false);

        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;

            // Place or move marker
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = window.L.marker([lat, lng]).addTo(map);
            }

            // Reverse geocode
            let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                const data = await res.json();
                if (data.display_name) {
                    address = data.display_name;
                    markerRef.current.bindPopup(address).openPopup();
                }
            } catch {
                // Fallback to coordinates
            }

            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address });
            }
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            {loading && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f0f2f5', color: '#8c8c8c', fontSize: 14
                }}>
                    Loading Map...
                </div>
            )}
        </div>
    );
}
