
import React, { useState } from 'react';
import type { CheckIn, CheckInResponse } from '../types';
import { CalendarDaysIcon, TrashIcon, ChatBubbleLeftRightIcon } from '../constants';
import { Modal } from './Modal';

interface ScheduledCheckInsProps {
  checkIns: CheckIn[];
  onRespond: (checkInId: string, responseText: string) => void;
  onDelete: (checkInId: string) => void;
}

const CheckInItem: React.FC<{checkIn: CheckIn, onRespond: (checkInId: string, responseText: string) => void, onDelete: (checkInId: string) => void}> = ({ checkIn, onRespond, onDelete }) => {
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRespond = () => {
    if (responseText.trim()) {
      onRespond(checkIn.id, responseText.trim());
      setResponseText('');
      setShowResponseInput(false);
    }
  };
  
  const isResponded = checkIn.status === 'responded' && checkIn.responses && checkIn.responses.length > 0;

  return (
    <div className={`bg-slate-750 border border-slate-700 p-4 rounded-lg shadow-md ${isResponded ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start">
        <p className="text-md text-slate-200 mb-2 flex-1">{checkIn.question}</p>
        {!isResponded && (
            <button onClick={() => setShowDeleteConfirm(true)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <TrashIcon className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="text-xs text-slate-400 mb-3">
        <p className="flex items-center"><CalendarDaysIcon className="w-4 h-4 mr-1.5 text-slate-500"/>Scheduled: {new Date(checkIn.createdAt).toLocaleDateString()}</p>
        {checkIn.basedOnAnalyzedEntryId && <p className="mt-1">Inspired by an earlier reflection.</p>}
      </div>

      {isResponded && checkIn.responses.map(response => (
        <div key={response.id} className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Your response on {new Date(response.respondedAt).toLocaleString()}:</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{response.text}</p>
        </div>
      ))}

      {!isResponded && (
        showResponseInput ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your reflection here..."
              rows={3}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-slate-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500"
            />
            <div className="flex space-x-2">
              <button onClick={handleRespond} className="text-sm bg-sky-500 hover:bg-sky-600 text-white py-1.5 px-3 rounded-md shadow">Submit Response</button>
              <button onClick={() => setShowResponseInput(false)} className="text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 py-1.5 px-3 rounded-md shadow">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResponseInput(true)}
            className="mt-2 flex items-center text-sm bg-sky-600 hover:bg-sky-500 text-white py-1.5 px-3 rounded-md shadow transition duration-150"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5" /> Respond
          </button>
        )
      )}
      {showDeleteConfirm && (
        <Modal title="Confirm Deletion" onClose={() => setShowDeleteConfirm(false)}>
            <p className="text-slate-300 mb-4">Are you sure you want to delete this check-in? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 text-slate-200">Cancel</button>
                <button 
                    onClick={() => {
                        onDelete(checkIn.id);
                        setShowDeleteConfirm(false);
                    }} 
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white"
                >
                    Delete
                </button>
            </div>
        </Modal>
      )}
    </div>
  );
}


export const ScheduledCheckIns: React.FC<ScheduledCheckInsProps> = ({ checkIns, onRespond, onDelete }) => {
  const pendingCheckIns = checkIns.filter(ci => ci.status === 'pending');
  const respondedCheckIns = checkIns.filter(ci => ci.status === 'responded');

  if (checkIns.length === 0) {
    return <p className="text-slate-400 text-center py-4">No check-ins scheduled. Generate some suggestions based on your journal analysis!</p>;
  }

  return (
    <div className="space-y-6">
        {pendingCheckIns.length > 0 && (
            <div>
                <h4 className="text-lg font-medium text-sky-300 mb-3">Pending Reflections ({pendingCheckIns.length})</h4>
                <div className="space-y-4">
                    {pendingCheckIns.map(checkIn => (
                        <CheckInItem key={checkIn.id} checkIn={checkIn} onRespond={onRespond} onDelete={onDelete} />
                    ))}
                </div>
            </div>
        )}
        {respondedCheckIns.length > 0 && (
             <div>
                <h4 className="text-lg font-medium text-slate-400 mt-8 mb-3">Completed Reflections ({respondedCheckIns.length})</h4>
                <div className="space-y-4">
                    {respondedCheckIns.map(checkIn => (
                         <CheckInItem key={checkIn.id} checkIn={checkIn} onRespond={onRespond} onDelete={onDelete} />
                    ))}
                </div>
            </div>
        )}
        {pendingCheckIns.length === 0 && respondedCheckIns.length > 0 && (
            <p className="text-slate-400 text-center py-4">All scheduled check-ins have been responded to. Great job!</p>
        )}
    </div>
  );
};
