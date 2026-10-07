<template>
  <transition name="toast-slide">
    <div v-if="visible" class="floating-toast-container glass-panel" :class="`toast-${type}`">
      <div class="toast-icon">{{ icon }}</div>
      <div class="toast-message-box">
        <span class="toast-message">{{ message }}</span>
      </div>
      <button v-if="actionLabel" @click="handleAction" class="toast-action-btn">
        {{ actionLabel }}
      </button>
      <button @click="close" class="toast-close-btn" aria-label="Fechar">×</button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ToastNotification',
  emits: ['action', 'close'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info' // 'info' | 'success' | 'warning' | 'error'
    },
    actionLabel: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 4000
    }
  },
  computed: {
    icon() {
      if (this.type === 'success') return '✅';
      if (this.type === 'error') return '⚠️';
      if (this.type === 'warning') return '⚡';
      return '✨';
    }
  },
  watch: {
    visible(val) {
      if (val && this.duration > 0) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.close();
        }, this.duration);
      }
    }
  },
  data() {
    return {
      timer: null
    };
  },
  beforeUnmount() {
    if (this.timer) clearTimeout(this.timer);
  },
  methods: {
    handleAction() {
      this.$emit('action');
      this.close();
    },
    close() {
      if (this.timer) clearTimeout(this.timer);
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.floating-toast-container {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
  max-width: 440px;
}

@media (max-width: 600px) {
  .floating-toast-container {
    bottom: 20px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-message-box {
  flex: 1;
}

.toast-message {
  font-size: 0.88rem;
  color: #f8fafc;
  line-height: 1.4;
}

.toast-action-btn {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-family: var(--font-display);
}

.toast-action-btn:hover {
  background: var(--gold);
  color: #000;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.3rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.toast-close-btn:hover {
  color: #fff;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}
</style>
