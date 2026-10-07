<template>
  <div class="market-insight-banner">
    <div class="banner-left">
      <div class="insight-icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      </div>

      <div class="insight-content">
        <h3 class="insight-title">
          Tendência da Semana: Pokémon Tipo Grama em Alta
        </h3>
        <p class="insight-desc">
          Snivy (Promo & Holo) e Meowscarada ex registraram aumento de liquidez de <strong>+18.4%</strong>.
        </p>
      </div>
    </div>

    <div class="banner-right">
      <button 
        type="button" 
        class="btn-report"
        @click="$emit('open-report')"
      >
        <span>Ver Relatório TCG</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['open-report']);
</script>

<style scoped>
.market-insight-banner {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: border-color 0.2s ease;
}

.market-insight-banner:hover {
  border-color: #38506d;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.insight-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.insight-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.insight-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.insight-desc strong {
  color: var(--accent-green);
  font-weight: 700;
}

.btn-report {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 9px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-report:hover {
  background: #253449;
  border-color: var(--accent-amber);
  color: #ffffff;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .market-insight-banner {
    flex-direction: column;
    align-items: flex-start;
  }
  .banner-right {
    width: 100%;
  }
  .btn-report {
    width: 100%;
    justify-content: center;
  }
}
</style>
