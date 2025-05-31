
import React from 'react';

interface ApiKeyDisplayProps {
  apiKey: string | undefined;
}

export const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ apiKey }) => {
  const isApiKeySet = apiKey && apiKey.trim() !== "";

  return (
    <div className={`p-3 rounded-lg mb-6 text-sm ${isApiKeySet ? 'bg-green-500/20 border border-green-700 text-green-300' : 'bg-yellow-500/20 border border-yellow-700 text-yellow-300'}`}>
      {isApiKeySet ? (
        <p>Gemini API Key is configured. AI features are enabled.</p>
      ) : (
        <p>
          <strong>Gemini API Key not configured.</strong> AI features are disabled.
          Please ensure the <code>API_KEY</code> environment variable is set in your environment for this application to function correctly.
        </p>
      )}
    </div>
  );
};
