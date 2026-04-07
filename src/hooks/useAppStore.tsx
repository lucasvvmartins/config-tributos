import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { NFeParsed, TESConfig, FiscalRule, FinancialRule, FiscalProfile, ProductInfo, Suggestion, Participante, OperationType, PerfilOperacao, PerfilOrigemDestino, PerfilProduto, PerfilParticipante, RegraBase, RegraAliquota, RegraCalculo } from "@/lib/types";
import { parseNFe } from "@/lib/xml-parser";
import * as engine from "@/lib/rules-engine";

interface AppState {
  filesEntrada: File[];
  filesSaida: File[];
  parsedNFs: NFeParsed[];
  isProcessing: boolean;
  activeTab: string;
  // Derived data
  tes: TESConfig[];
  fiscalRules: FiscalRule[];
  financialRules: FinancialRule[];
  stockRules: { cfop: string; atualizaEstoque: boolean; geraDuplicata: boolean; poderTerceiro: boolean; descricao: string }[];
  perfisOperacao: PerfilOperacao[];
  perfisOrigemDestino: PerfilOrigemDestino[];
  perfisProduto: PerfilProduto[];
  perfisParticipante: PerfilParticipante[];
  regrasBase: RegraBase[];
  regrasAliquota: RegraAliquota[];
  regrasCalculo: RegraCalculo[];
  profiles: FiscalProfile[];
  products: ProductInfo[];
  suggestions: Suggestion[];
  participantes: Participante[];
  operations: OperationType[];
}

interface AppActions {
  addFiles: (files: File[], tipo: "entrada" | "saida") => void;
  removeFile: (name: string, tipo: "entrada" | "saida") => void;
  clearFiles: () => void;
  processFiles: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}

type AppStore = AppState & AppActions;

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    filesEntrada: [],
    filesSaida: [],
    parsedNFs: [],
    isProcessing: false,
    activeTab: "upload",
    tes: [],
    fiscalRules: [],
    financialRules: [],
    stockRules: [],
    perfisOperacao: [],
    perfisOrigemDestino: [],
    perfisProduto: [],
    perfisParticipante: [],
    regrasBase: [],
    regrasAliquota: [],
    regrasCalculo: [],
    profiles: [],
    products: [],
    suggestions: [],
    participantes: [],
    operations: [],
  });

  const addFiles = useCallback((files: File[], tipo: "entrada" | "saida") => {
    setState(prev => {
      const key = tipo === "entrada" ? "filesEntrada" : "filesSaida";
      const existing = prev[key].map(f => f.name);
      const newFiles = Array.from(files).filter(f => f.name.endsWith(".xml") && !existing.includes(f.name));
      return { ...prev, [key]: [...prev[key], ...newFiles] };
    });
  }, []);

  const removeFile = useCallback((name: string, tipo: "entrada" | "saida") => {
    setState(prev => {
      const key = tipo === "entrada" ? "filesEntrada" : "filesSaida";
      return { ...prev, [key]: prev[key].filter(f => f.name !== name) };
    });
  }, []);

  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      filesEntrada: [],
      filesSaida: [],
      parsedNFs: [],
      tes: [],
      fiscalRules: [],
      financialRules: [],
      stockRules: [],
      perfisOperacao: [],
      perfisOrigemDestino: [],
      perfisProduto: [],
      perfisParticipante: [],
      regrasBase: [],
      regrasAliquota: [],
      regrasCalculo: [],
      profiles: [],
      products: [],
      suggestions: [],
      participantes: [],
      operations: [],
    }));
  }, []);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFiles = useCallback(async () => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const allNFs: NFeParsed[] = [];

      for (const file of state.filesEntrada) {
        const xml = await readFile(file);
        const nf = parseNFe(xml);
        if (nf) {
          nf.tipoOrigem = "entrada";
          allNFs.push(nf);
        }
      }

      for (const file of state.filesSaida) {
        const xml = await readFile(file);
        const nf = parseNFe(xml);
        if (nf) {
          nf.tipoOrigem = "saida";
          allNFs.push(nf);
        }
      }

      setState(prev => ({
        ...prev,
        parsedNFs: allNFs,
        isProcessing: false,
        activeTab: "visao",
        tes: engine.generateTES(allNFs),
        fiscalRules: engine.generateFiscalRules(allNFs),
        financialRules: engine.generateFinancialRules(allNFs),
        stockRules: engine.generateStockRules(allNFs),
        perfisOperacao: engine.generatePerfisOperacao(allNFs),
        perfisOrigemDestino: engine.generatePerfisOrigemDestino(allNFs),
        perfisProduto: engine.generatePerfisProduto(allNFs),
        perfisParticipante: engine.generatePerfisParticipante(allNFs),
        regrasBase: engine.generateRegrasBase(allNFs),
        regrasAliquota: engine.generateRegrasAliquota(allNFs),
        regrasCalculo: engine.generateRegrasCalculo(allNFs),
        profiles: engine.generateProfiles(allNFs),
        products: engine.generateProducts(allNFs),
        suggestions: engine.generateSuggestions(allNFs),
        participantes: engine.generateParticipantes(allNFs),
        operations: engine.generateOperations(allNFs),
      }));
    } catch (error) {
      console.error("Error processing files:", error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.filesEntrada, state.filesSaida]);

  const setActiveTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const store: AppStore = {
    ...state,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    setActiveTab,
  };

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
