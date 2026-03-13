import type { Request, Response } from "express"
import prisma from "../../config/database"
import { hashPassword, comparePassword } from "../../utils/password"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt"
import { success, error, created } from "../../utils/response"
import type {
  OwnerRegisterInput,
  OwnerLoginInput,
  StaffLoginInput,
  StaffPinLoginInput,
  ConsumerRegisterInput,
  ConsumerLoginInput,
} from "@orderkaro/shared"

export async function ownerRegister(req: Request, res: Response) {
  const { email, password, name, phone } = req.body as OwnerRegisterInput

  const existing = await prisma.owner.findUnique({ where: { email } })
  if (existing) {
    return error(res, "Email already registered", 409)
  }

  const passwordHash = await hashPassword(password)
  const owner = await prisma.owner.create({
    data: { email, passwordHash, name, phone },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  })

  const tokens = {
    accessToken: generateAccessToken({ id: owner.id, role: "OWNER" }),
    refreshToken: generateRefreshToken({ id: owner.id, role: "OWNER" }),
  }

  return created(res, { owner, ...tokens })
}

export async function ownerLogin(req: Request, res: Response) {
  const { email, password } = req.body as OwnerLoginInput

  const owner = await prisma.owner.findUnique({ where: { email } })
  if (!owner) {
    return error(res, "Invalid credentials", 401)
  }

  const valid = await comparePassword(password, owner.passwordHash)
  if (!valid) {
    return error(res, "Invalid credentials", 401)
  }

  const tokens = {
    accessToken: generateAccessToken({ id: owner.id, role: "OWNER" }),
    refreshToken: generateRefreshToken({ id: owner.id, role: "OWNER" }),
  }

  return success(res, {
    owner: {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      phone: owner.phone,
    },
    ...tokens,
  })
}

export async function staffLogin(req: Request, res: Response) {
  const { canteenId, email, password } = req.body as StaffLoginInput

  const staff = await prisma.staff.findUnique({
    where: { canteenId_email: { canteenId, email } },
  })
  if (!staff || !staff.isActive) {
    return error(res, "Invalid credentials", 401)
  }

  const valid = await comparePassword(password, staff.passwordHash)
  if (!valid) {
    return error(res, "Invalid credentials", 401)
  }

  const tokens = {
    accessToken: generateAccessToken({
      id: staff.id,
      role: staff.role,
      canteenId,
    }),
    refreshToken: generateRefreshToken({
      id: staff.id,
      role: staff.role,
      canteenId,
    }),
  }

  return success(res, {
    staff: { id: staff.id, name: staff.name, role: staff.role, canteenId },
    ...tokens,
  })
}

export async function staffPinLogin(req: Request, res: Response) {
  const { canteenId, pin } = req.body as StaffPinLoginInput

  const staff = await prisma.staff.findFirst({
    where: { canteenId, pin, isActive: true },
  })
  if (!staff) {
    return error(res, "Invalid credentials", 401)
  }

  const tokens = {
    accessToken: generateAccessToken({
      id: staff.id,
      role: staff.role,
      canteenId,
    }),
    refreshToken: generateRefreshToken({
      id: staff.id,
      role: staff.role,
      canteenId,
    }),
  }

  return success(res, {
    staff: { id: staff.id, name: staff.name, role: staff.role, canteenId },
    ...tokens,
  })
}

export async function consumerRegister(req: Request, res: Response) {
  const { name, phone, pin } = req.body as ConsumerRegisterInput

  const existing = await prisma.consumer.findUnique({ where: { phone } })
  if (existing) {
    return error(res, "Phone number already registered", 409)
  }

  const passwordHash = pin ? await hashPassword(pin) : null

  const consumer = await prisma.consumer.create({
    data: {
      name,
      phone,
      passwordHash,
      wallet: { create: { balance: 0 } },
    },
    select: { id: true, name: true, phone: true, createdAt: true },
  })

  const tokens = {
    accessToken: generateAccessToken({ id: consumer.id, role: "CONSUMER" }),
    refreshToken: generateRefreshToken({ id: consumer.id, role: "CONSUMER" }),
  }

  return created(res, { consumer, ...tokens })
}

export async function consumerLogin(req: Request, res: Response) {
  const { phone, pin } = req.body as ConsumerLoginInput

  const consumer = await prisma.consumer.findUnique({ where: { phone } })
  if (!consumer || !consumer.passwordHash) {
    return error(res, "Invalid credentials", 401)
  }

  const valid = await comparePassword(pin, consumer.passwordHash)
  if (!valid) {
    return error(res, "Invalid credentials", 401)
  }

  const tokens = {
    accessToken: generateAccessToken({ id: consumer.id, role: "CONSUMER" }),
    refreshToken: generateRefreshToken({ id: consumer.id, role: "CONSUMER" }),
  }

  return success(res, {
    consumer: { id: consumer.id, name: consumer.name, phone: consumer.phone },
    ...tokens,
  })
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body

  try {
    const payload = verifyRefreshToken(token)
    const newTokens = {
      accessToken: generateAccessToken({
        id: payload.id,
        role: payload.role,
        canteenId: payload.canteenId,
      }),
      refreshToken: generateRefreshToken({
        id: payload.id,
        role: payload.role,
        canteenId: payload.canteenId,
      }),
    }
    return success(res, newTokens)
  } catch {
    return error(res, "Invalid refresh token", 401)
  }
}
