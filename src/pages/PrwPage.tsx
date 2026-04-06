import { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Copy, Download, FileCode, Check } from "lucide-react";
import type { NFeParsed, TESConfig, FiscalRule } from "@/lib/types";

function generatePrwCode(
  parsedNFs: NFeParsed[],
  tes: TESConfig[],
  fiscalRules: FiscalRule[]
): string {
  const _cfopList = tes.map((t) => `"${t.cfop}"`).join(", ");
  const tesCases = tes
    .map(
      (t) =>
        `      Case "${t.cfop}"\n` +
        `         cCodTES := fBuscaTES("${t.cfop}", "${t.cstIcms}", "${t.cstIpi}")\n` +
        `         If Empty(cCodTES)\n` +
        `            cCodTES := fProxCodTES()\n` +
        `            fCriaTES(cCodTES, "${t.tipo}", "${t.cfop}", "${t.descricao}", "${t.cstIcms}", "${t.cstIpi}", "${t.cstPis}", "${t.cstCofins}")\n` +
        `         EndIf`
    )
    .join("\n");

  const distinctUFs = [...new Set(parsedNFs.map((nf) => nf.emit.endereco.uf))];
  const ufComment = distinctUFs.length > 0 ? distinctUFs.join(", ") : "SP";

  return `#Include "TOTVS.ch"
#Include "TopConn.ch"
#Include "TBIConn.ch"

/*/{Protheus.doc} U_CFGTRIB
Configurador de Tributos - Importacao automatica de XMLs de NF-e
para criacao de TES, fornecedores e produtos no Protheus.

Gerado automaticamente pela ferramenta Config Tributos.

@type  Function
@author Config Tributos
@since ${new Date().toLocaleDateString("pt-BR")}
@version 1.0
@obs    UFs identificadas nos XMLs: ${ufComment}
        Total de ${parsedNFs.length} NF-e(s) processada(s)
        Total de ${tes.length} TES configurada(s)
        Total de ${fiscalRules.length} regra(s) fiscal(is)
/*/
User Function U_CFGTRIB()

   Local aFiles   := {}
   Local cDir     := ""
   Local cFile    := ""
   Local nI       := 0
   Local nErros   := 0
   Local nSucess  := 0
   Local oXml     := Nil
   Local cXmlText := ""
   Local cChave   := ""
   Local cCNPJ    := ""
   Local cNome    := ""
   Local cUF      := ""
   Local cIE      := ""
   Local cCFOP    := ""
   Local cNCM     := ""
   Local cCodTES  := ""
   Local cCodFor  := ""
   Local cLoja    := ""
   Local cCodPrd  := ""

   //-- Seleciona diretorio com XMLs
   cDir := cGetFile("Arquivos XML (*.xml)|*.xml|Todos (*.*)|*.*", ;
                     "Selecione os XMLs de NF-e", , "C:\\\\", .F., GETF_MULTISELECT)

   If Empty(cDir)
      MsgAlert("Nenhum arquivo selecionado.", "Atencao")
      Return
   EndIf

   //-- Monta array de arquivos
   aDir(cDir, aFiles)

   If Len(aFiles) == 0
      MsgAlert("Nenhum arquivo XML encontrado.", "Atencao")
      Return
   EndIf

   Processa({|| fProcessaXMLs(aFiles, @nSucess, @nErros)}, "Processando XMLs...")

   MsgInfo("Processamento concluido!" + CRLF + ;
           "Sucesso: " + cValToChar(nSucess) + CRLF + ;
           "Erros: " + cValToChar(nErros), "Resultado")

Return

/*/{Protheus.doc} fProcessaXMLs
Processa array de arquivos XML, criando TES, fornecedores e produtos.
@type  Static Function
/*/
Static Function fProcessaXMLs(aFiles, nSucess, nErros)

   Local nI       := 0
   Local oXml     := Nil
   Local cXmlText := ""
   Local cChave   := ""
   Local cCNPJ    := ""
   Local cNome    := ""
   Local cUF      := ""
   Local cIE      := ""
   Local cCFOP    := ""
   Local cNCM     := ""
   Local cCodTES  := ""
   Local cCodFor  := ""
   Local cLoja    := ""
   Local cCodPrd  := ""
   Local cProdNm  := ""
   Local cUnidade := ""
   Local nTotal   := Len(aFiles)

   ProcRegua(nTotal)

   For nI := 1 To nTotal
      IncProc("Processando XML " + cValToChar(nI) + " de " + cValToChar(nTotal) + "...")

      cXmlText := MemoRead(aFiles[nI])

      If Empty(cXmlText)
         nErros++
         ConOut("[CFGTRIB] Erro ao ler arquivo: " + aFiles[nI])
         Loop
      EndIf

      //-- Parse XML
      oXml := TXmlManager():New()

      If !oXml:Parse(cXmlText)
         nErros++
         ConOut("[CFGTRIB] Erro ao parsear XML: " + aFiles[nI])
         FreeObj(oXml)
         Loop
      EndIf

      Begin Transaction

      //-- Dados da NF-e
      cChave := oXml:XPathGetNodeValue("//protNFe/infProt/chNFe")
      cCNPJ  := oXml:XPathGetNodeValue("//emit/CNPJ")
      cNome  := oXml:XPathGetNodeValue("//emit/xNome")
      cUF    := oXml:XPathGetNodeValue("//emit/enderEmit/UF")
      cIE    := oXml:XPathGetNodeValue("//emit/IE")

      //-- Cria/atualiza fornecedor
      cCodFor := fCriaFornecedor(cCNPJ, cNome, cUF, cIE, @cLoja)

      If Empty(cCodFor)
         nErros++
         ConOut("[CFGTRIB] Erro ao criar fornecedor CNPJ: " + cCNPJ)
         DisarmTransaction()
         FreeObj(oXml)
         Loop
      EndIf

      //-- Processa itens
      Local nItem  := 0
      Local nItens := Val(oXml:XPathGetNodeValue("count(//det)"))

      For nItem := 1 To nItens
         cCFOP    := oXml:XPathGetNodeValue("//det[" + cValToChar(nItem) + "]/prod/CFOP")
         cNCM     := oXml:XPathGetNodeValue("//det[" + cValToChar(nItem) + "]/prod/NCM")
         cProdNm  := oXml:XPathGetNodeValue("//det[" + cValToChar(nItem) + "]/prod/xProd")
         cUnidade := oXml:XPathGetNodeValue("//det[" + cValToChar(nItem) + "]/prod/uCom")

         //-- Configura TES baseado no CFOP
         Do Case
${tesCases}
         Otherwise
            cCodTES := fBuscaTES(cCFOP, "", "")
            If Empty(cCodTES)
               cCodTES := fProxCodTES()
               fCriaTES(cCodTES, "E", cCFOP, "TES CFOP " + cCFOP, "", "", "", "")
            EndIf
         EndCase

         //-- Cria produto se nao existir
         cCodPrd := fCriaProduto(cNCM, cProdNm, cUnidade)

      Next nItem

      End Transaction

      nSucess++
      FreeObj(oXml)

   Next nI

Return

/*/{Protheus.doc} fBuscaTES
Busca TES existente por CFOP e CSTs de ICMS/IPI.
@type  Static Function
@param cCFOP,    Character, Codigo CFOP
@param cCstICMS, Character, CST do ICMS
@param cCstIPI,  Character, CST do IPI
@return Character - Codigo da TES encontrada ou vazio
/*/
Static Function fBuscaTES(cCFOP, cCstICMS, cCstIPI)

   Local cCodTES := ""
   Local cAlias  := GetNextAlias()

   BeginSql Alias cAlias
      SELECT F4_CODIGO
      FROM %Table:SF4% SF4
      WHERE SF4.F4_CF = %Exp:cCFOP%
        AND SF4.%NotDel%
      ORDER BY F4_CODIGO
   EndSql

   If !(cAlias)->(Eof())
      cCodTES := (cAlias)->F4_CODIGO
   EndIf

   (cAlias)->(dbCloseArea())

Return cCodTES

/*/{Protheus.doc} fProxCodTES
Retorna o proximo codigo sequencial para TES.
@type  Static Function
@return Character - Proximo codigo TES disponivel
/*/
Static Function fProxCodTES()

   Local cCod   := ""
   Local cAlias := GetNextAlias()

   BeginSql Alias cAlias
      SELECT MAX(F4_CODIGO) AS MAXCOD
      FROM %Table:SF4% SF4
      WHERE SF4.%NotDel%
   EndSql

   If !(cAlias)->(Eof()) .And. !Empty((cAlias)->MAXCOD)
      cCod := Soma1(AllTrim((cAlias)->MAXCOD))
   Else
      cCod := "001"
   EndIf

   (cAlias)->(dbCloseArea())

Return cCod

/*/{Protheus.doc} fCriaTES
Cria novo registro de TES na tabela SF4.
@type  Static Function
/*/
Static Function fCriaTES(cCodTES, cTipo, cCFOP, cDescr, cCstICMS, cCstIPI, cCstPIS, cCstCOF)

   DbSelectArea("SF4")
   SF4->(dbSetOrder(1))

   If !SF4->(dbSeek(xFilial("SF4") + cCodTES))
      RecLock("SF4", .T.)
         SF4->F4_CODIGO  := cCodTES
         SF4->F4_TIPO    := cTipo
         SF4->F4_CF      := cCFOP
         SF4->F4_TEXTO   := SubStr(cDescr, 1, 40)
         SF4->F4_CSTICM  := cCstICMS
         SF4->F4_CSTIPI  := cCstIPI
         SF4->F4_CSTPIS  := cCstPIS
         SF4->F4_CSTCOF  := cCstCOF
         SF4->F4_ESTOQUE := "S"
         SF4->F4_DUPLIC  := "S"
      SF4->(MsUnlock())
      ConOut("[CFGTRIB] TES criada: " + cCodTES + " CFOP " + cCFOP)
   EndIf

Return

/*/{Protheus.doc} fCriaFornecedor
Cria ou busca fornecedor na tabela SA2 pelo CNPJ.
@type  Static Function
@param cCNPJ,  Character, CNPJ do fornecedor
@param cNome,  Character, Razao social
@param cUF,    Character, Unidade federativa
@param cIE,    Character, Inscricao estadual
@param cLoja,  Character, Codigo da loja (retorno por referencia)
@return Character - Codigo do fornecedor
/*/
Static Function fCriaFornecedor(cCNPJ, cNome, cUF, cIE, cLoja)

   Local cCodFor := ""
   Local cAlias  := GetNextAlias()

   //-- Busca fornecedor existente
   BeginSql Alias cAlias
      SELECT A2_COD, A2_LOJA
      FROM %Table:SA2% SA2
      WHERE SA2.A2_CGC = %Exp:cCNPJ%
        AND SA2.%NotDel%
      ORDER BY A2_COD
   EndSql

   If !(cAlias)->(Eof())
      cCodFor := (cAlias)->A2_COD
      cLoja   := (cAlias)->A2_LOJA
      (cAlias)->(dbCloseArea())
      Return cCodFor
   EndIf

   (cAlias)->(dbCloseArea())

   //-- Cria novo fornecedor
   cCodFor := GetSXENum("SA2", "A2_COD")
   cLoja   := "01"

   DbSelectArea("SA2")
   RecLock("SA2", .T.)
      SA2->A2_COD    := cCodFor
      SA2->A2_LOJA   := cLoja
      SA2->A2_NOME   := SubStr(AllTrim(cNome), 1, 40)
      SA2->A2_NREDUZ := SubStr(AllTrim(cNome), 1, 20)
      SA2->A2_CGC    := cCNPJ
      SA2->A2_INSCR  := cIE
      SA2->A2_EST    := cUF
      SA2->A2_TIPO   := "J"
   SA2->(MsUnlock())

   ConfirmSX8()

   ConOut("[CFGTRIB] Fornecedor criado: " + cCodFor + " - " + AllTrim(cNome))

Return cCodFor

/*/{Protheus.doc} fCriaProduto
Cria ou busca produto na tabela SB1 pelo NCM.
@type  Static Function
@param cNCM,     Character, Codigo NCM
@param cDescri,  Character, Descricao do produto
@param cUnidade, Character, Unidade de medida
@return Character - Codigo do produto
/*/
Static Function fCriaProduto(cNCM, cDescri, cUnidade)

   Local cCodPrd := ""
   Local cAlias  := GetNextAlias()

   //-- Busca produto existente pelo NCM + descricao
   BeginSql Alias cAlias
      SELECT B1_COD
      FROM %Table:SB1% SB1
      WHERE SB1.B1_POSIPI = %Exp:cNCM%
        AND SB1.%NotDel%
      ORDER BY B1_COD
   EndSql

   If !(cAlias)->(Eof())
      cCodPrd := (cAlias)->B1_COD
      (cAlias)->(dbCloseArea())
      Return cCodPrd
   EndIf

   (cAlias)->(dbCloseArea())

   //-- Cria novo produto
   cCodPrd := GetSXENum("SB1", "B1_COD")

   DbSelectArea("SB1")
   RecLock("SB1", .T.)
      SB1->B1_COD     := cCodPrd
      SB1->B1_DESC    := SubStr(AllTrim(cDescri), 1, 30)
      SB1->B1_TIPO    := "MC"
      SB1->B1_UM      := SubStr(AllTrim(cUnidade), 1, 2)
      SB1->B1_LOCPAD  := "01"
      SB1->B1_POSIPI  := cNCM
      SB1->B1_ORIGEM  := "0"
   SB1->(MsUnlock())

   ConfirmSX8()

   ConOut("[CFGTRIB] Produto criado: " + cCodPrd + " NCM " + cNCM)

Return cCodPrd
`;
}

export default function PrwPage() {
  const { parsedNFs, tes, fiscalRules } = useAppStore();
  const [copied, setCopied] = useState(false);

  const code = generatePrwCode(parsedNFs, tes, fiscalRules);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CFGTRIB.PRW";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card accent>
        <div className="flex items-start gap-3">
          <FileCode className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Codigo ADVPL - CFGTRIB.PRW
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Fonte ADVPL gerado automaticamente com base nos XMLs processados.
              Este programa cria as TES, fornecedores e produtos necessarios no
              Protheus, utilizando os CFOPs e CSTs identificados nas notas
              fiscais. Revise o codigo antes de compilar no ambiente de
              producao.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{parsedNFs.length} NF-e(s)</span>
              <span className="text-gray-600">|</span>
              <span>{tes.length} TES</span>
              <span className="text-gray-600">|</span>
              <span>{fiscalRules.length} regras fiscais</span>
              <span className="text-gray-600">|</span>
              <span>{lines.length} linhas</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            copied
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar Codigo
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
        >
          <Download className="h-4 w-4" />
          Download .PRW
        </button>
      </div>

      {/* Code block */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0e1a] border-b border-white/5">
          <span className="text-xs text-gray-500 font-mono">CFGTRIB.PRW</span>
          <span className="text-xs text-gray-600">{lines.length} linhas</span>
        </div>
        <div className="overflow-x-auto bg-[#080c14] max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="select-none text-right pr-4 pl-4 py-0 text-[11px] text-gray-600 font-mono leading-5 w-12 align-top">
                    {i + 1}
                  </td>
                  <td className="pr-4 py-0 text-[13px] text-gray-300 font-mono leading-5 whitespace-pre">
                    {line}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
