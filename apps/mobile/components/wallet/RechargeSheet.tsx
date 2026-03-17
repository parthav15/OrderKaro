import { useState, useRef, useMemo } from "react"
import { View, Text, Alert, StyleSheet } from "react-native"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { colors, typography, spacing, radii } from "@/constants/theme"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import api from "@/lib/api"
import * as Haptics from "expo-haptics"

interface RechargeSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RechargeSheet({
  visible,
  onClose,
  onSuccess,
}: RechargeSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const snapPoints = useMemo(() => ["50%"], [])

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      await api.post("/api/v1/wallet/consumer/wallet/recharge-request", {
        amount: numAmount,
        reference: reference || undefined,
        description: description || undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setAmount("")
      setReference("")
      setDescription("")
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to submit recharge request"
      )
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Recharge Wallet</Text>
        <Text style={styles.subtitle}>
          Submit a recharge request. A manager will approve it after verifying payment.
        </Text>

        <View style={styles.form}>
          <Input
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Input
            label="Reference (optional)"
            placeholder="UPI ID, transaction number, etc."
            value={reference}
            onChangeText={setReference}
          />

          <Input
            label="Description (optional)"
            placeholder="e.g., Cash paid to counter"
            value={description}
            onChangeText={setDescription}
          />

          <Button
            title="Submit Request"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
  },
  handle: {
    backgroundColor: colors.neutral[300],
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
})
