<template>
  <div class="catalog-header-section">
    <div class="header-left-col">
      <!-- Tag Base de Dados PokéCard -->
      <div class="db-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
        <span>BASE DE DADOS POKÉCARD</span>
      </div>

      <!-- Título Principal -->
      <h1 class="catalog-title">Catálogo de Cartas Pokémon TCG</h1>

      <!-- Subtítulo Informativo -->
      <p class="catalog-subtitle">
        Exibindo <span class="highlight-number">{{ displayedCount }}</span> de <span class="highlight-number">{{ totalCount }}</span> cartas encontradas nos parâmetros ativos.
      </p>
    </div>

    <!-- Controles do Dashboard -->
    <div class="header-right-col">
      <!-- Primeira Linha de Controles: Visualização e Ordenação -->
      <div class="controls-row-top">
        <!-- Alternador de Visualização -->
        <div class="view-switcher-group" role="group" aria-label="Modo de Exibição">
          <button 
            type="button"
            class="view-btn" 
            :class="{ active: currentView === 'grid' }"
            @click="$emit('change-view', 'grid')"
            title="Visualização em Grade (Cards TCG)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Grade</span>
          </button>

          <button 
            type="button"
            class="view-btn" 
            :class="{ active: currentView === 'list' }"
            @click="$emit('change-view', 'list')"
            title="Visualização em Lista Financeira (Tabela)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>Lista</span>
          </button>

          <button 
            type="button"
            class="view-btn" 
            :class="{ active: currentView === 'binder' }"
            @click="$emit('change-view', 'binder')"
            title="Visualização em Fichário / Pasta Ultra-Pro"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Fichário</span>
          </button>
        </div>

        <!-- Dropdown de Ordenação -->
        <div class="sort-select-wrapper">
          <select 
            :value="sortBy" 
            @change="$emit('update:sortBy', $event.target.value)" 
            class="sort-select"
            aria-label="Critério de Ordenação"
          >
            <option value="popular">Mais Populares & Meta</option>
            <option value="price_asc">Menor Preço TCG (R$)</option>
            <option value="price_desc">Maior Preço TCG (R$)</option>
            <option value="gainers">Maior Valorização (%)</option>
            <option value="hp_desc">Maior HP</option>
            <option value="name_asc">Nome (A-Z)</option>
            <option value="name_desc">Nome (Z-A)</option>
          </select>
        </div>
      </div>

      <!-- Segunda Linha de Controles: Exportar e Comparar -->
      <div class="controls-row-bottom">
        <button 
          type="button"
          class="btn-control btn-export" 
          @click="$emit('export-csv')"
          title="Exportar dados do catálogo em planilha .CSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Exportar (.csv)</span>
        </button>

        <button 
          type="button"
          class="btn-control btn-compare" 
          :class="{ 'has-cards': compareCount > 0 }"
          @click="$emit('open-compare')"
          title="Abrir painel comparativo de cartas"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M16 3h5v5"></path>
            <path d="M4 20L21 3"></path>
            <path d="M21 16v5h-5"></path>
            <path d="M15 15l6 6"></path>
            <path d="M4 4l5 5"></path>
          </svg>
          <span>Comparar ({{ compareCount }})</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  displayedCount: { type: Number, default: 24 },
  totalCount: { type: Number, default: 1482 },
  currentView: { type: String, default: 'grid' },
  sortBy: { type: String, default: 'popular' },
  compareCount: { type: Number, default: 0 }
});

defineEmits(['change-view', 'update:sortBy', 'export-csv', 'open-compare']);
</script>

<style scoped>
.catalog-header-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 0 20px 0;
  border-bottom: 1px solid rgba(36, 52, 71, 0.4);
  flex-wrap: wrap;
}

.header-left-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.db-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #38bdf8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.catalog-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.catalog-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.highlight-number {
  color: #ffffff;
  font-weight: 700;
}

/* Coluna Direita com Controles */
.header-right-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.controls-row-top,
.controls-row-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Switcher de Visualização */
.view-switcher-group {
  display: inline-flex;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.view-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.view-btn.active {
  background: var(--surface-elevated);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Select de Ordenação */
.sort-select-wrapper {
  position: relative;
}

.sort-select {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 34px 8px 14px;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
  transition: all 0.2s ease;
}

.sort-select:hover {
  background-color: #243347;
  border-color: #3b506b;
}

.sort-select:focus {
  border-color: var(--accent-blue);
}

/* Botões Exportar e Comparar */
.btn-control {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-control:hover {
  background: var(--surface-elevated);
  border-color: #3b506b;
  transform: translateY(-1px);
}

.btn-compare.has-cards {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-blue);
  color: #93c5fd;
}

@media (max-width: 900px) {
  .catalog-header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right-col {
    align-items: flex-start;
    width: 100%;
  }
  .controls-row-top,
  .controls-row-bottom {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
