import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[#0a0e1a] border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="relative flex items-center justify-center h-11 w-11 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] shadow-lg shadow-cyan-500/20">
          <span className="text-sm font-bold text-white tracking-tight">CT</span>
        </div>

        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              Config Tributos
            </span>
            <span className="text-gray-400 mx-2">→</span>
            <span className="text-gray-200">Protheus</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Análise fiscal de XMLs e geração de configurações tributárias
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-gray-500 hidden sm:inline">
            Powered by fiscal engine
          </span>
        </div>
      </div>
    </header>
  );
}
