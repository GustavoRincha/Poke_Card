<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box compare-modal-box">
      <button type="button" class="close-modal-btn" @click="$emit('close')">×</button>

      <div class="compare-header">
        <div>
          <span class="compare-tag">FERRAMENTA DE ANÁLISE COMPARATIVA</span>
          <h2 class="compare-title">Comparação de Cartas Pokémon TCG ({{ cards.length }})</h2>
        </div>
        <button 
          v-if="cards.length > 0" 
          type="button" 
          class="btn btn-sm btn-surface" 
          @click="$emit('clear-compare')"
        >
          Limpar Comparação
        </button>
      </div>

      <!-- ESTADO VAZIO -->
      <div v-if="cards.length === 0" class="compare-empty">
        <p>Nenhuma carta selecionada para comparação.</p>
        <small>Passe o mouse sobre qualquer carta no catálogo e clique em "⇄ Comparar".</small>
      </div>

      <!-- TABELA COMPARATIVA LADO A LADO -->
      <div v-else class="compare-grid-cards" :style="{ '--col-count': cards.length }">
        <div v-for="card in cards" :key="card.id" class="compare-card-col card-surface">
          <button 
            type="button" 
            class="remove-compare-btn" 
            @click="$emit('remove-card', card.id)"
            title="Remover da Comparação"
          >
            ×
          </button>

          <div class="compare-img-wrap">
            <img :src="card.image" :alt="card.name" class="compare-img" />
          </div>

          <h4 class="card-col-name">{{ card.name }}</h4>
          <span class="card-col-set">{{ card.set }} • {{ card.number }}</span>

          <div class="compare-metrics-list">
            <div class="metric-item">
              <span class="metric-label">Preço Médio (BRL)</span>
              <span class="metric-value price-amber mono-num">R$ {{ formatNumber(card.price) }}</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Variação 24h</span>
              <span class="metric-value mono-num" :class="card.variationPositive ? 'text-green' : 'text-red'">
                {{ card.variationPositive ? '↑' : '↓' }} {{ card.variation }}
              </span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Tipo Elemental</span>
              <span class="metric-value">{{ card.type }}</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Pontos de Saúde (HP)</span>
              <span class="metric-value">{{ card.hp }} HP</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Raridade</span>
              <span class="metric-value text-amber">{{ card.rarity }}</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Formato Competitivo</span>
              <span class="metric-value">{{ card.format }}</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Liquidez</span>
              <span class="metric-value text-blue">{{ card.liquidity || 'Alta' }}</span>
            </div>

            <div class="metric-item attacks-box">
              <span class="metric-label">Ataques / Habilidade</span>
              <p class="attacks-text">{{ card.attacks }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cards: { type: Array, required: true }
});

defineEmits(['close', 'remove-card', 'clear-compare']);

function formatNumber(val) {
  if (!val) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.compare-modal-box {
  padding: 30px;
  max-width: 980px;
}

.compare-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.compare-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.compare-title {
  font-size: 1.4rem;
  font-weight: 800;
}

.compare-empty {
  text-align: center;
  padding: 50px 20px;
  color: var(--text-secondary);
}

.compare-grid-cards {
  display: grid;
  grid-template-columns: repeat(var(--col-count), 1fr);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

@media (max-width: 768px) {
  .compare-grid-cards {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

.compare-card-col {
  padding: 16px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  position: relative;
}

.remove-compare-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-compare-btn:hover {
  background: var(--accent-red);
  color: #fff;
}

.compare-img-wrap {
  width: 100%;
  aspect-ratio: 240 / 330;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.compare-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
}

.card-col-name {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.card-col-set {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.compare-metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.78rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 600;
}

.metric-value {
  font-weight: 600;
  color: var(--text-main);
}

.price-amber {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--accent-amber);
}

.text-green { color: var(--accent-green); }
.text-red { color: var(--accent-red); }
.text-amber { color: var(--accent-amber); }
.text-blue { color: #38bdf8; }

.attacks-box {
  background: rgba(11, 15, 23, 0.6);
  padding: 8px;
  border-radius: 6px;
  margin-top: 4px;
}

.attacks-text {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.3;
}
</style>
