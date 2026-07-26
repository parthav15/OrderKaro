"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const WINE_PIN_HEX = "#A31D33"
const MIN_EFFECTIVE_RADIUS_KM = 0.1
const LOCAL_EPSILON = 0.000001

const winePinIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:46px;filter:drop-shadow(0 6px 8px rgba(10,10,10,0.35))"><svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 45C17 45 31 28.2 31 16.5C31 7.94 24.73 1 17 1C9.27 1 3 7.94 3 16.5C3 28.2 17 45 17 45Z" fill="${WINE_PIN_HEX}" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="17" cy="16.5" r="6.5" fill="#FFFFFF"/></svg></div>`,
  iconSize: [34, 46],
  iconAnchor: [17, 45],
})

interface DeliveryMapProps {
  latitude: number
  longitude: number
  radiusKm: number
  onChange: (lat: number, lng: number) => void
}

export function DeliveryMap({ latitude, longitude, radiusKm, onChange }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const onChangeRef = useRef(onChange)
  const lastEmittedRef = useRef<{ lat: number; lng: number } | null>(null)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const startLat = Number.isFinite(latitude) ? latitude : 20.5937
    const startLng = Number.isFinite(longitude) ? longitude : 78.9629
    const map = L.map(containerRef.current, {
      center: [startLat, startLng],
      zoom: 13,
      scrollWheelZoom: false,
      attributionControl: true,
    })
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)
    const circle = L.circle([startLat, startLng], {
      radius: Math.max(radiusKm, MIN_EFFECTIVE_RADIUS_KM) * 1000,
      color: WINE_PIN_HEX,
      weight: 2,
      fillColor: WINE_PIN_HEX,
      fillOpacity: 0.12,
    }).addTo(map)
    const marker = L.marker([startLat, startLng], { icon: winePinIcon, draggable: true }).addTo(map)
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng()
      lastEmittedRef.current = { lat, lng }
      onChangeRef.current(lat, lng)
    })
    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng
      lastEmittedRef.current = { lat, lng }
      onChangeRef.current(lat, lng)
    })
    mapRef.current = map
    markerRef.current = marker
    circleRef.current = circle
    const sizeTimer = setTimeout(() => map.invalidateSize(), 60)
    return () => {
      clearTimeout(sizeTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    const circle = circleRef.current
    if (!map || !marker || !circle || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    marker.setLatLng([latitude, longitude])
    circle.setLatLng([latitude, longitude])
    circle.setRadius(Math.max(radiusKm, MIN_EFFECTIVE_RADIUS_KM) * 1000)

    const emitted = lastEmittedRef.current
    lastEmittedRef.current = null
    const isLocalMove =
      emitted !== null &&
      Math.abs(emitted.lat - latitude) < LOCAL_EPSILON &&
      Math.abs(emitted.lng - longitude) < LOCAL_EPSILON
    if (!isLocalMove) {
      map.flyToBounds(circle.getBounds(), { padding: [42, 42], duration: 0.6, maxZoom: 16 })
    }
  }, [latitude, longitude, radiusKm])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-xl border border-line shadow-sm"
    />
  )
}
