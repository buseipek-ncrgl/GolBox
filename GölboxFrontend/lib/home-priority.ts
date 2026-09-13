import type { ClaimedReward, FieldDropNearby, Order, Reward } from "@/lib/golbox-context"
import { upcomingPersonalEvent, type CityContentItem } from "@/lib/city-content"
import { isActiveCoupon } from "@/components/golbox/coupon-pass"

export type PersonalPriorityKind = "ismarliyor" | "golbox" | "coupon" | "event"

export type PersonalPriority =
  | {
      kind: "ismarliyor"
      id: string
      title: string
      cafe: string
      status: "hazir" | "hazirlaniyor"
      items: string[]
    }
  | {
      kind: "golbox"
      id: string
      title: string
      distanceMeters: number
      pointsGranted: number
      inRange: boolean
      placeLabel?: string
    }
  | {
      kind: "coupon"
      id: string
      title: string
      daysRemaining: number
    }
  | {
      kind: "event"
      id: string
      title: string
      meta?: string
      content: CityContentItem
    }

const READY_STATUSES = new Set(["Ready", "Preparing", "Pending", "Approved"])

export function nextCatalogReward(points: number, rewards: Reward[]) {
  const active = rewards
    .filter((reward) => reward.status === "Active")
    .slice()
    .sort((a, b) => a.requiredPoints - b.requiredPoints)
  if (active.length === 0) return null
  return active.find((reward) => reward.requiredPoints > points) ?? active[0]
}

export function selectPersonalPriority(input: {
  isLoggedIn: boolean
  orders: Order[]
  fieldDrops: FieldDropNearby[]
  capturedIds: string[]
  claimedRewards: ClaimedReward[]
}): PersonalPriority | null {
  if (!input.isLoggedIn) return null

  const waiting = input.orders
    .filter((order) => READY_STATUSES.has(order.status))
    .sort((a, b) => Number(b.status === "Ready") - Number(a.status === "Ready"))
  const topOrder = waiting[0]
  if (topOrder) {
    return {
      kind: "ismarliyor",
      id: topOrder.id,
      title: (topOrder.items?.[0]?.menuItemName || "İkramın") + " seni bekliyor",
      cafe: topOrder.cafeName,
      status: topOrder.status === "Ready" ? "hazir" : "hazirlaniyor",
      items: (topOrder.items || []).map((item) => item.menuItemName).filter(Boolean),
    }
  }

  const drop = input.fieldDrops.find((item) => !input.capturedIds.includes(item.id))
  if (drop) {
    return {
      kind: "golbox",
      id: drop.id,
      title: drop.title || "Yakınında bir hediye var",
      distanceMeters: Number(drop.distanceMeters),
      pointsGranted: drop.pointsGranted,
      inRange: drop.inRange,
      placeLabel: drop.description || undefined,
    }
  }

  const expiring = input.claimedRewards
    .filter(isActiveCoupon)
    .filter((coupon) => coupon.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0]
  if (expiring) {
    return {
      kind: "coupon",
      id: expiring.claimId,
      title: expiring.rewardTitle,
      daysRemaining: expiring.daysRemaining,
    }
  }

  const event = upcomingPersonalEvent()
  if (event) {
    return {
      kind: "event",
      id: event.id,
      title: event.title,
      meta: event.meta,
      content: event,
    }
  }

  return null
}
