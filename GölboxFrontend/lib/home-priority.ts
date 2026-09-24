import type { ClaimedReward, FieldDropNearby, Order, Reward } from "@/lib/golbox-context"
import type { CityContentItem } from "@/lib/city-content"
import { isActiveCoupon } from "@/components/golbox/coupon-pass"

export type PersonalPriorityKind = "golbox" | "coupon" | "event"

export type PersonalPriority =
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
  upcomingEvent?: CityContentItem | null
}): PersonalPriority | null {
  if (!input.isLoggedIn) return null

  // Check 3D Gift Drop within 500m proximity
  const drop = input.fieldDrops.find((item) => !input.capturedIds.includes(item.id))
  if (drop) {
    const dist = Number(drop.distanceMeters) || 0
    const in500mRange = dist <= 500
    return {
      kind: "golbox",
      id: drop.id,
      title: drop.title || "Yakınında 3D Hediye Var",
      distanceMeters: dist,
      pointsGranted: drop.pointsGranted,
      inRange: in500mRange,
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

  const event = input.upcomingEvent ?? null
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

