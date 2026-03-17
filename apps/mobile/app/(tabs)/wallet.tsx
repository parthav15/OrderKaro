import { useState } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import { colors, typography, spacing } from "@/constants/theme"
import api from "@/lib/api"
import Button from "@/components/ui/Button"
import BalanceCard from "@/components/wallet/BalanceCard"
import TransactionItem from "@/components/wallet/TransactionItem"
import RechargeSheet from "@/components/wallet/RechargeSheet"

export default function WalletScreen() {
  const [showRecharge, setShowRecharge] = useState(false)

  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/wallet/consumer/wallet")
      return data.data
    },
  })

  const {
    data: transactions,
    isLoading: txLoading,
    refetch: refetchTx,
    isRefetching,
  } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data } = await api.get(
        "/api/v1/wallet/consumer/wallet/transactions"
      )
      return data.data
    },
  })

  const handleRefresh = () => {
    refetchWallet()
    refetchTx()
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </Animated.View>

      <FlatList
        data={transactions || []}
        keyExtractor={(item: any) => item.id}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <BalanceCard balance={walletData?.balance || 0} />

            <Button
              title="Request Recharge"
              onPress={() => setShowRecharge(true)}
              variant="outline"
              fullWidth
              icon={<Ionicons name="add-circle-outline" size={18} color={colors.black} />}
            />

            <Text style={styles.sectionTitle}>Transactions</Text>
          </View>
        }
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.red}
          />
        }
        ListEmptyComponent={
          !txLoading ? (
            <View style={styles.empty}>
              <Ionicons
                name="wallet-outline"
                size={48}
                color={colors.neutral[300]}
              />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <RechargeSheet
        visible={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={handleRefresh}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  listHeader: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing["3xl"],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[400],
  },
})
