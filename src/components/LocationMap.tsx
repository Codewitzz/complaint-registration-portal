import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  height?: string;
}

export function LocationMap({ latitude, longitude, address, height = '300px' }: LocationMapProps) {
  if (!latitude || !longitude) {
    return (
      <div className="border rounded-lg p-6 text-center" style={{ height }}>
        <p className="text-muted-foreground">Location coordinates not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {address && (
        <p className="text-sm text-muted-foreground">
          <strong>Address:</strong> {address}
        </p>
      )}
      <div className="border rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
    </div>
  );
}

