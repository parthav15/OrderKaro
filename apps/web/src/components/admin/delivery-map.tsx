"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"

const WINE_PIN_HEX = "#A31D33"
const RECENTER_EPSILON = 0.000001
const MIN_EFFECTIVE_RADIUS_KM = 0.1

const winePinIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:46px;filter:drop-shadow(0 6px 8px rgba(10,10,10,0.35))"><svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 45C17 45 31 28.2 31 16.5C31 7.94 24.73 1 17 1C9.27 1 3 7.94 3 16.5C3 28.2 17 45 17 45Z" fill="${WINE_PIN_HEX}" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="17" cy="16.5" r="6.5" fill="#FFFFFF"/></svg></div>`,
  iconSize: [34, 46],
  iconAnchor: [17, 45],
  popupAnchor: [0, -42],
})

interface DeliveryMapProps {
  latitude: number
  longitude: number
  radiusKm: number
  onChange: (lat: number, lng: number) => void
}

interface LocalChange {
  lat: number
  lng: number
}

interface MapControllerProps {
  latitude: number
  longitude: number
  radiusKm: number
  onChange: (lat: number, lng: number) => void
  lastLocalChangeRef: React.MutableRefObject<LocalChange | null>
}

function MapController({
  latitude,
  longitude,
  radiusKm,
  onChange,
  lastLocalChangeRef,
}: MapControllerProps) {
  const hasCenteredOnceRef = useRef(false)
  const radiusKmRef = useRef(radiusKm)
  radiusKmRef.current = radiusKm

  const map = useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng
      lastLocalChangeRef.current = { lat, lng }
      onChange(lat, lng)
    },
  })

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    const lastLocalChange = lastLocalChangeRef.current
    lastLocalChangeRef.current = null

    const isFromMapInteraction =
      lastLocalChange !== null &&
      Math.abs(lastLocalChange.lat - latitude) < RECENTER_EPSILON &&
      Math.abs(lastLocalChange.lng - longitude) < RECENTER_EPSILON

    if (isFromMapInteraction && hasCenteredOnceRef.current) return

    const bounds = L.circle([latitude, longitude], {
      radius: Math.max(radiusKmRef.current, MIN_EFFECTIVE_RADIUS_KM) * 1000,
    }).getBounds()

    if (hasCenteredOnceRef.current) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1 })
    } else {
      map.fitBounds(bounds, { padding: [40, 40] })
      hasCenteredOnceRef.current = true
    }
  }, [latitude, longitude, map, lastLocalChangeRef])

  return null
}

export function DeliveryMap({ latitude, longitude, radiusKm, onChange }: DeliveryMapProps) {
  const markerRef = useRef<L.Marker>(null)
  const lastLocalChangeRef = useRef<LocalChange | null>(null)
  const effectiveRadiusMeters = Math.max(radiusKm, MIN_EFFECTIVE_RADIUS_KM) * 1000

  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-line shadow-sm">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[latitude, longitude]}
          radius={effectiveRadiusMeters}
          pathOptions={{ color: WINE_PIN_HEX, weight: 2, fillColor: WINE_PIN_HEX, fillOpacity: 0.12 }}
        />
        <Marker
          ref={markerRef}
          position={[latitude, longitude]}
          icon={winePinIcon}
          draggable
          eventHandlers={{
            dragend() {
              const marker = markerRef.current
              if (marker == null) return
              const { lat, lng } = marker.getLatLng()
              lastLocalChangeRef.current = { lat, lng }
              onChange(lat, lng)
            },
          }}
        />
        <MapController
          latitude={latitude}
          longitude={longitude}
          radiusKm={radiusKm}
          onChange={onChange}
          lastLocalChangeRef={lastLocalChangeRef}
        />
      </MapContainer>
    </div>
  )
}
