import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type { RechargeRequestInput, CreditWalletInput, ApproveRechargeInput } from "@orderkaro/shared"

export async function getWallet(req: Request, res: Response) {
  const wallet = await prisma.wallet.findUnique({
    where: { consumerId: req.user!.id },
  })
  if (!wallet) {
    return error(res, "Wallet not found", 404)
  }
  return success(res, wallet)
}

export async function getTransactions(req: Request, res: Response) {
  const wallet = await prisma.wallet.findUnique({
    where: { consumerId: req.user!.id },
  })
  if (!wallet) {
    return error(res, "Wallet not found", 404)
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ])

  return success(res, {
    transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function submitRechargeRequest(req: Request, res: Response) {
  const data = req.body as RechargeRequestInput

  const wallet = await prisma.wallet.findUnique({
    where: { consumerId: req.user!.id },
  })
  if (!wallet) {
    return error(res, "Wallet not found", 404)
  }

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "CREDIT",
      amount: data.amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      source: "BANK_TRANSFER",
      description: data.description || "Recharge request",
      reference: data.reference,
      status: "PENDING",
    },
  })

  return created(res, transaction)
}

export async function getPendingRequests(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string

  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  const canteenConsumerIds = await prisma.order.findMany({
    where: { canteenId },
    select: { consumerId: true },
    distinct: ["consumerId"],
  })
  const consumerIds = canteenConsumerIds.map((o) => o.consumerId)

  const requests = await prisma.walletTransaction.findMany({
    where: {
      status: "PENDING",
      source: "BANK_TRANSFER",
      wallet: { consumerId: { in: consumerIds } },
    },
    include: {
      wallet: {
        include: { consumer: { select: { id: true, name: true, phone: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })
  return success(res, requests)
}

export async function handleRechargeRequest(req: Request, res: Response) {
  const { status, note } = req.body as ApproveRechargeInput
  const reqId = req.params.reqId as string
  const canteenId = req.params.canteenId as string

  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  const request = await prisma.walletTransaction.findUnique({
    where: { id: reqId },
    include: { wallet: true },
  })
  if (!request || request.status !== "PENDING") {
    return error(res, "Request not found or already processed", 404)
  }

  if (status === "APPROVED") {
    const result = await prisma.$transaction(async (tx) => {
      const walletBefore = await tx.wallet.findUnique({
        where: { id: request.walletId },
      })

      const updatedWallet = await tx.wallet.update({
        where: { id: request.walletId },
        data: { balance: { increment: request.amount } },
      })

      const updated = await tx.walletTransaction.update({
        where: { id: reqId },
        data: {
          status: "APPROVED",
          balanceBefore: walletBefore!.balance,
          balanceAfter: updatedWallet.balance,
          approvedBy: req.user!.id,
          description: note
            ? `${request.description} | ${note}`
            : request.description,
        },
      })

      return updated
    })

    return success(res, result)
  }

  const updated = await prisma.walletTransaction.update({
    where: { id: reqId },
    data: {
      status: "REJECTED",
      approvedBy: req.user!.id,
      description: note
        ? `${request.description} | Rejected: ${note}`
        : request.description,
    },
  })

  return success(res, updated)
}

export async function creditWallet(req: Request, res: Response) {
  const { consumerId, amount, description } = req.body as CreditWalletInput

  const wallet = await prisma.wallet.findUnique({
    where: { consumerId },
  })
  if (!wallet) {
    return error(res, "Consumer wallet not found", 404)
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: updated.balance,
        source: "CASH_DEPOSIT",
        description: description || "Cash deposit",
        approvedBy: req.user!.id,
      },
    })

    return updated
  })

  return success(res, result)
}

export async function getConsumers(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string | undefined

  const canteen = await prisma.canteen.findUnique({ where: { id: canteenId } })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  const canteenConsumerIds = await prisma.order.findMany({
    where: { canteenId },
    select: { consumerId: true },
    distinct: ["consumerId"],
  })
  const consumerIds = canteenConsumerIds.map((o) => o.consumerId)

  const baseWhere: Record<string, unknown> = { id: { in: consumerIds } }
  if (search) {
    baseWhere.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { phone: { contains: search } },
    ]
  }

  const [consumers, total] = await Promise.all([
    prisma.consumer.findMany({
      where: baseWhere,
      include: { wallet: { select: { balance: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.consumer.count({ where: baseWhere }),
  ])

  return success(res, {
    consumers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
