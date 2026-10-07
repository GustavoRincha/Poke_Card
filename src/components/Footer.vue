<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-left">
        <div class="footer-logo">
          <svg viewBox="0 0 24 24" width="18" height="18" class="pokeball-small">
            <circle cx="12" cy="12" r="10" fill="#131b26" stroke="#3b82f6" stroke-width="1.8" />
            <path d="M 2 12 A 10 10 0 0 1 22 12 Z" fill="#ef4444" />
            <path d="M 2 12 A 10 10 0 0 0 22 12 Z" fill="#f8fafc" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="#0b0f17" stroke-width="2" />
            <circle cx="12" cy="12" r="3.5" fill="#0b0f17" />
            <circle cx="12" cy="12" r="2" fill="#f8fafc" />
          </svg>
          <span class="footer-brand">PokéCard Coleção TCG</span>
        </div>
        <p class="footer-copy">
          © 2024 PokéCard Hub. Dados e valores de mercado de fontes públicas de TCG.
        </p>
      </div>

      <div class="footer-right">
        <a href="#privacidade" @click.prevent class="footer-link">Privacidade</a>
        <span class="link-sep">•</span>
        <a href="#termos" @click.prevent class="footer-link">Termos de Serviço</a>
        <span class="link-sep">•</span>
        <a href="#api" @click.prevent class="footer-link">API TCG</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 48px;
  background: #090d14;
  border-top: 1px solid var(--border-subtle);
  padding: 24px 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.footer-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-brand {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-main);
}

.footer-copy {
  color: var(--text-muted);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: var(--text-main);
  text-decoration: underline;
}

.link-sep {
  color: var(--text-muted);
}
</style>
