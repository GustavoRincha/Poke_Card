<template>
  <div class="active-filters-bar" v-if="activeFilterList.length > 0">
    <div class="filters-label">
      <span>FILTROS ATIVOS:</span>
    </div>

    <div class="chips-list">
      <button 
        v-for="chip in activeFilterList" 
        :key="chip.id" 
        class="filter-pill"
        @click="$emit('remove-filter', chip.key, chip.val)"
        :title="'Remover filtro: ' + chip.label"
      >
        <span class="pill-text">{{ chip.label }}</span>
        <span class="pill-close">×</span>
      </button>

      <button 
        type="button" 
        class="btn-clear-all"
        @click="$emit('clear-all')"
      >
        Limpar Todos
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true
  }
});

defineEmits(['remove-filter', 'clear-all']);

const activeFilterList = computed(() => {
  const list = [];

  // 1. Tipo Elemental
  if (props.filters.type) {
    list.push({
      id: 'type',
      key: 'type',
      val: props.filters.type,
      label: `Tipo: ${props.filters.type}`
    });
  }

  // 2. Expansões
  if (props.filters.expansions && props.filters.expansions.length > 0) {
    const names = props.filters.expansions.join(' + ');
    list.push({
      id: 'expansions',
      key: 'expansions',
      val: null,
      label: `Coleção: ${names}`
    });
  }

  // 3. Formato
  if (props.filters.formats && props.filters.formats.length > 0) {
    const formatLabels = props.filters.formats.join(' & ');
    list.push({
      id: 'formats',
      key: 'formats',
      val: null,
      label: `Formato: ${formatLabels}`
    });
  }

  // 4. Raridade
  if (props.filters.rarity) {
    list.push({
      id: 'rarity',
      key: 'rarity',
      val: props.filters.rarity,
      label: `Raridade: ${props.filters.rarity}`
    });
  }

  // 5. Preço Max
  if (props.filters.maxPrice && props.filters.maxPrice < 850) {
    list.push({
      id: 'price',
      key: 'maxPrice',
      val: props.filters.maxPrice,
      label: `Preço: até R$ ${props.filters.maxPrice}`
    });
  }

  // 6. Status da Coleção
  if (props.filters.status && props.filters.status.length > 0) {
    list.push({
      id: 'status',
      key: 'status',
      val: null,
      label: `Status: ${props.filters.status.join(', ')}`
    });
  }

  // 7. Busca por nome
  if (props.filters.query) {
    list.push({
      id: 'query',
      key: 'query',
      val: props.filters.query,
      label: `Busca: "${props.filters.query}"`
    });
  }

  return list;
});
</script>

<style scoped>
.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0 20px 0;
  flex-wrap: wrap;
}

.filters-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chips-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.filter-pill:hover {
  background: var(--surface-elevated);
  border-color: #38506d;
}

.pill-close {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1;
}

.filter-pill:hover .pill-close {
  color: var(--accent-red);
}

.btn-clear-all {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.18s ease;
}

.btn-clear-all:hover {
  color: #ffffff;
}
</style>
