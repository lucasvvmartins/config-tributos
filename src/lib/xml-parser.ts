/**
 * xml-parser.ts
 * Parser de XML de NF-e (versao 4.00) para extracao de dados fiscais.
 * Trata namespace "http://www.portalfiscal.inf.br/nfe" e fallback sem namespace.
 */

import type {
  NFeParsed,
  ItemNFe,
  Identificacao,
  Emitente,
  Destinatario,
  Endereco,
  Produto,
  ImpostoICMS,
  ImpostoIPI,
  ImpostoPISCOFINS,
  ImpostoII,
  ImpostoIBSCBS,
  TotalNFe,
  Transporte,
  Cobranca,
  Duplicata,
  Pagamento,
} from "@/lib/types";

const NS = "http://www.portalfiscal.inf.br/nfe";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getElements(parent: Element | Document, tagName: string): HTMLCollectionOf<Element> {
  let els = parent.getElementsByTagNameNS(NS, tagName);
  if (els.length === 0) {
    els = parent.getElementsByTagName(tagName);
  }
  return els;
}

function getElement(parent: Element | Document, tagName: string): Element | null {
  const els = getElements(parent, tagName);
  return els.length > 0 ? els[0] : null;
}

function getText(parent: Element | Document, tagName: string): string | null {
  const el = getElement(parent, tagName);
  if (!el) return null;
  return el.textContent?.trim() || null;
}

function getNum(parent: Element | Document, tagName: string): number | null {
  const txt = getText(parent, tagName);
  if (txt === null) return null;
  const n = parseFloat(txt);
  return isNaN(n) ? null : n;
}

function sanitizeXml(xmlString: string): string {
  if (!xmlString) return "";
  let s = xmlString.replace(/^\uFEFF/, "");
  s = s.replace(/^[\s\r\n]+(<)/, "$1");
  return s;
}

// ---------------------------------------------------------------------------
// Helpers with defaults (coerce null -> type-safe values for typed interfaces)
// ---------------------------------------------------------------------------

const str = (v: string | null): string => v ?? "";
const num = (v: number | null): number => v ?? 0;

// ---------------------------------------------------------------------------
// Parsers de blocos
// ---------------------------------------------------------------------------

function parseIde(infNFe: Element): Identificacao {
  const ide = getElement(infNFe, "ide");
  if (!ide) {
    return {
      cUF: "", natOp: "", mod: "", serie: "", nNF: "",
      dhEmi: "", dhSaiEnt: "", tpNF: "", idDest: "",
      finNFe: "", indFinal: "", nfRef: "",
    };
  }

  let nfRef: string = "";
  const nfRefEl = getElement(ide, "NFref");
  if (nfRefEl) {
    nfRef = getText(nfRefEl, "refNFe") ?? "";
  }

  return {
    cUF: str(getText(ide, "cUF")),
    natOp: str(getText(ide, "natOp")),
    mod: str(getText(ide, "mod")),
    serie: str(getText(ide, "serie")),
    nNF: str(getText(ide, "nNF")),
    dhEmi: str(getText(ide, "dhEmi")),
    dhSaiEnt: str(getText(ide, "dhSaiEnt")),
    tpNF: str(getText(ide, "tpNF")),
    idDest: str(getText(ide, "idDest")),
    finNFe: str(getText(ide, "finNFe")),
    indFinal: str(getText(ide, "indFinal")),
    nfRef,
  };
}

function parseEndereco(parentEl: Element, enderecoTag: string): Endereco {
  const end = getElement(parentEl, enderecoTag);
  if (!end) {
    return { logr: "", nro: "", compl: "", bairro: "", codMun: "", mun: "", uf: "", cep: "" };
  }
  return {
    logr: str(getText(end, "xLgr")),
    nro: str(getText(end, "nro")),
    compl: str(getText(end, "xCpl")),
    bairro: str(getText(end, "xBairro")),
    codMun: str(getText(end, "cMun")),
    mun: str(getText(end, "xMun")),
    uf: str(getText(end, "UF")),
    cep: str(getText(end, "CEP")),
  };
}

function parseEmit(infNFe: Element): Emitente {
  const emit = getElement(infNFe, "emit");
  if (!emit) {
    return { cnpj: "", xNome: "", xFant: "", endereco: parseEndereco(infNFe, "__none__"), ie: "", crt: "" };
  }
  return {
    cnpj: str(getText(emit, "CNPJ")),
    xNome: str(getText(emit, "xNome")),
    xFant: str(getText(emit, "xFant")),
    endereco: parseEndereco(emit, "enderEmit"),
    ie: str(getText(emit, "IE")),
    crt: str(getText(emit, "CRT")),
  };
}

function parseDest(infNFe: Element): Destinatario {
  const dest = getElement(infNFe, "dest");
  if (!dest) {
    return {
      cnpj: "", xNome: "",
      endereco: parseEndereco(infNFe, "__none__"),
      indIEDest: "", ie: "", email: "", isEstrangeiro: false,
    };
  }

  const cnpj = getText(dest, "CNPJ");
  const idEstrangeiro = getText(dest, "idEstrangeiro");

  return {
    cnpj: str(cnpj || idEstrangeiro),
    xNome: str(getText(dest, "xNome")),
    endereco: parseEndereco(dest, "enderDest"),
    indIEDest: str(getText(dest, "indIEDest")),
    ie: str(getText(dest, "IE")),
    email: str(getText(dest, "email")),
    isEstrangeiro: !cnpj && !!idEstrangeiro,
  };
}

// ---------------------------------------------------------------------------
// ICMS - all groups
// ---------------------------------------------------------------------------

const ICMS_GROUPS = [
  "ICMS00", "ICMS02", "ICMS10", "ICMS15", "ICMS20", "ICMS30",
  "ICMS40", "ICMS41", "ICMS50", "ICMS51", "ICMS53", "ICMS60",
  "ICMS61", "ICMS70", "ICMS90", "ICMSPart", "ICMSST",
  "ICMSSN101", "ICMSSN102", "ICMSSN201", "ICMSSN202", "ICMSSN500", "ICMSSN900",
] as const;

const EMPTY_ICMS: ImpostoICMS = {
  orig: "", cst: "", modBC: "", vBC: 0, pICMS: 0, vICMS: 0,
  vBCSTRet: 0, pST: 0, vICMSSTRet: 0,
};

function parseICMS(impostoEl: Element): ImpostoICMS {
  const icmsContainer = getElement(impostoEl, "ICMS");
  if (!icmsContainer) return { ...EMPTY_ICMS };

  let icmsGrp: Element | null = null;
  for (const grp of ICMS_GROUPS) {
    icmsGrp = getElement(icmsContainer, grp);
    if (icmsGrp) break;
  }
  if (!icmsGrp) return { ...EMPTY_ICMS };

  const cst = getText(icmsGrp, "CST") || getText(icmsGrp, "CSOSN");

  return {
    orig: str(getText(icmsGrp, "orig")),
    cst: str(cst),
    modBC: str(getText(icmsGrp, "modBC")),
    vBC: num(getNum(icmsGrp, "vBC")),
    pICMS: num(getNum(icmsGrp, "pICMS")),
    vICMS: num(getNum(icmsGrp, "vICMS")),
    vBCSTRet: num(getNum(icmsGrp, "vBCSTRet")),
    pST: num(getNum(icmsGrp, "pST") ?? getNum(icmsGrp, "pICMSST")),
    vICMSSTRet: num(getNum(icmsGrp, "vICMSSTRet") ?? getNum(icmsGrp, "vICMSST")),
  };
}

// ---------------------------------------------------------------------------
// IPI
// ---------------------------------------------------------------------------

const EMPTY_IPI: ImpostoIPI = { cst: "", vBC: 0, pIPI: 0, vIPI: 0 };

function parseIPI(impostoEl: Element): ImpostoIPI {
  const ipiContainer = getElement(impostoEl, "IPI");
  if (!ipiContainer) return { ...EMPTY_IPI };

  const ipiGrp = getElement(ipiContainer, "IPITrib") || getElement(ipiContainer, "IPINT");
  if (!ipiGrp) return { ...EMPTY_IPI };

  return {
    cst: str(getText(ipiGrp, "CST")),
    vBC: num(getNum(ipiGrp, "vBC")),
    pIPI: num(getNum(ipiGrp, "pIPI")),
    vIPI: num(getNum(ipiGrp, "vIPI")),
  };
}

// ---------------------------------------------------------------------------
// PIS
// ---------------------------------------------------------------------------

const PIS_GROUPS = ["PISAliq", "PISNT", "PISOutr", "PISQtde"] as const;

function parsePIS(impostoEl: Element): ImpostoPISCOFINS {
  const pisContainer = getElement(impostoEl, "PIS");
  if (!pisContainer) return { cst: "", vBC: 0, pAliq: 0, vAliq: 0 };

  let pisGrp: Element | null = null;
  for (const grp of PIS_GROUPS) {
    pisGrp = getElement(pisContainer, grp);
    if (pisGrp) break;
  }
  if (!pisGrp) return { cst: "", vBC: 0, pAliq: 0, vAliq: 0 };

  return {
    cst: str(getText(pisGrp, "CST")),
    vBC: num(getNum(pisGrp, "vBC")),
    pAliq: num(getNum(pisGrp, "pPIS")),
    vAliq: num(getNum(pisGrp, "vPIS")),
  };
}

// ---------------------------------------------------------------------------
// COFINS
// ---------------------------------------------------------------------------

const COFINS_GROUPS = ["COFINSAliq", "COFINSNT", "COFINSOutr", "COFINSQtde"] as const;

function parseCOFINS(impostoEl: Element): ImpostoPISCOFINS {
  const cofinsContainer = getElement(impostoEl, "COFINS");
  if (!cofinsContainer) return { cst: "", vBC: 0, pAliq: 0, vAliq: 0 };

  let cofinsGrp: Element | null = null;
  for (const grp of COFINS_GROUPS) {
    cofinsGrp = getElement(cofinsContainer, grp);
    if (cofinsGrp) break;
  }
  if (!cofinsGrp) return { cst: "", vBC: 0, pAliq: 0, vAliq: 0 };

  return {
    cst: str(getText(cofinsGrp, "CST")),
    vBC: num(getNum(cofinsGrp, "vBC")),
    pAliq: num(getNum(cofinsGrp, "pCOFINS")),
    vAliq: num(getNum(cofinsGrp, "vCOFINS")),
  };
}

// ---------------------------------------------------------------------------
// II (Imposto de Importacao)
// ---------------------------------------------------------------------------

function parseII(impostoEl: Element): ImpostoII | null {
  const iiEl = getElement(impostoEl, "II");
  if (!iiEl) return null;

  return {
    vBC: num(getNum(iiEl, "vBC")),
    vDespAdu: num(getNum(iiEl, "vDespAdu")),
    vII: num(getNum(iiEl, "vII")),
    vIOF: num(getNum(iiEl, "vIOF")),
  };
}

// ---------------------------------------------------------------------------
// IBS/CBS (Reforma Tributaria)
// ---------------------------------------------------------------------------

function parseIBSCBS(impostoEl: Element): ImpostoIBSCBS | null {
  const ibsEl = getElement(impostoEl, "IBSCBS") || getElement(impostoEl, "IBSCBSTrib");
  if (!ibsEl) return null;

  return {
    cst: str(getText(ibsEl, "CST")),
    cClassTrib: str(getText(ibsEl, "cClassTrib")),
    vBC: num(getNum(ibsEl, "vBC")),
    pIBSUF: num(getNum(ibsEl, "pIBSUF")),
    vIBSUF: num(getNum(ibsEl, "vIBSUF")),
    pCBS: num(getNum(ibsEl, "pCBS")),
    vCBS: num(getNum(ibsEl, "vCBS")),
  };
}

// ---------------------------------------------------------------------------
// Itens (det)
// ---------------------------------------------------------------------------

function parseItens(infNFe: Element): ItemNFe[] {
  const dets = getElements(infNFe, "det");
  const itens: ItemNFe[] = [];

  for (let i = 0; i < dets.length; i++) {
    const det = dets[i];
    const nItemAttr = det.getAttribute("nItem");
    const prod = getElement(det, "prod");
    const imposto = getElement(det, "imposto");

    const produto: Produto = {
      cProd: str(prod ? getText(prod, "cProd") : null),
      xProd: str(prod ? getText(prod, "xProd") : null),
      ncm: str(prod ? getText(prod, "NCM") : null),
      cest: str(prod ? getText(prod, "CEST") : null),
      cfop: str(prod ? getText(prod, "CFOP") : null),
      uCom: str(prod ? getText(prod, "uCom") : null),
      qCom: num(prod ? getNum(prod, "qCom") : null),
      vUnCom: num(prod ? getNum(prod, "vUnCom") : null),
      vProd: num(prod ? getNum(prod, "vProd") : null),
      uTrib: str(prod ? getText(prod, "uTrib") : null),
      qTrib: num(prod ? getNum(prod, "qTrib") : null),
    };

    itens.push({
      nItem: nItemAttr ? parseInt(nItemAttr, 10) : i + 1,
      prod: produto,
      icms: imposto ? parseICMS(imposto) : { ...EMPTY_ICMS },
      ipi: imposto ? parseIPI(imposto) : { ...EMPTY_IPI },
      pis: imposto ? parsePIS(imposto) : { cst: "", vBC: 0, pAliq: 0, vAliq: 0 },
      cofins: imposto ? parseCOFINS(imposto) : { cst: "", vBC: 0, pAliq: 0, vAliq: 0 },
      ii: imposto ? parseII(imposto) : null,
      ibscbs: imposto ? parseIBSCBS(imposto) : null,
      infAdProd: str(getText(det, "infAdProd")),
    });
  }

  return itens;
}

// ---------------------------------------------------------------------------
// Totais
// ---------------------------------------------------------------------------

const EMPTY_TOTAL: TotalNFe = {
  vBC: 0, vICMS: 0, vICMSDeson: 0, vBCST: 0, vST: 0,
  vProd: 0, vFrete: 0, vSeg: 0, vDesc: 0, vII: 0,
  vIPI: 0, vPIS: 0, vCOFINS: 0, vOutro: 0, vNF: 0,
};

function parseTotal(infNFe: Element): TotalNFe {
  const total = getElement(infNFe, "total");
  const icmsTot = total ? getElement(total, "ICMSTot") : null;
  if (!icmsTot) return { ...EMPTY_TOTAL };

  return {
    vBC: num(getNum(icmsTot, "vBC")),
    vICMS: num(getNum(icmsTot, "vICMS")),
    vICMSDeson: num(getNum(icmsTot, "vICMSDeson")),
    vBCST: num(getNum(icmsTot, "vBCST")),
    vST: num(getNum(icmsTot, "vST")),
    vProd: num(getNum(icmsTot, "vProd")),
    vFrete: num(getNum(icmsTot, "vFrete")),
    vSeg: num(getNum(icmsTot, "vSeg")),
    vDesc: num(getNum(icmsTot, "vDesc")),
    vII: num(getNum(icmsTot, "vII")),
    vIPI: num(getNum(icmsTot, "vIPI")),
    vPIS: num(getNum(icmsTot, "vPIS")),
    vCOFINS: num(getNum(icmsTot, "vCOFINS")),
    vOutro: num(getNum(icmsTot, "vOutro")),
    vNF: num(getNum(icmsTot, "vNF")),
  };
}

// ---------------------------------------------------------------------------
// Transporte
// ---------------------------------------------------------------------------

function parseTransp(infNFe: Element): Transporte {
  const transp = getElement(infNFe, "transp");
  if (!transp) {
    return { modFrete: "", transporta: null, volumes: null };
  }

  const transporta = getElement(transp, "transporta");
  const vol = getElement(transp, "vol");

  return {
    modFrete: str(getText(transp, "modFrete")),
    transporta: transporta
      ? { cnpj: str(getText(transporta, "CNPJ")), xNome: str(getText(transporta, "xNome")) }
      : null,
    volumes: vol
      ? {
          qVol: str(getText(vol, "qVol")),
          esp: str(getText(vol, "esp")),
          pesoL: str(getText(vol, "pesoL")),
          pesoB: str(getText(vol, "pesoB")),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Cobranca
// ---------------------------------------------------------------------------

function parseCobr(infNFe: Element): Cobranca {
  const cobr = getElement(infNFe, "cobr");
  if (!cobr) {
    return { fat: null, duplicatas: [] };
  }

  const fat = getElement(cobr, "fat");
  const dups = getElements(cobr, "dup");
  const duplicatas: Duplicata[] = [];

  for (let i = 0; i < dups.length; i++) {
    duplicatas.push({
      nDup: str(getText(dups[i], "nDup")),
      dVenc: str(getText(dups[i], "dVenc")),
      vDup: num(getNum(dups[i], "vDup")),
    });
  }

  return {
    fat: fat
      ? {
          nFat: str(getText(fat, "nFat")),
          vOrig: num(getNum(fat, "vOrig")),
          vDesc: num(getNum(fat, "vDesc")),
          vLiq: num(getNum(fat, "vLiq")),
        }
      : null,
    duplicatas,
  };
}

// ---------------------------------------------------------------------------
// Pagamento
// ---------------------------------------------------------------------------

function parsePag(infNFe: Element): Pagamento[] {
  const pagEl = getElement(infNFe, "pag");
  if (!pagEl) return [];

  const detPags = getElements(pagEl, "detPag");
  const pagamentos: Pagamento[] = [];

  for (let i = 0; i < detPags.length; i++) {
    pagamentos.push({
      indPag: str(getText(detPags[i], "indPag")),
      tPag: str(getText(detPags[i], "tPag")),
      vPag: num(getNum(detPags[i], "vPag")),
    });
  }

  return pagamentos;
}

// ---------------------------------------------------------------------------
// Informacoes adicionais
// ---------------------------------------------------------------------------

function parseInfAdic(infNFe: Element): string {
  const infAdic = getElement(infNFe, "infAdic");
  if (!infAdic) return "";
  return getText(infAdic, "infCpl") ?? "";
}

// ---------------------------------------------------------------------------
// Chave de acesso
// ---------------------------------------------------------------------------

function extractChave(doc: Document, infNFe: Element): string {
  const id = infNFe.getAttribute("Id");
  if (id) return id;

  const chNFe = getText(doc, "chNFe");
  if (chNFe) return chNFe;

  return "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseNFe(xmlString: string): NFeParsed | null {
  if (!xmlString) return null;

  const cleanXml = sanitizeXml(xmlString);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanXml, "text/xml");

  const parseError = doc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    console.error("Erro ao parsear XML da NF-e:", parseError[0].textContent);
    return null;
  }

  const infNFe = getElement(doc, "infNFe");
  if (!infNFe) {
    console.error("Elemento infNFe nao encontrado no XML.");
    return null;
  }

  const chave = extractChave(doc, infNFe);
  const ide = parseIde(infNFe);

  const tipoOrigem: "entrada" | "saida" =
    ide.tpNF === "0" ? "entrada" : "saida";

  return {
    chave,
    ide,
    emit: parseEmit(infNFe),
    dest: parseDest(infNFe),
    itens: parseItens(infNFe),
    total: parseTotal(infNFe),
    transp: parseTransp(infNFe),
    cobr: parseCobr(infNFe),
    pag: parsePag(infNFe),
    infAdic: parseInfAdic(infNFe),
    tipoOrigem,
  };
}

export function parseMultiple(xmlStrings: string[]): NFeParsed[] {
  if (!xmlStrings || !Array.isArray(xmlStrings)) return [];

  const results: NFeParsed[] = [];
  for (const xml of xmlStrings) {
    const parsed = parseNFe(xml);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}
