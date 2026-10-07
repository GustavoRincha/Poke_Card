// Serviço de Reconhecimento Visual de Cartas com Google Gemini Multimodal
// Utiliza o modelo gemini-1.5-flash via API REST

const STORAGE_KEY = 'pokecard_gemini_api_key';

export function getGeminiApiKey() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function saveGeminiApiKey(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (key && key.trim()) {
      window.localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function hasGeminiApiKey() {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10);
}

/**
 * Envia uma foto (base64) para o Gemini Flash analisar e extrair os dados da carta Pokémon
 * @param {string} imageDataUrl - String base64 ou dataURL da imagem (ex: "data:image/jpeg;base64,...")
 * @param {string|null} overrideKey - Chave opcional informada diretamente
 * @returns {Promise<{ name: string, cardId: string, setName: string, confidence: string }>}
 */
export async function identifyCardWithGemini(imageDataUrl, overrideKey = null) {
  const apiKey = overrideKey || getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Por favor, insira sua chave gratuita do Google AI Studio.');
  }

  // Extrai o MIME type e os dados puros em base64
  let mimeType = 'image/jpeg';
  let base64Data = imageDataUrl;

  if (imageDataUrl.includes(';base64,')) {
    const parts = imageDataUrl.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    base64Data = parts[1];
  }

  const prompt = `Você é um especialista em Pokémon Trading Card Game (TCG).
Analise com atenção a foto desta carta de Pokémon TCG e extraia:
1. "name": O nome exato da carta (ex: "Pikachu", "Charizard ex", "Pesquisa de Professores", "Iono").
2. "cardId": O número da carta no rodapé/canto inferior, preferencialmente no formato "NÚMERO/TOTAL" (ex: "025/165", "4/102", "199/165") ou apenas o número se o total não estiver legível (ex: "25").
3. "setName": O nome da coleção/expansão se reconhecível (ex: "151", "Evoluções em Paldea", "Obsidiana em Chamas", "Base Set", "Coroa Estelar").
4. "confidence": Nível de certeza da identificação ("High", "Medium" ou "Low").

Retorne APENAS um JSON válido no seguinte formato:
{
  "name": "nome da carta",
  "cardId": "número da carta",
  "setName": "nome da coleção",
  "confidence": "High"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
      maxOutputTokens: 180
    }
  };

  // Modelos do Google AI Studio para tentar em ordem de velocidade e preferência
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || response.statusText;

        if (status === 400 && msg.includes('API key not valid')) {
          throw new Error('Chave de API do Gemini inválida. Verifique a chave inserida.');
        } else if (status === 429) {
          // Em caso de cota temporária no modelo, tenta o próximo modelo lite/fallback antes de desistir
          lastError = new Error('Limite temporário de requisições excedido. Aguarde alguns instantes e tente novamente.');
          continue;
        }
        
        lastError = new Error(`Erro ${status} (${model}): ${msg}`);
        continue; // Tenta o próximo modelo
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const textContent = candidate?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('Nenhuma resposta de texto retornada pelo Gemini.');
      }

      // Limpa possíveis blocos markdown ```json ... ``` se vierem
      let cleaned = textContent.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);

      return {
        name: parsed.name || '',
        cardId: parsed.cardId || '',
        setName: parsed.setName || '',
        confidence: parsed.confidence || 'Medium'
      };
    } catch (err) {
      if (err.message.includes('inválida')) {
        throw err; // Erro fatal de chave
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Não foi possível identificar a carta com o Gemini. Tente novamente com melhor iluminação.');
}
