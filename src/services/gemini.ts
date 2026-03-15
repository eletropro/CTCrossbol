import { GoogleGenAI } from "@google/genai";
import { Transaction, Budget, Customer } from "../types";

// Helper to get the API key
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  if (!key) {
    console.warn("Gemini API Key not found in environment variables.");
  }
  return key || "";
};

export async function getFinancialInsights(transactions: Transaction[]) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "IA Desconectada: Chave de API não encontrada. Verifique as configurações do projeto.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const prompt = `Analise o seguinte resumo financeiro de um negócio:
  Entradas: R$ ${summary.income}
  Saídas: R$ ${summary.expense}
  Saldo: R$ ${summary.income - summary.expense}
  
  Dê um conselho curto, profissional e motivador sobre como está a gestão financeira. 
  IMPORTANTE: Não use negrito (asteriscos como **texto**) na sua resposta. Use apenas texto simples e organizado.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "A IA não retornou uma resposta válida.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      return "Limite de uso atingido. Tente novamente em alguns minutos.";
    }
    if (error?.message?.includes('API key not valid')) {
      return "Chave de API inválida. Verifique sua configuração.";
    }
    return `Erro na IA: ${error?.message || "Erro desconhecido"}`;
  }
}

export async function generateCRMMessage(
  customer: Customer, 
  action: 'convince' | 'thank', 
  history?: { budgets: Budget[], loans: any[] }
) {
  const apiKey = getApiKey();
  if (!apiKey) return "Configure a chave de API para usar esta função.";

  const ai = new GoogleGenAI({ apiKey });

  let historyContext = "";
  if (history) {
    if (history.budgets.length > 0) {
      historyContext += "\nHistórico de Serviços/Orçamentos:\n" + 
        history.budgets.map(b => `- ${b.title} (R$ ${b.totalAmount}, Status: ${b.status})`).join("\n");
    }
    if (history.loans.length > 0) {
      historyContext += "\nHistórico de Empréstimos:\n" + 
        history.loans.map(l => `- Empréstimo de R$ ${l.principal} (Taxa: ${l.interestRate}%, Status: ${l.status})`).join("\n");
    }
  }

  const prompt = `Gere uma mensagem curta, profissional e amigável para WhatsApp para um cliente chamado ${customer.name}.
  ${customer.notes ? `Contexto do Cliente: ${customer.notes}` : ''}
  ${historyContext}
  
  Objetivo: ${action === 'convince' ? 'Convencer o cliente a fechar um orçamento ou serviço pendente de forma elegante, mencionando especificamente o que ele consumiu ou está pendente no histórico acima.' : 'Agradecer por um serviço ou empréstimo já realizado, mencionando especificamente o que ele consumiu no histórico acima, reforçar a qualidade e se colocar à disposição para futuros contatos.'}
  
  REGRAS CRÍTICAS:
  1. Baseie a mensagem EXCLUSIVAMENTE no histórico fornecido acima (orçamentos, serviços ou empréstimos).
  2. NÃO invente serviços ou produtos que não estejam listados no histórico.
  3. Se o histórico for de empréstimos, fale sobre empréstimos. Se for de orçamentos, fale sobre orçamentos.
  4. Seja direto e personalizado.
  5. IMPORTANTE: Não use negrito (asteriscos como **texto**) na sua resposta. Use apenas texto simples.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "";
  }
}

export async function analyzeElectricalProjectPDF(base64Data: string) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Gemini API Key missing");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analise o seguinte documento PDF de um projeto elétrico e extraia detalhadamente:
  1. Quantidade de Tomadas (novas e existentes a trocar).
  2. Quantidade de Interruptores (simples, paralelos, intermediários).
  3. Quantidade de Dicroicas/Spots.
  4. Quantidade de Painéis de LED.
  5. Metragem de Perfil de LED, especificando se é de EMBUTIR ou SOBREPOR.
  6. Outros componentes relevantes (quadro, disjuntores, etc).

  Lógica de Cálculo de Preço (Referência):
  - Tomada/Interruptor: R$ 35,00 por ponto.
  - Dicroica/Spot: R$ 45,00 por ponto.
  - Painel de LED: R$ 70,00 por unidade.
  - Perfil de LED: R$ 100,00 por metro linear (instalação).
  - Mão de obra base: Considere a complexidade e some 20% de margem de segurança.

  Retorne APENAS um JSON com as chaves: 
  sockets (number), 
  switches (number), 
  dichroics (number), 
  ledPanels (number), 
  ledProfiles (array de objetos {meters: number, type: 'embutir' | 'sobrepor'}), 
  otherDetails (string), 
  suggestedValue (number),
  calculationBasis (string - breve explicação de como chegou no valor).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data
          }
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text;
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error("Gemini PDF Error:", error);
    return null;
  }
}
