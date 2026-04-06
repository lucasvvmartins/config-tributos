import { useAppStore } from "@/hooks/useAppStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { Participante } from "@/lib/types";
import {
  ShoppingCart,
  RotateCcw,
  Truck,
  Factory,
  Globe,
  ArrowRight,
  Package,
  Building2,
} from "lucide-react";

const operationIcons: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  RotateCcw: <RotateCcw className="h-5 w-5" />,
  Truck: <Truck className="h-5 w-5" />,
  Factory: <Factory className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
};

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  green: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  amber: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400",
  },
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400",
  },
  purple: {
    border: "border-l-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    badge: "bg-violet-500/15 text-violet-400",
  },
  teal: {
    border: "border-l-teal-500",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    badge: "bg-teal-500/15 text-teal-400",
  },
};

function getColor(color: string) {
  return colorMap[color] ?? colorMap.blue;
}

interface EmitterField {
  xmlTag: string;
  label: string;
  value: string;
}

function EmitterCard({ xmlTag, label, value }: EmitterField) {
  return (
    <Card accent className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-center gap-3">
          <code className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
            {xmlTag}
          </code>
          <ArrowRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
          <span className="text-sm font-medium text-gray-200 truncate">{value || "-"}</span>
        </div>
      </div>
    </Card>
  );
}

const tipoVariantMap: Record<string, "success" | "info" | "purple"> = {
  cliente: "success",
  fornecedor: "info",
  ambos: "purple",
};

const tipoLabelMap: Record<string, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  ambos: "Ambos",
};

const participanteColumns = [
  { key: "cnpj", header: "CNPJ" },
  { key: "xNome", header: "Razão Social" },
  { key: "uf", header: "UF", className: "w-16 text-center" },
  { key: "ie", header: "IE" },
  {
    key: "count",
    header: "Qtd NFs",
    className: "w-20 text-center",
    render: (p: Participante) => (
      <span className="text-gray-300 tabular-nums">{p.count}</span>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    className: "w-28",
    render: (p: Participante) => (
      <Badge variant={tipoVariantMap[p.tipo] ?? "default"}>
        {tipoLabelMap[p.tipo] ?? p.tipo}
      </Badge>
    ),
  },
];

export default function VisaoPage() {
  const { parsedNFs, operations, participantes } = useAppStore();

  const emitente = parsedNFs.length > 0 ? parsedNFs[0].emit : null;

  const emitterFields: EmitterField[] = emitente
    ? [
        { xmlTag: "emit/CNPJ", label: "CNPJ", value: emitente.cnpj },
        { xmlTag: "emit/xFant", label: "Nome Fantasia", value: emitente.xFant },
        { xmlTag: "enderEmit/UF", label: "UF", value: emitente.endereco.uf },
        { xmlTag: "emit/IE", label: "Inscrição Estadual", value: emitente.ie },
        { xmlTag: "emit/CRT", label: "Código Regime Tributário", value: emitente.crt },
      ]
    : [];

  if (parsedNFs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Building2 className="h-12 w-12 mb-4 text-gray-600" />
        <p className="text-lg font-medium text-gray-400">Nenhuma NF-e processada</p>
        <p className="text-sm mt-1">Faça o upload e processamento dos XMLs primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dados do Emitente */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Dados do Emitente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {emitterFields.map((field) => (
            <EmitterCard key={field.xmlTag} {...field} />
          ))}
        </div>
      </section>

      {/* Operações Identificadas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Operações Identificadas
        </h2>
        {operations.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma operação identificada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {operations.map((op) => {
              const c = getColor(op.color);
              const icon = operationIcons[op.icon] ?? <Package className="h-5 w-5" />;

              return (
                <div
                  key={op.name}
                  className={`relative bg-[#111827] rounded-xl border border-white/5 border-l-[3px] ${c.border} p-5 overflow-hidden`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${c.bg} ${c.text}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">{op.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.badge}`}
                        >
                          {op.count} NF{op.count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(op.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Participantes */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Participantes
        </h2>
        <DataTable columns={participanteColumns} data={participantes} />
      </section>
    </div>
  );
}
