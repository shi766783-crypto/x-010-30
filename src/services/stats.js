import { TRIP_TYPES, EXPENSE_CATEGORIES } from '../constants'
import { luggageCompletionRate } from './luggage'
import { planTotalSpend, planPackingRate, planSpendBreakdown } from './selectors'

// ===== 出行看板统计 =====
export function computeDashboardStats(plans) {
  const totalTrips = plans.length
  const totalSpend = plans.reduce((sum, p) => sum + planTotalSpend(p), 0)
  const totalBudget = plans.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
  const totalDays = plans.reduce((sum, p) => sum + (Number(p.days) || 0), 0)

  const avgDays = totalTrips ? Math.round((totalDays / totalTrips) * 10) / 10 : 0
  const avgPackingRate = totalTrips
    ? Math.round(plans.reduce((sum, p) => sum + planPackingRate(p), 0) / totalTrips)
    : 0

  // 最常去目的地
  const destCount = {}
  plans.forEach((p) => {
    if (p.destination) destCount[p.destination] = (destCount[p.destination] || 0) + 1
  })
  const mostVisited =
    Object.entries(destCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  // 出行类型分布
  const tripTypeDist = TRIP_TYPES.map((label) => ({
    label,
    value: plans.filter((p) => p.tripType === label).length,
  }))

  // 花费分类汇总（所有出行）
  const categorySpend = EXPENSE_CATEGORIES.map(({ label }) => ({ label, value: 0 }))
  plans.forEach((p) => {
    const breakdown = planSpendBreakdown(p)
    categorySpend.forEach((c) => {
      c.value += breakdown[c.label] || 0
    })
  })

  // 各次出行花费对比
  const perTripSpend = plans.map((p) => ({ label: p.name, value: planTotalSpend(p) }))

  return {
    totalTrips,
    totalSpend,
    totalBudget,
    avgDays,
    avgPackingRate,
    mostVisited,
    balance: totalBudget - totalSpend,
    tripTypeDist,
    categorySpend,
    perTripSpend,
  }
}

// ===== 成员聚合（供排行榜使用） =====
export function computeMemberLeaderboard(plans) {
  const map = new Map()

  plans.forEach((plan) => {
    // 预算控制榜只统计填写了预算且存在花费记录的计划
    const budget = Number(plan.budget) || 0
    const spend = planTotalSpend(plan)
    const budgetCountable = budget > 0 && (plan.records || []).length > 0

    ;(plan.members || []).forEach((m) => {
      if (!map.has(m.name)) {
        map.set(m.name, {
          name: m.name,
          trips: 0,
          packingSum: 0,
          packingCount: 0,
          ratingSum: 0,
          ratingCount: 0,
          budgetPlans: 0,
          budgetSum: 0,
          spendSum: 0,
        })
      }
      const entry = map.get(m.name)
      entry.trips += 1

      const list = (plan.luggage || []).find((l) => l.memberId === m.id)
      if (list) {
        entry.packingSum += luggageCompletionRate(list.items)
        entry.packingCount += 1
      }

      if (plan.summary && plan.summary.rating) {
        entry.ratingSum += plan.summary.rating
        entry.ratingCount += 1
      }

      if (budgetCountable) {
        entry.budgetPlans += 1
        entry.budgetSum += budget
        entry.spendSum += spend
      }
    })
  })

  const members = [...map.values()].map((e) => ({
    name: e.name,
    trips: e.trips,
    avgPackingRate: e.packingCount ? Math.round(e.packingSum / e.packingCount) : 0,
    avgRating: e.ratingCount ? Math.round((e.ratingSum / e.ratingCount) * 10) / 10 : 0,
    // 出行达人综合分：出行次数权重更高，总结质量作为加成
    travelScore: e.trips * 10 + (e.ratingCount ? e.ratingSum / e.ratingCount : 0),
    // 预算控制榜数据：结余 = 预算合计 − 花费合计，正数为结余、负数为超支
    budgetPlans: e.budgetPlans,
    budgetTotal: Math.round(e.budgetSum * 100) / 100,
    spendTotal: Math.round(e.spendSum * 100) / 100,
    balance: Math.round((e.budgetSum - e.spendSum) * 100) / 100,
  }))

  // 预算控制榜：没有符合条件计划的成员不上榜；
  // 按结余金额降序（结余多在前、超支在后），结余相同按结余率、出行次数排序
  const budgetBoard = members
    .filter((m) => m.budgetPlans > 0)
    .sort(
      (a, b) =>
        b.balance - a.balance ||
        b.balance / b.budgetTotal - a.balance / a.budgetTotal ||
        b.trips - a.trips
    )

  return {
    travelMasterBoard: [...members].sort(
      (a, b) => b.travelScore - a.travelScore || b.avgRating - a.avgRating
    ),
    luggageMasterBoard: [...members].sort(
      (a, b) => b.avgPackingRate - a.avgPackingRate || b.trips - a.trips
    ),
    budgetBoard,
  }
}
