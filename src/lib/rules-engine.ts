/**
 * rules-engine.ts
 * Motor de regras fiscais para configuracao de tributos brasileiros no Protheus.
 * Recebe dados parseados de NF-e e gera sugestoes de configuracao para o ERP.
 */
import type {
  NFeParsed,
  TESConfig,
  FiscalRule,
  FinancialRule,
  StockRule,
  FiscalProfile,
  ProductInfo,
  Suggestion,
  Participante,
  OperationType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Tabela de descricao de CFOPs
// ---------------------------------------------------------------------------
const CFOP_DESC: Record<string, string> = {
  // Entradas - Estadual
  "1101": "Compra p/ industrializacao",
  "1102": "Compra p/ comercializacao",
  "1116": "Compra p/ industrializacao originada de encomenda p/ recebimento futuro",
  "1117": "Compra p/ comercializacao originada de encomenda p/ recebimento futuro",
  "1120": "Compra p/ industrializacao em que a mercadoria foi remetida pelo fornecedor direto",
  "1121": "Compra p/ comercializacao em que a mercadoria foi remetida pelo fornecedor direto",
  "1124": "Industrializacao efetuada por outra empresa",
  "1125": "Industrializacao efetuada por outra empresa quando a mercadoria remetida p/ utilizacao no processo",
  "1126": "Compra p/ utilizacao na prestacao de servico",
  "1128": "Compra p/ utilizacao na prestacao de servico suj a ICMS",
  "1151": "Transferencia p/ industrializacao",
  "1152": "Transferencia p/ comercializacao",
  "1201": "Devolucao de venda de producao do estabelecimento",
  "1202": "Devolucao de venda de mercadoria adquirida ou recebida de terceiros",
  "1251": "Compra de energia eletrica p/ distribuicao",
  "1301": "Compra p/ industrializacao em operacao com mercadoria sujeita a ST",
  "1302": "Compra p/ comercializacao em operacao com mercadoria sujeita a ST",
  "1401": "Compra p/ industrializacao em operacao com mercadoria sujeita a ST",
  "1403": "Compra p/ comercializacao em operacao com mercadoria sujeita a ST",
  "1501": "Entrada de mercadoria recebida com fim especifico de exportacao",
  "1551": "Compra de bem p/ ativo imobilizado",
  "1556": "Compra de material p/ uso ou consumo",
  "1901": "Entrada p/ industrializacao por encomenda",
  "1902": "Retorno de mercadoria remetida p/ industrializacao por encomenda",
  "1903": "Retorno de mercadoria remetida p/ venda fora do estabelecimento",
  "1904": "Retorno de remessa p/ venda fora do estabelecimento",
  "1905": "Entrada de mercadoria recebida p/ deposito em deposito fechado",
  "1906": "Retorno de mercadoria remetida p/ deposito fechado",
  "1907": "Retorno simbolico de mercadoria remetida p/ deposito fechado",
  "1908": "Entrada de bem por conta de contrato de comodato",
  "1909": "Retorno de bem remetido por conta de contrato de comodato",
  "1910": "Entrada de bonificacao, doacao ou brinde",
  "1911": "Entrada de amostra gratis",
  "1912": "Entrada de mercadoria ou bem recebido p/ demonstracao",
  "1913": "Retorno de mercadoria ou bem remetido p/ demonstracao",
  "1914": "Retorno de mercadoria ou bem remetido p/ exposicao ou feira",
  "1915": "Entrada de mercadoria ou bem recebido p/ conserto ou reparo",
  "1916": "Retorno de mercadoria ou bem remetido p/ conserto ou reparo",
  "1917": "Entrada de mercadoria recebida em consignacao mercantil ou industrial",
  "1918": "Devolucao de mercadoria remetida em consignacao mercantil ou industrial",
  "1919": "Devolucao simbolica de mercadoria vendida ou utilizada em processo industrial em consignacao",
  "1920": "Entrada de vasilhame ou sacaria",
  "1921": "Retorno de vasilhame ou sacaria",
  "1922": "Lancamento efetuado a titulo de simples faturamento por conta de compra futura",
  "1923": "Entrada de mercadoria recebida do vendedor remetente em venda a ordem",
  "1924": "Entrada p/ industrializacao por conta e ordem do adquirente da mercadoria",
  "1925": "Retorno de mercadoria remetida p/ industrializacao por conta e ordem do adquirente",
  "1926": "Lancamento efetuado a titulo de reclassificacao de mercadoria decorrente de formacao de kit ou produto intermediario",
  "1949": "Outra entrada de mercadoria ou prestacao de servico nao especificada",
  // Entradas - Interestadual
  "2101": "Compra p/ industrializacao",
  "2102": "Compra p/ comercializacao",
  "2151": "Transferencia p/ industrializacao",
  "2152": "Transferencia p/ comercializacao",
  "2201": "Devolucao de venda de producao do estabelecimento",
  "2202": "Devolucao de venda de mercadoria adquirida ou recebida de terceiros",
  "2301": "Compra p/ industrializacao em operacao com mercadoria sujeita a ST",
  "2401": "Compra p/ industrializacao em operacao com mercadoria sujeita a ST",
  "2403": "Compra p/ comercializacao em operacao com mercadoria sujeita a ST",
  "2551": "Compra de bem p/ ativo imobilizado",
  "2556": "Compra de material p/ uso ou consumo",
  "2901": "Entrada p/ industrializacao por encomenda",
  "2902": "Retorno de mercadoria remetida p/ industrializacao por encomenda",
  "2949": "Outra entrada de mercadoria ou prestacao de servico nao especificada",
  // Entradas - Exterior
  "3101": "Compra p/ industrializacao - importacao",
  "3102": "Compra p/ comercializacao - importacao",
  "3127": "Compra p/ industrializacao sob regime drawback",
  "3201": "Devolucao de venda de producao - exportacao",
  "3211": "Devolucao de venda de mercadoria adquirida - exportacao",
  "3949": "Outra entrada - exterior",
  // Saidas - Estadual
  "5101": "Venda de producao do estabelecimento",
  "5102": "Venda de mercadoria adquirida ou recebida de terceiros",
  "5103": "Venda de producao do estabelecimento efetuada fora do estabelecimento",
  "5104": "Venda de mercadoria adquirida ou recebida de terceiros efetuada fora do estabelecimento",
  "5116": "Venda de producao do estabelecimento originada de encomenda p/ entrega futura",
  "5117": "Venda de mercadoria adquirida ou recebida de terceiros originada de encomenda p/ entrega futura",
  "5118": "Venda de producao do estabelecimento entregue ao destinatario por conta e ordem do adquirente originario em venda a ordem",
  "5119": "Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatario por conta e ordem do adquirente originario em venda a ordem",
  "5120": "Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatario pelo vendedor remetente em venda a ordem",
  "5122": "Venda de producao do estabelecimento remetida p/ industrializacao por conta e ordem do adquirente sem transitar pelo estabelecimento do adquirente",
  "5124": "Industrializacao efetuada p/ outra empresa",
  "5125": "Industrializacao efetuada p/ outra empresa quando a mercadoria remetida p/ utilizacao no processo",
  "5151": "Transferencia de producao do estabelecimento",
  "5152": "Transferencia de mercadoria adquirida ou recebida de terceiros",
  "5201": "Devolucao de compra p/ industrializacao",
  "5202": "Devolucao de compra p/ comercializacao",
  "5210": "Devolucao de compra p/ utilizacao na prestacao de servico",
  "5251": "Venda de energia eletrica p/ distribuicao",
  "5301": "Venda de producao com mercadoria sujeita a ST",
  "5401": "Venda de producao com mercadoria sujeita a ST dentro do estado",
  "5403": "Venda de mercadoria adquirida sujeita a ST dentro do estado",
  "5405": "Venda de mercadoria adquirida sujeita a ST - operacao interna destinada a consumidor final",
  "5411": "Devolucao de compra p/ industrializacao em operacao com mercadoria sujeita a ST",
  "5412": "Devolucao de compra p/ comercializacao em operacao com mercadoria sujeita a ST",
  "5413": "Devolucao de mercadoria destinada ao uso ou consumo em operacao com mercadoria sujeita a ST",
  "5414": "Devolucao de compra p/ ativo imobilizado em operacao com mercadoria sujeita a ST",
  "5501": "Remessa de producao com fim especifico de exportacao",
  "5502": "Remessa de mercadoria adquirida com fim especifico de exportacao",
  "5551": "Venda de bem do ativo imobilizado",
  "5556": "Devolucao de compra de material de uso ou consumo",
  "5901": "Remessa p/ industrializacao por encomenda",
  "5902": "Retorno de mercadoria utilizada na industrializacao por encomenda",
  "5903": "Retorno de mercadoria recebida p/ industrializacao e nao aplicada no processo",
  "5904": "Remessa p/ venda fora do estabelecimento",
  "5905": "Remessa p/ deposito fechado ou armazem geral",
  "5906": "Retorno de mercadoria depositada em deposito fechado ou armazem geral",
  "5907": "Retorno simbolico de mercadoria depositada em deposito fechado ou armazem geral",
  "5908": "Remessa de bem por conta de contrato de comodato",
  "5909": "Retorno de bem recebido por conta de contrato de comodato",
  "5910": "Remessa em bonificacao, doacao ou brinde",
  "5911": "Remessa de amostra gratis",
  "5912": "Remessa de mercadoria ou bem p/ demonstracao",
  "5913": "Retorno de mercadoria ou bem recebido p/ demonstracao",
  "5914": "Remessa de mercadoria ou bem p/ exposicao ou feira",
  "5915": "Remessa de mercadoria ou bem p/ conserto ou reparo",
  "5916": "Retorno de mercadoria ou bem recebido p/ conserto ou reparo",
  "5917": "Remessa de mercadoria em consignacao mercantil ou industrial",
  "5918": "Devolucao de mercadoria recebida em consignacao mercantil ou industrial",
  "5919": "Devolucao simbolica de mercadoria vendida ou utilizada em consignacao",
  "5920": "Remessa de vasilhame ou sacaria",
  "5921": "Devolucao de vasilhame ou sacaria",
  "5922": "Lancamento efetuado a titulo de simples faturamento por conta de venda futura",
  "5923": "Remessa de mercadoria por conta e ordem do adquirente originario em venda a ordem",
  "5924": "Remessa p/ industrializacao por conta e ordem do adquirente da mercadoria",
  "5925": "Retorno de mercadoria recebida p/ industrializacao por conta e ordem do adquirente",
  "5926": "Lancamento efetuado a titulo de reclassificacao de mercadoria decorrente de formacao de kit ou produto intermediario",
  "5927": "Lancamento efetuado a titulo de baixa de estoque em razao de perda, roubo ou deterioracao",
  "5929": "Lancamento efetuado em decorrencia de emissao de documento fiscal relativo a operacao ou prestacao tambem registrada em equipamento ECF",
  "5949": "Outra saida de mercadoria ou prestacao de servico nao especificada",
  // Saidas - Interestadual
  "6101": "Venda de producao do estabelecimento",
  "6102": "Venda de mercadoria adquirida ou recebida de terceiros",
  "6103": "Venda de producao do estabelecimento efetuada fora do estabelecimento",
  "6104": "Venda de mercadoria adquirida efetuada fora do estabelecimento",
  "6108": "Venda de producao do estabelecimento destinada a nao contribuinte",
  "6109": "Venda de mercadoria adquirida destinada a nao contribuinte",
  "6116": "Venda de producao do estabelecimento originada de encomenda p/ entrega futura",
  "6117": "Venda de mercadoria adquirida originada de encomenda p/ entrega futura",
  "6118": "Venda de producao entregue ao destinatario por conta e ordem do adquirente originario em venda a ordem",
  "6119": "Venda de mercadoria adquirida entregue ao destinatario por conta e ordem do adquirente originario em venda a ordem",
  "6120": "Venda de mercadoria adquirida entregue ao destinatario pelo vendedor remetente em venda a ordem",
  "6122": "Venda de producao remetida p/ industrializacao por conta e ordem do adquirente",
  "6124": "Industrializacao efetuada p/ outra empresa",
  "6151": "Transferencia de producao do estabelecimento",
  "6152": "Transferencia de mercadoria adquirida",
  "6201": "Devolucao de compra p/ industrializacao",
  "6202": "Devolucao de compra p/ comercializacao",
  "6301": "Venda de producao com mercadoria sujeita a ST",
  "6401": "Venda de producao sujeita a ST p/ fora do estado",
  "6403": "Venda de mercadoria adquirida sujeita a ST p/ fora do estado",
  "6501": "Remessa de producao com fim especifico de exportacao",
  "6551": "Venda de bem do ativo imobilizado",
  "6901": "Remessa p/ industrializacao por encomenda",
  "6902": "Retorno de mercadoria utilizada na industrializacao por encomenda",
  "6903": "Retorno de mercadoria recebida p/ industrializacao e nao aplicada",
  "6909": "Retorno de bem recebido por conta de contrato de comodato",
  "6910": "Remessa em bonificacao, doacao ou brinde",
  "6911": "Remessa de amostra gratis",
  "6912": "Remessa de mercadoria ou bem p/ demonstracao",
  "6913": "Retorno de mercadoria ou bem recebido p/ demonstracao",
  "6914": "Remessa de mercadoria ou bem p/ exposicao ou feira",
  "6915": "Remessa de mercadoria ou bem p/ conserto ou reparo",
  "6916": "Retorno de mercadoria ou bem recebido p/ conserto ou reparo",
  "6917": "Remessa de mercadoria em consignacao mercantil ou industrial",
  "6918": "Devolucao de mercadoria recebida em consignacao mercantil ou industrial",
  "6920": "Remessa de vasilhame ou sacaria",
  "6921": "Devolucao de vasilhame ou sacaria",
  "6922": "Lancamento a titulo de simples faturamento por conta de venda futura",
  "6923": "Remessa de mercadoria por conta e ordem do adquirente originario em venda a ordem",
  "6924": "Remessa p/ industrializacao por conta e ordem do adquirente da mercadoria",
  "6925": "Retorno de mercadoria recebida p/ industrializacao por conta e ordem do adquirente",
  "6949": "Outra saida de mercadoria ou prestacao de servico nao especificada",
  // Saidas - Exterior
  "7101": "Venda de producao do estabelecimento - exportacao",
  "7102": "Venda de mercadoria adquirida - exportacao",
  "7127": "Venda de producao sob regime drawback - exportacao",
  "7201": "Devolucao de compra p/ industrializacao - exportacao",
  "7211": "Devolucao de compra p/ comercializacao - exportacao",
  "7501": "Exportacao de mercadoria recebida com fim especifico de exportacao",
  "7949": "Outra saida - exterior",
};

// ---------------------------------------------------------------------------
// Tabela de formas de pagamento (tPag)
// ---------------------------------------------------------------------------
const TPAG_DESC: Record<string, string> = {
  "01": "Dinheiro",
  "02": "Cheque",
  "03": "Cartao Credito",
  "04": "Cartao Debito",
  "05": "Credito Loja",
  "10": "Vale Alimentacao",
  "11": "Vale Refeicao",
  "12": "Vale Presente",
  "13": "Vale Combustivel",
  "14": "Duplicata Mercantil",
  "15": "Boleto Bancario",
  "16": "Deposito Bancario",
  "17": "Pagamento Instantaneo (PIX)",
  "18": "Transferencia bancaria, Carteira Digital",
  "19": "Programa de fidelidade, Cashback, Credito Virtual",
  "90": "Sem Pagamento",
  "99": "Outros",
};

// ---------------------------------------------------------------------------
// Classificacao de CFOPs
// ---------------------------------------------------------------------------
const CFOP_INDUSTRIALIZACAO = new Set([
  "1901", "1902", "1924", "1925",
  "2901", "2902",
  "5901", "5902", "5924", "5925",
  "6901", "6902", "6924", "6925",
]);

const CFOP_REMESSA = new Set([
  "5904", "5905", "5906", "5907", "5908", "5909", "5910", "5911",
  "5912", "5913", "5914", "5915", "5916", "5917", "5920", "5921",
  "6910", "6911", "6912", "6913", "6914", "6915", "6916", "6917",
  "6920", "6921",
  "5901", "5924",
  "6901", "6924",
]);

const CFOP_ATUALIZA_ESTOQUE = new Set([
  "1101", "1102", "1116", "1117", "1120", "1121", "1124", "1125",
  "1126", "1128", "1151", "1152", "1201", "1202", "1301", "1302",
  "1401", "1403", "1551", "1556", "1902", "1925",
  "2101", "2102", "2151", "2152", "2201", "2202", "2301", "2401",
  "2403", "2551", "2556", "2902",
  "3101", "3102", "3127",
  "5101", "5102", "5103", "5104", "5116", "5117", "5118", "5119",
  "5120", "5122", "5124", "5125", "5151", "5152", "5201", "5202",
  "5210", "5301", "5401", "5403", "5405", "5501", "5502", "5551",
  "5902", "5903", "5925",
  "6101", "6102", "6103", "6104", "6108", "6109", "6116", "6117",
  "6118", "6119", "6120", "6122", "6124", "6151", "6152", "6201",
  "6202", "6301", "6401", "6403", "6501", "6551",
  "6902", "6903", "6925",
  "7101", "7102", "7127", "7501",
]);

const CFOP_SEM_DUPLICATA = new Set([
  "5910", "5911", "5912", "5914", "5915", "5917", "5920",
  "6910", "6911", "6912", "6914", "6915", "6917", "6920",
  "5901", "5905", "5908", "5924",
  "6901", "6924",
  "1910", "1911", "1912", "1914", "1915", "1917", "1920",
  "1901", "1905", "1908", "1924",
]);

// ---------------------------------------------------------------------------
// Tabela de descricao de origem ICMS
// ---------------------------------------------------------------------------
const _ORIG_DESC: Record<string, string> = {
  "0": "Nacional",
  "1": "Estrangeira - importacao direta",
  "2": "Estrangeira - adquirida no mercado interno",
  "3": "Nacional c/ conteudo importacao 40%-70%",
  "4": "Nacional - produc. conforme processos basicos",
  "5": "Nacional c/ conteudo importacao <= 40%",
  "6": "Estrangeira - importacao direta, sem similar nacional",
  "7": "Estrangeira - adquirida no mercado interno, sem similar nacional",
  "8": "Nacional c/ conteudo importacao > 70%",
};

// ---------------------------------------------------------------------------
// Cores para perfis fiscais
// ---------------------------------------------------------------------------
const PROFILE_COLORS: Record<string, string> = {
  "Importacao": "blue",
  "Exportacao": "emerald",
  "Devolucao": "amber",
  "Remessa Industrializacao": "purple",
  "Bonificacao/Doacao": "pink",
  "Amostra Gratis": "pink",
  "Demonstracao": "indigo",
  "Exposicao/Feira": "indigo",
  "Conserto/Reparo": "slate",
  "Consignacao": "violet",
  "Comodato": "slate",
  "Remessa Diversa": "gray",
  "Substituicao Tributaria": "red",
  "Venda Interestadual": "cyan",
  "Venda Interestadual Agro": "lime",
  "Venda Interna": "green",
  "Compra Interestadual": "orange",
  "Compra Interna": "yellow",
  "Operacao Generica": "gray",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function padCode(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

function safe(val: unknown): string {
  return val != null ? String(val) : "";
}

function safeNum(val: unknown): number {
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

function cfopFirstDigit(cfop: string): string {
  return safe(cfop).charAt(0);
}

function _isCfopEntrada(cfop: string): boolean {
  const c = cfopFirstDigit(cfop);
  return c === "1" || c === "2" || c === "3";
}

function _daysBetween(d1: string, d2: string): number {
  const a = new Date(d1);
  const b = new Date(d2);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function extractUf(nf: NFeParsed, role: "emit" | "dest"): string {
  const entity = nf[role];
  return entity?.endereco?.uf ?? "";
}

interface ItemWithNf {
  nf: NFeParsed;
  item: NFeParsed["itens"][number];
}

function collectItems(nfs: NFeParsed[]): ItemWithNf[] {
  const items: ItemWithNf[] = [];
  for (const nf of nfs) {
    if (!nf?.itens) continue;
    for (const item of nf.itens) {
      items.push({ nf, item });
    }
  }
  return items;
}

function addUnique<T>(arr: T[], value: T): void {
  if (!arr.includes(value)) arr.push(value);
}

// ---------------------------------------------------------------------------
// Public API: Lookup functions
// ---------------------------------------------------------------------------

export function getCfopDescription(cfop: string): string {
  return CFOP_DESC[safe(cfop)] || `CFOP ${safe(cfop)} - descricao nao cadastrada`;
}

export function getTpagDescription(tpag: string): string {
  return TPAG_DESC[safe(tpag)] || `Forma pagamento ${safe(tpag)}`;
}

// ---------------------------------------------------------------------------
// 1. generateTES
// ---------------------------------------------------------------------------
export function generateTES(nfs: NFeParsed[]): TESConfig[] {
  const groups = new Map<string, {
    tpNF: string;
    cfop: string;
    cstIcms: string;
    cstIpi: string;
    cstPis: string;
    cstCofins: string;
    count: number;
  }>();

  for (const { nf, item } of collectItems(nfs)) {
    const tpNF = safe(nf.ide?.tpNF);
    const cfop = safe(item.prod?.cfop);
    const cstIcms = safe(item.icms?.cst);
    const cstIpi = safe(item.ipi?.cst);
    const cstPis = safe(item.pis?.cst);
    const cstCofins = safe(item.cofins?.cst);

    const key = [tpNF, cfop, cstIcms, cstIpi, cstPis, cstCofins].join("|");

    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, { tpNF, cfop, cstIcms, cstIpi, cstPis, cstCofins, count: 1 });
    }
  }

  const sortedKeys = [...groups.keys()].sort();
  return sortedKeys.map((key, idx) => {
    const g = groups.get(key)!;
    return {
      codTes: padCode(idx + 1),
      tipo: (g.tpNF === "0" ? "E" : "S") as "E" | "S",
      cfop: g.cfop,
      descricao: getCfopDescription(g.cfop),
      cstIcms: g.cstIcms,
      cstIpi: g.cstIpi,
      cstPis: g.cstPis,
      cstCofins: g.cstCofins,
      count: g.count,
    };
  });
}

// ---------------------------------------------------------------------------
// 2. generateFiscalRules
// ---------------------------------------------------------------------------
export function generateFiscalRules(nfs: NFeParsed[]): FiscalRule[] {
  const groups = new Map<string, {
    cfop: string;
    ncm: string;
    ufOrig: string;
    ufDest: string;
    aliqICMS: number[];
    aliqIPI: number[];
    aliqPIS: number[];
    aliqCOFINS: number[];
    obs: string[];
    count: number;
  }>();

  for (const { nf, item } of collectItems(nfs)) {
    const cfop = safe(item.prod?.cfop);
    const ncm = safe(item.prod?.ncm);
    const ufOrig = extractUf(nf, "emit");
    const ufDest = extractUf(nf, "dest");

    const key = [cfop, ncm, ufOrig, ufDest].join("|");

    let g = groups.get(key);
    if (!g) {
      g = {
        cfop, ncm, ufOrig, ufDest,
        aliqICMS: [], aliqIPI: [], aliqPIS: [], aliqCOFINS: [],
        obs: [],
        count: 0,
      };
      groups.set(key, g);
    }

    g.count++;

    addUnique(g.aliqICMS, safeNum(item.icms?.pICMS));
    addUnique(g.aliqIPI, safeNum(item.ipi?.pIPI));
    addUnique(g.aliqPIS, safeNum(item.pis?.pAliq));
    addUnique(g.aliqCOFINS, safeNum(item.cofins?.pAliq));

    if (nf.infAdic) {
      const obsText = safe(nf.infAdic);
      if (obsText) addUnique(g.obs, obsText);
    }
  }

  let idx = 0;
  return [...groups.keys()].sort().map((key) => {
    const g = groups.get(key)!;
    idx++;
    return {
      id: `FR-${padCode(idx)}`,
      cfop: g.cfop,
      ncm: g.ncm,
      ufOrig: g.ufOrig,
      ufDest: g.ufDest,
      pICMS: g.aliqICMS.join("/"),
      pIPI: g.aliqIPI.join("/"),
      pPIS: g.aliqPIS.join("/"),
      pCOFINS: g.aliqCOFINS.join("/"),
      obs: g.obs.length > 0 ? g.obs[0].substring(0, 200) : "",
    };
  });
}

// ---------------------------------------------------------------------------
// 3. generateFinancialRules
// ---------------------------------------------------------------------------
export function generateFinancialRules(nfs: NFeParsed[]): FinancialRule[] {
  const groups = new Map<string, {
    indPag: string;
    tPag: string;
    tPagDesc: string;
    numParcelas: number;
    count: number;
  }>();

  for (const nf of nfs) {
    if (!nf) continue;

    const pagamentos = nf.pag ?? [];
    const duplicatas = nf.cobr?.duplicatas ?? [];
    const numDup = duplicatas.length;

    // Calcula intervalo medio entre vencimentos
    let intervaloDias = 0;
    if (numDup >= 2) {
      const datas = duplicatas
        .map((d) => (d.dVenc ? new Date(d.dVenc) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      datas.sort((a, b) => a.getTime() - b.getTime());
      if (datas.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < datas.length; i++) {
          intervals.push(
            Math.round(Math.abs(datas[i].getTime() - datas[i - 1].getTime()) / (1000 * 60 * 60 * 24))
          );
        }
        intervaloDias = intervals.length > 0
          ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
          : 0;
      }
    }

    for (const pag of pagamentos) {
      const indPag = safe(pag.indPag);
      const tPag = safe(pag.tPag);
      const key = [indPag, tPag, numDup, intervaloDias].join("|");

      const _indPagDesc = indPag === "0" ? "A Vista"
        : indPag === "1" ? "A Prazo"
        : indPag === "2" ? "Outros"
        : `Ind. ${indPag}`;

      let g = groups.get(key);
      if (!g) {
        g = {
          indPag,
          tPag,
          tPagDesc: getTpagDescription(tPag),
          numParcelas: numDup,
          count: 0,
        };
        groups.set(key, g);
      }
      g.count++;
    }
  }

  let idx = 0;
  return [...groups.keys()].sort().map((key) => {
    const g = groups.get(key)!;
    idx++;
    const descParts = [g.tPagDesc];
    if (g.numParcelas > 1) descParts.push(`${g.numParcelas}x`);
    return {
      id: `FIN-${padCode(idx)}`,
      descricao: descParts.join(" - "),
      tPag: g.tPag,
      tPagDesc: g.tPagDesc,
      parcelas: g.numParcelas,
      count: g.count,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. generateStockRules
// ---------------------------------------------------------------------------
export function generateStockRules(nfs: NFeParsed[]): StockRule[] {
  const cfops = new Map<string, {
    cfop: string;
    descricao: string;
    temPagamento: boolean;
    count: number;
  }>();

  for (const { nf, item } of collectItems(nfs)) {
    const cfop = safe(item.prod?.cfop);
    if (!cfop) continue;

    let entry = cfops.get(cfop);
    if (!entry) {
      entry = {
        cfop,
        descricao: getCfopDescription(cfop),
        temPagamento: false,
        count: 0,
      };
      cfops.set(cfop, entry);
    }
    entry.count++;

    // Verifica se a NF tem pagamento real (diferente de "sem pagamento")
    if (nf.pag?.some((p) => safe(p.tPag) !== "90")) {
      entry.temPagamento = true;
    }
    if (nf.cobr?.duplicatas && nf.cobr.duplicatas.length > 0) {
      entry.temPagamento = true;
    }
  }

  return [...cfops.keys()].sort().map((key) => {
    const c = cfops.get(key)!;
    return {
      cfop: c.cfop,
      descricao: c.descricao,
      atualizaEstoque: CFOP_ATUALIZA_ESTOQUE.has(c.cfop),
      geraDuplicata: !CFOP_SEM_DUPLICATA.has(c.cfop) && c.temPagamento,
      poderTerceiro: CFOP_INDUSTRIALIZACAO.has(c.cfop),
    };
  });
}

// ---------------------------------------------------------------------------
// 5. generateProfiles
// ---------------------------------------------------------------------------
export function generateProfiles(nfs: NFeParsed[]): FiscalProfile[] {
  const profileMap = new Map<string, {
    name: string;
    description: string;
    cfops: string[];
    icmsRule: string;
    ipiRule: string;
    pisRule: string;
    cofinsRule: string;
  }>();

  for (const { nf, item } of collectItems(nfs)) {
    const cfop = safe(item.prod?.cfop);
    const cstIcms = safe(item.icms?.cst);
    const cstIpi = safe(item.ipi?.cst);
    const cstPis = safe(item.pis?.cst);
    const cstCofins = safe(item.cofins?.cst);
    const ufOrig = extractUf(nf, "emit");
    const ufDest = extractUf(nf, "dest");
    const tpNF = safe(nf.ide?.tpNF);
    const idDest = safe(nf.ide?.idDest);
    const finNFe = safe(nf.ide?.finNFe);
    const cfop1 = cfopFirstDigit(cfop);

    let profileName = "";
    let profileDesc = "";
    let icmsRule = "";
    let ipiRule = "";
    let pisRule = "";
    let cofinsRule = "";

    // Classificacao do perfil fiscal
    if (cfop1 === "3" || cfop1 === "7") {
      if (cfop1 === "3") {
        profileName = "Importacao";
        profileDesc = "Operacao de importacao de mercadoria ou servico do exterior";
        icmsRule = "ICMS sobre base de importacao (inclui II, IPI, PIS, COFINS, despesas aduaneiras)";
        ipiRule = "IPI vinculado a importacao";
      } else {
        profileName = "Exportacao";
        profileDesc = "Operacao de exportacao de mercadoria ou servico para o exterior";
        icmsRule = "Nao incidencia de ICMS na exportacao (imunidade)";
        ipiRule = "Nao incidencia de IPI na exportacao (imunidade)";
      }
      pisRule = `PIS CST ${cstPis}`;
      cofinsRule = `COFINS CST ${cstCofins}`;
    } else if (
      finNFe === "4" ||
      ["5201", "5202", "5210", "5411", "5412", "5413", "5414",
       "6201", "6202", "1201", "1202", "2201", "2202"].includes(cfop)
    ) {
      profileName = "Devolucao";
      profileDesc = "Devolucao de mercadoria - utilizar mesmos dados fiscais da NF original";
      icmsRule = `ICMS CST ${cstIcms} - espelhar NF original`;
      ipiRule = `IPI CST ${cstIpi} - espelhar NF original`;
      pisRule = `PIS CST ${cstPis} - espelhar NF original`;
      cofinsRule = `COFINS CST ${cstCofins} - espelhar NF original`;
    } else if (CFOP_INDUSTRIALIZACAO.has(cfop)) {
      profileName = "Remessa Industrializacao";
      profileDesc = "Operacao de remessa/retorno para industrializacao por encomenda ou conta e ordem";
      icmsRule = `ICMS suspenso na remessa (CST ${cstIcms})`;
      ipiRule = `IPI suspenso na remessa (CST ${cstIpi})`;
      pisRule = `PIS CST ${cstPis}`;
      cofinsRule = `COFINS CST ${cstCofins}`;
    } else if (CFOP_REMESSA.has(cfop) && !CFOP_INDUSTRIALIZACAO.has(cfop)) {
      // Remessas diversas - subclassificacao
      if (cfop === "5910" || cfop === "6910") {
        profileName = "Bonificacao/Doacao";
        profileDesc = "Remessa em bonificacao, doacao ou brinde";
      } else if (cfop === "5911" || cfop === "6911") {
        profileName = "Amostra Gratis";
        profileDesc = "Remessa de amostra gratis";
      } else if (["5912", "5913", "6912", "6913"].includes(cfop)) {
        profileName = "Demonstracao";
        profileDesc = "Remessa/retorno de mercadoria para demonstracao";
      } else if (cfop === "5914" || cfop === "6914") {
        profileName = "Exposicao/Feira";
        profileDesc = "Remessa de mercadoria para exposicao ou feira";
      } else if (["5915", "5916", "6915", "6916"].includes(cfop)) {
        profileName = "Conserto/Reparo";
        profileDesc = "Remessa/retorno de mercadoria para conserto ou reparo";
      } else if (["5917", "5918", "5919", "6917", "6918"].includes(cfop)) {
        profileName = "Consignacao";
        profileDesc = "Operacao de consignacao mercantil ou industrial";
      } else if (cfop === "5908" || cfop === "5909") {
        profileName = "Comodato";
        profileDesc = "Remessa/retorno por conta de contrato de comodato";
      } else {
        profileName = "Remessa Diversa";
        profileDesc = `Remessa diversa de mercadoria - CFOP ${cfop}`;
      }
      const suspTag = cstIcms === "41" || cstIcms === "50" ? " (nao tributado/suspensao)" : "";
      icmsRule = `ICMS CST ${cstIcms}${suspTag}`;
      ipiRule = `IPI CST ${cstIpi}`;
      pisRule = `PIS CST ${cstPis}`;
      cofinsRule = `COFINS CST ${cstCofins}`;
    } else if (
      ["5401", "5403", "5405", "6401", "6403",
       "1301", "1302", "1401", "1403", "2301", "2401", "2403"].includes(cfop)
    ) {
      profileName = "Substituicao Tributaria";
      profileDesc = "Operacao com mercadoria sujeita a substituicao tributaria do ICMS";
      icmsRule = `ICMS-ST CST ${cstIcms} - verificar MVA e base de calculo da ST`;
      ipiRule = `IPI CST ${cstIpi}`;
      pisRule = `PIS CST ${cstPis} - verificar monofasico`;
      cofinsRule = `COFINS CST ${cstCofins} - verificar monofasico`;
    } else if (tpNF === "1" || cfop1 === "5" || cfop1 === "6") {
      // Vendas
      const interestadual = idDest === "2" || cfop1 === "6";
      if (interestadual) {
        const pICMS = safeNum(item.icms?.pICMS);
        const isAgro = cstPis === "08" || cstCofins === "08";
        if (isAgro) {
          profileName = "Venda Interestadual Agro";
          profileDesc = "Venda interestadual com beneficio PIS/COFINS (possivel agroind.)";
        } else {
          profileName = "Venda Interestadual";
          profileDesc = `Venda interestadual de mercadoria (${ufOrig} -> ${ufDest})`;
        }
        icmsRule = `ICMS ${pICMS}% interestadual (CST ${cstIcms}) - verificar DIFAL`;
      } else {
        profileName = "Venda Interna";
        profileDesc = `Venda interna de mercadoria dentro do estado (${ufOrig})`;
        icmsRule = `ICMS CST ${cstIcms} aliq. ${safeNum(item.icms?.pICMS)}%`;
      }
      ipiRule = `IPI CST ${cstIpi}`;
      pisRule = `PIS CST ${cstPis} aliq. ${safeNum(item.pis?.pAliq)}%`;
      cofinsRule = `COFINS CST ${cstCofins} aliq. ${safeNum(item.cofins?.pAliq)}%`;
    } else if (tpNF === "0" || cfop1 === "1" || cfop1 === "2") {
      // Compras
      const interestadualCompra = cfop1 === "2";
      if (interestadualCompra) {
        profileName = "Compra Interestadual";
        profileDesc = `Compra interestadual de mercadoria (${ufOrig} -> ${ufDest})`;
      } else {
        profileName = "Compra Interna";
        profileDesc = `Compra interna de mercadoria dentro do estado (${ufOrig})`;
      }
      icmsRule = `ICMS CST ${cstIcms} aliq. ${safeNum(item.icms?.pICMS)}%`;
      ipiRule = `IPI CST ${cstIpi} aliq. ${safeNum(item.ipi?.pIPI)}%`;
      pisRule = `PIS CST ${cstPis} aliq. ${safeNum(item.pis?.pAliq)}%`;
      cofinsRule = `COFINS CST ${cstCofins} aliq. ${safeNum(item.cofins?.pAliq)}%`;
    } else {
      profileName = "Operacao Generica";
      profileDesc = `Operacao nao classificada - CFOP ${cfop}`;
      icmsRule = `ICMS CST ${cstIcms}`;
      ipiRule = `IPI CST ${cstIpi}`;
      pisRule = `PIS CST ${cstPis}`;
      cofinsRule = `COFINS CST ${cstCofins}`;
    }

    let profile = profileMap.get(profileName);
    if (!profile) {
      profile = {
        name: profileName,
        description: profileDesc,
        cfops: [],
        icmsRule,
        ipiRule,
        pisRule,
        cofinsRule,
      };
      profileMap.set(profileName, profile);
    }
    addUnique(profile.cfops, cfop);
  }

  return [...profileMap.keys()].sort().map((key) => {
    const p = profileMap.get(key)!;
    p.cfops.sort();
    return {
      name: p.name,
      description: p.description,
      cfops: p.cfops,
      color: PROFILE_COLORS[p.name] ?? "gray",
      icmsRule: p.icmsRule,
      ipiRule: p.ipiRule,
      pisRule: p.pisRule,
      cofinsRule: p.cofinsRule,
    };
  });
}

// ---------------------------------------------------------------------------
// 6. generateProducts
// ---------------------------------------------------------------------------
export function generateProducts(nfs: NFeParsed[]): ProductInfo[] {
  const prods = new Map<string, ProductInfo>();

  for (const { item } of collectItems(nfs)) {
    const prod = item.prod;
    const cProd = safe(prod?.cProd);
    const xProd = safe(prod?.xProd);
    const ncm = safe(prod?.ncm);
    const uCom = safe(prod?.uCom);
    const orig = safe(item.icms?.orig);

    const key = `${cProd}|${xProd}`;

    let entry = prods.get(key);
    if (!entry) {
      entry = {
        cProd,
        xProd,
        ncm,
        uCom,
        orig,
        count: 0,
        totalValue: 0,
      };
      prods.set(key, entry);
    }
    entry.count++;
    entry.totalValue += safeNum(prod?.vProd);

    // Preenche NCM se estava vazio
    if (!entry.ncm && ncm) entry.ncm = ncm;
  }

  return [...prods.keys()].sort().map((key) => {
    const p = prods.get(key)!;
    p.totalValue = Math.round(p.totalValue * 100) / 100;
    return p;
  });
}

// ---------------------------------------------------------------------------
// 7. generateSuggestions
// ---------------------------------------------------------------------------
export function generateSuggestions(nfs: NFeParsed[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  if (!nfs || nfs.length === 0) return suggestions;

  const all = collectItems(nfs);

  // Rastreamento de dados para verificacoes cruzadas
  let ibscbsFound = false;
  const interestadual7: { nf: string; cfop: string; ncm: string }[] = [];
  const interestadual12: { nf: string; cfop: string; ncm: string }[] = [];
  const devolucoesSemRef: string[] = [];
  const ncmsComCest: { ncm: string; cest: string; cfop: string; nf: string }[] = [];
  const importacoes: { nf: string; cfop: string; ncm: string }[] = [];
  const pisCofinsST08: { nf: string; cfop: string; ncm: string; cstPis: string; cstCofins: string }[] = [];
  const remessasSemRetorno: Record<string, { enviadas: string[]; retornoEsperado: string }> = {};
  const cstInconsistencias: { nf: string; cfop: string; problema: string }[] = [];
  const clientesPagamentos: Record<string, string[]> = {};
  const cfopsUsados: Record<string, number> = {};

  // Mapa de CFOP remessa -> CFOP retorno esperado
  const remessaCfops: Record<string, string> = {
    "5901": "1902", "5902": "1901", "5924": "1925", "5925": "1924",
    "6901": "2902", "6902": "2901", "6924": "2925", "6925": "2924",
    "5905": "1906", "5908": "1909", "5912": "1913", "5915": "1916",
    "6912": "2913", "6915": "2916",
  };

  for (const nf of nfs) {
    if (!nf) continue;

    const finNFe = safe(nf.ide?.finNFe);
    const nNF = safe(nf.ide?.nNF);
    const nfRef = nf.ide?.nfRef;
    const destCnpj = safe(nf.dest?.cnpj);

    // Rastreia padroes de pagamento por cliente
    if (destCnpj && nf.pag) {
      if (!clientesPagamentos[destCnpj]) clientesPagamentos[destCnpj] = [];
      for (const p of nf.pag) {
        const tPag = safe(p.tPag);
        addUnique(clientesPagamentos[destCnpj], tPag);
      }
    }

    let isDevolucao = finNFe === "4";

    for (const it of nf.itens ?? []) {
      const cfop = safe(it.prod?.cfop);
      const ncm = safe(it.prod?.ncm);
      const cest = safe(it.prod?.cest);
      const cstIcms = safe(it.icms?.cst);
      const vBC = safeNum(it.icms?.vBC);
      const pICMS = safeNum(it.icms?.pICMS);
      const cstPis = safe(it.pis?.cst);
      const cstCofins = safe(it.cofins?.cst);
      const cfop1 = cfopFirstDigit(cfop);

      cfopsUsados[cfop] = (cfopsUsados[cfop] || 0) + 1;

      // IBS/CBS (Reforma Tributaria)
      if (it.ibscbs) ibscbsFound = true;

      // Aliquotas interestaduais
      if (cfop1 === "6" || cfop1 === "2") {
        if (pICMS === 7) interestadual7.push({ nf: nNF, cfop, ncm });
        if (pICMS === 12) interestadual12.push({ nf: nNF, cfop, ncm });
      }

      // Importacao
      if (cfop1 === "3") importacoes.push({ nf: nNF, cfop, ncm });

      // NCM com CEST
      if (cest) ncmsComCest.push({ ncm, cest, cfop, nf: nNF });

      // PIS/COFINS CST 08
      if (cstPis === "08" || cstCofins === "08") {
        pisCofinsST08.push({ nf: nNF, cfop, ncm, cstPis, cstCofins });
      }

      // CST 00 sem base de calculo
      if (cstIcms === "00" && vBC === 0) {
        cstInconsistencias.push({
          nf: nNF, cfop,
          problema: "CST ICMS 00 (tributado integralmente) mas base de calculo = 0",
        });
      }

      // CST 40/41 com base de calculo
      if ((cstIcms === "40" || cstIcms === "41") && vBC > 0) {
        cstInconsistencias.push({
          nf: nNF, cfop,
          problema: `CST ICMS ${cstIcms} (isento/nao tributado) mas possui base de calculo R$ ${vBC.toFixed(2)}`,
        });
      }

      // Rastreia remessas
      if (remessaCfops[cfop]) {
        if (!remessasSemRetorno[cfop]) {
          remessasSemRetorno[cfop] = { enviadas: [], retornoEsperado: remessaCfops[cfop] };
        }
        remessasSemRetorno[cfop].enviadas.push(nNF);
      }

      // Devolucao por CFOP
      if (["5201", "5202", "6201", "6202", "1201", "1202", "2201", "2202"].includes(cfop)) {
        isDevolucao = true;
      }
    }

    // Devolucao sem NF referenciada
    if (isDevolucao && !nfRef) {
      devolucoesSemRef.push(nNF);
    }
  }

  // --- Monta sugestoes ---

  if (ibscbsFound) {
    suggestions.push({
      type: "info",
      title: "Novo IBS/CBS detectado",
      description: "Foram encontrados dados de IBS/CBS (Reforma Tributaria) nas NF-e analisadas. Verifique se o Protheus esta preparado para a nova tributacao.",
      details: "O IBS (Imposto sobre Bens e Servicos) e a CBS (Contribuicao sobre Bens e Servicos) substituirao gradualmente PIS, COFINS, ICMS, ISS e IPI.",
    });
  }

  if (interestadual7.length > 0) {
    suggestions.push({
      type: "warning",
      title: "Operacao interestadual com aliquota 7%",
      description: `Detectadas ${interestadual7.length} operacao(oes) interestadual(is) com ICMS 7%. Verificar obrigacao de DIFAL quando destinatario nao contribuinte.`,
      details: interestadual7.map((o) => `NF ${o.nf} - CFOP ${o.cfop} - NCM ${o.ncm}`).join("\n"),
    });
  }

  if (interestadual12.length > 0) {
    suggestions.push({
      type: "warning",
      title: "Operacao interestadual com aliquota 12%",
      description: `Detectadas ${interestadual12.length} operacao(oes) interestadual(is) com ICMS 12%. Verificar obrigacao de DIFAL quando destinatario nao contribuinte.`,
      details: interestadual12.map((o) => `NF ${o.nf} - CFOP ${o.cfop} - NCM ${o.ncm}`).join("\n"),
    });
  }

  if (devolucoesSemRef.length > 0) {
    suggestions.push({
      type: "error",
      title: "Devolucao sem NF referenciada",
      description: `Encontrada(s) ${devolucoesSemRef.length} NF(s) de devolucao sem referencia a NF original. Isso pode causar problemas na escrituracao.`,
      details: `NFs: ${devolucoesSemRef.join(", ")}`,
    });
  }

  if (ncmsComCest.length > 0) {
    const ncmSet = new Set<string>();
    ncmsComCest.forEach((o) => ncmSet.add(o.ncm));
    suggestions.push({
      type: "warning",
      title: "NCM pode ter substituicao tributaria",
      description: `${ncmSet.size} NCM(s) possuem CEST informado, indicando possivel sujeicao a substituicao tributaria do ICMS.`,
      details: ncmsComCest.map((o) => `NCM ${o.ncm} / CEST ${o.cest} - NF ${o.nf}`).join("\n"),
    });
  }

  if (importacoes.length > 0) {
    suggestions.push({
      type: "info",
      title: "Importacao detectada - configurar II",
      description: `Encontrada(s) ${importacoes.length} operacao(oes) de importacao. Verificar configuracao de II (Imposto de Importacao), taxas aduaneiras e AFRMM no Protheus.`,
      details: importacoes.map((o) => `NF ${o.nf} - CFOP ${o.cfop} - NCM ${o.ncm}`).join("\n"),
    });
  }

  if (pisCofinsST08.length > 0) {
    suggestions.push({
      type: "info",
      title: "PIS/COFINS com CST 08 - possivel beneficio agro",
      description: `Encontrados ${pisCofinsST08.length} item(ns) com PIS/COFINS CST 08 (operacao sem incidencia). Pode indicar produto agroindustrial com beneficio fiscal.`,
      details: pisCofinsST08.map((o) => `NF ${o.nf} - CFOP ${o.cfop} - NCM ${o.ncm} (PIS: ${o.cstPis}, COFINS: ${o.cstCofins})`).join("\n"),
    });
  }

  if (cstInconsistencias.length > 0) {
    suggestions.push({
      type: "error",
      title: "Inconsistencias em CST de ICMS",
      description: `Encontrada(s) ${cstInconsistencias.length} inconsistencia(s) entre CST do ICMS e base de calculo. Verificar se os dados da NF estao corretos.`,
      details: cstInconsistencias.map((o) => `NF ${o.nf} - CFOP ${o.cfop}: ${o.problema}`).join("\n"),
    });
  }

  // Multiplas condicoes de pagamento por cliente
  const clientesMultiplo = Object.entries(clientesPagamentos)
    .filter(([, formas]) => formas.length > 1)
    .map(([cnpj, formas]) => ({
      cnpj,
      formas: formas.map((t) => getTpagDescription(t)).join(", "),
    }));

  if (clientesMultiplo.length > 0) {
    suggestions.push({
      type: "info",
      title: "Multiplas condicoes de pagamento para mesmo cliente",
      description: `${clientesMultiplo.length} cliente(s) possuem mais de uma forma de pagamento nas NFs analisadas. Verificar se ha necessidade de padronizar.`,
      details: clientesMultiplo.map((c) => `CNPJ ${c.cnpj}: ${c.formas}`).join("\n"),
    });
  }

  // Remessas sem retorno identificado
  const cfopRetornoPresente = new Set(all.map(({ item }) => safe(item.prod?.cfop)));
  for (const [cfop, info] of Object.entries(remessasSemRetorno)) {
    if (!cfopRetornoPresente.has(info.retornoEsperado)) {
      suggestions.push({
        type: "warning",
        title: "Remessa sem retorno identificado",
        description: `CFOP ${cfop} (${getCfopDescription(cfop)}) possui ${info.enviadas.length} NF(s) sem CFOP de retorno (${info.retornoEsperado}) correspondente nos XMLs analisados.`,
        details: `NFs de remessa: ${info.enviadas.join(", ")}\nRetorno esperado: CFOP ${info.retornoEsperado} (${getCfopDescription(info.retornoEsperado)})`,
      });
    }
  }

  // Resumo final
  const totalItens = all.length;
  const totalNfs = nfs.length;
  const totalCfops = Object.keys(cfopsUsados).length;
  suggestions.push({
    type: "success",
    title: "Resumo da analise",
    description: `Analisadas ${totalNfs} NF(s) com ${totalItens} item(ns) e ${totalCfops} CFOP(s) distintos.`,
    details: Object.keys(cfopsUsados)
      .sort()
      .map((c) => `CFOP ${c}: ${cfopsUsados[c]} ocorrencia(s) - ${getCfopDescription(c)}`)
      .join("\n"),
  });

  return suggestions;
}

// ---------------------------------------------------------------------------
// 8. generateParticipantes
// ---------------------------------------------------------------------------
export function generateParticipantes(nfs: NFeParsed[]): Participante[] {
  const map = new Map<string, {
    cnpj: string;
    xNome: string;
    uf: string;
    ie: string;
    countEmit: number;
    countDest: number;
  }>();

  for (const nf of nfs) {
    if (!nf) continue;

    // Emitente
    const emitCnpj = safe(nf.emit?.cnpj);
    if (emitCnpj) {
      let entry = map.get(emitCnpj);
      if (!entry) {
        entry = {
          cnpj: emitCnpj,
          xNome: safe(nf.emit?.xNome),
          uf: nf.emit?.endereco?.uf ?? "",
          ie: safe(nf.emit?.ie),
          countEmit: 0,
          countDest: 0,
        };
        map.set(emitCnpj, entry);
      }
      entry.countEmit++;
    }

    // Destinatario
    const destCnpj = safe(nf.dest?.cnpj);
    if (destCnpj) {
      let entry = map.get(destCnpj);
      if (!entry) {
        entry = {
          cnpj: destCnpj,
          xNome: safe(nf.dest?.xNome),
          uf: nf.dest?.endereco?.uf ?? "",
          ie: safe(nf.dest?.ie),
          countEmit: 0,
          countDest: 0,
        };
        map.set(destCnpj, entry);
      }
      entry.countDest++;
    }
  }

  return [...map.values()]
    .sort((a, b) => a.xNome.localeCompare(b.xNome))
    .map((entry) => {
      let tipo: "cliente" | "fornecedor" | "ambos";
      if (entry.countEmit > 0 && entry.countDest > 0) {
        tipo = "ambos";
      } else if (entry.countEmit > 0) {
        tipo = "fornecedor";
      } else {
        tipo = "cliente";
      }
      return {
        cnpj: entry.cnpj,
        xNome: entry.xNome,
        uf: entry.uf,
        ie: entry.ie,
        count: entry.countEmit + entry.countDest,
        tipo,
      };
    });
}

// ---------------------------------------------------------------------------
// 9. generateOperations
// ---------------------------------------------------------------------------

const OPERATION_COLORS: Record<string, string> = {
  "Compra p/ Industrializacao": "blue",
  "Compra p/ Comercializacao": "cyan",
  "Compra p/ Uso/Consumo": "teal",
  "Compra p/ Ativo Imobilizado": "indigo",
  "Venda de Producao": "green",
  "Venda de Mercadoria": "emerald",
  "Transferencia": "purple",
  "Devolucao": "amber",
  "Remessa/Retorno": "slate",
  "Substituicao Tributaria": "red",
  "Importacao": "violet",
  "Exportacao": "lime",
  "Outras Operacoes": "gray",
};

const OPERATION_ICONS: Record<string, string> = {
  "Compra p/ Industrializacao": "Factory",
  "Compra p/ Comercializacao": "ShoppingCart",
  "Compra p/ Uso/Consumo": "Package",
  "Compra p/ Ativo Imobilizado": "Building",
  "Venda de Producao": "TrendingUp",
  "Venda de Mercadoria": "Store",
  "Transferencia": "ArrowRightLeft",
  "Devolucao": "RotateCcw",
  "Remessa/Retorno": "Truck",
  "Substituicao Tributaria": "Shield",
  "Importacao": "Globe",
  "Exportacao": "Plane",
  "Outras Operacoes": "HelpCircle",
};

function classifyOperation(cfop: string): string {
  const c = cfop;
  // Compras para industrializacao
  if (["1101", "1116", "1120", "1124", "1125", "2101", "3101", "3127"].includes(c)) {
    return "Compra p/ Industrializacao";
  }
  // Compras para comercializacao
  if (["1102", "1117", "1121", "2102", "3102"].includes(c)) {
    return "Compra p/ Comercializacao";
  }
  // Uso/Consumo
  if (["1556", "2556", "1126", "1128"].includes(c)) {
    return "Compra p/ Uso/Consumo";
  }
  // Ativo Imobilizado
  if (["1551", "2551"].includes(c)) {
    return "Compra p/ Ativo Imobilizado";
  }
  // Venda de producao
  if (["5101", "5103", "5116", "5118", "5122", "5301", "5401",
       "6101", "6103", "6116", "6118", "6122", "6301", "6401",
       "7101", "7127"].includes(c)) {
    return "Venda de Producao";
  }
  // Venda de mercadoria
  if (["5102", "5104", "5117", "5119", "5120", "5403", "5405",
       "6102", "6104", "6108", "6109", "6117", "6119", "6120", "6403",
       "7102"].includes(c)) {
    return "Venda de Mercadoria";
  }
  // Transferencia
  if (["1151", "1152", "2151", "2152", "5151", "5152", "6151", "6152"].includes(c)) {
    return "Transferencia";
  }
  // Devolucao
  if (["1201", "1202", "2201", "2202", "3201", "3211",
       "5201", "5202", "5210", "5411", "5412", "5413", "5414",
       "6201", "6202", "7201", "7211"].includes(c)) {
    return "Devolucao";
  }
  // ST
  if (["1301", "1302", "1401", "1403", "2301", "2401", "2403"].includes(c)) {
    return "Substituicao Tributaria";
  }
  // Importacao
  if (cfopFirstDigit(c) === "3") {
    return "Importacao";
  }
  // Exportacao
  if (cfopFirstDigit(c) === "7") {
    return "Exportacao";
  }
  // Remessa/Retorno
  if (CFOP_REMESSA.has(c) || CFOP_INDUSTRIALIZACAO.has(c)) {
    return "Remessa/Retorno";
  }
  return "Outras Operacoes";
}

export function generateOperations(nfs: NFeParsed[]): OperationType[] {
  const groups = new Map<string, { count: number; totalValue: number }>();

  for (const { item } of collectItems(nfs)) {
    const cfop = safe(item.prod?.cfop);
    if (!cfop) continue;

    const opName = classifyOperation(cfop);
    let g = groups.get(opName);
    if (!g) {
      g = { count: 0, totalValue: 0 };
      groups.set(opName, g);
    }
    g.count++;
    g.totalValue += safeNum(item.prod?.vProd);
  }

  return [...groups.entries()]
    .sort(([, a], [, b]) => b.totalValue - a.totalValue)
    .map(([name, g]) => ({
      name,
      count: g.count,
      totalValue: Math.round(g.totalValue * 100) / 100,
      color: OPERATION_COLORS[name] ?? "gray",
      icon: OPERATION_ICONS[name] ?? "HelpCircle",
    }));
}
