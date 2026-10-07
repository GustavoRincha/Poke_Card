<template>
  <div class="card-grid-wrapper">
    <!-- 1. MODO GRADE (DEFAULT - 4 COLUNAS DESKTOP) -->
    <div v-if="viewMode === 'grid'" class="cards-grid-layout">
      <PokemonCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :is-comparing="compareIds.includes(card.id)"
        @click-card="$emit('click-card', card)"
        @toggle-owned="$emit('toggle-owned', card)"
        @toggle-wanted="$emit('toggle-wanted', card)"
        @toggle-compare="$emit('toggle-compare', card)"
        @open-prices="$emit('open-prices', card)"
      />
    </div>

    <!-- 2. MODO LISTA FINANCEIRA (TABELA BLOOMBERG TCG) -->
    <div v-else-if="viewMode === 'list'" class="financial-table-box card-surface">
      <table class="tcg-data-table">
        <thead>
          <tr>
            <th class="col-img">Carta</th>
            <th class="col-name">Nome / ID</th>
            <th class="col-set">Expansão</th>
            <th class="col-rarity">Raridade</th>
            <th class="col-type">Tipo & HP</th>
            <th class="col-status">Coleção</th>
            <th class="col-price text-right">Preço Médio (BRL)</th>
            <th class="col-trend text-right">Variação 24h</th>
            <th class="col-spark">Tendência (30d)</th>
            <th class="col-actions text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="card in cards" 
            :key="card.id"
            class="table-card-row"
            @click="$emit('click-card', card)"
          >
            <!-- Imagem Miniatura -->
            <td class="col-img" @click.stop="$emit('click-card', card)">
              <div class="mini-thumb-wrap">
                <img :src="card.image" :alt="card.name" class="mini-card-thumb" loading="lazy" />
              </div>
            </td>

            <!-- Nome e Número -->
            <td class="col-name">
              <div class="table-name-wrap">
                <span class="table-card-name">{{ card.name }}</span>
                <span class="table-card-num">{{ card.number }}</span>
              </div>
            </td>

            <!-- Expansão -->
            <td class="col-set">
              <div class="table-set-pill">
                <span class="table-set-code">{{ card.setCode }}</span>
                <span class="table-set-name">{{ card.set }}</span>
              </div>
            </td>

            <!-- Raridade -->
            <td class="col-rarity">
              <span class="table-rarity-tag">{{ card.rarity }}</span>
            </td>

            <!-- Tipo e HP -->
            <td class="col-type">
              <span class="table-type-badge">
                {{ card.type }} • {{ card.hp }} HP
              </span>
            </td>

            <!-- Status -->
            <td class="col-status">
              <span 
                v-if="card.ownedCount > 0" 
                class="status-pill status-owned"
              >
                Na Coleção ({{ card.ownedCount }}x)
              </span>
              <span 
                v-else-if="card.isWanted" 
                class="status-pill status-wish"
              >
                ⭐ Desejado
              </span>
              <span v-else class="status-pill status-none">—</span>
            </td>

            <!-- Preço Médio -->
            <td class="col-price text-right">
              <span class="table-price-amber mono-num">
                R$ {{ formatNumber(card.price) }}
              </span>
            </td>

            <!-- Variação -->
            <td class="col-trend text-right">
              <span 
                class="table-trend-pill mono-num"
                :class="card.variationPositive ? 'trend-up' : 'trend-down'"
              >
                {{ card.variationPositive ? '↑' : '↓' }} {{ card.variation }}
              </span>
            </td>

            <!-- Mini Sparkline SVG -->
            <td class="col-spark">
              <svg width="60" height="20" class="sparkline-svg">
                <polyline
                  :points="generateSparkline(card.history30d || [10, 12, 11, 14, 15, 18])"
                  fill="none"
                  :stroke="card.variationPositive ? '#10b981' : '#ef4444'"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </td>

            <!-- Ações -->
            <td class="col-actions text-center" @click.stop>
              <div class="row-actions-group">
                <button 
                  type="button" 
                  class="btn-row-action"
                  @click.stop="$emit('open-prices', card)"
                  title="Ver Detalhes Financeiros"
                >
                  Preços
                </button>
                <button 
                  type="button" 
                  class="btn-row-icon"
                  :class="{ active: card.ownedCount > 0 }"
                  @click.stop="$emit('toggle-owned', card)"
                  title="Ajustar Coleção"
                >
                  +
                </button>
                <button 
                  type="button" 
                  class="btn-row-icon"
                  :class="{ active: card.isWanted }"
                  @click.stop="$emit('toggle-wanted', card)"
                  title="Lista de Desejos"
                >
                  ♥
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. MODO FICHÁRIO / BINDER SLEEVES (ÁLBUM 9 BOLSOS) -->
    <div v-else-if="viewMode === 'binder'" class="binder-album-container card-surface">
      <div class="binder-header">
        <div class="binder-title-info">
          <h4>Fichário do Colecionador PokéCard</h4>
          <span>Página 1 de 4 • Sleeves Ultra-Pro Protegidos</span>
        </div>
        <div class="binder-nav-buttons">
          <button type="button" class="btn btn-sm btn-surface">‹ Página Anterior</button>
          <button type="button" class="btn btn-sm btn-surface">Próxima Página ›</button>
        </div>
      </div>

      <div class="binder-page-leather">
        <div class="binder-pockets-grid">
          <div 
            v-for="card in cards.slice(0, 9)" 
            :key="card.id"
            class="binder-pocket-slot"
            @click="$emit('click-card', card)"
          >
            <!-- Plástico do Sleeve com Reflexo -->
            <div class="plastic-sleeve-overlay"></div>
            
            <img :src="card.image" :alt="card.name" class="binder-card-img" loading="lazy" />

            <div class="pocket-bottom-label">
              <span class="pocket-name">{{ card.name }}</span>
              <span class="pocket-price mono-num">R$ {{ formatNumber(card.price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ESTADO VAZIO: NENHUMA CARTA ENCONTRADA -->
    <div v-if="cards.length === 0" class="empty-cards-state card-surface">
      <div class="empty-icon-circle">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h3>Nenhuma carta encontrada</h3>
      <p>Nenhuma carta corresponde aos filtros e parâmetros selecionados atualmente.</p>
      <button 
        type="button" 
        class="btn btn-primary"
        @click="$emit('clear-all-filters')"
      >
        Redefinir Todos os Filtros
      </button>
    </div>
  </div>
</template>

<script setup>
import PokemonCard from './PokemonCard.vue';

const props = defineProps({
  cards: { type: Array, required: true },
  viewMode: { type: String, default: 'grid' },
  compareIds: { type: Array, default: () => [] }
});

defineEmits([
  'click-card', 
  'toggle-owned', 
  'toggle-wanted', 
  'toggle-compare', 
  'open-prices', 
  'clear-all-filters'
]);

function formatNumber(val) {
  if (!val) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateSparkline(history) {
  if (!history || history.length < 2) return '0,10 60,10';
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = (max - min) || 1;
  const step = 60 / (history.length - 1);

  return history
    .map((val, i) => {
      const x = Math.round(i * step);
      const y = Math.round(18 - ((val - min) / range) * 16);
      return `${x},${y}`;
    })
    .join(' ');
}
</script>

<style scoped>
.card-grid-wrapper {
  width: 100%;
}

/* 1. GRID RESPONSIVO (4 COLUNAS DESKTOP) */
.cards-grid-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media (max-width: 1380px) {
  .cards-grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1080px) {
  .cards-grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .cards-grid-layout {
    grid-template-columns: 1fr;
  }
}

/* 2. TABELA FINANCEIRA BLOOMBERG */
.financial-table-box {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.tcg-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}

.tcg-data-table thead th {
  background: #0f1622;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.tcg-data-table tbody tr {
  border-bottom: 1px solid rgba(36, 52, 71, 0.4);
  transition: background 0.15s ease;
  cursor: pointer;
}

.tcg-data-table tbody tr:hover {
  background: var(--surface-elevated);
}

.tcg-data-table td {
  padding: 10px 14px;
  vertical-align: middle;
}

.col-img {
  width: 50px;
}

.mini-thumb-wrap {
  width: 38px;
  height: 52px;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-card-thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.table-name-wrap {
  display: flex;
  flex-direction: column;
}

.table-card-name {
  font-weight: 700;
  color: var(--text-main);
}

.table-card-num {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.table-set-pill {
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-set-code {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  background: var(--surface-elevated);
  padding: 1px 4px;
  border-radius: 3px;
  color: #93c5fd;
}

.table-rarity-tag {
  color: var(--accent-amber);
  font-weight: 600;
}

.table-type-badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.74rem;
}

.status-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.status-owned {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status-wish {
  background: rgba(245, 158, 11, 0.2);
  color: var(--accent-amber);
}

.status-none {
  color: var(--text-muted);
}

.table-price-amber {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent-amber);
}

.table-trend-pill {
  font-weight: 700;
  font-size: 0.76rem;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.trend-up {
  color: var(--accent-green);
}

.trend-down {
  color: var(--accent-red);
}

.row-actions-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-row-action {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-main);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-row-action:hover {
  background: #2b3d54;
  border-color: #3b82f6;
}

.btn-row-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-row-icon:hover,
.btn-row-icon.active {
  background: var(--accent-blue);
  color: #fff;
  border-color: var(--accent-blue);
}

/* 3. FICHÁRIO / BINDER SLEEVES */
.binder-album-container {
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.binder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.binder-title-info h4 {
  font-size: 1.1rem;
}

.binder-title-info span {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.binder-nav-buttons {
  display: flex;
  gap: 8px;
}

.binder-page-leather {
  background: #090e16;
  border: 2px solid #1a2533;
  border-radius: 16px;
  padding: 20px;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8);
}

.binder-pockets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 800px) {
  .binder-pockets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.binder-pocket-slot {
  background: #05080d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  aspect-ratio: 240 / 330;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.binder-pocket-slot:hover {
  transform: scale(1.02);
  border-color: var(--accent-blue);
}

.plastic-sleeve-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0.03) 100%
  );
  pointer-events: none;
}

.binder-card-img {
  max-width: 100%;
  max-height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.7));
}

.pocket-bottom-label {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  background: rgba(19, 27, 38, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}

.pocket-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.pocket-price {
  color: var(--accent-amber);
  font-weight: 700;
}

/* ESTADO VAZIO */
.empty-cards-state {
  text-align: center;
  padding: 60px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-cards-state h3 {
  font-size: 1.3rem;
  font-weight: 700;
}

.empty-cards-state p {
  color: var(--text-secondary);
  font-size: 0.88rem;
  max-width: 400px;
  margin-bottom: 8px;
}
</style>
