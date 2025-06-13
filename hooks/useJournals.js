// hooks/useJournals.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJournalsByUserId, subscribeToJournals } from '@/services/supabase/journalService';

export function useJournals(filters = {}) {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create a refetch function that can be called manually
  const refetch = useCallback(async () => {
    if (!user?.sub) return;
    
    try {
      setError(null);
      const data = await getJournalsByUserId(user.sub, filters);
      setJournals(data);
    } catch (err) {
      console.error('Error refetching journals:', err);
      setError('Failed to load journals');
    }
  }, [user?.sub, filters]);
  
  useEffect(() => {
    if (!user || !user.sub) {
      setJournals([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Initial fetch of journals
    const fetchJournals = async () => {
      try {
        const data = await getJournalsByUserId(user.sub, filters);
        setJournals(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching journals:', err);
        setError('Failed to load journals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJournals();
    
    // Subscribe to real-time updates for this user's journals
    const unsubscribe = subscribeToJournals(user.sub, (payload) => {
      // Handle different event types
      if (payload.eventType === 'INSERT') {
        // Add new journal to our journals array
        setJournals(prevJournals => [payload.new, ...prevJournals]);
      } 
      else if (payload.eventType === 'UPDATE') {
        // Update the journal in our array
        setJournals(prevJournals => 
          prevJournals.map(journal => 
            journal.id === payload.new.id ? payload.new : journal
          )
        );
      } 
      else if (payload.eventType === 'DELETE') {
        // Remove the journal from our array
        setJournals(prevJournals => 
          prevJournals.filter(journal => journal.id !== payload.old.id)
        );
      }
    });
    
    // Clean up subscription when component unmounts or user changes
    return () => unsubscribe();
  }, [user, JSON.stringify(filters)]);
  
  return { journals, loading, error, refetch };
}