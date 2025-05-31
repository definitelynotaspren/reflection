
import React from 'react';
import type { JournalEntry } from '../types';

interface JournalEntryDisplayProps {
  entry: JournalEntry;
}

export const JournalEntryDisplay: React.FC<JournalEntryDisplayProps> = ({ entry }) => {
  return (
    <div className="bg-slate-700 p-4 rounded-lg shadow">
      <h4 className="font-semibold text-sky-300">{entry.filename}</h4>
      <p className="text-xs text-slate-400 mb-2">Uploaded: {entry.timestamp.toLocaleDateString()}</p>
      <p className="text-sm text-slate-300 whitespace-pre-wrap truncate max-h-20">
        {entry.content.substring(0, 150)}...
      </p>
    </div>
  );
};
