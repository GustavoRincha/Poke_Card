<template>
  <div class="bottom-summary-bar card-surface">
    <!-- ESQUERDA: Valor Estimado das Cartas Exibidas -->
    <div class="summary-left">
      <div class="coin-icon-circle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
          <line x1="12" y1="6" x2="12" y2="8"></line>
          <line x1="12" y1="16" x2="12" y2="18"></line>
        </svg>
      </div>
      <div class="summary-content">
        <span class="summary-label">VALOR ESTIMADO DAS CARTAS EXIBIDAS</span>
        <span class="summary-value-amber mono-num">
          R$ {{ formatNumber(estimatedTotal) }} BRL
        </span>
      </div>
    </div>

    <!-- CENTRO: Paginação Numérica Estilo Bloomberg -->
    <div class="pagination-center">
      <button 
        type="button" 
        class="page-nav-btn" 
        :disabled="currentPage <= 1"
        @click="$emit('change-page', currentPage - 1)"
        title="Página Anterior"
      >
        ‹
      </button>

      <button 
        type="button" 
        class="page-num-btn" 
        :class="{ active: currentPage === 1 }"
        @click="$emit('change-page', 1)"
      >
        1
      </button>

      <button 
        type="button" 
        class="page-num-btn" 
        :class="{ active: currentPage === 2 }"
        @click="$emit('change-page', 2)"
      >
        2
      </button>

      <button 
        type="button" 
        class="page-num-btn" 
        :class="{ active: currentPage === 3 }"
        @click="$emit('change-page', 3)"
      >
        3
      </button>

      <span class="page-ellipsis">...</span>

      <button 
        type="button" 
        class="page-num-btn" 
        :class="{ active: currentPage === totalPages }"
        @click="$emit('change-page', totalPages)"
      >
        {{ totalPages }}
      </button>

      <button 
        type="button" 
        class="page-nav-btn" 
        :disabled="currentPage >= totalPages"
        @click="$emit('change-page', currentPage + 1)"
        title="Próxima Página"
      >
        ›
      </button>
    </div>

    <!-- DIREITA: Seletor Exibir 24 | 48 | 96 -->
    <div class="page-size-right">
      <span class="size-label">Exibir:</span>
      <div class="size-options">
        <button 
          v-for="size in [24, 48, 96]" 
          :key="size"
          type="button"
          class="size-btn mono-num"
          :class="{ active: pageSize === size }"
          @click="$emit('change-size', size)"
        >
          {{ size }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  estimatedTotal: { type: Number, default: 2450.80 },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 62 },
  pageSize: { type: Number, default: 24 }
});

defineEmits(['change-page', 'change-size']);

function formatNumber(val) {
  if (!val) return '2.450,80';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.bottom-summary-bar {
  margin-top: 24px;
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* ESQUERDA */
.summary-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.coin-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-value-amber {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--accent-amber);
  line-height: 1.1;
}

/* CENTRO */
.pagination-center {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-nav-btn,
.page-num-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.page-nav-btn:hover:not(:disabled),
.page-num-btn:hover {
  background: #27374d;
  color: #ffffff;
  border-color: #38506d;
}

.page-num-btn.active {
  background: var(--accent-blue);
  color: #ffffff;
  border-color: var(--accent-blue);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-ellipsis {
  color: var(--text-muted);
  padding: 0 4px;
  font-size: 0.85rem;
}

/* DIREITA */
.page-size-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.size-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.size-options {
  display: flex;
  align-items: center;
  gap: 4px;
}

.size-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.size-btn:hover {
  color: #ffffff;
}

.size-btn.active {
  background: var(--surface-elevated);
  color: #ffffff;
  border: 1px solid var(--border-subtle);
}

@media (max-width: 860px) {
  .bottom-summary-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .pagination-center {
    width: 100%;
    justify-content: center;
  }
  .page-size-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
