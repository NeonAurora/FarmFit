// hooks/useAnimal.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAnimalById, subscribeToAnimal } from '../services/supabase/database';

export function useAnimal(animalId) {
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('useAnimal hook effect running for animal ID:', animalId);
  
  useEffect(() => {
    if (!user?.sub || !animalId) {
      console.log('Missing user or animalId, skipping subscription');
      setAnimal(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Initial fetch of animal data
    const fetchAnimal = async () => {
      try {
        const data = await getAnimalById(animalId, user.sub);
        setAnimal(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching animal:', err);
        setError('Failed to load animal data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimal();
    
    // Subscribe to real-time updates for this specific animal
    const unsubscribe = subscribeToAnimal(animalId, user.sub, (payload) => {
      console.log('Received payload in animal subscription:', payload);
      if (payload.eventType === 'UPDATE') {
        setAnimal(payload.new);
      } 
      else if (payload.eventType === 'DELETE') {
        setAnimal(null);
        setError('This animal has been deleted');
      }
    });
    
    // Clean up subscription when component unmounts or animalId/user changes
    return () => {
      console.log('Cleaning up animal subscription');
      unsubscribe();
    };
  }, [animalId, user]);
  
  return { animal, loading, error };
}