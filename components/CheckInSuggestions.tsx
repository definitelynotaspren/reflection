
import React from 'react';
import type { CheckInSuggestionItem } from '../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from '../constants';

interface CheckInSuggestionsProps {
  suggestions: CheckInSuggestionItem[];
  onSchedule: (suggestion: CheckInSuggestionItem) => void;
  onDismiss: (suggestionId: string) => void;
}

export const CheckInSuggestions: React.FC<CheckInSuggestionsProps> = ({ suggestions, onSchedule, onDismiss }) => {
  if (suggestions.length === 0) {
    return <p className="text-slate-400 text-center py-4">No new check-in suggestions available at the moment. Try analyzing more entries or check back later.</p>;
  }

  return (
    <div className="space-y-4">
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="bg-slate-750 border border-slate-700 p-4 rounded-lg shadow-md hover:shadow-cyan-500/20 transition-shadow duration-200">
          <div className="flex items-center mb-2">
            <SparklesIcon className="w-5 h-5 text-cyan-400 mr-2 flex-shrink-0" />
            <p className="text-md font-medium text-slate-200">{suggestion.question}</p>
          </div>
          <div className="text-xs text-slate-400 mb-3">
            <p>Based on insight: Emotion <span className="font-semibold text-cyan-300">{suggestion.relatedEmotion}</span>, Qualities: <span className="font-semibold text-cyan-300">{suggestion.relatedQualities.join(', ')}</span></p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => onSchedule(suggestion)}
              className="flex items-center text-sm bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-md shadow transition duration-150"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1.5" /> Schedule
            </button>
            <button
              onClick={() => onDismiss(suggestion.id)}
              className="flex items-center text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 py-1.5 px-3 rounded-md shadow transition duration-150"
            >
              <XCircleIcon className="w-4 h-4 mr-1.5" /> Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
