"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

const WINE_HEX = "#A31D33"
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""
const MIN_RADIUS_KM = 0.1
const LOCAL_EPSILON = 0.000001
const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]

function isDarkTheme() {
  if (typeof document === "undefined") return false
  const root = document.documentElement
  return root.getAttribute("data-theme") === "dark" || root.classList.contains("dark")
}

function styleUrl(dark: boolean) {
  const style = dark ? "streets-v2-dark" : "streets-v2"
  return `https://api.maptiler.com/maps/${style}/style.json?key=${MAPTILER_KEY}`
}

function metersPerDegree(lat: number) {
  return {
    x: 111.32 * Math.cos((lat * Math.PI) / 180),
    y: 110.574,
  }
}

function radiusPolygon(lat: number, lng: number, radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const steps = 96
  const { x, y } = metersPerDegree(lat)
  const ring: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    ring.push([lng + (radiusKm / x) * Math.cos(theta), lat + (radiusKm / y) * Math.sin(theta)])
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } }
}

function radiusBounds(lat: number, lng: number, radiusKm: number): maplibregl.LngLatBoundsLike {
  const { x, y } = metersPerDegree(lat)
  return [
    [lng - radiusKm / x, lat - radiusKm / y],
    [lng + radiusKm / x, lat + radiusKm / y],
  ]
}

function createPinElement() {
  const el = document.createElement("div")
  el.style.cssText =
    "width:34px;height:46px;cursor:grab;filter:drop-shadow(0 8px 10px rgba(10,10,10,0.4))"
  el.innerHTML = `<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 45C17 45 31 28.2 31 16.5C31 7.94 24.73 1 17 1C9.27 1 3 7.94 3 16.5C3 28.2 17 45 17 45Z" fill="${WINE_HEX}" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="17" cy="16.5" r="6.5" fill="#FFFFFF"/></svg>`
  return el
}

interface DeliveryMapProps {
  latitude: number
  longitude: number
  radiusKm: number
  onChange: (lat: number, lng: number) => void
}

export function DeliveryMap({ latitude, longitude, radiusKm, onChange }: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const readyRef = useRef(false)
  const firstFitRef = useRef(false)
  const darkRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const lastEmittedRef = useRef<{ lat: number; lng: number } | null>(null)
  const propsRef = useRef({ latitude, longitude, radiusKm })
  onChangeRef.current = onChange
  propsRef.current = { latitude, longitude, radiusKm }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const startLng = Number.isFinite(longitude) ? longitude : DEFAULT_CENTER[0]
    const startLat = Number.isFinite(latitude) ? latitude : DEFAULT_CENTER[1]
    darkRef.current = isDarkTheme()

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl(darkRef.current),
      center: [startLng, startLat],
      zoom: 12,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")
    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()

    const marker = new maplibregl.Marker({ element: createPinElement(), draggable: true, anchor: "bottom" })
      .setLngLat([startLng, startLat])
      .addTo(map)
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat()
      lastEmittedRef.current = { lat, lng }
      onChangeRef.current(lat, lng)
    })

    map.on("click", (event: maplibregl.MapMouseEvent) => {
      const { lat, lng } = event.lngLat
      lastEmittedRef.current = { lat, lng }
      onChangeRef.current(lat, lng)
    })

    const applyRadius = () => {
      const current = propsRef.current
      const clat = Number.isFinite(current.latitude) ? current.latitude : startLat
      const clng = Number.isFinite(current.longitude) ? current.longitude : startLng
      const rad = Math.max(current.radiusKm, MIN_RADIUS_KM)
      const data = radiusPolygon(clat, clng, rad)
      const existing = map.getSource("delivery-radius") as maplibregl.GeoJSONSource | undefined
      if (existing) {
        existing.setData(data)
      } else {
        map.addSource("delivery-radius", { type: "geojson", data })
        map.addLayer({
          id: "delivery-radius-fill",
          type: "fill",
          source: "delivery-radius",
          paint: { "fill-color": WINE_HEX, "fill-opacity": 0.12 },
        })
        map.addLayer({
          id: "delivery-radius-line",
          type: "line",
          source: "delivery-radius",
          paint: { "line-color": WINE_HEX, "line-width": 2.5, "line-opacity": 0.9 },
        })
      }
      readyRef.current = true
      if (!firstFitRef.current) {
        firstFitRef.current = true
        map.fitBounds(radiusBounds(clat, clng, rad), { padding: 46, duration: 0, maxZoom: 15 })
      }
    }

    map.on("load", applyRadius)

    const observer = new MutationObserver(() => {
      const nextDark = isDarkTheme()
      if (nextDark === darkRef.current) return
      darkRef.current = nextDark
      map.setStyle(styleUrl(nextDark))
      map.once("styledata", applyRadius)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] })

    mapRef.current = map
    markerRef.current = marker
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      markerRef.current = null
      readyRef.current = false
      firstFitRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    const effectiveRadius = Math.max(radiusKm, MIN_RADIUS_KM)
    marker.setLngLat([longitude, latitude])

    if (readyRef.current) {
      const source = map.getSource("delivery-radius") as maplibregl.GeoJSONSource | undefined
      if (source) source.setData(radiusPolygon(latitude, longitude, effectiveRadius))
    }

    const emitted = lastEmittedRef.current
    lastEmittedRef.current = null
    const isLocalMove =
      emitted !== null &&
      Math.abs(emitted.lat - latitude) < LOCAL_EPSILON &&
      Math.abs(emitted.lng - longitude) < LOCAL_EPSILON
    if (!isLocalMove) {
      map.fitBounds(radiusBounds(latitude, longitude, effectiveRadius), {
        padding: 46,
        duration: 700,
        maxZoom: 15,
      })
    }
  }, [latitude, longitude, radiusKm])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-xl border border-line shadow-sm"
    />
  )
}
