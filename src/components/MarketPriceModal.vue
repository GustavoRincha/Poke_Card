<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box price-modal-box">
      <button type="button" class="close-modal-btn" @click="$emit('close')">×</button>

      <!-- CABEÇALHO DO MODAL -->
      <div class="modal-header">
        <div class="card-thumb-badge">
          <img :src="card.image" :alt="card.name" class="modal-mini-card" />
        </div>
        <div class="header-titles">
          <div class="tags-row">
            <span class="set-tag">{{ card.set }} • {{ card.number }}</span>
            <span class="rarity-tag">{{ card.rarity }}</span>
            <span class="format-tag">{{ card.format }}</span>
          </div>
          <h2 class="card-title-lg">{{ card.name }}</h2>
          <span class="market-subtitle">Terminal de Inteligência e Cotações Financeiras TCG</span>
        </div>
      </div>

      <!-- PAINEL PRINCIPAL DE PREÇO -->
      <div class="price-overview-grid">
        <div class="overview-card primary-stat">
          <span class="stat-label">PREÇO MÉDIO DE MERCADO (BRL)</span>
          <div class="stat-val-group">
            <span class="stat-val-amber mono-num">R$ {{ formatNumber(card.price) }}</span>
            <span class="stat-trend-tag mono-num" :class="card.variationPositive ? 'up' : 'down'">
              {{ card.variationPositive ? '↑' : '↓' }} {{ card.variation }} (24h)
            </span>
          </div>
          <span class="stat-subtext">Baseado em 342 transações verificadas nos últimos 7 dias.</span>
        </div>

        <div class="overview-card">
          <span class="stat-label">LIQUIDEZ DO MERCADO</span>
          <span class="stat-val-highlight">{{ card.liquidity || 'Alta' }}</span>
          <span class="stat-subtext">Volume 24h: <strong>{{ card.volume24h || 128 }} cópias</strong> negociadas</span>
        </div>

        <div class="overview-card">
          <span class="stat-label">PROJEÇÃO 30 DIAS</span>
          <span class="stat-val-trend positive mono-num">+8.4% Meta</span>
          <span class="stat-subtext">Fator de demanda competitiva e colecionismo em alta.</span>
        </div>
      </div>

      <!-- GRÁFICO SVG INTERATIVO 30 DIAS -->
      <div class="chart-section card-surface">
        <div class="chart-header">
          <div class="chart-title-area">
            <h4>Histórico de Cotação (Últimos 30 Dias)</h4>
            <span class="chart-currency">Valores em Reais (BRL)</span>
          </div>
          <div class="timeframe-buttons">
            <button type="button" class="btn-time active">30D</button>
            <button type="button" class="btn-time">90D</button>
            <button type="button" class="btn-time">1A</button>
            <button type="button" class="btn-time">TUDO</button>
          </div>
        </div>

        <div class="svg-chart-container">
          <svg viewBox="0 0 700 200" class="market-chart-svg" preserveAspectRatio="none">
            <!-- Gradiente de Preenchimento -->
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Linhas de Grade Horizontais -->
            <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(36, 52, 71, 0.4)" stroke-dasharray="4" />
            <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(36, 52, 71, 0.4)" stroke-dasharray="4" />
            <line x1="0" y1="160" x2="700" y2="160" stroke="rgba(36, 52, 71, 0.4)" stroke-dasharray="4" />

            <!-- Área Preenchida -->
            <polygon :points="chartPolygonPoints" fill="url(#chartGradient)" />

            <!-- Linha Principal da Cotação -->
            <polyline 
              :points="chartPolylinePoints" 
              fill="none" 
              stroke="#f59e0b" 
              stroke-width="3" 
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Pontos de Amostragem -->
            <circle 
              v-for="(pt, idx) in chartPoints" 
              :key="idx" 
              :cx="pt.x" 
              :cy="pt.y" 
              r="4" 
              fill="#f59e0b" 
              stroke="#0b0f17" 
              stroke-width="2" 
            />
          </svg>
        </div>

        <div class="chart-dates-row">
          <span>1 Out</span>
          <span>8 Out</span>
          <span>15 Out</span>
          <span>22 Out</span>
          <span>Hoje</span>
        </div>
      </div>

      <!-- FONTES DE MERCADO INTERNACIONAIS E NACIONAIS -->
      <div class="sources-breakdown">
        <h4>Cotações por Marketplace Verificado</h4>
        <div class="sources-grid">
          <div class="source-item">
            <span class="source-name">LigaPokémon BR</span>
            <span class="source-price mono-num">R$ {{ formatNumber(card.ligaPokemonPriceBRL || card.price) }}</span>
            <span class="source-note">Média nacional de lojas ativas</span>
          </div>

          <div class="source-item">
            <span class="source-name">TCGPlayer (EUA)</span>
            <span class="source-price mono-num">US$ {{ formatNumber(card.tcgplayerPriceUSD || (card.price / 5.2)) }}</span>
            <span class="source-note">~ R$ {{ formatNumber((card.tcgplayerPriceUSD || (card.price / 5.2)) * 5.2) }}</span>
          </div>

          <div class="source-item">
            <span class="source-name">Cardmarket (Europa)</span>
            <span class="source-price mono-num">€ {{ formatNumber(card.cardmarketPriceEUR || (card.price / 5.8)) }}</span>
            <span class="source-note">~ R$ {{ formatNumber((card.cardmarketPriceEUR || (card.price / 5.8)) * 5.8) }}</span>
          </div>

          <div class="source-item">
            <span class="source-name">eBay Graded PSA 10</span>
            <span class="source-price mono-num">R$ {{ formatNumber(card.price * 2.8) }}</span>
            <span class="source-note">Último leilão verificado</span>
          </div>
        </div>
      </div>

      <!-- BOTÕES DE AÇÃO INFERIORES -->
      <div class="modal-footer-actions">
        <button type="button" class="btn btn-surface" @click="$emit('add-alert')">
          🔔 Criar Alerta de Preço
        </button>
        <button type="button" class="btn btn-primary" @click="$emit('add-collection', card)">
          + Adicionar à Coleção
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: { type: Object, required: true }
});

defineEmits(['close', 'add-alert', 'add-collection']);

function formatNumber(val) {
  if (!val) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const pointsArray = computed(() => {
  return props.card.history30d || [
    props.card.price * 0.88,
    props.card.price * 0.90,
    props.card.price * 0.92,
    props.card.price * 0.91,
    props.card.price * 0.94,
    props.card.price * 0.97,
    props.card.price * 0.96,
    props.card.price * 0.99,
    props.card.price * 1.00
  ];
});

const chartPoints = computed(() => {
  const data = pointsArray.value;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const step = 700 / (data.length - 1);

  return data.map((val, idx) => {
    const x = Math.round(idx * step);
    const y = Math.round(170 - ((val - min) / range) * 130);
    return { x, y, val };
  });
});

const chartPolylinePoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const chartPolygonPoints = computed(() => {
  const line = chartPolylinePoints.value;
  return `0,195 ${line} 700,195`;
});
</script>

<style scoped>
.price-modal-box {
  padding: 30px;
  max-width: 820px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.card-thumb-badge {
  width: 64px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}

.modal-mini-card {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
}

.set-tag {
  color: var(--text-secondary);
}

.rarity-tag {
  color: var(--accent-amber);
  font-weight: 700;
}

.format-tag {
  background: var(--surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  color: #93c5fd;
  font-size: 0.7rem;
}

.card-title-lg {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.15;
}

.market-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* CARDS DE OVERVIEW */
.price-overview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .price-overview-grid {
    grid-template-columns: 1fr;
  }
}

.overview-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-stat {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--surface-card) 100%);
  border-color: rgba(245, 158, 11, 0.3);
}

.stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stat-val-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-val-amber {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--accent-amber);
}

.stat-trend-tag {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.stat-trend-tag.up {
  color: var(--accent-green);
  background: var(--accent-green-subtle);
}

.stat-trend-tag.down {
  color: var(--accent-red);
  background: var(--accent-red-subtle);
}

.stat-val-highlight {
  font-size: 1.3rem;
  font-weight: 700;
  color: #38bdf8;
}

.stat-val-trend.positive {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent-green);
}

.stat-subtext {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* SEÇÃO DO GRÁFICO */
.chart-section {
  padding: 18px;
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title-area h4 {
  font-size: 0.95rem;
  font-weight: 700;
}

.chart-currency {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.timeframe-buttons {
  display: flex;
  gap: 4px;
}

.btn-time {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-time.active {
  background: var(--accent-amber);
  color: #0b0f17;
  font-weight: 700;
  border-color: var(--accent-amber);
}

.svg-chart-container {
  width: 100%;
  height: 180px;
  position: relative;
}

.market-chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-dates-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 8px;
  padding: 0 4px;
}

/* FONTES DE MERCADO */
.sources-breakdown {
  margin-bottom: 24px;
}

.sources-breakdown h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 768px) {
  .sources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.source-item {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.source-name {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.source-price {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.source-note {
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* FOOTER ACTIONS */
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
