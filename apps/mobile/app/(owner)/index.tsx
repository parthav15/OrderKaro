import { Store } from "lucide-react-native"
import { ComingSoon } from "@/components/coming-soon"

export default function OwnerHome() {
  return (
    <ComingSoon
      eyebrow="FOR RESTAURANTS"
      title="Run your restaurant"
      body="Live orders, quick menu edits, analytics and payouts — the owner console lands in a later phase. Sign in uses your existing restaurant email and password."
      Icon={Store}
    />
  )
}
