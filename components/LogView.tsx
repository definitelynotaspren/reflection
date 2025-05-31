
import React from 'react';
import type { AnalyzedEntry } from '../types';
import { AnalyzedEntryCard } from './AnalyzedEntryCard';

interface LogViewProps {
  entries: AnalyzedEntry[];
}

export const LogView: React.FC<LogViewProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <p className="text-slate-400 text-center py-8">No journal entries have been analyzed yet. Upload and process some entries to see your insights log.</p>;
  }

  return (
    <div className="space-y-6">
      {entries.map(entry => (
        <AnalyzedEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};
