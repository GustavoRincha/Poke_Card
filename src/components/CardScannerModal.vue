<template>
  <div class="scanner-fullscreen-root" role="dialog" aria-modal="true">
    <!-- 1. Camada de Fundo: Câmera ou Imagem Capturada em Tela Cheia -->
    <div class="camera-stage">
      <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        class="fullscreen-video"
        :class="{ 'video-hidden': capturedImage || !stream }"
      ></video>

      <!-- Foto congelada enquanto analisa ou exibe resultado -->
      <img
        v-if="capturedImage"
        :src="capturedImage"
        alt="Foto da Carta"
        class="fullscreen-video captured-image-preview"
      />

      <!-- Máscara de Enquadramento da Carta (Visível durante captura) -->
      <div v-if="!showConfigKey" class="scanner-reticle-layer" :class="{ 'analyzing-active': analyzing }">
        <div
          ref="reticleFrameRef"
          class="card-cutout-frame"
          :class="{
            'stabilizing-active': isStabilizing && autoScanEnabled,
            'locked-flash': isLocked
          }"
        >
          <!-- Cantos Dourados Estilizados -->
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>

          <!-- Barra de Progresso de Foco/Estabilidade (Auto-Scan) -->
          <div
            v-if="isStabilizing && autoScanEnabled && !analyzing"
            class="stability-progress-bar"
            :style="{ width: stabilityProgress + '%' }"
          ></div>

          <!-- Linha Laser de Varredura na Análise -->
          <div v-if="analyzing" class="laser-scanner-line"></div>

          <!-- Instrução Flutuante Central -->
          <div
            v-if="!analyzing && !detectedResult && !cameraError"
            class="reticle-hint"
            :class="{ 'hint-focused': isStabilizing && autoScanEnabled }"
          >
            <span class="hint-icon">{{ isStabilizing ? '🎯' : '🃏' }}</span>
            <span>
              {{
                isStabilizing && autoScanEnabled
                  ? `Focando carta... ${stabilityProgress}%`
                  : (autoScanEnabled ? 'Aponte para a carta (Auto-Scan)' : 'Centralize a carta e capture')
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Barra Superior Flutuante (HUD) -->
    <header class="scanner-top-hud">
      <button 
        class="hud-round-btn btn-close" 
        @click="handleClose" 
        title="Fechar Câmera"
        aria-label="Fechar"
      >
        ✕
      </button>

      <div class="hud-center-group">
        <!-- Botão Alternador Auto-Scan / Manual -->
        <button
          class="hud-center-pill"
          @click="toggleAutoScan"
          :title="autoScanEnabled ? 'Auto-Scan Ativo (toque para alternar para Manual)' : 'Modo Manual (toque para ativar Auto-Scan)'"
        >
          <span class="pulse-dot" :class="{ 'pulse-active': autoScanEnabled, 'pulse-manual': !autoScanEnabled }"></span>
          <span class="hud-pill-title">{{ autoScanEnabled ? '⚡ Auto-Scan' : '👆 Manual' }}</span>
        </button>

        <!-- Botão Modo Booster (Leitura Contínua de Pacotes) -->
        <button
          class="hud-booster-pill"
          :class="{ 'booster-active': boosterMode }"
          @click="toggleBoosterMode"
          :title="boosterMode ? 'Modo Booster Ativo (adiciona automaticamente cartas à coleção)' : 'Ativar Modo Booster (leitura contínua em lote)'"
        >
          <span>📦</span>
          <span>{{ boosterMode ? `Booster (${boosterScannedCount})` : 'Booster' }}</span>
        </button>
      </div>

      <div class="hud-actions-group">
        <!-- Lanterna / Flash (Se suportado pelo hardware) -->
        <button
          v-if="hasTorch && !analyzing && !detectedResult"
          @click="toggleTorch"
          class="hud-round-btn"
          :class="{ 'hud-btn-active': torchActive }"
          :title="torchActive ? 'Desativar Lanterna' : 'Ativar Lanterna'"
        >
          ⚡
        </button>

        <!-- Trocar Câmera Frontal / Traseira -->
        <button
          v-if="hasMultipleCameras && !analyzing && !detectedResult"
          @click="switchCamera"
          class="hud-round-btn"
          title="Alternar Câmera"
        >
          🔄
        </button>

        <!-- Chave de API / Configurações -->
        <button
          @click="showConfigKey = true"
          class="hud-round-btn"
          title="Configurar Chave Gemini"
        >
          ⚙️
        </button>
      </div>
    </header>

    <!-- 3. Alerta / Toast de Feedback Rápido -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="scanner-toast">
        <span>✨</span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- 4. Banner de Erro Flutuante (Câmera ou API) -->
    <div v-if="cameraError && !showConfigKey" class="scanner-floating-error glass-panel">
      <div class="error-icon-box">⚠️</div>
      <div class="error-text-box">
        <h4>Ops! Algo aconteceu</h4>
        <p>{{ cameraError }}</p>
      </div>
      <div class="error-actions">
        <button @click="retryCamera" class="btn btn-primary btn-sm">Tentar Câmera</button>
        <label class="btn btn-secondary btn-sm file-upload-btn">
          <span>Abrir Foto</span>
          <input type="file" accept="image/*" @change="onFileSelected" style="display: none;" />
        </label>
      </div>
    </div>

    <!-- 5. Barra Inferior de Ações da Câmera -->
    <footer v-if="!analyzing && !detectedResult && !showConfigKey" class="scanner-bottom-hud">
      <!-- Botão Galeria -->
      <label class="hud-bottom-action-btn file-upload-trigger" title="Carregar foto da galeria">
        <input type="file" accept="image/*" @change="onFileSelected" style="display: none;" />
        <div class="icon-circle">🖼️</div>
        <span class="action-label">Galeria</span>
      </label>

      <!-- Botão Disparador / Obturador Central (Funciona a qualquer momento) -->
      <button 
        @click="captureAndIdentify(false)" 
        class="shutter-button" 
        :class="{ 'shutter-auto-ready': autoScanEnabled }"
        title="Fotografar e Analisar Carta"
        aria-label="Capturar Foto"
      >
        <div class="shutter-inner">
          <div class="shutter-lens-icon">📸</div>
        </div>
      </button>

      <!-- Botão Modo Demo / Teste -->
      <button 
        @click="startDemoMode" 
        class="hud-bottom-action-btn" 
        title="Testar com carta de demonstração"
      >
        <div class="icon-circle">✨</div>
        <span class="action-label">Demo</span>
      </button>
    </footer>

    <!-- 6. Indicador Flutuante de Processamento / Análise IA -->
    <div v-if="analyzing" class="analyzing-floating-hud glass-panel">
      <div class="analyzing-spinner-wrapper">
        <span class="spinner-large"></span>
      </div>
      <div class="analyzing-text-info">
        <h3>Identificando Carta com IA...</h3>
        <p>Lendo arte, nome, número e coleção</p>
      </div>
    </div>

    <!-- 7. Bottom Sheet: Gaveta Deslizante de Resultado Identificado -->
    <transition name="sheet-slide">
      <div v-if="detectedResult && !showConfigKey" class="result-bottom-sheet glass-panel">
        <!-- Puxador Superior da Gaveta -->
        <div class="sheet-drag-handle" @click="resetScan"></div>

        <div class="sheet-content-scroll">
          <div class="sheet-header">
            <div class="sheet-badges">
              <span class="badge-success">✅ Identificada</span>
              <span class="badge-confidence">Certeza: {{ detectedResult.confidence }}</span>
            </div>
            <button @click="resetScan" class="btn-rescan" title="Escanear outra carta">
              🔄 Nova Foto
            </button>
          </div>

          <!-- Informações Extraídas pelo Gemini -->
          <div class="detected-hero-info">
            <h2 class="detected-card-name">{{ detectedResult.name || 'Carta Pokémon' }}</h2>
            <div class="detected-meta-chips">
              <span v-if="detectedResult.cardId" class="meta-chip">
                <strong>Nº:</strong> {{ detectedResult.cardId }}
              </span>
              <span v-if="detectedResult.setName" class="meta-chip">
                <strong>Coleção:</strong> {{ detectedResult.setName }}
              </span>
            </div>
          </div>

          <!-- Correspondência Oficial no TCGdex -->
          <div class="tcgdex-match-section">
            <div v-if="searchingApi" class="match-loading-box">
              <span class="spinner-small"></span>
              <span>Buscando detalhes oficiais e cotações...</span>
            </div>

            <div v-else-if="matchedCard" class="matched-card-card">
              <div class="matched-thumb-wrapper">
                <img
                  v-if="matchedCard.image"
                  :src="matchedCard.image + '/low.png'"
                  :alt="matchedCard.name"
                  class="matched-thumb-img"
                />
                <div v-else class="matched-thumb-fallback">🃏</div>
              </div>

              <div class="matched-details-box">
                <div class="matched-title">{{ matchedCard.name }}</div>
                <div class="matched-sub-info">ID: {{ matchedCard.id }}</div>
                <div class="matched-types" v-if="matchedCard.types">
                  {{ matchedCard.types.join(' • ') }}
                </div>
              </div>
            </div>

            <div v-else class="matched-fallback-box">
              <p>Carta lida com sucesso! Você pode buscar mais detalhes pelo nome:</p>
              <button @click="searchByName(detectedResult.name)" class="btn btn-outline-blue btn-sm">
                🔍 Buscar "{{ detectedResult.name }}"
              </button>
            </div>
          </div>

          <!-- Ações Principais da Gaveta -->
          <div class="sheet-footer-actions">
            <button
              v-if="matchedCard"
              @click="openCardDetails(matchedCard.id)"
              class="btn btn-primary btn-action-full"
            >
              🔍 Ver Detalhes e Cotações em R$
            </button>

            <div class="sheet-secondary-actions">
              <button
                v-if="matchedCard"
                @click="addCardToCollection(matchedCard)"
                class="btn btn-secondary btn-action-half"
              >
                ➕ Minha Coleção
              </button>

              <button
                @click="resetScan"
                class="btn btn-outline-blue btn-action-half"
              >
                📸 Escanear Outra
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 8. Modal / Gaveta de Configuração da Chave Gemini -->
    <transition name="modal-pop">
      <div v-if="showConfigKey || !apiKey" class="config-key-overlay" @click.self="apiKey ? (showConfigKey = false) : null">
        <div class="config-key-sheet glass-panel" @click.stop>
          <div class="config-key-header">
            <h3>🔑 Chave Gemini Flash</h3>
            <button
              v-if="apiKey"
              @click="showConfigKey = false"
              class="hud-round-btn btn-sm"
              title="Voltar à Câmera"
            >
              ✕
            </button>
          </div>

          <p class="config-instructions">
            O scanner utiliza o <strong>Google Gemini Flash Lite</strong> para reconhecimento ultrarrápido em tempo real.
          </p>

          <div class="instructions-steps">
            <div class="step-item">
              <span class="step-num">1</span>
              <span>Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</span>
            </div>
            <div class="step-item">
              <span class="step-num">2</span>
              <span>Clique em <strong>"Create API Key"</strong> (grátis, sem cartão).</span>
            </div>
            <div class="step-item">
              <span class="step-num">3</span>
              <span>Cole a sua chave abaixo:</span>
            </div>
          </div>

          <div class="key-input-wrapper">
            <input
              :type="showKeyText ? 'text' : 'password'"
              v-model="inputKey"
              placeholder="Cole sua chave AIzaSy..."
              class="input-control"
            />
            <button
              type="button"
              class="btn-toggle-eye"
              @click="showKeyText = !showKeyText"
              :title="showKeyText ? 'Ocultar' : 'Mostrar'"
            >
              {{ showKeyText ? '👁️' : '🔒' }}
            </button>
          </div>

          <div class="key-actions">
            <button @click="saveKeyAndStart" class="btn btn-primary btn-action-full" :disabled="!inputKey.trim()">
              Salvar Chave e Iniciar Scanner
            </button>
            <button @click="startDemoMode" class="btn btn-outline-blue btn-action-full">
              ✨ Testar com Exemplo Demo
            </button>
          </div>

          <p class="key-hint">
            💡 Salva localmente no navegador ou no arquivo <code>.env</code> como <code>VITE_GEMINI_API_KEY</code>.
          </p>
        </div>
      </div>
    </transition>

    <!-- Canvas ocultos para recorte da carta e detecção de movimento -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
    <canvas ref="detectorCanvas" style="display: none;"></canvas>
  </div>
</template>

<script>
import { getGeminiApiKey, saveGeminiApiKey, identifyCardWithGemini } from '../lib/geminiVision.js';

export default {
  name: 'CardScannerModal',
  emits: ['close', 'select-card', 'search-name', 'add-to-collection'],
  data() {
    return {
      apiKey: '',
      inputKey: '',
      showConfigKey: false,
      showKeyText: false,
      stream: null,
      facingMode: 'environment', // Traseira por padrão no celular
      hasMultipleCameras: false,
      hasTorch: false,
      torchActive: false,
      cameraError: null,
      analyzing: false,
      capturedImage: null,
      detectedResult: null,
      searchingApi: false,
      matchedCard: null,
      toastMessage: null,
      toastTimeout: null,

      // Sistema de Auto-Scan / Detecção Automática
      autoScanEnabled: true,
      boosterMode: false,
      boosterScannedCount: 0,
      stabilityProgress: 0,
      isStabilizing: false,
      isLocked: false,
      detectorTimer: null,
      lastFrameData: null,
      autoScanCooldown: false,
      audioCtx: null
    };
  },
  mounted() {
    this.apiKey = getGeminiApiKey();
    this.inputKey = this.apiKey;

    if (this.apiKey) {
      this.startCamera();
      this.checkCameras();
    } else {
      this.showConfigKey = true;
    }
  },
  beforeUnmount() {
    this.stopAutoScanDetector();
    this.stopCamera();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  },
  methods: {
    handleClose() {
      this.stopAutoScanDetector();
      this.stopCamera();
      this.$emit('close');
    },
    toggleAutoScan() {
      this.autoScanEnabled = !this.autoScanEnabled;
      this.triggerHaptic(25);
      if (this.autoScanEnabled) {
        this.showToast('Auto-Scan ativado! Centralize a carta.');
        this.startAutoScanDetector();
      } else {
        this.showToast('Modo manual ativado.');
        this.stopAutoScanDetector();
      }
    },
    toggleBoosterMode() {
      this.boosterMode = !this.boosterMode;
      this.triggerHaptic(35);
      if (this.boosterMode) {
        this.autoScanEnabled = true;
        this.boosterScannedCount = 0;
        this.showToast('📦 Modo Booster ativado! Aponte as cartas do pacote para adicionar em lote.');
        this.startAutoScanDetector();
      } else {
        this.showToast('Modo Booster desativado.');
      }
    },
    triggerHaptic(ms = 35) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(ms);
        } catch (e) {}
      }
    },
    playCaptureBeep() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!this.audioCtx) this.audioCtx = new AudioContextClass();
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
      } catch (e) {}
    },
    playSuccessChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!this.audioCtx) this.audioCtx = new AudioContextClass();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.setValueAtTime(1567.98, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    },
    async checkCameras() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          this.hasMultipleCameras = videoDevices.length > 1;
        }
      } catch (e) {
        // Ignora
      }
    },
    async checkTorchSupport() {
      if (!this.stream) return;
      const track = this.stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        this.hasTorch = Boolean(caps.torch);
      }
    },
    async toggleTorch() {
      if (!this.stream) return;
      const track = this.stream.getVideoTracks()[0];
      if (!track) return;

      try {
        this.triggerHaptic(25);
        this.torchActive = !this.torchActive;
        await track.applyConstraints({
          advanced: [{ torch: this.torchActive }]
        });
      } catch (err) {
        console.warn('Erro ao alternar lanterna:', err);
        this.torchActive = false;
      }
    },
    async startCamera() {
      this.cameraError = null;
      this.stopAutoScanDetector();
      this.stopCamera();

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Seu navegador não suporta acesso direto à câmera. Use o botão Galeria para selecionar uma foto.');
        }

        const constraints = {
          video: {
            facingMode: { ideal: this.facingMode },
            width: { ideal: 1920, min: 720 },
            height: { ideal: 1080, min: 480 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.stream = stream;

        this.$nextTick(() => {
          if (this.$refs.videoRef) {
            this.$refs.videoRef.srcObject = stream;
            this.$refs.videoRef.play().catch(() => {});
          }
          this.checkTorchSupport();
          if (this.autoScanEnabled) {
            this.startAutoScanDetector();
          }
        });
      } catch (err) {
        console.warn('Erro ao inicializar câmera:', err);
        this.cameraError = 'Não foi possível acessar a câmera. Verifique as permissões do navegador ou envie uma foto da galeria.';
      }
    },
    stopCamera() {
      if (this.stream) {
        if (this.torchActive) {
          const track = this.stream.getVideoTracks()[0];
          if (track) {
            track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
          }
          this.torchActive = false;
        }
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    },
    switchCamera() {
      this.triggerHaptic(30);
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      this.startCamera();
    },
    retryCamera() {
      this.startCamera();
    },
    saveKeyAndStart() {
      if (!this.inputKey.trim()) return;
      saveGeminiApiKey(this.inputKey.trim());
      this.apiKey = this.inputKey.trim();
      this.showConfigKey = false;
      this.startCamera();
      this.showToast('Chave de API salva com sucesso!');
    },
    startDemoMode() {
      this.triggerHaptic(40);
      this.stopAutoScanDetector();
      this.showConfigKey = false;
      this.analyzing = true;
      this.cameraError = null;

      setTimeout(async () => {
        this.analyzing = false;
        this.detectedResult = {
          name: 'Charizard ex',
          cardId: '199/165',
          setName: '151',
          confidence: 'High (Demo)'
        };
        await this.searchCardInTcgdex(this.detectedResult);
      }, 1000);
    },
    onFileSelected(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      this.stopAutoScanDetector();
      this.triggerHaptic(30);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        this.capturedImage = dataUrl;
        this.processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    },

    // ========================================================
    // AUTO-SCAN & RECONHECIMENTO DE ESTABILIDADE DA CARTA
    // ========================================================
    startAutoScanDetector() {
      this.stopAutoScanDetector();
      this.autoScanCooldown = false;
      this.detectorTimer = setInterval(() => {
        this.checkFrameStability();
      }, 220); // Amostra a cada 220ms para resposta ágil
    },
    stopAutoScanDetector() {
      if (this.detectorTimer) {
        clearInterval(this.detectorTimer);
        this.detectorTimer = null;
      }
      this.stabilityProgress = 0;
      this.isStabilizing = false;
      this.lastFrameData = null;
    },
    checkFrameStability() {
      if (
        !this.autoScanEnabled ||
        this.analyzing ||
        this.detectedResult ||
        this.cameraError ||
        this.showConfigKey ||
        this.autoScanCooldown
      ) {
        return;
      }

      const video = this.$refs.videoRef;
      const frame = this.$refs.reticleFrameRef;
      if (!video || !frame || video.readyState < 2) return;

      const offscreenCanvas = this.$refs.detectorCanvas || document.createElement('canvas');
      offscreenCanvas.width = 48; // Amostra super rápida de 48x67 px
      offscreenCanvas.height = 67;
      const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const videoW = video.videoWidth || 640;
      const videoH = video.videoHeight || 480;
      const videoRect = video.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      if (videoRect.width === 0 || frameRect.width === 0) return;

      const scale = Math.max(videoRect.width / videoW, videoRect.height / videoH);
      const renderedW = videoW * scale;
      const renderedH = videoH * scale;
      const offsetX = (videoRect.width - renderedW) / 2;
      const offsetY = (videoRect.height - renderedH) / 2;

      let cropX = Math.max(0, (frameRect.left - videoRect.left - offsetX) / scale);
      let cropY = Math.max(0, (frameRect.top - videoRect.top - offsetY) / scale);
      let cropW = Math.min(videoW - cropX, frameRect.width / scale);
      let cropH = Math.min(videoH - cropY, frameRect.height / scale);

      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 48, 67);
      const imgData = ctx.getImageData(0, 0, 48, 67);
      const data = imgData.data;

      let totalLuma = 0;
      let diffWithLast = 0;
      const len = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalLuma += luma;

        if (this.lastFrameData) {
          const prevLuma =
            0.299 * this.lastFrameData[i] +
            0.587 * this.lastFrameData[i + 1] +
            0.114 * this.lastFrameData[i + 2];
          diffWithLast += Math.abs(luma - prevLuma);
        }
      }

      const avgLuma = totalLuma / len;
      const avgDiff = this.lastFrameData ? diffWithLast / len : 999;
      this.lastFrameData = data;

      // Boa iluminação e câmera imóvel com carta no quadro
      const hasGoodLight = avgLuma > 30 && avgLuma < 240;
      const isSteady = avgDiff < 14;

      if (hasGoodLight && isSteady) {
        this.isStabilizing = true;
        this.stabilityProgress = Math.min(100, this.stabilityProgress + 35);

        if (this.stabilityProgress >= 100) {
          this.triggerAutoCapture();
        }
      } else {
        // Se houve movimento brusco ou não há carta estável, regride gradualmente
        this.stabilityProgress = Math.max(0, this.stabilityProgress - 30);
        if (this.stabilityProgress === 0) {
          this.isStabilizing = false;
        }
      }
    },
    triggerAutoCapture() {
      this.stopAutoScanDetector();
      this.isLocked = true;
      this.triggerHaptic(50);
      this.playCaptureBeep();

      setTimeout(() => {
        this.isLocked = false;
        this.captureAndIdentify(true);
      }, 160);
    },

    // ========================================================
    // RECORTE INTELIGENTE DA MOLDURA (SPEED & ACCURACY)
    // ========================================================
    getCroppedCardDataUrl() {
      const video = this.$refs.videoRef;
      const frame = this.$refs.reticleFrameRef;
      if (!video) return null;

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      if (!videoW || !videoH) return null;

      const canvas = this.$refs.canvasRef || document.createElement('canvas');

      // Se a moldura estiver visível na tela, recorta apenas a carta
      if (frame) {
        const videoRect = video.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();

        if (videoRect.width > 0 && frameRect.width > 0) {
          const scale = Math.max(videoRect.width / videoW, videoRect.height / videoH);
          const renderedW = videoW * scale;
          const renderedH = videoH * scale;
          const offsetX = (videoRect.width - renderedW) / 2;
          const offsetY = (videoRect.height - renderedH) / 2;

          let cropX = (frameRect.left - videoRect.left - offsetX) / scale;
          let cropY = (frameRect.top - videoRect.top - offsetY) / scale;
          let cropW = frameRect.width / scale;
          let cropH = frameRect.height / scale;

          // Margem suave de 3% para garantir que nenhum canto seja cortado
          const marginX = cropW * 0.03;
          const marginY = cropH * 0.03;
          cropX = Math.max(0, cropX - marginX);
          cropY = Math.max(0, cropY - marginY);
          cropW = Math.min(videoW - cropX, cropW + marginX * 2);
          cropH = Math.min(videoH - cropY, cropH + marginY * 2);

          // Resolução otimizada para o Gemini Flash (apenas ~45KB em JPEG)
          const targetW = 480;
          const targetH = Math.round(targetW * 1.4); // 672px

          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
          return canvas.toDataURL('image/jpeg', 0.76);
        }
      }

      // Fallback: redimensiona proporcionalmente para no máximo 640px
      const maxDim = 640;
      let targetW = videoW;
      let targetH = videoH;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, targetW, targetH);
      return canvas.toDataURL('image/jpeg', 0.76);
    },

    captureAndIdentify(isAuto = false) {
      if (!isAuto) {
        this.triggerHaptic(40);
      }
      this.stopAutoScanDetector();

      const croppedDataUrl = this.getCroppedCardDataUrl();
      if (!croppedDataUrl) {
        this.startDemoMode();
        return;
      }

      this.capturedImage = croppedDataUrl;
      this.processImage(croppedDataUrl);
    },
    async processImage(imageDataUrl) {
      this.analyzing = true;
      this.cameraError = null;
      this.detectedResult = null;
      this.matchedCard = null;

      try {
        const result = await identifyCardWithGemini(imageDataUrl, this.apiKey);
        this.detectedResult = result;
        this.triggerHaptic(60);
        await this.searchCardInTcgdex(result);
      } catch (err) {
        console.error('Erro na identificação:', err);
        this.cameraError = err.message || 'Erro ao identificar carta com o Gemini.';
        this.capturedImage = null;
      } finally {
        this.analyzing = false;
      }
    },
    async searchCardInTcgdex(result) {
      if (!result || !result.name) return;
      this.searchingApi = true;
      this.matchedCard = null;

      try {
        const cleanName = result.name.replace(/ ex$/i, '').trim();
        // 1. Tenta no TCGdex PT
        let res = await fetch(`https://api.tcgdex.net/v2/pt/cards?name=${encodeURIComponent(cleanName)}`);
        let cards = res.ok ? await res.json() : [];

        // 2. Se não encontrar em PT, tenta em EN (cartas importadas)
        if (!Array.isArray(cards) || cards.length === 0) {
          const resEn = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cleanName)}`);
          if (resEn.ok) {
            cards = await resEn.json();
          }
        }

        if (Array.isArray(cards) && cards.length > 0) {
          if (result.cardId) {
            const numOnly = result.cardId.split('/')[0].replace(/^0+/, '');
            const found = cards.find(c => {
              const localIdClean = (c.localId || c.id.split('-')[1] || '').replace(/^0+/, '');
              return localIdClean === numOnly;
            });
            this.matchedCard = found || cards[0];
          } else {
            this.matchedCard = cards[0];
          }
        }

        // Se o Modo Booster estiver ativo, adiciona instantaneamente e se prepara para a próxima carta
        if (this.boosterMode) {
          const cardToAdd = this.matchedCard || {
            id: result.cardId || `${(result.name || 'card').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: result.name,
            localId: result.cardId || '1'
          };
          this.$emit('add-to-collection', cardToAdd);
          this.boosterScannedCount++;
          this.playSuccessChime();
          this.showToast(`📦 "${cardToAdd.name}" salva! (${this.boosterScannedCount} cartas no booster)`);

          setTimeout(() => {
            if (this.boosterMode) {
              this.resetScan();
            }
          }, 1400);
        }
      } catch (err) {
        console.warn('Erro ao cruzar com TCGdex:', err);
      } finally {
        this.searchingApi = false;
      }
    },
    resetScan() {
      this.triggerHaptic(25);
      this.detectedResult = null;
      this.capturedImage = null;
      this.matchedCard = null;
      this.cameraError = null;

      if (!this.stream) {
        this.startCamera();
      } else if (this.autoScanEnabled) {
        // Pausa de 1.2s para dar tempo do usuário posicionar a próxima carta sem falso disparo
        this.autoScanCooldown = true;
        this.startAutoScanDetector();
        setTimeout(() => {
          this.autoScanCooldown = false;
        }, 1200);
      }
    },
    openCardDetails(cardId) {
      this.triggerHaptic(30);
      this.handleClose();
      this.$emit('select-card', cardId);
    },
    addCardToCollection(card) {
      this.triggerHaptic(40);
      this.$emit('add-to-collection', card);
      this.showToast(`"${card.name}" adicionada à sua coleção!`);
    },
    searchByName(name) {
      this.triggerHaptic(30);
      this.handleClose();
      this.$emit('search-name', name);
    },
    showToast(message) {
      this.toastMessage = message;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.toastMessage = null;
      }, 2500);
    }
  }
};
</script>

<style scoped>
/* ========================================================
   CONTAINER RAIZ: TELA CHEIA IMERSIVA PARA CELULAR
   ======================================================== */
.scanner-fullscreen-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  z-index: 2500;
  background: #000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  touch-action: manipulation;
  color: var(--text-primary);
  font-family: inherit;
}

/* ========================================================
   PALCO DA CÂMERA (VÍDEO DE FUNDO 100% TELA)
   ======================================================== */
.camera-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050608;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-hidden {
  display: none;
}

.captured-image-preview {
  filter: brightness(0.94);
}

/* ========================================================
   MÁSCARA E ENQUADRAMENTO DA CARTA (RETÍCULO)
   ======================================================== */
.scanner-reticle-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding-bottom: 70px;
}

/* Moldura na proporção padrão de carta Pokémon (63mm x 88mm ~ 1 : 1.396) */
.card-cutout-frame {
  position: relative;
  width: min(78vw, 310px);
  height: calc(min(78vw, 310px) * 1.396);
  border-radius: 18px;
  border: 2px dashed rgba(255, 255, 255, 0.35);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.58);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

/* Estado quando a carta está sendo focada e estabilizada */
.card-cutout-frame.stabilizing-active {
  border: 2.5px solid #10b981;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.62), 0 0 25px rgba(16, 185, 129, 0.4);
}

/* Flash de captura automática */
.card-cutout-frame.locked-flash {
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.3), 0 0 40px #ffffff;
  transition: all 0.1s ease;
}

.scanner-reticle-layer.analyzing-active .card-cutout-frame {
  border: 2px solid var(--accent-blue);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.72), 0 0 25px var(--accent-blue-glow);
}

/* Barra de Progresso de Foco no topo da moldura */
.stability-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981, #38bdf8);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 0 10px #10b981;
  transition: width 0.18s ease-out;
}

/* Cantos Dourados Estilizados */
.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: var(--gold);
  transition: border-color 0.2s;
}

.stabilizing-active .corner {
  border-color: #10b981 !important;
}

.corner-tl {
  top: -3px;
  left: -3px;
  border-top: 4px solid var(--gold);
  border-left: 4px solid var(--gold);
  border-top-left-radius: 16px;
}

.corner-tr {
  top: -3px;
  right: -3px;
  border-top: 4px solid var(--gold);
  border-right: 4px solid var(--gold);
  border-top-right-radius: 16px;
}

.corner-bl {
  bottom: -3px;
  left: -3px;
  border-bottom: 4px solid var(--gold);
  border-left: 4px solid var(--gold);
  border-bottom-left-radius: 16px;
}

.corner-br {
  bottom: -3px;
  right: -3px;
  border-bottom: 4px solid var(--gold);
  border-right: 4px solid var(--gold);
  border-bottom-right-radius: 16px;
}

/* Linha Laser Futurista em Varredura */
.laser-scanner-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #38bdf8, #60a5fa, #38bdf8, transparent);
  box-shadow: 0 0 16px #38bdf8, 0 0 8px #60a5fa;
  animation: laserScan 1.4s infinite ease-in-out;
}

@keyframes laserScan {
  0% { top: 4%; opacity: 0.8; }
  50% { top: 94%; opacity: 1; }
  100% { top: 4%; opacity: 0.8; }
}

/* Dica Flutuante Central */
.reticle-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(8, 10, 15, 0.84);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  white-space: nowrap;
  transition: all 0.2s ease;
}

.reticle-hint.hint-focused {
  background: rgba(6, 78, 59, 0.9);
  color: #a7f3d0;
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
}

.hint-icon {
  font-size: 0.9rem;
}

/* ========================================================
   BARRA SUPERIOR FLUTUANTE (TOP HUD)
   ======================================================== */
.scanner-top-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
  z-index: 10;
  pointer-events: auto;
}

.hud-round-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(22, 27, 34, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hud-round-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.2);
}

.hud-round-btn.btn-close {
  font-size: 1.25rem;
  font-weight: 700;
}

.hud-round-btn.hud-btn-active {
  background: var(--gold);
  color: #000;
  border-color: var(--gold);
  box-shadow: 0 0 15px rgba(255, 203, 5, 0.5);
}

.hud-round-btn.btn-sm {
  width: 34px;
  height: 34px;
  font-size: 0.95rem;
}

.hud-center-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Botão Alternador Auto-Scan / Manual no Topo */
.hud-center-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.hud-booster-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.hud-booster-pill:hover {
  background: rgba(51, 65, 85, 0.9);
  color: #fff;
}

.hud-booster-pill.booster-active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%);
  border-color: var(--gold);
  color: #fbbf24;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
}

.hud-center-pill:active {
  transform: scale(0.95);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}

.pulse-dot.pulse-active {
  animation: pulseGreen 1.6s infinite;
}

.pulse-dot.pulse-manual {
  background: #94a3b8;
}

@keyframes pulseGreen {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.hud-pill-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #f1f5f9;
}

.hud-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========================================================
   TOAST DE NOTIFICAÇÃO RÁPIDA
   ======================================================== */
.scanner-toast {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 72px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(16, 185, 129, 0.95);
  color: #fff;
  padding: 8px 18px;
  border-radius: 24px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  z-index: 100;
  backdrop-filter: blur(8px);
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.25s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* ========================================================
   BARRA INFERIOR DE CONTROLES
   ======================================================== */
.scanner-bottom-hud {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 18px 24px calc(env(safe-area-inset-bottom, 0px) + 24px) 24px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%);
  z-index: 10;
  pointer-events: auto;
}

.hud-bottom-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.hud-bottom-action-btn:active {
  transform: scale(0.9);
}

.hud-bottom-action-btn .icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.hud-bottom-action-btn .action-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #cbd5e1;
}

/* Botão Disparador / Shutter */
.shutter-button {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 4px solid #ffffff;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 6px 15px rgba(0, 0, 0, 0.6);
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.shutter-button:active {
  transform: scale(0.92);
}

.shutter-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.shutter-lens-icon {
  font-size: 1.6rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* ========================================================
   INDICADOR FLUTUANTE DE PROCESSAMENTO / ANÁLISE IA
   ======================================================== */
.analyzing-floating-hud {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 36px);
  left: 20px;
  right: 20px;
  max-width: 440px;
  margin: 0 auto;
  padding: 16px 20px;
  border-radius: 20px;
  background: rgba(11, 15, 25, 0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.4);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2);
  z-index: 20;
}

.analyzing-spinner-wrapper {
  flex-shrink: 0;
}

.analyzing-text-info h3 {
  font-size: 1rem;
  margin: 0 0 3px 0;
  color: #fff;
}

.analyzing-text-info p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ========================================================
   GAVETA INFERIOR DE RESULTADO (BOTTOM SHEET)
   ======================================================== */
.result-bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85dvh;
  background: rgba(13, 17, 26, 0.97);
  backdrop-filter: blur(20px);
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.85);
  z-index: 30;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.sheet-drag-handle {
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
  margin: 12px auto 6px auto;
  cursor: pointer;
}

.sheet-content-scroll {
  padding: 10px 20px 10px 20px;
  overflow-y: auto;
  max-height: calc(85dvh - 35px);
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sheet-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge-confidence {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 500;
}

.btn-rescan {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-rescan:active {
  background: rgba(255, 255, 255, 0.18);
}

.detected-hero-info {
  margin-bottom: 14px;
}

.detected-card-name {
  font-size: 1.45rem;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #fff;
  line-height: 1.2;
}

.detected-meta-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  background: rgba(255, 255, 255, 0.07);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #cbd5e1;
}

/* Card oficial TCGdex */
.matched-card-card {
  display: flex;
  gap: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.matched-thumb-wrapper {
  width: 64px;
  height: 89px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #090b10;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.matched-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.matched-thumb-fallback {
  font-size: 1.8rem;
}

.matched-details-box {
  flex: 1;
  min-width: 0;
}

.matched-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matched-sub-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.matched-types {
  font-size: 0.78rem;
  color: var(--accent-blue);
  font-weight: 600;
}

.match-loading-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.matched-fallback-box {
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.matched-fallback-box p {
  margin: 0 0 10px 0;
}

/* Ações do Rodapé da Gaveta */
.sheet-footer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-action-full {
  width: 100%;
  padding: 14px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sheet-secondary-actions {
  display: flex;
  gap: 10px;
}

.btn-action-half {
  flex: 1;
  padding: 12px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transição da gaveta (sheet-slide) */
.sheet-slide-enter-active, .sheet-slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.sheet-slide-enter-from, .sheet-slide-leave-to {
  transform: translateY(100%);
}

/* ========================================================
   MODAL FLUTUANTE DE ERRO
   ======================================================== */
.scanner-floating-error {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 76px);
  left: 16px;
  right: 16px;
  max-width: 460px;
  margin: 0 auto;
  padding: 16px;
  border-radius: 16px;
  background: rgba(30, 15, 15, 0.92);
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-icon-box {
  font-size: 1.5rem;
}

.error-text-box h4 {
  margin: 0 0 4px 0;
  color: #fca5a5;
  font-size: 0.95rem;
}

.error-text-box p {
  margin: 0;
  font-size: 0.82rem;
  color: #e2e8f0;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.file-upload-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ========================================================
   MODAL DE CONFIGURAÇÃO DE CHAVE
   ======================================================== */
.config-key-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.config-key-sheet {
  width: 100%;
  max-width: 520px;
  max-height: 90dvh;
  overflow-y: auto;
  background: rgba(17, 24, 39, 0.97);
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 24px 20px calc(env(safe-area-inset-bottom, 0px) + 24px) 20px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.9);
}

.config-key-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.config-key-header h3 {
  font-size: 1.2rem;
  margin: 0;
  color: #fff;
}

.config-instructions {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
}

.instructions-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
}

.step-item a {
  color: #38bdf8;
  text-decoration: underline;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-blue);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.key-input-wrapper {
  position: relative;
  margin-bottom: 14px;
}

.key-input-wrapper .input-control {
  width: 100%;
  padding-right: 44px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.9rem;
}

.key-input-wrapper .input-control:focus {
  border-color: var(--accent-blue);
  outline: none;
}

.btn-toggle-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.key-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 14px;
  margin-bottom: 0;
}

/* Transição do modal pop */
.modal-pop-enter-active, .modal-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-pop-enter-from, .modal-pop-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
