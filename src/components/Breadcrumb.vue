<template>
  <div class="context-bar">
    <div class="context-inner">
      <!-- Breadcrumb Hierárquico -->
      <nav class="breadcrumb-nav" aria-label="Navegação Estrutural">
        <span class="crumb-item" @click="$emit('reset-crumb', 'all')">Catálogo Geral</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-item" @click="$emit('reset-crumb', 'pokemon')">Pokémon</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-item" :class="{ current: isTypeActive }">
          {{ activeTypeName ? `Tipo ${activeTypeName} & Outros` : 'Tipo Grama & Outros' }}
        </span>
        <span class="crumb-sep">/</span>
        <span class="crumb-item crumb-active">
          {{ activeExpansionName || 'Todas as Expansões' }}
        </span>
      </nav>

      <!-- Market Ticker TCG BR -->
      <div class="market-ticker" @click="$emit('open-market-report')" role="button" tabindex="0" title="Ver Relatório de Mercado TCG Completo">
        <div class="ticker-update">
          <span class="ticker-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </span>
          <span class="ticker-text">Mercado TCG BR:</span>
          <span class="ticker-time">Atualizado há 12 min</span>
        </div>
        
        <span class="ticker-dot">•</span>

        <div class="ticker-index">
          <span class="index-label">Índice Geral:</span>
          <span class="index-value positive mono-num">+2.4% hoje</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeTypeName: { type: String, default: 'Grama' },
  activeExpansionName: { type: String, default: 'Todas as Expansões' },
  isTypeActive: { type: Boolean, default: true }
});

defineEmits(['reset-crumb', 'open-market-report']);
</script>

<style scoped>
.context-bar {
  background: #090d14;
  border-bottom: 1px solid var(--border-subtle);
  padding: 8px 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.context-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.crumb-item {
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease;
}

.crumb-item:hover {
  color: var(--text-main);
  text-decoration: underline;
}

.crumb-sep {
  color: var(--text-muted);
  user-select: none;
}

.crumb-active {
  color: var(--text-main);
  font-weight: 600;
  cursor: default;
}

.crumb-active:hover {
  text-decoration: none;
}

/* Market Ticker */
.market-ticker {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(19, 27, 38, 0.6);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(36, 52, 71, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.market-ticker:hover {
  background: var(--surface-card);
  border-color: #38506d;
}

.ticker-update {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ticker-icon {
  display: flex;
  align-items: center;
}

.ticker-text {
  color: var(--accent-amber);
  font-weight: 600;
  font-size: 0.76rem;
}

.ticker-time {
  color: var(--text-secondary);
  font-size: 0.76rem;
}

.ticker-dot {
  color: var(--text-muted);
}

.ticker-index {
  display: flex;
  align-items: center;
  gap: 4px;
}

.index-label {
  color: var(--text-secondary);
  font-size: 0.76rem;
}

.index-value.positive {
  color: var(--accent-green);
  font-weight: 700;
  font-size: 0.76rem;
}

@media (max-width: 768px) {
  .context-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
