
import React from 'react';
import type { AnalyzedEntry } from '../types';
import { SparklesIcon } from '../constants';

interface AnalyzedEntryCardProps {
  entry: AnalyzedEntry;
}

export const AnalyzedEntryCard: React.FC<AnalyzedEntryCardProps> = ({ entry }) => {
  return (
    <div className="bg-slate-750 border border-slate-700 p-4 rounded-lg shadow-lg hover:shadow-sky-500/20 transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-sky-300">{entry.journalEntry.filename}</h3>
        <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Original Upload:</strong> {new Date(entry.journalEntry.timestamp).toLocaleString()}
        </p>
         <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Analyzed:</strong> {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>

      <div className="mb-3 p-3 bg-slate-800 rounded">
        <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center">
          <SparklesIcon className="w-4 h-4 mr-2 text-yellow-400" />
          AI Insights:
        </h4>
        <p className="text-sm text-slate-300">
          <strong className="font-medium">Emotion:</strong> <span className="text-yellow-300">{entry.emotion}</span>
        </p>
        <p className="text-sm text-slate-300">
          <strong className="font-medium">Key Qualities:</strong>
          <span className="text-yellow-300"> {entry.qualities.join(', ')}</span>
        </p>
      </div>

      {entry.summary && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-slate-300">AI Summary:</h4>
          <p className="text-xs text-slate-400 italic">{entry.summary}</p>
        </div>
      )}

      <details className="text-xs text-slate-500 cursor-pointer">
        <summary className="focus:outline-none hover:text-slate-300">View original content snippet</summary>
        <p className="mt-2 p-2 bg-slate-800/50 rounded whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
          {entry.journalEntry.content.substring(0, 500)}{entry.journalEntry.content.length > 500 ? '...' : ''}
        </p>
      </details>
    </div>
  );
};
