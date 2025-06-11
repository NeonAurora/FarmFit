// hooks/usePets.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPetsByUserId, subscribeToPets } from "@/services/supabase";

export function usePets() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create a refetch function that can be called manually
  const refetch = useCallback(async () => {
    if (!user?.sub) return;
    
    try {
      setError(null);
      const data = await getPetsByUserId(user.sub);
      setPets(data);
    } catch (err) {
      console.error('Error refetching pets:', err);
      setError('Failed to load pets');
    }
  }, [user?.sub]);
  
  useEffect(() => {
    if (!user || !user.sub) {
      setPets([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Initial fetch of pets
    const fetchPets = async () => {
      try {
        const data = await getPetsByUserId(user.sub);
        setPets(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Failed to load pets');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPets();
    
    // Subscribe to real-time updates for this user's pets
    const unsubscribe = subscribeToPets(user.sub, (payload) => {
      // Handle different event types
      if (payload.eventType === 'INSERT') {
        // Add new pet to our pets array
        setPets(prevPets => [payload.new, ...prevPets]);
      } 
      else if (payload.eventType === 'UPDATE') {
        // Update the pet in our array
        setPets(prevPets => 
          prevPets.map(pet => 
            pet.id === payload.new.id ? payload.new : pet
          )
        );
      } 
      else if (payload.eventType === 'DELETE') {
        // Remove the pet from our array
        setPets(prevPets => 
          prevPets.filter(pet => pet.id !== payload.old.id)
        );
      }
    });
    
    // Clean up subscription when component unmounts or user changes
    return () => unsubscribe();
  }, [user]);
  
  return { pets, loading, error, refetch };
}