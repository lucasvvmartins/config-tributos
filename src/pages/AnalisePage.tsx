import { useState, useMemo } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { formatCurrency, formatDate, truncate, cn } from "@/lib/utils";
import { getCfopDescription } from "@/lib/rules-engine";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { X, Eye, Search, FileText } from "lucide-react";
import type { NFeParsed } from "@/lib/types";

const selectClass =
  "h-9 rounded-lg bg-[#0f1729] border border-[#1e293b] text-sm text-gray-300 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50";

const inputClass =
  "h-9 rounded-lg bg-[#0f1729] border border-[#1e293b] text-sm text-gray-300 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-full";

function tpNFLabel(tp: string) {
  return tp === "0" ? "Entrada" : "Saída";
}
function tpNFVariant(tp: string) {
  return tp === "0" ? ("info" as const) : ("purple" as const);
}
function finNFeLabel(fin: string) {
  return fin === "4" ? "Devolução" : "Normal";
}
function finNFeVariant(fin: string) {
  return fin === "4" ? ("warning" as const) : ("success" as const);
}
function tPagLabel(tp: string) {
  const map: Record<string, string> = {
    "01": "Dinheiro",
    "02": "Cheque",
    "03": "Cartão Crédito",
    "04": "Cartão Débito",
    "05": "Crédito Loja",
    "10": "Vale Alimentação",
    "11": "Vale Refeição",
    "12": "Vale Presente",
    "13": "Vale Combustível",
    "14": "Duplicata Mercantil",
    "15": "Boleto Bancário",
    "16": "Depósito Bancário",
    "17": "PIX",
    "90": "Sem Pagamento",
    "99": "Outros",
  };
  return map[tp] || tp;
}

export default function AnalisePage() {
  const store = useAppStore();
  const { parsedNFs } = store;

  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterCfop, setFilterCfop] = useState("todos");
  const [filterFinalidade, setFilterFinalidade] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedNF, setSelectedNF] = useState<NFeParsed | null>(null);

  const distinctCfops = useMemo(() => {
    const set = new Set<string>();
    parsedNFs.forEach((nf) =>
      nf.itens.forEach((it) => {
        if (it.prod.cfop) set.add(it.prod.cfop);
      })
    );
    return Array.from(set).sort();
  }, [parsedNFs]);

  const filtered = useMemo(() => {
    let list = parsedNFs;

    if (filterTipo !== "todos") {
      const tp = filterTipo === "entrada" ? "0" : "1";
      list = list.filter((nf) => nf.ide.tpNF === tp);
    }

    if (filterCfop !== "todos") {
      list = list.filter((nf) =>
        nf.itens.some((it) => it.prod.cfop === filterCfop)
      );
    }

    if (filterFinalidade !== "todos") {
      const fin = filterFinalidade === "devolucao" ? "4" : "1";
      list = list.filter((nf) => nf.ide.finNFe === fin);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (nf) =>
          nf.ide.nNF.toLowerCase().includes(q) ||
          nf.dest.xNome.toLowerCase().includes(q) ||
          nf.chave.toLowerCase().includes(q)
      );
    }

    return list;
  }, [parsedNFs, filterTipo, filterCfop, filterFinalidade, search]);

  const columns = [
    {
      key: "nNF",
      header: "NF",
      render: (nf: NFeParsed) => (
        <span className="font-mono text-white">{nf.ide.nNF}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (nf: NFeParsed) => (
        <Badge variant={tpNFVariant(nf.ide.tpNF)}>
          {tpNFLabel(nf.ide.tpNF)}
        </Badge>
      ),
    },
    {
      key: "cfop",
      header: "CFOP",
      render: (nf: NFeParsed) => nf.itens[0]?.prod.cfop ?? "-",
    },
    {
      key: "dhEmi",
      header: "Emissão",
      render: (nf: NFeParsed) => formatDate(nf.ide.dhEmi),
    },
    {
      key: "dest",
      header: "Destinatário",
      render: (nf: NFeParsed) => truncate(nf.dest.xNome, 30),
    },
    {
      key: "uf",
      header: "UF",
      render: (nf: NFeParsed) => nf.dest.endereco.uf,
    },
    {
      key: "vNF",
      header: "Valor",
      render: (nf: NFeParsed) => (
        <span className="font-mono">{formatCurrency(nf.total.vNF)}</span>
      ),
      className: "text-right",
    },
    {
      key: "finNFe",
      header: "Finalidade",
      render: (nf: NFeParsed) => (
        <Badge variant={finNFeVariant(nf.ide.finNFe)}>
          {finNFeLabel(nf.ide.finNFe)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (nf: NFeParsed) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNF(nf);
          }}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>
      ),
      className: "w-16",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Tipo: Todos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <select
          value={filterCfop}
          onChange={(e) => setFilterCfop(e.target.value)}
          className={selectClass}
        >
          <option value="todos">CFOP: Todos</option>
          {distinctCfops.map((cfop) => (
            <option key={cfop} value={cfop}>
              {cfop} - {truncate(getCfopDescription(cfop), 40)}
            </option>
          ))}
        </select>

        <select
          value={filterFinalidade}
          onChange={(e) => setFilterFinalidade(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Finalidade: Todas</option>
          <option value="normal">Normal</option>
          <option value="devolucao">Devolução</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por NF, destinatário ou chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <FileText className="h-4 w-4" />
        <span>
          {filtered.length} nota{filtered.length !== 1 ? "s" : ""} encontrada
          {filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* NF Table */}
      <DataTable columns={columns} data={filtered} />

      {/* Detail Modal */}
      {selectedNF && (
        <DetailModal nf={selectedNF} onClose={() => setSelectedNF(null)} />
      )}
    </div>
  );
}

function DetailModal({
  nf,
  onClose,
}: {
  nf: NFeParsed;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#0d1220] border border-white/10 rounded-xl shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-white">
                NF-e {nf.ide.nNF}
              </h2>
              <Badge variant={tpNFVariant(nf.ide.tpNF)}>
                {tpNFLabel(nf.ide.tpNF)}
              </Badge>
              <Badge variant={finNFeVariant(nf.ide.finNFe)}>
                {finNFeLabel(nf.ide.finNFe)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-mono break-all">
              Chave: {nf.chave}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Nat. Operação: {nf.ide.natOp} | Série: {nf.ide.serie} | Emissão:{" "}
              {formatDate(nf.ide.dhEmi)}
            </p>
          </div>

          {/* Emitente / Destinatario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111827] rounded-lg border border-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Emitente
              </h3>
              <p className="text-sm text-white">{nf.emit.xNome}</p>
              {nf.emit.xFant && (
                <p className="text-xs text-gray-400">{nf.emit.xFant}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                CNPJ: {nf.emit.cnpj} | IE: {nf.emit.ie}
              </p>
              <p className="text-xs text-gray-500">
                {nf.emit.endereco.logr}, {nf.emit.endereco.nro} -{" "}
                {nf.emit.endereco.bairro}, {nf.emit.endereco.mun}/
                {nf.emit.endereco.uf}
              </p>
            </div>
            <div className="bg-[#111827] rounded-lg border border-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Destinatário
              </h3>
              <p className="text-sm text-white">{nf.dest.xNome}</p>
              <p className="text-xs text-gray-500 mt-1">
                CNPJ: {nf.dest.cnpj} | IE: {nf.dest.ie || "-"}
              </p>
              <p className="text-xs text-gray-500">
                {nf.dest.endereco.logr}, {nf.dest.endereco.nro} -{" "}
                {nf.dest.endereco.bairro}, {nf.dest.endereco.mun}/
                {nf.dest.endereco.uf}
              </p>
              {nf.dest.email && (
                <p className="text-xs text-gray-500">{nf.dest.email}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Itens ({nf.itens.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0d1220] border-b border-white/5">
                  <tr>
                    <th className="px-3 py-2 text-gray-400">#</th>
                    <th className="px-3 py-2 text-gray-400">Produto</th>
                    <th className="px-3 py-2 text-gray-400">NCM</th>
                    <th className="px-3 py-2 text-gray-400">CFOP</th>
                    <th className="px-3 py-2 text-gray-400 text-right">Qtd</th>
                    <th className="px-3 py-2 text-gray-400 text-right">
                      Vl Unit
                    </th>
                    <th className="px-3 py-2 text-gray-400 text-right">
                      Total
                    </th>
                    <th className="px-3 py-2 text-gray-400">ICMS</th>
                    <th className="px-3 py-2 text-gray-400 text-right">IPI</th>
                    <th className="px-3 py-2 text-gray-400 text-right">PIS</th>
                    <th className="px-3 py-2 text-gray-400 text-right">
                      COFINS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {nf.itens.map((it) => (
                    <tr
                      key={it.nItem}
                      className="bg-[#111827] hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2 text-gray-500">{it.nItem}</td>
                      <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate">
                        {truncate(it.prod.xProd, 40)}
                      </td>
                      <td className="px-3 py-2 text-gray-400 font-mono">
                        {it.prod.ncm}
                      </td>
                      <td className="px-3 py-2 text-gray-400 font-mono">
                        {it.prod.cfop}
                      </td>
                      <td className="px-3 py-2 text-gray-300 text-right font-mono">
                        {it.prod.qCom}
                      </td>
                      <td className="px-3 py-2 text-gray-300 text-right font-mono">
                        {formatCurrency(it.prod.vUnCom)}
                      </td>
                      <td className="px-3 py-2 text-white text-right font-mono">
                        {formatCurrency(it.prod.vProd)}
                      </td>
                      <td className="px-3 py-2 text-gray-400">
                        <span className="font-mono">
                          CST {it.icms.cst} | {it.icms.pICMS}% |{" "}
                          {formatCurrency(it.icms.vICMS)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-right font-mono">
                        {formatCurrency(it.ipi.vIPI)}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-right font-mono">
                        {formatCurrency(it.pis.vAliq)}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-right font-mono">
                        {formatCurrency(it.cofins.vAliq)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              Totais
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[
                { label: "Produtos", value: nf.total.vProd },
                { label: "ICMS", value: nf.total.vICMS },
                { label: "ICMS ST", value: nf.total.vST },
                { label: "IPI", value: nf.total.vIPI },
                { label: "PIS", value: nf.total.vPIS },
                { label: "COFINS", value: nf.total.vCOFINS },
                { label: "Frete", value: nf.total.vFrete },
                { label: "Desconto", value: nf.total.vDesc },
                { label: "Outros", value: nf.total.vOutro },
                { label: "II", value: nf.total.vII },
                { label: "Seguro", value: nf.total.vSeg },
                { label: "Total NF", value: nf.total.vNF },
              ].map((t) => (
                <div
                  key={t.label}
                  className={cn(
                    "bg-[#111827] rounded-lg border border-white/5 p-3",
                    t.label === "Total NF" && "border-cyan-500/30"
                  )}
                >
                  <p className="text-[10px] uppercase text-gray-500">
                    {t.label}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-mono mt-0.5",
                      t.label === "Total NF" ? "text-cyan-400" : "text-gray-300"
                    )}
                  >
                    {formatCurrency(t.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamento */}
          {nf.pag.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Pagamento
              </h3>
              <div className="flex flex-wrap gap-3">
                {nf.pag.map((p, i) => (
                  <div
                    key={i}
                    className="bg-[#111827] rounded-lg border border-white/5 px-4 py-2 text-sm"
                  >
                    <span className="text-gray-400">{tPagLabel(p.tPag)}</span>
                    <span className="text-white font-mono ml-3">
                      {formatCurrency(p.vPag)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cobranca / Duplicatas */}
          {nf.cobr.duplicatas.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Duplicatas
              </h3>
              <div className="flex flex-wrap gap-3">
                {nf.cobr.duplicatas.map((d, i) => (
                  <div
                    key={i}
                    className="bg-[#111827] rounded-lg border border-white/5 px-4 py-2 text-xs"
                  >
                    <span className="text-gray-500">#{d.nDup}</span>
                    <span className="text-gray-400 ml-2">
                      {formatDate(d.dVenc)}
                    </span>
                    <span className="text-white font-mono ml-2">
                      {formatCurrency(d.vDup)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Adicional */}
          {nf.infAdic && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                Informações Adicionais
              </h3>
              <p className="text-xs text-gray-400 bg-[#111827] rounded-lg border border-white/5 p-3 whitespace-pre-wrap">
                {nf.infAdic}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
