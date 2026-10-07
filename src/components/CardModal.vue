<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content-container card-surface" @click.stop>
      <!-- Botão Fechar Fixo e Acessível -->
      <button 
        type="button" 
        class="close-modal-round-btn" 
        @click="$emit('close')"
        title="Fechar (Esc)"
        aria-label="Fechar modal"
      >
        ×
      </button>

      <!-- Estado de Carregamento -->
      <div v-if="loading" class="modal-loading">
        <span class="spinner-large"></span>
        <p>Carregando dados da carta...</p>
      </div>

      <!-- Erro ao Carregar -->
      <div v-else-if="error && !details" class="modal-error">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn btn-primary btn-sm" @click="fetchCardDetails">Tentar Novamente</button>
      </div>

      <!-- Detalhes da Carta -->
      <div v-else-if="details" class="modal-body">
        <!-- Coluna da Esquerda: Imagem e Coleção -->
        <div class="modal-left">
          <div class="high-res-card-box" :class="glowClass">
            <img 
              v-if="cardImageSrc" 
              :src="cardImageSrc" 
              :alt="details.name"
              class="high-res-img"
              @error="onImageError"
            />
            <div v-else class="card-image-placeholder-large">
              <div class="pokeball-icon-large"></div>
              <span>Sem Imagem Disponível</span>
            </div>
          </div>
          
          <!-- Controles de Coleção no Modal -->
          <div class="collection-controls-panel card-surface">
            <h4>Gerenciar Coleção</h4>
            
            <div class="collection-status-info" v-if="quantityOwned > 0">
              <div>Você possui <span class="qty-highlight mono-num">{{ quantityOwned }}</span> {{ quantityOwned === 1 ? 'unidade' : 'unidades' }}</div>
              <div v-if="totalOwnedValueBRL" class="owned-value-sub">
                Total estimado: <strong class="val-highlight mono-num">{{ totalOwnedValueBRL }}</strong>
              </div>
            </div>
            <div class="collection-status-info empty-collection" v-else>
              Não possui esta carta na coleção.
            </div>

            <div class="control-actions-grid">
              <!-- Botão Adicionar -->
              <button 
                type="button"
                @click="adjustQuantity(1)" 
                class="btn btn-sm modal-action-btn btn-add-modal"
                title="Adicionar uma unidade à coleção"
              >
                <span>➕ Adicionar</span>
              </button>
              
              <!-- Botão Remover -->
              <button 
                type="button"
                @click="adjustQuantity(-1)" 
                class="btn btn-sm modal-action-btn btn-remove-modal"
                :disabled="quantityOwned === 0"
                title="Remover uma unidade da coleção"
              >
                <span>➖ Remover</span>
              </button>

              <!-- Botão Lista de Desejos -->
              <button 
                type="button"
                @click="$emit('toggle-wanted', details)" 
                class="btn btn-sm wishlist-btn-modal"
                :class="isWanted ? 'is-active-wish' : 'btn-surface'"
                :disabled="quantityOwned > 0"
                title="Adicionar ou remover da lista de desejos"
              >
                <span>{{ isWanted ? '★ Salvo nos Desejos' : '☆ Salvar nos Desejos' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Dados, Ataques e Cotações -->
        <div class="modal-right">
          <!-- Cabeçalho do Card -->
          <div class="modal-header-info">
            <div class="meta-tags-top">
              <span class="set-meta-tag">{{ details.set?.name || 'Coleção TCG' }} • #{{ details.localId || details.number || '001' }}</span>
              <span v-if="details.rarity" class="rarity-meta-tag">{{ details.rarity }}</span>
              <span v-if="details.stage" class="stage-tag">{{ details.stage }}</span>
            </div>

            <div class="title-row">
              <h2 class="card-name">{{ details.name }}</h2>
              <span v-if="details.hp" class="hp-badge mono-num">HP {{ details.hp }}</span>
            </div>
          </div>

          <!-- Tipo e Elementos -->
          <div v-if="details.types && details.types.length" class="attributes-section">
            <span class="attr-label">Tipo:</span>
            <span 
              v-for="type in details.types" 
              :key="type" 
              class="type-pill" 
              :style="{ backgroundColor: getTypeColor(type) }"
            >
              {{ type }}
            </span>
          </div>

          <!-- Regra / Descrição -->
          <div v-if="details.description" class="rule-box card-surface">
            <p>{{ details.description }}</p>
          </div>

          <!-- Ataques -->
          <div v-if="details.attacks && details.attacks.length" class="attacks-section">
            <h3 class="section-heading">Ataques & Habilidades</h3>
            <div v-for="attack in details.attacks" :key="attack.name" class="attack-item card-surface">
              <div class="attack-header">
                <div class="attack-cost" v-if="attack.cost && attack.cost.length">
                  <span 
                    v-for="(cost, index) in attack.cost" 
                    :key="index" 
                    class="energy-dot"
                    :style="{ backgroundColor: getTypeColor(cost) }"
                    :title="cost"
                  ></span>
                </div>
                <span class="attack-name">{{ attack.name }}</span>
                <span v-if="attack.damage" class="attack-damage mono-num">{{ attack.damage }}</span>
              </div>
              <p v-if="attack.effect" class="attack-effect">{{ attack.effect }}</p>
            </div>
          </div>

          <!-- Fraquezas, Resistências e Recuo -->
          <div class="matchups-section card-surface">
            <div class="matchup-box">
              <span class="attr-label">Fraqueza:</span>
              <div v-if="details.weaknesses && details.weaknesses.length" class="matchup-list">
                <span v-for="(w, idx) in details.weaknesses" :key="idx" class="matchup-pill">
                  <span class="energy-dot-mini" :style="{ backgroundColor: getTypeColor(w.type) }"></span>
                  {{ w.value }}
                </span>
              </div>
              <span v-else class="empty-val">—</span>
            </div>

            <div class="matchup-box">
              <span class="attr-label">Resistência:</span>
              <div v-if="details.resistances && details.resistances.length" class="matchup-list">
                <span v-for="(r, idx) in details.resistances" :key="idx" class="matchup-pill">
                  <span class="energy-dot-mini" :style="{ backgroundColor: getTypeColor(r.type) }"></span>
                  {{ r.value }}
                </span>
              </div>
              <span v-else class="empty-val">—</span>
            </div>

            <div class="matchup-box">
              <span class="attr-label">Recuo:</span>
              <div v-if="details.retreat" class="matchup-list">
                <span v-for="n in details.retreat" :key="n" class="energy-dot-mini" :style="{ backgroundColor: getTypeColor('Incolor') }"></span>
              </div>
              <span v-else class="empty-val">0</span>
            </div>
          </div>

          <!-- Preços de Mercado -->
          <div class="pricing-section">
            <div class="pricing-header-row">
              <h3 class="section-heading">Cotações do Mercado TCG</h3>
              <span class="rate-badge mono-num">
                1 USD = {{ formatBRL(exchangeRates.USD || 5.20) }}
              </span>
            </div>

            <div class="pricing-grid">
              <div class="price-card card-surface">
                <div class="price-header">
                  <span>TCGPlayer (Global)</span>
                  <span class="price-ref-tag">USD</span>
                </div>
                <div class="price-list">
                  <div class="price-row">
                    <span class="price-label">Preço Médio:</span>
                    <span class="price-val-brl mono-num">
                      R$ {{ formatNumber(cardPriceBRL) }}
                    </span>
                  </div>
                  <div class="price-row">
                    <span class="price-label">Referência EUA:</span>
                    <span class="price-val-original mono-num">
                      ${{ formatNumber(cardPriceUSD) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="price-card card-surface">
                <div class="price-header">
                  <span>LigaPokémon (Brasil)</span>
                  <span class="price-ref-tag">BRL</span>
                </div>
                <div class="price-list">
                  <div class="price-row">
                    <span class="price-label">Mercado Nacional:</span>
                    <span class="price-val-brl text-amber mono-num">
                      R$ {{ formatNumber(cardPriceBRL) }}
                    </span>
                  </div>
                  <div class="price-row">
                    <span class="price-label">Disponibilidade:</span>
                    <span class="availability-tag">Em estoque</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Links de Mercado -->
            <div class="market-links-row">
              <a 
                :href="`https://www.ligapokemon.com.br/?view=cards/card&card=${encodeURIComponent(cardSearchCode)}`" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-market-link ligapokemon-btn"
                :title="`Buscar código '${cardSearchCode}' na LigaPokémon`"
              >
                <span>🇧🇷</span>
                <span>Buscar na LigaPokémon</span>
              </a>
              <a 
                :href="`https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(details.name)}`" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-market-link tcgplayer-btn"
              >
                <span>🇺🇸</span>
                <span>Buscar no TCGPlayer</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getExchangeRates, formatBRL } from '../lib/currency.js';

export default {
  name: 'CardModal',
  emits: ['close', 'update-quantity', 'toggle-wanted'],
  props: {
    cardId: {
      type: String,
      required: true
    },
    cardData: {
      type: Object,
      default: null
    },
    quantityOwned: {
      type: Number,
      default: 0
    },
    isWanted: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      details: null,
      loading: false,
      error: null,
      exchangeRates: {
        USD: 5.20,
        EUR: 5.80,
        updatedAt: null
      }
    };
  },
  computed: {
    cardImageSrc() {
      if (!this.details) return null;
      if (this.details.customImage) return this.details.customImage;
      if (this.details.image) {
        if (this.details.image.startsWith('http') && (this.details.image.includes('.png') || this.details.image.includes('.webp'))) {
          return this.details.image;
        }
        return this.details.image + '/high.png';
      }
      return null;
    },
    glowClass() {
      if (!this.details || !this.details.types || !this.details.types.length) return 'glow-default';
      const type = this.details.types[0];
      const formattedType = type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return `glow-${formattedType}`;
    },
    cardPriceBRL() {
      if (this.cardData && typeof this.cardData.price === 'number') {
        return this.cardData.price;
      }
      return 18.90;
    },
    cardPriceUSD() {
      return (this.cardPriceBRL / (this.exchangeRates.USD || 5.20));
    },
    totalOwnedValueBRL() {
      if (!this.quantityOwned || !this.cardPriceBRL) return null;
      return formatBRL(this.cardPriceBRL * this.quantityOwned);
    },
    cardSearchCode() {
      if (!this.details) return '';
      // 1. Número no formato oficial (ex: #199/165 -> 199/165)
      if (this.details.number) {
        return String(this.details.number).replace('#', '').trim();
      }
      // 2. localId com total da coleção se aplicável (ex: 199/165)
      if (this.details.localId) {
        const local = String(this.details.localId).trim();
        if (!local.includes('/') && this.details.set?.cardCount?.total) {
          return `${local}/${this.details.set.cardCount.total}`;
        }
        return local;
      }
      // 3. ID do card
      if (this.details.id) {
        return String(this.details.id).trim();
      }
      return this.details.name || '';
    }
  },
  watch: {
    cardId: {
      immediate: true,
      handler() {
        this.fetchCardDetails();
      }
    }
  },
  mounted() {
    this.loadExchangeRates();
    window.addEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = 'hidden';
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
  },
  methods: {
    handleKeyDown(e) {
      if (e.key === 'Escape') {
        this.$emit('close');
      }
    },
    loadExchangeRates() {
      return getExchangeRates().then(rates => {
        if (rates) this.exchangeRates = rates;
      }).catch(err => {
        console.warn('Erro ao carregar taxas de câmbio:', err);
      });
    },
    formatBRL(val) {
      return formatBRL(val);
    },
    formatNumber(val) {
      if (!val) return '0,00';
      return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    async fetchCardDetails() {
      if (this.cardData) {
        this.details = {
          id: this.cardData.id,
          localId: this.cardData.number?.replace('#', '') || '001',
          name: this.cardData.name,
          image: this.cardData.image,
          customImage: this.cardData.image,
          hp: this.cardData.hp,
          types: [this.cardData.type],
          rarity: this.cardData.rarity,
          category: 'Pokémon',
          stage: 'Básico',
          description: this.cardData.description || 'Carta oficial do Pokémon Trading Card Game.',
          attacks: [
            { 
              name: this.cardData.attacks?.split('•')[0]?.replace('Ataques:', '').replace('Ataque:', '').replace('Habilidade:', '').trim() || 'Ataque Principal', 
              cost: [this.cardData.type], 
              damage: this.cardData.attacks?.match(/\((\d+\+?x?)\)/)?.[1] || '', 
              effect: this.cardData.attacks || 'Causa dano ao Pokémon adversário.' 
            }
          ],
          weaknesses: [
            { type: this.cardData.type === 'Grama' ? 'Fogo' : (this.cardData.type === 'Fogo' ? 'Água' : 'Elétrico'), value: '×2' }
          ],
          resistances: [],
          retreat: 1,
          set: {
            name: this.cardData.set,
            cardCount: { total: 165 }
          }
        };
        return;
      }

      if (!this.cardId) return;
      this.loading = true;
      this.error = null;
      this.details = null;
      
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/pt/cards/${this.cardId}`);
        if (!res.ok) {
          throw new Error('Não foi possível obter os detalhes da carta.');
        }
        this.details = await res.json();
      } catch (err) {
        console.warn('Fallback para dados locais:', err);
        this.error = 'Não foi possível carregar os dados remotos da carta.';
      } finally {
        this.loading = false;
      }
    },
    adjustQuantity(change) {
      const newQty = this.quantityOwned + change;
      if (newQty < 0) return;
      this.$emit('update-quantity', { cardId: this.cardId, quantity: newQty });
    },
    getTypeColor(typeName) {
      if (!typeName) return '#3b82f6';
      const map = {
        'Grama': '#10b981',
        'Planta': '#10b981',
        'Grass': '#10b981',
        'Fogo': '#ef4444',
        'Fire': '#ef4444',
        'Água': '#3b82f6',
        'Water': '#3b82f6',
        'Raio': '#eab308',
        'Elétrico': '#eab308',
        'Lightning': '#eab308',
        'Psíquico': '#a855f7',
        'Psychic': '#a855f7',
        'Luta': '#f97316',
        'Lutador': '#f97316',
        'Fighting': '#f97316',
        'Escuro': '#475569',
        'Sombrio': '#475569',
        'Darkness': '#475569',
        'Metal': '#94a3b8',
        'Dragão': '#d97706',
        'Dragon': '#d97706',
        'Incolor': '#64748b',
        'Colorless': '#64748b'
      };
      return map[typeName] || '#3b82f6';
    },
    onImageError(e) {
      e.target.src = 'https://assets.tcgdex.net/en/swsh/swsh1/1/high.webp';
    }
  }
};
</script>

<style scoped>
/* CONTAINER DO MODAL COM TAMANHO CONTROLADO E SCROLL */
.modal-content-container {
  width: 95%;
  max-width: 860px;
  max-height: 86vh;
  overflow-y: auto;
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8);
  animation: modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

/* Scrollbar Bonita no Conteúdo do Modal */
.modal-content-container::-webkit-scrollbar {
  width: 8px;
}

.modal-content-container::-webkit-scrollbar-track {
  background: #090e16;
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
}

.modal-content-container::-webkit-scrollbar-thumb {
  background: var(--surface-elevated);
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.modal-content-container::-webkit-scrollbar-thumb:hover {
  background: #2a3c52;
}

/* Botão Fechar */
.close-modal-round-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  line-height: 1;
  transition: all 0.2s ease;
}

.close-modal-round-btn:hover {
  background: var(--accent-red);
  color: #ffffff;
  border-color: var(--accent-red);
  transform: scale(1.08);
}

.modal-loading, .modal-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  gap: 16px;
  color: var(--text-secondary);
  padding: 30px;
}

.spinner-large {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.08);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

.error-icon {
  font-size: 2.5rem;
}

/* CORPO DO MODAL EM DUAS COLUNAS */
.modal-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  padding: 24px;
}

@media (max-width: 820px) {
  .modal-body {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 20px;
  }
  .modal-left {
    max-width: 280px;
    margin: 0 auto;
    width: 100%;
  }
}

/* COLUNA ESQUERDA: CARTA E CONTROLE */
.modal-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.high-res-card-box {
  width: 100%;
  aspect-ratio: 240 / 330;
  max-height: 350px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #172231 0%, #080c12 100%);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.high-res-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.7));
  border-radius: 4px;
}

.card-image-placeholder-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.pokeball-icon-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #3b82f6;
  background: #131b26;
}

/* Painel de Coleção */
.collection-controls-panel {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

.collection-controls-panel h4 {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.collection-status-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding: 8px;
  background: #0d131c;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  text-align: center;
}

.collection-status-info.empty-collection {
  color: var(--text-muted);
}

.qty-highlight {
  color: var(--accent-green);
  font-weight: 800;
}

.val-highlight {
  color: var(--accent-amber);
}

.control-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.modal-action-btn {
  padding: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.btn-add-modal {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-add-modal:hover {
  background: var(--accent-green);
  color: #fff;
}

.btn-remove-modal {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-remove-modal:hover:not(:disabled) {
  background: var(--accent-red);
  color: #fff;
}

.btn-remove-modal:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.wishlist-btn-modal {
  grid-column: span 2;
  padding: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.wishlist-btn-modal.is-active-wish {
  background: rgba(245, 158, 11, 0.2);
  border-color: var(--accent-amber);
  color: var(--accent-amber);
}

/* COLUNA DIREITA: DADOS E ATRIBUTOS */
.modal-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header-info {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}

.meta-tags-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  margin-bottom: 4px;
}

.set-meta-tag {
  color: var(--text-secondary);
}

.rarity-meta-tag {
  color: var(--accent-amber);
  font-weight: 700;
}

.stage-tag {
  background: var(--surface-elevated);
  padding: 1px 6px;
  border-radius: 4px;
  color: #93c5fd;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.card-name {
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.hp-badge {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--accent-green);
}

/* Tipo */
.attributes-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.attr-label {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.type-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.74rem;
  font-weight: 700;
  color: #ffffff;
}

/* Regra */
.rule-box {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.45;
  border-left: 3px solid var(--accent-blue);
  background: #0f1622;
}

/* Seção de Ataques */
.section-heading {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.attack-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  margin-bottom: 8px;
  background: #0f1622;
}

.attack-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.attack-cost {
  display: flex;
  gap: 4px;
}

.energy-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.attack-name {
  font-weight: 700;
  font-size: 0.9rem;
  flex: 1;
}

.attack-damage {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent-amber);
}

.attack-effect {
  font-size: 0.76rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Matchups */
.matchups-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: #0f1622;
}

.matchup-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.matchup-list {
  display: flex;
  gap: 4px;
}

.matchup-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  font-weight: 600;
}

.energy-dot-mini {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.empty-val {
  color: var(--text-muted);
  font-size: 0.76rem;
}

/* Pricing Section */
.pricing-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rate-badge {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 580px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}

.price-card {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: #0f1622;
}

.price-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.price-ref-tag {
  color: var(--text-muted);
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.78rem;
}

.price-label {
  color: var(--text-secondary);
}

.price-val-brl {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--accent-amber);
  font-size: 0.95rem;
}

.price-val-original {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.availability-tag {
  color: var(--accent-green);
  font-weight: 600;
  font-size: 0.72rem;
}

/* Links */
.market-links-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.btn-market-link {
  flex: 1;
  min-width: 140px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.18s ease;
}

.ligapokemon-btn {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.ligapokemon-btn:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: var(--accent-green);
}

.tcgplayer-btn {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tcgplayer-btn:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: var(--accent-blue);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
