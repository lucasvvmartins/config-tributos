import { useAppStore } from "@/hooks/useAppStore";
import { FileText, Package, ArrowRightLeft, Hash, Lightbulb } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="relative flex-1 min-w-[140px] bg-[#111827] rounded-lg border border-white/5 px-4 py-3 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]" />
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <div>
          <p className="text-xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent leading-tight">
            {value.toLocaleString("pt-BR")}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function StatsBar() {
  const { parsedNFs, tes } = useAppStore();

  const totalItems = parsedNFs.reduce((sum, nf) => sum + nf.itens.length, 0);

  const distinctCFOPs = new Set(
    parsedNFs.flatMap((nf) => nf.itens.map((item) => item.prod.cfop))
  ).size;

  const distinctNCMs = new Set(
    parsedNFs.flatMap((nf) => nf.itens.map((item) => item.prod.ncm))
  ).size;

  return (
    <div className="flex flex-wrap gap-3 px-6 py-4 max-w-7xl mx-auto">
      <StatCard
        label="Total NFs"
        value={parsedNFs.length}
        icon={<FileText className="h-4 w-4" />}
      />
      <StatCard
        label="Total Itens"
        value={totalItems}
        icon={<Package className="h-4 w-4" />}
      />
      <StatCard
        label="CFOPs Distintos"
        value={distinctCFOPs}
        icon={<ArrowRightLeft className="h-4 w-4" />}
      />
      <StatCard
        label="NCMs Distintos"
        value={distinctNCMs}
        icon={<Hash className="h-4 w-4" />}
      />
      <StatCard
        label="Sugestões TES"
        value={tes.length}
        icon={<Lightbulb className="h-4 w-4" />}
      />
    </div>
  );
}
