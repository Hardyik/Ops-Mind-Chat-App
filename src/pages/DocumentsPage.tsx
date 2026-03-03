import React, { useState, useCallback, useEffect } from "react";
import { Document, DocumentStatus } from "@/types";
import { documentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Trash2, RefreshCw, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocItem {
  id: string;
  name: string;
  uploadDate: Date;
  pageCount: number;
  status: DocumentStatus;
  size: string;
  totalChunks: number;
  errorMessage?: string;
}

const statusConfig: Record<DocumentStatus, { label: string; color: string; progress: number }> = {
  uploading: { label: "Uploading", color: "bg-blue-500", progress: 10 },
  parsing: { label: "Parsing", color: "bg-blue-500", progress: 30 },
  chunking: { label: "Chunking", color: "bg-yellow-500", progress: 55 },
  embedding: { label: "Embedding", color: "bg-yellow-500", progress: 75 },
  indexed: { label: "Indexed", color: "bg-green-500", progress: 100 },
  error: { label: "Error", color: "bg-red-500", progress: 0 },
};

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pollingIds, setPollingIds] = useState<string[]>([]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Poll processing documents every 2 seconds
  useEffect(() => {
    if (pollingIds.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const updates = await Promise.all(pollingIds.map((id) => documentsApi.getDocumentStatus(id)));
        setDocuments((prev) =>
          prev.map((doc) => {
            const update = updates.find((u) => u.id === doc.id);
            if (update) {
              return { ...doc, status: update.status, pageCount: update.pageCount, totalChunks: update.totalChunks, errorMessage: update.errorMessage };
            }
            return doc;
          })
        );
        // Stop polling docs that are fully indexed or errored
        setPollingIds((ids) =>
          ids.filter((id) => {
            const u = updates.find((u) => u.id === id);
            return u && u.status !== "indexed" && u.status !== "error";
          })
        );
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pollingIds]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getDocuments();
      setDocuments(
        data.documents.map((d: DocItem & { uploadDate: string }) => ({
          ...d,
          uploadDate: new Date(d.uploadDate),
        }))
      );
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) return;

    setUploading(true);
    try {
      const data = await documentsApi.uploadDocuments(pdfFiles);
      const newDocs: DocItem[] = data.documents.map((d: DocItem & { uploadDate: string }) => ({
        ...d,
        uploadDate: new Date(d.uploadDate),
        pageCount: 0,
        totalChunks: 0,
      }));
      setDocuments((prev) => [...newDocs, ...prev]);
      setPollingIds((prev) => [...prev, ...newDocs.map((d) => d.id)]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []));
    e.target.value = ""; // reset input
  };

  const handleDelete = async (id: string) => {
    try {
      await documentsApi.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setPollingIds((prev) => prev.filter((pid) => pid !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await documentsApi.reindexDocument(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: "uploading" as DocumentStatus } : d)));
      setPollingIds((prev) => [...prev, id]);
    } catch (err) {
      console.error("Reindex failed", err);
    }
  };

  const filteredDocs = documents.filter((d) =>
    searchQuery ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
        <p className="text-muted-foreground text-sm">Upload and manage knowledge base documents</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
          }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-foreground font-medium">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Drop PDF files here</p>
            <p className="text-muted-foreground text-sm mt-1">or click to browse</p>
            <label className="mt-3 inline-block cursor-pointer">
              <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileSelect} />
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors">
                Browse Files
              </span>
            </label>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No documents uploaded yet</p>
          <p className="text-sm">Upload PDFs to build your knowledge base</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredDocs.map((doc) => {
              const sc = statusConfig[doc.status];
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                >
                  <Card>
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.pageCount > 0 && `${doc.pageCount} pages • `}
                          {doc.totalChunks > 0 && `${doc.totalChunks} chunks • `}
                          {doc.size} • {doc.uploadDate.toLocaleDateString()}
                        </p>
                        {doc.status !== "indexed" && doc.status !== "error" && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={sc.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-24">{sc.label}...</span>
                          </div>
                        )}
                        {doc.status === "error" && doc.errorMessage && (
                          <p className="text-xs text-destructive mt-1">{doc.errorMessage}</p>
                        )}
                      </div>
                      <Badge
                        variant={doc.status === "indexed" ? "default" : doc.status === "error" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {sc.label}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReindex(doc.id)} title="Re-index">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
