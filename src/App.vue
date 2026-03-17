<template>
  <div class="app">

    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <div class="header-brand">
          <div class="brand-icon"><Heart :size="20" /></div>
          <div>
            <h1>Здоровый режим</h1>
            <p class="header-sub">Питание · Тренировки · Желчный пузырь</p>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-chip">
            <span class="stat-val">{{ userStats.weight }}</span>
            <span class="stat-lbl">кг сейчас</span>
          </div>
          <div class="stat-chip goal">
            <span class="stat-val">{{ userStats.goalWeight }}</span>
            <span class="stat-lbl">кг цель</span>
          </div>
          <div class="stat-chip water">
            <span class="stat-val">{{ userStats.waterNorm }}</span>
            <span class="stat-lbl">воды/день</span>
          </div>
        </div>
      </div>
      <div class="header-inner goal-bar-section">
        <div class="goal-bar-info">
          <span>ИМТ {{ userStats.bmi }} → {{ userStats.goalBmi }}</span>
          <span>Осталось {{ (userStats.weight - userStats.goalWeight).toFixed(1) }} кг</span>
        </div>
        <div class="goal-bar"><div class="goal-fill" :style="{ width: goalProgress + '%' }"></div></div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="tabs">
      <div class="tabs-inner">
        <button class="tab-btn" :class="{ active: tab === 'food' }" @click="tab = 'food'">
          <Utensils :size="16" /><span>Питание</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'workout' }" @click="tab = 'workout'">
          <Dumbbell :size="16" /><span>Тренировки</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'shop' }" @click="tab = 'shop'">
          <ShoppingCart :size="16" /><span>Закупки</span>
          <span v-if="unboughtCount > 0" class="tab-badge">{{ unboughtCount }}</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'weight' }" @click="tab = 'weight'">
          <Scale :size="16" /><span>Вес</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'tips' }" @click="tab = 'tips'">
          <BookOpen :size="16" /><span>Советы</span>
        </button>
      </div>
    </nav>

    <!-- Day nav (food tab) -->
    <nav v-if="tab === 'food'" class="day-nav">
      <div class="day-nav-inner">
        <button
          v-for="(day, index) in days"
          :key="day"
          class="day-btn"
          :class="{ active: selectedDay === index, today: index === todayIndex }"
          @click="selectedDay = index"
        >
          <span class="day-short">{{ dayShort[index] }}</span>
          <span class="day-dot" :style="{ background: mealPlan[index].exercise.color }"></span>
        </button>
      </div>
    </nav>

    <!-- ── FOOD TAB ── -->
    <main v-if="tab === 'food'" class="main">

      <div class="day-header">
        <div class="day-header-left">
          <h2 class="day-name">{{ currentDay.day }}</h2>
          <span v-if="selectedDay === todayIndex" class="today-badge">Сегодня</span>
        </div>
        <div class="exercise-badge" :style="{ background: currentDay.exercise.color + '18', color: currentDay.exercise.color }">
          <component :is="exerciseIcon(currentDay.exercise.type)" :size="13" />
          {{ currentDay.exercise.type }}
          <span v-if="currentDay.exercise.duration">· {{ currentDay.exercise.duration }}</span>
        </div>
      </div>

      <!-- Water tracker -->
      <div class="water-card">
        <div class="water-top">
          <div class="water-title">
            <div class="water-icon-wrap"><Droplets :size="18" /></div>
            <div>
              <span class="water-ml">{{ waterToday }} мл</span>
              <span class="water-of"> / {{ waterGoalMl }} мл</span>
            </div>
            <span class="water-cups-badge">{{ waterCups }} ст.</span>
          </div>
          <button class="icon-btn" @click="resetWater" title="Сбросить"><RotateCcw :size="15" /></button>
        </div>
        <div class="water-bar-row">
          <div class="thin-bar">
            <div class="thin-bar-fill" :class="{ done: waterPercent >= 100 }" :style="{ width: Math.min(waterPercent,100) + '%' }"></div>
          </div>
          <span class="bar-pct">{{ Math.min(waterPercent, 100) }}%</span>
        </div>
        <div class="glass-row">
          <button
            v-for="i in waterGoalCups" :key="i"
            class="glass-btn" :class="{ filled: i <= waterCups }"
            @click="setWaterCups(i)" :title="i * 250 + ' мл'"
          >
            <GlassWater :size="16" />
          </button>
        </div>
        <div class="water-btns">
          <button class="water-add" @click="addWater(250)">+250 мл</button>
          <button class="water-add" @click="addWater(500)">+500 мл</button>
          <button class="water-add minus" @click="addWater(-250)" :disabled="waterToday === 0">−250 мл</button>
        </div>
        <p class="water-hint">Стакан воды за 20–30 мин до каждого приёма пищи</p>
      </div>

      <!-- Calories progress -->
      <div class="progress-card">
        <div class="progress-row">
          <div class="progress-label">
            <Flame :size="14" />
            <span>{{ eatenCaloriesForDay(selectedDay) }} / {{ totalCaloriesForDay(selectedDay) }} ккал</span>
          </div>
          <span class="progress-meals">{{ completedMealsForDay(selectedDay) }}/3 приёмов</span>
        </div>
        <div class="thin-bar">
          <div class="thin-bar-fill green" :style="{ width: progressPercent(selectedDay) + '%' }"></div>
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
          <div class="meal-head">
            <div class="meal-meta">
              <div class="meal-type-icon">
                <Sunrise v-if="mealIndex === 0" :size="16" />
                <Sun v-else-if="mealIndex === 1" :size="16" />
                <Moon v-else :size="16" />
              </div>
              <div>
                <div class="meal-type">{{ meal.type }}</div>
                <div class="meal-time">{{ meal.time }}</div>
              </div>
            </div>
            <div class="meal-head-right">
              <div class="water-time-hint">
                <Droplets :size="11" />
                {{ meal.waterBefore }}
              </div>
              <button
                class="check-btn"
                :class="{ checked: isMealEaten(selectedDay, mealIndex) }"
                @click="toggleMeal(selectedDay, mealIndex)"
              >
                <Check v-if="isMealEaten(selectedDay, mealIndex)" :size="16" />
                <span v-else class="check-empty"></span>
              </button>
            </div>
          </div>
          <div class="meal-body">
            <h3 class="meal-name">{{ meal.name }}</h3>
            <p class="meal-desc">{{ meal.description }}</p>
            <div class="meal-foot">
              <span class="cal-badge"><Flame :size="12" />{{ meal.calories }} ккал</span>
              <div class="tags">
                <span v-for="tag in meal.tags" :key="tag" class="tag" :class="{ 'tag-bile': tag === 'Желчегонное' }">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week grid -->
      <div class="week-card">
        <p class="week-title">Неделя</p>
        <div class="week-grid">
          <div
            v-for="(day, index) in mealPlan" :key="index"
            class="week-cell"
            :class="{ active: selectedDay === index, today: index === todayIndex }"
            @click="selectedDay = index"
          >
            <span class="week-lbl">{{ dayShort[index] }}</span>
            <component :is="exerciseIcon(day.exercise.type)" :size="12" class="week-ex-icon" :style="{ color: day.exercise.color }" />
            <div class="week-dots">
              <span v-for="(_, mi) in day.meals" :key="mi" class="week-dot" :class="{ filled: isMealEaten(index, mi) }"></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── WORKOUT TAB ── -->
    <main v-if="tab === 'workout'" class="main">
      <h2 class="section-title">Расписание на неделю</h2>
      <div class="workout-week">
        <div
          v-for="(day, index) in mealPlan" :key="index"
          class="workout-row"
          :style="{ borderLeftColor: day.exercise.color }"
        >
          <span class="workout-day-lbl">{{ dayShort[index] }}</span>
          <div class="workout-ex-icon" :style="{ color: day.exercise.color, background: day.exercise.color + '18' }">
            <component :is="exerciseIcon(day.exercise.type)" :size="16" />
          </div>
          <div>
            <div class="workout-type">{{ day.exercise.type }}</div>
            <div class="workout-dur" v-if="day.exercise.duration">{{ day.exercise.duration }}</div>
          </div>
        </div>
      </div>

      <h2 class="section-title mt">Силовые дома <span class="section-sub">3 круга</span></h2>
      <div class="strength-list">
        <div v-for="ex in workout.strength" :key="ex.name" class="strength-row">
          <div class="strength-dot"></div>
          <span class="strength-name">{{ ex.name }}</span>
          <span class="strength-sets">{{ ex.sets }}</span>
        </div>
      </div>

      <h2 class="section-title mt">Фазы прогресса</h2>
      <div class="phases">
        <div class="phase-row">
          <div class="phase-num">1</div>
          <div><strong>Месяц 1</strong> — ходьба 30–45 мин/день, адаптация</div>
        </div>
        <div class="phase-row">
          <div class="phase-num">2</div>
          <div><strong>Месяц 2</strong> — силовые 2–3×/нед, ускорить ходьбу</div>
        </div>
        <div class="phase-row">
          <div class="phase-num">3</div>
          <div><strong>Месяц 3+</strong> — 4–5 тренировок/нед, активное жиросжигание</div>
        </div>
      </div>
    </main>

    <!-- ── SHOP TAB ── -->
    <main v-if="tab === 'shop'" class="main">
      <div class="shop-top">
        <div>
          <h2 class="section-title" style="margin-bottom:2px">Недельный закуп</h2>
          <p class="shop-sub">{{ boughtCount }} / {{ totalItems }} позиций</p>
        </div>
        <button class="ghost-btn" @click="resetShopping">
          <RotateCcw :size="13" /> Сбросить
        </button>
      </div>
      <div class="thin-bar" style="margin-bottom:20px">
        <div class="thin-bar-fill green" :style="{ width: shopProgress + '%' }"></div>
      </div>

      <div v-for="cat in shoppingList" :key="cat.category" class="shop-cat">
        <div class="shop-cat-head">
          <span class="shop-cat-name">{{ cat.category }}</span>
          <span class="shop-cat-cnt">{{ boughtInCategory(cat) }}/{{ cat.items.length }}</span>
        </div>
        <div class="shop-items">
          <div
            v-for="item in cat.items" :key="item.id"
            class="shop-item" :class="{ bought: isBought(item.id) }"
            @click="toggleBought(item.id)"
          >
            <div class="shop-check" :class="{ checked: isBought(item.id) }">
              <Check v-if="isBought(item.id)" :size="12" />
            </div>
            <div class="shop-info">
              <span class="shop-name">{{ item.name }}</span>
              <span class="shop-note">{{ item.note }}</span>
            </div>
            <span class="shop-amount">{{ item.amount }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- ── WEIGHT TAB ── -->
    <main v-if="tab === 'weight'" class="main">

      <div class="weight-input-card">
        <label class="field-label">Вес сегодня (кг)</label>
        <div class="weight-field-row">
          <input
            v-model.number="weightInput"
            type="number" step="0.1" min="50" max="200"
            class="weight-field" placeholder="87.3"
            @keyup.enter="logWeight"
          />
          <button class="primary-btn" @click="logWeight" :disabled="!weightInput">
            <Plus :size="16" /> Записать
          </button>
        </div>
        <p v-if="weightSaved" class="saved-msg"><Check :size="13" /> Сохранено!</p>
      </div>

      <div class="wstats">
        <div class="wstat">
          <span class="wstat-val">{{ userStats.weight }}</span>
          <span class="wstat-lbl">Старт</span>
        </div>
        <div class="wstat highlight">
          <span class="wstat-val">{{ currentWeight }}</span>
          <span class="wstat-lbl">Сейчас</span>
        </div>
        <div class="wstat target">
          <span class="wstat-val">{{ userStats.goalWeight }}</span>
          <span class="wstat-lbl">Цель</span>
        </div>
        <div class="wstat" :class="totalDelta <= 0 ? 'good' : 'bad'">
          <span class="wstat-val">{{ totalDelta > 0 ? '+' : '' }}{{ totalDelta }}</span>
          <span class="wstat-lbl">Δ кг</span>
        </div>
      </div>

      <div class="wgoal-card">
        <div class="wgoal-row">
          <span>До цели: <strong>{{ toGoal }} кг</strong></span>
          <span class="wgoal-pct">{{ weightGoalProgress }}%</span>
        </div>
        <div class="thin-bar" style="margin: 8px 0">
          <div class="thin-bar-fill red-green" :style="{ width: weightGoalProgress + '%' }"></div>
        </div>
        <p class="wgoal-pace">0.5–1 кг/нед · ещё ~{{ weeksLeft }} нед.</p>
      </div>

      <div class="chart-card" v-if="weightHistory.length >= 2">
        <div class="chart-head">
          <span class="chart-title">График веса</span>
          <span class="chart-range">{{ chartRange }}</span>
        </div>
        <svg class="weight-chart" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
          <line v-for="gl in gridLines" :key="gl.y" :x1="padL" :y1="gl.y" :x2="chartW-padR" :y2="gl.y" stroke="#f1f5f9" stroke-width="1"/>
          <text v-for="gl in gridLines" :key="'l'+gl.y" :x="padL-6" :y="gl.y+4" text-anchor="end" font-size="10" fill="#94a3b8">{{ gl.label }}</text>
          <line :x1="padL" :y1="goalY" :x2="chartW-padR" :y2="goalY" stroke="#f87171" stroke-width="1.5" stroke-dasharray="5,4"/>
          <text :x="chartW-padR+4" :y="goalY+4" font-size="9" fill="#f87171">цель</text>
          <line :x1="padL" :y1="startY" :x2="chartW-padR" :y2="startY" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>
          <text :x="chartW-padR+4" :y="startY+4" font-size="9" fill="#cbd5e1">старт</text>
          <path :d="areaPath" fill="rgba(59,130,246,0.06)"/>
          <path :d="linePath" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <circle v-for="(pt, i) in chartPoints" :key="i" :cx="pt.x" :cy="pt.y" r="3.5" fill="white" stroke="#3b82f6" stroke-width="2"/>
          <text v-for="(pt, i) in xLabels" :key="'x'+i" :x="pt.x" :y="chartH-4" text-anchor="middle" font-size="9" fill="#94a3b8">{{ pt.label }}</text>
        </svg>
      </div>
      <div v-else class="empty-chart">
        <TrendingDown :size="32" />
        <p>{{ weightHistory.length === 1 ? 'Добавьте ещё одну запись для графика' : 'Запишите первый вес' }}</p>
      </div>

      <div v-if="weightHistory.length > 0" class="wh-card">
        <div class="wh-head">
          <span class="section-title" style="margin-bottom:0">История</span>
          <button class="ghost-btn red" @click="clearHistory"><Trash2 :size="13" /> Очистить</button>
        </div>
        <div class="wh-list">
          <div v-for="(entry, i) in [...weightHistory].reverse()" :key="entry.date" class="wh-row">
            <span class="wh-date">{{ formatDate(entry.date) }}</span>
            <span class="wh-val">{{ entry.weight }} кг</span>
            <span v-if="i < weightHistory.length-1" class="wh-delta" :class="entry.weight <= weightHistory[weightHistory.length-1-i-1]?.weight ? 'delta-good':'delta-bad'">
              {{ deltaFromPrev([...weightHistory].reverse(), i) }}
            </span>
            <button class="icon-btn sm" @click="deleteEntry(entry.date)"><X :size="13" /></button>
          </div>
        </div>
      </div>
    </main>

    <!-- ── TIPS TAB ── -->
    <main v-if="tab === 'tips'" class="main">
      <h2 class="section-title">Правила питания</h2>
      <div class="tips-list">
        <div class="tip-row"><div class="tip-icon"><Ruler :size="15"/></div><span>Тарелка 22–24 см: <strong>½ овощи, ¼ белок, ¼ крупа</strong></span></div>
        <div class="tip-row"><div class="tip-icon"><Flame :size="15"/></div><span>Готовка: варить, тушить, запекать — <strong>жарку исключить</strong></span></div>
        <div class="tip-row"><div class="tip-icon"><Clock :size="15"/></div><span>Питание строго в одно время — желчь не застаивается</span></div>
        <div class="tip-row"><div class="tip-icon"><Ban :size="15"/></div><span>Исключить: жареное, сладкое, белый хлеб, алкоголь</span></div>
        <div class="tip-row"><div class="tip-icon"><Zap :size="15"/></div><span>Сладкое — максимум 1 порция в первой половине дня</span></div>
      </div>

      <h2 class="section-title mt">Желчегонные продукты</h2>
      <div class="bile-grid">
        <div class="bile-item"><Droplets :size="14"/>Вода 2.6–3.1 л/день</div>
        <div class="bile-item"><Leaf :size="14"/>Льняное масло 1 ст.л.</div>
        <div class="bile-item"><Apple :size="14"/>Свёкла, морковь, тыква</div>
        <div class="bile-item"><Sprout :size="14"/>Брокколи, шпинат, зелень</div>
        <div class="bile-item"><Coffee :size="14"/>Шиповник, цикорий</div>
        <div class="bile-item"><Zap :size="14"/>Куркума, имбирь</div>
      </div>

      <h2 class="section-title mt">Для желчного пузыря</h2>
      <div class="tips-list">
        <div v-for="tip in workout.tips" :key="tip" class="tip-row">
          <div class="tip-icon green"><Check :size="13"/></div>
          <span>{{ tip }}</span>
        </div>
      </div>

      <div class="warning-card">
        <div class="warn-icon"><AlertTriangle :size="18"/></div>
        <div><strong>Важно!</strong> Темп похудения — 0.5–1 кг/нед. Резкое похудение провоцирует образование камней. Перед желчегонными процедурами — сначала УЗИ.</div>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Heart, Utensils, Dumbbell, ShoppingCart, Scale, BookOpen,
  Droplets, GlassWater, Flame, Sunrise, Sun, Moon,
  Check, RotateCcw, Plus, Trash2, X, TrendingDown,
  Ruler, Clock, Ban, Zap, Leaf, Apple, Sprout, Coffee,
  AlertTriangle, Activity, PersonStanding, TreePine, Footprints,
} from 'lucide-vue-next'

import { mealPlan, days, workout, userStats } from './data/mealPlan.js'
import { shoppingList } from './data/shopping.js'

const dayShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const jsDay = new Date().getDay()
const todayIndex = jsDay === 0 ? 6 : jsDay - 1

const tab = ref('food')
const selectedDay = ref(todayIndex)
const currentDay = computed(() => mealPlan[selectedDay.value])

function exerciseIcon(type) {
  if (type === 'Силовые дома') return Dumbbell
  if (type === 'Длинная прогулка') return Activity
  if (type === 'Отдых') return TreePine
  return Activity // Ходьба and default
}

const startWeight = 92
const goalProgress = computed(() => {
  const range = startWeight - userStats.goalWeight
  const done = startWeight - userStats.weight
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)))
})

// ── Eaten ──
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
watch(eaten, val => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

function isMealEaten(di, mi) { return eaten.value[di][mi] }
function toggleMeal(di, mi) { eaten.value[di][mi] = !eaten.value[di][mi] }
function totalCaloriesForDay(di) { return mealPlan[di].meals.reduce((s, m) => s + m.calories, 0) }
function eatenCaloriesForDay(di) { return mealPlan[di].meals.reduce((s, m, mi) => s + (eaten.value[di][mi] ? m.calories : 0), 0) }
function completedMealsForDay(di) { return eaten.value[di].filter(Boolean).length }
function progressPercent(di) { return Math.round((eatenCaloriesForDay(di) / totalCaloriesForDay(di)) * 100) }

// ── Shopping ──
const SHOP_KEY = 'nutrition-shop'
function loadBought() {
  try { const s = localStorage.getItem(SHOP_KEY); if (s) return JSON.parse(s) } catch {}
  return {}
}
const bought = ref(loadBought())
watch(bought, val => localStorage.setItem(SHOP_KEY, JSON.stringify(val)), { deep: true })
function isBought(id) { return !!bought.value[id] }
function toggleBought(id) { bought.value = { ...bought.value, [id]: !bought.value[id] } }
function resetShopping() { bought.value = {} }
function boughtInCategory(cat) { return cat.items.filter(i => isBought(i.id)).length }
const totalItems = computed(() => shoppingList.reduce((s, c) => s + c.items.length, 0))
const boughtCount = computed(() => shoppingList.reduce((s, c) => s + boughtInCategory(c), 0))
const unboughtCount = computed(() => totalItems.value - boughtCount.value)
const shopProgress = computed(() => Math.round((boughtCount.value / totalItems.value) * 100))

// ── Water ──
const WATER_KEY = 'nutrition-water'
const waterGoalMl = 2800
const glassSize = 250
const waterGoalCups = Math.round(waterGoalMl / glassSize)

function todayKey() { return new Date().toISOString().slice(0, 10) }
function loadWater() {
  try { const s = localStorage.getItem(WATER_KEY); if (s) { const { date, ml } = JSON.parse(s); if (date === todayKey()) return ml } } catch {}
  return 0
}
const waterToday = ref(loadWater())
watch(waterToday, ml => localStorage.setItem(WATER_KEY, JSON.stringify({ date: todayKey(), ml })))
const waterCups = computed(() => Math.floor(waterToday.value / glassSize))
const waterPercent = computed(() => Math.round((waterToday.value / waterGoalMl) * 100))
function addWater(n) { waterToday.value = Math.max(0, waterToday.value + n) }
function setWaterCups(n) { waterToday.value = n * glassSize }
function resetWater() { waterToday.value = 0 }

// ── Weight ──
const WEIGHT_KEY = 'nutrition-weight-history'
function loadWeightHistory() {
  try { const s = localStorage.getItem(WEIGHT_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}
const weightHistory = ref(loadWeightHistory())
const weightInput = ref(null)
const weightSaved = ref(false)
watch(weightHistory, val => localStorage.setItem(WEIGHT_KEY, JSON.stringify(val)), { deep: true })

function logWeight() {
  if (!weightInput.value || weightInput.value < 30 || weightInput.value > 250) return
  const date = todayKey()
  const idx = weightHistory.value.findIndex(e => e.date === date)
  if (idx !== -1) weightHistory.value[idx].weight = weightInput.value
  else { weightHistory.value.push({ date, weight: weightInput.value }); weightHistory.value.sort((a, b) => a.date.localeCompare(b.date)) }
  weightSaved.value = true
  setTimeout(() => { weightSaved.value = false }, 2000)
  weightInput.value = null
}
function deleteEntry(date) { weightHistory.value = weightHistory.value.filter(e => e.date !== date) }
function clearHistory() { if (confirm('Очистить историю?')) weightHistory.value = [] }
function formatDate(iso) { const [, m, d] = iso.split('-'); return `${d}.${m}` }
function deltaFromPrev(rev, i) {
  if (i >= rev.length - 1) return ''
  const d = +(rev[i].weight - rev[i+1].weight).toFixed(1)
  return (d > 0 ? '+' : '') + d
}

const currentWeight = computed(() => weightHistory.value.length ? weightHistory.value[weightHistory.value.length-1].weight : userStats.weight)
const totalDelta = computed(() => +(currentWeight.value - userStats.weight).toFixed(1))
const toGoal = computed(() => Math.max(0, +(currentWeight.value - userStats.goalWeight).toFixed(1)))
const weightGoalProgress = computed(() => {
  const range = userStats.weight - userStats.goalWeight
  const done = userStats.weight - currentWeight.value
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)))
})
const weeksLeft = computed(() => Math.ceil(toGoal.value / 0.75))
const chartRange = computed(() => {
  if (!weightHistory.value.length) return ''
  return `${formatDate(weightHistory.value[0].date)} – ${formatDate(weightHistory.value[weightHistory.value.length-1].date)}`
})

const chartW = 340, chartH = 160, padL = 32, padR = 28, padT = 14, padB = 22

const chartPoints = computed(() => {
  const hist = weightHistory.value
  if (hist.length < 2) return []
  const allVals = [...hist.map(e => e.weight), userStats.weight, userStats.goalWeight]
  const minW = Math.min(...allVals) - 0.5, maxW = Math.max(...allVals) + 0.5
  const n = hist.length
  return hist.map((e, i) => ({
    x: padL + (i / (n-1)) * (chartW - padL - padR),
    y: padT + (1 - (e.weight - minW) / (maxW - minW)) * (chartH - padT - padB),
  }))
})

function chartMeta() {
  const allVals = [...weightHistory.value.map(e => e.weight), userStats.weight, userStats.goalWeight]
  return { minW: Math.min(...allVals) - 0.5, maxW: Math.max(...allVals) + 0.5 }
}
function yFor(w) { const { minW, maxW } = chartMeta(); return padT + (1 - (w - minW) / (maxW - minW)) * (chartH - padT - padB) }

const goalY = computed(() => weightHistory.value.length >= 2 ? yFor(userStats.goalWeight) : 0)
const startY = computed(() => weightHistory.value.length >= 2 ? yFor(userStats.weight) : 0)
const linePath = computed(() => chartPoints.value.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const b = chartH - padB
  return pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${pts[pts.length-1].x.toFixed(1)},${b} L${pts[0].x.toFixed(1)},${b} Z`
})
const gridLines = computed(() => {
  if (weightHistory.value.length < 2) return []
  const { minW, maxW } = chartMeta()
  const step = (maxW - minW) > 3 ? 1 : 0.5
  const lines = []
  for (let w = Math.ceil(minW * 2) / 2; w <= maxW; w += step)
    lines.push({ y: yFor(w), label: w % 1 === 0 ? w : w.toFixed(1) })
  return lines
})
const xLabels = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return []
  const n = pts.length
  if (n <= 7) return pts.map((p, i) => ({ x: p.x, label: formatDate(weightHistory.value[i].date) }))
  const step = Math.floor(n / 5)
  return pts
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % step === 0 || i === n - 1)
    .map(({ p, i }) => ({ x: p.x, label: formatDate(weightHistory.value[i].date) }))
})
</script>

<style scoped>
/* ── Base ── */
.app { min-height: 100vh; background: #f8fafc; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }

/* ── Header ── */
.header {
  background: #0f172a;
  color: white;
  padding: 18px 0 0;
}

.header-inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-brand { display: flex; align-items: center; gap: 12px; }

.brand-icon {
  width: 36px; height: 36px;
  background: #16a34a;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-brand h1 { font-size: 1.2rem; font-weight: 700; line-height: 1.2; }
.header-sub { font-size: 0.73rem; color: #94a3b8; margin-top: 2px; }

.stats-row { display: flex; gap: 6px; flex-wrap: wrap; }

.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  background: #1e293b;
  border-radius: 10px;
  padding: 6px 12px;
  min-width: 58px;
}
.stat-chip.goal { background: #14532d22; border: 1px solid #16a34a44; }
.stat-chip.water { background: #1e3a5f; }
.stat-val { font-size: 0.95rem; font-weight: 700; color: white; }
.stat-lbl { font-size: 0.65rem; color: #64748b; margin-top: 1px; }

.goal-bar-section {
  padding-top: 12px;
  padding-bottom: 14px;
  margin-top: 14px;
  border-top: 1px solid #1e293b;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}
.goal-bar-info { display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; }
.goal-bar { height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
.goal-fill { height: 100%; background: #16a34a; border-radius: 2px; transition: width .5s ease; }

/* ── Tabs ── */
.tabs {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; z-index: 10;
  box-shadow: 0 1px 0 #e2e8f0;
}
.tabs-inner {
  max-width: 680px; margin: 0 auto;
  display: flex; padding: 0 8px;
}
.tab-btn {
  flex: 1; padding: 11px 4px;
  border: none; background: transparent;
  cursor: pointer;
  font-size: 0.78rem; font-weight: 600;
  color: #94a3b8;
  border-bottom: 2px solid transparent;
  transition: all .2s;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  position: relative; min-height: 48px;
  font-family: inherit;
}
.tab-btn span { display: inline; font-size: 0.68rem; }
.tab-btn:hover { color: #475569; }
.tab-btn.active { color: #16a34a; border-bottom-color: #16a34a; }
.tab-badge {
  position: absolute; top: 6px; right: 4px;
  background: #ef4444; color: white;
  font-size: 0.6rem; font-weight: 700;
  width: 15px; height: 15px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

/* ── Day nav ── */
.day-nav { background: white; border-bottom: 1px solid #f1f5f9; }
.day-nav-inner {
  max-width: 680px; margin: 0 auto;
  display: flex; padding: 6px 10px; gap: 3px; overflow-x: auto;
}
.day-btn {
  flex: 1; min-width: 40px; min-height: 48px;
  padding: 7px 3px;
  border: none; background: transparent; border-radius: 10px;
  cursor: pointer;
  font-size: 0.8rem; font-weight: 600; color: #94a3b8;
  transition: all .2s;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  font-family: inherit;
}
.day-btn:hover { background: #f8fafc; color: #475569; }
.day-btn.active { background: #0f172a; color: white; }
.day-btn.today .day-short { color: #16a34a; }
.day-btn.active.today .day-short { color: #4ade80; }
.day-dot { width: 5px; height: 5px; border-radius: 50%; opacity: .7; }
.day-btn.active .day-dot { opacity: 1; filter: brightness(1.4); }

/* ── Main ── */
.main { max-width: 680px; margin: 0 auto; padding: 16px 14px 48px; }

/* ── Day header ── */
.day-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.day-header-left { display: flex; align-items: center; gap: 10px; }
.day-name { font-size: 1.3rem; font-weight: 700; color: #0f172a; }
.today-badge {
  background: #dcfce7; color: #15803d;
  font-size: 0.7rem; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
}
.exercise-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.78rem; font-weight: 600;
  padding: 5px 12px; border-radius: 20px;
}

/* ── Utility ── */
.thin-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.thin-bar-fill { height: 100%; border-radius: 3px; transition: width .35s ease; }
.thin-bar-fill.green { background: linear-gradient(90deg, #16a34a, #4ade80); }
.thin-bar-fill.done { background: linear-gradient(90deg, #16a34a, #4ade80); }
.thin-bar-fill.red-green { background: linear-gradient(90deg, #f87171, #16a34a); }

.icon-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid #e2e8f0; background: white;
  color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.icon-btn:hover { background: #f8fafc; color: #475569; }
.icon-btn.sm { width: 26px; height: 26px; border-radius: 6px; }

.ghost-btn {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.78rem; font-weight: 600;
  color: #94a3b8; border: 1px solid #e2e8f0;
  background: white; border-radius: 20px;
  padding: 5px 12px; cursor: pointer;
  transition: all .2s; font-family: inherit;
}
.ghost-btn:hover { color: #475569; border-color: #cbd5e1; }
.ghost-btn.red:hover { color: #ef4444; border-color: #fca5a5; }

.section-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
.section-sub { font-weight: 500; color: #94a3b8; font-size: 0.82rem; margin-left: 6px; }
.mt { margin-top: 24px; }

/* ── Water card ── */
.water-card {
  background: white; border-radius: 16px;
  padding: 14px 16px; margin-bottom: 12px;
  border: 1px solid #e0f2fe;
  box-shadow: 0 1px 8px rgba(14,165,233,.07);
}
.water-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.water-title { display: flex; align-items: center; gap: 10px; }
.water-icon-wrap { width: 32px; height: 32px; background: #e0f2fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0284c7; }
.water-ml { font-size: 1.15rem; font-weight: 700; color: #0369a1; }
.water-of { font-size: 0.82rem; color: #94a3b8; }
.water-cups-badge { font-size: 0.75rem; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 2px 9px; border-radius: 20px; }
.water-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.water-bar-row .thin-bar { flex: 1; }
.thin-bar-fill { background: linear-gradient(90deg, #0284c7, #38bdf8); }
.bar-pct { font-size: 0.75rem; font-weight: 700; color: #0284c7; min-width: 32px; text-align: right; }
.glass-row { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
.glass-btn {
  width: 34px; height: 34px; border: none; background: #f1f5f9;
  border-radius: 8px; cursor: pointer; color: #cbd5e1;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; min-height: 34px;
}
.glass-btn.filled { background: #e0f2fe; color: #0284c7; }
.glass-btn:hover { transform: scale(1.1); }
.water-btns { display: flex; gap: 6px; margin-bottom: 8px; }
.water-add {
  flex: 1; padding: 7px 4px;
  border: 1px solid #bae6fd; background: white;
  color: #0369a1; font-size: 0.8rem; font-weight: 600;
  border-radius: 20px; cursor: pointer; transition: all .2s;
  font-family: inherit;
}
.water-add:hover:not(:disabled) { background: #e0f2fe; }
.water-add.minus { border-color: #e2e8f0; color: #94a3b8; }
.water-add:disabled { opacity: .35; cursor: default; }
.water-hint { font-size: 0.72rem; color: #94a3b8; text-align: center; margin: 0; }

/* ── Progress card ── */
.progress-card { background: white; border-radius: 14px; padding: 12px 14px; margin-bottom: 14px; border: 1px solid #f1f5f9; }
.progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.progress-label { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; color: #475569; }
.progress-label svg { color: #f97316; }
.progress-meals { font-size: 0.78rem; color: #94a3b8; font-weight: 500; }

/* ── Meal cards ── */
.meals { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }

.meal-card {
  background: white; border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 6px rgba(0,0,0,.04);
  overflow: hidden;
  transition: border-color .2s;
}
.meal-card.eaten { border-color: #86efac; background: #f0fdf4; }

.meal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px;
  background: #f8fafc; border-bottom: 1px solid #f1f5f9;
}
.meal-card.eaten .meal-head { background: #dcfce7; border-bottom-color: #bbf7d0; }
.meal-meta { display: flex; align-items: center; gap: 10px; }
.meal-type-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: white; border: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  color: #64748b;
}
.meal-type { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.meal-time { font-size: 0.73rem; color: #94a3b8; }
.meal-head-right { display: flex; align-items: center; gap: 8px; }
.water-time-hint {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.7rem; color: #0284c7;
  background: #e0f2fe; padding: 2px 8px; border-radius: 10px;
  white-space: nowrap;
}

.check-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: 2px solid #cbd5e1; background: white;
  cursor: pointer; transition: all .2s;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.check-btn:hover { border-color: #16a34a; }
.check-btn.checked { background: #16a34a; border-color: #16a34a; }
.check-empty { display: none; }

.meal-body { padding: 12px 14px; }
.meal-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.meal-desc { font-size: 0.82rem; color: #64748b; line-height: 1.5; margin-bottom: 10px; }
.meal-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.cal-badge { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 3px 10px; border-radius: 20px; }
.cal-badge svg { color: #f97316; }
.tags { display: flex; gap: 5px; flex-wrap: wrap; }
.tag { font-size: 0.7rem; background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
.tag.tag-bile { background: #fefce8; color: #854d0e; }

/* ── Week grid ── */
.week-card { background: white; border-radius: 16px; padding: 14px; border: 1px solid #f1f5f9; }
.week-title { font-size: 0.82rem; font-weight: 700; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .04em; }
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.week-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: 7px 2px; border-radius: 10px; transition: background .2s; min-height: 52px; justify-content: center; }
.week-cell:hover { background: #f8fafc; }
.week-cell.active { background: #0f172a; }
.week-cell.today .week-lbl { color: #16a34a; }
.week-cell.active .week-lbl { color: white; }
.week-lbl { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
.week-ex-icon { opacity: .7; }
.week-cell.active .week-ex-icon { opacity: 1; filter: brightness(2); }
.week-dots { display: flex; gap: 3px; }
.week-dot { width: 5px; height: 5px; border-radius: 50%; background: #e2e8f0; transition: background .3s; }
.week-dot.filled { background: #16a34a; }

/* ── Workout tab ── */
.workout-week { display: flex; flex-direction: column; gap: 7px; }
.workout-row {
  background: white; border-radius: 12px; padding: 11px 14px;
  display: flex; align-items: center; gap: 12px;
  border-left: 3px solid;
  border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
}
.workout-day-lbl { font-size: 0.82rem; font-weight: 700; color: #94a3b8; min-width: 24px; }
.workout-ex-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.workout-type { font-size: 0.88rem; font-weight: 700; color: #1e293b; }
.workout-dur { font-size: 0.75rem; color: #94a3b8; }

.strength-list { display: flex; flex-direction: column; gap: 1px; background: #f1f5f9; border-radius: 12px; overflow: hidden; }
.strength-row { background: white; padding: 11px 14px; display: flex; align-items: center; gap: 12px; }
.strength-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }
.strength-name { flex: 1; font-size: 0.88rem; font-weight: 600; color: #1e293b; }
.strength-sets { font-size: 0.78rem; color: #94a3b8; font-weight: 500; white-space: nowrap; }

.phases { display: flex; flex-direction: column; gap: 7px; }
.phase-row { background: white; border-radius: 12px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; font-size: 0.87rem; color: #475569; border: 1px solid #f1f5f9; }
.phase-num { width: 24px; height: 24px; border-radius: 50%; background: #0f172a; color: white; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* ── Shop tab ── */
.shop-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.shop-sub { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
.shop-cat { margin-bottom: 16px; }
.shop-cat-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding: 0 2px; }
.shop-cat-name { font-size: 0.85rem; font-weight: 700; color: #475569; }
.shop-cat-cnt { font-size: 0.73rem; color: #94a3b8; }
.shop-items { display: flex; flex-direction: column; gap: 4px; }
.shop-item {
  background: white; border-radius: 11px; padding: 12px 12px;
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; transition: all .15s;
  border: 1px solid #f1f5f9; min-height: 48px;
}
.shop-item:hover { border-color: #d1fae5; }
.shop-item.bought { background: #f0fdf4; border-color: #bbf7d0; }
.shop-check {
  width: 22px; height: 22px; border-radius: 6px;
  border: 2px solid #cbd5e1; background: white;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .2s; color: white;
}
.shop-check.checked { background: #16a34a; border-color: #16a34a; }
.shop-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.shop-name { font-size: 0.87rem; font-weight: 600; color: #1e293b; }
.shop-item.bought .shop-name { text-decoration: line-through; color: #94a3b8; }
.shop-note { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shop-amount { font-size: 0.78rem; font-weight: 700; color: #16a34a; background: #f0fdf4; padding: 3px 9px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.shop-item.bought .shop-amount { color: #94a3b8; background: #f8fafc; }

/* ── Weight tab ── */
.weight-input-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid #f1f5f9; }
.field-label { font-size: 0.78rem; font-weight: 600; color: #64748b; display: block; margin-bottom: 8px; }
.weight-field-row { display: flex; gap: 10px; }
.weight-field {
  flex: 1; padding: 10px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  font-size: 1.1rem; font-weight: 700; color: #1e293b;
  outline: none; transition: border-color .2s; font-family: inherit;
}
.weight-field:focus { border-color: #3b82f6; }
.primary-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: #1e293b; color: white;
  border: none; border-radius: 12px;
  font-size: 0.88rem; font-weight: 600;
  cursor: pointer; transition: opacity .2s;
  font-family: inherit; white-space: nowrap;
}
.primary-btn:disabled { opacity: .4; cursor: default; }
.primary-btn:not(:disabled):hover { opacity: .85; }
.saved-msg { display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 0.8rem; color: #16a34a; font-weight: 600; }

.wstats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 12px; }
.wstat { background: white; border-radius: 12px; padding: 10px 8px; display: flex; flex-direction: column; align-items: center; gap: 3px; border: 1px solid #f1f5f9; }
.wstat.highlight { border-color: #93c5fd; background: #eff6ff; }
.wstat.target { border-color: #fca5a5; background: #fef2f2; }
.wstat.good { background: #f0fdf4; border-color: #86efac; }
.wstat.bad { background: #fef2f2; border-color: #fca5a5; }
.wstat-val { font-size: 1rem; font-weight: 700; color: #1e293b; }
.wstat.good .wstat-val { color: #16a34a; }
.wstat.bad .wstat-val { color: #ef4444; }
.wstat-lbl { font-size: 0.65rem; color: #94a3b8; }

.wgoal-card { background: white; border-radius: 14px; padding: 14px 16px; margin-bottom: 12px; border: 1px solid #f1f5f9; }
.wgoal-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: #475569; }
.wgoal-pct { font-weight: 700; color: #1e293b; }
.wgoal-pace { font-size: 0.73rem; color: #94a3b8; margin: 0; }

.chart-card { background: white; border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; border: 1px solid #f1f5f9; overflow: hidden; }
.chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.chart-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
.chart-range { font-size: 0.73rem; color: #94a3b8; }
.weight-chart { width: 100%; height: 160px; display: block; overflow: visible; }

.empty-chart { background: white; border-radius: 16px; padding: 32px 16px; text-align: center; color: #94a3b8; margin-bottom: 12px; border: 1px solid #f1f5f9; }
.empty-chart svg { margin: 0 auto 10px; display: block; opacity: .4; }
.empty-chart p { font-size: 0.85rem; }

.wh-card { background: white; border-radius: 16px; padding: 14px; border: 1px solid #f1f5f9; }
.wh-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.wh-list { display: flex; flex-direction: column; gap: 5px; }
.wh-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #f8fafc; border-radius: 9px; font-size: 0.85rem; }
.wh-date { color: #94a3b8; min-width: 36px; }
.wh-val { font-weight: 700; color: #1e293b; flex: 1; }
.wh-delta { font-size: 0.75rem; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.delta-good { background: #dcfce7; color: #16a34a; }
.delta-bad { background: #fee2e2; color: #ef4444; }

/* ── Tips tab ── */
.tips-list { display: flex; flex-direction: column; gap: 6px; }
.tip-row { background: white; border-radius: 11px; padding: 11px 14px; display: flex; align-items: flex-start; gap: 10px; font-size: 0.86rem; color: #475569; border: 1px solid #f1f5f9; }
.tip-icon { width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tip-icon.green { background: #dcfce7; color: #16a34a; }
.bile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.bile-item { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 9px 12px; font-size: 0.82rem; color: #854d0e; font-weight: 500; display: flex; align-items: center; gap: 7px; }
.bile-item svg { flex-shrink: 0; color: #ca8a04; }
.warning-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 14px; display: flex; gap: 12px; margin-top: 20px; font-size: 0.85rem; color: #991b1b; line-height: 1.5; }
.warn-icon { color: #ef4444; flex-shrink: 0; padding-top: 1px; }

/* ── Responsive ── */

/* Base mobile (< 480px) */
@media (max-width: 480px) {

  /* Header */
  .header-inner { flex-direction: column; align-items: flex-start; gap: 10px; }
  .stats-row { width: 100%; justify-content: stretch; }
  .stat-chip { flex: 1; }
  .header-brand h1 { font-size: 1.1rem; }

  /* Tabs — icon + short text always visible */
  .tabs-inner { padding: 0 4px; gap: 0; }
  .tab-btn { padding: 10px 2px; font-size: 0.7rem; gap: 3px; }
  .tab-btn span { display: inline; font-size: 0.68rem; }

  /* Day nav */
  .day-nav-inner { padding: 5px 8px; gap: 2px; }
  .day-btn { min-width: 36px; min-height: 44px; padding: 6px 2px; font-size: 0.76rem; }

  /* Main padding */
  .main { padding: 12px 10px 56px; }

  /* Day header */
  .day-header { flex-direction: column; align-items: flex-start; gap: 6px; }
  .exercise-badge { font-size: 0.76rem; padding: 5px 10px; }

  /* Water card */
  .water-card { padding: 12px; }
  .glass-btn { width: 28px; height: 28px; }
  .water-add { padding: 9px 4px; font-size: 0.78rem; min-height: 40px; }

  /* Meal cards */
  .meal-head { padding: 9px 11px; flex-wrap: wrap; gap: 6px; }
  .meal-head-right { width: 100%; justify-content: space-between; }
  .water-time-hint { flex: 1; }
  .check-btn { width: 28px; height: 28px; }
  .meal-body { padding: 10px 11px; }

  /* Week grid */
  .week-cell { padding: 5px 1px; min-height: 44px; }
  .week-lbl { font-size: 0.68rem; }

  /* Workout */
  .workout-row { padding: 10px 12px; }
  .strength-row { padding: 10px 12px; }

  /* Shop */
  .shop-item { padding: 10px 10px; min-height: 44px; }
  .shop-name { font-size: 0.84rem; }

  /* Weight */
  .wstats { grid-template-columns: repeat(2, 1fr); }
  .weight-field-row { flex-direction: column; gap: 8px; }
  .primary-btn { width: 100%; justify-content: center; padding: 12px; min-height: 44px; }
  .weight-field { font-size: 1rem; min-height: 44px; }

  /* Tips */
  .bile-grid { grid-template-columns: 1fr; }
  .tip-row { padding: 10px 12px; }
}

/* Mid mobile (480–640px) */
@media (min-width: 480px) and (max-width: 640px) {
  .tab-btn span { display: inline; font-size: 0.75rem; }
  .main { padding: 14px 14px 56px; }
}

/* Touch targets — always at least 44px tall for interactive elements */
.tab-btn, .day-btn, .check-btn, .glass-btn, .water-add,
.shop-item, .week-cell, .icon-btn, .ghost-btn, .primary-btn {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Prevent text scaling on iOS */
html { -webkit-text-size-adjust: 100%; }

/* Smooth scroll */
.day-nav-inner { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.day-nav-inner::-webkit-scrollbar { display: none; }
</style>
