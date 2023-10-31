import { prompt } from "../prompts/agent"

export function initPrompt(orderCode: string): string {
  return prompt
    .replace(/{{[\s]?orderCode[\s]?}}/g, orderCode) // aqui é onde substituímos o código do pedido - {{ orderCode }}
}