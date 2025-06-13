// hooks/useJournal.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJournalById } from '@/services/supabase/journalService';

export function useJournal(journalId) {
  const { user } = useAuth();
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add a refetch function
  const refetch = useCallback(async () => {
    if (!user?.sub || !journalId) return;
    
    try {
      const data = await getJournalById(journalId, user.sub);
      setJournal(data);
      setError(null);
    } catch (err) {
      console.error('Error refetching journal:', err);
      setError('Failed to load journal data');
    }
  }, [journalId, user?.sub]);
  
  useEffect(() => {
    if (!user?.sub || !journalId) {
      setJournal(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchJournal = async () => {
      try {
        const data = await getJournalById(journalId, user.sub);
        setJournal(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching journal:', err);
        setError('Failed to load journal data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJournal();
  }, [journalId, user?.sub]);
  
  return { journal, loading, error, refetch };
}