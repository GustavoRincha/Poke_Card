<template>
  <aside class="sidebar-filter-panel card-surface">
    <!-- 1. Busca Rápida de Carta -->
    <div class="filter-group group-search">
      <label class="filter-heading" for="quick-search-input">Busca Rápida de Carta</label>
      <div class="search-input-box">
        <span class="search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input 
          id="quick-search-input"
          ref="searchInputRef"
          type="text" 
          :value="filters.query"
          @input="$emit('update-filter', 'query', $event.target.value)"
          placeholder="Ex: Snivy, Charizard..." 
          class="sidebar-input"
        />
        <span class="kbd-badge" title="Pressione Ctrl+K para buscar">Ctrl+K</span>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 2. Tipo Elemental -->
    <div class="filter-group group-types">
      <div class="heading-row">
        <span class="filter-heading">Tipo Elemental</span>
        <button 
          type="button" 
          class="link-action"
          :class="{ active: !filters.type }"
          @click="$emit('update-filter', 'type', '')"
        >
          Todos
        </button>
      </div>

      <div class="element-grid-10">
        <button 
          v-for="elem in elementTypes" 
          :key="elem.code"
          type="button"
          class="elem-btn"
          :class="{ 'is-selected': filters.type === elem.name || (elem.fullName && filters.type === elem.fullName) }"
          :style="{ '--elem-color': elem.color }"
          @click="toggleElementType(elem.name, elem.fullName)"
          :title="elem.fullName || elem.name"
        >
          <span class="elem-glyph" :style="{ color: elem.color }">{{ elem.icon }}</span>
          <span class="elem-name">{{ elem.name }}</span>
        </button>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 3. Status na Coleção -->
    <div class="filter-group group-status">
      <span class="filter-heading">Status na Coleção</span>
      <div class="checkbox-stack">
        <label class="custom-checkbox-row">
          <input 
            type="checkbox" 
            :checked="filters.status.includes('owned')" 
            @change="toggleStatus('owned')"
          />
          <span class="checkbox-indicator"></span>
          <span class="row-label">Já Possuo (Na Pasta)</span>
          <span class="count-tag mono-num">{{ ownedCount }}</span>
        </label>

        <label class="custom-checkbox-row">
          <input 
            type="checkbox" 
            :checked="filters.status.includes('wishlist')" 
            @change="toggleStatus('wishlist')"
          />
          <span class="checkbox-indicator"></span>
          <span class="row-label">Lista de Desejos</span>
          <span class="count-tag mono-num">{{ wishlistCount }}</span>
        </label>

        <label class="custom-checkbox-row">
          <input 
            type="checkbox" 
            :checked="filters.status.includes('trade')" 
            @change="toggleStatus('trade')"
          />
          <span class="checkbox-indicator"></span>
          <span class="row-label">Disponível p/ Troca</span>
          <span class="count-tag mono-num">19</span>
        </label>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 4. Expansão / Coleção -->
    <div class="filter-group group-expansion">
      <span class="filter-heading">Expansão / Coleção</span>
      <div class="expansions-scroll-box">
        <label 
          v-for="exp in expansionsList" 
          :key="exp.code"
          class="custom-checkbox-row exp-row"
        >
          <input 
            type="checkbox" 
            :checked="filters.expansions.includes(exp.name)" 
            @change="toggleExpansion(exp.name)"
          />
          <span class="checkbox-indicator"></span>
          <span class="row-label">{{ exp.name }}</span>
          <span class="set-code-badge">{{ exp.code }}</span>
        </label>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 5. Raridade -->
    <div class="filter-group group-rarity">
      <span class="filter-heading">Raridade</span>
      <div class="rarity-chips-wrap">
        <button 
          v-for="rarity in raritiesList" 
          :key="rarity"
          type="button"
          class="rarity-chip"
          :class="{ active: filters.rarity === rarity }"
          @click="toggleRarity(rarity)"
        >
          {{ rarity }}
        </button>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 6. Faixa de Preço (BRL) -->
    <div class="filter-group group-price">
      <div class="heading-row">
        <span class="filter-heading">Faixa de Preço (BRL)</span>
        <span class="price-range-label mono-num">R$ 1 — R$ {{ filters.maxPrice }}</span>
      </div>

      <div class="slider-container">
        <input 
          type="range" 
          min="10" 
          max="1500" 
          step="10"
          :value="filters.maxPrice"
          @input="$emit('update-filter', 'maxPrice', Number($event.target.value))"
          class="range-slider"
        />
      </div>

      <div class="price-extremes">
        <span>Min: R$ 1,00</span>
        <span>Max: R$ {{ filters.maxPrice }},00</span>
      </div>
    </div>

    <div class="divider-line"></div>

    <!-- 7. Formato Competitivo -->
    <div class="filter-group group-format">
      <span class="filter-heading">Formato Competitivo</span>
      <div class="format-grid-2x2">
        <button 
          v-for="fmt in competitiveFormats" 
          :key="fmt.code"
          type="button"
          class="format-pill-btn"
          :class="{ active: filters.formats.includes(fmt.name) }"
          @click="toggleFormat(fmt.name)"
        >
          {{ fmt.name }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ELEMENTAL_TYPES, EXPANSIONS_LIST, RARITIES_LIST, COMPETITIVE_FORMATS } from '../lib/mockCards.js';

const props = defineProps({
  filters: { type: Object, required: true },
  ownedCount: { type: Number, default: 342 },
  wishlistCount: { type: Number, default: 68 }
});

const emit = defineEmits(['update-filter']);

const elementTypes = ELEMENTAL_TYPES;
const expansionsList = EXPANSIONS_LIST;
const raritiesList = RARITIES_LIST;
const competitiveFormats = COMPETITIVE_FORMATS;
const searchInputRef = ref(null);

function toggleElementType(typeName, fullName) {
  const target = fullName || typeName;
  if (props.filters.type === target || props.filters.type === typeName) {
    emit('update-filter', 'type', '');
  } else {
    emit('update-filter', 'type', target);
  }
}

function toggleStatus(statusKey) {
  const current = [...props.filters.status];
  const idx = current.indexOf(statusKey);
  if (idx > -1) {
    current.splice(idx, 1);
  } else {
    current.push(statusKey);
  }
  emit('update-filter', 'status', current);
}

function toggleExpansion(name) {
  const current = [...props.filters.expansions];
  const idx = current.indexOf(name);
  if (idx > -1) {
    current.splice(idx, 1);
  } else {
    current.push(name);
  }
  emit('update-filter', 'expansions', current);
}

function toggleRarity(rarity) {
  if (props.filters.rarity === rarity) {
    emit('update-filter', 'rarity', '');
  } else {
    emit('update-filter', 'rarity', rarity);
  }
}

function toggleFormat(formatName) {
  const current = [...props.filters.formats];
  const idx = current.indexOf(formatName);
  if (idx > -1) {
    current.splice(idx, 1);
  } else {
    current.push(formatName);
  }
  emit('update-filter', 'formats', current);
}

// Suporte ao atalho Ctrl+K
function handleKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

defineExpose({
  focusSearch: () => {
    if (searchInputRef.value) searchInputRef.value.focus();
  }
});
</script>

<style scoped>
.sidebar-filter-panel {
  position: sticky;
  top: 96px;
  padding: 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.filter-heading {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
  display: block;
  margin-bottom: 8px;
}

.heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.heading-row .filter-heading {
  margin-bottom: 0;
}

.link-action {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}

.link-action:hover,
.link-action.active {
  color: var(--accent-blue);
}

.divider-line {
  height: 1px;
  background: rgba(36, 52, 71, 0.7);
  width: 100%;
}

/* 1. Busca */
.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
  display: flex;
}

.sidebar-input {
  width: 100%;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 60px 10px 34px;
  color: var(--text-main);
  font-size: 0.82rem;
  outline: none;
  transition: all 0.2s ease;
}

.sidebar-input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.kbd-badge {
  position: absolute;
  right: 8px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: 4px;
  user-select: none;
}

/* 2. Tipo Elemental 2x5 */
.element-grid-10 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.elem-btn {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 4px 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.elem-btn:hover {
  background: var(--surface-elevated);
  border-color: #38506d;
}

.elem-btn.is-selected {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--elem-color);
  box-shadow: 0 0 10px -2px var(--elem-color);
}

.elem-glyph {
  font-size: 1rem;
  line-height: 1;
}

.elem-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.elem-btn.is-selected .elem-name {
  color: #ffffff;
}

/* 3. Status e 4. Expansões */
.checkbox-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 3px 0;
  transition: color 0.15s ease;
}

.custom-checkbox-row:hover {
  color: var(--text-main);
}

.custom-checkbox-row input {
  display: none;
}

.checkbox-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--border-subtle);
  background: var(--surface-input);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.custom-checkbox-row input:checked + .checkbox-indicator {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.custom-checkbox-row input:checked + .checkbox-indicator::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.row-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count-tag {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.expansions-scroll-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 170px;
  overflow-y: auto;
  padding-right: 4px;
}

.set-code-badge {
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--surface-input);
  padding: 1px 5px;
  border-radius: 3px;
}

/* 5. Raridade Chips */
.rarity-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rarity-chip {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
}

.rarity-chip:hover {
  background: var(--surface-elevated);
  color: var(--text-main);
}

.rarity-chip.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-blue);
  color: #93c5fd;
  font-weight: 600;
}

/* 6. Slider de Preço */
.price-range-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-amber);
}

.slider-container {
  padding: 6px 0;
}

.range-slider {
  width: 100%;
  height: 4px;
  background: #243447;
  border-radius: 2px;
  appearance: none;
  outline: none;
  cursor: pointer;
}

.range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-blue);
  border: 2px solid #ffffff;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.price-extremes {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 7. Formato Competitivo 2x2 */
.format-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.format-pill-btn {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 6px;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.format-pill-btn:hover {
  background: var(--surface-elevated);
  color: var(--text-main);
}

.format-pill-btn.active {
  background: var(--surface-elevated);
  border-color: var(--accent-blue);
  color: #ffffff;
  font-weight: 600;
}
</style>
