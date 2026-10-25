// Rode com: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { estado, prazo, parseValor, fmt, addMeses, proximasOcorrencias, resumoMes } from '../js/logic.js';

const hoje = '2026-09-14';
const c = (o) => ({ tipo: 'saida', venc: hoje, valor: 1000, pagamento: null, agendada: false, ...o });

test('estado calculado pela data e pelas ações', () => {
  assert.equal(estado(c({ venc: '2026-09-11' }), hoje), 'vencida');
  assert.equal(estado(c({}), hoje), 'hoje');
  assert.equal(estado(c({ venc: '2026-09-17' }), hoje), 'avencer');
  assert.equal(estado(c({ venc: '2026-09-11', agendada: true }), hoje), 'agendada');
  assert.equal(estado(c({ venc: '2026-09-11', agendada: true, pagamento: { valor: 1 } }), hoje), 'paga');
  assert.equal(estado(c({ tipo: 'entrada' }), hoje), 'prevista');
});

test('prazo relativo', () => {
  assert.equal(prazo(c({ venc: '2026-09-11' }), hoje), 'há 3 dias');
  assert.equal(prazo(c({ venc: '2026-09-15' }), hoje), 'amanhã');
  assert.equal(prazo(c({ venc: '2026-09-19' }), hoje), 'em 5 dias');
});

test('valores em reais viram centavos', () => {
  assert.equal(parseValor('1.234,56'), 123456);
  assert.equal(parseValor('R$ 89,9'), 8990);
  assert.equal(parseValor('142.30'), 14230);
  assert.equal(parseValor('2.400'), 240000);
  assert.ok(Number.isNaN(parseValor('abc')));
  assert.ok(Number.isNaN(parseValor('')));
  assert.equal(fmt(358600), 'R$ 3.586,00');
});

test('recorrência não pula mês curto', () => {
  assert.equal(addMeses('2026-01-31', 1), '2026-02-28');
  assert.deepEqual(proximasOcorrencias('2026-09-10', 'mensal', 2), ['2026-10-10', '2026-11-10']);
  assert.deepEqual(proximasOcorrencias('2026-09-10', 'nao'), []);
});

test('resumo do mês usa valor pago quando houver', () => {
  const r = resumoMes([
    c({ tipo: 'entrada', valor: 5000, venc: '2026-09-01' }),
    c({ valor: 1000, pagamento: { valor: 1200 }, venc: '2026-09-02' }),
    c({ valor: 999, venc: '2026-10-01' }),
  ], '2026-09');
  assert.deepEqual(r, { entradas: 5000, saidas: 1200, saldo: 3800 });
});
