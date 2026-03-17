import Badge from "@/components/ui/Badge"

const statusConfig: Record<string, { text: string; variant: "red" | "black" | "success" | "warning" | "outline" }> = {
  PLACED: { text: "Placed", variant: "warning" },
  ACCEPTED: { text: "Accepted", variant: "outline" },
  PREPARING: { text: "Preparing", variant: "red" },
  READY: { text: "Ready", variant: "success" },
  PICKED_UP: { text: "Picked Up", variant: "black" },
  CANCELLED: { text: "Cancelled", variant: "outline" },
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { text: status, variant: "outline" as const }
  return <Badge text={config.text} variant={config.variant} />
}
