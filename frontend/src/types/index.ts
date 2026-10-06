export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  pointsBalance: number;
  role?: string;
  roles?: string[];
  branchId?: string | null;
  duty?: string | null;
  phone?: string;
  age?: number;
  educationLevel?: string;
}

export interface Organization {
  id: string;
  name: string;
  themeColor: string;
  logoUrl: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
  imageUrl?: string;
}

export interface ClaimedReward {
  claimId: string;
  rewardId: string;
  rewardTitle: string;
  redeemCode: string;
  status: string;
  claimedAt: string;
  redeemedAt?: string;
  expiresAt: string;
  rewardDescription?: string;
  imageUrl?: string | null;
  requiredPoints?: number;
  holderName?: string;
  personalizedFor?: string;
  isExpired?: boolean;
  daysRemaining?: number;
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdDate: string;
}

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  startDate: string;
  endDate: string;
  maxCompletions: number;
  completedCount: number;
  isCompleted: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  location: string;
  startDate: string;
  endDate: string;
  isJoined: boolean;
}

export interface UserAnalytics {
  currentPointsBalance: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  completedTasksCount: number;
  attendedActivitiesCount: number;
  redeemedRewardsCount: number;
  pointsDistribution: {
    pointsFromTasks: number;
    pointsFromActivities: number;
    pointsFromShopping: number;
    pointsFromAdmin: number;
  };
}

export interface AdminAnalytics {
  totalUsersCount: number;
  totalPointsDistributed: number;
  totalPointsRedeemed: number;
  topCafes: Array<{
    cafeName: string;
    visitCount: number;
    totalSalesAmount: number;
  }>;
  topRewards: Array<{
    rewardTitle: string;
    claimCount: number;
  }>;
}
