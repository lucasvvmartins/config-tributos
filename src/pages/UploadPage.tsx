import { useCallback, useRef, useState, type DragEvent } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";
import { Upload, X, FileText, Loader2, Trash2, ArrowRight } from "lucide-react";

function DropZone({
  label,
  files,
  tipo,
  onAdd,
  onRemove,
}: {
  label: string;
  files: File[];
  tipo: "entrada" | "saida";
  onAdd: (files: File[], tipo: "entrada" | "saida") => void;
  onRemove: (name: string, tipo: "entrada" | "saida") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) onAdd(droppedFiles, tipo);
    },
    [onAdd, tipo]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      onAdd(Array.from(selected), tipo);
    }
    e.target.value = "";
  };

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{label}</h3>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200",
          dragOver
            ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_24px_-4px_rgba(6,182,212,0.3)]"
            : "border-white/10 bg-[#111827]/60 hover:border-white/20 hover:bg-[#111827]/80"
        )}
      >
        <Upload
          className={cn(
            "h-8 w-8 transition-colors",
            dragOver ? "text-cyan-400" : "text-gray-500"
          )}
        />
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Arraste arquivos XML ou{" "}
            <span className="text-cyan-400 underline underline-offset-2">
              clique para selecionar
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-600">Apenas arquivos .xml</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file) => (
            <span
              key={file.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300 border border-white/5"
            >
              <FileText className="h-3 w-3 text-gray-500 shrink-0" />
              <span className="truncate max-w-[140px]">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.name, tipo);
                }}
                className="ml-0.5 rounded-full p-0.5 text-gray-500 hover:bg-white/10 hover:text-gray-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const {
    filesEntrada,
    filesSaida,
    isProcessing,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
  } = useAppStore();

  const totalFiles = filesEntrada.length + filesSaida.length;
  const hasFiles = totalFiles > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 md:flex-row">
        <DropZone
          label="XMLs de Entrada"
          files={filesEntrada}
          tipo="entrada"
          onAdd={addFiles}
          onRemove={removeFile}
        />

        <div className="hidden md:flex items-center justify-center px-2">
          <ArrowRight className="h-5 w-5 text-gray-600" />
        </div>

        <DropZone
          label="XMLs de Saída"
          files={filesSaida}
          tipo="saida"
          onAdd={addFiles}
          onRemove={removeFile}
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          disabled={!hasFiles || isProcessing}
          onClick={processFiles}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all",
            hasFiles && !isProcessing
              ? "bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-lg shadow-cyan-500/20"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Processar XMLs"
          )}
        </button>

        {hasFiles && (
          <button
            onClick={clearFiles}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:border-white/20 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar Tudo
          </button>
        )}

        {hasFiles && (
          <span className="ml-auto text-xs text-gray-500">
            {totalFiles} arquivo{totalFiles !== 1 ? "s" : ""} selecionado
            {totalFiles !== 1 ? "s" : ""}
            {filesEntrada.length > 0 && (
              <span className="ml-1">({filesEntrada.length} entrada</span>
            )}
            {filesSaida.length > 0 && (
              <span>
                {filesEntrada.length > 0 ? ", " : "("}
                {filesSaida.length} saída)
              </span>
            )}
            {filesEntrada.length > 0 && filesSaida.length === 0 && ")"}
          </span>
        )}
      </div>
    </div>
  );
}
