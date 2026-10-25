// Regras do sistema que não dependem da tela (testadas em tests/logic.test.mjs).

// shortcut: data fixa do cenário DEPOIS (segunda, 14/09/2026) para os dados de exemplo fazerem sentido; trocar por new Date() quando houver dados reais.
export const HOJE = '2026-09-14';

export const DIA = 86400000;
const toDate = (iso) => new Date(iso + 'T12:00:00');
export const diasEntre = (de, ate) => Math.round((toDate(ate) - toDate(de)) / DIA);
export const addDias = (iso, n) => new Date(toDate(iso).getTime() + n * DIA).toISOString().slice(0, 10);
export function addMeses(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const ult = new Date(y, m - 1 + n + 1, 0).getDate(); // evita 31/01 + 1 mês = 03/03
  const dt = new Date(y, m - 1 + n, Math.min(d, ult), 12);
  return dt.toISOString().slice(0, 10);
}

// Estado calculado: o usuário nunca escolhe (RF06/RF07/RF11).
export function estado(conta, hoje = HOJE) {
  if (conta.tipo === 'entrada') return conta.pagamento ? 'recebida' : 'prevista';
  if (conta.pagamento) return 'paga';
  if (conta.agendada) return 'agendada';
  const d = diasEntre(hoje, conta.venc);
  if (d < 0) return 'vencida';
  if (d === 0) return 'hoje';
  return 'avencer';
}

export const URGENCIA = { vencida: 0, hoje: 1, avencer: 2, agendada: 3, paga: 4, prevista: 5, recebida: 6 };

export function prazo(conta, hoje = HOJE) {
  const d = diasEntre(hoje, conta.venc);
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'ontem';
  return d < 0 ? `há ${-d} dias` : `em ${d} dias`;
}

// "1.234,56", "1234.56", "R$ 89,9" -> centavos inteiros (evita erro de ponto flutuante com dinheiro)
export function parseValor(txt) {
  if (txt == null) return NaN;
  let s = String(txt).replace(/[R$\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100);
}

export const fmt = (centavos) =>
  (centavos < 0 ? '- ' : '') + 'R$ ' + (Math.abs(centavos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const valorPago = (c) => (c.pagamento ? c.pagamento.valor : c.valor);

export function resumoMes(contas, ym) {
  const doMes = contas.filter((c) => c.venc.startsWith(ym));
  const entradas = doMes.filter((c) => c.tipo === 'entrada').reduce((s, c) => s + valorPago(c), 0);
  const saidas = doMes.filter((c) => c.tipo === 'saida').reduce((s, c) => s + valorPago(c), 0);
  return { entradas, saidas, saldo: entradas - saidas };
}

// Ocorrências futuras de uma conta recorrente (RF04/RF08).
export function proximasOcorrencias(venc, repetir, n = 3) {
  const passo = { semanal: (d, i) => addDias(d, 7 * i), mensal: (d, i) => addMeses(d, i), anual: (d, i) => addMeses(d, 12 * i) }[repetir];
  if (!passo) return [];
  return Array.from({ length: n }, (_, i) => passo(venc, i + 1));
}
