# Mapeamento Completo de Rotinas Protheus - Configuracao Tributaria

**Documento de referencia para construcao da ferramenta automatizada de configuracao Protheus**

| Informacao | Detalhe |
|---|---|
| Versao | 2.0 |
| Data | 07/04/2026 |
| Escopo | FISA170 (CFGTRIB), MATA080, MATA002, MATA089 |
| Modulos | SIGAFIS, SIGAFAT, SIGAEST |
| Fonte de dados | SX2, SX3, SX6, SX7, SX9 reais do Protheus (versao mais recente) |
| Contexto | Implementacao greenfield (Protheus do zero, versao mais atual) |

> **IMPORTANTE:** Esta versao substitui integralmente a v1.0. Todos os campos, parametros
> e relacionamentos foram verificados contra os dicionarios de dados reais (SXs).
> Campos fabricados da v1.0 (B1_TESSION, MV_TESSION, CDA_CODTRI, etc.) foram removidos.

---

## Indice

1. [FISA170 - Configurador de Tributos (CFGTRIB)](#1-fisa170---configurador-de-tributos-cfgtrib)
2. [MATA080 - Tipos de Entrada e Saida (TES)](#2-mata080---tipos-de-entrada-e-saida-tes)
3. [MATA002 - Cadastro de Produtos](#3-mata002---cadastro-de-produtos)
4. [MATA089 - Cadastro de Naturezas de Operacao](#4-mata089---cadastro-de-naturezas-de-operacao)
   - 4.1. [FISA170 - Regras Financeiras (Motor de Retencoes)](#41-fisa170---regras-financeiras-motor-de-retencoes)
5. [Parametros SX6 Fiscais](#5-parametros-sx6-fiscais)
6. [Relacionamento entre Rotinas](#6-relacionamento-entre-rotinas)
7. [Documentacao de Referencia](#7-documentacao-de-referencia)

---

## 1. FISA170 - Configurador de Tributos (CFGTRIB)

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | FISA170 |
| Modulo | SIGAFIS (Livros Fiscais) |
| Funcao | Configurador de Tributos |
| Tipo | MVC (Model-View-Controller) |
| Descricao | Permite criar regras tributarias baseadas em perfis (produto, operacao, participante, origem/destino) que determinam base de calculo, aliquota e escrituracao para cada tributo. Substitui a parametrizacao legada da TES para cenarios avancados. |

### Arquitetura de 5 Camadas

```
Camada 1: Cadastros (F2E - Tributos, CJ0/CJ1 - CST, F29 - URF)
Camada 2: Perfis (F20 cabecalho → F21/F22/F23/F24/F25/F26 detalhes)
Camada 3: Regras de Calculo (F27 Base + F28 Aliquota + CJ2 Escrituracao → F2B Regra + CIN Incidencias)
Camada 4: Regras de Ajuste/Lancamento (CJA itens)
Camada 5: Apuracao (F2G/F2H/F2I → F2J resumo)
```

### Tabelas Envolvidas

#### F20 - Perfis Tributarios (Cabecalho)

Tabela central que agrupa os perfis. Cada perfil tem um tipo que determina qual tabela detalhe usa.

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F20_FILIAL | C | 4 | Filial do Sistema | |
| F20_CODIGO | C | 6 | Codigo do Perfil Tributario | Chave primaria |
| F20_DESC | C | 100 | Descricao do Perfil | |
| F20_TIPO | C | 2 | Tipo do Perfil Tributario | 01=Origem/Destino; 02=Participante; 03=Operacao; 04=Produto |
| F20_NATOPE | C | 4 | Natureza de Operacao | FK para SED |

**Indice principal:** `F20_FILIAL+F20_CODIGO+F20_TIPO`

**Relacionamentos (SX9):**
- F20 → F21 (F20_CODIGO+F20_TIPO → F21_CODIGO+'01') — Perfil Origem/Destino
- F20 → F22 (F20_CODIGO+F20_TIPO → F22_CODIGO+'02') — Perfil Participante
- F20 → F23 (F20_CODIGO+F20_TIPO → F23_CODIGO+'03') — Perfil Operacao
- F20 → F24 (F20_CODIGO+F20_TIPO → F24_CODIGO+'04') — Perfil Produto
- F20 → F25 (F20_CODIGO+F20_TIPO → F25_CODIGO+'04') — Perfil Produto x Origem
- F20 → F26 (F20_CODIGO+F20_TIPO → F26_CODIGO+'03') — Perfil Tipo Operacao
- F20 → F2B (F20_CODIGO → F2B_PERFOP / F2B_PERFPA / F2B_PERFPR / F2B_PEROD)

---

#### F21 - Perfil Origem/Destino

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F21_FILIAL | C | 4 | Filial | |
| F21_CODIGO | C | 6 | Codigo do Perfil | FK para F20_CODIGO |
| F21_UFORI | C | 6 | UF de Origem | Sigla UF ou codigo especial |
| F21_DUFORI | C | 30 | Descricao UF Origem | Preenchido por gatilho (X5DESCRI) |
| F21_UFDEST | C | 2 | UF de Destino | Sigla UF |
| F21_DUFDST | C | 30 | Descricao UF Destino | Preenchido por gatilho (X5DESCRI) |
| F21_TIPOPF | C | 2 | Tipo de Perfil | |

**Indice principal:** `F21_FILIAL+F21_CODIGO+F21_UFORI+F21_UFDEST`

---

#### F22 - Perfil Participante

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F22_FILIAL | C | 4 | Filial | |
| F22_CODIGO | C | 6 | Codigo do Perfil | FK para F20_CODIGO |
| F22_TPPART | C | 1 | Tipo do Participante | 1=Fornecedor; 2=Cliente |
| F22_CLIFOR | C | 6 | Codigo do Participante | FK para SA1/SA2, ou "TODOS" |
| F22_LOJA | C | 2 | Loja do Participante | "ZZ" para todos |
| F22_RAZSOC | C | 50 | Razao Social | |
| F22_TIPOPF | C | 2 | Tipo do Perfil | |

**Indice principal:** `F22_FILIAL+F22_CODIGO+F22_TPPART+F22_CLIFOR+F22_LOJA`

---

#### F23 - Perfil Operacao (CFOP)

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F23_FILIAL | C | 4 | Filial | |
| F23_CODIGO | C | 6 | Codigo do Perfil | FK para F20_CODIGO |
| F23_CFOP | C | 4 | Codigo Fiscal (CFOP) | Ex: 5102, 6102 |
| F23_DCFOP | C | 55 | Descricao do CFOP | Preenchido por gatilho (X5DESCRI) |
| F23_TIPOPF | C | 2 | Tipo de Perfil | |

**Indice principal:** `F23_FILIAL+F23_CODIGO+F23_CFOP`

---

#### F24 - Perfil Produto

Encontrada no SX2 mas sem campos no SX3 desta versao.

| Info | Detalhe |
|---|---|
| Descricao SX2 | Perfil Tributario de Produto |
| Indice principal | F24_FILIAL+F24_CODIGO+F24_CDPROD |

---

#### F25 - Perfil Produto x Origem

Encontrada no SX2 mas sem campos no SX3 desta versao.

| Info | Detalhe |
|---|---|
| Descricao SX2 | Profile Product x Source |
| Indice principal | F25_FILIAL+F25_CODIGO+F25_ORIGEM |

---

#### F26 - Perfil Tipo de Operacao

Encontrada no SX2 mas sem campos no SX3 desta versao.

| Info | Detalhe |
|---|---|
| Descricao SX2 | Operation Type Profile |
| Indice principal | F26_FILIAL+F26_CODIGO+F26_TPOPER |

---

#### F27 - Regra de Base de Calculo

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F27_FILIAL | C | 4 | Filial | |
| F27_CODIGO | C | 6 | Codigo da Regra Base | Chave primaria |
| F27_DESC | C | 100 | Descricao da Regra | |
| F27_VALORI | C | 2 | Valor de Origem | 01=Vlr Mercadoria; 02=Quantidade; 03=Vlr Contabil; 08=Frete; 09=Duplicata; 10=Vlr Total Item; 11=Formula Manual |
| F27_DESCON | C | 1 | Acoes do Desconto | S=Soma; D=Deduz; N=Nao considera |
| F27_FRETE | C | 1 | Acoes do Frete | S=Soma; D=Deduz; N=Nao considera |
| F27_SEGURO | C | 1 | Acoes do Seguro | S=Soma; D=Deduz; N=Nao considera |
| F27_DESPE | C | 1 | Acoes das Despesas | S=Soma; D=Deduz; N=Nao considera |
| F27_ICMDES | C | 1 | Acoes ICMS Desonerado | |
| F27_ICMRET | C | 1 | Acoes ICMS Retido | |
| F27_REDBAS | N | 6,3 | Percentual de Reducao | 0 a 100 |
| F27_TPRED | C | 1 | Tipo da Reducao | |
| F27_UM | C | 2 | Unidade de Medida | Para calculo por quantidade/pauta |
| F27_UMDESC | C | 40 | Descricao da UM | Preenchido por gatilho (SAH->AH_DESCPO) |
| F27_ALTERA | C | 1 | Indicacao de Alteracao | |
| F27_DTALT | D | 8 | Data de Alteracao | |
| F27_HRALT | C | 8 | Hora de Alteracao | |
| F27_ID | C | 36 | ID do Cadastro | UUID |
| F27_CHVMD5 | C | 42 | Chave MD5 do Registro | Controle de integridade |

**Indice principal:** `F27_FILIAL+F27_CODIGO+F27_ALTERA+F27_ID`

**Gatilhos (SX7):**
- F27_REDBAS → F27_TPRED (CriaVar)
- F27_UM → F27_UMDESC (consulta SAH->AH_DESCPO)
- F27_VALORI → F27_UM, F27_UMDESC (CriaVar — limpa quando muda origem)

**Relacionamentos (SX9):**
- F27 → F2B (F27_CODIGO → F2B_RBASE) — vincula base a regra de calculo
- F27 → F2B (F27_CODIGO → F2B_RBASES) — base secundaria
- F27 → CIN (F27_ID → CIN_IREGRA, quando CIN_TREGRA='1') — condicoes/formulas da base

---

#### F28 - Regra de Aliquota

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F28_FILIAL | C | 4 | Filial | |
| F28_CODIGO | C | 6 | Codigo da Regra | Chave primaria |
| F28_DESC | C | 100 | Descricao da Regra | |
| F28_VALORI | C | 2 | Valor de Origem | 04=Aliquota Manual; 05=URF; 06=Formula Manual |
| F28_TPALIQ | C | 1 | Tipo de Aliquota | 1=Percentual; 2=Unidade de Medida |
| F28_ALIQ | N | 6,2 | Aliquota | Valor quando F28_VALORI='04' |
| F28_URF | C | 6 | Codigo da URF | FK para F29, quando F28_VALORI='05' |
| F28_DSURF | C | 100 | Descricao da URF | Preenchido por gatilho |
| F28_UFRPER | N | 9,5 | Percentual da URF | |
| F28_ALTERA | C | 1 | Registro Alterado | |
| F28_DTALT | D | 8 | Data da Alteracao | |
| F28_HRALT | C | 8 | Hora da Alteracao | |
| F28_ID | C | 36 | ID do Cadastro | UUID |
| F28_CHVMD5 | C | 42 | Chave MD5 | |
| F28_REDALI | N | 7,3 | Perc. Reducao Aliquota | |

**Indice principal:** `F28_FILIAL+F28_CODIGO+F28_ALTERA+F28_ID`

**Gatilhos (SX7):**
- F28_URF → F28_DSURF (consulta F29->F29_DESC)
- F28_VALORI → F28_TPALIQ, F28_URF, F28_ALIQ, F28_DSURF (CriaVar — limpa ao mudar origem)
- F28_VALORI → F28_UFRPER (100 se URF, 0 caso contrario)

**Relacionamentos (SX9):**
- F28 → F2B (F28_CODIGO → F2B_RALIQ) — vincula aliquota a regra de calculo
- F28 → CIN (F28_ID → CIN_IREGRA, quando CIN_TREGRA='2') — condicoes/formulas

---

#### F29 - Unidade de Referencia Fiscal (URF)

| Campo | Tipo | Tam | Descricao |
|---|---|---|---|
| F29_FILIAL | C | 4 | Filial |
| F29_CODIGO | C | 6 | Codigo da URF |
| F29_DESC | C | 100 | Descricao da URF |
| F29_ID | C | 36 | ID do Cadastro (UUID) |

**Indice principal:** `F29_FILIAL+F29_CODIGO+F29_ID`

---

#### CJ2 - Regra de Escrituracao

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| CJ2_FILIAL | C | 4 | Filial | |
| CJ2_CODIGO | C | 6 | Codigo da Regra | Chave primaria |
| CJ2_ID | C | 36 | ID do Cadastro | UUID |
| CJ2_DESCR | C | 100 | Descricao | |
| CJ2_INCIDE | C | 1 | Opcao de Incidencia | Valores dinamicos via FSA160JINC() |
| CJ2_STOTNF | C | 1 | Soma no Total da Nota | Valores dinamicos via x160JTotDp() |
| CJ2_PERDIF | N | 6,2 | Percentual do Diferimento | |
| CJ2_CSTCAB | C | 6 | Tabela de CST | FK para CJ0 |
| CJ2_CST | C | 3 | Classificacao Fiscal (CST) | |
| CJ2_DESCST | C | 100 | Descricao do CST | |
| CJ2_IREDBS | C | 1 | Incidencia Reducao Base | 1=Isento; 2=Outros |
| CJ2_CSTDEV | C | 3 | CST de Devolucao | |
| CJ2_DCSTDE | C | 100 | Descricao CST Devolucao | |
| CJ2_CSTCCT | C | 6 | Cod Classif Trib IBS/CBS | **Campo CBS/IBS** |
| CJ2_CCT | C | 3 | CCT IBS/CBS | **Campo CBS/IBS obrigatorio** |
| CJ2_CCTVIG | D | 8 | Data Inicial Vigencia CCT | |
| CJ2_DESCCT | M | 10 | Descricao Classif Tributaria | Memo |
| CJ2_NLIVRO | C | 1 | Numero do Livro | 1 a 9 |
| CJ2_INCDEV | C | 1 | Incidencia na Devolucao | 1=Tributado; 2=Isento; 3=Outros; 4=Trib+Isento; 5=Trib+Outros; 6=Isento+Outros; 7=Todos |
| CJ2_INDOP | C | 6 | Cod. Indicador Operacao | INDOP para IBS/CBS |
| CJ2_INCRBS | C | 1 | Incidencia Parcela Reduzida | 1=Isento; 2=Outros |
| CJ2_MSGCOD | C | 6 | Codigo Grupo Mensagens | FK para CK7 |
| CJ2_MSGDES | C | 100 | Descricao do Grupo | |
| CJ2_ALTERA | C | 1 | Indicacao de Alteracao | 1=Alterado; 2=Nao alterado |
| CJ2_DTALT | D | 8 | Data de Alteracao | |
| CJ2_HRALT | C | 8 | Hora de Alteracao | |
| CJ2_DCBCST | C | 100 | Descricao Cabecalho CST | |
| CJ2_CHVMD5 | C | 42 | Chave MD5 | |

**Indice principal:** `CJ2_FILIAL+CJ2_ID+CJ2_CODIGO`

**Gatilhos (SX7):**
- CJ2_CSTCAB → CJ2_DESCST, CJ2_CST, CJ2_DCBCST (consulta CJ0/CJ1)
- CJ2_CSTCCT → CJ2_CST, CJ2_CCT, CJ2_DESCCT, CJ2_CCTVIG, CJ2_DESCST (consulta CKB)
- CJ2_CCTVIG → CJ2_CST, CJ2_CCT, CJ2_DESCCT, CJ2_DESCST (consulta CKB por vigencia)
- CJ2_CST → CJ2_DESCST (consulta CJ1->CJ1_DESCR)
- CJ2_CSTDEV → CJ2_DCSTDE (consulta CJ1->CJ1_DESCR)

**Relacionamentos (SX9):**
- CJ2 → F2B (CJ2_CODIGO → F2B_CODESC) — vincula escrituracao a regra de calculo
- CJ0 → CJ2 (CJ0_CODIGO → CJ2_CSTCAB) — tabela CST cabecalho
- CKB → CJ2 (CKB_CSTCCT+CCT+DTINI → CJ2_CSTCCT+CCT+CCTVIG) — CCT IBS/CBS por vigencia

---

#### CJ3 - Escrituracao Fiscal por Item (Dados CBS/IBS)

| Campo | Tipo | Tam | Descricao |
|---|---|---|---|
| CJ3_FILIAL | C | 4 | Filial |
| CJ3_IDESCR | C | 36 | ID da Escrituracao |
| CJ3_IDTGEN | C | 36 | ID Tributo Generico |
| CJ3_IDRESC | C | 36 | ID Regra Escrituracao |
| CJ3_IDF2D | C | 36 | ID NF Tributo Generico |
| CJ3_VLTRIB | N | 14,2 | Valor Tributado |
| CJ3_VLISEN | N | 14,2 | Valor Isento |
| CJ3_CST | C | 3 | Classificacao Fiscal (CST) |
| CJ3_VLOUTR | N | 14,2 | Valor Outros |
| CJ3_VLNTRI | N | 14,2 | Valor Nao Tributado |
| CJ3_VLDIFE | N | 14,2 | Valor Diferido |
| CJ3_VLMAJO | N | 14,2 | Valor Majorado |
| CJ3_PEMAJO | N | 10,6 | Percentual Majoracao |
| CJ3_PEDIFE | N | 10,6 | Percentual Diferimento |
| CJ3_PEREDU | N | 10,6 | Percentual Reducao |
| CJ3_PAUTA | N | 6,2 | Valor da Pauta |
| CJ3_MVA | N | 14,2 | Margem de Valor Agregado |
| CJ3_AUXMVA | N | 14,2 | Indice Auxiliar MVA |
| CJ3_AUXMAJ | N | 14,2 | Indice Auxiliar Majoracao |
| CJ3_TRIB | C | 6 | Codigo do Tributo |
| CJ3_DTEXCL | D | 8 | Data da Exclusao |
| CJ3_CSTCAB | C | 6 | Tabela de CST |
| CJ3_BASORI | N | 14,2 | Base Original |
| CJ3_ALIQTR | N | 6,2 | Indice de Aliquota |
| CJ3_PREDAL | N | 7,3 | Perc. Reducao Aliquota |
| CJ3_CCT | C | 3 | CCT IBS/CBS |
| CJ3_ALIQOR | N | 6,2 | Aliquota Original |
| CJ3_NLIVRO | C | 1 | Numero do Livro (1-9) |
| CJ3_INDOP | C | 6 | Cod. Indicador Operacao (INDOP) |

**Indice principal:** `CJ3_FILIAL+CJ3_IDESCR`

---

#### F2B - Regra Tributaria (Regra de Calculo)

Tabela central do CFGTRIB. Vincula tributo + perfis + regras base/aliquota/escrituracao.

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F2B_FILIAL | C | 4 | Filial | |
| F2B_ID | C | 36 | ID do Cadastro Tributario | UUID |
| F2B_REGRA | C | 6 | Codigo da Regra Fiscal | Chave primaria |
| F2B_DESC | C | 100 | Descricao da Regra | |
| F2B_TRIB | C | 6 | Codigo do Tributo | FK para F2E |
| F2B_DTRIB | C | 100 | Descricao do Tributo | Gatilho: F2E->F2E_DESC |
| F2B_VIGINI | D | 8 | Data Inicio Vigencia | Ex: 01/01/2026 |
| F2B_VIGFIM | D | 8 | Data Fim Vigencia | Ex: 31/12/2049 |
| F2B_STATUS | C | 1 | Status da Regra | 1=Em Teste; 2=Aprovada |
| F2B_RBASE | C | 6 | Regra de Base de Calculo | FK para F27_CODIGO |
| F2B_DBASE | C | 100 | Descricao Base Calculo | Gatilho: F27->F27_DESC |
| F2B_RBASES | C | 6 | Base Secundaria | FK para F27_CODIGO |
| F2B_DBASES | C | 100 | Descricao Base Secundaria | |
| F2B_RALIQ | C | 6 | Regra da Aliquota | FK para F28_CODIGO |
| F2B_DALIQ | C | 100 | Descricao Regra Aliquota | Gatilho: F28->F28_DESC |
| F2B_CODESC | C | 6 | Codigo da Escrituracao | FK para CJ2_CODIGO |
| F2B_DESESC | C | 100 | Descricao Escrituracao | Gatilho: CJ2->CJ2_DESCR |
| F2B_PEROD | C | 6 | Perfil Origem/Destino | FK para F20_CODIGO (tipo 01) |
| F2B_DOD | C | 100 | Descricao Origem/Destino | Gatilho: F20->F20_DESC |
| F2B_PERFPA | C | 6 | Perfil Participante | FK para F20_CODIGO (tipo 02) |
| F2B_DPA | C | 100 | Descricao Participante | |
| F2B_PERFOP | C | 6 | Perfil Operacao | FK para F20_CODIGO (tipo 03) |
| F2B_DOP | C | 100 | Descricao Operacao | |
| F2B_PERFPR | C | 6 | Perfil Produto | FK para F20_CODIGO (tipo 04) |
| F2B_DPR | C | 100 | Descricao Produto | |
| F2B_RFIN | C | 6 | Regra Financeira | FK para FKK |
| F2B_DFIN | C | 100 | Descricao Regra Financeira | |
| F2B_RAPUR | C | 6 | Regra de Apuracao | FK para F2G |
| F2B_DAPUR | C | 100 | Descricao Apuracao | |
| F2B_RCUSTO | C | 6 | Regra de Custo | FK para D4H |
| F2B_DCUSTO | C | 100 | Descricao Regra Custo | |
| F2B_TRBMAJ | C | 6 | Tributo Majoracao | FK para F2B_REGRA (auto-ref) |
| F2B_DETMAJ | C | 100 | Descricao Tributo Majorado | |
| F2B_DEDDEP | C | 6 | Deducao por Dependente | FK para CIV |
| F2B_DETDEP | C | 100 | Descricao Dependentes | |
| F2B_DEDPRO | C | 6 | Deducao Tab. Progressiva | FK para CIQ |
| F2B_DETPRO | C | 100 | Descricao Ded. Progressiva | |
| F2B_RGGUIA | C | 6 | Regra Geracao Guia | FK para CJ4 |
| F2B_DRGUIA | C | 100 | Descricao Regra Guia | |
| F2B_MAXMIN | C | 1 | Maior ou Menor Valor | |
| F2B_VLRMIN | N | 14,2 | Valor Minimo Tributo | |
| F2B_VLRMAX | N | 14,2 | Valor Maximo Tributo | |
| F2B_OPRMIN | C | 30 | Operador Minimo | FK para CIN_CODIGO |
| F2B_OPRMAX | C | 30 | Operador Maximo | FK para CIN_CODIGO |
| F2B_RND | C | 1 | Configuracao Arredondamento | |
| F2B_ORIGEM | C | 1 | Origem da Regra | |
| F2B_RDBASE | N | 3 | % Base Auxiliar ao Comparar | |
| F2B_TPREGR | C | 30 | Tipo da Regra | |
| F2B_TBCONF | C | 6 | Cod. Tributo Generico | |
| F2B_CONREG | C | 30 | Consulta Regra | |
| F2B_ACMAX | C | 1 | Acao ao Exceder Maximo | |
| F2B_ACMIN | C | 1 | Acao ao Nao Atingir Minimo | |
| F2B_ALTERA | C | 1 | Indicacao de Alteracao | |
| F2B_DTALT | D | 8 | Data de Alteracao | |
| F2B_HRALT | C | 8 | Hora de Alteracao | |
| F2B_CHVMD5 | C | 42 | Chave MD5 | |
| F2B_MSGCOD | C | 6 | Codigo Grupo Mensagens | FK para CK7 |
| F2B_MSGDES | C | 100 | Descricao Grupo Mensagens | |

**Indice principal:** `F2B_FILIAL+F2B_ID+F2B_REGRA+DTOS(F2B_VIGINI)+DTOS(F2B_VIGFIM)`

**Relacionamentos chave (SX9):**
- F2B → CJ3 (F2B_REGRA → CJ3_TRIB) — escrituracao por item
- F2B → F2D (F2B_ID → F2D_IDCAD) — tributos calculados
- F2B → CIN (F2B_ID → CIN_IREGRA) — condicoes/formulas
- F2B → CDA (F2B_REGRA → CDA_REGCAL) — lancamentos doc fiscal
- F2B → CJA (F2B_REGRA → CJA_REGCAL) — regra lancamento itens
- F2B → F2B (auto-ref: F2B_REGRA → F2B_TRBMAJ) — majoracao

---

#### CIN - Cabecalho Regra Configurador de Tributos (Incidencias/Formulas)

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| CIN_FILIAL | C | 4 | Filial | |
| CIN_ID | C | 36 | ID do Cabecalho | UUID |
| CIN_CODIGO | C | 30 | Codigo do Cabecalho | |
| CIN_DESCR | C | 100 | Descricao | |
| CIN_TREGRA | C | 2 | Tipo da Regra | 1=Base; 2=Aliquota; 4=URF; 8/11/12=Regra calculo |
| CIN_REGRA | C | 6 | Codigo da Regra | FK para F27/F28/F29/F2B |
| CIN_IREGRA | C | 36 | ID da Regra | UUID da regra vinculada |
| CIN_FORMUL | M | 10 | Formula | Campo Memo com formula |
| CIN_FNPI | C | 254 | Formula Convertida em NPI | Notacao Polonesa Inversa |
| CIN_TRIB | C | 6 | Codigo do Tributo | |
| CIN_ORITRB | C | 2 | Referencia do Valor do Tributo | Valores via FsOriTrb() |
| CIN_VAL | N | 16,4 | Valor Manual | |
| CIN_ALTERA | C | 1 | Indicacao de Alteracao | 0=Alterado; 1=Nao alterado |
| CIN_CONSUL | C | 30 | Consulta Regra | |
| CIN_FILTRO | C | 2 | Tipo da Regra (Filtro) | Valores via XFISTREGRA() |
| CIN_FNPI_M | M | 10 | Formula NPI (Memo) | |

**Indice principal:** `CIN_FILIAL+CIN_CODIGO+CIN_ALTERA+CIN_ID`

---

### Tela de Composicao de Formula (aba "Detalhamento da Formula de Calculo")

Presente nas regras de Base (F27) e Aliquota (F28). Permite montar formulas visuais
usando operandos, operadores e referencias a outros tributos. Dados gravados na tabela CIN.

Campos da tela (mapeados para CIN):
- **Tipo da Regra a ser consultada** → CIN_TREGRA (01=Valores de Origem, etc.)
- **Tributo para filtrar a consulta** → CIN_TRIB
- **Consulta de Regras** → CIN_REGRA / CIN_IREGRA
- **Valor a ser adicionado na formula** → CIN_VAL
- **Referencia do Tributo** → CIN_ORITRB (01=Propria operacao, etc.)
- **Formula** (campo memo) → CIN_FORMUL
- **Formula NPI** (convertida automaticamente) → CIN_FNPI / CIN_FNPI_M

Botoes da tela: Editar Formula, +, -, *, /, Desfaz, Adiciona, (, ), Limpar, Validar

---

### Arvore Completa de Rotinas — FISA170 (verificada na tela real)

```
TOTVS - Configurador de Tributos (FISA170)
│
├── Regras Fiscais
│   ├── Cadastros
│   │   ├── Tributo                              → F2E
│   │   ├── Unidade Ref. Fiscal                  → F29
│   │   ├── Tabela Progressiva                   → CIQ / CIR
│   │   ├── Regras por NCM                       → CIS / CIT / CIU
│   │   ├── Dependentes                          → CIV
│   │   ├── Regras de Codigos de Prestacao de Servico → CIX / CIY / CIZ
│   │   ├── Codigo Situacao Tributaria           → CJ0 / CJ1
│   │   ├── Guia de Escrituracao                 → CJ4
│   │   ├── Codigo de Receita                    → CJ5 / CJ6 / CJ7
│   │   ├── Indicadores Economicos FCA           → (cadastro auxiliar)
│   │   ├── Tabela cClassTrib-IBS/CBS            → CKB
│   │   ├── Tabela Codigo Credito Presumido IBS/CBS → CJN
│   │   └── Tabela Codigos Indicadores de Operacao  → CI1
│   │
│   ├── Perfis
│   │   ├── Perfil de Produto                    → F20 (tipo 04) + F24 / F25
│   │   ├── Perfil de Operacao                   → F20 (tipo 03) + F23 / F26 / CIO / CKC
│   │   ├── Perfil de Participante               → F20 (tipo 02) + F22
│   │   └── Perfil de Origem/Destino             → F20 (tipo 01) + F21
│   │
│   └── Regras de Calculo Documento Fiscal
│       ├── Regra de Base de Calculo             → F27 + CIN (tela formula)
│       ├── Regra de Aliquota                    → F28 + CIN (tela formula)
│       ├── Regra de Escrituracao                → CJ2
│       └── Regra de Calculo - Documentos Fiscais → F2B + CIN
│
├── Regra de Ajuste de Lancamento
│   ├── Cadastro de Mensagem                     → CJ8
│   └── Regra de Ajuste de Lancamento            → CJ9 / CJA
│
├── Regra de IPM
│   └── Cadastro de Regra de IPM                 → CKD / CKE
│
├── Mensagens
│   ├── Identificadores de Mensagens             → CK6
│   ├── Grupos de Mensagens                      → CK7 / CK8
│   └── Mensagens Decodificadas                  → CKA / CK9
│
├── Apuracao
│   ├── Regra de Titulo da Apuracao              → (tabela apuracao)
│   ├── Regra de Apuracao                        → F2G
│   ├── Apuracao dos Tributos Genericos          → F2H / F2I
│   └── Apuracao de IPM                          → (via CKD/CKE)
│
└── Relatorios
    └── Tributos Genericos por Documento Fiscal  → F2D
```

---

### Tabelas Auxiliares CFGTRIB (verificadas no SX2)

#### Cadastros

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| F2E | Cadastro de Tributo | Cadastro de tributos (ICMS=000021, IPI=000022, etc.) |
| F29 | Unidade de Referencia Fiscal (URF) | Referenciada por F28_URF |
| CIQ | Tabela Progressiva | Faixas IRPF, vinculada a F2B_DEDPRO |
| CIR | Itens Tabela Progressiva | Detalhes das faixas |
| CIS | Cabecalho Regra por NCM | Regras especificas por NCM (Etapa 2) |
| CIT | Tributo x Regra | Vinculo tributo-regra NCM |
| CIU | Regras adicionais de tributo por NCM | Complementos NCM |
| CIV | Regra por Dependentes | Deducoes por dependente (IRPF) |
| CIX | Cabecalho Regra ISS | Regras de ISS por codigo servico |
| CIY | Aliquota ISS por Municipio | ISS municipal |
| CIZ | Codigo de Servico Federal | Tabela de servicos LC 116 |
| CJ0 | CST - Cabecalho | Tabelas de CST agrupadas |
| CJ1 | CST - Item | Itens de CST dentro de cada tabela |

#### Escrituracao e Guias

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| CJ4 | Regra para Guia de Recolhimento | Vinculada a F2B_RGGUIA |
| CJ5 | Regra de Codigo de Receita | Codigos de receita por tributo |
| CJ6 | Codigo de Receita por Estado | Receita estadual |
| CJ7 | Mod. Documento Codigo Receita | Modelo de documento |

#### IBS/CBS (Reforma Tributaria)

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| CKB | Classificacao Tributaria IBS/CBS | Tabela cClassTrib por vigencia — vinculada a CJ2_CSTCCT |
| CJN | Credito Presumido IBS/CBS | Tabela de creditos presumidos |
| CI1 | Indicadores de Operacao (IndOp) | Tabela IndOp — vinculada a CJ2_INDOP e CJ3_INDOP |

#### Ajuste de Lancamento

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| CJ8 | Cadastro de Mensagem | Mensagens para ajustes |
| CJ9 | Cabecalho Regra de Ajuste Lancamento | Regras de ajuste SPED (Etapa 3) |
| CJA | Regra de Lancamento - Itens | Itens das regras de ajuste |

#### IPM e Mensagens

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| CKD | Cabecalho Regra de IPM | Regra de IPM |
| CKE | Regra de IPM - Cadastro | Detalhes IPM |
| CK6 | Identificadores de Mensagens | Identificadores |
| CK7 | Cabecalho Grupo de Mensagens | Grupos — vinculado a F2B_MSGCOD e CJ2_MSGCOD |
| CK8 | Identificador do Grupo de Mensagens | Detalhes do grupo |
| CK9 | Mensagens do Identificador | Mensagens vinculadas |
| CKA | Mensagens Decodificadas | Mensagens expandidas |
| CKC | Mensagens Perfil de Operacao | Mensagens por perfil |

#### Calculo e Resultado

| Tabela | Descricao SX2 | Relevancia |
|---|---|---|
| F2A | Valores da URF | Valores mensais das Unidades de Referencia Fiscal (F2A_URF+ANO+MES → VALOR) |
| F2C | Tributos De/Para | Mapeamento entre codigos de tributos |
| F2D | Tributos Genericos Calculados | Resultado do calculo por tributo |
| F2F | Titulos de Tributos x NF | Vincula titulos financeiros gerados pelo CFGTRIB a NF de origem |
| F2J | Resumo Apuracao por Regra | Dados de apuracao |
| F2K | Resumo Analitico Trib Gen | Detalhamento analitico da apuracao (debitos, creditos, estornos, saldos) |
| F2L | Titulos Apuracao Trib. Gen. | Titulos financeiros gerados na apuracao |
| F2M | Ajustes Apuracao Trib Gen | Ajustes manuais de debito/credito na apuracao |
| F2N | Regras de Titulo da Apuracao | Vincula tributo → regra de titulo (FKK) → guia de recolhimento (CJ4) |
| CJG | Controle Cenario Classificador | Cenarios de classificacao tributaria |
| CJL | Controle de Mensagens Decodificadas | Mensagens expandidas vinculadas a documentos fiscais |
| CJW | Regra de Apuracao - Itens | Regras para calculo de apuracao |
| CK4 | Dados Adicionais Perfil Operacao | Complementos do perfil |
| CK5 | Dados Adicionais Regra Calculo | Complementos da regra |
| CIO | Cod ISS Municipal Perfil Operacao | ISS por municipio no perfil |

---

## 2. MATA080 - Tipos de Entrada e Saida (TES)

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA080 |
| Modulo | SIGAFAT / Uso geral |
| Funcao | Cadastro de Tipos de Entrada e Saida |
| Tabela | SF4 |
| Total de campos | 287 (verificados no SX3) |

### Campos Principais da SF4

Os campos estao agrupados por funcionalidade. Apenas os campos relevantes para o projeto sao listados aqui. O total de campos e 287.

#### Identificacao

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_FILIAL | C | 4 | Filial | |
| F4_CODIGO | C | 3 | Codigo da TES | Chave primaria, 001-999 |
| F4_TIPO | C | 1 | Tipo | E=Entrada; S=Saida |
| F4_TEXTO | C | 20 | Texto Padrao | Codigo do texto padrao |
| F4_CF | C | 5 | Codigo Fiscal (CFOP) | Ex: 5102, 6102 |
| F4_CFEXT | C | 3 | CFOP Estendido | |
| F4_CFPS | C | 6 | Codigo CFPS | Cod. Fiscal Prestacao Servico |
| F4_FINALID | C | 254 | Finalidade TES | |
| F4_TIPOPER | C | 1 | Tipo da Operacao | |
| F4_MSBLQL | C | 1 | Bloqueado | 1=Sim; 2=Nao |

#### Movimentacao

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_ESTOQUE | C | 1 | Atualiza Estoque | S=Sim; N=Nao |
| F4_DUPLIC | C | 1 | Gera Duplicata | S=Sim; N=Nao |
| F4_PODER3 | C | 1 | Poder de Terceiros | R=Remessa; D=Devolucao; N=Nao Controla |
| F4_CONSUMO | C | 1 | Material de Consumo | S=Sim; N=Nao; O=Outros |
| F4_UPRC | C | 1 | Atualiza Preco Compra | S=Sim; N=Nao |
| F4_CIAP | C | 1 | Livro Fiscal CIAP | S=Sim; N=Nao |
| F4_ATUATF | C | 1 | Atualiza Ativo Fixo | S=Sim; N=Nao |
| F4_QTDZERO | C | 1 | Permite Qtd Zerada | 1=Sim; 2=Nao |
| F4_VLRZERO | C | 1 | Valor Zerado | 1=Sim; 2=Nao |
| F4_EFUTUR | C | 1 | Entrega Futura | 0=Nao; 1=Rec.Compra EF; 2=Rec.Entrega; 3=Devolucao |
| F4_TESDV | C | 3 | TES Devolucao | FK para SF4 |
| F4_TESP3 | C | 3 | TES Retorno Terceiro | FK para SF4 |

#### ICMS

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_ICM | C | 1 | Calcula ICMS | S=Sim; N=Nao |
| F4_CREDICM | C | 1 | Credita ICMS | S=Sim; N=Nao |
| F4_LFICM | C | 1 | Livro Fiscal ICMS | T=Tributado; I=Isento; O=Outros; N=Nao; Z=Zerado; B=Observacao |
| F4_SITTRIB | C | 2 | Situacao Tributaria ICMS | CST ICMS (00, 10, 20, etc.) |
| F4_BASEICM | N | 5,2 | % Reducao Base ICMS | |
| F4_COMPL | C | 1 | Calcula Dif. ICMS | S=Sim; N=Nao |
| F4_ICMSDIF | C | 1 | Diferimento ICMS | 1=Diferido; 2=Nao; 3=Dif.Reducao; 4=Incentivo; 5=Dif.ST; 6=Deduz NF/Dup; 7=Ded.ICMS BC Composta |
| F4_PICMDIF | N | 6,2 | Perc. ICMS Diferido | |
| F4_DIFAL | C | 1 | Calcula DIFAL | 1=Sim; 2=Nao |

#### IPI

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_IPI | C | 1 | Calcula IPI | S=Sim; N=Nao; R=Com.Nao Atacadista |
| F4_CREDIPI | C | 1 | Credita IPI | S=Sim; N=Nao |
| F4_LFIPI | C | 1 | Livro Fiscal IPI | T=Tributado; I=Isento; O=Outros; N=Nao; Z=Zerado; P=Vl.IPI Outr.ICM |
| F4_BASEIPI | N | 5,2 | % Reducao Base IPI | |
| F4_DESTACA | C | 1 | Destaca IPI na NF | S=Sim; N=Nao |
| F4_INCIDE | C | 1 | IPI na Base ICMS | S=Sim; N=Nao; F=Consumidor Final; O=Vl.IPI Outr.ICM |

#### PIS/COFINS

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_PISCOF | C | 1 | Gera PIS/COFINS | 1=PIS; 2=COFINS; 3=Ambos; 4=Nao Considera |
| F4_PISCRED | C | 1 | Credita PIS/COFINS | 1=Credita; 2=Debita; 3=Nao Calcula; 4=Calcula; 5=Exclusao Base |
| F4_CSTPIS | C | 2 | CST PIS | 01-99 conforme tabela |
| F4_CSTCOF | C | 2 | CST COFINS | 01-99 conforme tabela |
| F4_BASEPIS | N | 6,2 | % Reducao PIS | |
| F4_BASECOF | N | 6,2 | % Reducao COFINS | |
| F4_MALQPIS | N | 6,2 | Aliquota PIS Majorada | |
| F4_MALQCOF | N | 6,2 | Aliquota COFINS Majorada | |
| F4_PSCFST | C | 1 | PIS/COFINS ST | 1=Sim; 2=Nao; 3=Aliq.Zero; 4=Base e Valor Zero |
| F4_AGRPIS | C | 1 | Agrega PIS | 1=Sim; 2=Nao; P=PIS+Merc; D=Deduz |
| F4_AGRCOF | C | 1 | Agrega COFINS | 1=Sim; 2=Nao; C=COF+Merc; D=Deduz |
| F4_PISDSZF | C | 1 | PIS Zona Franca | 1=Sim; 2=Nao |
| F4_COFDSZF | C | 1 | COFINS Zona Franca | 1=Sim; 2=Nao |
| F4_TNATREC | C | 4 | Tabela Natureza Receita | FK para CCZ |
| F4_CNATREC | C | 3 | Codigo Natureza Receita | |
| F4_GRPNATR | C | 2 | Grupo Natureza Receita | |

#### ISS

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_ISS | C | 1 | Calcula ISS | S=Sim; N=Nao |
| F4_LFISS | C | 1 | Livro Fiscal ISS | T=Tributado; I=Isento; O=Outros; N=Nao calcula |
| F4_RETISS | C | 1 | Retem ISS | S=Sim; N=Nao |
| F4_BASEISS | N | 5,2 | % Reducao ISS | |
| F4_CSTISS | C | 2 | Sit. Tributaria ISS | |

#### ICMS-ST

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_STDESC | C | 1 | Base ICMS-ST | 1=Vlr.Liquido; 2=Vlr.Bruto |
| F4_BSICMST | N | 6,2 | % Reducao ICMS-ST | |
| F4_CREDST | C | 1 | Credita ICMS-ST | 1=Credita; 2=Retido ST; 3=Debita; 4=Subst.Trib. |
| F4_LFICMST | C | 1 | Livro Fiscal ICMS-ST | N=Nao; I=Isentas; O=Outras; T=Tributadas |

#### Financeiro

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_CODPAG | C | 2 | Cod. Pagamento Cat 156 | 01=Debito; 02=Credito; 03=Boleto; 04=Inter.Financeira; 05=Dinheiro; 99=Outros |

#### Outros Campos Relevantes

| Campo | Tipo | Tam | Descricao | Valores Validos |
|---|---|---|---|---|
| F4_FORMULA | C | 3 | Formula Livro Fiscal | FK para SM4 |
| F4_AGREG | C | 1 | Agrega Valor | I=ICMS+Mer; A=ICMS; S=Sim; N=Nao; B/C/D/E/F/G/H/R |
| F4_INCSOL | C | 1 | Agrega ICMS Retido | S=Sim; N=Nao; A=Mercadoria; D=Deduz; E=Desc.ICMS ST |
| F4_CSOSN | C | 3 | Cod Sit Operacao SN | Para Simples Nacional |
| F4_BONIF | C | 1 | Bonificacao | S=Sim; N=Nao |
| F4_TPREG | C | 1 | Tipo de Regime | 1=Nao Cumulativo; 2=Cumulativo; 3=Ambos |

### Gatilhos SF4 (SX7)

| Campo Origem | Campo Destino | Regra |
|---|---|---|
| F4_TNATREC | F4_GRPNATR | CCZ->CCZ_GRUPO |
| F4_TNATREC | F4_DTFIMNT | CCZ->CCZ_DTFIM |
| F4_TNATREC | F4_CNATREC | CCZ->CCZ_COD (condicional) |

### Gatilhos de outras tabelas que consultam SF4

| Campo Origem | Campo Destino | Regra |
|---|---|---|
| D1_TES | D1_CLASFIS | SubStr(D1_CLASFIS,1,1)+SF4->F4_SITTRIB |
| D2_TES | D2_CLASFIS | SubStr(D2_CLASFIS,1,1)+SF4->F4_SITTRIB |
| D1_COD | D1_CLASFIS | Subs(SB1->B1_ORIGEM,1,1)+SF4->F4_SITTRIB |
| D2_COD | D2_CLASFIS | SubStr(SB1->B1_ORIGEM,1,1)+SF4->F4_SITTRIB |
| C8_TES | C8_CF | SF4->F4_CF |

---

## 3. MATA002 - Cadastro de Produtos

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA002 / MATA010 |
| Modulo | SIGAEST |
| Tabela | SB1 (193 campos) + SB5 (complementos) |

### Campos Fiscais Relevantes da SB1

| Campo | Tipo | Tam | Descricao |
|---|---|---|---|
| B1_COD | C | 15 | Codigo do Produto |
| B1_DESC | C | 80 | Descricao |
| B1_TIPO | C | 2 | Tipo (PA/MP/PI/MC/ME/SV/etc.) |
| B1_UM | C | 2 | Unidade de Medida |
| B1_GRUPO | C | 4 | Grupo de Produto |
| B1_POSIPI | C | 10 | NCM |
| B1_ORIGEM | C | 1 | Origem da Mercadoria (0-8) |
| B1_PICM | N | 6,2 | Aliquota ICMS |
| B1_IPI | N | 6,2 | Aliquota IPI |
| B1_TE | C | 3 | TES Padrao Entrada |
| B1_TS | C | 3 | TES Padrao Saida |
| B1_CODISS | C | 9 | Codigo Servico ISS |
| B1_GRTRIB | C | 3 | Grupo de Tributo |
| B1_CLASFIS | C | 2 | Classificacao Fiscal |

---

## 4. MATA089 - Cadastro de Naturezas de Operacao

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | MATA089 |
| Modulo | SIGAFAT |
| Tabela | SED |

### Campos Reais da SED

| Campo | Tipo | Tam | Descricao |
|---|---|---|---|
| ED_FILIAL | C | 4 | Filial |
| ED_CODIGO | C | 10 | Codigo da Natureza |
| ED_DESCRIC | C | 30 | Descricao |
| ED_CALCIRF | C | 1 | Calcula IRRF (S/N) |
| ED_CALCISS | C | 1 | Calcula ISS (S/N) |
| ED_PERCIRF | N | 5,2 | Percentual IRRF |
| ED_CALCINS | C | 1 | Calcula INSS (S/N) |
| ED_PERCINS | N | 5,2 | Percentual INSS |
| ED_CALCCSL | C | 1 | Calcula CSLL (S/N) |
| ED_CALCCOF | C | 1 | Calcula COFINS (S/N) |
| ED_CALCPIS | C | 1 | Calcula PIS (S/N) |
| ED_PERCCSL | N | 5,2 | Percentual CSLL |
| ED_PERCCOF | N | 5,2 | Percentual COFINS |
| ED_PERCPIS | N | 5,2 | Percentual PIS |
| ED_CONTA | C | 20 | Conta Contabil |
| ED_DEDPIS | C | 1 | Deducao PIS |
| ED_DEDCOF | C | 1 | Deducao COFINS |
| ED_BASEINS | N | 5,2 | Base INSS |

> **NOTA:** Os campos ED_CF1 a ED_CF8 (CFOP por cenario) que constavam na v1.0 deste
> documento NAO foram encontrados no SX3 desta versao. Verificar se existem em
> versoes anteriores ou se sao campos customizados.

---

## 4.1. FISA170 - Regras Financeiras (Motor de Retencoes)

### Informacoes Gerais

| Item | Valor |
|---|---|
| Rotina | FISA170 (sub-menu Regras Financeiras) |
| Modulo | SIGAFIN (Financeiro) integrado via SIGAFIS |
| Funcao | Motor de retencoes de impostos na fonte (IRRF, PIS, COFINS, CSLL, INSS, ISS, etc.) |
| Fonte principal | FINXRET (funcoes genericas do Configurador de Tributos - Financeiro) |
| Requisito minimo | Release 12.1.23 |

### Descricao

O motor de retencoes centraliza a configuracao de impostos retidos na fonte, tratando:
- Base de calculo (percentual sobre total da nota/titulo)
- Aliquota (percentual sobre a base)
- Vencimento do titulo de retencao
- Valor minimo/maximo para dispensa
- Deducao de base e valor (ex: INSS deduzido da base do IRF)
- Tabela progressiva (IRPF com faixas)
- Vigencia, fato gerador (emissao ou pagamento)
- Cumulatividade (diaria, semanal, mensal, anual)
- Geracao de titulo financeiro (imposto ou abatimento)

### Regra de Avaliacao

O calculo de retencoes requer intersecao entre **Fornecedor** e **Natureza**:
- Se Fornecedor tem regras A, B, C e Natureza tem regras A, B, D → calcula apenas A e B
- Se nenhuma regra coincide → nenhum tributo e calculado

### Tabelas Envolvidas (verificadas no SX2)

| Tabela | Descricao | Compartilhamento |
|---|---|---|
| FKK | Regras Financeiras Retencao (cabecalho) | Exclusivo |
| FKL | Regras de Titulos | Exclusivo |
| FKN | Regra de Calculo (financeiro) | Nao compartilhado |
| FKO | Regras de Retencao | Exclusivo |
| FKP | Regras de Vencimento | Exclusivo |
| FKQ | Tributos Fiscais Calculados | Exclusivo |
| FKS | Cabecalho Tabelas Financeiras | Exclusivo |
| FKT | Cabecalho Regra Cumulatividade | Exclusivo |
| FKU | Cabecalho Regra Valores Acessorios | Exclusivo |
| FKV | Cabecalho Regra Deducoes | Exclusivo |
| FOO | Tipos de Impostos | — |
| FOI | Tipo de Retencao x Naturezas | — |
| FOJ | Tipo de Retencao x Clientes | — |
| FOK | Tipo de Retencao x Fornecedores | — |
| FOV | Deducoes para tipo de retencao | — |
| FOS | Tabela de Valores para tipo de retencao | — |
| FOT | Cumulatividade para tipo de retencao | — |
| FOU | Valores acessorios para tipo de retencao | — |
| F7R | Deducao por Valores Fixos | — |
| F7S | Faixas Especiais - Redutores | — |

### Cadastros da Regra Financeira (sub-rotinas da FISA170)

| Cadastro | Fonte | Descricao |
|---|---|---|
| Regra de Titulo | FINA024TIT | Como serao gerados os titulos de impostos (tipo, carteira, natureza, prefixo) |
| Regra de Deducao | FINA024DED | Deducao de base ou valor entre tributos (ex: INSS deduz base IRRF) |
| Regra de Tabelas Progressivas | FINA024TPR | Faixas com percentuais e valores a deduzir (IRPF) |
| Regra de Calculo - Titulos | FINA024CAL | Percentual de base e aliquota para retencao |
| Regra de Vencimento | FINA024VCT | Calculo da data de vencimento do titulo de retencao |
| Regra de Retencao | FINA024RET | Fato gerador (emissao/pagamento), pagamentos parciais, parcelamentos |
| Regra de Cumulatividade | FINA024CUM | Periodo de apuracao, tipo (codigo/CNPJ/raiz) |
| Regra de Valores Acessorios | FINA024VA | Juros, multa, desconto na composicao da base |
| Regra Financeira | FINA024RFI | Regra principal que vincula todas as sub-regras acima |

> **IMPORTANTE:** Regras financeiras NAO possuem vinculo com IDTOTVS.
> Para calculo correto dos impostos legados, deve-se usar a sigla do imposto legado
> (IRF, PIS, COF, CSL, INSS, ISS, etc.) no campo Tributo (FOO_CODIGO) da regra financeira.
> Usar nome diferente (ex: PISRET) fara o sistema interpretar como tributo novo.

### Nomes Fixos de Impostos (Regras Financeiras)

| Imposto | Nome Fixo |
|---|---|
| Imposto de Renda (PF/PJ) | IRF |
| PIS Apuracao | PIS |
| COFINS Apuracao | COF |
| CSLL | CSL |
| INSS | INSS |
| ISS | ISS |
| CIDE | CIDE |
| SEST | SEST |
| FUNRURAL | FUN |
| FETHAB | FETH |
| FABOV | FAB |
| FACS | FACS |
| Taxa Processamento Desp. Publicas | TPDP |

### Pontos de Entrada Relevantes

| Ponto de Entrada | Momento | Descricao |
|---|---|---|
| FXIMPGR | Apos geracao dos titulos de impostos | Permite gravar/manipular dados complementares dos titulos gerados pelo motor de retencoes. Recebe array PARAMIXB com alias (SE1/SE2) e RECNO de cada titulo. Retorno Nil. |

### Relacionamento com CFGTRIB Fiscal

A Regra Financeira (FKK) e vinculada a uma Regra de Calculo (F2B) atraves do campo F2B_RFIN.
Isso permite que um tributo calculado fiscalmente (ex: PIS na NF) tenha sua retencao financeira
configurada automaticamente.

```
F2B (Regra Tributaria — Fiscal)
 └──→ FKK (Regra Financeira — Retencao) via F2B_RFIN
        ├──→ FKL (Regra de Titulo)
        ├──→ FKN (Regra de Calculo)
        ├──→ FKO (Regra de Retencao)
        ├──→ FKP (Regra de Vencimento)
        ├──→ FKT (Regra de Cumulatividade)
        ├──→ FKU (Regra de Valores Acessorios)
        ├──→ FKV (Regra de Deducoes)
        └──→ FOO (Tipos de Impostos — nome fixo legado)
               ├──→ FOI (x Naturezas)
               ├──→ FOJ (x Clientes)
               └──→ FOK (x Fornecedores)
```

---

## 5. Parametros SX6 Fiscais

### Parametros Verificados no SX6 Real

| Parametro | Tipo | Valor Padrao | Descricao |
|---|---|---|---|
| MV_ESTADO | C | SP | Sigla do estado da empresa para calculo de ICMS |
| MV_ICMPAD | N | 18 | Aliquota ICMS para operacoes dentro do estado |
| MV_TXPIS | N | 1.65 | Taxa para calculo do PIS |
| MV_TXCOFIN | N | 7.60 | Taxa para calculo do COFINS |
| MV_SUBTRIB | C | (vazio) | Inscricao Estadual ST em outro estado |
| MV_PISNAT | C | PIS | Natureza para titulos de PIS |
| MV_DIFALIQ | N | (vazio) | Aliquota especifica para ICMS Complementar |
| MV_TXCOF | N | 3 | Aliquota padrao COFINS no sistema |

### Parametros NAO Encontrados no SX6

Os seguintes parametros que constavam na v1.0 deste documento ou na skill protheus-analyst
**NAO existem** no SX6 real desta versao:

| Parametro | Status |
|---|---|
| MV_CONTTRI | NAO ENCONTRADO |
| MV_PRCTRIB | NAO ENCONTRADO |
| MV_TRIBIMP | NAO ENCONTRADO |
| MV_TESSION | NAO ENCONTRADO |
| MV_SPESSION | NAO ENCONTRADO |
| MV_CESSION | NAO ENCONTRADO |
| MV_USANFSE | NAO ENCONTRADO |
| MV_COFNAT | NAO ENCONTRADO |
| MV_DIFAL | NAO ENCONTRADO (existem MV_DIFAFN e MV_DIFALIQ) |

> **NOTA:** Alguns destes parametros podem ser criados dinamicamente pela rotina FISA170
> em tempo de execucao (via SuperGetMV com valor padrao). O SX6 exportado nao contem
> parametros criados em runtime. Consultar documentacao PDF para confirmar.

---

## 6. Relacionamento entre Rotinas

### Grafo de Dependencias CFGTRIB

```
CJH (Natureza Operacao)
 └──→ F20 (Perfis Tributarios) ← Tabela Central de Perfis
        ├──→ F21 (Perfil Origem/Destino)     [tipo 01]
        ├──→ F22 (Perfil Participante)        [tipo 02]
        ├──→ F23 (Perfil Operacao/CFOP)       [tipo 03]
        ├──→ F24 (Perfil Produto)             [tipo 04]
        ├──→ F25 (Perfil Produto x Origem)    [tipo 04]
        ├──→ F26 (Perfil Tipo Operacao)       [tipo 03]
        ├──→ CIO (Cod ISS Municipal)          [tipo 03]
        └──→ F2B (Regra Tributaria) ← Tabela Central de Calculo
                ├──→ F27 (Regra Base)
                │     └──→ CIN (Incidencias, tipo 1)
                ├──→ F28 (Regra Aliquota)
                │     ├──→ CIN (Incidencias, tipo 2)
                │     └──→ F29 (URF)
                │           └──→ CIN (Incidencias, tipo 4)
                ├──→ CJ2 (Regra Escrituracao)
                │     ├──→ CJ0/CJ1 (Tabelas CST)
                │     └──→ CKB (CCT IBS/CBS por vigencia)
                ├──→ CJ3 (Escrituracao por Item — dados CBS/IBS)
                ├──→ F2D (Tributos Calculados)
                ├──→ CJA (Regra Lancamento)
                ├──→ CDV (Info Adicionais Apuracao)
                └──→ F2J (Resumo Apuracao)

SF4 (TES) ← Permanece para campos de integracao
 ├──→ SD1/SD2 (Itens NF) via D1_TES/D2_TES
 ├──→ SB1 (Produtos) via B1_TE/B1_TS
 └──→ SED (Naturezas) via F4_CF

SB1 (Produtos) → B1_POSIPI (NCM) usado como criterio nos perfis
```

### Fluxo de Calculo

```
1. Nota Fiscal entrada/saida
2. Para cada tributo (ICMS, IPI, PIS, COFINS, CBS, IBS):
   a. Selecionar Regras F2B ativas (F2B_STATUS='1' ou '2') na vigencia
   b. Avaliar Perfis:
      - F21: UF origem/destino da operacao bate?
      - F22: Participante (cliente/fornecedor) bate?
      - F23: CFOP da operacao bate?
      - F24: Produto bate?
   c. Se todos perfis batem → aplicar regra:
      - F27: Calcular base de calculo
      - F28: Aplicar aliquota
      - CIN: Resolver formulas/incidencias
      - CJ2: Determinar escrituracao (CST, incidencia, livro)
   d. Gravar resultado em F2D e CJ3
```

---

## 7. Documentacao de Referencia

### PDFs Disponiveis em /Users/lucasvieira/Documentacao Config/

75 documentos PDF da documentacao oficial TOTVS (TDN + Central de Atendimento).

#### Documentos Estrategicos (leitura prioritaria)

| Documento | Relevancia |
|---|---|
| CFGTRIB - Cadastro de Perfis do Configurador de Tributos - Boas Praticas | Como criar perfis corretamente |
| CFGTRIB - Cadastro de Regras de Calculo no Configurador de Tributos - Boas Praticas | Como criar regras F2B |
| CFGTRIB - Campos que Permanecem no TES | Quais campos SF4 manter na integracao |
| CFGTRIB - Compartilhamento de Tabelas | Regras de compartilhamento F2B/F27/F28/F20-F26 |
| CFGTRIB - Integracao dos tributos legados com o Configurador de Tributos | Transicao legado → CFGTRIB |
| CFGTRIB - Operandos de Integracao | O:VAL_MERCADORIA, O:FRETE, etc. |
| CFGTRIB - Mecanismo de aprovacao de regra | F2B_STATUS 1→2 |
| CFGTRIB - Indicadores da Operacao (IndOp) | INDOP para IBS/CBS |
| CFGTRIB - Adequacao do Configurador de Tributos aos Codigos de Classificacao Tributaria do IBS, CBS e IS | CCT / CKB |
| CROSS - Como configurar o calculo do CBS_IBS no Configurador de Tributos | Aliquotas CBS 0.9% / IBS 0.1% |
| Complemento de ICMS com IBS e CBS | Integracao ICMS + CBS/IBS |

#### Documentos de Regras Financeiras / Retencoes

| Documento | Relevancia |
|---|---|
| Configurador de Tributos - Regras Financeiras | Estrutura completa do motor de retencoes, tabelas FKK/FKL/FKN/FKO/FKP, exemplos de configuracao |
| FXIMPGR - Ponto de entrada permite gravar/manipular dados complementares - FINXRET | PE para customizar titulos de impostos gerados pelo motor de retencoes |

#### Documentos de Calculo Especifico

Cobrem cenarios como: ICMS-ST, DIFAL base dupla/simples, ZFM, monofasico, diferimento, credito presumido, FUNRURAL, FACS/FETHAB, importacao, IRPF progressivo, INSS, ISS retido, PIS/COFINS com exclusao ICMS, pauta/MVA, etc.

### Documentacao Extra — Regras Financeiras (44 PDFs)

Localizacao: `/Users/lucasvieira/Documentacao Extra/`

44 documentos da Central de Atendimento TOTVS sobre regras financeiras do CFGTRIB no SIGAFIN.
Sao guias passo-a-passo de cenarios especificos: ISS retido, INSS, PCC cumulativo, IRRF PJ/PF,
FUNRURAL, adiantamentos, baixa parcial, etc.

Documentos estrategicos nesta pasta:

| Documento | Relevancia |
|---|---|
| Compartilhamento das tabelas do Configurador | Regras de compartilhamento FKK/FKL/etc. |
| Configurador de tributos novas tabelas | Lista tabelas adicionadas ao CFGTRIB |
| Contabilizar impostos gerados pelo configurador | Entidades contabeis |
| Reforma do Imposto de Renda 2026 (Lei 15.270/2025) | IR progressivo 2026 para greenfield |

### Estruturas de Implementacao Real

Localizacao: `/Users/lucasvieira/Estrutura/`

| Arquivo | Descricao | Relevancia |
|---|---|---|
| Planilha de apoio para construcao das regras.xlsx | Template vazio com 10 abas (NCM, Perfis, Base, Aliquota, Escrituracao, Calculo) | **Formato de referencia para exportacao da ferramenta web** |
| NAO COMPARTILHAR - estrutura fisa170 Agenor.xlsx | Template preenchido com dados reais (10 TES, 30 produtos, 458 fornecedores, perfis e regras completas) | **Fixture de validacao — comparar output da engine com implementacao real** |
| AnexoVII-IndOp_IBSCBS.xlsx | Tabela oficial de Indicadores de Operacao IBS/CBS (35 registros) | **Referencia para CJ2_INDOP nas regras CBS/IBS** |
| AnexoVIII-CorrelacaoItemNBSIndOpCClassTrib.xlsx | Correlacao LC 116 Item → NBS → IndOp (1.740 registros) | **Referencia para servicos com IBS** |
| cClassTrib 2025-11-19.xlsx | Tabela oficial Classificacao Tributaria IBS/CBS (~1000 registros, CST, cClassTrib, artigo LC 214/25) | **Referencia para CJ2_CSTCCT e CJ2_CCT** |
| 01.Treinamento Configurador de Tributos.pdf | Material treinamento TOTVS 2025 (117 paginas) | Referencia didatica |
| CONFIGURADOR-TRIBUTOS-REGRAS-FISCAIS CAGEPA.pdf | Apostila implementacao versao 12.1.2410 (86 paginas) | Outro exemplo de implementacao real |

### Dicionarios de Dados

| Arquivo | Caminho | Conteudo |
|---|---|---|
| sx20101 | /Users/lucasvieira/Documentacao Tabelas/ | Metadados de tabelas |
| sx30101 | /Users/lucasvieira/Documentacao Tabelas/ | Campos (177k linhas) |
| sx50101 | /Users/lucasvieira/Documentacao Tabelas/ | Tabelas genericas (combos) |
| sx60101 | /Users/lucasvieira/Documentacao Tabelas/ | Parametros MV_* |
| sx70101 | /Users/lucasvieira/Documentacao Tabelas/ | Gatilhos |
| sx90101 | /Users/lucasvieira/Documentacao Tabelas/ | Relacionamentos entre tabelas |
