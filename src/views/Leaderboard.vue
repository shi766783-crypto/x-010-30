<script setup>
import { computed, ref } from 'vue'
import { useTravelStore } from '../stores/travel'
import { formatMoney } from '../utils/format'

const store = useTravelStore()
const board = computed(() => store.leaderboard)
const tab = ref('travel')

const travelBoard = computed(() => board.value.travelMasterBoard)
const luggageBoard = computed(() => board.value.luggageMasterBoard)
const budgetBoard = computed(() => board.value.budgetBoard)

function rankClass(i) {
  return i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''
}

// 结余带符号展示：+¥1,000 表示结余，-¥500 表示超支
function formatBalance(v) {
  if (v > 0) return `+${formatMoney(v)}`
  if (v < 0) return `-${formatMoney(-v)}`
  return formatMoney(0)
}

function balanceClass(v) {
  return v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted'
}
</script>

<template>
  <div>
    <div class="tabs" style="box-shadow: none; padding: 0; background: transparent; gap: 8px">
      <button class="tab board-tab" :class="{ active: tab === 'travel' }" @click="tab = 'travel'">
        出行达人榜
      </button>
      <button class="tab board-tab" :class="{ active: tab === 'luggage' }" @click="tab = 'luggage'">
        行李管家榜
      </button>
      <button class="tab board-tab" :class="{ active: tab === 'budget' }" @click="tab = 'budget'">
        预算控制榜
      </button>
    </div>

    <!-- 出行达人榜 -->
    <div v-if="tab === 'travel'" class="card">
      <h3 class="card-title">出行达人榜 <span class="text-muted" style="font-size: 13px; font-weight: 400">按出行次数与总结质量综合排序</span></h3>
      <table v-if="travelBoard.length" class="table">
        <thead>
          <tr><th>排名</th><th>成员</th><th>出行次数</th><th>平均评分</th><th>综合分</th></tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in travelBoard" :key="m.name">
            <td><span class="rank" :class="rankClass(i)">{{ i + 1 }}</span></td>
            <td>{{ m.name }}</td>
            <td>{{ m.trips }}</td>
            <td>{{ m.avgRating || '—' }}</td>
            <td>{{ m.travelScore.toFixed(1) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">暂无数据，创建出行计划后即可上榜</p>
    </div>

    <!-- 行李管家榜 -->
    <div v-else-if="tab === 'luggage'" class="card">
      <h3 class="card-title">行李管家榜 <span class="text-muted" style="font-size: 13px; font-weight: 400">按打包完成率排序</span></h3>
      <table v-if="luggageBoard.length" class="table">
        <thead>
          <tr><th>排名</th><th>成员</th><th>打包完成率</th><th>出行次数</th></tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in luggageBoard" :key="m.name">
            <td><span class="rank" :class="rankClass(i)">{{ i + 1 }}</span></td>
            <td>{{ m.name }}</td>
            <td>
              <div class="rate-cell">
                <span>{{ m.avgPackingRate }}%</span>
                <div class="rate-track"><div class="rate-fill" :style="{ width: m.avgPackingRate + '%' }"></div></div>
              </div>
            </td>
            <td>{{ m.trips }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">暂无数据，创建出行计划后即可上榜</p>
    </div>

    <!-- 预算控制榜 -->
    <div v-else class="card">
      <h3 class="card-title">预算控制榜 <span class="text-muted" style="font-size: 13px; font-weight: 400">按结余金额（预算 − 实际花费）从高到低排序，超支记为负数</span></h3>
      <table v-if="budgetBoard.length" class="table">
        <thead>
          <tr><th>排名</th><th>成员</th><th>计入计划</th><th>预算合计</th><th>花费合计</th><th>结余</th></tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in budgetBoard" :key="m.name">
            <td><span class="rank" :class="rankClass(i)">{{ i + 1 }}</span></td>
            <td>{{ m.name }}</td>
            <td>{{ m.budgetPlans }}</td>
            <td>{{ formatMoney(m.budgetTotal) }}</td>
            <td>{{ formatMoney(m.spendTotal) }}</td>
            <td><strong :class="balanceClass(m.balance)">{{ formatBalance(m.balance) }}</strong></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">暂无数据，为计划填写预算并记录花费后即可上榜</p>
      <p class="text-muted" style="font-size: 12px; margin-top: 12px">
        统计口径：仅计入填写了预算且存在花费记录的计划，成员按所参与计划的预算合计与花费合计计算结余；没有符合条件计划的成员不上榜。
      </p>
    </div>
  </div>
</template>

<style scoped>
.board-tab {
  flex: 0 0 auto;
  padding: 9px 24px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.rank {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef0f4;
  font-weight: 600;
  font-size: 13px;
}

.rank-1 {
  background: #fef3c7;
  color: #b45309;
}

.rank-2 {
  background: #e5e7eb;
  color: #4b5563;
}

.rank-3 {
  background: #fde8d7;
  color: #c2410c;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-track {
  width: 120px;
  height: 8px;
  background: #eef0f4;
  border-radius: 10px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 10px;
}
</style>
