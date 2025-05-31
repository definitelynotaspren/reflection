
import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { JournalEntryDisplay } from './components/JournalEntryDisplay';
import { LogView } from './components/LogView';
import { CheckInSuggestions } from './components/CheckInSuggestions';
import { ScheduledCheckIns } from './components/ScheduledCheckIns';
import { ApiKeyDisplay } from './components/ApiKeyDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { analyzeJournalEntryWithGemini, generateCheckInQuestionWithGemini } from './services/geminiService';
import { getAnalyzedEntries, saveAnalyzedEntry, getScheduledCheckIns, saveScheduledCheckIn, deleteScheduledCheckIn, updateScheduledCheckIn } from './services/localStorageService';
import type { JournalEntry, AnalyzedEntry, CheckInSuggestionItem, CheckIn, CheckInResponse } from './types';
import { AppTitleIcon } from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [uploadedFilesContent, setUploadedFilesContent] = useState<JournalEntry[]>([]);
  const [analyzedEntries, setAnalyzedEntries] = useState<AnalyzedEntry[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestedCheckIns, setSuggestedCheckIns] = useState<CheckInSuggestionItem[]>([]);
  const [scheduledCheckIns, setScheduledCheckIns] = useState<CheckIn[]>([]);
  
  const [activeTab, setActiveTab] = useState<'journal' | 'log' | 'checkins'>('journal');

  useEffect(() => {
    // This is a placeholder for how process.env.API_KEY would be accessed.
    // In a real build environment (like Vite or CRA), this would be replaced at build time.
    // For this sandbox, we simulate it. If you were running this locally with a .env file and a bundler, it would work.
    const envApiKey = process.env.API_KEY;
    setApiKey(envApiKey);

    setAnalyzedEntries(getAnalyzedEntries());
    setScheduledCheckIns(getScheduledCheckIns());
  }, []);

  const handleFilesUpload = (files: JournalEntry[]) => {
    setUploadedFilesContent(prev => [...prev, ...files.filter(f => !prev.find(pf => pf.id === f.id))]);
    setError(null);
  };

  const processEntries = useCallback(async () => {
    if (!apiKey) {
      setError("Gemini API Key not configured. Cannot analyze entries.");
      return;
    }
    if (uploadedFilesContent.length === 0) {
      setError("No new journal entries to analyze.");
      return;
    }

    setIsLoadingAnalysis(true);
    setError(null);
    let newAnalyzedCount = 0;

    for (const entry of uploadedFilesContent) {
      // Avoid re-analyzing already processed entries shown in the log
      if (analyzedEntries.find(ae => ae.journalEntry.id === entry.id)) {
        continue;
      }
      try {
        const analysis = await analyzeJournalEntryWithGemini(apiKey, entry.content);
        const newAnalyzedEntry: AnalyzedEntry = {
          id: `analyzed-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
          journalEntry: entry,
          ...analysis,
          timestamp: new Date(),
        };
        saveAnalyzedEntry(newAnalyzedEntry);
        setAnalyzedEntries(prev => [newAnalyzedEntry, ...prev]); // Add to top
        newAnalyzedCount++;
      } catch (e) {
        console.error("Failed to analyze entry:", entry.filename, e);
        setError(`Failed to analyze ${entry.filename}: ${e instanceof Error ? e.message : String(e)}`);
        // Continue with next entries
      }
    }
    setUploadedFilesContent([]); // Clear uploaded files after processing attempt
    setIsLoadingAnalysis(false);
    if (newAnalyzedCount === 0 && !error) {
        setError("All uploaded entries were already analyzed or no new entries were provided.");
    } else if (newAnalyzedCount > 0) {
        setError(null); // Clear error if some entries were processed
    }
  }, [apiKey, uploadedFilesContent, analyzedEntries]);

  const generateCheckInSuggestions = useCallback(async () => {
    if (!apiKey) {
      setError("Gemini API Key not configured. Cannot generate suggestions.");
      return;
    }
    const recentEntries = analyzedEntries.slice(0, 3); // Use last 3 analyzed entries
    if (recentEntries.length === 0) {
      setError("Not enough analyzed entries to generate check-in suggestions. Please analyze some journal entries first.");
      return;
    }

    setIsLoadingSuggestions(true);
    setError(null);
    const suggestions: CheckInSuggestionItem[] = [];
    for (const entry of recentEntries) {
      try {
        // Avoid re-generating for an entry if a check-in based on it already exists and is pending
        if (scheduledCheckIns.some(ci => ci.basedOnAnalyzedEntryId === entry.id && ci.status === 'pending')) {
            continue;
        }
        const question = await generateCheckInQuestionWithGemini(apiKey, entry.emotion, entry.qualities);
        suggestions.push({
          id: `sugg-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
          question,
          basedOnAnalyzedEntryId: entry.id,
          relatedEmotion: entry.emotion,
          relatedQualities: entry.qualities,
        });
      } catch (e) {
        console.error("Failed to generate check-in question:", e);
        setError(`Failed to generate a check-in question: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    setSuggestedCheckIns(suggestions);
    setIsLoadingSuggestions(false);
    if (suggestions.length === 0 && !error) {
        setError("No new check-in suggestions generated. Perhaps recent insights already have pending check-ins or an error occurred.");
    }
  }, [apiKey, analyzedEntries, scheduledCheckIns]);

  const handleScheduleCheckIn = (suggestion: CheckInSuggestionItem) => {
    const newCheckIn: CheckIn = {
      id: `checkin-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
      question: suggestion.question,
      basedOnAnalyzedEntryId: suggestion.basedOnAnalyzedEntryId,
      createdAt: new Date(),
      status: 'pending',
      responses: [],
    };
    saveScheduledCheckIn(newCheckIn);
    setScheduledCheckIns(prev => [newCheckIn, ...prev]);
    setSuggestedCheckIns(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestedCheckIns(prev => prev.filter(s => s.id !== suggestionId));
  };
  
  const handleCheckInResponse = (checkInId: string, responseText: string) => {
    const now = new Date();
    const response: CheckInResponse = {
        id: `resp-${now.getTime()}`,
        text: responseText,
        respondedAt: now,
    };
    const updatedCheckIns = scheduledCheckIns.map(ci => {
        if (ci.id === checkInId) {
            const updatedCi = { ...ci, responses: [...(ci.responses || []), response], status: 'responded' as 'responded' };
            updateScheduledCheckIn(updatedCi);
            return updatedCi;
        }
        return ci;
    });
    setScheduledCheckIns(updatedCheckIns);

    // Optionally, analyze this response as a new mini-journal entry
    // For simplicity, this example doesn't auto-analyze check-in responses,
    // but you could extend it to do so using analyzeJournalEntryWithGemini.
  };

  const handleDeleteCheckIn = (checkInId: string) => {
    deleteScheduledCheckIn(checkInId);
    setScheduledCheckIns(prev => prev.filter(ci => ci.id !== checkInId));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <AppTitleIcon className="w-10 h-10 text-sky-400" />
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Mindful Reflections AI
          </h1>
        </div>
        <p className="text-slate-400 text-sm">Your personal AI companion for emotional insights and guided reflection.</p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <ApiKeyDisplay apiKey={apiKey} />

        {error && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 p-4 rounded-lg shadow-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-slate-800 shadow-xl rounded-lg p-6">
            <nav className="mb-6 border-b border-slate-700">
                <ul className="flex space-x-1 -mb-px">
                    {([
                        {id: 'journal', label: 'Journaling Space'},
                        {id: 'log', label: 'Insights Log'},
                        {id: 'checkins', label: 'AI Check-Ins'}
                    ] as {id: 'journal' | 'log' | 'checkins', label: string}[]).map(tab => (
                        <li key={tab.id}>
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-block px-4 py-3 rounded-t-lg font-medium text-sm
                                    ${activeTab === tab.id 
                                        ? 'text-sky-400 border-b-2 border-sky-400' 
                                        : 'text-slate-400 hover:text-sky-300 hover:border-slate-600 border-b-2 border-transparent'}`}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {activeTab === 'journal' && (
                <section aria-labelledby="journaling-space">
                    <h2 id="journaling-space" className="text-2xl font-semibold text-sky-300 mb-4">Journaling Space</h2>
                    <FileUpload onFilesUpload={handleFilesUpload} disabled={!apiKey || isLoadingAnalysis} />
                    {uploadedFilesContent.length > 0 && (
                        <div className="mt-6">
                        <h3 className="text-xl font-medium text-slate-300 mb-3">New Entries to Process:</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                            {uploadedFilesContent.map(entry => (
                            <JournalEntryDisplay key={entry.id} entry={entry} />
                            ))}
                        </div>
                        <button
                            onClick={processEntries}
                            disabled={!apiKey || isLoadingAnalysis || uploadedFilesContent.length === 0}
                            className="mt-6 w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 flex items-center justify-center"
                        >
                            {isLoadingAnalysis ? <LoadingSpinner /> : 'Analyze New Entries with AI'}
                        </button>
                        </div>
                    )}
                </section>
            )}
            
            {activeTab === 'log' && (
                 <section aria-labelledby="insights-log">
                    <h2 id="insights-log" className="text-2xl font-semibold text-sky-300 mb-4">Insights Log</h2>
                    <LogView entries={analyzedEntries} />
                 </section>
            )}

            {activeTab === 'checkins' && (
                <section aria-labelledby="ai-checkins" className="space-y-8">
                    <div>
                        <h2 id="ai-checkins" className="text-2xl font-semibold text-sky-300 mb-4">AI Check-In Suggestions</h2>
                        <button
                            onClick={generateCheckInSuggestions}
                            disabled={!apiKey || isLoadingSuggestions || analyzedEntries.length === 0}
                            className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 mb-4 flex items-center justify-center"
                        >
                            {isLoadingSuggestions ? <LoadingSpinner /> : 'Generate New Check-In Suggestions'}
                        </button>
                        {suggestedCheckIns.length > 0 && <p className="text-sm text-slate-400 mb-4">Review these AI-generated questions. You can schedule them for later reflection or dismiss them.</p>}
                        <CheckInSuggestions
                            suggestions={suggestedCheckIns}
                            onSchedule={handleScheduleCheckIn}
                            onDismiss={handleDismissSuggestion}
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-sky-300 mb-4">Scheduled Check-Ins</h2>
                         <ScheduledCheckIns
                            checkIns={scheduledCheckIns}
                            onRespond={handleCheckInResponse}
                            onDelete={handleDeleteCheckIn}
                        />
                    </div>
                </section>
            )}
        </div>
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} Mindful Reflections AI. For personal use only.</p>
        <p>Journal data is stored locally in your browser and not transmitted elsewhere, except for analysis by the Gemini API if an API key is provided.</p>
      </footer>
    </div>
  );
};

export default App;
