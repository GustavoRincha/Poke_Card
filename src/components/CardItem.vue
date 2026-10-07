<template>
  <div class="card-item-container" ref="cardItemEl">
    <div class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
      <div 
        ref="card" 
        class="card-inner" 
        :class="[glowClass, { 'owned': quantityOwned > 0, 'wanted': isWanted }]"
        @click="onClickCard"
      >
        <!-- Brilho Holográfico -->
        <div ref="shine" class="card-shine"></div>
        
        <!-- Imagem da Carta -->
        <div class="card-image-box">
          <img 
            v-if="card.image" 
            :src="card.image + '/low.png'" 
            :alt="card.name"
            class="card-img" 
            loading="lazy"
            @error="onImageError"
          />
          <!-- Placeholder caso não tenha imagem -->
          <div v-else class="card-image-placeholder">
            <div class="pokeball-icon"></div>
            <span>{{ card.name }}</span>
            <small>{{ card.id }}</small>
          </div>
        </div>

        <!-- Badges de status rápidas sobre a imagem -->
        <div class="status-badges">
          <span v-if="quantityOwned > 0" class="status-badge owned-badge">
            Tenho x{{ quantityOwned }}
          </span>
          <span v-if="isWanted" class="status-badge wanted-badge">
            Quero ⭐
          </span>
        </div>
      </div>
    </div>

    <!-- Info da Carta e Botões de Controle Premium -->
    <div class="card-info">
      <!-- Linha Superior: #dexId • localId/official e MERCADO TCG -->
      <div class="card-meta-top">
        <span class="card-number-tag">{{ cardFormattedNumber }}</span>
        <span class="market-label">MERCADO TCG</span>
      </div>

      <!-- Linha Principal: Nome + Badge de Tipo e Preço em Destaque -->
      <div class="card-meta-main">
        <div class="name-badge-group">
          <h3 class="card-name-title" :title="card.name">{{ card.name }}</h3>
          <span v-if="cardType" class="card-type-tag" :style="{ backgroundColor: cardTypeColor }">
            {{ cardType }}
          </span>
        </div>
        <div class="card-price-group">
          <span class="card-price-val">{{ cardDisplayPrice }}</span>
        </div>
      </div>

      <!-- Trio de Botões de Ação: + Na Coleção, ★ Desejos, 📈 Histórico -->
      <div class="card-actions-trio">
        <!-- 1: Na Coleção -->
        <button 
          @click.stop="handleCollectionClick" 
          class="trio-btn btn-collection"
          :class="{ 'is-owned': quantityOwned > 0 }"
          :title="quantityOwned > 0 ? `Possui x${quantityOwned} na coleção. Clique para adicionar mais.` : 'Adicionar à Coleção'"
        >
          <span class="trio-icon icon-add">{{ quantityOwned > 0 ? '✓' : '+' }}</span>
          <span class="trio-label">{{ quantityOwned > 0 ? `x${quantityOwned} Coleção` : 'Na Coleção' }}</span>
        </button>

        <!-- 2: Desejos -->
        <button 
          @click.stop="toggleWanted" 
          class="trio-btn btn-wishlist"
          :class="{ 'is-wanted': isWanted }"
          title="Adicionar ou remover dos Desejos"
        >
          <span class="trio-icon icon-star">{{ isWanted ? '★' : '☆' }}</span>
          <span class="trio-label">Desejos</span>
        </button>

        <!-- 3: Histórico -->
        <button 
          @click.stop="onClickCard" 
          class="trio-btn btn-history"
          title="Ver histórico de preços e detalhes da carta"
        >
          <span class="trio-icon icon-chart">📈</span>
          <span class="trio-label">Histórico</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardItem',
  props: {
    card: {
      type: Object,
      required: true
    },
    quantityOwned: {
      type: Number,
      default: 0
    },
    isWanted: {
      type: Boolean,
      default: false
    },
    activeTypeGlow: {
      type: String,
      default: ''
    },
    setsMap: {
      type: Object,
      default: () => ({})
    },
    savedMetadata: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['click-card', 'toggle-owned', 'toggle-wanted', 'card-enriched'],
  data() {
    return {
      observer: null
    };
  },
  computed: {
    glowClass() {
      if (!this.activeTypeGlow) return 'glow-default';
      const formattedType = this.activeTypeGlow.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return `glow-${formattedType}`;
    },
    resolvedMetadata() {
      return this.savedMetadata?.[this.card.id] || {};
    },
    cardType() {
      const types = this.card.types || this.resolvedMetadata.types;
      if (types && types.length) {
        const t = types[0];
        if (t === 'Planta') return 'Grama';
        return t;
      }
      if (this.card.category || this.resolvedMetadata.category) {
        return this.card.category || this.resolvedMetadata.category;
      }
      return '';
    },
    cardTypeColor() {
      const t = this.cardType;
      const colors = {
        'Grama': '#10b981',
        'Planta': '#10b981',
        'Fogo': '#ef4444',
        'Água': '#3b82f6',
        'Elétrico': '#eab308',
        'Psíquico': '#a855f7',
        'Lutador': '#ea580c',
        'Sombrio': '#475569',
        'Metal': '#94a3b8',
        'Dragão': '#d97706',
        'Incolor': '#9ca3af',
        'Fada': '#ec4899',
        'Treinador': '#6366f1',
        'Energia': '#eab308'
      };
      return colors[t] || '#6366f1';
    },
    cardFormattedNumber() {
      const dexId = this.card.dexId || this.resolvedMetadata.dexId;
      const dexNum = Array.isArray(dexId) ? dexId[0] : dexId;

      const setId = this.card.id ? this.card.id.split('-')[0] : '';
      const setInfo = this.setsMap?.[setId];
      const officialTotal = setInfo?.cardCount?.official || setInfo?.cardCount?.total;

      const localId = this.card.localId || (this.card.id ? this.card.id.split('-')[1] : '1');

      if (dexNum && officialTotal) {
        return `#${dexNum} • ${localId}/${officialTotal}`;
      } else if (dexNum) {
        return `#${dexNum} • #${localId}`;
      } else if (officialTotal) {
        return `#${localId} • ${localId}/${officialTotal}`;
      } else {
        return `#${localId} • ${this.getSetName(this.card.id)}`;
      }
    },
    cardDisplayPrice() {
      const price = this.card.estimatedPriceBRL || this.resolvedMetadata.estimatedPriceBRL;
      if (typeof price === 'number' && price > 0) {
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL', 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }).format(price);
      }
      return 'R$ --';
    }
  },
  mounted() {
    this.observeForEnrichment();
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    observeForEnrichment() {
      // Se a carta já possui types e pricing/preço, não precisa buscar
      if (this.card.types && (this.card.estimatedPriceBRL || this.card.pricing)) return;
      if (this.resolvedMetadata.types && (this.resolvedMetadata.estimatedPriceBRL || this.resolvedMetadata.pricing)) return;

      if (typeof window !== 'undefined' && 'IntersectionObserver' in window && this.$refs.cardItemEl) {
        this.observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.observer.disconnect();
            this.fetchCardEnrichment();
          }
        }, { rootMargin: '250px' });
        
        this.observer.observe(this.$refs.cardItemEl);
      }
    },
    async fetchCardEnrichment() {
      if (!this.card.id) return;
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/pt/cards/${this.card.id}`);
        if (res.ok) {
          const data = await res.json();
          this.$emit('card-enriched', data);
        }
      } catch (e) {
        // Silencioso em caso de falha de conexão
      }
    },
    getSetName(cardId) {
      if (!cardId) return 'TCG';
      return cardId.split('-')[0].toUpperCase();
    },
    handleMouseMove(e) {
      const card = this.$refs.card;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const rotateX = (yc - y) / 12;
      const rotateY = (x - xc) / 12;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

      const shine = this.$refs.shine;
      if (shine) {
        const percentageX = (x / rect.width) * 100;
        const percentageY = (y / rect.height) * 100;
        shine.style.backgroundPosition = `${percentageX}% ${percentageY}%`;
        shine.style.opacity = '1';
      }
    },
    handleMouseLeave() {
      const card = this.$refs.card;
      if (!card) return;
      
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      
      const shine = this.$refs.shine;
      if (shine) {
        shine.style.opacity = '0';
      }
    },
    onClickCard() {
      this.$emit('click-card', this.card);
    },
    handleCollectionClick() {
      this.$emit('toggle-owned', { card: this.card, action: 'add' });
    },
    toggleWanted() {
      this.$emit('toggle-wanted', this.card);
    },
    onImageError() {
      this.card.image = null;
    }
  }
};
</script>

<style scoped>
.card-item-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: linear-gradient(180deg, #101422 0%, #0c0f1a 100%);
  border-radius: 20px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.card-item-container:hover {
  border-color: rgba(59, 130, 246, 0.35);
  background: linear-gradient(180deg, #13192b 0%, #0e1220 100%);
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.55), 0 0 20px rgba(59, 130, 246, 0.1);
}

.card-wrapper {
  position: relative;
  perspective: 1000px;
  aspect-ratio: 240 / 330;
  width: 100%;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
  cursor: pointer;
}

.card-shine {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 30%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 200%;
  background-position: 0% 0%;
  pointer-events: none;
  z-index: 5;
  mix-blend-mode: overlay;
  transition: background-position 0.1s ease-out;
  opacity: 0;
}

.card-inner:hover .card-shine {
  background-position: 100% 100%;
}

.card-image-box {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: #07090e;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.4s ease;
}

.card-item-container:hover .card-img {
  transform: scale(1.02);
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: var(--text-secondary);
  text-align: center;
  background: radial-gradient(circle at center, #181b28 0%, #08090d 100%);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.pokeball-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(to bottom, #ff3c3c 50%, #ffffff 50%);
  border-radius: 50%;
  border: 3px solid var(--bg-primary);
  position: relative;
}

.pokeball-icon::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border: 3px solid var(--bg-primary);
  border-radius: 50%;
}

.pokeball-icon::after {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 3px;
  background: var(--bg-primary);
  transform: translateY(-50%);
}

.card-image-placeholder span {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
}

.card-image-placeholder small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* Tipos de Glows Dinâmicos */
.glow-default {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.glow-planta {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-planta-glow);
  border: 1.5px solid rgba(73, 208, 176, 0.3);
}

.glow-fogo {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-fogo-glow);
  border: 1.5px solid rgba(255, 87, 87, 0.3);
}

.glow-agua {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-água-glow);
  border: 1.5px solid rgba(83, 157, 246, 0.3);
}

.glow-eletrico {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-elétrico-glow);
  border: 1.5px solid rgba(243, 210, 43, 0.3);
}

.glow-psiquico {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-psíquico-glow);
  border: 1.5px solid rgba(243, 102, 185, 0.3);
}

.glow-lutador {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-lutador-glow);
  border: 1.5px solid rgba(218, 120, 63, 0.3);
}

.glow-sombrio {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-sombrio-glow);
  border: 1.5px solid rgba(86, 88, 102, 0.3);
}

.glow-metal {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-metal-glow);
  border: 1.5px solid rgba(158, 183, 194, 0.3);
}

.glow-dragao {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-dragão-glow);
  border: 1.5px solid rgba(241, 168, 42, 0.3);
}

.glow-fada {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px var(--type-fada-glow);
  border: 1.5px solid rgba(253, 185, 233, 0.3);
}

.glow-incolor {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px var(--type-incolor-glow);
  border: 1.5px solid rgba(168, 171, 167, 0.25);
}

/* Badges sobrepostas na imagem */
.status-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
  z-index: 10;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 7px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
  font-family: var(--font-display);
}

.owned-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
}

.wanted-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

/* Informações da Carta */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 2px;
}

.card-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-number-tag {
  color: #718096;
  font-size: 0.76rem;
  font-weight: 600;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

.market-label {
  color: #718096;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-display);
}

.card-meta-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.name-badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.card-name-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-display);
  line-height: 1.2;
}

.card-type-tag {
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: var(--font-display);
  text-transform: capitalize;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.card-price-group {
  display: flex;
  align-items: baseline;
  flex-shrink: 0;
}

.card-price-val {
  color: #fbbf24;
  font-size: 1.15rem;
  font-weight: 850;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}

/* Trio de Ações */
.card-actions-trio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 6px;
}

.trio-btn {
  background: #141926;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border-radius: 12px;
  padding: 8px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 650;
  font-family: var(--font-display);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.trio-btn:hover {
  background: #1b2234;
  border-color: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  transform: translateY(-1px);
}

.trio-btn:active {
  transform: translateY(0);
}

.trio-icon {
  font-size: 0.82rem;
  display: flex;
  align-items: center;
}

.icon-add {
  color: #10b981;
  font-weight: 900;
}

.icon-star {
  color: #f59e0b;
}

.icon-chart {
  color: #3b82f6;
}

.btn-collection.is-owned {
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.btn-wishlist.is-wanted {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.trio-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
