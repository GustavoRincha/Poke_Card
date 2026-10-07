<template>
  <div class="glass-panel filters-sidebar">
    <div class="filters-header">
      <h2>Filtros</h2>
      <button @click="resetFilters" class="btn btn-secondary btn-sm">Limpar</button>
    </div>

    <!-- Filtro por Nome -->
    <div class="form-group">
      <div class="label-with-action">
        <label for="search-name">Nome do Pokémon</label>
        <button 
          type="button" 
          @click="$emit('open-scanner')" 
          class="btn-scanner-shortcut"
          title="Escanear carta com a câmera do celular"
        >
          📷 Câmera IA
        </button>
      </div>
      <div class="search-input-wrapper">
        <input 
          id="search-name"
          v-model="filters.name"
          @input="onInputDebounce"
          @keyup.enter="emitFiltersImmediately"
          type="text" 
          placeholder="Ex: Charizard, Pikachu..." 
          class="input-control"
        />
      </div>
    </div>

    <!-- Filtro por ID -->
    <div class="form-group">
      <label for="search-id">ID do Card (Série/ID)</label>
      <div class="search-input-wrapper">
        <input 
          id="search-id"
          v-model="filters.cardId"
          @input="handleCardIdInput"
          @keyup.enter="emitFiltersImmediately"
          type="text" 
          placeholder="Ex: sv03.5/25 ou swsh1-1" 
          class="input-control"
        />
      </div>
    </div>

    <!-- Filtro por Categoria -->
    <div class="form-group">
      <label for="filter-category">Categoria</label>
      <select 
        id="filter-category"
        v-model="filters.category"
        @change="emitFilters"
        class="input-control"
      >
        <option value="">Todas as Categorias</option>
        <option value="Pokémon">Pokémon</option>
        <option value="Treinador">Treinador (Trainer)</option>
        <option value="Energia">Energia (Energy)</option>
      </select>
    </div>

    <!-- Filtro por Tipo -->
    <div class="form-group">
      <label for="filter-type">Tipo / Elemento</label>
      <select 
        id="filter-type"
        v-model="filters.type"
        @change="emitFilters"
        class="input-control"
      >
        <option value="">Todos os Tipos</option>
        <option v-for="type in types" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Filtro por Raridade -->
    <div class="form-group">
      <label for="filter-rarity">Raridade</label>
      <select 
        id="filter-rarity"
        v-model="filters.rarity"
        @change="emitFilters"
        class="input-control"
      >
        <option value="">Todas as Raridades</option>
        <option v-for="rarity in rarities" :key="rarity" :value="rarity">
          {{ rarity }}
        </option>
      </select>
    </div>

    <!-- Filtro por Coleção -->
    <div class="form-group">
      <label for="filter-set">Coleção / Expansão</label>
      <select 
        id="filter-set"
        v-model="filters.setId"
        @change="emitFilters"
        class="input-control"
      >
        <option value="">Todas as Coleções</option>
        <option v-for="set in sortedSets" :key="set.id" :value="set.id">
          {{ set.name }} ({{ set.cardCount.total }} cards)
        </option>
      </select>
    </div>

    <!-- Ordenação das Cartas -->
    <div class="form-group">
      <label for="filter-sort">Ordenar por</label>
      <select 
        id="filter-sort"
        v-model="filters.sortBy"
        @change="emitFilters"
        class="input-control"
      >
        <option value="default">Padrão da Coleção</option>
        <option value="price_desc">💰 Maior Valor (R$)</option>
        <option value="price_asc">💵 Menor Valor (R$)</option>
        <option value="name_asc">Nome (A-Z)</option>
        <option value="name_desc">Nome (Z-A)</option>
        <option value="type">Tipo (Elemento)</option>
        <option value="stage">Estágio de Evolução</option>
        <option value="quantity">Quantidade (Maior primeiro)</option>
      </select>
    </div>

    <div class="api-status" v-if="loading">
      <span class="spinner-small"></span>
      Carregando filtros da API...
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardFilters',
  emits: ['filter-change', 'open-scanner'],
  props: {
    currentFilters: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    currentFilters: {
      deep: true,
      handler(newVal) {
        if (newVal) {
          this.filters = { ...this.filters, ...newVal };
        }
      }
    }
  },
  data() {
    return {
      filters: {
        name: '',
        cardId: '',
        category: '',
        type: '',
        rarity: '',
        setId: '',
        sortBy: 'default'
      },
      types: [],
      rarities: [],
      sets: [],
      loading: false,
      debounceTimeout: null,
      prevCardIdLength: 0
    };
  },
  computed: {
    sortedSets() {
      // Ordena as coleções em ordem alfabética para facilitar a busca
      return [...this.sets].sort((a, b) => a.name.localeCompare(b.name));
    }
  },
  mounted() {
    this.fetchFilterData();
  },
  methods: {
    async fetchFilterData() {
      this.loading = true;
      try {
        const [typesRes, raritiesRes, setsRes] = await Promise.all([
          fetch('https://api.tcgdex.net/v2/pt/types'),
          fetch('https://api.tcgdex.net/v2/pt/rarities'),
          fetch('https://api.tcgdex.net/v2/pt/sets')
        ]);

        const typesData = await typesRes.json();
        const raritiesData = await raritiesRes.json();
        const setsData = await setsRes.json();

        // Filtra raridades nulas ou vazias
        this.types = typesData.filter(t => t);
        this.rarities = raritiesData.filter(r => r && r !== 'None');
        // Filtra sets que tenham cartas válidas
        this.sets = setsData.filter(s => s && s.name && s.cardCount && s.cardCount.total > 0);
      } catch (err) {
        console.error('Erro ao buscar metadados dos filtros:', err);
      } finally {
        this.loading = false;
      }
    },
    handleCardIdInput() {
      let value = this.filters.cardId || '';
      
      // Se o usuário digitou exatamente 3 dígitos numéricos no início
      if (/^\d{3}$/.test(value)) {
        // Só adiciona a barra se estiver inserindo texto (para não atrapalhar o backspace)
        if (value.length > this.prevCardIdLength) {
          value = value + '/';
          this.filters.cardId = value;
        }
      }
      
      this.prevCardIdLength = value.length;
      this.onInputDebounce();
    },
    onInputDebounce() {
      // Debounce para não disparar requisições na API a cada tecla digitada
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.emitFilters();
      }, 400);
    },
    emitFiltersImmediately() {
      clearTimeout(this.debounceTimeout);
      this.emitFilters();
    },
    emitFilters() {
      this.$emit('filter-change', { ...this.filters });
    },
    resetFilters() {
      this.filters.name = '';
      this.filters.cardId = '';
      this.filters.category = '';
      this.filters.type = '';
      this.filters.rarity = '';
      this.filters.setId = '';
      this.filters.sortBy = 'default';
      this.emitFiltersImmediately();
    }
  }
};
</script>

<style scoped>
.filters-sidebar {
  padding: 28px;
  height: fit-content;
  position: sticky;
  top: 104px; /* Ajustado para dar espaço ao header flutuante */
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(18, 20, 28, 0.7) 0%, rgba(10, 11, 14, 0.7) 100%);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 14px;
}

.filters-header h2 {
  font-size: 1.4rem;
  color: var(--text-primary);
  font-family: var(--font-display);
}

.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 16px;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.label-with-action label {
  margin-bottom: 0;
}

.btn-scanner-shortcut {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-scanner-shortcut:hover {
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.5);
}

@media (max-width: 968px) {
  .filters-sidebar {
    position: static;
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 0;
    border-radius: 0;
  }
  
  .filters-header h2 {
    display: none;
  }
  
  .filters-header {
    justify-content: flex-end;
    margin-bottom: 16px;
    border-bottom: none;
    padding-bottom: 0;
  }
}
</style>
