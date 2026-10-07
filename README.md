# ⚡ PokéCard — Coleção & Mercado TCG

<p align="center">
  <img src="public/pwa-192x192.png" alt="PokéCard Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>Gerenciador completo de cartas Pokémon TCG com Scanner de IA Multimodal, PWA Offline-First e Sincronização em Nuvem.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-Vision_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PWA-Ready-FF5722?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License MIT" />
</p>

---

## 🌟 Destaques do Projeto

* 📷 **Scanner Inteligente com IA Multimodal (Google Gemini):** Aponte a câmera do celular para uma carta real de Pokémon. O app analisa a imagem em tempo real, enquadra a carta e extrai nome, numeração e coleção automaticamente com fallback para busca no banco de dados TCGdex.
* ⚡ **Auto-Scan com Estabilidade:** Medição contínua de luminância e detecção de enquadramento estável da carta, disparando o reconhecimento sem precisar tocar na tela.
* 📴 **PWA Offline-First com IndexedDB:** Armazenamento seguro de metadados em cache local via IndexedDB (superando o limite de 5MB do `localStorage`), permitindo navegar pela sua coleção mesmo sem sinal de internet.
* ☁️ **Sincronização em Nuvem (Supabase):** Autenticação segura por e-mail ou nome de usuário, salvando a coleção e a lista de desejos em tempo real com **Row Level Security (RLS)** ativo.
* 📈 **Mercado & Cotações em Tempo Real:** Conversão de valores em USD (TCGPlayer) e EUR (Cardmarket) para BRL via AwesomeAPI com cache de 30 minutos, além de links rápidos para a LigaPokémon.
* ✨ **Holografia Interativa 3D:** Cartas com simulação de inclinação tridimensional e reflexo de brilho holográfico reagindo ao movimento do mouse ou toque.
* 📊 **Comparador de Cartas & Exportação:** Compare até 4 cartas lado a lado e exporte toda a sua coleção filtrada para planilha **CSV** com um clique.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** [Vue 3](https://vuejs.org/) (Composition API & `<script setup>`)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **PWA:** [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) com Workbox
* **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL com RLS)
* **Inteligência Artificial:** [Google Generative AI](https://aistudio.google.com/) (Gemini 1.5 Flash / 2.0 Flash)
* **APIs Públicas Integradas:**
  * [TCGdex API](https://tcgdex.dev/) (Catálogo oficial em Português)
  * [AwesomeAPI](https://docs.awesomeapi.com.br/) (Cotações de câmbio USD/EUR -> BRL)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar o repositório
```bash
git clone https://github.com/GustavoRincha/PokeCard.git
cd PokeCard
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Abra o `.env` e configure suas chaves:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Opcional (o usuário também pode inserir sua própria chave diretamente na interface do app):
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
```

> **Dica para o Scanner com Câmera:** A API de câmera dos navegadores exige conexão segura (**HTTPS** ou `localhost`). O projeto já vem configurado com `@vitejs/plugin-basic-ssl` para gerar HTTPS automaticamente durante o desenvolvimento local.

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `https://localhost:5173` no seu navegador.

---

## 🗄️ Configuração do Banco de Dados (Supabase)

Para habilitar login, cadastro de treinadores e sincronização da coleção:

1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/).
2. Vá até a aba **SQL Editor**.
3. Copie e cole todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql).
4. Clique em **Run**.

O script configurará:
* Tabela `profiles` com sincronização automática de usuários
* Tabelas `collections` e `wishlists` com chaves estrangeiras e índices
* Políticas rigorosas de **Row Level Security (RLS)**
* Função RPC `get_email_by_username` para permitir login por nome de usuário

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com hot-reload e HTTPS |
| `npm run build` | Compila os arquivos para produção na pasta `dist/` |
| `npm run preview` | Pré-visualiza localmente a versão gerada em `dist/` |

---

## 📄 Licença

Este projeto está sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido por <strong>Gustavo Rincha</strong>
</p>
