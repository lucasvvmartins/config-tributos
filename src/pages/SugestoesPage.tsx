import { useState, useMemo } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { CheckCircle, Info, AlertTriangle, XCircle, ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
import type { Suggestion } from "@/lib/types";

const typeOrder: Record<Suggestion["type"], number> = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const typeConfig: Record<
  Suggestion["type"],
  { border: string; bg: string; text: string; icon: typeof CheckCircle; label: string }
> = {
  success: {
    border: "border-l-green-500",
    bg: "bg-green-500/10",
    text: "text-green-400",
    icon: CheckCircle,
    label: "Sucesso",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    icon: Info,
    label: "Informação",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    icon: AlertTriangle,
    label: "Alerta",
  },
  error: {
    border: "border-l-red-500",
    bg: "bg-red-500/10",
    text: "text-red-400",
    icon: XCircle,
    label: "Erro",
  },
};

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "border-l-4 !pl-5",
        config.border
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full",
            config.bg
          )}
        >
          <Icon className={cn("h-5 w-5", config.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">{suggestion.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{suggestion.description}</p>

          {suggestion.details && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Ver detalhes
              </button>

              {expanded && (
                <div className="mt-2 rounded-lg bg-[#080c14] border border-white/5 p-3 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                    {suggestion.details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SugestoesPage() {
  const { suggestions } = useAppStore();

  const sorted = useMemo(
    () => [...suggestions].sort((a, b) => typeOrder[a.type] - typeOrder[b.type]),
    [suggestions]
  );

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0, success: 0 };
    suggestions.forEach((s) => c[s.type]++);
    return c;
  }, [suggestions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Lightbulb className="h-4 w-4" />
          <span>
            {suggestions.length} sugest{suggestions.length !== 1 ? "ões" : "ão"}{" "}
            encontrada{suggestions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {suggestions.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            {counts.error > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 rounded-full px-2.5 py-1">
                <XCircle className="h-3 w-3" />
                {counts.error}
              </span>
            )}
            {counts.warning > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 rounded-full px-2.5 py-1">
                <AlertTriangle className="h-3 w-3" />
                {counts.warning}
              </span>
            )}
            {counts.info > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 rounded-full px-2.5 py-1">
                <Info className="h-3 w-3" />
                {counts.info}
              </span>
            )}
            {counts.success > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 rounded-full px-2.5 py-1">
                <CheckCircle className="h-3 w-3" />
                {counts.success}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestion list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Nenhuma sugestão disponível. Processe XMLs para gerar sugestões.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
