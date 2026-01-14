import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Pin, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ onLocationChange, initialLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [28.6139, 77.2090] // Default to Delhi
  );

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'CivicEase Complaint Portal'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleGetCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setPosition({ lat, lng });
        setMapCenter([lat, lng]);
        
        const addressText = await getAddressFromCoordinates(lat, lng);
        setAddress(addressText);
        
        onLocationChange({ lat, lng, address: addressText });
        setLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please select on map.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    setMapCenter([lat, lng]);
    
    const addressText = await getAddressFromCoordinates(lat, lng);
    setAddress(addressText);
    
    onLocationChange({ lat, lng, address: addressText });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (position) {
      onLocationChange({ ...position, address: e.target.value });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Label className="text-sm sm:text-base">Location</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="sm:ml-auto min-h-[44px] text-xs sm:text-sm"
        >
          <Navigation className="size-3 sm:size-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{loading ? 'Getting location...' : 'Use Current Location'}</span>
          <span className="sm:hidden">{loading ? 'Getting...' : 'Current Location'}</span>
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden" style={{ height: '250px', minHeight: '250px' }}>
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 10}
          style={{ height: '100%', width: '100%' }}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
          className="w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={[position.lat, position.lng]} />}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address / Landmark</Label>
        <Input
          id="address"
          value={address}
          onChange={handleAddressChange}
          placeholder="Complete address or landmark"
          required
        />
      </div>

      {position && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span>Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
        </div>
      )}

      {!position && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Click on the map or use "Use Current Location" to select a location
        </div>
      )}
    </div>
  );
}

