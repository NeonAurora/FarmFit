// services/supabase/practitionerService.js
import { supabase } from './config';

// ============ USER ROLE MANAGEMENT ============

// Apply for practitioner role
export const applyForPractitionerRole = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        is_practitioner: true,
        practitioner_status: 'pending'
      })
      .eq('auth_id', authUserId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error applying for practitioner role:', error);
    return false;
  }
};

// Check user roles (following your getUserDataByAuthId pattern)
export const getUserRoles = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_pet_owner, is_practitioner, practitioner_status, practitioner_verified_at')
      .eq('auth_id', authUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting user roles:', error);
    return null;
  }
};

// ============ PRACTITIONER PROFILE MANAGEMENT ============

// Create practitioner profile (following your savePetData pattern)
export const savePractitionerProfileData = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .insert(profileData)
      .select();

    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving practitioner profile:', error);
    throw error;
  }
};

// Get practitioner profile by user ID (following your getPetById pattern)
// Update this function
export const getPractitionerProfileByUserId = async (authUserId) => {
  try {
    console.log('Getting practitioner profile for user:', authUserId); // Debug log
    
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture, 
          is_practitioner, practitioner_status, practitioner_verified_at
        )
      `)
      .eq('user_id', authUserId)
      .single();

    console.log('Profile query result:', { data, error }); // Debug log

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('No profile found for user:', authUserId);
        return { success: true, data: null };
      }
      throw error;
    }

    console.log('Profile found:', data); // Debug log
    return { success: true, data };
  } catch (error) {
    console.error('Error getting practitioner profile:', error);
    return { success: false, error: error.message };
  }
};

export const getPractitionerProfileById = async (profileId) => {
  try {
    console.log('Getting public practitioner profile by ID:', profileId); // Debug log
    
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture
        )
      `)
      .eq('id', profileId)
      .eq('is_active', true)
      .eq('is_verified', true)  // Only show verified profiles to public
      .single();

    console.log('Public profile query result:', { data, error }); // Debug log

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('No verified profile found with ID:', profileId);
        return { success: true, data: null };
      }
      throw error;
    }

    console.log('Public profile found:', data); // Debug log
    return { success: true, data };
  } catch (error) {
    console.error('Error getting practitioner profile by ID:', error);
    return { success: false, error: error.message };
  }
};


export const updatePractitionerProfileData = async (authUserId, profileData) => {
  try {
    console.log('Updating practitioner profile for user:', authUserId); // Debug log
    
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUserId)
      .select();

    console.log('Update query result:', { data, error }); // Debug log

    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      return { success: false, error: error.message };
    }

    console.log('Profile updated successfully:', data); // Debug log
    return { success: true, data };  // ← Now returns structured response

  } catch (error) {
    console.error('Error updating practitioner profile:', error);
    return { success: false, error: error.message };  // ← Return instead of throw
  }
};

// Get all verified practitioners (following your getPetsByUserId pattern)
export const getVerifiedPractitioners = async () => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting verified practitioners:', error);
    return [];
  }
};

// Enhanced search practitioners with better filtering and sorting
export const searchPractitioners = async (searchOptions = {}) => {
  try {
    console.log('Searching practitioners with options:', searchOptions);
    
    let query = supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true);

    // Text search (name, expertise, designation)
    if (searchOptions.query && searchOptions.query.trim()) {
      const searchTerm = searchOptions.query.trim();
      query = query.or(`full_name.ilike.%${searchTerm}%,areas_of_expertise.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%`);
    }

    // District filter
    if (searchOptions.district) {
      query = query.eq('district', searchOptions.district);
    }

    // Sub-district filter
    if (searchOptions.subDistrict) {
      query = query.eq('sub_district', searchOptions.subDistrict);
    }

    // Expertise filter
    if (searchOptions.expertise) {
      query = query.ilike('areas_of_expertise', `%${searchOptions.expertise}%`);
    }

    // Sorting
    const sortBy = searchOptions.sortBy || 'created_at';
    const sortOrder = searchOptions.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = searchOptions.limit || 20;
    const offset = searchOptions.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    console.log(`Found ${data?.length || 0} practitioners`);
    return { success: true, data: data || [], count: data?.length || 0 };
  } catch (error) {
    console.error('Error searching practitioners:', error);
    return { success: false, error: error.message };
  }
};

// Get search suggestions (for autocomplete)
export const getSearchSuggestions = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const searchTerm = query.trim();

    // Get unique expertise areas that match search
    const { data: expertiseData, error: expertiseError } = await supabase
      .from('practitioner_profiles')
      .select('areas_of_expertise')
      .eq('is_active', true)
      .eq('is_verified', true)
      .ilike('areas_of_expertise', `%${searchTerm}%`)
      .limit(5);

    if (expertiseError) throw expertiseError;

    // Get practitioner names that match search
    const { data: nameData, error: nameError } = await supabase
      .from('practitioner_profiles')
      .select('full_name, designation')
      .eq('is_active', true)
      .eq('is_verified', true)
      .ilike('full_name', `%${searchTerm}%`)
      .limit(5);

    if (nameError) throw nameError;

    const suggestions = [
      ...expertiseData.map(item => ({ type: 'expertise', value: item.areas_of_expertise })),
      ...nameData.map(item => ({ type: 'practitioner', value: `${item.full_name} (${item.designation})` }))
    ];

    return { success: true, data: suggestions };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return { success: false, error: error.message };
  }
};

// Get popular search terms and statistics
export const getSearchStats = async () => {
  try {
    // Get district distribution
    const { data: districtStats, error: districtError } = await supabase
      .from('practitioner_profiles')
      .select('district')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (districtError) throw districtError;

    // Get expertise distribution
    const { data: expertiseStats, error: expertiseError } = await supabase
      .from('practitioner_profiles')
      .select('areas_of_expertise')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (expertiseError) throw expertiseError;

    // Process district counts
    const districtCounts = {};
    districtStats.forEach(item => {
      districtCounts[item.district] = (districtCounts[item.district] || 0) + 1;
    });

    // Process expertise counts (simple keyword extraction)
    const expertiseCounts = {};
    expertiseStats.forEach(item => {
      const keywords = item.areas_of_expertise.split(',').map(k => k.trim());
      keywords.forEach(keyword => {
        if (keyword.length > 3) { // Ignore short words
          expertiseCounts[keyword] = (expertiseCounts[keyword] || 0) + 1;
        }
      });
    });

    // Get top items
    const topDistricts = Object.entries(districtCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([district, count]) => ({ district, count }));

    const topExpertise = Object.entries(expertiseCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([expertise, count]) => ({ expertise, count }));

    return {
      success: true,
      data: {
        totalPractitioners: districtStats.length,
        topDistricts,
        topExpertise
      }
    };
  } catch (error) {
    console.error('Error getting search stats:', error);
    return { success: false, error: error.message };
  }
};

// Get recently verified practitioners
export const getRecentPractitioners = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select(`
        *,
        user:users!practitioner_profiles_user_id_fkey(
          id, auth_id, name, email, picture
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('verified_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting recent practitioners:', error);
    return { success: false, error: error.message };
  }
};

// ============ VERIFICATION DOCUMENTS ============

// Save verification documents
export const saveVerificationDocuments = async (profileId, verificationData) => {
  try {
    const { data, error } = await supabase
      .from('verification_documents')
      .insert({
        practitioner_profile_id: profileId,
        ...verificationData
      })
      .select();

    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving verification documents:', error);
    throw error;
  }
};

// ============ VALIDATION HELPERS ============

// Check if BVC registration number already exists
export const checkBVCRegistrationExists = async (bvcNumber, excludeUserId = null) => {
  try {
    let query = supabase
      .from('practitioner_profiles')
      .select('id')
      .eq('bvc_registration_number', bvcNumber);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.length > 0; // Returns true if exists
  } catch (error) {
    console.error('Error checking BVC registration:', error);
    return false;
  }
};

// Check if user already has a practitioner profile
export const checkExistingPractitionerProfile = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_profiles')
      .select('id, is_verified')
      .eq('user_id', authUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data; // Returns profile data if exists, null if not
  } catch (error) {
    console.error('Error checking existing profile:', error);
    return null;
  }
};