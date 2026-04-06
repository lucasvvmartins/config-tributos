import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";
import {
  Upload,
  LayoutDashboard,
  Search,
  Map,
  Lightbulb,
  Code,
} from "lucide-react";

const tabs = [
  { id: "upload", label: "Upload XMLs", icon: Upload },
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "analise", label: "Análise Fiscal", icon: Search },
  { id: "mapeamento", label: "Mapeamento Protheus", icon: Map },
  { id: "sugestoes", label: "Sugestões", icon: Lightbulb },
  { id: "gerar", label: "Gerar PRW", icon: Code },
] as const;

export function TabNav() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="px-6 max-w-7xl mx-auto">
      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                isActive
                  ? "bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white shadow-lg shadow-cyan-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
