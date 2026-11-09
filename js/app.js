import { HOJE, diasEntre, addMeses, estado, URGENCIA, prazo, parseValor, fmt, valorPago, resumoMes, proximasOcorrencias } from './logic.js';
import { seed } from './data.js';

// ---------------------------------------------------------------- dados
// shortcut: os dados ficam no localStorage de quem abre o protótipo (cada navegador tem os seus); trocar por um backend quando virar sistema real.
const CHAVE = 'coracao-em-dia-v1';
function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && Array.isArray(salvo.contas)) return salvo;
  } catch { /* sem storage: segue com os dados de exemplo */ }
  return seed();
}
let db = carregar();
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* modo privado: os dados valem só nesta aba */ }
}

function lerSessao() {
  try { return localStorage.getItem('coracao-usuario') || sessionStorage.getItem('coracao-usuario'); } catch { return null; }
}
let usuarioId = lerSessao();
const usuario = () => db.usuarios.find((u) => u.id === usuarioId);

// ---------------------------------------------------------------- utilidades
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBR = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const curta = (iso) => dataBR(iso).slice(0, 5);
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const nomeMes = (ym) => `${MESES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
// botões ‹ › de mês com o nome do mês de destino (o leitor de tela diz "Mês anterior: Agosto 2026")
const botoesMes = (acao, ym) => `<button data-acao="${acao}" data-delta="-1" aria-label="Mês anterior: ${nomeMes(addMeses(ym + '-01', -1).slice(0, 7))}"><span aria-hidden="true">‹</span></button><span aria-live="off">${nomeMes(ym)}</span><button data-acao="${acao}" data-delta="1" aria-label="Próximo mês: ${nomeMes(addMeses(ym + '-01', 1).slice(0, 7))}"><span aria-hidden="true">›</span></button>`;
const diaSemana = (iso) => SEMANA[new Date(iso + 'T12:00:00').getDay()];
const mesDe = (iso) => iso.slice(0, 7);
const ROTULO = { vencida: 'Vencida', hoje: 'Vence hoje', avencer: 'A vencer', agendada: 'Agendada', paga: 'Paga', prevista: 'Prevista', recebida: 'Recebida' };
const tag = (c) => { const e = estado(c); return `<span class="tag ${e}">${e === 'paga' ? '✓ ' : ''}${ROTULO[e]}</span>`; };
const iniciais = (nome) => nome.split(' ').map((p) => p[0]).slice(0, 2).join('');
const agora = () => `${HOJE}T${new Date().toTimeString().slice(0, 5)}`;
const primeiroNome = () => usuario().nome.split(' ')[0];
const conta = (id) => db.contas.find((c) => c.id === id);
const saidas = () => db.contas.filter((c) => c.tipo === 'saida');
const urgentes = () => saidas().filter((c) => !c.pagamento && !c.agendada && diasEntre(HOJE, c.venc) <= 7)
  .sort((a, b) => URGENCIA[estado(a)] - URGENCIA[estado(b)] || a.venc.localeCompare(b.venc));
const lembretesAtivos = () => saidas().filter((c) => !c.pagamento && diasEntre(HOJE, c.venc) <= 1)
  .sort((a, b) => a.venc.localeCompare(b.venc));
const categoriasAtivas = () => db.categorias.filter((c) => !c.arquivada).map((c) => c.nome);

const ICONES = {
  painel: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  contas: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  relatorios: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  sino: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
};
const icone = (n, t = 20) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

// ---------------------------------------------------------------- estado da interface
const ui = {
  lista: { tipo: 'saida', estado: 'todos', q: '', mes: mesDe(HOJE), cat: '', ordem: 'venc', dir: 1, pagina: 1 },
  menu: null, notif: false, modal: null, toast: null, calMes: mesDe(HOJE), calDia: HOJE,
  rel: { mes: mesDe(HOJE), cat: '', modo: 'semana', todos: false }, rascunhoConfig: null, erros: {},
};
let timerToast;
const tempoToast = () => (ui.toast?.desfazer ? 10000 : 6000);
function iniciarTimerToast() {
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { ui.toast = null; $('.toast')?.remove(); }, tempoToast()); // sem render: não apaga o que estiver sendo digitado
}
function toast(texto, desfazer) {
  ui.toast = { texto, desfazer };
  anunciar(texto);
  iniciarTimerToast();
}

// ---------------------------------------------------------------- acessibilidade
let timerAnuncio;
function anunciar(texto) {
  const regiao = $('#avisos');
  if (!regiao) return;
  clearTimeout(timerAnuncio);
  regiao.textContent = '';
  timerAnuncio = setTimeout(() => { regiao.textContent = texto; }, 60);
}

const CHAVE_PREF = 'coracao-preferencias';
function lerPreferencias() {
  try { return { fonte: 'normal', contraste: false, ...JSON.parse(localStorage.getItem(CHAVE_PREF)) }; } catch { return { fonte: 'normal', contraste: false }; }
}
let pref = lerPreferencias();
function aplicarPreferencias() {
  const html = document.documentElement;
  if (pref.fonte === 'normal') delete html.dataset.fonte; else html.dataset.fonte = pref.fonte;
  if (pref.contraste) html.dataset.contraste = 'alto'; else delete html.dataset.contraste;
}
function salvarPreferencias() {
  try { localStorage.setItem(CHAVE_PREF, JSON.stringify(pref)); } catch { /* sem storage: vale só nesta aba */ }
  aplicarPreferencias();
}
aplicarPreferencias();

const ATRS_FOCO = ['acao', 'id', 'estado', 'tipo', 'campo', 'delta', 'dia', 'modo', 'hash', 'i', 'grupo', 'chave', 'fonte'];
function chaveFoco(el) {
  if (!el || el === document.body || el === document.documentElement) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  if (!el.dataset?.acao) return null;
  return ATRS_FOCO.filter((k) => el.dataset[k] != null).map((k) => `[data-${k}="${CSS.escape(el.dataset[k])}"]`).join('');
}
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function focar(seletor) {
  const el = seletor && document.querySelector(seletor);
  if (!el) return false;
  if (!el.matches(FOCAVEIS) && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); // títulos recebem foco por script
  el.focus({ preventScroll: el.matches('main h1') });
  return document.activeElement === el;
}
function ligarErros(raiz) {
  raiz.querySelectorAll('.campo.erro').forEach((campo, i) => {
    const msg = campo.querySelector('.msg-erro');
    const ctrl = campo.querySelector('input:not([type=hidden]), select, textarea');
    if (!ctrl) return;
    ctrl.setAttribute('aria-invalid', 'true');
    if (msg) { msg.id ||= `erro-${ctrl.id || i}`; ctrl.setAttribute('aria-describedby', msg.id); }
  });
}
const estrela = '<span aria-hidden="true">*</span>';

// ---------------------------------------------------------------- rotas
function rota() {
  const [caminho, qs] = location.hash.slice(2).split('?');
  const partes = caminho.split('/');
  return { nome: partes[0] || 'painel', id: partes[1], params: new URLSearchParams(qs || '') };
}
const ir = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

// ---------------------------------------------------------------- telas
function telaLogin() {
  const e = ui.erros;
  return `<main class="login"><form id="form-login" novalidate aria-labelledby="t-login">
  <div class="marca"><div class="coracao" aria-hidden="true">♡</div><h1 id="t-login">CorAção em Dia</h1><p class="muted">Suas contas organizadas com mais tranquilidade</p></div>
  <div class="campo ${e.email ? 'erro' : ''}"><label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="username" required placeholder="seu@email.org" value="${esc(e.emailValor)}">${e.email ? `<span class="msg-erro">${e.email}</span>` : ''}</div>
  <div class="campo ${e.senha ? 'erro' : ''}"><label for="senha">Senha</label>
    <div style="position:relative"><input id="senha" name="senha" type="password" autocomplete="current-password" required style="padding-right:84px">
    <button type="button" class="link small" data-acao="mostrar-senha" aria-pressed="false" aria-controls="senha" style="position:absolute;right:6px;top:5px;min-height:32px;padding:0 8px">mostrar<span class="sr-only"> senha</span></button></div>
    ${e.senha ? `<span class="msg-erro">${e.senha}</span>` : ''}</div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <label class="check"><input type="checkbox" name="manter" checked> Manter conectado</label>
    <button type="button" class="link small" data-acao="esqueci">Esqueci minha senha</button></div>
  <button class="btn pri" style="justify-content:center;padding:12px">Entrar</button>
  <p class="small muted" style="text-align:center">O acesso é criado por convite da responsável financeira.</p>
  <p class="dica">Protótipo: entre com <b>helena@exemplo.org</b>, <b>camila@exemplo.org</b> ou <b>sergio@exemplo.org</b> e qualquer senha.</p>
  </form></main>`;
}

function casca(r, conteudo) {
  const u = usuario();
  const areas = [['painel', 'Painel'], ['contas', 'Contas'], ['calendario', 'Calendário'], ['relatorios', 'Relatórios'], ['config', 'Configurações']];
  const ativa = { conta: 'contas', nova: 'contas', editar: 'contas' }[r.nome] || r.nome;
  const lemb = lembretesAtivos();
  const atual = (id) => (ativa === id ? ' aria-current="page"' : '');
  const nav = areas.map(([id, nome]) => `<a class="nav ${ativa === id ? 'on' : ''}" href="#/${id}"${atual(id)}>${icone(id)}${nome}</a>`).join('');
  const navCel = areas.map(([id, nome]) => `<a class="${ativa === id ? 'on' : ''}" href="#/${id}"${atual(id)}>${icone(id, 22)}${id === 'config' ? 'Mais' : nome}</a>`).join('');
  return `<a class="pular" href="#conteudo" data-acao="pular">Pular para o conteúdo</a>
  <div class="app"${ui.modal ? ' inert' : ''}>
  <header class="topbar">
    <a class="logo" href="#/painel" aria-label="CorAção em Dia, ir para o painel"><span class="coracao" aria-hidden="true">♡</span><span><b>Cor</b><span class="az">Ação</span> em Dia</span></a>
    <div class="busca" role="search">${icone('busca', 18)}<label class="sr-only" for="busca-global">Buscar contas</label>
      <input id="busca-global" type="search" placeholder="Buscar conta, fornecedor…" value="${esc(ui.lista.q)}"></div>
    <div class="sino" style="position:relative">
      <button class="icone-btn" data-acao="notif" aria-label="Lembretes: ${lemb.length} ${lemb.length === 1 ? 'conta precisa' : 'contas precisam'} de atenção" aria-expanded="${ui.notif}" aria-controls="painel-lembretes">${icone('sino', 18)}${lemb.length ? `<span class="badge" aria-hidden="true">${lemb.length}</span>` : ''}</button>
      ${ui.notif ? `<div class="menu notif" id="painel-lembretes" role="region" aria-label="Lembretes"><div style="padding:8px 12px;font-weight:700" aria-hidden="true">Lembretes</div>${lemb.map((c) => `<a class="item" href="#/conta/${c.id}">
        <b>${esc(c.descricao)}</b> · ${fmt(c.valor)}<br><span class="small muted">${estado(c) === 'vencida' ? 'Venceu ' + prazo(c) : 'Vence ' + prazo(c)}</span></a>`).join('') || '<p class="vazio small">Nenhum lembrete agora.</p>'}</div>` : ''}
    </div>
    <span class="avatar" role="img" aria-label="Sessão de ${esc(u.nome)}" title="${esc(u.nome)}">${iniciais(u.nome)}</span>
  </header>
  <nav class="side" aria-label="Menu principal">${nav}
    <div class="usuario"><span class="avatar" aria-hidden="true">${iniciais(u.nome)}</span><div><b>${esc(u.nome.split(' ')[0])} ${esc(u.nome.split(' ')[1]?.[0] || '')}.</b><div class="small muted">${u.perfil} · <button data-acao="sair">Sair</button></div></div></div>
  </nav>
  <main id="conteudo">${conteudo}
  ${r.nome !== 'nova' && r.nome !== 'editar' ? '<a class="fab" href="#/nova" aria-label="Nova conta"><span aria-hidden="true">+</span></a>' : ''}</main>
  <nav class="bottom-nav" aria-label="Menu principal (celular)">${navCel}</nav>
  </div>`;
}

function telaPainel() {
  const s = saidas().filter((c) => !c.pagamento);
  const venc = s.filter((c) => estado(c) === 'vencida');
  const hoje = s.filter((c) => estado(c) === 'hoje');
  const prox = s.filter((c) => estado(c) === 'avencer' && diasEntre(HOJE, c.venc) <= 7);
  const doMes = saidas().filter((c) => mesDe(c.venc) === mesDe(HOJE));
  const pagasMes = doMes.filter((c) => c.pagamento);
  const soma = (l) => l.reduce((t, c) => t + c.valor, 0);
  const r = resumoMes(db.contas, mesDe(HOJE));
  const pagas = saidas().filter((c) => c.pagamento && mesDe(c.venc) === mesDe(HOJE)).sort((a, b) => b.pagamento.data.localeCompare(a.pagamento.data)).slice(0, 3);
  const lista = urgentes();
  const hora = new Date().getHours();
  const cumprimento = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const cartao = (cls, rot, l, filtro, extra) => `<button class="card stat ${cls}" data-acao="filtrar" data-estado="${filtro}">
    <span class="rot">${rot}</span><span class="n">${l.length}</span><span class="muted">${extra || fmt(soma(l))}</span></button>`;
  return `
  <div class="cab"><div><h1 class="titulo">${cumprimento}, ${esc(primeiroNome())}!</h1>
    <p class="muted">Hoje é ${diaSemana(HOJE)}, ${+HOJE.slice(8)} de ${MESES[+HOJE.slice(5, 7) - 1].toLowerCase()}. Aqui está o resumo das suas contas.</p></div>
    <a class="btn pri novo" href="#/nova">+ Nova conta</a></div>
  <div class="grid-4">
    ${cartao('vencida', 'Vencidas', venc, 'vencida')}
    ${cartao('hoje', 'Vencem hoje', hoje, 'hoje')}
    ${cartao('', 'Próximos 7 dias', prox, 'avencer')}
    <button class="card stat mes" data-acao="filtrar" data-estado="todos"><span class="rot">A pagar no mês</span><span class="n" style="font-size:24px;padding:4px 0">${fmt(soma(doMes))}</span>
      <span class="muted">${doMes.length} contas · ${pagasMes.length} já pagas</span></button>
  </div>
  <div class="duas">
    <section class="card tabela"><div class="topo"><div><h2 style="display:inline">Exigem atenção</h2> <span class="small muted">ordenadas por urgência</span></div><a href="#/contas" class="small">Ver todas<span class="sr-only"> as contas</span> <span aria-hidden="true">→</span></a></div>
      ${lista.length ? `<table><caption class="sr-only">Contas que exigem atenção, ordenadas por urgência</caption><thead><tr><th scope="col">Estado</th><th scope="col">Descrição</th><th scope="col" class="esconde-cel">Vencimento</th><th scope="col" class="num">Valor</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead><tbody>
      ${lista.map((c) => `<tr data-ir="#/conta/${c.id}"><td>${tag(c)}</td><td><a class="linha-link" href="#/conta/${c.id}">${esc(c.descricao)}</a><div class="small muted so-cel">${curta(c.venc)} · ${prazo(c)}</div></td>
        <td class="esconde-cel">${curta(c.venc)} <span class="muted small">· ${prazo(c)}</span></td><td class="num">${fmt(c.valor)}</td>
        <td class="num"><button class="btn sm" data-acao="pagar" data-id="${c.id}">Pagar<span class="sr-only"> ${esc(c.descricao)}</span></button></td></tr>`).join('')}</tbody></table>`
      : '<p class="vazio">Nada urgente. Todas as contas dos próximos 7 dias estão pagas ou agendadas.</p>'}
    </section>
    <div class="pilha">
      <section class="card"><h2 style="margin-bottom:8px">Resumo de ${MESES[+HOJE.slice(5, 7) - 1].toLowerCase()}</h2>
        <div class="kv"><span>Entradas</span><b class="verde">${fmt(r.entradas)}</b></div>
        <div class="kv"><span>Saídas</span><b class="vermelho">${fmt(r.saidas)}</b></div>
        <div class="kv"><b>Saldo</b><b class="azul" style="font-size:19px">${fmt(r.saldo)}</b></div>
        <a href="#/relatorios" class="small">Ver relatório <span aria-hidden="true">→</span></a></section>
      <section class="card"><h2 style="margin-bottom:4px">Pagas recentemente</h2><div class="lista-simples">
        ${pagas.map((c) => `<div><a href="#/conta/${c.id}" style="color:inherit;text-decoration:none"><b>${esc(c.descricao)}</b></a><span class="muted small">${curta(c.pagamento.data)} · ${fmt(c.pagamento.valor)}</span></div>`).join('') || '<p class="muted small">Nenhuma ainda.</p>'}
      </div></section>
    </div>
  </div>`;
}

function filtrarLista() {
  const f = ui.lista;
  // busca tolerante: ignora acentos e maiúsculas ("agua" encontra "Conta de água")
  const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = norm(f.q.trim());
  const base = db.contas.filter((c) => c.tipo === f.tipo && mesDe(c.venc) === f.mes && (!f.cat || c.categoria === f.cat)
    && (!q || norm(c.descricao).includes(q) || norm(c.fornecedor).includes(q)));
  const contagem = {};
  base.forEach((c) => { const e = estado(c); contagem[e] = (contagem[e] || 0) + 1; });
  const linhas = f.estado === 'todos' ? base : base.filter((c) => estado(c) === f.estado);
  const chave = { estado: (c) => URGENCIA[estado(c)], descricao: (c) => c.descricao.toLowerCase(), categoria: (c) => c.categoria, venc: (c) => c.venc, valor: (c) => c.valor }[f.ordem];
  linhas.sort((a, b) => (chave(a) > chave(b) ? 1 : chave(a) < chave(b) ? -1 : 0) * f.dir);
  return { base, linhas, contagem };
}

function telaContas() {
  const f = ui.lista;
  const { base, linhas, contagem } = filtrarLista();
  const POR_PAGINA = 8;
  const paginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  f.pagina = Math.min(f.pagina, paginas);
  const pagina = linhas.slice((f.pagina - 1) * POR_PAGINA, f.pagina * POR_PAGINA);
  const total = linhas.reduce((t, c) => t + valorPago(c), 0);
  const abas = f.tipo === 'saida'
    ? [['todos', 'Todas'], ['vencida', 'Vencidas'], ['hoje', 'Vence hoje'], ['avencer', 'A vencer'], ['agendada', 'Agendadas'], ['paga', 'Pagas']]
    : [['todos', 'Todas'], ['prevista', 'Previstas'], ['recebida', 'Recebidas']];
  const th = (campo, nome, cls = '') => `<th scope="col" class="${cls}"${f.ordem === campo ? ` aria-sort="${f.dir > 0 ? 'ascending' : 'descending'}"` : ''}><button data-acao="ordenar" data-campo="${campo}" class="${f.ordem === campo ? 'on' : ''}">${nome} <span aria-hidden="true">${f.ordem === campo ? (f.dir > 0 ? '↓' : '↑') : '↕'}</span><span class="sr-only">, ordenar</span></button></th>`;
  return `
  <div class="cab"><h1 class="titulo">Contas</h1><a class="btn pri novo" href="#/nova${f.tipo === 'entrada' ? '?tipo=entrada' : ''}">+ ${f.tipo === 'entrada' ? 'Nova entrada' : 'Nova conta'}</a></div>
  <div style="margin-bottom:14px" class="seg" role="group" aria-label="Tipo de conta">
    <button class="${f.tipo === 'saida' ? 'on' : ''}" aria-pressed="${f.tipo === 'saida'}" data-acao="tipo-lista" data-tipo="saida">A pagar</button>
    <button class="${f.tipo === 'entrada' ? 'on' : ''}" aria-pressed="${f.tipo === 'entrada'}" data-acao="tipo-lista" data-tipo="entrada">A receber</button></div>
  <div class="abas" role="group" aria-label="Filtrar por estado">${abas.map(([id, nome]) => `<button class="${f.estado === id ? 'on' : ''}" aria-pressed="${f.estado === id}" data-acao="aba-estado" data-estado="${id}">${nome} (${id === 'todos' ? base.length : contagem[id] || 0})</button>`).join('')}</div>
  <div class="filtros">
    <div class="busca-lista"><label class="sr-only" for="busca-lista">Buscar por descrição ou fornecedor</label><input id="busca-lista" type="search" placeholder="Buscar por descrição ou fornecedor…" value="${esc(f.q)}"></div>
    <div class="mes-sel">${botoesMes('mes-lista', f.mes)}</div>
    <label class="sr-only" for="cat-lista">Filtrar por categoria</label>
    <select id="cat-lista" style="width:220px"><option value="">Categoria: todas</option>${categoriasAtivas().map((c) => `<option ${f.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  </div>
  <section class="card tabela">
    ${pagina.length ? `<table><caption class="sr-only">Contas de ${nomeMes(f.mes)}</caption><thead><tr>${th('estado', 'Estado')}${th('descricao', 'Descrição')}${th('categoria', 'Categoria', 'esconde-cel')}${th('venc', 'Vencimento', 'esconde-cel')}${th('valor', 'Valor', 'num')}<th scope="col" class="esconde-cel">Anexo</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>
    ${pagina.map((c) => `<tr data-ir="#/conta/${c.id}"><td>${tag(c)}</td><td><a class="linha-link" href="#/conta/${c.id}">${esc(c.descricao)}</a><div class="small muted so-cel">${dataBR(c.venc)}</div></td>
      <td class="esconde-cel">${esc(c.categoria)}</td><td class="esconde-cel">${dataBR(c.venc)}</td><td class="num">${fmt(valorPago(c))}</td>
      <td class="esconde-cel">${c.anexos.length ? '<span class="arq">PDF</span>' : '<span class="muted" aria-label="sem anexo">—</span>'}</td>
      <td class="num"><div class="menu-linha"><button data-acao="menu" data-id="${c.id}" aria-label="Ações de ${esc(c.descricao)}" aria-haspopup="true" aria-expanded="${ui.menu === c.id}"><span aria-hidden="true">⋯</span></button>${ui.menu === c.id ? menuLinha(c) : ''}</div></td></tr>`).join('')}
    </tbody></table>` : `<p class="vazio">Nenhuma conta encontrada com esses filtros.</p>`}
    <div class="topo" style="border-top:1px solid var(--borda)"><div><b>Total filtrado: ${fmt(total)}</b> <span class="muted small">· ${linhas.length} de ${base.length} contas</span></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="small muted">Página ${f.pagina} de ${paginas}</span>
      <button class="btn sm" data-acao="pagina" data-delta="-1" ${f.pagina <= 1 ? 'disabled' : ''}><span aria-hidden="true">‹</span> Anterior<span class="sr-only"> página</span></button>
      <button class="btn sm" data-acao="pagina" data-delta="1" ${f.pagina >= paginas ? 'disabled' : ''}>Próxima<span class="sr-only"> página</span> <span aria-hidden="true">›</span></button></div></div>
  </section>`;
}

function menuLinha(c) {
  const e = estado(c);
  const aberto = !c.pagamento;
  return `<div class="menu">
    <button data-acao="ir" data-hash="#/conta/${c.id}">Ver detalhes</button>
    <button data-acao="ir" data-hash="#/editar/${c.id}">Editar</button>
    ${aberto ? `<button data-acao="pagar" data-id="${c.id}"><b>${c.tipo === 'entrada' ? 'Registrar recebimento' : 'Registrar pagamento'}</b></button>` : `<button data-acao="desfazer-pagamento" data-id="${c.id}">Desfazer ${c.tipo === 'entrada' ? 'recebimento' : 'pagamento'}</button>`}
    ${aberto && c.tipo === 'saida' ? `<button data-acao="agendar" data-id="${c.id}">${e === 'agendada' ? 'Desmarcar agendamento' : 'Marcar como agendada'}</button>` : ''}
    <button class="perigo" data-acao="excluir" data-id="${c.id}">Excluir…</button></div>`;
}

function anexoCampo(nome, rotulo, arquivo) {
  const rot = rotulo ? `<span class="sr-only">${esc(rotulo)}: </span>` : '';
  const escolhido = arquivo ? `<span class="sr-only">. Arquivo escolhido: ${esc(arquivo)}</span>` : '';
  return `<div class="so-pc"><label class="drop">${rot}<span aria-hidden="true">↑</span><br>Arraste o arquivo para cá ou <u>clique para selecionar</u><br><span class="small">PDF, JPG ou PNG</span>${escolhido}
    <input type="file" name="${nome}" accept=".pdf,image/*">${arquivo ? `<div class="arquivo" aria-hidden="true">${esc(arquivo)}</div>` : ''}</label></div>
  <div class="so-cel" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <label class="drop">${rot}<b>Tirar foto</b>${escolhido}<input type="file" name="${nome}-foto" accept="image/*" capture="environment"></label>
    <label class="drop">${rot}Escolher arquivo${escolhido}<input type="file" name="${nome}-cel" accept=".pdf,image/*"></label>
    ${arquivo ? `<div class="arquivo small" style="grid-column:1/-1" aria-hidden="true">${esc(arquivo)}</div>` : ''}</div>`;
}

function telaForm(r) {
  const editando = r.nome === 'editar' ? conta(r.id) : null;
  if (r.nome === 'editar' && !editando) return naoEncontrada();
  const c = editando || { tipo: r.params.get('tipo') === 'entrada' ? 'entrada' : 'saida', descricao: '', valor: null, venc: r.params.get('data') || '', categoria: '', fornecedor: '', repetir: 'nao', obs: '', lembretes: [3, 1, 0], anexos: [] };
  const e = ui.erros;
  const v = (k) => esc(e.valores?.[k] ?? (k === 'valor' ? (c.valor != null ? (c.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '') : c[k]));
  const tipo = e.valores?.tipo || c.tipo;
  const lemb = e.valores?.lembretes || c.lembretes;
  const fornecedores = [...new Set(db.contas.map((x) => x.fornecedor).filter(Boolean))];
  const campo = (k, rot, html) => `<div class="campo ${e[k] ? 'erro' : ''}"><label for="f-${k}">${rot.replace(' *', ' ' + estrela)}</label>${html}${e[k] ? `<span class="msg-erro">${e[k]}</span>` : ''}</div>`;
  return `
  <div class="cab"><div><nav class="migalha" aria-label="Você está em"><a href="#/contas">Contas</a> <span aria-hidden="true">›</span> <span aria-current="page">${editando ? 'Editar' : 'Nova conta'}</span></nav><h1 class="titulo">${editando ? 'Editar: ' + esc(c.descricao) : 'Nova conta'}</h1></div></div>
  <form id="form-conta" class="form" novalidate data-id="${editando ? c.id : ''}">
    <input type="hidden" name="tipo" value="${tipo}">
    <div class="seg" role="group" aria-label="Tipo de lançamento" style="align-self:flex-start">
      <button type="button" class="${tipo === 'saida' ? 'on' : ''}" aria-pressed="${tipo === 'saida'}" data-acao="tipo-form" data-tipo="saida">Saída (conta a pagar)</button>
      <button type="button" class="${tipo === 'entrada' ? 'on' : ''}" aria-pressed="${tipo === 'entrada'}" data-acao="tipo-form" data-tipo="entrada">Entrada</button></div>
    <div class="duas larga-400">
      <div class="form">
        ${campo('descricao', 'Descrição *', `<input id="f-descricao" name="descricao" type="text" required autocomplete="off" placeholder="Ex.: Conta de energia" value="${v('descricao')}">`)}
        <div class="linha">
          ${campo('valor', 'Valor (R$) *', `<input id="f-valor" name="valor" type="text" inputmode="decimal" required placeholder="0,00" value="${v('valor')}">`)}
          ${campo('venc', tipo === 'entrada' ? 'Data prevista *' : 'Vencimento *', `<input id="f-venc" name="venc" type="date" required value="${v('venc')}">`)}
        </div>
        <div class="linha">
          ${campo('categoria', 'Categoria', `<select id="f-categoria" name="categoria"><option value="">Selecione…</option>${categoriasAtivas().map((x) => `<option ${v('categoria') === esc(x) ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`)}
          ${campo('fornecedor', tipo === 'entrada' ? 'Origem' : 'Fornecedor', `<input id="f-fornecedor" name="fornecedor" type="text" list="fornecedores" value="${v('fornecedor')}"><datalist id="fornecedores">${fornecedores.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`)}
        </div>
        <fieldset class="campo"><legend class="rotulo">Repetir</legend><div class="opcoes">
          ${[['nao', 'Não repete'], ['mensal', 'Todo mês'], ['semanal', 'Toda semana'], ['anual', 'Todo ano']].map(([id, nome]) => `<label><input type="radio" name="repetir" value="${id}" ${(e.valores?.repetir || c.repetir) === id ? 'checked' : ''}> ${nome}</label>`).join('')}
        </div></fieldset>
        ${campo('obs', 'Observações', `<textarea id="f-obs" name="obs" placeholder="Opcional">${v('obs')}</textarea>`)}
        <p class="small muted"><span aria-hidden="true">*</span> campos obrigatórios</p>
      </div>
      <div class="form">
        <div class="campo"><span class="rotulo" aria-hidden="true">${tipo === 'entrada' ? 'Comprovante' : 'Boleto ou nota fiscal'}</span>${anexoCampo('anexo', tipo === 'entrada' ? 'Comprovante' : 'Boleto ou nota fiscal', e.valores?.anexo || c.anexos[0])}</div>
        ${tipo === 'saida' ? `<fieldset class="card form" style="gap:10px"><legend class="sr-only">Lembretes desta conta</legend><b aria-hidden="true">Lembretes desta conta</b>
          ${[[3, '3 dias antes'], [1, '1 dia antes'], [0, 'No dia do vencimento'], [7, '1 semana antes']].map(([d, nome]) => `<label class="check"><input type="checkbox" name="lembretes" value="${d}" ${lemb.map(Number).includes(d) ? 'checked' : ''}> ${nome}</label>`).join('')}</fieldset>` : ''}
        <div class="previa" id="previa" aria-live="polite" aria-atomic="true"></div>
      </div>
    </div>
    <div class="acoes"><a class="btn" href="${editando ? '#/conta/' + c.id : '#/contas'}">Cancelar</a><button class="btn pri">${editando ? 'Salvar alterações' : 'Salvar conta'}</button></div>
  </form>`;
}

function lerForm(form) {
  const d = new FormData(form);
  const arquivo = ['anexo', 'anexo-foto', 'anexo-cel'].map((n) => d.get(n)).find((f) => f && f.name);
  return {
    tipo: d.get('tipo'), descricao: d.get('descricao').trim(), valor: d.get('valor'), venc: d.get('venc'), categoria: d.get('categoria'),
    fornecedor: d.get('fornecedor').trim(), repetir: d.get('repetir') || 'nao', obs: d.get('obs').trim(),
    lembretes: d.getAll('lembretes').map(Number), anexo: arquivo ? arquivo.name : ui.erros.valores?.anexo,
  };
}

function atualizarPrevia() {
  const form = $('#form-conta'); const alvo = $('#previa');
  if (!form || !alvo) return;
  const v = lerForm(form);
  if (!v.venc) { const vazio = '<span class="small muted">Como esta conta vai aparecer</span><span class="small">Preencha o vencimento para ver o estado.</span>'; if (alvo.dataset.html !== vazio) { alvo.innerHTML = vazio; alvo.dataset.html = vazio; } return; }
  const c = { tipo: v.tipo, venc: v.venc, pagamento: null, agendada: false };
  const e = estado(c);
  const prox = proximasOcorrencias(v.venc, v.repetir);
  const nomes = { 3: '3 dias antes', 1: '1 dia antes', 0: 'no dia', 7: '1 semana antes' };
  const html = `<span class="small muted">Como esta conta vai aparecer</span>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="tag ${e}">${ROTULO[e]}</span><b>${e === 'vencida' ? 'venceu ' + prazo(c) : e === 'prevista' ? 'prevista para ' + dataBR(v.venc) : 'vence ' + prazo(c)}</b></div>
    ${v.tipo === 'saida' ? `<span class="small muted">Lembretes: ${v.lembretes.length ? v.lembretes.sort((a, b) => b - a).map((d) => nomes[d]).join(', ') : 'nenhum'}</span>` : ''}
    ${prox.length ? `<span class="small muted">Próximas: ${prox.map(dataBR).join(', ')}</span>` : ''}
    <span class="small muted">O estado é calculado pelo sistema a partir da data.</span>`;
  if (alvo.dataset.html !== html) { alvo.innerHTML = html; alvo.dataset.html = html; }
}

function salvarConta(form) {
  const v = lerForm(form);
  const erros = {};
  if (!v.descricao) erros.descricao = 'Informe a descrição.';
  const centavos = parseValor(v.valor);
  if (!(centavos > 0)) erros.valor = 'Informe um valor válido, por exemplo 142,30.';
  if (!v.venc) erros.venc = 'Informe a data.';
  if (Object.keys(erros).length) { ui.erros = { ...erros, valores: v }; ui.focar = '[aria-invalid="true"]'; anunciar(`Não foi possível salvar: ${Object.values(erros).join(' ')}`); render(); return; }
  ui.erros = {};
  const quem = primeiroNome();
  const id = form.dataset.id;
  if (id) {
    const c = conta(id);
    Object.assign(c, { tipo: v.tipo, descricao: v.descricao, valor: centavos, venc: v.venc, categoria: v.categoria || 'Outros', fornecedor: v.fornecedor, repetir: v.repetir, obs: v.obs, lembretes: v.lembretes });
    if (v.anexo && !c.anexos.includes(v.anexo)) c.anexos.push(v.anexo);
    c.historico.push({ quando: agora(), texto: `${quem} editou a conta` });
    salvar(); toast('Alterações salvas.'); ir('#/conta/' + id); return;
  }
  const novo = (venc, texto) => ({
    id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tipo: v.tipo, descricao: v.descricao, valor: centavos, venc,
    categoria: v.categoria || 'Outros', fornecedor: v.fornecedor, repetir: v.repetir, obs: v.obs, lembretes: v.lembretes,
    anexos: v.anexo && texto ? [v.anexo] : [], pagamento: null, agendada: false, historico: [{ quando: agora(), texto }],
  });
  const c = novo(v.venc, `${quem} cadastrou a conta`);
  if (v.anexo) c.historico.push({ quando: agora(), texto: `${quem} anexou ${v.anexo}` });
  db.contas.push(c);
  proximasOcorrencias(v.venc, v.repetir).forEach((d) => db.contas.push(novo(d, 'Conta gerada (recorrente)')));
  salvar();
  toast(`“${v.descricao}” cadastrada${v.repetir !== 'nao' ? ' com as próximas ocorrências' : ''}.`);
  ir('#/conta/' + c.id);
}

function naoEncontrada() {
  return '<div class="card vazio"><h1 class="titulo">Conta não encontrada</h1><p>Ela pode ter sido excluída.</p><p style="margin-top:12px"><a class="btn" href="#/contas">Voltar para Contas</a></p></div>';
}

function telaDetalhe(r) {
  const c = conta(r.id);
  if (!c) return naoEncontrada();
  const e = estado(c);
  const entrada = c.tipo === 'entrada';
  return `
  <div class="cab"><div><nav class="migalha" aria-label="Você está em"><a href="#/contas">Contas</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(c.descricao)}</span></nav>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><h1 class="titulo">${esc(c.descricao)}</h1>${tag(c)}
    ${c.pagamento ? '' : `<span class="muted">${e === 'vencida' ? 'venceu ' + prazo(c) : (entrada ? 'prevista ' : 'vence ') + prazo(c)}</span>`}</div></div></div>
  <div class="duas larga-440">
    <section class="card"><div class="grande" style="margin-bottom:10px">${fmt(c.valor)}</div>
      ${c.pagamento ? `<div class="paga-box" style="margin-bottom:12px">${entrada ? 'Recebida' : 'Paga'} em ${dataBR(c.pagamento.data)} (${diaSemana(c.pagamento.data)}) por ${esc(c.pagamento.por)}<br>
        <span class="small">${fmt(c.pagamento.valor)} · ${esc(c.pagamento.forma)}${c.pagamento.multa ? ' · com multa/juros' : ''}${c.pagamento.obs ? ' · ' + esc(c.pagamento.obs) : ''}</span></div>` : ''}
      <div class="kv"><span class="muted">${entrada ? 'Data prevista' : 'Vencimento'}</span><span>${dataBR(c.venc)} (${diaSemana(c.venc)})</span></div>
      <div class="kv"><span class="muted">Categoria</span><span>${esc(c.categoria)}</span></div>
      <div class="kv"><span class="muted">${entrada ? 'Origem' : 'Fornecedor'}</span><span>${esc(c.fornecedor) || '—'}</span></div>
      <div class="kv"><span class="muted">Repetição</span><span>${{ nao: 'Não repete', mensal: 'Todo mês', semanal: 'Toda semana', anual: 'Todo ano' }[c.repetir]}</span></div>
      <div class="kv"><span class="muted">Observações</span><span>${esc(c.obs) || '—'}</span></div>
      <div style="display:flex;gap:20px;margin-top:14px"><a href="#/editar/${c.id}">Editar<span class="sr-only"> conta</span></a><button class="link" style="color:var(--vencida)" data-acao="excluir" data-id="${c.id}">Excluir conta</button></div>
    </section>
    <div class="pilha">
      <section class="card"><h2 style="margin-bottom:10px">Anexos</h2>
        ${c.anexos.map((a) => `<div class="kv"><span><span class="arq">${a.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}</span> ${esc(a)}</span><button class="link small" data-acao="abrir-anexo" data-nome="${esc(a)}">Abrir<span class="sr-only"> ${esc(a)}</span></button></div>`).join('') || '<p class="small muted">Nenhum anexo.</p>'}
        <label class="btn sm" style="margin-top:10px;position:relative">+ Adicionar anexo<input type="file" id="add-anexo" data-id="${c.id}" accept=".pdf,image/*"></label></section>
      <section class="card"><h2 style="margin-bottom:6px">Histórico</h2><div class="historico">
        ${[...c.historico].reverse().map((h) => `<div><time class="quando" datetime="${h.quando}">${curta(h.quando)} ${h.quando.slice(11, 16)}</time><span>${esc(h.texto)}</span></div>`).join('')}</div></section>
    </div>
  </div>
  <div class="acoes" style="margin-top:20px;border-top:1px solid var(--borda);padding-top:20px">
    ${c.pagamento ? `<button class="btn" data-acao="desfazer-pagamento" data-id="${c.id}">Desfazer ${entrada ? 'recebimento' : 'pagamento'}</button>`
      : `${entrada ? '' : `<button class="btn" data-acao="agendar" data-id="${c.id}">${e === 'agendada' ? 'Desmarcar agendamento' : 'Marcar como agendada'}</button>`}
         <button class="btn pri" data-acao="pagar" data-id="${c.id}">${entrada ? 'Registrar recebimento' : 'Registrar pagamento'}</button>`}
  </div>`;
}

function modalPagamento() {
  const c = conta(ui.modal.id);
  if (!c) return '';
  const m = ui.modal;
  const entrada = c.tipo === 'entrada';
  return `<div class="modal-fundo" data-acao="fechar-modal"><div class="modal-dialogo" role="dialog" aria-modal="true" aria-labelledby="t-pag" aria-describedby="d-pag"><form class="modal" id="form-pagamento" novalidate>
    <div class="cab"><h2 id="t-pag" style="font-size:21px;color:var(--azul)">${entrada ? 'Registrar recebimento' : 'Registrar pagamento'}</h2><button type="button" class="fechar" data-acao="fechar-modal" aria-label="Fechar janela"><span aria-hidden="true">×</span></button></div>
    <div class="resumo-conta" id="d-pag"><span>${esc(c.descricao)} · ${entrada ? 'prev.' : 'venc.'} ${dataBR(c.venc)}</span><b>${fmt(c.valor)}</b></div>
    <div class="linha">
      <div class="campo"><label for="p-data">Data ${entrada ? 'do recebimento' : 'do pagamento'} ${estrela}</label><input id="p-data" name="data" type="date" required value="${m.data || HOJE}"></div>
      <div class="campo ${m.erroValor ? 'erro' : ''}"><label for="p-valor">Valor ${entrada ? 'recebido' : 'pago'} ${estrela}</label><input id="p-valor" name="valor" type="text" inputmode="decimal" required ${m.multa ? '' : 'aria-describedby="dica-valor"'} value="${esc(m.valor ?? (c.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}" ${m.multa ? '' : 'readonly'}>${m.erroValor ? '<span class="msg-erro">Valor inválido.</span>' : ''}${m.multa ? '' : '<span class="sr-only" id="dica-valor">Somente leitura. Marque a opção de multa ou juros para mudar o valor.</span>'}</div>
    </div>
    ${entrada ? '' : `<label class="check"><input type="checkbox" name="multa" data-acao="multa" ${m.multa ? 'checked' : ''}> Houve multa ou juros (ajustar o valor pago)</label>`}
    <div class="campo ${m.erroForma ? 'erro' : ''}"><label for="p-forma">Forma de pagamento ${estrela}</label><select id="p-forma" name="forma" required><option value="">Selecione…</option>
      ${['Pix', 'Boleto', 'Transferência', 'Débito automático', 'Cartão', 'Dinheiro'].map((f) => `<option ${m.forma === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
      ${m.erroForma ? '<span class="msg-erro">Escolha a forma de pagamento.</span>' : ''}</div>
    <div class="campo"><span class="rotulo" aria-hidden="true">Comprovante</span>${anexoCampo('comprovante', 'Comprovante', m.comprovante)}</div>
    <div class="campo"><label for="p-obs">Observação (opcional)</label><input id="p-obs" name="obs" type="text" value="${esc(m.obs || '')}"></div>
    <p class="small muted">O ${entrada ? 'recebimento' : 'pagamento'} ficará registrado em nome de ${esc(usuario().nome)}.</p>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      ${entrada ? '<span></span>' : `<button type="button" class="link small" data-acao="agendar" data-id="${c.id}">Só marcar como agendada</button>`}
      <div class="acoes"><button type="button" class="btn" data-acao="fechar-modal">Cancelar</button><button class="btn pri">Confirmar</button></div></div>
  </form></div></div>`;
}

function confirmarPagamento(form) {
  const c = conta(ui.modal.id);
  const d = new FormData(form);
  const valor = parseValor(d.get('valor'));
  const arquivo = ['comprovante', 'comprovante-foto', 'comprovante-cel'].map((n) => d.get(n)).find((f) => f && f.name);
  Object.assign(ui.modal, { data: d.get('data'), valor: d.get('valor'), forma: d.get('forma'), obs: d.get('obs'), multa: !!d.get('multa'),
    comprovante: arquivo ? arquivo.name : ui.modal.comprovante, erroValor: !(valor > 0), erroForma: !d.get('forma') });
  if (ui.modal.erroValor || ui.modal.erroForma || !ui.modal.data) { ui.focar = '#form-pagamento [aria-invalid="true"]'; render(); return; }
  const m = ui.modal;
  c.pagamento = { data: m.data, valor, forma: m.forma, por: usuario().nome, comprovante: m.comprovante || null, multa: m.multa, obs: m.obs };
  if (m.comprovante && !c.anexos.includes(m.comprovante)) c.anexos.push(m.comprovante);
  c.agendada = false;
  const verbo = c.tipo === 'entrada' ? 'recebimento' : 'pagamento';
  c.historico.push({ quando: agora(), texto: `${primeiroNome()} registrou o ${verbo}` });
  salvar();
  ui.modal = null; ui.focar = ui.modalOrigem;
  toast(`${c.tipo === 'entrada' ? 'Recebimento' : 'Pagamento'} de “${c.descricao}” registrado.`, c.id);
  render();
}

function desfazerPagamento(id) {
  const c = conta(id);
  if (!c?.pagamento) return;
  c.pagamento = null;
  c.historico.push({ quando: agora(), texto: `${primeiroNome()} desfez o ${c.tipo === 'entrada' ? 'recebimento' : 'pagamento'}` });
  salvar();
  ui.toast = null;
  toast('Registro desfeito. A conta voltou ao estado anterior.');
  render();
}

function telaCalendario() {
  const ym = ui.calMes;
  const [y, mo] = ym.split('-').map(Number);
  const primeiro = new Date(y, mo - 1, 1, 12);
  const inicio = (primeiro.getDay() + 6) % 7; // semana começando na segunda
  const diasMes = new Date(y, mo, 0).getDate();
  const celulas = [];
  for (let i = 0; i < Math.ceil((inicio + diasMes) / 7) * 7; i++) {
    const dt = new Date(y, mo - 1, 1 - inicio + i, 12).toISOString().slice(0, 10);
    celulas.push(dt);
  }
  const doDia = (iso) => db.contas.filter((c) => c.venc === iso && c.tipo === 'saida');
  const cor = { vencida: 'var(--vencida)', hoje: 'var(--hoje)', avencer: 'var(--avencer)', agendada: 'var(--agendada)' };
  const pilulas = (iso) => {
    const l = doDia(iso);
    const abertas = l.filter((c) => !c.pagamento).sort((a, b) => URGENCIA[estado(a)] - URGENCIA[estado(b)]);
    const pagas = l.length - abertas.length;
    return (abertas.length ? `<span class="pilula" aria-hidden="true" style="background:${cor[estado(abertas[0])]}">${abertas.length}<span class="pil-txt"> ${abertas.length > 1 ? 'contas' : 'conta'}</span></span>` : '')
      + (pagas ? `<span class="pilula" aria-hidden="true" style="background:var(--paga)">✓ ${pagas}<span class="pil-txt"> paga${pagas > 1 ? 's' : ''}</span></span>` : '');
  };
  const resumoDia = (iso) => {
    const l = doDia(iso);
    const partes = [`${+iso.slice(8)} de ${MESES[+iso.slice(5, 7) - 1].toLowerCase()}, ${diaSemana(iso)}`];
    if (mesDe(iso) !== ym) return partes[0] + `, ${iso < ym ? 'mês anterior' : 'próximo mês'}`;
    if (iso === HOJE) partes.push('hoje');
    const abertas = l.filter((c) => !c.pagamento);
    if (abertas.length) {
      const porEstado = {};
      abertas.forEach((c) => { const e = ROTULO[estado(c)].toLowerCase(); porEstado[e] = (porEstado[e] || 0) + 1; });
      partes.push(`${abertas.length} ${abertas.length > 1 ? 'contas' : 'conta'} em aberto (${Object.entries(porEstado).map(([e, n]) => `${n} ${e}`).join(', ')})`);
    }
    const pagas = l.length - abertas.length;
    if (pagas) partes.push(`${pagas} paga${pagas > 1 ? 's' : ''}`);
    if (!l.length) partes.push('sem contas');
    return partes.join(', ');
  };
  const sel = ui.calDia;
  const lista = doDia(sel);
  const proximas = saidas().filter((c) => !c.pagamento && c.venc > sel).sort((a, b) => a.venc.localeCompare(b.venc)).slice(0, 3);
  return `
  <div class="cab"><h1 class="titulo">Calendário</h1><a class="btn pri novo" href="#/nova?data=${sel}">+ Nova conta</a></div>
  <div class="duas">
    <div><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <div class="mes-sel">${botoesMes('mes-cal', ym)}</div>
      <button class="btn sm" data-acao="cal-hoje">Hoje</button></div>
      <p class="sr-only" id="dica-cal">Use as setas do teclado para mudar de dia, Page Up e Page Down para mudar de mês.</p>
      <!-- só o dia selecionado entra no Tab; as setas movem entre os dias (padrão de grade do WAI-ARIA) -->
      <div class="cal" role="group" aria-label="Calendário de ${nomeMes(ym)}" aria-describedby="dica-cal">${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => `<div class="hd" aria-hidden="true">${d}</div>`).join('')}
        ${celulas.map((iso) => `<button data-acao="dia" data-dia="${iso}" tabindex="${iso === sel ? 0 : -1}" aria-pressed="${iso === sel}"${iso === HOJE ? ' aria-current="date"' : ''} class="${mesDe(iso) !== ym ? 'fora' : ''} ${iso === sel ? 'sel' : ''} ${iso === HOJE ? 'hoje-dia' : ''}" aria-label="${resumoDia(iso)}">
          <span class="d" aria-hidden="true">${+iso.slice(8)}</span>${mesDe(iso) === ym ? pilulas(iso) : ''}</button>`).join('')}</div>
      <div class="legenda" aria-hidden="true" style="margin-top:10px"><span><i style="background:var(--vencida)"></i>vencida</span><span><i style="background:var(--hoje)"></i>vence hoje</span><span><i style="background:var(--avencer)"></i>a vencer</span><span><i style="background:var(--agendada)"></i>agendada</span><span><i style="background:var(--paga)"></i>paga</span></div>
    </div>
    <section class="card" aria-live="polite" aria-atomic="false"><h2 style="margin-bottom:6px">Contas de ${curta(sel)}</h2><div class="lista-simples">
      ${lista.map((c) => `<div style="flex-direction:column;gap:4px"><a href="#/conta/${c.id}" style="display:flex;justify-content:space-between;color:inherit;text-decoration:none"><b>${esc(c.descricao)}</b><b>${fmt(c.valor)}</b></a><span>${tag(c)}</span></div>`).join('') || '<p class="small muted" style="padding:8px 0">Nenhuma conta neste dia.</p>'}
      </div>
      ${proximas.length ? `<p class="small muted" style="margin-top:12px">Próximos dias</p><div class="lista-simples">${proximas.map((c) => `<div><a href="#/conta/${c.id}" style="color:inherit;text-decoration:none"><b>${esc(c.descricao)}</b><div class="small muted">${curta(c.venc)}</div></a><span>${fmt(c.valor)}</span></div>`).join('')}</div>` : ''}
      <a href="#/nova?data=${sel}" style="display:inline-block;margin-top:12px;font-weight:600">+ Adicionar conta em ${curta(sel)}</a>
    </section>
  </div>`;
}

function dadosRelatorio() {
  const { mes, cat } = ui.rel;
  const doMes = db.contas.filter((c) => mesDe(c.venc) === mes && (!cat || c.categoria === cat)).sort((a, b) => b.venc.localeCompare(a.venc));
  const r = resumoMes(doMes, mes);
  return { doMes, r };
}

function telaRelatorios() {
  const { mes, cat, modo, todos } = ui.rel;
  const { doMes, r } = dadosRelatorio();
  let grupos;
  if (modo === 'semana') {
    const fim = new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate();
    grupos = [1, 8, 15, 22, 29].filter((d) => d <= fim).map((d, i) => {
      const l = doMes.filter((c) => +c.venc.slice(8) >= d && +c.venc.slice(8) < d + 7);
      return { rot: `Sem. ${i + 1}`, ...resumoMes(l, mes) };
    });
  } else {
    grupos = [-5, -4, -3, -2, -1, 0].map((n) => {
      const ym = addMeses(mes + '-01', n).slice(0, 7);
      return { rot: MESES[+ym.slice(5) - 1].slice(0, 3), ...resumoMes(db.contas.filter((c) => !cat || c.categoria === cat), ym) };
    });
  }
  const max = Math.max(1, ...grupos.flatMap((g) => [g.entradas, g.saidas]));
  const porCat = {};
  doMes.filter((c) => c.tipo === 'saida').forEach((c) => { porCat[c.categoria] = (porCat[c.categoria] || 0) + valorPago(c); });
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map((x) => x[1]));
  const lanc = todos ? doMes : doMes.slice(0, 6);
  return `
  <div class="cab"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><h1 class="titulo">Relatórios</h1>
    <div class="mes-sel">${botoesMes('mes-rel', mes)}</div>
    <label class="sr-only" for="cat-rel">Filtrar por categoria</label><select id="cat-rel" style="width:210px" class="nao-imprime"><option value="">Todas as categorias</option>${categoriasAtivas().map((c) => `<option ${cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <div class="acoes nao-imprime"><button class="btn" data-acao="exportar-planilha">Exportar planilha</button><button class="btn pri" data-acao="exportar-pdf">Exportar PDF</button></div></div>
  <div class="grid-3">
    <div class="card"><span class="muted">Entradas <span aria-hidden="true">↑</span></span><div class="grande verde">${fmt(r.entradas)}</div></div>
    <div class="card"><span class="muted">Saídas <span aria-hidden="true">↓</span></span><div class="grande vermelho">${fmt(r.saidas)}</div></div>
    <div class="card" style="border:2px solid var(--azul)"><span class="muted">Saldo do mês</span><div class="grande azul">${fmt(r.saldo)}</div></div>
  </div>
  <div class="duas-igual" style="margin-bottom:20px">
    <section class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px"><h2>Entradas e saídas</h2>
      <div class="seg nao-imprime" role="group" aria-label="Agrupar gráfico"><button class="${modo === 'semana' ? 'on' : ''}" aria-pressed="${modo === 'semana'}" data-acao="modo-rel" data-modo="semana">Por semana</button><button class="${modo === 'meses' ? 'on' : ''}" aria-pressed="${modo === 'meses'}" data-acao="modo-rel" data-modo="meses">Últimos 6 meses</button></div></div>
      <div class="legenda" aria-hidden="true" style="margin-bottom:10px"><span><i style="background:var(--paga)"></i>Entradas</span><span><i style="background:var(--vencida)"></i>Saídas</span></div>
      <!-- o gráfico é só visual; os mesmos números estão na tabela logo abaixo (alternativa textual, WCAG 1.1.1) -->
      <div aria-hidden="true"><div class="barras">${grupos.map((g) => `<div class="g"><div class="b ent" style="height:${(g.entradas / max) * 100}%" title="Entradas ${fmt(g.entradas)}"></div><div class="b sai" style="height:${(g.saidas / max) * 100}%" title="Saídas ${fmt(g.saidas)}"></div></div>`).join('')}</div>
      <div class="rotulos">${grupos.map((g) => `<span>${g.rot}</span>`).join('')}</div></div>
      <details class="dados-grafico"${ui.rel.tabela ? ' open' : ''}><summary data-acao="tabela-rel">Ver os valores do gráfico em tabela</summary>
        <table><caption class="sr-only">Entradas e saídas ${modo === 'semana' ? 'por semana de ' + nomeMes(mes) : 'nos últimos 6 meses'}</caption>
        <thead><tr><th scope="col">${modo === 'semana' ? 'Semana' : 'Mês'}</th><th scope="col" class="num">Entradas</th><th scope="col" class="num">Saídas</th></tr></thead>
        <tbody>${grupos.map((g) => `<tr style="cursor:default"><th scope="row">${modo === 'semana' ? g.rot.replace('Sem.', 'Semana') : g.rot}</th><td class="num">${fmt(g.entradas)}</td><td class="num">${fmt(g.saidas)}</td></tr>`).join('')}</tbody></table></details></section>
    <section class="card"><h2 style="margin-bottom:12px">Saídas por categoria</h2>
      ${cats.map(([n, v]) => `<div class="hbarra"><span>${esc(n)}</span><div class="trilho" aria-hidden="true"><div style="width:${(v / maxCat) * 100}%"></div></div><span class="num muted">${fmt(v)} · ${Math.round((v / (r.saidas || 1)) * 100)}%</span></div>`).join('') || '<p class="small muted">Sem saídas neste mês.</p>'}</section>
  </div>
  <section class="card tabela"><div class="topo"><div><h2 style="display:inline">Lançamentos do mês</h2> <span class="small muted">com comprovante vinculado</span></div>
    ${doMes.length > 6 ? `<button class="link small nao-imprime" data-acao="todos-rel">${todos ? 'Mostrar menos' : `Ver todos os ${doMes.length} lançamentos →`}</button>` : ''}</div>
    ${lanc.length ? `<table><caption class="sr-only">Lançamentos de ${nomeMes(mes)}</caption><thead><tr><th scope="col">Data</th><th scope="col">Descrição</th><th scope="col" class="esconde-cel">Tipo</th><th scope="col" class="num">Valor</th><th scope="col" class="esconde-cel">Comprovante</th></tr></thead><tbody>
    ${lanc.map((c) => `<tr data-ir="#/conta/${c.id}"><td>${curta(c.venc)}</td><td><a class="linha-link" style="font-weight:500" href="#/conta/${c.id}">${esc(c.descricao)}</a></td><td class="esconde-cel">${c.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
      <td class="num ${c.tipo === 'entrada' ? 'verde' : ''}">${fmt(valorPago(c))}</td><td class="esconde-cel">${c.pagamento?.comprovante || c.anexos.length ? '<span class="arq">PDF</span>' : '<span class="muted" aria-label="sem comprovante">—</span>'}</td></tr>`).join('')}
    </tbody></table>` : '<p class="vazio">Nenhum lançamento neste mês.</p>'}</section>`;
}

function exportarPlanilha() {
  const { doMes } = dadosRelatorio();
  const linhas = [['Data', 'Descrição', 'Tipo', 'Categoria', 'Fornecedor/Origem', 'Estado', 'Valor (R$)', 'Comprovante']]
    .concat(doMes.map((c) => [dataBR(c.venc), c.descricao, c.tipo === 'entrada' ? 'Entrada' : 'Saída', c.categoria, c.fornecedor, ROTULO[estado(c)],
      (valorPago(c) / 100).toFixed(2).replace('.', ','), c.pagamento?.comprovante || c.anexos[0] || '']));
  const csv = linhas.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); // BOM: Excel abre acentos certo
  const a = Object.assign(document.createElement('a'), { href: url, download: `relatorio-${ui.rel.mes}.csv` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Planilha baixada.');
  render();
}

function telaConfig(r) {
  const aba = r.id || 'lembretes';
  const abas = [['lembretes', 'Lembretes'], ['usuarios', 'Usuários'], ['categorias', 'Categorias'], ['acessibilidade', 'Acessibilidade']];
  let corpo = '';
  if (aba === 'lembretes') {
    if (!ui.rascunhoConfig) ui.rascunhoConfig = { config: structuredClone(db.config), receb: Object.fromEntries(db.usuarios.map((u) => [u.id, u.lembretes])) };
    const rc = ui.rascunhoConfig;
    const sw = (grupo, chave, nome) => `<label class="linha-switch"><span>${nome}</span><span class="switch"><input type="checkbox" role="switch" data-acao="sw" data-grupo="${grupo}" data-chave="${chave}" ${rc.config[grupo][chave] ? 'checked' : ''}><span></span></span></label>`;
    const ex = urgentes().find((c) => estado(c) === 'avencer') || saidas()[0];
    corpo = `<div class="duas-igual">
      <div class="pilha">
        <section class="card"><h2>Quando avisar</h2>${sw('quando', 'd3', '3 dias antes do vencimento')}${sw('quando', 'd1', '1 dia antes do vencimento')}${sw('quando', 'd0', 'No dia do vencimento')}${sw('quando', 'vencida', 'Todo dia, enquanto estiver vencida')}${sw('quando', 'resumoDiario', 'Resumo diário das contas do dia, às 8h')}</section>
        <section class="card"><h2>Como avisar</h2>${sw('como', 'email', 'E-mail')}${sw('como', 'navegador', 'Notificação no navegador')}${sw('como', 'celular', 'Notificação no celular')}</section>
      </div>
      <div class="pilha">
        <section class="card"><h2>Quem recebe</h2>${db.usuarios.map((u) => `<label class="linha-switch"><span style="display:flex;gap:10px;align-items:center"><span class="avatar" aria-hidden="true">${iniciais(u.nome)}</span><span><b>${esc(u.nome)}</b><br><span class="small muted">${u.perfil}</span></span></span>
          <span class="switch"><input type="checkbox" role="switch" data-acao="sw-user" data-id="${u.id}" ${rc.receb[u.id] ? 'checked' : ''}><span></span></span></label>`).join('')}
          <a href="#/config/usuarios" class="small">Gerenciar usuários e perfis <span aria-hidden="true">→</span></a></section>
        <div><p class="small muted" style="margin-bottom:6px">Prévia da mensagem</p><div class="card" style="background:var(--fundo)">
          <b><span style="color:var(--rosa-texto)"><span aria-hidden="true">♡</span> Cor</span><span class="azul">Ação</span> em Dia</b><p style="margin:6px 0">A <b>${esc(ex.descricao)}</b> vence ${prazo(ex)}.</p>
          <p>Vencimento: ${curta(ex.venc)} · Valor: ${fmt(ex.valor)}</p><a class="btn sm pri" style="margin-top:10px" href="#/conta/${ex.id}">Abrir conta</a></div></div>
      </div></div>
      <div class="acoes" style="margin-top:20px"><button class="btn pri" data-acao="salvar-config">Salvar alterações</button></div>`;
  } else if (aba === 'usuarios') {
    corpo = `<section class="card tabela"><table><caption class="sr-only">Usuários com acesso</caption><thead><tr><th scope="col">Nome</th><th scope="col" class="esconde-cel">E-mail</th><th scope="col">Perfil</th></tr></thead><tbody>
      ${db.usuarios.map((u) => `<tr style="cursor:default"><td><b>${esc(u.nome)}</b>${u.id === usuarioId ? ' <span class="small muted">(você)</span>' : ''}</td><td class="esconde-cel">${esc(u.email)}</td>
        <td><select data-acao="perfil" data-id="${u.id}" style="width:170px" aria-label="Perfil de ${esc(u.nome)}">${['Financeiro', 'Apoio', 'Diretoria'].map((p) => `<option ${u.perfil === p ? 'selected' : ''}>${p}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></section>
      <p class="small muted" style="margin:10px 0 20px">Financeiro: todas as funções · Apoio: cadastra contas, anexa documentos e consulta · Diretoria: consulta e exporta relatórios.</p>
      <form id="form-convite" class="card form" novalidate><h2>Convidar usuário</h2>
        <div class="linha"><div class="campo ${ui.erros.convite ? 'erro' : ''}"><label for="c-nome">Nome</label><input id="c-nome" name="nome" type="text" autocomplete="off"></div>
        <div class="campo ${ui.erros.convite ? 'erro' : ''}"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" autocomplete="off">${ui.erros.convite ? `<span class="msg-erro">${ui.erros.convite}</span>` : ''}</div></div>
        <div class="campo" style="max-width:240px"><label for="c-perfil">Perfil</label><select id="c-perfil" name="perfil"><option>Apoio</option><option>Diretoria</option><option>Financeiro</option></select></div>
        <div class="acoes"><button class="btn pri">Enviar convite</button></div></form>`;
  } else if (aba === 'acessibilidade') {
    const tam = [['normal', 'Normal'], ['grande', 'Grande'], ['muito', 'Muito grande']];
    corpo = `<div class="duas-igual">
      <div class="pilha">
        <section class="card"><h2 id="t-fonte">Tamanho do texto</h2>
          <p class="small muted" style="margin:4px 0 12px">Aumenta todos os textos do sistema. Vale só para este navegador.</p>
          <div class="seg" role="group" aria-labelledby="t-fonte">${tam.map(([id, nome]) => `<button type="button" class="${pref.fonte === id ? 'on' : ''}" aria-pressed="${pref.fonte === id}" data-acao="pref-fonte" data-fonte="${id}">${nome}</button>`).join('')}</div>
          <div class="amostra"><b>Conta de energia</b> · R$ 142,30 <span class="tag hoje">Vence hoje</span></div></section>
        <section class="card"><h2>Cores</h2>
          <label class="linha-switch"><span><b>Alto contraste</b><br><span class="small muted">Textos mais escuros, bordas mais fortes e links sempre sublinhados.</span></span>
            <span class="switch"><input type="checkbox" role="switch" data-acao="pref-contraste" ${pref.contraste ? 'checked' : ''}><span></span></span></label>
          <p class="small muted" style="margin-top:8px">Os estados das contas nunca dependem só da cor: toda etiqueta tem texto (Vencida, Vence hoje, Paga…).</p></section>
      </div>
      <section class="card"><h2 style="margin-bottom:10px">Usar só com o teclado</h2>
        <div class="atalhos">
          <kbd>Tab</kbd><span>vai para o próximo botão, link ou campo (<kbd>Shift</kbd> + <kbd>Tab</kbd> volta)</span>
          <kbd>Enter</kbd><span>abre o link ou aciona o botão em foco</span>
          <kbd>Esc</kbd><span>fecha a janela de pagamento, o menu ⋯ e os lembretes</span>
          <kbd>← ↑ → ↓</kbd><span>no calendário, muda o dia selecionado</span>
          <kbd>Page Up/Down</kbd><span>no calendário, muda o mês</span>
        </div>
        <p class="small muted" style="margin-top:14px">O primeiro Tab de cada página mostra o link “Pular para o conteúdo”, que leva direto ao conteúdo sem passar pelo menu.</p>
        <h2 style="margin:18px 0 8px">Leitores de tela</h2>
        <p class="small">Botões só com ícone têm nome, as tabelas e campos têm rótulos, os erros de formulário são lidos junto com o campo, os avisos (“Pagamento registrado”) são anunciados automaticamente e o gráfico de relatórios tem uma tabela com os mesmos valores.</p>
      </section></div>`;
  } else {
    corpo = `<section class="card"><div class="lista-simples">${db.categorias.map((c, i) => `<div style="align-items:center"><span class="${c.arquivada ? 'muted' : ''}">${esc(c.nome)}${c.arquivada ? ' <span class="small">(arquivada)</span>' : ''}</span>
      <span style="display:flex;gap:14px"><button class="link small" data-acao="renomear-cat" data-i="${i}">Renomear<span class="sr-only"> ${esc(c.nome)}</span></button><button class="link small" data-acao="arquivar-cat" data-i="${i}">${c.arquivada ? 'Reativar' : 'Arquivar'}<span class="sr-only"> ${esc(c.nome)}</span></button></span></div>`).join('')}</div></section>
      <form id="form-categoria" class="card" style="margin-top:20px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap" novalidate>
        <div class="campo ${ui.erros.categoria ? 'erro' : ''}" style="flex:1;min-width:200px"><label for="nova-cat">Nova categoria</label><input id="nova-cat" name="nome" type="text">${ui.erros.categoria ? `<span class="msg-erro">${ui.erros.categoria}</span>` : ''}</div>
        <button class="btn pri">Adicionar</button></form>`;
  }
  return `
  <div class="cab"><div><h1 class="titulo">Configurações</h1><p class="muted">Defina quando, como e para quem o sistema avisa, quem acessa, quais categorias existem e como o sistema aparece para você.</p></div></div>
  <nav class="abas" aria-label="Seções de configurações">${abas.map(([id, nome]) => `<a class="${aba === id ? 'on' : ''}" href="#/config/${id}"${aba === id ? ' aria-current="page"' : ''}>${nome}</a>`).join('')}</nav>
  ${corpo}
  <p class="small muted nao-imprime" style="margin-top:32px">Protótipo: <button class="link small" data-acao="restaurar">restaurar dados de exemplo</button> · <a href="#/sair" data-acao="sair">sair</a></p>`;
}

// ---------------------------------------------------------------- render
function render() {
  const foco = chaveFoco(document.activeElement);
  const tinhaFoco = document.activeElement !== document.body && !!document.activeElement?.closest('#app');
  const cursor = document.activeElement?.id && 'selectionStart' in document.activeElement ? document.activeElement.selectionStart : null;
  const r = rota();
  const raiz = $('#app');
  if (!usuario()) {
    raiz.innerHTML = telaLogin();
    document.title = 'Entrar · CorAção em Dia';
  } else {
    if (r.nome === 'login') { location.replace('#/painel'); return; }
    const telas = { painel: telaPainel, contas: telaContas, nova: telaForm, editar: telaForm, conta: telaDetalhe, calendario: telaCalendario, relatorios: telaRelatorios, config: telaConfig };
    const tela = telas[r.nome] || telaPainel;
    raiz.innerHTML = casca(r, tela(r)) + (ui.modal ? modalPagamento() : '');
    const titulos = { painel: 'Painel', contas: 'Contas', nova: 'Nova conta', editar: 'Editar conta', conta: conta(r.id)?.descricao || 'Conta', calendario: 'Calendário', relatorios: 'Relatórios', config: 'Configurações' };
    document.title = `${titulos[r.nome] || 'Painel'} · CorAção em Dia`;
    atualizarPrevia();
  }
  if (ui.toast) {
    raiz.insertAdjacentHTML('beforeend', `<div class="toast"><span>${esc(ui.toast.texto)}</span>${ui.toast.desfazer ? `<button data-acao="desfazer-pagamento" data-id="${ui.toast.desfazer}">Desfazer<span class="sr-only"> ${esc(ui.toast.texto.replace(/ registrado\.$/, ''))}</span></button>` : ''}</div>`);
  }
  ligarErros(raiz);
  const pedido = ui.focar; ui.focar = null;
  if (!focar(pedido)) {
    if (foco && focar(foco)) {
      const el = document.activeElement;
      if (cursor != null && el.setSelectionRange && el.type !== 'date' && el.type !== 'email') try { el.setSelectionRange(cursor, cursor); } catch { /* campo sem cursor */ }
    } else if (pedido || tinhaFoco) focar('main h1'); // o elemento focado sumiu (ex.: conta paga saiu da lista): vai para o título em vez de cair no <body>
  }
}

// ---------------------------------------------------------------- eventos
function mudarMes(ym, delta) { return addMeses(ym + '-01', delta).slice(0, 7); }

document.addEventListener('click', (ev) => {
  const alvo = ev.target.closest('[data-acao]');
  const linha = ev.target.closest('tr[data-ir]');
  if (!alvo) {
    if (ui.menu || ui.notif) { ui.menu = null; ui.notif = false; render(); }
    if (linha) location.hash = linha.dataset.ir;
    return;
  }
  const { acao, id } = alvo.dataset;
  if (acao === 'fechar-modal' && alvo.classList.contains('modal-fundo') && ev.target !== alvo) return; // clique dentro da janela
  if (alvo.tagName === 'INPUT' || alvo.tagName === 'SELECT') return; // tratados no "change"
  if (acao === 'tabela-rel') { ui.rel.tabela = !alvo.parentElement.open; return; } // o <details> abre sozinho
  ev.preventDefault();
  if (acao !== 'menu') ui.menu = null;
  if (acao !== 'notif') ui.notif = false;
  const f = ui.lista;
  let aviso = null;
  switch (acao) {
    case 'mostrar-senha': {
      const s = $('#senha'); const mostrando = s.type === 'password';
      s.type = mostrando ? 'text' : 'password';
      alvo.innerHTML = `${mostrando ? 'ocultar' : 'mostrar'}<span class="sr-only"> senha</span>`;
      alvo.setAttribute('aria-pressed', String(mostrando)); return;
    }
    case 'pular': focar('main h1'); return;
    case 'esqueci': toast('Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.'); break;
    case 'sair':
      try { localStorage.removeItem('coracao-usuario'); sessionStorage.removeItem('coracao-usuario'); } catch { /* ok */ }
      usuarioId = null; ui.modal = null; location.hash = '#/login'; break;
    case 'notif': ui.notif = !ui.notif; if (ui.notif) ui.focar = lembretesAtivos().length ? '#painel-lembretes .item' : '#painel-lembretes'; break;
    case 'ir': location.hash = alvo.dataset.hash; return;
    case 'filtrar': Object.assign(f, { tipo: 'saida', estado: alvo.dataset.estado, q: '', cat: '', mes: mesDe(HOJE), pagina: 1, ordem: 'venc', dir: 1 }); ir('#/contas'); return;
    case 'tipo-lista': Object.assign(f, { tipo: alvo.dataset.tipo, estado: 'todos', pagina: 1 }); aviso = avisoLista; break;
    case 'aba-estado': Object.assign(f, { estado: alvo.dataset.estado, pagina: 1 }); aviso = avisoLista; break;
    case 'mes-lista': f.mes = mudarMes(f.mes, +alvo.dataset.delta); f.pagina = 1; aviso = () => `${nomeMes(f.mes)}. ${avisoLista()}`; break;
    case 'ordenar': f.dir = f.ordem === alvo.dataset.campo ? -f.dir : 1; f.ordem = alvo.dataset.campo; aviso = () => `Ordenado por ${alvo.textContent.replace(/[↓↑↕]|, ordenar/g, '').trim().toLowerCase()}, ${f.dir > 0 ? 'crescente' : 'decrescente'}.`; break;
    case 'pagina': f.pagina += +alvo.dataset.delta; aviso = () => `Página ${f.pagina}.`; break;
    case 'menu': ui.menu = ui.menu === id ? null : id; if (ui.menu) ui.focar = '.menu-linha .menu button'; break;
    case 'pagar':
      ui.modalOrigem = alvo.closest('.menu-linha') ? `[data-acao="menu"][data-id="${CSS.escape(id)}"]` : chaveFoco(alvo);
      ui.modal = { id }; ui.focar = '#p-data'; break;
    case 'fechar-modal': ui.modal = null; ui.focar = ui.modalOrigem; break;
    case 'agendar': {
      const c = conta(id);
      c.agendada = !c.agendada;
      c.historico.push({ quando: agora(), texto: `${primeiroNome()} ${c.agendada ? 'marcou como agendada no banco' : 'desmarcou o agendamento'}` });
      if (ui.modal) ui.focar = ui.modalOrigem;
      salvar(); ui.modal = null; toast(c.agendada ? `“${c.descricao}” marcada como agendada.` : 'Agendamento desmarcado.'); break;
    }
    case 'desfazer-pagamento': desfazerPagamento(id); return;
    case 'excluir': {
      const c = conta(id);
      if (!confirm(`Excluir “${c.descricao}” (${fmt(c.valor)}, ${dataBR(c.venc)})? Essa ação não pode ser desfeita.`)) return;
      db.contas = db.contas.filter((x) => x.id !== id); salvar(); toast('Conta excluída.');
      if (rota().nome === 'conta') { ir('#/contas'); return; }
      break;
    }
    case 'abrir-anexo': toast(`No protótipo os arquivos não são guardados de verdade (${alvo.dataset.nome}).`); break;
    case 'tipo-form': {
      const form = $('#form-conta');
      ui.erros = { ...ui.erros, valores: { ...lerForm(form), tipo: alvo.dataset.tipo } }; break;
    }
    case 'mes-cal': ui.calMes = mudarMes(ui.calMes, +alvo.dataset.delta); ui.calDia = ui.calMes + '-01'; aviso = () => `Calendário de ${nomeMes(ui.calMes)}.`; break;
    case 'cal-hoje': ui.calMes = mesDe(HOJE); ui.calDia = HOJE; break;
    case 'dia': ui.calDia = alvo.dataset.dia; ui.calMes = mesDe(ui.calDia); break;
    case 'mes-rel': ui.rel.mes = mudarMes(ui.rel.mes, +alvo.dataset.delta); ui.rel.todos = false; aviso = () => `Relatório de ${nomeMes(ui.rel.mes)}.`; break;
    case 'modo-rel': ui.rel.modo = alvo.dataset.modo; break;
    case 'pref-fonte': pref.fonte = alvo.dataset.fonte; salvarPreferencias(); aviso = () => `Tamanho do texto: ${alvo.textContent.toLowerCase()}.`; break;
    case 'todos-rel': ui.rel.todos = !ui.rel.todos; break;
    case 'exportar-planilha': exportarPlanilha(); return;
    case 'exportar-pdf': ui.rel.todos = true; render(); window.print(); return;
    case 'salvar-config': {
      db.config = ui.rascunhoConfig.config;
      db.usuarios.forEach((u) => { u.lembretes = ui.rascunhoConfig.receb[u.id]; });
      ui.rascunhoConfig = null; salvar(); toast('Configurações de lembretes salvas.'); break;
    }
    case 'renomear-cat': {
      const c = db.categorias[+alvo.dataset.i];
      const novo = prompt('Novo nome da categoria:', c.nome)?.trim();
      if (!novo || novo === c.nome) return;
      db.contas.forEach((x) => { if (x.categoria === c.nome) x.categoria = novo; });
      c.nome = novo; salvar(); toast('Categoria renomeada.'); break;
    }
    case 'arquivar-cat': { const c = db.categorias[+alvo.dataset.i]; c.arquivada = !c.arquivada; salvar(); toast(c.arquivada ? 'Categoria arquivada. As contas antigas continuam com ela.' : 'Categoria reativada.'); break; }
    case 'restaurar':
      if (!confirm('Apagar as alterações feitas neste navegador e voltar aos dados de exemplo?')) return;
      db = seed(); salvar(); ui.rascunhoConfig = null; toast('Dados de exemplo restaurados.'); break;
    default: return;
  }
  render();
  if (aviso) anunciar(aviso());
});
const avisoLista = () => { const n = filtrarLista().linhas.length; return n ? `${n} ${n > 1 ? 'contas encontradas' : 'conta encontrada'}.` : 'Nenhuma conta encontrada.'; };

document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.id === 'cat-lista') { ui.lista.cat = el.value; ui.lista.pagina = 1; render(); }
  else if (el.id === 'cat-rel') { ui.rel.cat = el.value; render(); }
  else if (el.dataset.acao === 'multa') {
    const form = $('#form-pagamento'); const d = new FormData(form);
    Object.assign(ui.modal, { multa: el.checked, data: d.get('data'), forma: d.get('forma'), obs: d.get('obs'), valor: d.get('valor') });
    render(); if (el.checked) $('#p-valor')?.focus();
  } else if (el.dataset.acao === 'sw') ui.rascunhoConfig.config[el.dataset.grupo][el.dataset.chave] = el.checked;
  else if (el.dataset.acao === 'sw-user') ui.rascunhoConfig.receb[el.dataset.id] = el.checked;
  else if (el.dataset.acao === 'pref-contraste') { pref.contraste = el.checked; salvarPreferencias(); anunciar(el.checked ? 'Alto contraste ligado.' : 'Alto contraste desligado.'); }
  else if (el.dataset.acao === 'perfil') {
    const u = db.usuarios.find((x) => x.id === el.dataset.id);
    u.perfil = el.value; salvar(); toast(`Perfil de ${u.nome.split(' ')[0]} alterado para ${el.value}.`); render();
  } else if (el.id === 'add-anexo' && el.files[0]) {
    const c = conta(el.dataset.id);
    c.anexos.push(el.files[0].name);
    c.historico.push({ quando: agora(), texto: `${primeiroNome()} anexou ${el.files[0].name}` });
    salvar(); toast('Anexo adicionado.'); render();
  } else if (el.type === 'file' && el.files[0]) {
    if (el.closest('#form-conta')) { ui.erros = { ...ui.erros, valores: { ...lerForm($('#form-conta')), anexo: el.files[0].name } }; render(); }
    else if (el.closest('#form-pagamento')) {
      const d = new FormData($('#form-pagamento'));
      Object.assign(ui.modal, { comprovante: el.files[0].name, data: d.get('data'), forma: d.get('forma'), obs: d.get('obs'), valor: d.get('valor') });
      render();
    }
  }
  if (el.closest('#form-conta')) atualizarPrevia();
});

document.addEventListener('mouseover', (ev) => { if (ev.target.closest?.('.toast')) clearTimeout(timerToast); });
document.addEventListener('focusin', (ev) => { if (ev.target.closest?.('.toast')) clearTimeout(timerToast); });
document.addEventListener('mouseout', (ev) => { if (ev.target.closest?.('.toast') && !ev.relatedTarget?.closest?.('.toast') && ui.toast) iniciarTimerToast(); });
document.addEventListener('focusout', (ev) => { if (ev.target.closest?.('.toast') && !ev.relatedTarget?.closest?.('.toast') && ui.toast) iniciarTimerToast(); });

let timerBusca;
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'busca-lista') {
    ui.lista.q = el.value; ui.lista.pagina = 1; render();
    clearTimeout(timerBusca); timerBusca = setTimeout(() => anunciar(avisoLista()), 800); // espera parar de digitar
  }
  else if (el.closest('#form-conta')) atualizarPrevia();
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && (ui.modal || ui.menu || ui.notif)) {
    ui.focar = ui.modal ? ui.modalOrigem : ui.menu ? `[data-acao="menu"][data-id="${CSS.escape(ui.menu)}"]` : '[data-acao="notif"]';
    ui.modal = null; ui.menu = null; ui.notif = false; render(); return;
  }
  if (ev.key === 'Tab' && ui.modal) {
    const itens = [...document.querySelectorAll(`.modal ${FOCAVEIS.split(', ').join(', .modal ')}`)].filter((e) => e.offsetParent !== null);
    if (itens.length) {
      const [primeiro, ultimo] = [itens[0], itens[itens.length - 1]];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
      else if (!document.activeElement.closest('.modal')) { ev.preventDefault(); primeiro.focus(); }
    }
  }
  if (ev.target.dataset?.acao === 'dia') {
    const passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key];
    const meses = { PageUp: -1, PageDown: 1 }[ev.key];
    let novo = null;
    if (passo) { const d = new Date(ev.target.dataset.dia + 'T12:00:00'); d.setDate(d.getDate() + passo); novo = d.toISOString().slice(0, 10); }
    else if (meses) novo = addMeses(ev.target.dataset.dia, meses);
    else if (ev.key === 'Home') novo = ui.calMes + '-01';
    else if (ev.key === 'End') { const [y, m] = ui.calMes.split('-').map(Number); novo = `${ui.calMes}-${new Date(y, m, 0).getDate()}`; }
    if (novo) {
      ev.preventDefault();
      const mudouMes = mesDe(novo) !== ui.calMes;
      ui.calDia = novo; ui.calMes = mesDe(novo); ui.focar = `[data-dia="${novo}"]`; render();
      if (mudouMes) anunciar(`Calendário de ${nomeMes(ui.calMes)}.`);
    }
  }
  if (ev.key === 'Enter' && ev.target.id === 'busca-global') {
    Object.assign(ui.lista, { q: ev.target.value, estado: 'todos', pagina: 1 });
    ir('#/contas');
  }
});

document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const form = ev.target;
  if (form.id === 'form-login') {
    const email = form.email.value.trim().toLowerCase();
    const u = db.usuarios.find((x) => x.email.toLowerCase() === email);
    ui.erros = {};
    if (!email) ui.erros.email = 'Informe seu e-mail.';
    else if (!u) ui.erros.email = 'E-mail não encontrado. O acesso é criado por convite da responsável financeira.';
    if (!form.senha.value) ui.erros.senha = 'Informe sua senha.';
    if (ui.erros.email || ui.erros.senha) { ui.erros.emailValor = form.email.value; ui.focar = '[aria-invalid="true"]'; render(); return; }
    usuarioId = u.id;
    try { (form.manter.checked ? localStorage : sessionStorage).setItem('coracao-usuario', u.id); } catch { /* sessão só em memória */ }
    location.hash = '#/painel';
    render();
  } else if (form.id === 'form-conta') salvarConta(form);
  else if (form.id === 'form-pagamento') confirmarPagamento(form);
  else if (form.id === 'form-convite') {
    const nome = form.nome.value.trim(); const email = form.email.value.trim();
    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) { ui.erros = { convite: 'Informe nome e um e-mail válido.' }; ui.focar = nome ? '#c-email' : '#c-nome'; render(); return; }
    if (db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) { ui.erros = { convite: 'Esse e-mail já tem acesso.' }; ui.focar = '#c-email'; render(); return; }
    ui.erros = {};
    db.usuarios.push({ id: 'u' + Date.now().toString(36), nome, email, perfil: form.perfil.value, lembretes: false });
    salvar(); toast(`Convite enviado para ${email}.`); render();
  } else if (form.id === 'form-categoria') {
    const nome = form.nome.value.trim();
    if (!nome || db.categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) { ui.erros = { categoria: nome ? 'Essa categoria já existe.' : 'Informe o nome.' }; ui.focar = '#nova-cat'; render(); return; }
    ui.erros = {}; db.categorias.push({ nome, arquivada: false }); salvar(); toast('Categoria adicionada.'); render();
  }
});

window.addEventListener('hashchange', () => {
  const r = rota();
  if (r.nome === 'sair') return;
  ui.erros = {}; ui.menu = null; ui.notif = false;
  if (r.nome !== 'config') ui.rascunhoConfig = null;
  if (r.nome !== 'conta' && r.nome !== 'painel' && r.nome !== 'contas') ui.modal = null;
  const naAba = document.activeElement?.closest('.abas');
  if (!ui.focar) ui.focar = naAba ? `.abas a[href="${location.hash}"]` : 'main h1';
  render();
  window.scrollTo(0, 0);
});

render();
