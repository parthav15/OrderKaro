import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, typography, spacing } from "@/constants/theme"
import { formatPrice, formatTime } from "@/lib/utils"

interface TransactionItemProps {
  transaction: {
    id: string
    type: string
    amount: number
    direction: string
    description?: string
    status: string
    createdAt: string
  }
}

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  CASH_DEPOSIT: "cash-outline",
  BANK_TRANSFER: "card-outline",
  ORDER_PAYMENT: "bag-outline",
  REFUND: "return-up-back-outline",
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const isCredit = transaction.direction === "CREDIT"
  const icon = typeIcons[transaction.type] || "swap-horizontal-outline"
  const isPending = transaction.status === "PENDING"

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, isCredit ? styles.creditBg : styles.debitBg]}>
        <Ionicons
          name={icon}
          size={18}
          color={isCredit ? colors.success : colors.red}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.type}>
          {transaction.type.replace(/_/g, " ")}
        </Text>
        {transaction.description && (
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
        )}
        <Text style={styles.time}>{formatTime(transaction.createdAt)}</Text>
      </View>

      <View style={styles.amountCol}>
        <Text style={[styles.amount, isCredit ? styles.creditText : styles.debitText]}>
          {isCredit ? "+" : "-"}{formatPrice(transaction.amount)}
        </Text>
        {isPending && <Text style={styles.pending}>Pending</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  creditBg: {
    backgroundColor: "#DCFCE7",
  },
  debitBg: {
    backgroundColor: "#FEE2E2",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  type: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    textTransform: "capitalize",
  },
  description: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  creditText: {
    color: colors.success,
  },
  debitText: {
    color: colors.red,
  },
  pending: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontWeight: typography.weights.medium,
  },
})
