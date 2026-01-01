// Client-safe type definitions for Prisma enums
// These mirror Prisma schema enums without importing the Prisma client
// Use these types in client components to avoid importing the full Prisma client

export const RingGameType = {
  WEB_COIN: "WEB_COIN",
  IN_STORE: "IN_STORE"
} as const

export type RingGameType = typeof RingGameType[keyof typeof RingGameType]
