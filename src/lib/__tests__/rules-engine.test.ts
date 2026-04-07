import type { NFeParsed, ItemNFe } from "@/lib/types";
import {
  generateTES,
  generatePerfisOperacao,
  generatePerfisOrigemDestino,
  generatePerfisProduto,
  generatePerfisParticipante,
  generateRegrasBase,
  generateRegrasAliquota,
  generateRegrasCalculo,
} from "@/lib/rules-engine";

// ---------------------------------------------------------------------------
// Utility: recursive partial — allows callers to override nested fields
// ---------------------------------------------------------------------------

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ---------------------------------------------------------------------------
// Helper: builds a minimal valid NFeParsed, accepting partial overrides
// ---------------------------------------------------------------------------

function mockItem(overrides?: DeepPartial<ItemNFe>): ItemNFe {
  return {
    nItem: 1,
    prod: {
      cProd: "PROD001",
      xProd: "Produto Teste",
      ncm: "84818099",
      cest: "",
      cfop: "5102",
      uCom: "UN",
      qCom: 10,
      vUnCom: 100,
      vProd: 1000,
      uTrib: "UN",
      qTrib: 10,
      ...overrides?.prod,
    },
    icms: {
      orig: "0",
      cst: "00",
      modBC: "3",
      vBC: 1000,
      pICMS: 18,
      vICMS: 180,
      vBCSTRet: 0,
      pST: 0,
      vICMSSTRet: 0,
      ...overrides?.icms,
    },
    ipi: {
      cst: "50",
      vBC: 1000,
      pIPI: 5,
      vIPI: 50,
      ...overrides?.ipi,
    },
    pis: {
      cst: "01",
      vBC: 1000,
      pAliq: 1.65,
      vAliq: 16.5,
      ...overrides?.pis,
    },
    cofins: {
      cst: "01",
      vBC: 1000,
      pAliq: 7.6,
      vAliq: 76,
      ...overrides?.cofins,
    },
    ii: null,
    ibscbs: null,
    infAdProd: "",
    ...overrides,
    // Re-spread nested objects that were already merged above so the top-level
    // override (e.g. { prod: ... }) does not clobber the merged version:
    ...(overrides?.prod ? { prod: { ...({
      cProd: "PROD001", xProd: "Produto Teste", ncm: "84818099", cest: "",
      cfop: "5102", uCom: "UN", qCom: 10, vUnCom: 100, vProd: 1000,
      uTrib: "UN", qTrib: 10,
    }), ...overrides.prod } } : {}),
    ...(overrides?.icms ? { icms: { ...({
      orig: "0", cst: "00", modBC: "3", vBC: 1000, pICMS: 18, vICMS: 180,
      vBCSTRet: 0, pST: 0, vICMSSTRet: 0,
    }), ...overrides.icms } } : {}),
    ...(overrides?.ipi ? { ipi: { ...({
      cst: "50", vBC: 1000, pIPI: 5, vIPI: 50,
    }), ...overrides.ipi } } : {}),
    ...(overrides?.pis ? { pis: { ...({
      cst: "01", vBC: 1000, pAliq: 1.65, vAliq: 16.5,
    }), ...overrides.pis } } : {}),
    ...(overrides?.cofins ? { cofins: { ...({
      cst: "01", vBC: 1000, pAliq: 7.6, vAliq: 76,
    }), ...overrides.cofins } } : {}),
  } as ItemNFe;
}

function mockNFe(overrides?: DeepPartial<NFeParsed>): NFeParsed {
  const base: NFeParsed = {
    chave: "35210112345678000195550010000000011000000019",
    ide: {
      cUF: "35",
      natOp: "VENDA",
      mod: "55",
      serie: "1",
      nNF: "1",
      dhEmi: "2025-01-15T10:00:00-03:00",
      dhSaiEnt: "2025-01-15T10:00:00-03:00",
      tpNF: "1",
      idDest: "1",
      finNFe: "1",
      indFinal: "0",
      nfRef: "",
    },
    emit: {
      cnpj: "12345678000195",
      xNome: "Empresa Emitente Ltda",
      xFant: "Emitente",
      endereco: {
        logr: "Rua A",
        nro: "100",
        compl: "",
        bairro: "Centro",
        codMun: "3550308",
        mun: "Sao Paulo",
        uf: "SP",
        cep: "01000000",
      },
      ie: "123456789",
      crt: "3",
    },
    dest: {
      cnpj: "98765432000199",
      xNome: "Empresa Destinataria Ltda",
      endereco: {
        logr: "Rua B",
        nro: "200",
        compl: "",
        bairro: "Centro",
        codMun: "3550308",
        mun: "Sao Paulo",
        uf: "SP",
        cep: "02000000",
      },
      indIEDest: "1",
      ie: "987654321",
      email: "dest@test.com",
      isEstrangeiro: false,
    },
    itens: [mockItem()],
    total: {
      vBC: 1000, vICMS: 180, vICMSDeson: 0, vBCST: 0, vST: 0,
      vProd: 1000, vFrete: 0, vSeg: 0, vDesc: 0, vII: 0, vIPI: 50,
      vPIS: 16.5, vCOFINS: 76, vOutro: 0, vNF: 1000,
    },
    transp: { modFrete: "0", transporta: null, volumes: null },
    cobr: { fat: null, duplicatas: [] },
    pag: [{ indPag: "0", tPag: "01", vPag: 1000 }],
    infAdic: "",
    tipoOrigem: "saida",
  };

  // Apply top-level overrides (cast needed because DeepPartial spreads)
  const merged = { ...base, ...overrides } as NFeParsed;

  // If caller overrode ide, emit, or dest, merge rather than replace
  if (overrides?.ide) merged.ide = { ...base.ide, ...overrides.ide } as NFeParsed["ide"];
  if (overrides?.emit) merged.emit = { ...base.emit, ...overrides.emit } as NFeParsed["emit"];
  if (overrides?.dest) merged.dest = { ...base.dest, ...overrides.dest } as NFeParsed["dest"];
  if (overrides?.emit?.endereco) {
    merged.emit.endereco = { ...base.emit.endereco, ...overrides.emit.endereco } as NFeParsed["emit"]["endereco"];
  }
  if (overrides?.dest?.endereco) {
    merged.dest.endereco = { ...base.dest.endereco, ...overrides.dest.endereco } as NFeParsed["dest"]["endereco"];
  }

  return merged;
}

// ===========================================================================
// Tests
// ===========================================================================

describe("generateTES", () => {
  it("NF saida (tpNF=1) produces tipo S", () => {
    const nf = mockNFe({ ide: { tpNF: "1" } });
    const result = generateTES([nf]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].tipo).toBe("S");
  });

  it("NF entrada (tpNF=0) produces tipo E", () => {
    const nf = mockNFe({
      ide: { tpNF: "0" },
      itens: [mockItem({ prod: { cfop: "1102" } })],
      tipoOrigem: "entrada",
    });
    const result = generateTES([nf]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].tipo).toBe("E");
  });
});

describe("generatePerfisOperacao", () => {
  it("groups CFOP 5xxx under Operacoes Internas", () => {
    const nf = mockNFe({
      itens: [mockItem({ prod: { cfop: "5102" } })],
    });
    const perfis = generatePerfisOperacao([nf]);

    const internas = perfis.find((p) => p.descricao === "Operacoes Internas");
    expect(internas).toBeDefined();
    expect(internas!.cfops.some((c) => c.cfop === "5102")).toBe(true);
  });

  it("always includes TODOS OS CFOPS profile with codigo 000051", () => {
    const nf = mockNFe();
    const perfis = generatePerfisOperacao([nf]);

    const todos = perfis.find((p) => p.codigo === "000051");
    expect(todos).toBeDefined();
    expect(todos!.descricao).toBe("TODOS OS CFOPS");
  });
});

describe("generatePerfisOrigemDestino", () => {
  it("creates a profile for the UF pair in the NF-e", () => {
    const nf = mockNFe({
      emit: { endereco: { uf: "SP" } },
      dest: { endereco: { uf: "RJ" } },
    });
    const perfis = generatePerfisOrigemDestino([nf]);

    const pair = perfis.find((p) => p.descricao.includes("SP") && p.descricao.includes("RJ"));
    expect(pair).toBeDefined();
    expect(pair!.ufs[0].ufOrigem).toBe("SP");
    expect(pair!.ufs[0].ufDestino).toBe("RJ");
  });

  it("always includes the 'Todas as UFs' wildcard profile", () => {
    const nf = mockNFe();
    const perfis = generatePerfisOrigemDestino([nf]);

    const todas = perfis.find((p) => p.codigo === "000002");
    expect(todas).toBeDefined();
    expect(todas!.ufs[0].ufOrigem).toBe("*");
  });
});

describe("generatePerfisProduto", () => {
  it("groups products by NCM", () => {
    const nf = mockNFe({
      itens: [
        mockItem({ prod: { cProd: "A1", ncm: "84818099", cfop: "5102" } }),
        mockItem({ prod: { cProd: "A2", ncm: "84818099", cfop: "5102" } }),
      ],
    });
    const perfis = generatePerfisProduto([nf]);

    const ncmPerfil = perfis.find((p) => p.descricao.includes("84818099"));
    expect(ncmPerfil).toBeDefined();
    expect(ncmPerfil!.produtos.length).toBe(2);
  });

  it("always includes the TODOS profile", () => {
    const nf = mockNFe();
    const perfis = generatePerfisProduto([nf]);

    const todos = perfis.find((p) => p.codigo === "PRF-PROD-TODOS");
    expect(todos).toBeDefined();
  });
});

describe("generatePerfisParticipante", () => {
  it("returns at least the TODOS profile", () => {
    const nf = mockNFe();
    const perfis = generatePerfisParticipante([nf]);
    expect(perfis.length).toBeGreaterThanOrEqual(1);

    const todos = perfis.find((p) => p.codigo === "PRF-PART-TODOS");
    expect(todos).toBeDefined();
    expect(todos!.participantes.length).toBe(2);
  });
});

describe("generateRegrasBase", () => {
  it("returns exactly 6 entries (ICMS, IPI, PIS, COFINS, CBS, IBS)", () => {
    const nf = mockNFe();
    const regras = generateRegrasBase([nf]);
    expect(regras).toHaveLength(6);

    const codigos = regras.map((r) => r.codigo);
    expect(codigos).toContain("BASE-ICMS-001");
    expect(codigos).toContain("BASE-IPI-001");
    expect(codigos).toContain("BASE-PIS-001");
    expect(codigos).toContain("BASE-COF-001");
    expect(codigos).toContain("BASE-CBS-001");
    expect(codigos).toContain("BASE-IBS-001");
  });
});

describe("generateRegrasAliquota", () => {
  it("CBS aliquota is 0.9 and IBS aliquota is 0.1", () => {
    const nf = mockNFe();
    const regras = generateRegrasAliquota([nf]);

    const cbs = regras.find((r) => r.codigo === "ALIQ-CBS-001");
    expect(cbs).toBeDefined();
    expect(cbs!.aliquota).toBe(0.9);

    const ibs = regras.find((r) => r.codigo === "ALIQ-IBS-001");
    expect(ibs).toBeDefined();
    expect(ibs!.aliquota).toBe(0.1);
  });

  it("extracts ICMS aliquota from NF-e items", () => {
    const nf = mockNFe({
      itens: [mockItem({ icms: { pICMS: 12 } })],
    });
    const regras = generateRegrasAliquota([nf]);

    const icms12 = regras.find((r) => r.codigo === "ALIQ-ICMS-12");
    expect(icms12).toBeDefined();
    expect(icms12!.aliquota).toBe(12);
  });
});

describe("generateRegrasCalculo", () => {
  it("ICMS (000021) appears before CBS (000062) in the result array", () => {
    const nf = mockNFe();
    const regras = generateRegrasCalculo([nf]);

    const idxICMS = regras.findIndex((r) => r.idTotvs === "000021");
    const idxCBS = regras.findIndex((r) => r.idTotvs === "000062");

    expect(idxICMS).toBeGreaterThanOrEqual(0);
    expect(idxCBS).toBeGreaterThanOrEqual(0);
    expect(idxICMS).toBeLessThan(idxCBS);
  });

  it("CBS rule references a codAliquota containing CBS", () => {
    const nf = mockNFe();
    const regras = generateRegrasCalculo([nf]);

    const cbs = regras.find((r) => r.tributo === "CBS");
    expect(cbs).toBeDefined();
    expect(cbs!.codAliquota).toContain("CBS");
  });

  it("IBS rule has idTotvs 000060", () => {
    const nf = mockNFe();
    const regras = generateRegrasCalculo([nf]);

    const ibs = regras.find((r) => r.tributo === "IBS");
    expect(ibs).toBeDefined();
    expect(ibs!.idTotvs).toBe("000060");
  });

  it("returns 6 regras (one per tributo)", () => {
    const nf = mockNFe();
    const regras = generateRegrasCalculo([nf]);
    expect(regras).toHaveLength(6);

    const tributos = regras.map((r) => r.tributo);
    expect(tributos).toEqual(["ICMS", "IPI", "PIS", "COFINS", "CBS", "IBS"]);
  });

  it("CBS and IBS use the TODOS perfis", () => {
    const nf = mockNFe();
    const regras = generateRegrasCalculo([nf]);

    const cbs = regras.find((r) => r.tributo === "CBS")!;
    expect(cbs.perfOperacao).toBe("000051");
    expect(cbs.perfOrigemDestino).toBe("000002");
    expect(cbs.perfProduto).toBe("PRF-PROD-TODOS");
    expect(cbs.perfParticipante).toBe("PRF-PART-TODOS");

    const ibs = regras.find((r) => r.tributo === "IBS")!;
    expect(ibs.perfOperacao).toBe("000051");
    expect(ibs.perfOrigemDestino).toBe("000002");
  });
});
