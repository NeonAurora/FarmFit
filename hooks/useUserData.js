// hooks/useUserData.js
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUserData } from '@/services/supabase/database';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user || !user.sub) {
      setUserData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Subscribe to real-time updates for this user
    const unsubscribe = subscribeToUserData(user.sub, (data) => {
      setUserData(data);
      setLoading(false);
    });
    
    // Clean up subscription when component unmounts or user changes
    return () => unsubscribe();
  }, [user]);
  
  return { userData, loading };
}