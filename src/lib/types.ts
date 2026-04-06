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

export interface StockRule {
  cfop: string;
  atualizaEstoque: boolean;
  geraDuplicata: boolean;
  poderTerceiro: boolean;
  descricao: string;
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
