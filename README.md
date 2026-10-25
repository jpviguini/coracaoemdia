# CorAção em Dia

Protótipo funcional do CorAção em Dia, organizador de vencimentos do Projeto CorAção (SCC0260 — Interação Humano-Computador e UX).

**Acesse:** https://jpviguini.github.io/coracaoemdia/

Entre com `helena@exemplo.org` (financeiro), `camila@exemplo.org` (apoio) ou `sergio@exemplo.org` (diretoria) e qualquer senha.

## O que dá para fazer

- **Painel:** contas vencidas, que vencem hoje e nos próximos 7 dias; clicar num cartão abre a lista filtrada; botão Pagar em cada conta urgente.
- **Contas:** abas A pagar / A receber, filtros por estado, busca, mês, categoria, ordenação pelas colunas e menu ⋯ em cada linha.
- **Nova conta / editar:** validação dos campos obrigatórios, prévia do estado calculado, recorrência (gera as próximas ocorrências) e lembretes por conta.
- **Detalhe:** anexos, histórico com quem fez cada ação, marcar como agendada, excluir com confirmação.
- **Registrar pagamento:** data e valor já preenchidos, multa/juros, forma de pagamento, comprovante e opção de desfazer.
- **Calendário:** vencimentos do mês e contas do dia selecionado.
- **Relatórios:** totais do mês, gráfico por semana ou últimos 6 meses, saídas por categoria, exportar planilha (CSV) e PDF (impressão do navegador).
- **Configurações:** lembretes, usuários (perfil e convite) e categorias.
- **Celular:** mesma estrutura em uma coluna, com barra inferior e botão + de nova conta.

## Observações do protótipo

- A data "de hoje" é fixa em 14/09/2026, a mesma do cenário das personas, para os dados de exemplo fazerem sentido.
- Os dados ficam salvos no navegador de quem usa (localStorage). Em Configurações há um link para restaurar os dados de exemplo.
- Arquivos anexados não são enviados para lugar nenhum; o protótipo guarda só o nome.
- Lembretes por e-mail e notificação são simulados (sino no topo da tela).

## Rodar localmente

Precisa de um servidor simples por causa dos módulos JavaScript:

```
python3 -m http.server 8000
```

e abra http://localhost:8000. Testes das regras (estado da conta, valores, recorrência): `node --test tests/*.test.mjs`.
