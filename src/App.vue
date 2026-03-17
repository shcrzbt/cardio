<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <div class="header-title">
          <span class="header-icon">💚</span>
          <div>
            <h1>Здоровый режим</h1>
            <p class="header-sub">Питание · Тренировки · Желчный пузырь</p>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-chip">
            <span class="stat-val">{{ userStats.weight }} кг</span>
            <span class="stat-lbl">вес</span>
          </div>
          <div class="stat-chip goal">
            <span class="stat-val">{{ userStats.goalWeight }} кг</span>
            <span class="stat-lbl">цель</span>
          </div>
          <div class="stat-chip water">
            <span class="stat-val">{{ userStats.waterNorm }}</span>
            <span class="stat-lbl">вода/день</span>
          </div>
        </div>
      </div>

      <!-- Progress to goal -->
      <div class="goal-bar-wrap">
        <div class="header-inner">
          <div class="goal-bar-info">
            <span>ИМТ {{ userStats.bmi }} → цель {{ userStats.goalBmi }}</span>
            <span>Осталось: {{ (userStats.weight - userStats.goalWeight).toFixed(1) }} кг</span>
          </div>
          <div class="goal-bar">
            <div class="goal-fill" :style="{ width: goalProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="tabs">
      <div class="tabs-inner">
        <button class="tab-btn" :class="{ active: tab === 'food' }" @click="tab = 'food'">🥗 Питание</button>
        <button class="tab-btn" :class="{ active: tab === 'workout' }" @click="tab = 'workout'">💪 Тренировки</button>
        <button class="tab-btn" :class="{ active: tab === 'shop' }" @click="tab = 'shop'">🛒 Закупки<span v-if="unboughtCount > 0" class="tab-badge">{{ unboughtCount }}</span></button>
        <button class="tab-btn" :class="{ active: tab === 'weight' }" @click="tab = 'weight'">⚖️ Вес</button>
        <button class="tab-btn" :class="{ active: tab === 'tips' }" @click="tab = 'tips'">💡 Советы</button>
      </div>
    </nav>

    <!-- Day navigation (food tab only) -->
    <nav v-if="tab === 'food'" class="day-nav">
      <div class="day-nav-inner">
        <button
          v-for="(day, index) in days"
          :key="day"
          class="day-btn"
          :class="{ active: selectedDay === index, today: index === todayIndex }"
          @click="selectedDay = index"
        >
          <span>{{ dayShort[index] }}</span>
          <span class="day-exercise-dot" :style="{ background: mealPlan[index].exercise.color }"></span>
        </button>
      </div>
    </nav>

    <!-- FOOD TAB -->
    <main v-if="tab === 'food'" class="main">
      <div class="day-header">
        <div class="day-header-left">
          <h2 class="day-name">{{ currentDay.day }}</h2>
          <span v-if="selectedDay === todayIndex" class="today-badge">Сегодня</span>
        </div>
        <div
          class="exercise-badge"
          :style="{ background: currentDay.exercise.color + '22', color: currentDay.exercise.color, borderColor: currentDay.exercise.color + '44' }"
        >
          {{ currentDay.exercise.icon }} {{ currentDay.exercise.type }}
          <span v-if="currentDay.exercise.duration"> · {{ currentDay.exercise.duration }}</span>
        </div>
      </div>

      <!-- Water tracker -->
      <div class="water-tracker">
        <div class="water-tracker-top">
          <div class="water-tracker-title">
            <span>💧</span>
            <div>
              <span class="water-ml">{{ waterToday }} мл</span>
              <span class="water-goal"> / {{ waterGoalMl }} мл</span>
            </div>
            <span class="water-cups-label">{{ waterCups }} стак.</span>
          </div>
          <button class="water-reset" @click="resetWater" title="Сбросить">↺</button>
        </div>

        <div class="water-bar-wrap">
          <div class="water-bar">
            <div
              class="water-bar-fill"
              :style="{ width: Math.min(waterPercent, 100) + '%' }"
              :class="{ overfill: waterPercent >= 100 }"
            ></div>
          </div>
          <span class="water-pct">{{ Math.min(waterPercent, 100) }}%</span>
        </div>

        <div class="water-glasses">
          <button
            v-for="i in waterGoalCups"
            :key="i"
            class="glass-btn"
            :class="{ filled: i <= waterCups }"
            @click="setWaterCups(i)"
            :title="i * 250 + ' мл'"
          >🥛</button>
        </div>

        <div class="water-actions">
          <button class="water-add-btn" @click="addWater(250)">+250 мл</button>
          <button class="water-add-btn" @click="addWater(500)">+500 мл</button>
          <button class="water-add-btn" @click="addWater(-250)" :disabled="waterToday === 0">−250 мл</button>
        </div>

        <p class="water-hint-text">Стакан воды за 20–30 мин до каждого приёма пищи</p>
      </div>

      <!-- Progress bar -->
      <div class="progress-section">
        <div class="progress-info">
          <span>{{ eatenCaloriesForDay(selectedDay) }} / {{ totalCaloriesForDay(selectedDay) }} ккал</span>
          <span>{{ completedMealsForDay(selectedDay) }}/3 приёмов</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent(selectedDay) + '%' }"></div>
        </div>
      </div>

      <!-- Meal cards -->
      <div class="meals">
        <div
          v-for="(meal, mealIndex) in currentDay.meals"
          :key="mealIndex"
          class="meal-card"
          :class="{ eaten: isMealEaten(selectedDay, mealIndex) }"
        >
          <div class="meal-header">
            <div class="meal-type-info">
              <span class="meal-icon">{{ meal.icon }}</span>
              <div>
                <span class="meal-type">{{ meal.type }}</span>
                <span class="meal-time">{{ meal.time }}</span>
              </div>
            </div>
            <div class="meal-header-right">
              <span class="water-hint">💧 {{ meal.waterBefore }}</span>
              <button
                class="check-btn"
                :class="{ checked: isMealEaten(selectedDay, mealIndex) }"
                @click="toggleMeal(selectedDay, mealIndex)"
              >
                {{ isMealEaten(selectedDay, mealIndex) ? '✓' : '○' }}
              </button>
            </div>
          </div>

          <div class="meal-body">
            <h3 class="meal-name">{{ meal.name }}</h3>
            <p class="meal-desc">{{ meal.description }}</p>
            <div class="meal-footer">
              <span class="meal-calories">🔥 {{ meal.calories }} ккал</span>
              <div class="meal-tags">
                <span
                  v-for="tag in meal.tags"
                  :key="tag"
                  class="tag"
                  :class="{ 'tag-bile': tag === 'Желчегонное' }"
                >{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week summary -->
      <div class="week-summary">
        <h3>Неделя</h3>
        <div class="week-grid">
          <div
            v-for="(day, index) in mealPlan"
            :key="index"
            class="week-day"
            :class="{ active: selectedDay === index, today: index === todayIndex }"
            @click="selectedDay = index"
          >
            <span class="week-day-name">{{ dayShort[index] }}</span>
            <span class="week-ex-icon">{{ day.exercise.icon }}</span>
            <div class="week-dots">
              <span
                v-for="(_, mi) in day.meals"
                :key="mi"
                class="week-dot"
                :class="{ filled: isMealEaten(index, mi) }"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- WORKOUT TAB -->
    <main v-if="tab === 'workout'" class="main">
      <h2 class="section-title">Расписание на неделю</h2>
      <div class="workout-week">
        <div
          v-for="(day, index) in mealPlan"
          :key="index"
          class="workout-day-card"
          :style="{ borderLeftColor: day.exercise.color }"
        >
          <div class="workout-day-name">{{ dayShort[index] }}</div>
          <div class="workout-day-info">
            <span class="workout-icon">{{ day.exercise.icon }}</span>
            <div>
              <div class="workout-type">{{ day.exercise.type }}</div>
              <div class="workout-dur" v-if="day.exercise.duration">{{ day.exercise.duration }}</div>
            </div>
          </div>
        </div>
      </div>

      <h2 class="section-title" style="margin-top: 28px">Силовые дома (3 круга)</h2>
      <div class="strength-list">
        <div v-for="ex in workout.strength" :key="ex.name" class="strength-item">
          <span class="strength-icon">{{ ex.icon }}</span>
          <div class="strength-info">
            <span class="strength-name">{{ ex.name }}</span>
            <span class="strength-sets">{{ ex.sets }}</span>
          </div>
        </div>
      </div>

      <div class="workout-phases">
        <h2 class="section-title">Фазы прогресса</h2>
        <div class="phase-card">
          <div class="phase-num">1</div>
          <div><strong>Месяц 1</strong> — только ходьба 30–45 мин/день, адаптация</div>
        </div>
        <div class="phase-card">
          <div class="phase-num">2</div>
          <div><strong>Месяц 2</strong> — добавить силовые 2–3×/нед, ускорить ходьбу</div>
        </div>
        <div class="phase-card">
          <div class="phase-num">3</div>
          <div><strong>Месяц 3+</strong> — полный режим 4–5 тренировок/нед, активное жиросжигание</div>
        </div>
      </div>
    </main>

    <!-- SHOP TAB -->
    <main v-if="tab === 'shop'" class="main">
      <div class="shop-header">
        <div>
          <h2 class="section-title" style="margin-bottom:4px">Недельный закуп</h2>
          <p class="shop-sub">{{ boughtCount }} / {{ totalItems }} куплено</p>
        </div>
        <button class="reset-btn" @click="resetShopping">Сбросить всё</button>
      </div>

      <div class="shop-progress-bar">
        <div class="shop-progress-fill" :style="{ width: shopProgress + '%' }"></div>
      </div>

      <div v-for="cat in shoppingList" :key="cat.category" class="shop-category">
        <div class="shop-cat-header">
          <span>{{ cat.icon }}</span>
          <span>{{ cat.category }}</span>
          <span class="shop-cat-count">{{ boughtInCategory(cat) }}/{{ cat.items.length }}</span>
        </div>
        <div class="shop-items">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="shop-item"
            :class="{ bought: isBought(item.id) }"
            @click="toggleBought(item.id)"
          >
            <span class="shop-check">{{ isBought(item.id) ? '✓' : '○' }}</span>
            <div class="shop-item-info">
              <span class="shop-item-name">{{ item.name }}</span>
              <span class="shop-item-note">{{ item.note }}</span>
            </div>
            <span class="shop-item-amount">{{ item.amount }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- WEIGHT TAB -->
    <main v-if="tab === 'weight'" class="main">

      <!-- Input -->
      <div class="weight-input-card">
        <div class="weight-input-row">
          <div class="weight-input-wrap">
            <label class="weight-label">Вес сегодня (кг)</label>
            <input
              v-model.number="weightInput"
              type="number"
              step="0.1"
              min="50"
              max="200"
              class="weight-input"
              placeholder="87.3"
              @keyup.enter="logWeight"
            />
          </div>
          <button class="weight-save-btn" @click="logWeight" :disabled="!weightInput">Записать</button>
        </div>
        <p v-if="weightSaved" class="weight-saved-msg">✓ Сохранено!</p>
      </div>

      <!-- Stats row -->
      <div class="weight-stats">
        <div class="wstat">
          <span class="wstat-val">{{ userStats.weight }}</span>
          <span class="wstat-lbl">Старт (кг)</span>
        </div>
        <div class="wstat current">
          <span class="wstat-val">{{ currentWeight }}</span>
          <span class="wstat-lbl">Сейчас (кг)</span>
        </div>
        <div class="wstat goal">
          <span class="wstat-val">{{ userStats.goalWeight }}</span>
          <span class="wstat-lbl">Цель (кг)</span>
        </div>
        <div class="wstat" :class="totalDelta <= 0 ? 'good' : 'bad'">
          <span class="wstat-val">{{ totalDelta > 0 ? '+' : '' }}{{ totalDelta }}</span>
          <span class="wstat-lbl">Изменение</span>
        </div>
      </div>

      <!-- Progress to goal -->
      <div class="weight-goal-section">
        <div class="weight-goal-info">
          <span>До цели: <strong>{{ toGoal }} кг</strong></span>
          <span>{{ weightGoalProgress }}%</span>
        </div>
        <div class="weight-goal-bar">
          <div class="weight-goal-fill" :style="{ width: weightGoalProgress + '%' }"></div>
        </div>
        <p class="weight-pace">Темп: 0.5–1 кг/нед · ориентировочно {{ weeksLeft }} нед.</p>
      </div>

      <!-- Chart -->
      <div class="chart-card" v-if="weightHistory.length >= 2">
        <div class="chart-title-row">
          <span class="chart-title">График веса</span>
          <span class="chart-range">{{ chartRange }}</span>
        </div>
        <svg
          class="weight-chart"
          :viewBox="`0 0 ${chartW} ${chartH}`"
          preserveAspectRatio="none"
        >
          <!-- Grid lines -->
          <line
            v-for="gl in gridLines"
            :key="gl.y"
            :x1="padL" :y1="gl.y" :x2="chartW - padR" :y2="gl.y"
            stroke="#e2e8f0" stroke-width="1"
          />
          <!-- Grid labels -->
          <text
            v-for="gl in gridLines"
            :key="'lbl'+gl.y"
            :x="padL - 6" :y="gl.y + 4"
            text-anchor="end"
            font-size="10"
            fill="#a0aec0"
          >{{ gl.label }}</text>

          <!-- Goal line -->
          <line
            :x1="padL" :y1="goalY"
            :x2="chartW - padR" :y2="goalY"
            stroke="#fc8181" stroke-width="1.5" stroke-dasharray="5,4"
          />
          <text :x="chartW - padR + 4" :y="goalY + 4" font-size="9" fill="#fc8181">цель</text>

          <!-- Start line -->
          <line
            :x1="padL" :y1="startY"
            :x2="chartW - padR" :y2="startY"
            stroke="#a0aec0" stroke-width="1" stroke-dasharray="3,3"
          />
          <text :x="chartW - padR + 4" :y="startY + 4" font-size="9" fill="#a0aec0">старт</text>

          <!-- Area fill -->
          <path :d="areaPath" fill="rgba(66,153,225,0.08)" />

          <!-- Line -->
          <path :d="linePath" fill="none" stroke="#4299e1" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

          <!-- Points -->
          <circle
            v-for="(pt, i) in chartPoints"
            :key="i"
            :cx="pt.x" :cy="pt.y"
            r="4"
            fill="white"
            stroke="#4299e1"
            stroke-width="2"
          />

          <!-- X-axis date labels -->
          <text
            v-for="(pt, i) in xLabels"
            :key="'x'+i"
            :x="pt.x"
            :y="chartH - 4"
            text-anchor="middle"
            font-size="9"
            fill="#a0aec0"
          >{{ pt.label }}</text>
        </svg>
      </div>
      <div v-else-if="weightHistory.length === 1" class="chart-placeholder">
        Добавьте ещё одну запись чтобы увидеть график
      </div>
      <div v-else class="chart-placeholder">
        Запишите первый вес чтобы начать трекинг
      </div>

      <!-- History -->
      <div v-if="weightHistory.length > 0" class="weight-history">
        <div class="weight-history-header">
          <span class="section-title" style="margin-bottom:0">История</span>
          <button class="wh-clear-btn" @click="clearHistory">Очистить</button>
        </div>
        <div class="wh-list">
          <div v-for="(entry, i) in [...weightHistory].reverse()" :key="entry.date" class="wh-item">
            <span class="wh-date">{{ formatDate(entry.date) }}</span>
            <span class="wh-val">{{ entry.weight }} кг</span>
            <span
              v-if="i < weightHistory.length - 1"
              class="wh-delta"
              :class="entry.weight <= weightHistory[weightHistory.length - 1 - i - 1]?.weight ? 'delta-good' : 'delta-bad'"
            >
              {{ deltaFromPrev([...weightHistory].reverse(), i) }}
            </span>
            <button class="wh-del" @click="deleteEntry(entry.date)">×</button>
          </div>
        </div>
      </div>

    </main>

    <!-- TIPS TAB -->
    <main v-if="tab === 'tips'" class="main">
      <h2 class="section-title">Правила питания</h2>
      <div class="tips-list">
        <div class="tip-card">📏 <span>Тарелка 22–24 см: <strong>½ овощи, ¼ белок, ¼ крупа</strong></span></div>
        <div class="tip-card">🥄 <span>Готовка: варить, тушить, запекать — <strong>жарку исключить</strong></span></div>
        <div class="tip-card">⏰ <span>Питание строго в одно время — желчь не застаивается</span></div>
        <div class="tip-card">🚫 <span>Исключить: жареное, сладкое/выпечка, белый хлеб, алкоголь</span></div>
        <div class="tip-card">⚡ <span>Сладкое — <strong>максимум 1 порция</strong> в первой половине дня</span></div>
      </div>

      <h2 class="section-title" style="margin-top: 24px">Желчегонные продукты</h2>
      <div class="bile-grid">
        <div class="bile-item">💧 Вода 2.6–3.1 л/день</div>
        <div class="bile-item">🌿 Льняное масло 1 ст.л. утром</div>
        <div class="bile-item">🌱 Свёкла, морковь, тыква</div>
        <div class="bile-item">🥦 Брокколи, шпинат, зелень</div>
        <div class="bile-item">🍵 Настой шиповника, цикорий</div>
        <div class="bile-item">🟡 Куркума, имбирь</div>
      </div>

      <h2 class="section-title" style="margin-top: 24px">Для желчного пузыря</h2>
      <div class="tips-list">
        <div v-for="tip in workout.tips" :key="tip" class="tip-card">
          <span>✅</span> <span>{{ tip }}</span>
        </div>
      </div>

      <div class="warning-card">
        <span class="warn-icon">⚠️</span>
        <div>
          <strong>Важно!</strong> Темп похудения — 0.5–1 кг/нед.
          Резкое похудение провоцирует образование камней в желчном пузыре.
          Перед желчегонными процедурами — сначала УЗИ.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { mealPlan, days, workout, userStats } from './data/mealPlan.js'
import { shoppingList } from './data/shopping.js'

const dayShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const jsDay = new Date().getDay()
const todayIndex = jsDay === 0 ? 6 : jsDay - 1

const tab = ref('food')
const selectedDay = ref(todayIndex)
const currentDay = computed(() => mealPlan[selectedDay.value])

// Goal progress (how far from start to goal)
const startWeight = 92 // approximate start (above goal by ~9 kg range)
const goalProgress = computed(() => {
  const range = startWeight - userStats.goalWeight
  const done = startWeight - userStats.weight
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)))
})

// eaten state with localStorage
const STORAGE_KEY = 'nutrition-eaten'

function loadEaten() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length === mealPlan.length) return parsed
    }
  } catch {}
  return mealPlan.map(day => day.meals.map(() => false))
}

const eaten = ref(loadEaten())

watch(eaten, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

function isMealEaten(dayIndex, mealIndex) {
  return eaten.value[dayIndex][mealIndex]
}

function toggleMeal(dayIndex, mealIndex) {
  eaten.value[dayIndex][mealIndex] = !eaten.value[dayIndex][mealIndex]
}

function totalCaloriesForDay(dayIndex) {
  return mealPlan[dayIndex].meals.reduce((sum, m) => sum + m.calories, 0)
}

function eatenCaloriesForDay(dayIndex) {
  return mealPlan[dayIndex].meals.reduce((sum, m, mi) => {
    return sum + (eaten.value[dayIndex][mi] ? m.calories : 0)
  }, 0)
}

function completedMealsForDay(dayIndex) {
  return eaten.value[dayIndex].filter(Boolean).length
}

function progressPercent(dayIndex) {
  return Math.round((eatenCaloriesForDay(dayIndex) / totalCaloriesForDay(dayIndex)) * 100)
}

// Shopping list state with localStorage
const SHOP_KEY = 'nutrition-shop'

function loadBought() {
  try {
    const saved = localStorage.getItem(SHOP_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

const bought = ref(loadBought())

watch(bought, (val) => {
  localStorage.setItem(SHOP_KEY, JSON.stringify(val))
}, { deep: true })

function isBought(id) { return !!bought.value[id] }

function toggleBought(id) {
  bought.value = { ...bought.value, [id]: !bought.value[id] }
}

function resetShopping() {
  bought.value = {}
}

function boughtInCategory(cat) {
  return cat.items.filter(i => isBought(i.id)).length
}

const totalItems = computed(() =>
  shoppingList.reduce((s, c) => s + c.items.length, 0)
)

const boughtCount = computed(() =>
  shoppingList.reduce((s, c) => s + boughtInCategory(c), 0)
)

const unboughtCount = computed(() => totalItems.value - boughtCount.value)

const shopProgress = computed(() =>
  Math.round((boughtCount.value / totalItems.value) * 100)
)

// Water tracker
const WATER_KEY = 'nutrition-water'
const waterGoalMl = 2800          // середина нормы 2.6–3.1 л
const glassSize = 250             // мл в одном стакане
const waterGoalCups = Math.round(waterGoalMl / glassSize) // 11

function todayKey() {
  return new Date().toISOString().slice(0, 10) // "2026-03-17"
}

function loadWater() {
  try {
    const saved = localStorage.getItem(WATER_KEY)
    if (saved) {
      const { date, ml } = JSON.parse(saved)
      if (date === todayKey()) return ml
    }
  } catch {}
  return 0
}

const waterToday = ref(loadWater())

watch(waterToday, (ml) => {
  localStorage.setItem(WATER_KEY, JSON.stringify({ date: todayKey(), ml }))
})

const waterCups = computed(() => Math.floor(waterToday.value / glassSize))
const waterPercent = computed(() => Math.round((waterToday.value / waterGoalMl) * 100))

function addWater(amount) {
  waterToday.value = Math.max(0, waterToday.value + amount)
}

function setWaterCups(cups) {
  waterToday.value = cups * glassSize
}

function resetWater() {
  waterToday.value = 0
}

// ── Weight tracker ─────────────────────────────────────────────
const WEIGHT_KEY = 'nutrition-weight-history'

function loadWeightHistory() {
  try {
    const saved = localStorage.getItem(WEIGHT_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

const weightHistory = ref(loadWeightHistory())
const weightInput = ref(null)
const weightSaved = ref(false)

watch(weightHistory, (val) => {
  localStorage.setItem(WEIGHT_KEY, JSON.stringify(val))
}, { deep: true })

function logWeight() {
  if (!weightInput.value || weightInput.value < 30 || weightInput.value > 250) return
  const date = todayKey()
  const existing = weightHistory.value.findIndex(e => e.date === date)
  if (existing !== -1) {
    weightHistory.value[existing].weight = weightInput.value
  } else {
    weightHistory.value.push({ date, weight: weightInput.value })
    weightHistory.value.sort((a, b) => a.date.localeCompare(b.date))
  }
  weightSaved.value = true
  setTimeout(() => { weightSaved.value = false }, 2000)
  weightInput.value = null
}

function deleteEntry(date) {
  weightHistory.value = weightHistory.value.filter(e => e.date !== date)
}

function clearHistory() {
  if (confirm('Очистить всю историю веса?')) weightHistory.value = []
}

const currentWeight = computed(() => {
  if (!weightHistory.value.length) return userStats.weight
  return weightHistory.value[weightHistory.value.length - 1].weight
})

const totalDelta = computed(() => {
  return +(currentWeight.value - userStats.weight).toFixed(1)
})

const toGoal = computed(() => {
  return Math.max(0, +(currentWeight.value - userStats.goalWeight).toFixed(1))
})

const weightGoalProgress = computed(() => {
  const range = userStats.weight - userStats.goalWeight
  const done = userStats.weight - currentWeight.value
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)))
})

const weeksLeft = computed(() => {
  return Math.ceil(toGoal.value / 0.75) // среднее 0.75 кг/нед
})

function formatDate(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

function deltaFromPrev(reversed, i) {
  if (i >= reversed.length - 1) return ''
  const delta = +(reversed[i].weight - reversed[i + 1].weight).toFixed(1)
  return (delta > 0 ? '+' : '') + delta
}

const chartRange = computed(() => {
  if (!weightHistory.value.length) return ''
  const first = weightHistory.value[0].date
  const last = weightHistory.value[weightHistory.value.length - 1].date
  return `${formatDate(first)} – ${formatDate(last)}`
})

// SVG chart
const chartW = 340
const chartH = 160
const padL = 32
const padR = 28
const padT = 14
const padB = 22

const chartPoints = computed(() => {
  const hist = weightHistory.value
  if (hist.length < 2) return []
  const weights = hist.map(e => e.weight)
  const allVals = [...weights, userStats.weight, userStats.goalWeight]
  const minW = Math.min(...allVals) - 0.5
  const maxW = Math.max(...allVals) + 0.5
  const n = hist.length
  return hist.map((e, i) => ({
    x: padL + (i / (n - 1)) * (chartW - padL - padR),
    y: padT + (1 - (e.weight - minW) / (maxW - minW)) * (chartH - padT - padB),
    weight: e.weight,
    date: e.date,
  }))
})

function chartMeta() {
  const hist = weightHistory.value
  const weights = hist.map(e => e.weight)
  const allVals = [...weights, userStats.weight, userStats.goalWeight]
  const minW = Math.min(...allVals) - 0.5
  const maxW = Math.max(...allVals) + 0.5
  return { minW, maxW }
}

function yFor(w) {
  const { minW, maxW } = chartMeta()
  return padT + (1 - (w - minW) / (maxW - minW)) * (chartH - padT - padB)
}

const goalY = computed(() => weightHistory.value.length >= 2 ? yFor(userStats.goalWeight) : 0)
const startY = computed(() => weightHistory.value.length >= 2 ? yFor(userStats.weight) : 0)

const linePath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})

const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const bottom = chartH - padB
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${line} L${pts[pts.length-1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`
})

const gridLines = computed(() => {
  if (weightHistory.value.length < 2) return []
  const { minW, maxW } = chartMeta()
  const step = (maxW - minW) > 3 ? 1 : 0.5
  const lines = []
  for (let w = Math.ceil(minW * 2) / 2; w <= maxW; w += step) {
    lines.push({ y: yFor(w), label: w % 1 === 0 ? w : w.toFixed(1) })
  }
  return lines
})

const xLabels = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return []
  const n = pts.length
  if (n <= 7) return pts.map((p, i) => ({ x: p.x, label: formatDate(weightHistory.value[i].date) }))
  // Show ~5 evenly spaced labels
  const step = Math.floor(n / 5)
  return pts.filter((_, i) => i % step === 0 || i === n - 1)
    .map((p, _, arr) => {
      const origIdx = pts.indexOf(p)
      return { x: p.x, label: formatDate(weightHistory.value[origIdx].date) }
    })
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f0f4f8;
}

/* Header */
.header {
  background: linear-gradient(135deg, #38a169 0%, #276749 100%);
  color: white;
  padding: 18px 0 0;
  box-shadow: 0 4px 20px rgba(56,161,105,0.35);
}

.header-inner {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon { font-size: 2rem; }

.header-title h1 {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.header-sub {
  font-size: 0.78rem;
  opacity: 0.85;
  margin-top: 2px;
}

.stats-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 6px 12px;
  min-width: 60px;
}

.stat-chip.goal { background: rgba(255,255,255,0.25); }
.stat-chip.water { background: rgba(66,153,225,0.35); }

.stat-val { font-size: 1rem; font-weight: 700; }
.stat-lbl { font-size: 0.68rem; opacity: 0.8; }

.goal-bar-wrap {
  margin-top: 14px;
  padding-bottom: 14px;
  background: rgba(0,0,0,0.1);
}

.goal-bar-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.85;
  margin-bottom: 6px;
  padding-top: 10px;
}

.goal-bar {
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  overflow: hidden;
}

.goal-fill {
  height: 100%;
  background: #68d391;
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* Tabs */
.tabs {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tabs-inner {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  padding: 0 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  color: #718096;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover { color: #38a169; }

.tab-btn.active {
  color: #38a169;
  border-bottom-color: #38a169;
}

/* Day nav */
.day-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.day-nav-inner {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  overflow-x: auto;
}

.day-btn {
  flex: 1;
  min-width: 40px;
  padding: 6px 4px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: #718096;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-btn:hover { background: #f7fafc; color: #38a169; }

.day-btn.active {
  background: linear-gradient(135deg, #38a169, #276749);
  color: white;
}

.day-exercise-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0.8;
}

.day-btn.active .day-exercise-dot { opacity: 1; filter: brightness(1.5); }

/* Main */
.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 18px 16px 48px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.day-header-left { display: flex; align-items: center; gap: 10px; }

.day-name { font-size: 1.4rem; font-weight: 700; color: #2d3748; }

.today-badge {
  background: linear-gradient(135deg, #38a169, #276749);
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.exercise-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid;
}

/* Water banner */
.water-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ebf8ff;
  border: 1px solid #bee3f8;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 0.84rem;
  color: #2b6cb0;
}

/* Water tracker */
.water-tracker {
  background: linear-gradient(135deg, #ebf8ff, #e0f2fe);
  border: 1.5px solid #bee3f8;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.water-tracker-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.water-tracker-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
}

.water-ml {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2b6cb0;
}

.water-goal {
  font-size: 0.85rem;
  color: #718096;
}

.water-cups-label {
  font-size: 0.8rem;
  color: #4299e1;
  background: rgba(66,153,225,0.12);
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.water-reset {
  border: none;
  background: rgba(66,153,225,0.12);
  color: #4299e1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.water-reset:hover { background: rgba(66,153,225,0.25); }

.water-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.water-bar {
  flex: 1;
  height: 8px;
  background: rgba(66,153,225,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.water-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #63b3ed);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.water-bar-fill.overfill { background: linear-gradient(90deg, #38a169, #68d391); }

.water-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: #4299e1;
  min-width: 34px;
  text-align: right;
}

.water-glasses {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.glass-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(66,153,225,0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  opacity: 0.35;
  filter: grayscale(1);
}

.glass-btn.filled {
  opacity: 1;
  filter: none;
  background: rgba(66,153,225,0.2);
}

.glass-btn:hover { transform: scale(1.1); opacity: 0.8; }
.glass-btn.filled:hover { transform: scale(1.1); }

.water-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.water-add-btn {
  flex: 1;
  padding: 7px 4px;
  border: 1.5px solid #bee3f8;
  background: white;
  color: #2b6cb0;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.water-add-btn:hover:not(:disabled) { background: #ebf8ff; border-color: #4299e1; }
.water-add-btn:disabled { opacity: 0.35; cursor: default; }

.water-hint-text {
  font-size: 0.75rem;
  color: #4299e1;
  opacity: 0.8;
  text-align: center;
}

/* Progress */
.progress-section {
  background: white;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 8px;
  font-weight: 500;
}

.progress-bar {
  height: 7px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38a169, #48bb78);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* Meals */
.meals {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.meal-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.meal-card.eaten { border-color: #68d391; background: #f0fff4; }

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.meal-card.eaten .meal-header {
  background: #e6ffed;
  border-bottom-color: #c6f6d5;
}

.meal-type-info { display: flex; align-items: center; gap: 10px; }
.meal-icon { font-size: 1.4rem; }
.meal-type { display: block; font-weight: 700; font-size: 0.88rem; color: #2d3748; }
.meal-time { font-size: 0.76rem; color: #a0aec0; }

.meal-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.water-hint {
  font-size: 0.72rem;
  color: #4299e1;
  background: #ebf8ff;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.check-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #cbd5e0;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  color: #a0aec0;
  font-weight: 700;
}

.check-btn:hover { border-color: #38a169; color: #38a169; }
.check-btn.checked { background: #48bb78; border-color: #48bb78; color: white; }

.meal-body { padding: 12px 14px; }

.meal-name { font-size: 1rem; font-weight: 700; color: #2d3748; margin-bottom: 5px; }
.meal-desc { font-size: 0.84rem; color: #718096; line-height: 1.5; margin-bottom: 10px; }

.meal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.meal-calories {
  font-size: 0.82rem;
  font-weight: 700;
  color: #c05621;
  background: #fffaf0;
  padding: 3px 10px;
  border-radius: 20px;
}

.meal-tags { display: flex; gap: 5px; flex-wrap: wrap; }

.tag {
  font-size: 0.72rem;
  background: #e6fffa;
  color: #2c7a7b;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}

.tag.tag-bile {
  background: #fefcbf;
  color: #744210;
}

/* Week summary */
.week-summary {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.week-summary h3 { font-size: 0.95rem; font-weight: 700; color: #2d3748; margin-bottom: 12px; }

.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 2px;
  border-radius: 10px;
  transition: background 0.2s;
}

.week-day:hover { background: #f7fafc; }
.week-day.active { background: #f0fff4; }
.week-day.today .week-day-name { color: #38a169; font-weight: 700; }

.week-day-name { font-size: 0.74rem; color: #718096; font-weight: 600; }
.week-ex-icon { font-size: 0.85rem; }

.week-dots { display: flex; gap: 3px; }

.week-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: background 0.3s;
}

.week-dot.filled { background: #48bb78; }

/* Workout tab */
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 12px;
}

.workout-week {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.workout-day-card {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-left: 4px solid;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.workout-day-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #718096;
  min-width: 28px;
}

.workout-day-info { display: flex; align-items: center; gap: 10px; }
.workout-icon { font-size: 1.4rem; }
.workout-type { font-weight: 700; font-size: 0.9rem; color: #2d3748; }
.workout-dur { font-size: 0.78rem; color: #a0aec0; }

.strength-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.strength-item {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.strength-icon { font-size: 1.3rem; }
.strength-info { display: flex; flex-direction: column; }
.strength-name { font-weight: 600; font-size: 0.9rem; color: #2d3748; }
.strength-sets { font-size: 0.78rem; color: #a0aec0; }

.workout-phases { margin-top: 4px; }

.phase-card {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  font-size: 0.88rem;
  color: #4a5568;
}

.phase-num {
  background: linear-gradient(135deg, #38a169, #276749);
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* Tips tab */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-card {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88rem;
  color: #4a5568;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.bile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bile-item {
  background: #fffff0;
  border: 1px solid #fefcbf;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.84rem;
  color: #744210;
  font-weight: 500;
}

.warning-card {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
  font-size: 0.87rem;
  color: #742a2a;
  line-height: 1.5;
}

.warn-icon { font-size: 1.3rem; flex-shrink: 0; }

/* Weight tab */
.weight-input-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
}

.weight-input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.weight-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.weight-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #718096;
}

.weight-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.weight-input:focus { border-color: #4299e1; }

.weight-save-btn {
  padding: 10px 22px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.weight-save-btn:disabled { opacity: 0.4; cursor: default; }
.weight-save-btn:not(:disabled):hover { opacity: 0.9; }

.weight-saved-msg {
  margin-top: 8px;
  font-size: 0.82rem;
  color: #38a169;
  font-weight: 600;
}

.weight-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.wstat {
  background: white;
  border-radius: 14px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.wstat.current { border: 2px solid #4299e1; }
.wstat.goal { border: 2px solid #fc8181; }
.wstat.good { background: #f0fff4; }
.wstat.bad { background: #fff5f5; }

.wstat-val {
  font-size: 1.05rem;
  font-weight: 700;
  color: #2d3748;
}

.wstat.good .wstat-val { color: #38a169; }
.wstat.bad .wstat-val { color: #e53e3e; }

.wstat-lbl {
  font-size: 0.68rem;
  color: #a0aec0;
  text-align: center;
}

.weight-goal-section {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.weight-goal-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #718096;
  margin-bottom: 8px;
}

.weight-goal-bar {
  height: 8px;
  background: #fed7d7;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.weight-goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #fc8181, #38a169);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.weight-pace {
  font-size: 0.74rem;
  color: #a0aec0;
  margin: 0;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  overflow: hidden;
}

.chart-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #2d3748;
}

.chart-range {
  font-size: 0.76rem;
  color: #a0aec0;
}

.weight-chart {
  width: 100%;
  height: 160px;
  display: block;
  overflow: visible;
}

.chart-placeholder {
  background: white;
  border-radius: 16px;
  padding: 28px 16px;
  text-align: center;
  color: #a0aec0;
  font-size: 0.88rem;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.weight-history {
  background: white;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.weight-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.wh-clear-btn {
  font-size: 0.78rem;
  color: #a0aec0;
  background: none;
  border: 1px solid #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.wh-clear-btn:hover { color: #e53e3e; border-color: #fc8181; }

.wh-list { display: flex; flex-direction: column; gap: 6px; }

.wh-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f7fafc;
  border-radius: 10px;
  font-size: 0.88rem;
}

.wh-date { color: #718096; min-width: 38px; }
.wh-val { font-weight: 700; color: #2d3748; flex: 1; }

.wh-delta {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.delta-good { background: #e6ffed; color: #276749; }
.delta-bad { background: #fff5f5; color: #e53e3e; }

.wh-del {
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: #cbd5e0;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.wh-del:hover { background: #fed7d7; color: #e53e3e; }

/* Shopping tab */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.shop-sub {
  font-size: 0.82rem;
  color: #718096;
  margin-top: 2px;
}

.reset-btn {
  border: 1px solid #e2e8f0;
  background: white;
  color: #718096;
  font-size: 0.8rem;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover { border-color: #fc8181; color: #e53e3e; }

.shop-progress-bar {
  height: 7px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.shop-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38a169, #68d391);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.shop-category { margin-bottom: 18px; }

.shop-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  color: #2d3748;
  margin-bottom: 8px;
  padding: 0 2px;
}

.shop-cat-count {
  margin-left: auto;
  font-size: 0.78rem;
  color: #a0aec0;
  font-weight: 500;
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shop-item {
  background: white;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid transparent;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.shop-item:hover { border-color: #c6f6d5; }

.shop-item.bought {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.shop-check {
  font-size: 1.1rem;
  font-weight: 700;
  color: #cbd5e0;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.shop-item.bought .shop-check { color: #48bb78; }

.shop-item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.shop-item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
}

.shop-item.bought .shop-item-name {
  text-decoration: line-through;
  color: #a0aec0;
}

.shop-item-note {
  font-size: 0.74rem;
  color: #a0aec0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-item-amount {
  font-size: 0.82rem;
  font-weight: 700;
  color: #38a169;
  background: #f0fff4;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.shop-item.bought .shop-item-amount {
  color: #a0aec0;
  background: #f7fafc;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e53e3e;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-left: 5px;
  vertical-align: middle;
}

@media (max-width: 480px) {
  .header-inner { flex-direction: column; align-items: flex-start; }
  .stats-row { width: 100%; justify-content: flex-start; }
  .bile-grid { grid-template-columns: 1fr; }
  .water-hint { display: none; }
}
</style>
