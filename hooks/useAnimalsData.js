// hooks/useAnimals.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAnimalsByUserId, subscribeToAnimals } from "../services/supabase/database";

export function useAnimals(filterType = 'all') {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || !user.sub) {
      setAnimals([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Initial fetch of animals
    const fetchAnimals = async () => {
      try {
        const data = await getAnimalsByUserId(user.sub, filterType);
        setAnimals(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching animals:', err);
        setError('Failed to load animals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimals();
    
    // Subscribe to real-time updates for this user's animals
    const unsubscribe = subscribeToAnimals(user.sub, (payload) => {
      // Handle different event types
      if (payload.eventType === 'INSERT') {
        // If filter matches, add to our animals array
        if (filterType === 'all' || payload.new.animal_type === filterType) {
          setAnimals(prevAnimals => [payload.new, ...prevAnimals]);
        }
      } 
      else if (payload.eventType === 'UPDATE') {
        // Update the animal in our array
        setAnimals(prevAnimals => 
          prevAnimals.map(animal => 
            animal.id === payload.new.id ? payload.new : animal
          )
        );
      } 
      else if (payload.eventType === 'DELETE') {
        // Remove the animal from our array
        setAnimals(prevAnimals => 
          prevAnimals.filter(animal => animal.id !== payload.old.id)
        );
      }
    });
    
    // Clean up subscription when component unmounts or user/filter changes
    return () => unsubscribe();
  }, [user, filterType]);
  
  return { animals, loading, error };
}