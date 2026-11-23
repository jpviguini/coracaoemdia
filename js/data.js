// Dados fictícios com vencimentos relativos à data em que são gerados.
import { addDias, addMeses, dataLocal } from './logic.js';

export const USUARIOS = [
  { id: 'helena', nome: 'Helena Martins', email: 'helena@exemplo.org', perfil: 'Financeiro', lembretes: true },
  { id: 'camila', nome: 'Camila Rocha', email: 'camila@exemplo.org', perfil: 'Apoio', lembretes: true },
  { id: 'sergio', nome: 'Sérgio Almeida', email: 'sergio@exemplo.org', perfil: 'Diretoria', lembretes: false },
];

export const CATEGORIAS = ['Saídas fixas', 'Serviços', 'Atividades', 'Materiais', 'Outros', 'Doações', 'Repasses', 'Eventos']
  .map((nome) => ({ nome, arquivada: false }));

export const CONFIG = {
  quando: { d3: true, d1: true, d0: true, vencida: true, resumoDiario: false },
  como: { email: true, navegador: true, celular: true },
};

let seq = 0;
const h = (quando, texto) => ({ quando, texto });
function conta(o) {
  seq += 1;
  return {
    id: 'c' + seq, tipo: 'saida', categoria: 'Saídas fixas', fornecedor: '', repetir: 'nao', obs: '',
    anexos: [], lembretes: [3, 1, 0], pagamento: null, agendada: false,
    historico: [h(o.venc + 'T08:12', 'Camila cadastrou a conta')], ...o,
  };
}
const pago = (data, valor, forma = 'Pix', por = 'Helena Martins') => ({ data, valor, forma, por, comprovante: 'comprovante.pdf', multa: false });

export function seed(hoje = dataLocal()) {
  const dia = (offset) => addDias(hoje, offset);
  seq = 0;
  const set = [
    conta({ descricao: 'Papelaria', valor: 18640, venc: dia(-3), categoria: 'Materiais', fornecedor: 'Papelaria Central', anexos: ['nota-papelaria.pdf'] }),
    conta({ descricao: 'Internet', valor: 12990, venc: dia(0), fornecedor: 'NetCarlos', repetir: 'mensal', anexos: ['boleto-internet.pdf'] }),
    conta({ descricao: 'Conta de água', valor: 14230, venc: dia(3), fornecedor: 'SAAE', repetir: 'mensal', anexos: ['boleto-agua.pdf'],
      historico: [h(dia(0) + 'T08:12', 'Camila cadastrou a conta'), h(dia(0) + 'T08:13', 'Camila anexou o boleto'), h(dia(0) + 'T08:13', 'Lembretes programados (3 dias, 1 dia e no dia)')] }),
    conta({ descricao: 'Conta de energia', valor: 48675, venc: dia(4), fornecedor: 'CPFL', repetir: 'mensal', anexos: ['boleto-energia.pdf'] }),
    conta({ descricao: 'Contador', valor: 65000, venc: dia(5), categoria: 'Serviços', fornecedor: 'Escritório Lima', agendada: true }),
    conta({ descricao: 'Telefone', valor: 9990, venc: dia(7), fornecedor: 'Vivo', repetir: 'mensal' }),
    conta({ descricao: 'Manutenção do computador', valor: 80000, venc: dia(11), categoria: 'Serviços', fornecedor: 'InfoTec' }),
    conta({ descricao: 'Material das oficinas', valor: 35000, venc: dia(11), categoria: 'Atividades' }),
    conta({ descricao: 'Gás', valor: 8700, venc: dia(16), fornecedor: 'Ultragaz' }),
    conta({ descricao: 'Aluguel da sede', valor: 240000, venc: dia(-4), repetir: 'mensal', anexos: ['boleto-aluguel.pdf', 'comprovante.pdf'],
      pagamento: pago(dia(-3), 240000), historico: [h(dia(-13) + 'T08:00', 'Conta gerada (recorrente)'), h(dia(-5) + 'T08:00', 'Lembrete enviado'), h(dia(-3) + 'T09:40', 'Helena registrou o pagamento')] }),
    conta({ descricao: 'Lanche das oficinas', valor: 31260, venc: dia(-6), categoria: 'Atividades', anexos: ['nota-lanche.pdf'], pagamento: pago(dia(-6), 31260) }),
    conta({ descricao: 'Tinta e pincéis', valor: 22015, venc: dia(-9), categoria: 'Materiais', anexos: ['nota-tintas.pdf'], pagamento: pago(dia(-9), 22015, 'Cartão') }),
    conta({ descricao: 'Limpeza da sede', valor: 80000, venc: dia(-9), categoria: 'Serviços', pagamento: pago(dia(-9), 80000, 'Transferência') }),
    conta({ descricao: 'Transporte das crianças', valor: 24900, venc: dia(-11), categoria: 'Atividades', pagamento: pago(dia(-11), 24900) }),
    conta({ descricao: 'Seguro da sede', valor: 18640, venc: dia(-12), categoria: 'Outros', pagamento: pago(dia(-12), 18640, 'Boleto') }),
    conta({ tipo: 'entrada', descricao: 'Doação — campanha de primavera', valor: 450000, venc: dia(-5), categoria: 'Doações', fornecedor: 'Campanha', pagamento: pago(dia(-5), 450000) }),
    conta({ tipo: 'entrada', descricao: 'Repasse da prefeitura', valor: 300000, venc: dia(-9), categoria: 'Repasses', fornecedor: 'Prefeitura de São Carlos', pagamento: pago(dia(-9), 300000, 'Transferência') }),
    conta({ tipo: 'entrada', descricao: 'Bazar beneficente', valor: 230000, venc: dia(6), categoria: 'Eventos', fornecedor: 'Bazar' }),
  ];
  // Seis meses anteriores só com totais pagos, para o gráfico "Últimos 6 meses".
  const hist = [[880000, 610000], [720000, 690000], [950000, 640000], [810000, 700000], [760000, 720000], [900000, 650000]];
  hist.forEach(([ent, sai], i) => {
    const venc = addMeses(hoje.slice(0, 7) + '-10', i - hist.length);
    set.push(conta({ tipo: 'entrada', descricao: 'Entradas do mês (planilha antiga)', valor: ent, venc, categoria: 'Doações', pagamento: pago(venc, ent) }));
    set.push(conta({ descricao: 'Saídas do mês (planilha antiga)', valor: sai, venc, categoria: 'Saídas fixas', pagamento: pago(venc, sai) }));
  });
  return {
    contas: set,
    usuarios: structuredClone(USUARIOS),
    categorias: structuredClone(CATEGORIAS),
    config: structuredClone(CONFIG),
  };
}
