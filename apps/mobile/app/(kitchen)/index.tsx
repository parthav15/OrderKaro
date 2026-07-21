import { ChefHat } from "lucide-react-native"
import { ComingSoon } from "@/components/coming-soon"

export default function KitchenHome() {
  return (
    <ComingSoon
      eyebrow="FOR STAFF"
      title="Kitchen & counter"
      body="A full-screen live order board with sound and haptic alerts for tablets — arriving in a later phase. It will mirror the web kitchen and counter displays."
      Icon={ChefHat}
    />
  )
}
