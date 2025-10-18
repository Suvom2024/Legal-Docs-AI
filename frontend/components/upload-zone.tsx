"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface UploadZoneProps {
  onUploadSuccess?: (data: any) => void
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): boolean => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx or .pdf file",
        variant: "destructive",
      })
      return false
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        const file = files[0]
        if (validateFile(file)) {
          setSelectedFile(file)
        }
      }
    },
    [toast],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const result = await apiClient.uploadDocument(selectedFile)

      toast({
        title: "Upload successful",
        description: result.message,
      })

      if (onUploadSuccess) {
        onUploadSuccess(result)
      }

      // Reset
      setSelectedFile(null)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="w-full mx-auto space-y-6">
      <Card
        className={`relative border-2 border-dashed transition-all duration-300 ${
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.01] shadow-lg" 
            : "border-border hover:border-primary/50 hover:bg-accent/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-20 text-center">
          <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-8 transition-all ${
            isDragging 
              ? "bg-primary/20 ring-4 ring-primary/30" 
              : "bg-muted"
          }`}>
            <Upload className={`h-12 w-12 transition-colors ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`} />
          </div>
          <h3 className="text-3xl font-bold mb-4">Upload Legal Document</h3>
          <p className="text-lg text-muted-foreground mb-3 font-medium">
            Drag and drop your document here, or click to browse
          </p>
          <p className="text-base text-muted-foreground mb-10">
            Supported formats: <span className="font-semibold">.docx, .pdf</span> • Max size: <span className="font-semibold">10MB</span>
          </p>
          <input type="file" id="file-upload" className="hidden" accept=".docx,.pdf" onChange={handleFileSelect} />
          <Button asChild size="lg" variant="outline" className="min-w-[240px] h-12 text-base font-semibold">
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="mr-2 h-5 w-5" />
              Browse Files
            </label>
          </Button>
        </div>
      </Card>

      {selectedFile && (
        <Card className="p-8 border-2 border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xl truncate mb-2">{selectedFile.name}</p>
                <p className="text-base text-muted-foreground font-medium">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading} 
                size="lg"
                className="flex-1 sm:flex-none min-w-[160px] h-12 text-base font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload
                  </>
                )}
              </Button>
              <Button 
                onClick={handleRemoveFile} 
                variant="outline" 
                size="lg"
                className="px-5 h-12"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
