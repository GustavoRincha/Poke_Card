<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- ESQUERDA: Logo PokéCard Coleção TCG -->
      <div class="header-brand" @click="$emit('nav', 'search')" role="button" tabindex="0">
        <div class="pokeball-badge">
          <svg viewBox="0 0 40 40" class="pokeball-svg">
            <circle cx="20" cy="20" r="18" fill="#131b26" stroke="#3b82f6" stroke-width="2.5" />
            <path d="M 2 20 A 18 18 0 0 1 38 20 Z" fill="#ef4444" />
            <path d="M 2 20 A 18 18 0 0 0 38 20 Z" fill="#f8fafc" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="#0b0f17" stroke-width="3" />
            <circle cx="20" cy="20" r="6" fill="#0b0f17" stroke="#0b0f17" stroke-width="1.5" />
            <circle cx="20" cy="20" r="3.5" fill="#f8fafc" />
            <circle cx="20" cy="20" r="1.5" fill="#3b82f6" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">PokéCard</span>
          <span class="brand-subtitle">COLEÇÃO TCG</span>
        </div>
      </div>

      <!-- MENU DE NAVEGAÇÃO -->
      <nav class="header-nav">
        <button 
          class="nav-link" 
          :class="{ active: currentTab === 'search' }"
          @click="$emit('nav', 'search')"
        >
          Buscar Cartas
        </button>
        <button 
          class="nav-link" 
          :class="{ active: currentTab === 'collection' }"
          @click="$emit('nav', 'collection')"
        >
          Minha Coleção
          <span class="nav-count" v-if="collectionCount > 0">{{ collectionCount }}</span>
        </button>
        <button 
          class="nav-link" 
          :class="{ active: currentTab === 'wishlist' }"
          @click="$emit('nav', 'wishlist')"
        >
          Lista de Desejos
          <span class="nav-count" v-if="wishlistCount > 0">{{ wishlistCount }}</span>
        </button>
        <button 
          class="nav-link" 
          :class="{ active: currentTab === 'decks' }"
          @click="$emit('nav', 'decks')"
        >
          Baralhos/Decks
        </button>
        <button 
          class="nav-link" 
          :class="{ active: currentTab === 'market' }"
          @click="$emit('open-market-report')"
        >
          Mercado TCG
        </button>
      </nav>

      <!-- DIREITA: Ações de Busca, IA, Notificações e Perfil -->
      <div class="header-actions">
        <!-- Botão Busca Rápida -->
        <button 
          class="action-icon-btn" 
          @click="$emit('focus-search')" 
          title="Buscar no Catálogo (Ctrl+K)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <!-- Botão Azul Destaque: Escanear Carta (IA) -->
        <button 
          class="btn-scan-ai" 
          @click="$emit('open-scanner')"
          title="Escanear carta física com Inteligência Artificial"
        >
          <span class="scan-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </span>
          <span class="scan-label">Escanear Carta (IA)</span>
        </button>

        <!-- Notificações -->
        <button 
          class="action-icon-btn notif-btn" 
          @click="toggleNotifications" 
          title="Alertas de Mercado e Variação"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notif-dot"></span>
        </button>

        <!-- Treinador / Perfil -->
        <div class="user-profile-chip" @click="$emit('open-auth')" role="button" tabindex="0">
          <div class="avatar-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="profile-info">
            <span class="trainer-title">{{ userName || 'Treinador' }}</span>
            <span class="trainer-status">{{ isLogged ? 'Minha Conta' : 'Entrar / Perfil' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dropdown de Notificações Rápidas -->
    <div v-if="showNotifDropdown" class="notif-popover glass-panel">
      <div class="notif-header">
        <h4>Alertas de Mercado TCG</h4>
        <span class="badge-live">Tempo Real</span>
      </div>
      <div class="notif-list">
        <div class="notif-item">
          <span class="notif-badge up">📈 +18.4%</span>
          <div class="notif-details">
            <p><strong>Snivy & Meowscarada</strong> em alta de liquidez nesta semana.</p>
            <small>há 12 min</small>
          </div>
        </div>
        <div class="notif-item">
          <span class="notif-badge up">🔥 +12.1%</span>
          <div class="notif-details">
            <p><strong>Charizard ex (151)</strong> atingiu R$ 640,00 no mercado BR.</p>
            <small>há 45 min</small>
          </div>
        </div>
        <div class="notif-item">
          <span class="notif-badge star">⭐ Meta</span>
          <div class="notif-details">
            <p>3 cartas da sua Lista de Desejos tiveram cotação atualizada.</p>
            <small>há 2h</small>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  currentTab: { type: String, default: 'search' },
  collectionCount: { type: Number, default: 342 },
  wishlistCount: { type: Number, default: 68 },
  isLogged: { type: Boolean, default: false },
  userName: { type: String, default: 'Treinador' }
});

const emit = defineEmits(['nav', 'focus-search', 'open-scanner', 'open-auth', 'open-market-report']);

const showNotifDropdown = ref(false);

function toggleNotifications() {
  showNotifDropdown.value = !showNotifDropdown.value;
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 76px;
  background: rgba(11, 15, 23, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  transition: all 0.2s ease;
}

.header-inner {
  max-width: 1600px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* Marca / Logo */
.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.pokeball-badge {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3));
  transition: transform 0.3s ease;
}

.header-brand:hover .pokeball-badge {
  transform: rotate(25deg) scale(1.05);
}

.pokeball-svg {
  width: 100%;
  height: 100%;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.brand-subtitle {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

/* Menu de Navegação */
.header-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.04);
}

.nav-link.active {
  color: #ffffff;
  font-weight: 600;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.nav-count {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  font-weight: 600;
}

/* Ações à Direita */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.action-icon-btn:hover {
  background: var(--surface-elevated);
  color: var(--text-main);
  border-color: #33475e;
}

.notif-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  background: var(--accent-red);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--accent-red);
}

/* Botão Escanear Carta IA (Azul proeminente) */
.btn-scan-ai {
  background: var(--accent-blue);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 14px rgba(59, 130, 246, 0.35);
  transition: all 0.22s ease;
}

.btn-scan-ai:hover {
  background: var(--accent-blue-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
}

.btn-scan-ai:active {
  transform: translateY(0);
}

.scan-icon {
  display: flex;
  align-items: center;
}

/* Chip do Treinador */
.user-profile-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-profile-chip:hover {
  background: var(--surface-elevated);
  border-color: #33475e;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.trainer-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.1;
}

.trainer-status {
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.1;
}

/* Popover Notificações */
.notif-popover {
  position: absolute;
  top: 82px;
  right: 24px;
  width: 340px;
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  z-index: 101;
  animation: popIn 0.2s ease;
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.notif-header h4 {
  font-size: 0.88rem;
  font-weight: 700;
}

.badge-live {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent-green);
  background: var(--accent-green-subtle);
  padding: 2px 6px;
  border-radius: 4px;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notif-item {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.notif-item strong {
  color: var(--text-main);
}

.notif-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  height: fit-content;
  white-space: nowrap;
}

.notif-badge.up {
  color: var(--accent-green);
  background: var(--accent-green-subtle);
}

.notif-badge.star {
  color: var(--accent-amber);
  background: var(--accent-amber-subtle);
}

.notif-details small {
  display: block;
  color: var(--text-muted);
  font-size: 0.7rem;
  margin-top: 2px;
}

/* Responsividade */
@media (max-width: 1024px) {
  .header-nav {
    display: none;
  }
}

@media (max-width: 640px) {
  .profile-info {
    display: none;
  }
  .btn-scan-ai .scan-label {
    display: none;
  }
  .btn-scan-ai {
    padding: 10px 12px;
  }
}
</style>
