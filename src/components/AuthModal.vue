<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="glass-panel auth-modal-container" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>
      
      <div class="auth-header">
        <h2>{{ isLogin ? 'Entrar no PokeCard' : 'Criar Conta' }}</h2>
        <p class="auth-subtitle">
          {{ isLogin ? 'Acesse sua coleção e lista de desejos sincronizada na nuvem' : 'Comece a sincronizar suas cartas Pokémon na nuvem grátis' }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- Erro Geral -->
        <div v-if="error" class="error-banner">
          <span>⚠️</span>
          <p>{{ error }}</p>
        </div>

        <!-- Sucesso -->
        <div v-if="success" class="success-banner">
          <span>✅</span>
          <p>{{ success }}</p>
        </div>

        <!-- Login: Campo E-mail ou Usuário -->
        <div v-if="isLogin" class="form-group">
          <label for="auth-identifier">E-mail ou Usuário</label>
          <input 
            id="auth-identifier" 
            v-model="loginIdentifier" 
            type="text" 
            placeholder="seuemail@exemplo.com ou usuario" 
            class="input-control" 
            required
            :disabled="loading"
          />
        </div>

        <!-- Cadastro: Novos campos Nome, Sobrenome, Usuário e E-mail -->
        <div v-else>
          <div class="form-row">
            <div class="form-group">
              <label for="auth-first-name">Nome</label>
              <input 
                id="auth-first-name" 
                v-model="firstName" 
                type="text" 
                placeholder="Ex: João" 
                class="input-control" 
                required
                :disabled="loading"
              />
            </div>
            <div class="form-group">
              <label for="auth-last-name">Sobrenome</label>
              <input 
                id="auth-last-name" 
                v-model="lastName" 
                type="text" 
                placeholder="Ex: Silva" 
                class="input-control" 
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="auth-username">Nome de Usuário</label>
            <input 
              id="auth-username" 
              v-model="username" 
              type="text" 
              placeholder="Ex: joaosilva" 
              class="input-control" 
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="auth-email">E-mail</label>
            <input 
              id="auth-email" 
              v-model="email" 
              type="email" 
              placeholder="seuemail@exemplo.com" 
              class="input-control" 
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Campo Senha (comum para login e cadastro) -->
        <div class="form-group">
          <label for="auth-password">Senha</label>
          <input 
            id="auth-password" 
            v-model="password" 
            type="password" 
            placeholder="No mínimo 6 caracteres" 
            class="input-control" 
            required
            :disabled="loading"
          />
        </div>

        <!-- Confirmação de Senha (apenas cadastro) -->
        <div v-if="!isLogin" class="form-group">
          <label for="auth-confirm-password">Confirmar Senha</label>
          <input 
            id="auth-confirm-password" 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Digite a senha novamente" 
            class="input-control" 
            required
            :disabled="loading"
          />
        </div>

        <!-- Botão de Envio -->
        <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner-small"></span>
          <span>{{ loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar') }}</span>
        </button>
      </form>

      <!-- Alternador de Modo -->
      <div class="auth-toggle">
        <p>
          {{ isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isLogin ? 'Cadastre-se agora' : 'Faça login' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabaseClient';

export default {
  name: 'AuthModal',
  data() {
    return {
      isLogin: true,
      loginIdentifier: '', // email ou username
      email: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null,
      success: null
    };
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin;
      this.error = null;
      this.success = null;
      this.loginIdentifier = '';
      this.email = '';
      this.firstName = '';
      this.lastName = '';
      this.username = '';
      this.password = '';
      this.confirmPassword = '';
    },
    async handleSubmit() {
      this.error = null;
      this.success = null;
      
      // Validação rápida
      if (!this.isLogin && this.password !== this.confirmPassword) {
        this.error = 'As senhas não coincidem!';
        return;
      }
      if (this.password.length < 6) {
        this.error = 'A senha deve conter no mínimo 6 caracteres.';
        return;
      }
      if (!this.isLogin && !/^[a-zA-Z0-9_.-]+$/.test(this.username)) {
        this.error = 'O nome de usuário só pode conter letras, números, sublinhados, pontos ou hifens.';
        return;
      }

      this.loading = true;

      try {
        if (this.isLogin) {
          // Login
          let emailToAuth = this.loginIdentifier.trim();
          
          // Se não contiver '@', assumimos que é nome de usuário e buscamos o e-mail correspondente via RPC
          if (!emailToAuth.includes('@')) {
            const { data: fetchedEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
              username_input: emailToAuth
            });
            
            if (rpcError) throw rpcError;
            if (!fetchedEmail) {
              throw new Error('Credenciais de login inválidas.');
            }
            emailToAuth = fetchedEmail;
          }

          const { error } = await supabase.auth.signInWithPassword({
            email: emailToAuth,
            password: this.password
          });
          if (error) throw error;
          
          this.$emit('auth-success');
          this.$emit('close');
        } else {
          // Cadastro
          const { error } = await supabase.auth.signUp({
            email: this.email,
            password: this.password,
            options: {
              data: {
                first_name: this.firstName.trim(),
                last_name: this.lastName.trim(),
                username: this.username.trim().toLowerCase()
              }
            }
          });
          if (error) throw error;
          
          this.success = 'Cadastro realizado! Se o Supabase exigir confirmação de e-mail, verifique sua caixa de entrada para ativar a conta.';
          this.email = '';
          this.firstName = '';
          this.lastName = '';
          this.username = '';
          this.password = '';
          this.confirmPassword = '';
        }
      } catch (err) {
        console.error('Erro de autenticação:', err);
        // Traduz mensagens comuns
        if (err.message.includes('profiles_username_key') || (err.message.includes('unique constraint') && err.message.includes('username'))) {
          this.error = 'Este nome de usuário já está em uso. Por favor, escolha outro.';
        } else if (err.message === 'Invalid login credentials' || err.message === 'Credenciais de login inválidas.') {
          this.error = 'Usuário, e-mail ou senha inválidos.';
        } else if (err.message === 'User already registered') {
          this.error = 'Este e-mail já está cadastrado.';
        } else {
          this.error = err.message || 'Ocorreu um erro. Tente novamente.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.auth-modal-container {
  width: 100%;
  max-width: 440px;
  padding: 36px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
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
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--accent-red);
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-header h2 {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  font-size: 0.95rem;
}

.error-banner, .success-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.success-banner {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.auth-toggle {
  text-align: center;
  margin-top: 24px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.auth-toggle a {
  color: var(--accent-red);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.2s;
}

.auth-toggle a:hover {
  color: #ff5757;
  text-decoration: underline;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes modalEnter {
  from {
    transform: scale(0.95) translateY(15px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
