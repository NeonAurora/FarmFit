// hooks/useUserData.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDataByAuthId, subscribeToUserData } from '@/services/supabase/database';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || !user.sub) {
      setUserData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // First, get the Supabase user data to get the Supabase ID
    const fetchAndSubscribe = async () => {
      try {
        // Get user data by Auth0 ID
        const supabaseUserData = await getUserDataByAuthId(user.sub);
        
        if (!supabaseUserData) {
          setError('User data not found in database');
          setLoading(false);
          return;
        }
        
        // Set initial data
        setUserData(supabaseUserData);
        setLoading(false);
        
        // Now subscribe using the Supabase user ID
        const unsubscribe = subscribeToUserData(supabaseUserData.id, (updatedData) => {
          if (updatedData) {
            setUserData(updatedData);
          }
        });
        
        return unsubscribe;
      } catch (err) {
        console.error('Error in fetchAndSubscribe:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    const unsubscribePromise = fetchAndSubscribe();
    
    // Clean up subscription when component unmounts or user changes
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user]);
  
  return { userData, loading, error };
}