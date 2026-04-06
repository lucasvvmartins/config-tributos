import { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { truncate, cn } from "@/lib/utils";
import { getCfopDescription } from "@/lib/rules-engine";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type {
  TESConfig,
  FiscalRule,
  FinancialRule,
  StockRule,
  FiscalProfile,
  ProductInfo,
} from "@/lib/types";
import {
  BookOpen,
  Scale,
  Wallet,
  Package,
  Users,
  ShoppingBag,
} from "lucide-react";

const TABS = [
  { id: "tes", label: "TES", icon: BookOpen },
  { id: "fiscal", label: "Regras Fiscais", icon: Scale },
  { id: "financeiro", label: "Regras Financeiras", icon: Wallet },
  { id: "estoque", label: "Regras de Estoque", icon: Package },
  { id: "perfis", label: "Perfis", icon: Users },
  { id: "produtos", label: "Produtos", icon: ShoppingBag },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MapeamentoPage() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("tes");

  return (
    <div className="space-y-6">
      {/* Inner Tab Bar */}
      <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-violet-500 rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "tes" && <TESTab data={store.tes} />}
      {activeTab === "fiscal" && <FiscalTab data={store.fiscalRules} />}
      {activeTab === "financeiro" && (
        <FinanceiroTab data={store.financialRules} />
      )}
      {activeTab === "estoque" && <EstoqueTab data={store.stockRules} />}
      {activeTab === "perfis" && <PerfisTab data={store.profiles} />}
      {activeTab === "produtos" && <ProdutosTab data={store.products} />}
    </div>
  );
}

function TESTab({ data }: { data: TESConfig[] }) {
  const columns = [
    {
      key: "codTes",
      header: "Cod TES",
      render: (r: TESConfig) => (
        <span className="font-mono text-white">{r.codTes}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (r: TESConfig) => (
        <Badge variant={r.tipo === "E" ? "info" : "purple"}>
          {r.tipo === "E" ? "Entrada" : "Saída"}
        </Badge>
      ),
    },
    {
      key: "cfop",
      header: "CFOP",
      render: (r: TESConfig) => (
        <span className="font-mono">{r.cfop}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: TESConfig) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    { key: "cstIcms", header: "CST ICMS" },
    { key: "cstIpi", header: "CST IPI" },
    { key: "cstPis", header: "CST PIS" },
    { key: "cstCofins", header: "CST COFINS" },
    {
      key: "count",
      header: "Ocorrências",
      render: (r: TESConfig) => (
        <Badge variant="default">{r.count}</Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function FiscalTab({ data }: { data: FiscalRule[] }) {
  const columns = [
    {
      key: "id",
      header: "Regra",
      render: (r: FiscalRule) => (
        <span className="font-mono text-white">{r.id}</span>
      ),
    },
    {
      key: "cfop",
      header: "CFOP",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.cfop}</span>
      ),
    },
    {
      key: "ncm",
      header: "NCM",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.ncm}</span>
      ),
    },
    { key: "ufOrig", header: "UF Orig" },
    { key: "ufDest", header: "UF Dest" },
    {
      key: "pICMS",
      header: "ICMS %",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.pICMS}</span>
      ),
    },
    {
      key: "pIPI",
      header: "IPI %",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.pIPI}</span>
      ),
    },
    {
      key: "pPIS",
      header: "PIS %",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.pPIS}</span>
      ),
    },
    {
      key: "pCOFINS",
      header: "COFINS %",
      render: (r: FiscalRule) => (
        <span className="font-mono">{r.pCOFINS}</span>
      ),
    },
    {
      key: "obs",
      header: "Obs",
      render: (r: FiscalRule) => (
        <span className="text-gray-400">{truncate(r.obs, 30)}</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function FinanceiroTab({ data }: { data: FinancialRule[] }) {
  const columns = [
    {
      key: "id",
      header: "Código",
      render: (r: FinancialRule) => (
        <span className="font-mono text-white">{r.id}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: FinancialRule) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "tPagDesc",
      header: "Tipo Pgto",
      render: (r: FinancialRule) => r.tPagDesc,
    },
    {
      key: "parcelas",
      header: "Parcelas",
      render: (r: FinancialRule) => (
        <span className="font-mono">{r.parcelas}</span>
      ),
    },
    {
      key: "count",
      header: "Ocorrências",
      render: (r: FinancialRule) => (
        <Badge variant="default">{r.count}</Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function EstoqueTab({ data }: { data: StockRule[] }) {
  const columns = [
    {
      key: "cfop",
      header: "CFOP",
      render: (r: StockRule) => (
        <span className="font-mono text-white">{r.cfop}</span>
      ),
    },
    {
      key: "atualizaEstoque",
      header: "Atualiza Estoque",
      render: (r: StockRule) => (
        <Badge variant={r.atualizaEstoque ? "success" : "error"}>
          {r.atualizaEstoque ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      key: "geraDuplicata",
      header: "Gera Duplicata",
      render: (r: StockRule) => (
        <Badge variant={r.geraDuplicata ? "success" : "error"}>
          {r.geraDuplicata ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      key: "poderTerceiro",
      header: "Poder Terceiro",
      render: (r: StockRule) => (
        <Badge variant={r.poderTerceiro ? "warning" : "default"}>
          {r.poderTerceiro ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: StockRule) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function PerfisTab({ data }: { data: FiscalProfile[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        Nenhum perfil disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data.map((profile) => (
        <Card key={profile.name} className="pl-6">
          {/* Colored left border */}
          <div
            className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
            style={{ backgroundColor: profile.color }}
          />

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {profile.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {profile.description}
              </p>
            </div>

            {/* CFOP chips */}
            <div className="flex flex-wrap gap-1.5">
              {profile.cfops.map((cfop) => (
                <span
                  key={cfop}
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono bg-white/5 text-gray-400 border border-white/5"
                  title={getCfopDescription(cfop)}
                >
                  {cfop}
                </span>
              ))}
            </div>

            {/* Tax rules summary */}
            <div className="space-y-1 text-xs text-gray-500">
              <p>
                <span className="text-gray-400">ICMS:</span>{" "}
                {profile.icmsRule}
              </p>
              <p>
                <span className="text-gray-400">IPI:</span> {profile.ipiRule}
              </p>
              <p>
                <span className="text-gray-400">PIS:</span> {profile.pisRule}
              </p>
              <p>
                <span className="text-gray-400">COFINS:</span>{" "}
                {profile.cofinsRule}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProdutosTab({ data }: { data: ProductInfo[] }) {
  const columns = [
    {
      key: "cProd",
      header: "Código",
      render: (r: ProductInfo) => (
        <span className="font-mono text-white">{r.cProd}</span>
      ),
    },
    {
      key: "xProd",
      header: "Descrição",
      render: (r: ProductInfo) => (
        <span className="text-gray-300">{truncate(r.xProd, 40)}</span>
      ),
    },
    {
      key: "ncm",
      header: "NCM",
      render: (r: ProductInfo) => (
        <span className="font-mono">{r.ncm}</span>
      ),
    },
    { key: "uCom", header: "Unidade" },
    { key: "orig", header: "Origem" },
    {
      key: "count",
      header: "Ocorrências",
      render: (r: ProductInfo) => (
        <Badge variant="default">{r.count}</Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
