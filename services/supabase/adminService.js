// services/supabase/adminService.js
import { supabase } from './config';

// ============ ADMIN ROLE CHECKING ============

// Check if user is admin
export const isUserAdmin = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('admin_level, is_active')
      .eq('user_id', authUserId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data; // Returns true if admin record exists
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get admin details
export const getAdminDetails = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        user:users!admin_users_user_id_fkey(
          id, auth_id, name, email, picture
        )
      `)
      .eq('user_id', authUserId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting admin details:', error);
    return { success: false, error: error.message };
  }
};

// ============ PRACTITIONER VERIFICATION ============

// Get pending applications for admin review
export const getPendingApplications = async () => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture,
          practitioner_status, practitioner_verified_at
        ),
        verification_documents(
          university_name,
          graduation_session,
          degree_certificate_url,
          registration_certificate_url,
          verification_status,
          created_at
        )
      `)
      .eq('is_verified', false)
      .eq('is_active', true)
      .order('created_at', { ascending: true }); // Oldest first

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting pending applications:', error);
    return { success: false, error: error.message };
  }
};

// Approve practitioner application
export const approvePractitionerApplication = async (profileId, adminUserId, notes = '') => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('practitioner_profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select('user_id')
      .single();

    if (profileError) throw profileError;

    // Update user role status
    const { error: userError } = await supabase
      .from('users')
      .update({
        practitioner_status: 'verified',
        practitioner_verified_at: new Date().toISOString()
      })
      .eq('auth_id', profile.user_id);

    if (userError) throw userError;

    // Update verification documents
    const { error: docError } = await supabase
      .from('verification_documents')
      .update({
        verification_status: 'verified',
        verified_by: adminUserId,
        verification_notes: notes,
        verified_at: new Date().toISOString()
      })
      .eq('practitioner_profile_id', profileId);

    if (docError) throw docError;

    return { success: true };
  } catch (error) {
    console.error('Error approving application:', error);
    return { success: false, error: error.message };
  }
};

// Reject practitioner application
export const rejectPractitionerApplication = async (profileId, adminUserId, reason = '') => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('practitioner_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;

    // Update user role status
    const { error: userError } = await supabase
      .from('users')
      .update({
        practitioner_status: 'rejected'
      })
      .eq('auth_id', profile.user_id);

    if (userError) throw userError;

    // Update verification documents
    const { error: docError } = await supabase
      .from('verification_documents')
      .update({
        verification_status: 'rejected',
        verified_by: adminUserId,
        rejection_reason: reason,
        verified_at: new Date().toISOString()
      })
      .eq('practitioner_profile_id', profileId);

    if (docError) throw docError;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { success: false, error: error.message };
  }
};

// Get application details for review
export const getApplicationDetails = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture,
          practitioner_status, created_at
        ),
        verification_documents(
          university_name,
          graduation_session,
          degree_certificate_url,
          registration_certificate_url,
          verification_status,
          verification_notes,
          rejection_reason,
          created_at
        )
      `)
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting application details:', error);
    return { success: false, error: error.message };
  }
};