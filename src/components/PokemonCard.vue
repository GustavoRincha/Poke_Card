<template>
  <div 
    class="tcg-card-container card-surface"
    :class="{ 'is-in-collection': card.ownedCount > 0, 'is-wanted': card.isWanted }"
    @click="$emit('click-card', card)"
  >
    <!-- TOP ROW: Badges de Tipo/HP e Status -->
    <div class="card-top-row">
      <!-- Badge Esquerda: Tipo + HP -->
      <div class="type-hp-badge" :style="{ '--type-color': getTypeColor(card.type) }">
        <span class="type-icon">{{ getTypeIcon(card.type) }}</span>
        <span class="type-hp-text">{{ card.type }} • HP {{ card.hp }}</span>
      </div>

      <!-- Badge Direita: Status da Coleção / Raridade Especial -->
      <div class="card-status-badge" :class="getBadgeClass(card)">
        <span>{{ getBadgeLabel(card) }}</span>
      </div>
    </div>

    <!-- ÁREA DA IMAGEM: Proporção TCG com Recesso e Brilho -->
    <div class="card-image-stage">
      <div class="stage-dark-recess">
        <img 
          :src="card.image" 
          :alt="card.name"
          class="card-tcg-image"
          loading="lazy"
          @error="handleImageFallback"
        />
        
        <!-- Camada Sutil Holográfica -->
        <div class="holo-foil-overlay"></div>

        <!-- Botões de Ação Rápida Revelados no Hover -->
        <div class="hover-action-overlay" @click.stop>
          <button 
            type="button" 
            class="hover-btn btn-add-col"
            :class="{ active: card.ownedCount > 0 }"
            @click.stop="$emit('toggle-owned', card)"
            title="Adicionar / Ajustar na Coleção"
          >
            <span>{{ card.ownedCount > 0 ? `✓ Coleção (${card.ownedCount})` : '+ Coleção' }}</span>
          </button>

          <button 
            type="button" 
            class="hover-btn btn-wish"
            :class="{ active: card.isWanted }"
            @click.stop="$emit('toggle-wanted', card)"
            title="Adicionar à Lista de Desejos"
          >
            <span>{{ card.isWanted ? '♥ Desejado' : '♡ Desejo' }}</span>
          </button>

          <button 
            type="button" 
            class="hover-btn btn-comp"
            :class="{ active: isComparing }"
            @click.stop="$emit('toggle-compare', card)"
            title="Comparar com outra carta"
          >
            <span>⇄ Comparar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DRAWER INFERIOR: Informações, Ataques e Cotação Financeira -->
    <div class="card-drawer-info">
      <!-- Linha 1: Expansão • Número e Raridade em Ouro -->
      <div class="info-row-meta">
        <span class="meta-set-num">{{ card.set }} • {{ card.number }}</span>
        <span class="meta-rarity">{{ card.rarity }}</span>
      </div>

      <!-- Linha 2: Nome da Carta -->
      <h4 class="card-name-title" :title="card.name">
        {{ card.name }}
      </h4>

      <!-- Linha 3: Ataques e Habilidades -->
      <p class="card-attacks-line" :title="card.attacks">
        {{ card.attacks }}
      </p>

      <!-- Linha 4: Label Mercado TCG -->
      <div class="price-header-label">
        <span>PREÇO MÉDIO TCG</span>
      </div>

      <!-- Linha 5: Preço Grande Âmbar, Variação e Botão Preços -->
      <div class="price-action-row">
        <div class="price-trend-block">
          <span class="price-main-amber mono-num">
            R$ {{ formatNumber(card.price) }}
          </span>
          <span 
            class="trend-badge mono-num"
            :class="card.variationPositive ? 'trend-up' : 'trend-down'"
          >
            <span class="arrow">{{ card.variationPositive ? '↑' : '↓' }}</span>
            <span>{{ card.variation }}</span>
          </span>
        </div>

        <button 
          type="button" 
          class="btn-prices-pill"
          @click.stop="$emit('open-prices', card)"
          title="Ver histórico de mercado e cotações"
        >
          Preços
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  card: { type: Object, required: true },
  isComparing: { type: Boolean, default: false }
});

defineEmits(['click-card', 'toggle-owned', 'toggle-wanted', 'toggle-compare', 'open-prices']);

function getTypeColor(type) {
  const map = {
    'Grama': '#10b981',
    'Fogo': '#ef4444',
    'Água': '#3b82f6',
    'Raio': '#eab308',
    'Psíquico': '#a855f7',
    'Luta': '#f97316',
    'Escuro': '#475569',
    'Metal': '#94a3b8',
    'Dragão': '#d97706',
    'Incolor': '#64748b'
  };
  return map[type] || '#3b82f6';
}

function getTypeIcon(type) {
  const map = {
    'Grama': '🌿',
    'Fogo': '🔥',
    'Água': '💧',
    'Raio': '⚡',
    'Psíquico': '🔮',
    'Luta': '🥊',
    'Escuro': '🌙',
    'Metal': '🛡',
    'Dragão': '🐉',
    'Incolor': '⭕'
  };
  return map[type] || '⚡';
}

function getBadgeLabel(card) {
  if (card.badgeRight) return card.badgeRight;
  if (card.ownedCount > 0) return `Na Coleção: ${card.ownedCount}x`;
  if (card.isWanted) return 'Desejado';
  return card.rarity;
}

function getBadgeClass(card) {
  const label = getBadgeLabel(card);
  if (label.includes('Na Coleção') || card.badgeType === 'owned') return 'badge-owned-blue';
  if (label.includes('Alt Art') || card.badgeType === 'alt_art') return 'badge-alt-amber';
  if (label.includes('VSTAR') || card.badgeType === 'vstar') return 'badge-vstar-dark';
  if (label.includes('Desejado') || card.badgeType === 'wanted') return 'badge-wanted-dark';
  if (label.includes('Shiny') || card.badgeType === 'shiny') return 'badge-shiny-purple';
  return 'badge-neutral';
}

function formatNumber(val) {
  if (!val) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleImageFallback(e) {
  e.target.src = 'https://assets.tcgdex.net/en/swsh/swsh1/1/high.webp';
}
</script>

<style scoped>
.tcg-card-container {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 12px;
  cursor: pointer;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.tcg-card-container:hover {
  transform: translateY(-4px);
  border-color: #3b506b;
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.65), 0 0 18px -3px rgba(59, 130, 246, 0.15);
}

/* TOP ROW */
.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.type-hp-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(15, 23, 34, 0.85);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--type-color);
}

.type-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.card-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge-owned-blue {
  background: var(--accent-blue);
  color: #ffffff;
  box-shadow: 0 1px 6px rgba(59, 130, 246, 0.4);
}

.badge-alt-amber {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid var(--accent-amber);
  color: var(--accent-amber);
}

.badge-vstar-dark {
  background: var(--surface-elevated);
  border: 1px solid #4a5d73;
  color: #e2e8f0;
}

.badge-wanted-dark {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.badge-shiny-purple {
  background: rgba(168, 85, 247, 0.18);
  border: 1px solid var(--accent-indigo);
  color: #d8b4fe;
}

.badge-neutral {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

/* IMAGE STAGE */
.card-image-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 240 / 315;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 12px;
}

.stage-dark-recess {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 40%, #151d2a 0%, #080c12 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 6px;
}

.card-tcg-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.7));
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 4px;
}

.tcg-card-container:hover .card-tcg-image {
  transform: scale(1.04);
}

.holo-foil-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.tcg-card-container:hover .holo-foil-overlay {
  opacity: 1;
}

/* OVERLAY DE AÇÕES NO HOVER */
.hover-action-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.2s ease;
  z-index: 5;
}

.tcg-card-container:hover .hover-action-overlay {
  opacity: 1;
  transform: translateY(0);
}

.hover-btn {
  flex: 1;
  background: rgba(11, 15, 23, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.68rem;
  font-weight: 600;
  padding: 5px 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hover-btn:hover {
  background: var(--surface-elevated);
  border-color: #3b82f6;
  color: #ffffff;
}

.hover-btn.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: var(--accent-blue);
  color: #93c5fd;
}

/* DRAWER INFERIOR */
.card-drawer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
}

.meta-set-num {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-rarity {
  color: var(--accent-amber);
  font-weight: 700;
  white-space: nowrap;
}

.card-name-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.card-attacks-line {
  font-size: 0.74rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.price-header-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 2px;
}

.price-action-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.price-trend-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-main-amber {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--accent-amber);
  line-height: 1;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
}

.trend-up {
  color: var(--accent-green);
}

.trend-down {
  color: var(--accent-red);
}

.btn-prices-pill {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-main);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-prices-pill:hover {
  background: #25354a;
  border-color: #3b82f6;
  color: #ffffff;
  transform: translateY(-1px);
}
</style>
