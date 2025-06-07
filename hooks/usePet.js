// hooks/usePet.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPetById, subscribeToPet } from '../services/supabase/database';

export function usePet(petId) {
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add a refetch function
  const refetch = useCallback(async () => {
    if (!user?.sub || !petId) return;
    
    try {
      const data = await getPetById(petId, user.sub);
      setPet(data);
      setError(null);
    } catch (err) {
      console.error('Error refetching pet:', err);
      setError('Failed to load pet data');
    }
  }, [petId, user?.sub]);
  
  useEffect(() => {
    if (!user?.sub || !petId) {
      setPet(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchPet = async () => {
      try {
        const data = await getPetById(petId, user.sub);
        setPet(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError('Failed to load pet data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPet();
    
    const unsubscribe = subscribeToPet(petId, user.sub, (payload) => {
      console.log('Received payload in pet subscription:', payload);
      if (payload.eventType === 'UPDATE') {
        setPet(payload.new);
      } 
      else if (payload.eventType === 'DELETE') {
        setPet(null);
        setError('This pet has been deleted');
      }
    });
    
    return () => {
      console.log('Cleaning up pet subscription');
      unsubscribe();
    };
  }, [petId, user]);
  
  return { pet, loading, error, refetch }; // ✅ Return refetch function
}