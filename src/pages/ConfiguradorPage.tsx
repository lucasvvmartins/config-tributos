import { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import type {
  PerfilProduto,
  PerfilOperacao,
  PerfilParticipante,
  PerfilOrigemDestino,
  RegraBase,
  RegraAliquota,
  RegraCalculo,
} from "@/lib/types";
import {
  Package,
  Route,
  Users,
  MapPin,
  Calculator,
  Percent,
  Cog,
} from "lucide-react";

const TABS = [
  { id: "perfProduto", label: "Perfis Produto", icon: Package },
  { id: "perfOperacao", label: "Perfis Operação", icon: Route },
  { id: "perfParticipante", label: "Perfis Participante", icon: Users },
  { id: "perfOrigemDestino", label: "Perfis Origem/Destino", icon: MapPin },
  { id: "regraBase", label: "Regras Base", icon: Calculator },
  { id: "regraAliquota", label: "Regras Alíquota", icon: Percent },
  { id: "regraCalculo", label: "Regras de Cálculo", icon: Cog },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ConfiguradorPage() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("perfProduto");

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
      {activeTab === "perfProduto" && (
        <PerfisProdutoTab data={store.perfisProduto} />
      )}
      {activeTab === "perfOperacao" && (
        <PerfisOperacaoTab data={store.perfisOperacao} />
      )}
      {activeTab === "perfParticipante" && (
        <PerfisParticipanteTab data={store.perfisParticipante} />
      )}
      {activeTab === "perfOrigemDestino" && (
        <PerfisOrigemDestinoTab data={store.perfisOrigemDestino} />
      )}
      {activeTab === "regraBase" && (
        <RegrasBaseTab data={store.regrasBase} />
      )}
      {activeTab === "regraAliquota" && (
        <RegrasAliquotaTab data={store.regrasAliquota} />
      )}
      {activeTab === "regraCalculo" && (
        <RegrasCalculoTab data={store.regrasCalculo} />
      )}
    </div>
  );
}

function PerfisProdutoTab({ data }: { data: PerfilProduto[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: PerfilProduto) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: PerfilProduto) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "produtos",
      header: "Produtos",
      render: (r: PerfilProduto) => (
        <span className="text-gray-400">
          {r.produtos.length > 3
            ? `${r.produtos.length} produtos`
            : r.produtos.map((p) => p.codProd).join(", ")}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function PerfisOperacaoTab({ data }: { data: PerfilOperacao[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: PerfilOperacao) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: PerfilOperacao) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "cfopCount",
      header: "CFOPs",
      render: (r: PerfilOperacao) => (
        <Badge variant="default">{r.cfops.length}</Badge>
      ),
    },
    {
      key: "cfopList",
      header: "Lista CFOPs",
      render: (r: PerfilOperacao) => (
        <div className="flex flex-wrap gap-1.5">
          {r.cfops.map((c) => (
            <span
              key={c.cfop}
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono bg-white/5 text-gray-400 border border-white/5"
              title={c.descricao}
            >
              {c.cfop}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function PerfisParticipanteTab({ data }: { data: PerfilParticipante[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: PerfilParticipante) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: PerfilParticipante) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "participantes",
      header: "Participantes",
      render: (r: PerfilParticipante) => (
        <Badge variant="default">{r.participantes.length}</Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function PerfisOrigemDestinoTab({ data }: { data: PerfilOrigemDestino[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: PerfilOrigemDestino) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: PerfilOrigemDestino) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "ufs",
      header: "UFs",
      render: (r: PerfilOrigemDestino) => (
        <Badge variant="default">{r.ufs.length}</Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function RegrasBaseTab({ data }: { data: RegraBase[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: RegraBase) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: RegraBase) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "valorOrigem",
      header: "Valor Origem",
      render: (r: RegraBase) => (
        <span className="font-mono">{r.valorOrigem}</span>
      ),
    },
    {
      key: "desconto",
      header: "Desconto",
      render: (r: RegraBase) => (
        <span className="text-gray-400">{r.desconto ?? "-"}</span>
      ),
    },
    {
      key: "frete",
      header: "Frete",
      render: (r: RegraBase) => (
        <span className="text-gray-400">{r.frete ?? "-"}</span>
      ),
    },
    {
      key: "seguro",
      header: "Seguro",
      render: (r: RegraBase) => (
        <span className="text-gray-400">{r.seguro ?? "-"}</span>
      ),
    },
    {
      key: "despesas",
      header: "Despesas",
      render: (r: RegraBase) => (
        <span className="text-gray-400">{r.despesas ?? "-"}</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function RegrasAliquotaTab({ data }: { data: RegraAliquota[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: RegraAliquota) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: RegraAliquota) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "valorOrigem",
      header: "Valor Origem",
      render: (r: RegraAliquota) => (
        <span className="font-mono">{r.valorOrigem}</span>
      ),
    },
    {
      key: "tipoAliquota",
      header: "Tipo",
      render: (r: RegraAliquota) => (
        <Badge variant={r.tipoAliquota === "1" ? "info" : "purple"}>
          {r.tipoAliquota === "1" ? "Percentual" : "Unid.Med"}
        </Badge>
      ),
    },
    {
      key: "aliquota",
      header: "Alíquota",
      render: (r: RegraAliquota) => (
        <span className="font-mono">{r.aliquota ?? "-"}</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}

function RegrasCalculoTab({ data }: { data: RegraCalculo[] }) {
  const columns = [
    {
      key: "codigo",
      header: "Código",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-white">{r.codigo}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      render: (r: RegraCalculo) => (
        <span className="text-gray-300">{r.descricao}</span>
      ),
    },
    {
      key: "tributo",
      header: "Tributo",
      render: (r: RegraCalculo) => (
        <span className="font-mono">{r.tributo}</span>
      ),
    },
    {
      key: "idTotvs",
      header: "ID TOTVS",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-gray-400">{r.idTotvs ?? "-"}</span>
      ),
    },
    {
      key: "vigIni",
      header: "Vigência Ini",
      render: (r: RegraCalculo) => (
        <span className="font-mono">{r.vigIni}</span>
      ),
    },
    {
      key: "vigFim",
      header: "Vigência Fim",
      render: (r: RegraCalculo) => (
        <span className="font-mono">{r.vigFim}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: RegraCalculo) => (
        <Badge variant={r.status === "1" ? "warning" : "success"}>
          {r.status === "1" ? "Em Teste" : "Aprovada"}
        </Badge>
      ),
    },
    {
      key: "codBase",
      header: "Base",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-gray-400">{r.codBase}</span>
      ),
    },
    {
      key: "codAliquota",
      header: "Alíquota",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-gray-400">{r.codAliquota}</span>
      ),
    },
    {
      key: "perfProduto",
      header: "Perf. Produto",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-gray-400">{r.perfProduto}</span>
      ),
    },
    {
      key: "perfOperacao",
      header: "Perf. Operação",
      render: (r: RegraCalculo) => (
        <span className="font-mono text-gray-400">{r.perfOperacao}</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
