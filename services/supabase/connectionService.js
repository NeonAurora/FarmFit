// services/supabase/connectionService.js
import { supabase } from './config';

// Send connection request (using auth_id directly)
export const sendConnectionRequest = async (recipientUserId, currentUserId) => {
  try {
    // Quick validation: check if users are trying to connect to themselves
    if (currentUserId === recipientUserId) {
      return { success: false, error: 'Cannot send connection request to yourself' };
    }
    
    // Check if connection already exists (using auth_id directly)
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('status')
      .or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${recipientUserId}),and(user_id_1.eq.${recipientUserId},user_id_2.eq.${currentUserId})`)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no data
    
    if (existingConnection) {
      return { 
        success: false, 
        error: `Connection already exists with status: ${existingConnection.status}` 
      };
    }
    
    // Insert new connection request (using auth_id directly)
    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id_1: currentUserId,      // Auth0 ID
        user_id_2: recipientUserId,    // Auth0 ID  
        requested_by: currentUserId,   // Auth0 ID
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      // Handle foreign key constraint errors (user doesn't exist)
      if (error.code === '23503') {
        return { success: false, error: 'One or both users not found' };
      }
      throw error;
    }
    
    return { success: true, message: 'Connection request sent successfully' };
    
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error: error.message };
  }
};

// Get connection status between two users (using auth_id directly)
export const getConnectionStatus = async (user1Id, user2Id) => {
  try {
    if (user1Id === user2Id) {
      return 'same_user';
    }
    
    const { data, error } = await supabase
      .from('connections')
      .select('status')
      .or(`and(user_id_1.eq.${user1Id},user_id_2.eq.${user2Id}),and(user_id_1.eq.${user2Id},user_id_2.eq.${user1Id})`)
      .maybeSingle();
    
    if (error) throw error;
    
    return data?.status || 'none';
  } catch (error) {
    console.error('Error getting connection status:', error);
    return 'none';
  }
};

// Check if users are connected (using auth_id directly)
export const areUsersConnected = async (user1Id, user2Id) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('id')
      .or(`and(user_id_1.eq.${user1Id},user_id_2.eq.${user2Id}),and(user_id_1.eq.${user2Id},user_id_2.eq.${user1Id})`)
      .eq('status', 'accepted')
      .maybeSingle();
    
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    console.error('Error checking if users are connected:', error);
    return false;
  }
};

// Get pending connection requests with user details (using auth_id directly)
export const getConnectionRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        user_id_1,
        user_id_2,
        requested_by,
        status,
        created_at,
        requester:users!connections_requested_by_fkey(
          auth_id,
          name,
          email,
          picture
        )
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .neq('requested_by', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data to match expected format
    return (data || []).map(conn => ({
      connection_id: conn.id,
      requester_auth_id: conn.requester?.auth_id,
      requester_name: conn.requester?.name,
      requester_email: conn.requester?.email,
      requester_picture: conn.requester?.picture,
      request_date: conn.created_at,
      status: conn.status
    }));
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return [];
  }
};

// Respond to connection request (using auth_id directly)
export const respondToConnectionRequest = async (connectionId, response, currentUserId) => {
  try {
    // Validate response
    if (!['accepted', 'declined', 'blocked'].includes(response)) {
      return { success: false, error: 'Invalid response' };
    }
    
    // Get connection details and verify user can respond (using auth_id directly)
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'pending')
      .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
      .neq('requested_by', currentUserId)
      .maybeSingle();
    
    if (fetchError || !connection) {
      return { success: false, error: 'Connection request not found or you are not authorized to respond' };
    }
    
    // Update connection status
    const { error: updateError } = await supabase
      .from('connections')
      .update({ 
        status: response, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', connectionId);
    
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      message: `Connection request ${response} successfully` 
    };
    
  } catch (error) {
    console.error('Error responding to connection request:', error);
    return { success: false, error: error.message };
  }
};

// Get user's connections (using auth_id directly)
export const getUserConnections = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        user_id_1,
        user_id_2,
        created_at,
        user1:users!connections_user_id_1_fkey(id, auth_id, name, email, picture),
        user2:users!connections_user_id_2_fkey(id, auth_id, name, email, picture)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform data to return the other user's info
    return (data || []).map(conn => {
      const isUser1 = conn.user_id_1 === userId;
      const otherUser = isUser1 ? conn.user2 : conn.user1;
      
      return {
        connection_id: otherUser.auth_id,
        connection_date: conn.created_at,
        user: otherUser
      };
    });
  } catch (error) {
    console.error('Error fetching user connections:', error);
    return [];
  }
};

// Subscribe to connection changes (using auth_id directly)
export const subscribeToConnections = (userId, callback) => {
  const subscription = supabase
    .channel(`connections:user:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'connections',
      filter: `user_id_1=eq.${userId}`
    }, callback)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'connections',
      filter: `user_id_2=eq.${userId}`
    }, callback)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};