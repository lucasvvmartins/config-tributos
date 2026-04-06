import { useAppStore } from "@/hooks/useAppStore";
import { Header } from "@/components/layout/Header";
import { StatsBar } from "@/components/layout/StatsBar";
import { TabNav } from "@/components/layout/TabNav";
import UploadPage from "@/pages/UploadPage";
import VisaoPage from "@/pages/VisaoPage";
import AnalisePage from "@/pages/AnalisePage";
import MapeamentoPage from "@/pages/MapeamentoPage";
import SugestoesPage from "@/pages/SugestoesPage";
import PrwPage from "@/pages/PrwPage";

export default function App() {
  const { activeTab, parsedNFs } = useAppStore();

  return (
    <div className="min-h-screen">
      <Header />
      {parsedNFs.length > 0 && <StatsBar />}
      <TabNav />
      <main className="max-w-[1400px] mx-auto px-4 pb-8">
        {activeTab === "upload" && <UploadPage />}
        {activeTab === "visao" && <VisaoPage />}
        {activeTab === "analise" && <AnalisePage />}
        {activeTab === "mapeamento" && <MapeamentoPage />}
        {activeTab === "sugestoes" && <SugestoesPage />}
        {activeTab === "prw" && <PrwPage />}
      </main>
    </div>
  );
}
