/** Props de todo painel. `extra` é o que vem depois da barra no endereço:
 *  #municipios/2111300 -> "2111300" (cidade), #municipios/MA -> "MA" (estado),
 *  #candidatos/2024-123 -> "2024-123" (ficha). Os demais painéis ignoram. */
export interface PainelProps {
  extra?: string;
}
