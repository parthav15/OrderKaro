import { useMemo } from "react"
import MapView, { Circle, Marker } from "react-native-maps"
import type { MapPressEvent, MarkerDragStartEndEvent, Region } from "react-native-maps"
import { MotiView } from "moti"
import { useTheme } from "@/theme/theme-provider"

const KM_PER_DEGREE_LAT = 111.32
const VIEWPORT_PADDING = 1.6
const MIN_LATITUDE_DELTA = 0.02

interface DeliveryMapProps {
  latitude: number
  longitude: number
  radiusKm: number
  onChange: (latitude: number, longitude: number) => void
}

function withAlpha(hex: string, alpha: number) {
  const raw = hex.replace("#", "")
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : raw
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function DeliveryMap({ latitude, longitude, radiusKm, onChange }: DeliveryMapProps) {
  const { colors } = useTheme()

  const region = useMemo<Region>(() => {
    const latitudeDelta = Math.max(
      (radiusKm * 2 * VIEWPORT_PADDING) / KM_PER_DEGREE_LAT,
      MIN_LATITUDE_DELTA
    )
    const longitudeDelta = latitudeDelta / Math.max(Math.cos((latitude * Math.PI) / 180), 0.05)
    return { latitude, longitude, latitudeDelta, longitudeDelta }
  }, [latitude, longitude, radiusKm])

  const center = { latitude, longitude }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 460 }}
      style={{ height: 300 }}
      className="rounded-3xl overflow-hidden border border-line bg-canvas"
    >
      <MapView
        style={{ flex: 1 }}
        region={region}
        onPress={(event: MapPressEvent) => {
          const point = event.nativeEvent.coordinate
          onChange(point.latitude, point.longitude)
        }}
      >
        <Circle
          center={center}
          radius={radiusKm * 1000}
          strokeColor={colors.primary}
          strokeWidth={2.5}
          fillColor={withAlpha(colors.primary, 0.15)}
        />
        <Marker
          coordinate={center}
          draggable
          pinColor={colors.primary}
          title="Restaurant"
          onDragEnd={(event: MarkerDragStartEndEvent) => {
            const point = event.nativeEvent.coordinate
            onChange(point.latitude, point.longitude)
          }}
        />
      </MapView>
    </MotiView>
  )
}
