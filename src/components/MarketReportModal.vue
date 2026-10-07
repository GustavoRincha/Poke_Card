<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box report-modal-box">
      <button type="button" class="close-modal-btn" @click="$emit('close')">×</button>

      <div class="report-header">
        <div class="report-icon-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div>
          <span class="report-category">RELATÓRIO FINANCEIRO & TENDÊNCIAS TCG</span>
          <h2 class="report-title">Tendência da Semana: Pokémon Tipo Grama em Alta (+18.4%)</h2>
          <span class="report-date">Publicado hoje • Atualização em tempo real de 1.482 cartas monitoradas</span>
        </div>
      </div>

      <!-- INSIGHTS DE DESTAQUE -->
      <div class="report-highlights-grid">
        <div class="highlight-card">
          <span class="h-label">LIQUIDEZ SEMANAL</span>
          <span class="h-value text-green mono-num">+18.4%</span>
          <p>Volume recorde de trocas e compras para cartas de suporte e atacantes do tipo Grama.</p>
        </div>

        <div class="highlight-card">
          <span class="h-label">ÍNDICE DE CONFIANÇA</span>
          <span class="h-value text-amber mono-num">92 / 100</span>
          <p>Mercado comprador aquecido com retenção elevada de cartas raras e secretas.</p>
        </div>

        <div class="highlight-card">
          <span class="h-label">CARTAS LÍDERES</span>
          <span class="h-value text-blue">Snivy & Meowscarada</span>
          <p>Alta valorização de singles após novos resultados em torneios regionais.</p>
        </div>
      </div>

      <!-- TABELA DE TOP MAIORES ALTAS DA SEMANA -->
      <div class="gainers-table-section card-surface">
        <h4>Maiores Altas Registradas na Semana</h4>
        <div class="gainers-list">
          <div class="gainer-row">
            <span class="gainer-rank">#1</span>
            <span class="gainer-name">Greninja ex (Twilight Masquerade)</span>
            <span class="gainer-price mono-num">R$ 820,00</span>
            <span class="gainer-pct text-green mono-num">+22.4%</span>
          </div>

          <div class="gainer-row">
            <span class="gainer-rank">#2</span>
            <span class="gainer-name">Umbreon VMAX (Evolving Skies Alt Art)</span>
            <span class="gainer-price mono-num">R$ 3.850,00</span>
            <span class="gainer-pct text-green mono-num">+18.7%</span>
          </div>

          <div class="gainer-row">
            <span class="gainer-rank">#3</span>
            <span class="gainer-name">Rayquaza VMAX (Evolving Skies Alt Art)</span>
            <span class="gainer-price mono-num">R$ 1.380,00</span>
            <span class="gainer-pct text-green mono-num">+15.2%</span>
          </div>

          <div class="gainer-row">
            <span class="gainer-rank">#4</span>
            <span class="gainer-name">Charizard ex (Scarlet & Violet: 151)</span>
            <span class="gainer-price mono-num">R$ 640,00</span>
            <span class="gainer-pct text-green mono-num">+12.1%</span>
          </div>

          <div class="gainer-row">
            <span class="gainer-rank">#5</span>
            <span class="gainer-name">Bulbasaur (Scarlet & Violet: 151)</span>
            <span class="gainer-price mono-num">R$ 115,00</span>
            <span class="gainer-pct text-green mono-num">+8.5%</span>
          </div>
        </div>
      </div>

      <div class="report-actions">
        <button type="button" class="btn btn-primary" @click="$emit('filter-grass')">
          Filtrar Cartas do Tipo Grama no Catálogo
        </button>
        <button type="button" class="btn btn-surface" @click="$emit('close')">
          Fechar Relatório
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close', 'filter-grass']);
</script>

<style scoped>
.report-modal-box {
  padding: 30px;
  max-width: 760px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.report-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.report-category {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-amber);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.report-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.report-date {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.report-highlights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .report-highlights-grid {
    grid-template-columns: 1fr;
  }
}

.highlight-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.h-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.h-value {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
}

.text-green { color: var(--accent-green); }
.text-amber { color: var(--accent-amber); }
.text-blue { color: #38bdf8; }

.highlight-card p {
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.gainers-table-section {
  padding: 18px;
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.gainers-table-section h4 {
  font-size: 0.92rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.gainers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gainer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-card);
  border: 1px solid rgba(36, 52, 71, 0.4);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
}

.gainer-rank {
  font-weight: 700;
  color: var(--text-muted);
  width: 24px;
}

.gainer-name {
  flex: 1;
  font-weight: 600;
  color: var(--text-main);
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gainer-price {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-secondary);
  padding: 0 12px;
}

.gainer-pct {
  font-weight: 700;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
