// Serviço de Câmbio de Moedas (USD -> BRL e EUR -> BRL)
// Utiliza a AwesomeAPI pública com cache local de 30 minutos

const CACHE_KEY = 'pokecard_exchange_rates';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutos

// Cache em memória
let memoryRates = null;
let fetchPromise = null;

export async function getExchangeRates() {
  const now = Date.now();

  // 1. Verifica cache em memória
  if (memoryRates && (now - memoryRates.timestamp < CACHE_DURATION_MS)) {
    return memoryRates.rates;
  }

  // 2. Se já existe uma requisição em andamento, reaproveita a Promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // 3. Verifica cache no localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.timestamp && (now - parsed.timestamp < CACHE_DURATION_MS)) {
          memoryRates = parsed;
          return parsed.rates;
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache de câmbio:', e);
  }

  // 4. Busca da API AwesomeAPI
  fetchPromise = (async () => {
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL');
      if (!res.ok) throw new Error('Falha ao obter cotação de moedas');
      
      const data = await res.json();
      const usdBrl = parseFloat(data.USDBRL?.bid);
      const eurBrl = parseFloat(data.EURBRL?.bid);

      const rates = {
        USD: !isNaN(usdBrl) ? usdBrl : 5.20,
        EUR: !isNaN(eurBrl) ? eurBrl : 5.80,
        updatedAt: data.USDBRL?.create_date || new Date().toISOString()
      };

      memoryRates = {
        timestamp: now,
        rates
      };

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(memoryRates));
        }
      } catch (e) {
        // Ignora erro de localStorage
      }

      return rates;
    } catch (err) {
      console.warn('Não foi possível obter cotação em tempo real, usando fallback:', err);
      // Fallback padrão se offline ou erro
      const fallbackRates = memoryRates?.rates || {
        USD: 5.20,
        EUR: 5.80,
        updatedAt: null
      };
      return fallbackRates;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function formatBRL(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Extrai o preço estimado unitário de uma carta em Reais (BRL)
 * @param {object} card - Objeto da carta com metadados ou pricing
 * @param {object} rates - Cotações atuais { USD, EUR }
 * @returns {number|null} Valor numérico estimado em BRL ou null
 */
export function getCardEstimatedPriceBRL(card, rates = { USD: 5.20, EUR: 5.80 }) {
  if (!card) return null;

  // Se já tem preço pré-calculado
  if (typeof card.estimatedPriceBRL === 'number') {
    return card.estimatedPriceBRL;
  }

  const pricing = card.pricing;
  if (!pricing) return null;

  const usdRate = rates?.USD || 5.20;
  const eurRate = rates?.EUR || 5.80;

  // 1. Tenta TCGPlayer (USD)
  if (pricing.tcgplayer) {
    const data = pricing.tcgplayer;
    const variants = ['normal', 'holofoil', 'reverseHolofoil', '1stEditionNormal', '1stEditionHolofoil'];
    const fields = ['marketPrice', 'midPrice', 'lowPrice'];

    for (const field of fields) {
      for (const v of variants) {
        if (data[v] && typeof data[v][field] === 'number' && data[v][field] > 0) {
          return data[v][field] * usdRate;
        }
      }
      if (typeof data[field] === 'number' && data[field] > 0) {
        return data[field] * usdRate;
      }
    }
  }

  // 2. Tenta Cardmarket (EUR)
  if (pricing.cardmarket) {
    const data = pricing.cardmarket;
    const fields = ['avg', 'trend', 'low'];
    for (const field of fields) {
      if (typeof data[field] === 'number' && data[field] > 0) {
        return data[field] * eurRate;
      }
    }
  }

  return null;
}

/**
 * Calcula o valor total estimado da coleção em Reais (BRL)
 * @param {Record<string, number>} collection - Mapa de { cardId: quantidade }
 * @param {Record<string, any>} savedCardData - Mapa de metadados das cartas
 * @param {object} rates - Cotações atuais
 * @returns {{ totalBRL: number, pricedCount: number, totalCardsCount: number }}
 */
export function calculateTotalCollectionValue(collection, savedCardData, rates) {
  let totalBRL = 0;
  let pricedCount = 0;
  let totalCardsCount = 0;

  if (!collection || !savedCardData) {
    return { totalBRL: 0, pricedCount: 0, totalCardsCount: 0 };
  }

  for (const [cardId, qty] of Object.entries(collection)) {
    if (qty > 0) {
      totalCardsCount += qty;
      const card = savedCardData[cardId];
      if (card) {
        const unitBRL = getCardEstimatedPriceBRL(card, rates);
        if (unitBRL !== null && unitBRL > 0) {
          totalBRL += unitBRL * qty;
          pricedCount += qty;
        }
      }
    }
  }

  return {
    totalBRL,
    pricedCount,
    totalCardsCount
  };
}

