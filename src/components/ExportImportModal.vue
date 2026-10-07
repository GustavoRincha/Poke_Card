<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="glass-panel export-modal-container" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>

      <div class="export-header">
        <h2>📦 Importar & Exportar Coleção</h2>
        <p class="export-subtitle">
          Faça backup da sua coleção, compartilhe com amigos ou sincronize com o Pokémon TCG Live / Excel.
        </p>
      </div>

      <!-- Abas Internas: Exportar / Importar -->
      <div class="modal-tabs">
        <button 
          class="modal-tab-btn" 
          :class="{ active: currentTab === 'export' }"
          @click="currentTab = 'export'"
        >
          📤 Exportar
        </button>
        <button 
          class="modal-tab-btn" 
          :class="{ active: currentTab === 'import' }"
          @click="currentTab = 'import'"
        >
          📥 Importar
        </button>
      </div>

      <!-- Aba 1: Exportar -->
      <div v-if="currentTab === 'export'" class="tab-content">
        <div class="export-options-grid">
          <!-- Opção 1: CSV para Excel -->
          <div class="export-option-card glass-panel">
            <div class="option-icon">📊</div>
            <div class="option-info">
              <h4>Planilha Excel / CSV</h4>
              <p>Lista com Nome, ID, Coleção, Quantidade e Valor estimado em R$.</p>
            </div>
            <button @click="exportCSV" class="btn btn-primary btn-sm">
              Baixar .CSV
            </button>
          </div>

          <!-- Opção 2: JSON Backup Completo -->
          <div class="export-option-card glass-panel">
            <div class="option-icon">💾</div>
            <div class="option-info">
              <h4>Backup Completo (JSON)</h4>
              <p>Arquivo para restauração com todos os metadados e quantidades.</p>
            </div>
            <button @click="exportJSON" class="btn btn-secondary btn-sm">
              Baixar .JSON
            </button>
          </div>

          <!-- Opção 3: Formato TCG Live / PTCGO -->
          <div class="export-option-card glass-panel">
            <div class="option-icon">🃏</div>
            <div class="option-info">
              <h4>Formato TCG Live / PTCGO</h4>
              <p>Texto formatado pronto para importar em simuladores oficiais.</p>
            </div>
            <button @click="copyPTCGO" class="btn btn-outline-blue btn-sm">
              {{ copiedPtcgo ? '✓ Copiado!' : 'Copiar Texto' }}
            </button>
          </div>
        </div>

        <!-- Pré-visualização do texto PTCGO -->
        <div class="preview-box">
          <label>Pré-visualização da lista em texto:</label>
          <textarea 
            readonly 
            :value="generatePTCGOText()" 
            class="input-control preview-textarea"
            rows="5"
          ></textarea>
        </div>
      </div>

      <!-- Aba 2: Importar -->
      <div v-else-if="currentTab === 'import'" class="tab-content">
        <p class="import-instructions">
          Selecione um arquivo <strong>.JSON</strong> de backup previamente exportado ou cole o conteúdo no campo abaixo para mesclar com sua coleção atual:
        </p>

        <div class="import-upload-zone">
          <label class="btn btn-secondary file-input-label">
            <span>📁 Selecionar Arquivo JSON</span>
            <input type="file" accept=".json" @change="onFileSelected" style="display: none;" />
          </label>
        </div>

        <div class="form-group">
          <label for="import-json-text">Ou cole o JSON do backup aqui:</label>
          <textarea
            id="import-json-text"
            v-model="importText"
            placeholder='{"collection": { "sv03.5-199": 1 }, "wishlist": [] }'
            class="input-control import-textarea"
            rows="5"
          ></textarea>
        </div>

        <div v-if="importError" class="error-banner">
          <span>⚠️</span>
          <span>{{ importError }}</span>
        </div>

        <div v-if="importSuccess" class="success-banner">
          <span>✅</span>
          <span>{{ importSuccess }}</span>
        </div>

        <button 
          @click="handleImport" 
          class="btn btn-primary btn-full-width" 
          :disabled="!importText.trim()"
        >
          Confirmar e Mesclar com Coleção Atual
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { formatBRL, getCardEstimatedPriceBRL } from '../lib/currency.js';

export default {
  name: 'ExportImportModal',
  emits: ['close', 'import-data'],
  props: {
    collection: {
      type: Object,
      required: true
    },
    wishlist: {
      type: Array,
      default: () => []
    },
    savedCardData: {
      type: Object,
      default: () => ({})
    },
    exchangeRates: {
      type: Object,
      default: () => ({ USD: 5.20, EUR: 5.80 })
    }
  },
  data() {
    return {
      currentTab: 'export',
      copiedPtcgo: false,
      importText: '',
      importError: null,
      importSuccess: null
    };
  },
  methods: {
    generateCSV() {
      const headers = ['Nome', 'ID da Carta', 'Coleção', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)'];
      const rows = [];

      for (const [cardId, qty] of Object.entries(this.collection)) {
        if (qty > 0) {
          const card = this.savedCardData[cardId] || {};
          const name = (card.name || cardId).replace(/"/g, '""');
          const localId = card.localId || cardId.split('-')[1] || '';
          const setId = cardId.split('-')[0].toUpperCase();
          const unitPrice = getCardEstimatedPriceBRL(card, this.exchangeRates) || 0;
          const totalPrice = unitPrice * qty;

          rows.push([
            `"${name}"`,
            `"${localId}"`,
            `"${setId}"`,
            qty,
            `"${unitPrice > 0 ? formatBRL(unitPrice) : '-'}"`,
            `"${totalPrice > 0 ? formatBRL(totalPrice) : '-'}"`
          ].join(','));
        }
      }

      return [headers.join(','), ...rows].join('\n');
    },
    exportCSV() {
      const csv = this.generateCSV();
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pokecard_colecao_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    exportJSON() {
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        collection: this.collection,
        wishlist: this.wishlist,
        savedCardData: this.savedCardData
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pokecard_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    generatePTCGOText() {
      const lines = [];
      for (const [cardId, qty] of Object.entries(this.collection)) {
        if (qty > 0) {
          const card = this.savedCardData[cardId] || {};
          const name = card.name || 'Pokémon';
          const localId = card.localId || cardId.split('-')[1] || '1';
          const setTag = cardId.split('-')[0].toUpperCase();
          lines.push(`${qty} ${name} ${setTag} ${localId}`);
        }
      }
      return lines.join('\n');
    },
    async copyPTCGO() {
      const text = this.generatePTCGOText();
      try {
        await navigator.clipboard.writeText(text);
        this.copiedPtcgo = true;
        setTimeout(() => {
          this.copiedPtcgo = false;
        }, 2000);
      } catch (err) {
        console.warn('Erro ao copiar:', err);
      }
    },
    onFileSelected(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        this.importText = evt.target.result || '';
      };
      reader.readAsText(file);
    },
    handleImport() {
      this.importError = null;
      this.importSuccess = null;

      try {
        const parsed = JSON.parse(this.importText);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato JSON inválido.');
        }

        const newCollection = parsed.collection || {};
        const newWishlist = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
        const newMetadata = parsed.savedCardData || {};

        this.$emit('import-data', {
          collection: newCollection,
          wishlist: newWishlist,
          savedCardData: newMetadata
        });

        this.importSuccess = 'Coleção importada e sincronizada com sucesso!';
        setTimeout(() => {
          this.$emit('close');
        }, 1500);
      } catch (err) {
        this.importError = 'Arquivo ou texto JSON inválido. Verifique a estrutura informada.';
      }
    }
  }
};
</script>

<style scoped>
.export-modal-container {
  width: 100%;
  max-width: 600px;
  padding: 32px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  border: 1px solid var(--border-color-hover);
  animation: modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  z-index: 10;
  line-height: 1;
}

.close-btn:hover {
  color: var(--accent-red);
}

.export-header {
  margin-bottom: 20px;
}

.export-header h2 {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.export-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.modal-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.modal-tab-btn {
  background: transparent;
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: var(--font-display);
  transition: all 0.2s;
}

.modal-tab-btn.active {
  background: var(--bg-tertiary);
  color: var(--accent-red);
  border-color: var(--border-color);
}

.export-options-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.export-option-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.option-icon {
  font-size: 1.8rem;
}

.option-info {
  flex: 1;
}

.option-info h4 {
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.option-info p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.3;
}

.preview-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-box label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.preview-textarea, .import-textarea {
  font-family: monospace;
  font-size: 0.8rem;
  resize: vertical;
}

.import-instructions {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.import-upload-zone {
  margin-bottom: 16px;
}

.file-input-label {
  cursor: pointer;
}

.btn-full-width {
  width: 100%;
  margin-top: 12px;
}

.error-banner, .success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 10px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.success-banner {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}
</style>
