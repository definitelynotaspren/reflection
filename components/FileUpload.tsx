
import React, { useCallback, useState } from 'react';
import type { JournalEntry } from '../types';
import { UploadIcon } from '../constants';

interface FileUploadProps {
  onFilesUpload: (entries: JournalEntry[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, disabled }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await processFiles(event.target.files);
    }
  }, [onFilesUpload]);

  const processFiles = useCallback(async (files: FileList) => {
    const journalEntries: JournalEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.md') || file.type === 'text/markdown') {
        const content = await file.text();
        journalEntries.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2,9)}-${file.name}`,
          filename: file.name,
          content,
          timestamp: new Date(),
        });
      }
    }
    if (journalEntries.length > 0) {
      onFilesUpload(journalEntries);
    }
  }, [onFilesUpload]);


  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);


  return (
    <div 
      className={`border-2 ${dragActive ? 'border-sky-500 bg-slate-700' : 'border-slate-600 border-dashed'} rounded-lg p-8 text-center transition-colors duration-200 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-sky-400'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-sky-400' : 'text-slate-500'}`} />
      <input
        type="file"
        id="fileUpload"
        multiple
        accept=".md,text/markdown"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <label
        htmlFor="fileUpload"
        className={`font-medium ${disabled ? 'text-slate-500' : 'text-sky-400 hover:text-sky-300 cursor-pointer'}`}
      >
        {dragActive ? "Drop your markdown files here" : "Choose .md files"}
      </label>
      <p className="mt-2 text-xs text-slate-500">or drag and drop</p>
      {disabled && <p className="mt-2 text-xs text-yellow-400">File upload is disabled (e.g. API key missing or processing).</p>}
    </div>
  );
};
