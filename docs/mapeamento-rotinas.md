# Mapeamento Completo de Rotinas Protheus - Configuracao Tributaria

**Documento de referencia para construcao da ferramenta automatizada de configuracao Protheus**

| Informacao | Detalhe |
|---|---|
| Versao | 1.0 |
| Data | 01/04/2026 |
| Escopo | FISA170, MATA080, MATA002, MATA089 |
| Modulos | SIGAFIS, SIGAFAT, SIGAEST |

---

## Indice

1. [FISA170 - Configurador de Tributos](#1-fisa170---configurador-de-tributos)
2. [MATA080 - Tipos de Entrada e Saida (TES)](#2-mata080---tipos-de-entrada-e-saida-tes)
3. [MATA002 - Cadastro de Produtos](#3-mata002---cadastro-de-produtos)
4. [MATA089 - Cadastro de Naturezas de Operacao](#4-mata089---cadastro-de-naturezas-de-operacao)
5. [Relacionamento entre Rotinas](#5-relacionamento-entre-rotinas)

---

## 1. FISA170 - Configurador de Tributos

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | FISA170 |
| Modulo | SIGAFIS (Livros Fiscais) |
| Funcao | Configurador de Tributos |
| Tipo | MVC (Model-View-Controller) |
| Descricao | Permite criar regras tributarias complexas baseadas em condicoes (origem, destino, produto, operacao) que determinam acoes fiscais (aliquotas, CST, base de calculo, reducoes). Substitui e complementa a parametrizacao direta na TES para cenarios avancados. |

### Tabelas Envolvidas

#### CDA - Cabecalho do Configurador de Tributos

Armazena a definicao principal de cada regra tributaria.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDA_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDA_CODTRI | C | 6 | 0 | Codigo do tributo | Chave primaria; sequencial ou definido pelo usuario |
| CDA_DESTRI | C | 40 | 0 | Descricao do tributo | Texto livre descritivo |
| CDA_TPTRIB | C | 2 | 0 | Tipo de tributo | IC=ICMS, IP=IPI, PI=PIS, CO=COFINS, ST=ICMS-ST, IS=ISS, IR=IRRF, CS=CSRF, DF=DIFAL, FC=FCP, II=Imposto Importacao |
| CDA_TPOPER | C | 1 | 0 | Tipo de operacao | E=Entrada, S=Saida, A=Ambos |
| CDA_STATUS | C | 1 | 0 | Status da regra | 1=Ativo, 2=Inativo |
| CDA_PRIORI | N | 3 | 0 | Prioridade de avaliacao | 1 a 999; menor numero = maior prioridade |
| CDA_DTINI | D | 8 | 0 | Data inicio de vigencia | Data no formato AAAAMMDD |
| CDA_DTFIM | D | 8 | 0 | Data fim de vigencia | Data no formato AAAAMMDD; vazio = sem fim |
| CDA_VERSAO | C | 3 | 0 | Versao da regra | Controle de versionamento |
| CDA_OBSERV | C | 200 | 0 | Observacao | Texto livre |

**Indices principais:**

| Indice | Campos | Descricao |
|---|---|---|
| 1 | CDA_FILIAL + CDA_CODTRI | Chave unica por codigo |
| 2 | CDA_FILIAL + CDA_TPTRIB + CDA_PRIORI | Busca por tipo de tributo e prioridade |
| 3 | CDA_FILIAL + CDA_STATUS + CDA_TPTRIB | Busca por status e tipo |

#### CDH - Excecoes / Regras do Configurador

Define as condicoes de excecao que determinam QUANDO a regra do CDA sera aplicada.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDH_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDH_CODTRI | C | 6 | 0 | Codigo do tributo | FK para CDA_CODTRI |
| CDH_ITEM | C | 4 | 0 | Item sequencial | Sequencial dentro do tributo |
| CDH_TPEXCE | C | 2 | 0 | Tipo de excecao | UF=UF Origem/Destino, NC=NCM, PR=Produto, GR=Grupo, CF=CFOP, CL=Cliente, FO=Fornecedor, TE=TES, OP=Operacao, MU=Municipio, RG=Regime Tributario |
| CDH_UFORIG | C | 2 | 0 | UF de origem | Sigla UF (SP, RJ, MG...) |
| CDH_UFDEST | C | 2 | 0 | UF de destino | Sigla UF |
| CDH_NCMDE | C | 10 | 0 | NCM inicial (faixa) | Codigo NCM |
| CDH_NCMATE | C | 10 | 0 | NCM final (faixa) | Codigo NCM |
| CDH_PRODDE | C | 15 | 0 | Produto inicial | Codigo do produto (SB1) |
| CDH_PRODAT | C | 15 | 0 | Produto final | Codigo do produto (SB1) |
| CDH_GRPDE | C | 4 | 0 | Grupo de produto inicial | Codigo do grupo (SBM) |
| CDH_GRPATE | C | 4 | 0 | Grupo de produto final | Codigo do grupo (SBM) |
| CDH_CFOPDE | C | 5 | 0 | CFOP inicial | Codigo CFOP |
| CDH_CFOPAT | C | 5 | 0 | CFOP final | Codigo CFOP |
| CDH_CODCLI | C | 6 | 0 | Codigo do cliente | FK para SA1 |
| CDH_LOJCLI | C | 2 | 0 | Loja do cliente | FK para SA1 |
| CDH_CODFOR | C | 6 | 0 | Codigo do fornecedor | FK para SA2 |
| CDH_LOJFOR | C | 2 | 0 | Loja do fornecedor | FK para SA2 |
| CDH_CODTES | C | 3 | 0 | Codigo TES | FK para SF4 |
| CDH_TPCLIF | C | 1 | 0 | Tipo cli/for | F=Pessoa Fisica, J=Pessoa Juridica |
| CDH_CONTRI | C | 1 | 0 | Contribuinte ICMS | 1=Sim, 2=Nao, 3=Isento |
| CDH_REGIME | C | 1 | 0 | Regime tributario | 1=Lucro Real, 2=Lucro Presumido, 3=Simples Nacional |
| CDH_SUFRAM | C | 1 | 0 | Possui SUFRAMA | S=Sim, N=Nao |
| CDH_CESTDE | C | 7 | 0 | CEST inicial | Codigo CEST |
| CDH_CESTAT | C | 7 | 0 | CEST final | Codigo CEST |
| CDH_ORIGIN | C | 1 | 0 | Origem da mercadoria | 0=Nacional, 1=Estrangeira importacao direta, 2=Estrangeira adquirida mercado interno, 3-8=Conteudo importacao |

**Indices principais:**

| Indice | Campos | Descricao |
|---|---|---|
| 1 | CDH_FILIAL + CDH_CODTRI + CDH_ITEM | Chave unica |
| 2 | CDH_FILIAL + CDH_TPEXCE + CDH_CODTRI | Busca por tipo de excecao |

#### CDB - Condicoes (Filtros Detalhados)

Define condicoes adicionais que refinam quando a regra se aplica.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDB_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDB_CODTRI | C | 6 | 0 | Codigo do tributo | FK para CDA_CODTRI |
| CDB_ITEM | C | 4 | 0 | Item sequencial | Sequencial |
| CDB_CAMPO | C | 20 | 0 | Campo a avaliar | Nome do campo do Protheus (ex: D1_TES, B1_ORIGEM, A1_CONTRIB) |
| CDB_OPERAD | C | 2 | 0 | Operador logico | EQ=Igual, NE=Diferente, GT=Maior que, LT=Menor que, GE=Maior ou igual, LE=Menor ou igual, CT=Contem, BT=Between |
| CDB_VALOR | C | 60 | 0 | Valor da condicao | Valor a comparar |
| CDB_VALORF | C | 60 | 0 | Valor final (Between) | Usado quando CDB_OPERAD = BT |
| CDB_CONECT | C | 1 | 0 | Conectivo logico | E=AND, O=OR |

**Indices principais:**

| Indice | Campos | Descricao |
|---|---|---|
| 1 | CDB_FILIAL + CDB_CODTRI + CDB_ITEM | Chave unica |

#### CDC - Acoes (Cabecalho)

Define quais acoes fiscais serao aplicadas quando as condicoes forem atendidas.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDC_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDC_CODTRI | C | 6 | 0 | Codigo do tributo | FK para CDA_CODTRI |
| CDC_ITEM | C | 4 | 0 | Item sequencial | Sequencial |
| CDC_TPACAO | C | 2 | 0 | Tipo de acao | AL=Aliquota, BC=Base de calculo, CS=CST, RD=Reducao, MV=MVA, VL=Valor fixo, FO=Formula, IS=Isencao |
| CDC_IMPSTO | C | 2 | 0 | Imposto afetado | IC=ICMS, IP=IPI, PI=PIS, CO=COFINS, ST=ICMS-ST, DF=DIFAL, FC=FCP, IS=ISS |
| CDC_VLACAO | N | 14 | 4 | Valor da acao | Percentual ou valor conforme tipo de acao |
| CDC_FORMUL | C | 200 | 0 | Formula customizada | Expressao ADVPL para calculo customizado |
| CDC_CST | C | 3 | 0 | CST a aplicar | Quando CDC_TPACAO = CS; codigo CST conforme imposto |
| CDC_REDBC | N | 6 | 2 | Percentual reducao BC | Quando CDC_TPACAO = RD; 0 a 100 |
| CDC_MVA | N | 6 | 2 | MVA (Margem Valor Agregado) | Quando CDC_TPACAO = MV; percentual para calculo ST |
| CDC_PAUTA | N | 14 | 4 | Valor de pauta | Valor unitario fixo para base de calculo |
| CDC_DESSION | C | 1 | 0 | Destaca na nota | S=Sim, N=Nao |
| CDC_DEDSOL | C | 1 | 0 | Deduz ICMS Solidario | S=Sim, N=Nao |

**Indices principais:**

| Indice | Campos | Descricao |
|---|---|---|
| 1 | CDC_FILIAL + CDC_CODTRI + CDC_ITEM | Chave unica |

#### CDD - Acoes Detalhe

Detalhamento granular das acoes quando ha necessidade de multiplas configuracoes por acao.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDD_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDD_CODTRI | C | 6 | 0 | Codigo do tributo | FK para CDA_CODTRI |
| CDD_ITEM | C | 4 | 0 | Item sequencial acao | FK para CDC_ITEM |
| CDD_SUBITE | C | 4 | 0 | Sub-item sequencial | Sequencial dentro da acao |
| CDD_CAMPO | C | 20 | 0 | Campo a preencher | Campo destino no documento fiscal (ex: D1_PICM, D1_VALICM) |
| CDD_VALOR | C | 60 | 0 | Valor a atribuir | Valor literal ou expressao |
| CDD_TIPO | C | 1 | 0 | Tipo do valor | F=Fixo, E=Expressao, P=Percentual |

**Indices principais:**

| Indice | Campos | Descricao |
|---|---|---|
| 1 | CDD_FILIAL + CDD_CODTRI + CDD_ITEM + CDD_SUBITE | Chave unica |

#### CDV - Versoes

Controle de versionamento das regras tributarias.

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| CDV_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| CDV_CODTRI | C | 6 | 0 | Codigo do tributo | FK para CDA_CODTRI |
| CDV_VERSAO | C | 3 | 0 | Numero da versao | Sequencial de versao |
| CDV_DTVERS | D | 8 | 0 | Data da versao | Data de criacao da versao |
| CDV_USRVER | C | 15 | 0 | Usuario da versao | Login do usuario que criou |
| CDV_MOTIVO | C | 200 | 0 | Motivo da alteracao | Texto livre |
| CDV_STATUS | C | 1 | 0 | Status da versao | 1=Ativa, 2=Inativa, 3=Rascunho |

### Estrutura de Tela - FISA170

```
+----------------------------------------------------------+
| FISA170 - Configurador de Tributos                       |
+----------------------------------------------------------+
| [Aba 1: Cabecalho]                                       |
|   Codigo | Descricao | Tipo Tributo | Tipo Operacao      |
|   Status | Prioridade | Dt Inicio | Dt Fim | Versao      |
|   Observacao                                              |
+----------------------------------------------------------+
| [Aba 2: Excecoes / Regras]  (Grid CDH)                   |
|   Tipo Excecao | UF Origem | UF Destino | NCM De/Ate     |
|   Produto De/Ate | Grupo De/Ate | CFOP De/Ate            |
|   Cliente | Fornecedor | TES | Contribuinte | Regime     |
|   Origem Mercadoria | CEST De/Ate | SUFRAMA              |
+----------------------------------------------------------+
| [Aba 3: Condicoes]  (Grid CDB)                           |
|   Campo | Operador | Valor | Valor Final | Conectivo     |
+----------------------------------------------------------+
| [Aba 4: Acoes]  (Grid CDC/CDD)                           |
|   Tipo Acao | Imposto | Valor | CST | Reducao BC | MVA   |
|   Formula | Pauta | Destaca na Nota                       |
|   --- Sub-grid Detalhe (CDD) ---                         |
|   Campo | Valor | Tipo                                   |
+----------------------------------------------------------+
```

### Logica de Avaliacao das Regras

1. **Selecao por tipo de tributo**: O sistema filtra regras CDA pelo tipo de tributo (ICMS, IPI, PIS, etc.) e tipo de operacao (Entrada/Saida).
2. **Filtragem por status e vigencia**: Somente regras com `CDA_STATUS = '1'` (Ativo) e data corrente entre `CDA_DTINI` e `CDA_DTFIM` sao consideradas.
3. **Avaliacao de excecoes (CDH)**: Para cada regra ativa, o sistema verifica se as condicoes da excecao sao atendidas (UF, NCM, produto, CFOP, cliente, fornecedor, TES, contribuinte, regime, etc.). Todas as condicoes de uma mesma linha de excecao devem ser verdadeiras (AND implicito).
4. **Avaliacao de condicoes adicionais (CDB)**: Se existirem condicoes adicionais, sao avaliadas com os conectivos logicos (AND/OR).
5. **Prioridade (CDA_PRIORI)**: Se multiplas regras forem atendidas, a de MENOR numero de prioridade prevalece. Apenas UMA regra e aplicada por tipo de tributo.
6. **Execucao das acoes (CDC/CDD)**: As acoes da regra vencedora sao aplicadas ao calculo fiscal (aliquota, CST, base de calculo, reducao, MVA, etc.).

### Relacionamento entre Tabelas

```
CDA (Cabecalho)
 |
 +-- CDH (Excecoes/Regras)     [1:N]  CDA_CODTRI -> CDH_CODTRI
 |
 +-- CDB (Condicoes)           [1:N]  CDA_CODTRI -> CDB_CODTRI
 |
 +-- CDC (Acoes)               [1:N]  CDA_CODTRI -> CDC_CODTRI
 |    |
 |    +-- CDD (Acoes Detalhe)  [1:N]  CDC_CODTRI+CDC_ITEM -> CDD_CODTRI+CDD_ITEM
 |
 +-- CDV (Versoes)             [1:N]  CDA_CODTRI -> CDV_CODTRI
```

### Parametros SX6 Relevantes

| Parametro | Tipo | Conteudo Padrao | Descricao |
|---|---|---|---|
| MV_CONTTRI | L | .T. | Habilita o uso do Configurador de Tributos. Se .F., as regras do Configurador sao ignoradas e o calculo segue apenas pela TES. |
| MV_PRCTRIB | N | 1 | Prioridade do Configurador sobre a TES: 1=Configurador prevalece sobre TES, 2=TES prevalece sobre Configurador |
| MV_CTMVCAB | L | .F. | Utiliza campos MVC no cabecalho do Configurador |
| MV_CTMVITE | L | .F. | Utiliza campos MVC nos itens do Configurador |
| MV_TRIBIMP | C | "IC,IP,PI,CO" | Tipos de imposto habilitados no Configurador (separados por virgula) |

### Pontos de Entrada Relevantes

| Ponto de Entrada | Momento | Parametros | Retorno | Descricao |
|---|---|---|---|---|
| FT170FIL | Antes da avaliacao | Nenhum | cFiltro (expressao) | Permite adicionar filtro customizado na selecao de regras |
| FT170VAL | Validacao da regra | Nenhum | lValido (.T./.F.) | Validacao customizada antes de aplicar uma regra |
| FT170ACA | Apos aplicar acao | aAcoes (array) | aAcoes modificado | Permite modificar as acoes antes da gravacao nos itens da NF |
| FT170GRV | Apos gravacao | Nenhum | Nenhum | Executa logica apos salvar a regra |

### Integracoes

- **MATA103 (NF Entrada)**: O Configurador e invocado durante o calculo fiscal de cada item (SD1) para determinar tributacao.
- **MATA461 (Faturamento/NF Saida)**: Idem para notas de saida (SD2).
- **SF4 (TES)**: O Configurador pode sobrescrever valores definidos na TES conforme parametro MV_PRCTRIB.
- **SB1 (Produtos)**: Campos como B1_POSIPI (NCM), B1_ORIGEM sao usados como criterios de avaliacao nas excecoes.
- **SA1/SA2 (Clientes/Fornecedores)**: Campos como A1_EST, A1_CONTRIB sao usados como criterios.
- **CC2 (NCM x TES)**: Pode trabalhar em conjunto com o Configurador para definicoes por NCM.

---

## 2. MATA080 - Tipos de Entrada e Saida (TES)

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA080 |
| Modulo | SIGAFAT (Faturamento) / Uso geral em todos os modulos |
| Funcao | Cadastro de Tipos de Entrada e Saida |
| Tipo | AxCadastro |
| Descricao | Define as regras de tratamento fiscal, contabil e de estoque para cada tipo de operacao comercial. E a espinha dorsal da configuracao tributaria do Protheus, determinando como cada imposto sera calculado, creditado e escriturado. |

### Tabela SF4 - Tipos de Entrada e Saida

#### Campos - Aba Administracao

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| F4_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| F4_CODIGO | C | 3 | 0 | Codigo TES | Chave primaria; 001-999 |
| F4_TIPO | C | 1 | 0 | Tipo | E=Entrada, S=Saida |
| F4_TEXTO | C | 40 | 0 | Descricao | Texto descritivo livre |
| F4_CF | C | 5 | 0 | Cod. Fiscal (CFOP) | CFOP padrao da TES. Ex: 1102, 5102, 6102. E sobrescrito pela Natureza de Operacao (SED) conforme cenario. |
| F4_ESTOQUE | C | 1 | 0 | Atualiza estoque | S=Sim, N=Nao |
| F4_DUPLIC | C | 1 | 0 | Gera duplicata | S=Sim, N=Nao; determina se a operacao gera titulo financeiro |
| F4_PODER3 | C | 1 | 0 | Poder de terceiros | S=Sim, N=Nao; controla movimentacao em poder de terceiros |
| F4_CONSUMO | C | 1 | 0 | Material de consumo | S=Sim, N=Nao; indica que o item e para consumo proprio |
| F4_COMPL | C | 1 | 0 | NF Complementar | S=Sim, N=Nao; indica que e uma nota complementar |
| F4_FINALID | C | 1 | 0 | Finalidade | N=Normal, D=Devolucao, C=Complementar, B=Bonificacao |
| F4_OBSSOL | C | 1 | 0 | Gera observacao SINTEGRA/SPED | S=Sim, N=Nao |
| F4_QTDZFR | C | 1 | 0 | Considera quantidade livre ZFM | S=Sim, N=Nao; Zona Franca de Manaus |
| F4_RDESPV | C | 1 | 0 | Rateio de despesa na venda | S=Sim, N=Nao |
| F4_INCIDE | C | 1 | 0 | Incide sobre | V=Valor da mercadoria, L=Valor liquido |
| F4_RECISS | C | 1 | 0 | Recolhe ISS | S=Sim, N=Nao |
| F4_AGREG | N | 8 | 2 | Percentual agregado | Percentual sobre o valor para compor base de calculo |
| F4_MARGEM | N | 6 | 2 | Margem de lucro | Percentual utilizado em calculo de preco de venda |
| F4_DESSION | C | 1 | 0 | Destaca na NF | S=Sim, N=Nao; Indica se ISS e destacado na NF |

#### Campos - Aba Impostos (ICMS)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| F4_ICM | C | 1 | 0 | Calcula ICMS | S=Sim, N=Nao, R=Retido (ST), I=Isento, O=Outros, F=Imune |
| F4_CREDICM | C | 1 | 0 | Credita ICMS | S=Sim, N=Nao; na entrada, se gera credito de ICMS |
| F4_LFICM | C | 1 | 0 | Livro fiscal ICMS | T=Tributado, I=Isento, O=Outras, N=Nao escritura |
| F4_BASEICM | C | 1 | 0 | Base ICMS | V=Sobre valor da mercadoria, L=Sobre valor liquido, N=Nao calcula base |
| F4_TRBICM | C | 1 | 0 | Tributa ICMS por | A=Aliquota do cadastro (SB1), T=Aliquota da TES, P=Aliquota do parametro (MV_ICMPAD), C=Configurador de Tributos |
| F4_FORMICM | C | 1 | 0 | Formula ICMS | Codigo da formula customizada para calculo do ICMS |
| F4_MKPICM | N | 6 | 2 | Markup ICMS | Percentual de markup para compor base de ICMS |
| F4_DTAICM | C | 3 | 0 | Aliquota ICMS na TES | Aliquota fixa quando F4_TRBICM = T |

#### Campos - Aba Impostos (IPI)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| F4_IPI | C | 1 | 0 | Calcula IPI | S=Sim, N=Nao, R=Retido, I=Isento, O=Outros, F=Imune, T=NT (Nao tributado) |
| F4_CREDIPI | C | 1 | 0 | Credita IPI | S=Sim, N=Nao; na entrada, se gera credito de IPI |
| F4_LFIPI | C | 1 | 0 | Livro fiscal IPI | T=Tributado, I=Isento, O=Outras, N=Nao escritura |
| F4_BASEIPI | C | 1 | 0 | Base IPI | V=Sobre valor da mercadoria, L=Sobre valor liquido, N=Nao calcula base |
| F4_TRBIPI | C | 1 | 0 | Tributa IPI por | A=Aliquota do cadastro (SB1), T=Aliquota da TES, P=Aliquota do parametro |
| F4_FORMIPI | C | 1 | 0 | Formula IPI | Codigo da formula customizada para calculo do IPI |
| F4_MKPIPI | N | 6 | 2 | Markup IPI | Percentual de markup para compor base de IPI |
| F4_DTAIPI | C | 3 | 0 | Aliquota IPI na TES | Aliquota fixa quando F4_TRBIPI = T |

#### Campos - Aba Impostos (PIS/COFINS)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| F4_CSTPIS | C | 2 | 0 | CST PIS | 01=Aliq. basica, 02=Aliq. diferenciada, 04=Monofasico, 05=ST, 06=Aliq.zero, 07=Isento, 08=Sem incidencia, 49=Outras saidas, 50-56=Creditos entrada, 70-75=Creditos presumidos, 98=Outras entrada, 99=Outras |
| F4_CSTCOF | C | 2 | 0 | CST COFINS | Mesmos valores do CST PIS |
| F4_APLPIS | C | 1 | 0 | Calcula PIS | S=Sim, N=Nao |
| F4_APLCOF | C | 1 | 0 | Calcula COFINS | S=Sim, N=Nao |
| F4_BASPIS | C | 1 | 0 | Base PIS | V=Sobre valor da mercadoria, L=Sobre valor liquido |
| F4_BASCOF | C | 1 | 0 | Base COFINS | V=Sobre valor da mercadoria, L=Sobre valor liquido |
| F4_TRBPIS | C | 1 | 0 | Tributa PIS por | A=Aliquota do cadastro, T=Aliquota da TES, P=Aliquota do parametro (MV_TXPIS) |
| F4_TRBCOF | C | 1 | 0 | Tributa COFINS por | A=Aliquota do cadastro, T=Aliquota da TES, P=Aliquota do parametro (MV_TXCOFIN) |
| F4_LFPIS | C | 1 | 0 | Livro fiscal PIS | T=Tributado, I=Isento, O=Outras, N=Nao escritura |
| F4_LFCOF | C | 1 | 0 | Livro fiscal COFINS | T=Tributado, I=Isento, O=Outras, N=Nao escritura |

#### Campos - Aba Impostos (ISS e Outros)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| F4_LFISS | C | 1 | 0 | Livro fiscal ISS | T=Tributado, I=Isento, O=Outras, N=Nao escritura |

### Estrutura de Tela - MATA080

```
+----------------------------------------------------------+
| MATA080 - Tipo de Entrada e Saida                        |
+----------------------------------------------------------+
| [Aba 1: Administracao]                                   |
|   Codigo | Tipo (E/S) | Descricao                        |
|   Cod.Fiscal (CFOP) | Finalidade | NF Complementar       |
|   Atualiza Estoque | Gera Duplicata | Poder Terceiros     |
|   Material Consumo | Incide Sobre | Zona Franca           |
|   Rateio Desp.Venda | Obs.SPED | % Agregado             |
+----------------------------------------------------------+
| [Aba 2: Impostos]                                        |
|   --- ICMS ---                                            |
|   Calcula ICMS | Credita ICMS | Livro ICMS               |
|   Base ICMS | Tributa ICMS por | Formula ICMS             |
|   Markup ICMS | Aliquota ICMS TES                         |
|                                                           |
|   --- IPI ---                                             |
|   Calcula IPI | Credita IPI | Livro IPI                   |
|   Base IPI | Tributa IPI por | Formula IPI                 |
|   Markup IPI | Aliquota IPI TES                            |
|                                                           |
|   --- PIS ---                                             |
|   CST PIS | Calcula PIS | Base PIS | Tributa PIS por      |
|   Livro PIS                                                |
|                                                           |
|   --- COFINS ---                                          |
|   CST COFINS | Calcula COFINS | Base COFINS               |
|   Tributa COFINS por | Livro COFINS                       |
|                                                           |
|   --- ISS ---                                             |
|   Recolhe ISS | Livro ISS | Destaca ISS                   |
+----------------------------------------------------------+
```

### Parametros SX6 Relevantes

| Parametro | Tipo | Conteudo Padrao | Descricao |
|---|---|---|---|
| MV_TESSION | L | .F. | Habilita TES inteligente. Quando .T., o sistema seleciona automaticamente a TES com base em NCM, UF, cliente/fornecedor e tipo de operacao. |
| MV_SPESSION | L | .F. | Aplica TES inteligente na saida |
| MV_CESSION | L | .F. | Aplica TES inteligente na compra/entrada |
| MV_ICMPAD | N | 18 | Aliquota padrao de ICMS quando F4_TRBICM = P |
| MV_TXPIS | N | 1.65 | Aliquota padrao de PIS quando F4_TRBPIS = P |
| MV_TXCOFIN | N | 7.60 | Aliquota padrao de COFINS quando F4_TRBCOF = P |
| MV_SUBTRIB | L | .T. | Habilita calculo de Substituicao Tributaria |
| MV_DIFAL | L | .T. | Habilita calculo do DIFAL |
| MV_CONTTRI | L | .T. | Se .T., o Configurador de Tributos pode sobrescrever valores da TES |

### Gatilhos SX7 Relevantes

| Campo Origem | Campo Destino | Regra | Descricao |
|---|---|---|---|
| F4_CF | Varios campos SD1/SD2 | Preenche CFOP no item da NF | Ao informar o CFOP na TES, esse CFOP e sugerido nos itens de NF |
| F4_ICM | D1_PICM / D2_PICM | Determina se ira calcular ICMS | Impacta diretamente no calculo do item |
| F4_IPI | D1_PIPI / D2_PIPI | Determina se ira calcular IPI | Idem |
| F4_CSTPIS | D1_CSTPIS / D2_CSTPIS | Preenche CST PIS no item | Idem |
| F4_CSTCOF | D1_CSTCOF / D2_CSTCOF | Preenche CST COFINS no item | Idem |

### Pontos de Entrada Relevantes

| Ponto de Entrada | Momento | Descricao |
|---|---|---|
| MT080FIM | Apos gravacao | Executado apos salvar o registro de TES |
| MT080BRW | Browse | Permite customizar o browse da TES |
| A080VALID | Validacao | Permite validacao customizada antes de salvar |
| MATxFIS | Calculo fiscal | PE generico invocado durante o calculo fiscal que usa a TES |

### Impacto nos Documentos Fiscais

A TES e vinculada a cada item do documento fiscal (SD1/SD2) atraves dos campos:

| Campo Item NF | Descricao | Relacionamento |
|---|---|---|
| D1_TES / D2_TES | Codigo da TES usada no item | FK para F4_CODIGO |
| D1_CF / D2_CF | CFOP resultante | Vem de F4_CF ou SED |
| D1_PICM / D2_PICM | Aliquota ICMS aplicada | Determinado por F4_TRBICM |
| D1_VALICM / D2_VALICM | Valor ICMS calculado | Resultado do calculo |
| D1_PIPI / D2_PIPI | Aliquota IPI aplicada | Determinado por F4_TRBIPI |
| D1_VALIPI / D2_VALIPI | Valor IPI calculado | Resultado do calculo |

### Relacionamento com Outras Tabelas

```
SF4 (TES)
 |
 +-- SD1 (Itens NF Entrada) [D1_TES -> F4_CODIGO]
 |
 +-- SD2 (Itens NF Saida)   [D2_TES -> F4_CODIGO]
 |
 +-- SED (Natureza Operacao) [F4_CF pode ser sobrescrito por SED]
 |
 +-- SB1 (Produtos)          [B1_TE / B1_TS = TES padrao do produto]
 |
 +-- CC2 (NCM x TES)         [Amarracao NCM com TES especifica]
 |
 +-- CDA (Configurador)      [Pode sobrescrever valores da TES]
```

---

## 3. MATA002 - Cadastro de Produtos

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA002 (tambem referenciada como MATA010 em versoes mais recentes) |
| Modulo | SIGAEST (Estoque/Custos) |
| Funcao | Cadastro de Produtos |
| Tipo | AxCadastro / MVC (versoes recentes) |
| Descricao | Cadastro mestre de produtos com todos os dados fiscais, comerciais e logisticos. Os campos fiscais do produto sao fundamentais para o calculo correto de impostos em todas as operacoes. |

### Tabela SB1 - Cadastro de Produtos

#### Campos - Aba Basico

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| B1_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| B1_COD | C | 15 | 0 | Codigo do produto | Chave primaria |
| B1_DESC | C | 60 | 0 | Descricao | Nome do produto |
| B1_TIPO | C | 2 | 0 | Tipo do produto | PA=Produto Acabado, MP=Materia Prima, PI=Produto Intermediario, MC=Material de Consumo, BN=Beneficiamento, ME=Mercadoria Revenda, MO=Mao de Obra, SV=Servico, GG=Gastos Gerais |
| B1_UM | C | 2 | 0 | Unidade de medida | UN, KG, LT, MT, CX, PC, etc. |
| B1_GRUPO | C | 4 | 0 | Grupo de produto | FK para SBM; classifica produtos para fins fiscais e gerenciais |
| B1_CODBAR | C | 15 | 0 | Codigo de barras (EAN/GTIN) | Usado na NF-e; campo obrigatorio para operacoes B2C |
| B1_TE | C | 3 | 0 | TES padrao de entrada | FK para SF4; TES automatica nas operacoes de entrada |
| B1_TS | C | 3 | 0 | TES padrao de saida | FK para SF4; TES automatica nas operacoes de saida |

#### Campos - Aba Impostos (Fiscal)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| B1_POSIPI | C | 10 | 0 | NCM (Nomenclatura Comum Mercosul) | Codigo NCM do produto. Fundamental para: TIPI (aliquota IPI), ST (protocolos/convenios), PIS/COFINS monofasico, enquadramento fiscal. Formato: 9999.99.99 |
| B1_ORIGEM | C | 1 | 0 | Origem da mercadoria | 0=Nacional, 1=Estrangeira (importacao direta), 2=Estrangeira (adquirida mercado interno), 3=Nacional conteudo importacao >40%, 4=Nacional producao conforme processos basicos, 5=Nacional conteudo importacao <=40%, 6=Estrangeira importacao direta sem similar nacional CAMEX, 7=Estrangeira adquirida mercado interno sem similar CAMEX, 8=Nacional conteudo importacao >70% |
| B1_PICM | N | 5 | 2 | Aliquota ICMS do produto | Percentual; usado quando TES define F4_TRBICM = A |
| B1_IPI | N | 5 | 2 | Aliquota IPI do produto | Percentual; usado quando TES define F4_TRBIPI = A. Deve corresponder a TIPI pelo NCM. |
| B1_CSTPIS | C | 2 | 0 | CST PIS padrao do produto | 01 a 99 conforme tabela CST PIS/COFINS |
| B1_CSTCOF | C | 2 | 0 | CST COFINS padrao do produto | 01 a 99 conforme tabela CST PIS/COFINS |
| B1_PERCSOL | N | 7 | 2 | Percentual ICMS Solidario (ST) | Percentual de MVA para calculo da Substituicao Tributaria |
| B1_ALIQISS | N | 5 | 2 | Aliquota ISS | Percentual de ISS para produtos tipo servico |
| B1_CODISS | C | 9 | 0 | Codigo do servico ISS (LC 116) | Codigo do item da lista de servicos da LC 116/2003 |
| B1_TESSION | C | 3 | 0 | TES inteligente entrada | FK para SF4; usado pelo mecanismo de TES inteligente (MV_TESSION) |
| B1_TESSIPI | C | 3 | 0 | TES inteligente IPI | TES especifica para tratamento de IPI diferenciado |
| B1_GESSION | C | 3 | 0 | Grupo TES inteligente saida | Grupo de TES inteligente para saida |
| B1_GSESSION | C | 3 | 0 | Grupo TES inteligente entrada | Grupo de TES inteligente para entrada |

#### Campos - Aba Impostos (Complementares)

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| B1_PICMRET | N | 5 | 2 | Aliquota ICMS retido | Aliquota interna para calculo do ICMS-ST |
| B1_CSTICM | C | 3 | 0 | CST ICMS padrao do produto | Codigo de Situacao Tributaria do ICMS (00, 10, 20, 30, 40, 41, 51, 60, 70, 90) |
| B1_CSTIPI | C | 2 | 0 | CST IPI padrao do produto | 00, 49, 50, 99, etc. |
| B1_PISCOF | C | 1 | 0 | Regime PIS/COFINS do produto | C=Cumulativo, N=Nao-cumulativo, A=Ambos |
| B1_REGSEQ | C | 4 | 0 | Sequencia do registro SPED | Sequencial para escrituracao |
| B1_CBENEF | C | 10 | 0 | Codigo de beneficio fiscal | Codigo do beneficio fiscal estadual (exigido em UFs como SP, PR, etc.) |
| B1_EXTIPI | C | 3 | 0 | Excecao IPI | Codigo de excecao da TIPI para o produto |

### Tabela SB5 - Dados Complementares do Produto

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| B5_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| B5_COD | C | 15 | 0 | Codigo do produto | FK para B1_COD |
| B5_CEST | C | 7 | 0 | Codigo CEST | Codigo Especificador da Substituicao Tributaria. Obrigatorio para produtos sujeitos a ST. Formato: 99.999.99 |
| B5_CODBAR | C | 15 | 0 | Codigo de barras principal | EAN/GTIN principal do produto |
| B5_2CODBAR | C | 15 | 0 | Codigo de barras unidade tributavel | EAN/GTIN da unidade tributavel (pode diferir da unidade comercial) |
| B5_CODANT | C | 9 | 0 | Codigo ANP | Codigo da Agencia Nacional do Petroleo; obrigatorio para combustiveis e lubrificantes |
| B5_DESCANT | C | 60 | 0 | Descricao ANP | Descricao do produto conforme tabela ANP |
| B5_UFCONSU | C | 2 | 0 | UF consumo combustivel | UF de consumo para fins de ICMS sobre combustiveis |
| B5_FCIMP | C | 36 | 0 | Numero da FCI | Ficha de Conteudo de Importacao; obrigatorio quando B1_ORIGEM = 3, 5 ou 8 |
| B5_PERCI | N | 6 | 2 | Percentual conteudo importacao | Usado para FCI e definicao de origem |

### Tabela SBZ - Complemento NCM

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| BZ_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| BZ_COD | C | 10 | 0 | Codigo NCM | Codigo da NCM |
| BZ_DESC | C | 60 | 0 | Descricao NCM | Descricao da classificacao fiscal |
| BZ_TESSION | C | 3 | 0 | TES inteligente por NCM | TES padrao vinculada ao NCM; usado pelo mecanismo de TES inteligente |
| BZ_IPI | N | 5 | 2 | Aliquota IPI padrao do NCM | Aliquota IPI conforme TIPI |
| BZ_EXTIPI | C | 3 | 0 | Excecao IPI do NCM | Codigo de excecao TIPI |
| BZ_NATREC | C | 3 | 0 | Natureza da receita | Codigo da natureza da receita para EFD Contribuicoes |
| BZ_CSTPIS | C | 2 | 0 | CST PIS padrao do NCM | CST PIS vinculado ao NCM |
| BZ_CSTCOF | C | 2 | 0 | CST COFINS padrao do NCM | CST COFINS vinculado ao NCM |

### Estrutura de Tela - MATA002

```
+----------------------------------------------------------+
| MATA002 - Cadastro de Produtos                           |
+----------------------------------------------------------+
| [Aba 1: Basico]                                          |
|   Codigo | Descricao | Tipo | Unidade Medida             |
|   Grupo | Codigo de Barras (EAN)                          |
|   TES Entrada Padrao | TES Saida Padrao                  |
|   (Demais campos comerciais e logisticos)                 |
+----------------------------------------------------------+
| [Aba 2: Impostos]                                        |
|   NCM (B1_POSIPI) | Origem Mercadoria (B1_ORIGEM)        |
|   Aliquota ICMS (B1_PICM) | CST ICMS (B1_CSTICM)        |
|   Aliquota IPI (B1_IPI) | CST IPI (B1_CSTIPI)            |
|   Excecao IPI (B1_EXTIPI)                                |
|   CST PIS (B1_CSTPIS) | CST COFINS (B1_CSTCOF)          |
|   Regime PIS/COFINS (B1_PISCOF)                          |
|   % ICMS Solidario (B1_PERCSOL) | ICMS Retido (B1_PICMRET)|
|   Aliquota ISS (B1_ALIQISS) | Codigo Servico ISS        |
|   Codigo Beneficio Fiscal (B1_CBENEF)                    |
|   TES Inteligente Entrada | TES Inteligente IPI           |
|   Grupo TES Int. Saida | Grupo TES Int. Entrada           |
+----------------------------------------------------------+
| [Aba 3: Complemento (SB5)]                               |
|   CEST (B5_CEST)                                          |
|   Codigo Barras Unid. Tributavel (B5_2CODBAR)            |
|   Codigo ANP (B5_CODANT) | Descricao ANP (B5_DESCANT)   |
|   UF Consumo Combustivel (B5_UFCONSU)                    |
|   Numero FCI (B5_FCIMP) | % Conteudo Import. (B5_PERCI) |
+----------------------------------------------------------+
| [Aba 4: Outros / MVC]                                     |
|   Campos adicionais conforme customizacao                 |
+----------------------------------------------------------+
```

### Indices Principais SB1

| Indice | Campos | Descricao |
|---|---|---|
| 1 | B1_FILIAL + B1_COD | Chave unica por codigo |
| 2 | B1_FILIAL + B1_DESC | Busca por descricao |
| 3 | B1_FILIAL + B1_GRUPO + B1_COD | Busca por grupo |
| 4 | B1_FILIAL + B1_POSIPI | Busca por NCM |

### Indices Principais SB5

| Indice | Campos | Descricao |
|---|---|---|
| 1 | B5_FILIAL + B5_COD | Chave unica, mesma chave de SB1 |

### Parametros SX6 Relevantes

| Parametro | Tipo | Conteudo Padrao | Descricao |
|---|---|---|---|
| MV_TESSION | L | .F. | Habilita TES inteligente; quando .T., usa B1_TESSION, B1_GESSION, B1_GSESSION |
| MV_PISNAT | C | "01" | CST PIS padrao quando nao informado no produto |
| MV_COFNAT | C | "01" | CST COFINS padrao quando nao informado no produto |
| MV_TXPIS | N | 1.65 | Aliquota PIS padrao |
| MV_TXCOFIN | N | 7.60 | Aliquota COFINS padrao |

### Gatilhos SX7 Relevantes

| Campo Origem | Campo Destino | Regra | Descricao |
|---|---|---|---|
| B1_POSIPI | B1_IPI | Busca aliquota IPI pela TIPI (SBZ) | Ao informar o NCM, sugere a aliquota IPI |
| B1_POSIPI | SB5 campos | Busca dados complementares do NCM | Pode sugerir CEST e outros dados pela NCM |
| B1_COD | SB5 | Cria registro complementar | Ao criar produto, pode inicializar SB5 |

### Pontos de Entrada Relevantes

| Ponto de Entrada | Momento | Descricao |
|---|---|---|
| MT010BRW | Browse | Customizacao do browse de produtos |
| MT010GRV | Gravacao | Executado apos a gravacao do produto |
| MT010LOK | Validacao | Validacao customizada antes de salvar |
| MT010INC | Inclusao | Executado na inclusao de novo produto |
| MTA010OK | Confirmacao | Validacao ao confirmar o cadastro |

### Impacto dos Campos Fiscais no Calculo de Impostos

| Campo | Impacto | Quando e Usado |
|---|---|---|
| B1_POSIPI (NCM) | Define enquadramento na TIPI, protocolos ST, monofasico PIS/COFINS | Sempre; obrigatorio na NF-e |
| B1_ORIGEM | Compoe o CST ICMS (1o digito), define aliquota interestadual 4% para importados | Sempre; obrigatorio na NF-e |
| B1_PICM | Aliquota ICMS do produto | Quando F4_TRBICM = A (aliquota do cadastro) |
| B1_IPI | Aliquota IPI do produto | Quando F4_TRBIPI = A (aliquota do cadastro) |
| B1_PERCSOL | MVA para ICMS-ST | Quando operacao com ST; complementa ou substitui MVA do Configurador |
| B1_CSTPIS / B1_CSTCOF | Determina tributacao PIS/COFINS | Pode ser usado como padrao nos itens da NF |
| B1_CBENEF | Codigo de beneficio fiscal | Obrigatorio em UFs que exigem (SP, PR); informado na NF-e |
| B5_CEST | Codigo CEST | Obrigatorio para produtos com ST; informado na NF-e |
| B5_CODANT | Codigo ANP | Obrigatorio para combustiveis; informado na NF-e |

### Relacionamento com Outras Tabelas

```
SB1 (Produto)
 |
 +-- SB5 (Complemento)       [1:1]  B1_COD = B5_COD
 |
 +-- SBZ (NCM)               [N:1]  B1_POSIPI = BZ_COD
 |
 +-- SF4 (TES Entrada)       [N:1]  B1_TE -> F4_CODIGO
 |
 +-- SF4 (TES Saida)         [N:1]  B1_TS -> F4_CODIGO
 |
 +-- SBM (Grupo)             [N:1]  B1_GRUPO -> BM_GRUPO
 |
 +-- SD1 (Itens NF Entrada)  [1:N]  B1_COD = D1_COD
 |
 +-- SD2 (Itens NF Saida)    [1:N]  B1_COD = D2_COD
 |
 +-- CC2 (NCM x TES)         [Via NCM]
 |
 +-- CDA/CDH (Configurador)  [Via NCM, Grupo, Produto, Origem]
```

---

## 4. MATA089 - Cadastro de Naturezas de Operacao

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA089 |
| Modulo | SIGAFAT (Faturamento) / Uso geral |
| Funcao | Cadastro de Naturezas de Operacao |
| Tipo | AxCadastro |
| Descricao | Define as naturezas de operacao que agrupam CFOPs por tipo de cenario fiscal (intra-estadual, interestadual, exportacao, etc.). A natureza e vinculada ao cabecalho da NF e seus CFOPs (ED_CF1 a ED_CF8) determinam o CFOP correto de cada item conforme o cenario. |

### Tabela SED - Naturezas de Operacao

#### Campos Principais

| Campo | Tipo | Tam | Dec | Descricao | Valores Validos / Observacao |
|---|---|---|---|---|---|
| ED_FILIAL | C | 8 | 0 | Filial | Filial corrente |
| ED_CODIGO | C | 3 | 0 | Codigo da natureza | Chave primaria; 001-999 |
| ED_DESCRIC | C | 30 | 0 | Descricao | Texto descritivo (ex: "Venda de Mercadoria", "Devolucao de Compra") |
| ED_TIPO | C | 1 | 0 | Tipo | E=Entrada, S=Saida |
| ED_LIVRO | C | 3 | 0 | Livro fiscal | Codigo do livro fiscal onde a natureza sera escriturada |
| ED_OBSERV | C | 60 | 0 | Observacao | Texto de observacao impresso na NF |
| ED_FORMULA | C | 3 | 0 | Formula | Codigo de formula customizada para calculo |
| ED_CLASFIS | C | 4 | 0 | Classificacao fiscal | Classificacao para fins de relatorio |
| ED_OBSFIS | C | 60 | 0 | Observacao fiscal | Texto adicional para escrituracao fiscal |
| ED_AIDF | C | 20 | 0 | AIDF | Autorizacao de Impressao de Documentos Fiscais |
| ED_BASERET | N | 6 | 2 | Base de retencao | Percentual para base de retencao |
| ED_ICMRET | N | 6 | 2 | ICMS retido | Percentual ICMS retido |
| ED_INTERNI | C | 1 | 0 | Internalizacao | S=Sim, N=Nao; para operacoes com Zona Franca |

#### Campos de CFOP por Cenario (ED_CF1 a ED_CF8)

Este e o mecanismo central da Natureza de Operacao. Cada campo ED_CF define o CFOP a ser utilizado em um cenario especifico:

| Campo | Tipo | Tam | Descricao do Cenario | Exemplo Venda | Exemplo Compra |
|---|---|---|---|---|---|
| ED_CF1 | C | 5 | Operacao dentro do estado (intra-estadual) | 5102 | 1102 |
| ED_CF2 | C | 5 | Operacao fora do estado (interestadual) | 6102 | 2102 |
| ED_CF3 | C | 5 | Operacao com o exterior (importacao/exportacao) | 7102 | 3102 |
| ED_CF4 | C | 5 | Operacao dentro do estado com ST | 5403 | 1403 |
| ED_CF5 | C | 5 | Operacao fora do estado com ST | 6403 | 2403 |
| ED_CF6 | C | 5 | Operacao dentro do estado (contribuinte isento/nao contribuinte) | 5102 | - |
| ED_CF7 | C | 5 | Operacao fora do estado (consumidor final nao contribuinte - DIFAL) | 6108 | - |
| ED_CF8 | C | 5 | Operacao especial / Zona Franca de Manaus | 5109/6109 | 1109/2109 |

**Detalhamento da logica de selecao do CFOP:**

O sistema avalia as seguintes condicoes para selecionar o CFOP correto:

1. **UF Origem = UF Destino?** -> Se SIM, usa ED_CF1 (ou ED_CF4 se ST, ou ED_CF6 se nao contribuinte)
2. **UF Origem <> UF Destino e ambas nacionais?** -> Usa ED_CF2 (ou ED_CF5 se ST, ou ED_CF7 se consumidor final nao contribuinte)
3. **Operacao com exterior?** -> Usa ED_CF3
4. **Zona Franca de Manaus?** -> Usa ED_CF8
5. **Substituicao Tributaria?** -> Usa ED_CF4 (intra) ou ED_CF5 (inter)
6. **Consumidor Final nao contribuinte interestadual?** -> Usa ED_CF7 (DIFAL)

### Estrutura de Tela - MATA089

```
+----------------------------------------------------------+
| MATA089 - Natureza de Operacao                           |
+----------------------------------------------------------+
| [Aba 1: Dados Principais]                                |
|   Codigo (ED_CODIGO)  | Descricao (ED_DESCRIC)           |
|   Tipo (E/S)          | Livro Fiscal (ED_LIVRO)           |
|   Observacao (ED_OBSERV) | Obs. Fiscal (ED_OBSFIS)       |
|   Formula (ED_FORMULA) | Classif. Fiscal (ED_CLASFIS)    |
|   AIDF (ED_AIDF) | Internalizacao (ED_INTERNI)           |
+----------------------------------------------------------+
| [Aba 2: CFOPs por Cenario]                               |
|   CF Intra-Estadual (ED_CF1)       | ex: 5102             |
|   CF Inter-Estadual (ED_CF2)       | ex: 6102             |
|   CF Exterior (ED_CF3)             | ex: 7102             |
|   CF Intra c/ ST (ED_CF4)          | ex: 5403             |
|   CF Inter c/ ST (ED_CF5)          | ex: 6403             |
|   CF Intra Nao Contrib. (ED_CF6)   | ex: 5102             |
|   CF Inter Cons. Final (ED_CF7)    | ex: 6108             |
|   CF Especial/ZFM (ED_CF8)         | ex: 6109             |
+----------------------------------------------------------+
| [Aba 3: Retencao]                                        |
|   Base Retencao (ED_BASERET) | ICMS Retido (ED_ICMRET)  |
+----------------------------------------------------------+
```

### Indices Principais SED

| Indice | Campos | Descricao |
|---|---|---|
| 1 | ED_FILIAL + ED_CODIGO | Chave unica por codigo |
| 2 | ED_FILIAL + ED_DESCRIC | Busca por descricao |
| 3 | ED_FILIAL + ED_TIPO + ED_CODIGO | Busca por tipo (E/S) |

### Parametros SX6 Relevantes

| Parametro | Tipo | Conteudo Padrao | Descricao |
|---|---|---|---|
| MV_NATOPER | C | "" | Natureza de operacao padrao |
| MV_TESSION | L | .F. | TES inteligente pode usar a natureza para determinar CFOP |
| MV_ESTADO | C | "SP" | UF da empresa; fundamental para determinar se operacao e intra ou interestadual |

### Gatilhos SX7 Relevantes

| Campo Origem | Campo Destino | Regra | Descricao |
|---|---|---|---|
| Cabecalho NF (F1_NATUREZ/F2_NATUREZ) | D1_CF / D2_CF | Busca CFOP da natureza conforme cenario (UFs, ST, etc.) | O CFOP do item e preenchido automaticamente com base na natureza do cabecalho |

### Pontos de Entrada Relevantes

| Ponto de Entrada | Momento | Descricao |
|---|---|---|
| MT089GRV | Gravacao | Executado apos salvar a natureza de operacao |
| A089VALID | Validacao | Validacao customizada |
| MATxFIS | Calculo fiscal | O CFOP vindo da natureza e usado no calculo fiscal |

### Relacionamento com Outras Tabelas

```
SED (Natureza de Operacao)
 |
 +-- SF1 (Cabecalho NF Entrada)  [F1_NATUREZ -> ED_CODIGO]
 |
 +-- SF2 (Cabecalho NF Saida)    [F2_NATUREZ -> ED_CODIGO]
 |
 +-- SD1 (Itens NF Entrada)      [D1_CF = CFOP resultante da SED]
 |
 +-- SD2 (Itens NF Saida)        [D2_CF = CFOP resultante da SED]
 |
 +-- SF4 (TES)                   [F4_CF pode ser sobrescrito pelo CFOP da SED]
 |
 +-- SC5 (Pedidos de Venda)      [C5_NATUREZ -> ED_CODIGO]
 |
 +-- SC7 (Pedidos de Compra)     [C7_NATUREZ -> ED_CODIGO]
```

### Impacto na Geracao da NF

A Natureza de Operacao e informada no cabecalho da NF (F1_NATUREZ ou F2_NATUREZ). No momento da inclusao de cada item, o sistema executa a seguinte logica:

1. Verifica a UF do emitente (MV_ESTADO) e a UF do destinatario (A1_EST ou A2_EST).
2. Verifica se a operacao envolve Substituicao Tributaria (com base na TES e no Configurador).
3. Verifica se o destinatario e contribuinte (A1_CONTRIB ou A2_CONTRIB).
4. Verifica se e operacao com Zona Franca (SUFRAMA).
5. Com base nesses criterios, seleciona o campo ED_CF correto (1 a 8).
6. O CFOP selecionado e gravado em D1_CF ou D2_CF.
7. Se a TES (F4_CF) tiver um CFOP informado E a Natureza tambem, a Natureza prevalece (o CFOP da TES e considerado como padrao/fallback).

---

## 5. Relacionamento entre Rotinas

### Diagrama de Dependencias

```
                    +-------------------+
                    | MATA002 (Produto) |
                    | SB1 / SB5 / SBZ  |
                    +--------+----------+
                             |
           B1_TE/B1_TS       |    B1_POSIPI, B1_ORIGEM, B1_PICM, B1_IPI
           B1_TESSION        |    B1_CSTPIS, B1_CSTCOF, B1_PERCSOL
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+        +----------v-----------+
    | MATA080 (TES)     |        | FISA170 (Config.     |
    | SF4               |        |  Tributos)            |
    +--------+----------+        | CDA/CDH/CDB/CDC/CDD  |
             |                   +----------+-----------+
             |                              |
    F4_CF    |    F4_ICM, F4_IPI,           | Regras por NCM, UF,
    (CFOP    |    F4_CSTPIS, etc.           | Produto, CFOP, etc.
    fallback)|                              |
             |          +-------------------+
             |          |
    +--------v----------v---------+
    | Documento Fiscal (NF)       |
    | SF1/SF2 (Cabecalho)         |
    | SD1/SD2 (Itens)             |
    +--------+--------------------+
             |
             |  F1_NATUREZ / F2_NATUREZ
             |
    +--------v-------------------+
    | MATA089 (Natureza Oper.)   |
    | SED                        |
    | ED_CF1..ED_CF8 -> CFOP     |
    +----------------------------+
```

### Fluxo do Calculo Fiscal (Ordem de Avaliacao)

1. **Produto (SB1)**: Fornece NCM, origem, aliquotas padrao, CSTs padrao, CEST, codigo de beneficio fiscal.
2. **TES (SF4)**: Define as regras de calculo (calcula ou nao cada imposto, credita ou nao, livro fiscal, base de calculo, formula).
3. **Natureza de Operacao (SED)**: Determina o CFOP correto conforme cenario (UF, ST, contribuinte, ZFM).
4. **Configurador de Tributos (CDA/CDH/CDC)**: Pode SOBRESCREVER qualquer valor definido pela TES ou pelo produto, conforme regras condicionais (se MV_CONTTRI = .T.).

### Hierarquia de Prioridade (padrao)

| Prioridade | Origem | Condicao |
|---|---|---|
| 1 (mais alta) | Configurador de Tributos (CDA) | MV_CONTTRI = .T. e MV_PRCTRIB = 1 |
| 2 | TES (SF4) | Configuracao direta nos campos F4_* |
| 3 | Produto (SB1) | Aliquotas e CSTs do cadastro do produto |
| 4 | Parametros (SX6) | MV_ICMPAD, MV_TXPIS, MV_TXCOFIN como fallback |

**Nota:** Se MV_PRCTRIB = 2, a TES prevalece sobre o Configurador de Tributos.

### Tabelas Resumo - Cruzamento

| Tabela | Rotina de Origem | Usado por | Campos de Ligacao |
|---|---|---|---|
| SB1 | MATA002 | SD1, SD2, CDA/CDH, SF4 | B1_COD |
| SB5 | MATA002 | SD1, SD2, NF-e | B5_COD (= B1_COD) |
| SBZ | MATA002 (consulta) | SB1, CC2, CDA/CDH | BZ_COD (= B1_POSIPI) |
| SF4 | MATA080 | SD1, SD2, CDA | F4_CODIGO |
| SED | MATA089 | SF1, SF2, SC5, SC7 | ED_CODIGO |
| CDA | FISA170 | Calculo fiscal SD1/SD2 | CDA_CODTRI |
| CDH | FISA170 | Calculo fiscal SD1/SD2 | CDH_CODTRI (FK CDA) |
| CDB | FISA170 | Calculo fiscal SD1/SD2 | CDB_CODTRI (FK CDA) |
| CDC | FISA170 | Calculo fiscal SD1/SD2 | CDC_CODTRI (FK CDA) |
| CDD | FISA170 | Calculo fiscal SD1/SD2 | CDD_CODTRI + CDD_ITEM (FK CDC) |
| CDV | FISA170 | Controle de versao | CDV_CODTRI (FK CDA) |
| SF1 | MATA103 | NF Entrada cabecalho | F1_DOC + F1_SERIE + F1_FORNECE + F1_LOJA |
| SF2 | MATA461 | NF Saida cabecalho | F2_DOC + F2_SERIE + F2_CLIENTE + F2_LOJA |
| SD1 | MATA103 | NF Entrada itens | D1_DOC + D1_SERIE + D1_FORNECE + D1_LOJA + D1_ITEM |
| SD2 | MATA461 | NF Saida itens | D2_DOC + D2_SERIE + D2_CLIENTE + D2_LOJA + D2_ITEM |
| CC2 | FISA042 | Amarracao NCM x TES | C2_NCM + C2_TES |

---

## Glossario de Siglas

| Sigla | Significado |
|---|---|
| CFOP | Codigo Fiscal de Operacoes e Prestacoes |
| CST | Codigo de Situacao Tributaria |
| CSOSN | Codigo de Situacao da Operacao no Simples Nacional |
| NCM | Nomenclatura Comum do Mercosul |
| CEST | Codigo Especificador da Substituicao Tributaria |
| TES | Tipo de Entrada e Saida |
| TIPI | Tabela de Incidencia do IPI |
| MVA | Margem de Valor Agregado |
| ST | Substituicao Tributaria |
| DIFAL | Diferencial de Aliquota |
| FCP | Fundo de Combate a Pobreza |
| FCI | Ficha de Conteudo de Importacao |
| ANP | Agencia Nacional do Petroleo |
| SPED | Sistema Publico de Escrituracao Digital |
| EFD | Escrituracao Fiscal Digital |
| NF-e | Nota Fiscal Eletronica |
| ZFM | Zona Franca de Manaus |
| PE | Ponto de Entrada |
| FK | Foreign Key (chave estrangeira) |
