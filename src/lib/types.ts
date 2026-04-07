// NF-e parsed data types
export interface Endereco {
  logr: string;
  nro: string;
  compl: string;
  bairro: string;
  codMun: string;
  mun: string;
  uf: string;
  cep: string;
}

export interface Emitente {
  cnpj: string;
  xNome: string;
  xFant: string;
  endereco: Endereco;
  ie: string;
  crt: string;
}

export interface Destinatario {
  cnpj: string;
  xNome: string;
  endereco: Endereco;
  indIEDest: string;
  ie: string;
  email: string;
  isEstrangeiro: boolean;
}

export interface Identificacao {
  cUF: string;
  natOp: string;
  mod: string;
  serie: string;
  nNF: string;
  dhEmi: string;
  dhSaiEnt: string;
  tpNF: string; // 0=entrada, 1=saida
  idDest: string; // 1=interna, 2=interestadual, 3=exterior
  finNFe: string; // 1=normal, 4=devolucao
  indFinal: string;
  nfRef: string;
}

export interface Produto {
  cProd: string;
  xProd: string;
  ncm: string;
  cest: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  uTrib: string;
  qTrib: number;
}

export interface ImpostoICMS {
  orig: string;
  cst: string;
  modBC: string;
  vBC: number;
  pICMS: number;
  vICMS: number;
  vBCSTRet: number;
  pST: number;
  vICMSSTRet: number;
}

export interface ImpostoIPI {
  cst: string;
  vBC: number;
  pIPI: number;
  vIPI: number;
}

export interface ImpostoPISCOFINS {
  cst: string;
  vBC: number;
  pAliq: number;
  vAliq: number;
}

export interface ImpostoII {
  vBC: number;
  vDespAdu: number;
  vII: number;
  vIOF: number;
}

export interface ImpostoIBSCBS {
  cst: string;
  cClassTrib: string;
  vBC: number;
  pIBSUF: number;
  vIBSUF: number;
  pCBS: number;
  vCBS: number;
}

export interface ItemNFe {
  nItem: number;
  prod: Produto;
  icms: ImpostoICMS;
  ipi: ImpostoIPI;
  pis: ImpostoPISCOFINS;
  cofins: ImpostoPISCOFINS;
  ii: ImpostoII | null;
  ibscbs: ImpostoIBSCBS | null;
  infAdProd: string;
}

export interface TotalNFe {
  vBC: number;
  vICMS: number;
  vICMSDeson: number;
  vBCST: number;
  vST: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vII: number;
  vIPI: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
}

export interface Transporte {
  modFrete: string;
  transporta: { cnpj: string; xNome: string } | null;
  volumes: { qVol: string; esp: string; pesoL: string; pesoB: string } | null;
}

export interface Duplicata {
  nDup: string;
  dVenc: string;
  vDup: number;
}

export interface Cobranca {
  fat: { nFat: string; vOrig: number; vDesc: number; vLiq: number } | null;
  duplicatas: Duplicata[];
}

export interface Pagamento {
  indPag: string;
  tPag: string;
  vPag: number;
}

export interface NFeParsed {
  chave: string;
  ide: Identificacao;
  emit: Emitente;
  dest: Destinatario;
  itens: ItemNFe[];
  total: TotalNFe;
  transp: Transporte;
  cobr: Cobranca;
  pag: Pagamento[];
  infAdic: string;
  tipoOrigem: "entrada" | "saida";
}

// Rules engine output types
export interface TESConfig {
  codTes: string;
  tipo: "E" | "S";
  cfop: string;
  descricao: string;
  cstIcms: string;
  cstIpi: string;
  cstPis: string;
  cstCofins: string;
  count: number;

  // Movimentacao
  atualizaEstoque: string;
  geraDuplicata: string;
  entregaFutura: string;
  poderTerceiro: string;
  atualPrecCompra: string;
  matConsumo: string;
  ativoCIAP: string;
  atualizaAtivo: string;
  qtdZerada: string;
  vlrZerado: string;
  finalidade?: string;
  tipOperacao?: string;

  // ICMS
  calculaIcms: string;
  creditaIcms: string;
  livroIcms: string;
  sitTribIcms?: string;
  reducaoBaseIcms?: number;
  icmsDiferido?: string;
  percIcmsDif?: number;
  calculaDifal?: string;

  // IPI
  calculaIpi: string;
  creditaIpi: string;
  livroIpi: string;
  reducaoBaseIpi?: number;
  destacaIpi?: string;

  // PIS/COFINS
  pisCofins: string;
  creditaPisCof: string;
  cstPisExpanded?: string;
  cstCofinsExpanded?: string;
  reducaoBasePis?: number;
  reducaoBaseCof?: number;
  aliqPisMaj?: number;
  aliqCofMaj?: number;
  pisCofST?: string;
  agrPis?: string;
  agrCof?: string;
  pisZonaFranca?: string;
  cofZonaFranca?: string;
  tabelaNatRec?: string;
  codNatRec?: string;
  grpNatRec?: string;

  // ISS
  calculaIss?: string;
  livroIss?: string;
  retemIss?: string;

  // ICMS-ST
  baseIcmsST?: string;
  redIcmsST?: number;
  creditaIcmsST?: string;

  // Financeiro
  codPagamento?: string;

  // Referencias
  tesDevol?: string;
  tesPoder3?: string;
  csosn?: string;
  bonificacao?: string;
  cfps?: string;
}

export interface FiscalRule {
  id: string;
  cfop: string;
  ncm: string;
  ufOrig: string;
  ufDest: string;
  pICMS: string;
  pIPI: string;
  pPIS: string;
  pCOFINS: string;
  obs: string;
}

export interface FinancialRule {
  id: string;
  descricao: string;
  tPag: string;
  tPagDesc: string;
  parcelas: number;
  count: number;
}

export interface FiscalProfile {
  name: string;
  description: string;
  cfops: string[];
  color: string;
  icmsRule: string;
  ipiRule: string;
  pisRule: string;
  cofinsRule: string;
}

export interface ProductInfo {
  cProd: string;
  xProd: string;
  ncm: string;
  uCom: string;
  orig: string;
  count: number;
  totalValue: number;
}

export interface Suggestion {
  type: "info" | "warning" | "success" | "error";
  title: string;
  description: string;
  details?: string;
}

export interface Participante {
  cnpj: string;
  xNome: string;
  uf: string;
  ie: string;
  count: number;
  tipo: "cliente" | "fornecedor" | "ambos";
}

export interface OperationType {
  name: string;
  count: number;
  totalValue: number;
  color: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// CFGTRIB types — Perfis (F20+F21/F22/F23/F24)
// ---------------------------------------------------------------------------

// F20_TIPO='04' + F24 (Perfil Produto)
export interface PerfilProduto {
  codigo: string;
  descricao: string;
  produtos: Array<{
    codProd: string;
  }>;
}

// F20_TIPO='03' + F23 (Perfil Operacao/CFOP)
export interface PerfilOperacao {
  codigo: string;
  descricao: string;
  cfops: Array<{
    cfop: string;
    descricao: string;
  }>;
}

// F20_TIPO='02' + F22 (Perfil Participante)
export interface PerfilParticipante {
  codigo: string;
  descricao: string;
  participantes: Array<{
    tipo: '1' | '2';
    codPart: string;
    loja: string;
    razaoSocial?: string;
  }>;
}

// F20_TIPO='01' + F21 (Perfil Origem/Destino)
export interface PerfilOrigemDestino {
  codigo: string;
  descricao: string;
  ufs: Array<{
    ufOrigem: string;
    ufDestino: string;
  }>;
}

// ---------------------------------------------------------------------------
// CFGTRIB types — Regras Base, Aliquota, Escrituracao
// ---------------------------------------------------------------------------

export type ValorOrigemBase = '01' | '02' | '03' | '08' | '09' | '10' | '11';
export type ValorOrigemAliq = '04' | '05' | '06';

// Tabela F27 — Regra de Base de Calculo
export interface RegraBase {
  codigo: string;
  descricao: string;
  valorOrigem: ValorOrigemBase;
  desconto?: string;
  frete?: string;
  seguro?: string;
  despesas?: string;
  icmsDesonerado?: string;
  icmsRetido?: string;
  reducaoBC?: number;
  tipoReducao?: string;
  unidMedida?: string;
}

// Tabela F28 — Regra de Aliquota
export interface RegraAliquota {
  codigo: string;
  descricao: string;
  valorOrigem: ValorOrigemAliq;
  tipoAliquota: '1' | '2';
  aliquota?: number;
  urf?: string;
  reducaoAliquota?: number;
}

// Tabela CJ2 — Regra de Escrituracao
export interface RegraEscrituracao {
  codigo: string;
  descricao: string;
  incidencia: string;
  somaTotal?: string;
  percDiferimento?: number;
  cstCab?: string;
  cst: string;
  cstCct?: string;
  cct?: string;
  cctVigencia?: string;
  indOp?: string;
  nlivro?: string;
  incidenciaReducao?: string;
  cstDevolucao?: string;
  incidenciaDevolucao?: string;
}

// ---------------------------------------------------------------------------
// CFGTRIB types — Regra de Calculo F2B
// ---------------------------------------------------------------------------

// Tabela F2B — Regra Tributaria (tabela central do CFGTRIB)
export interface RegraCalculo {
  codigo: string;
  descricao: string;
  tributo: string;
  idTotvs?: string;
  vigIni: string;
  vigFim: string;
  status: '1' | '2';
  codBase: string;
  codBaseSecundaria?: string;
  codAliquota: string;
  codEscrituracao?: string;
  perfProduto: string;
  perfOperacao: string;
  perfParticipante: string;
  perfOrigemDestino: string;
  arredondamento?: string;
  regraFinanceira?: string;
  regraApuracao?: string;
  tributoMajoracao?: string;
  origemRegra?: string;
  tipoRegra?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  operadorMinimo?: string;
  operadorMaximo?: string;
}
