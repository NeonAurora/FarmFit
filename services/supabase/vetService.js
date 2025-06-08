// services/supabase/vetService.js
import { supabase } from './config';

// Save veterinary clinic data
export const saveVeterinaryClinicData = async (vetData) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_clinics')
      .insert(vetData)
      .select();
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving veterinary clinic data:', error);
    throw error;
  }
};

// Get all approved veterinary clinics with optional filters
export const getVeterinaryClinics = async (filters = {}) => {
  try {
    let query = supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // Add filters
    if (filters.district) {
      query = query.ilike('district', `%${filters.district}%`);
    }
    
    if (filters.subDistrict) {
      query = query.ilike('sub_district', `%${filters.subDistrict}%`);
    }
    
    if (filters.clinicName) {
      query = query.ilike('clinic_name', `%${filters.clinicName}%`);
    }
    
    if (filters.serviceName) {
      query = query.contains('services', [{ serviceName: filters.serviceName }]);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting veterinary clinics:', error);
    return [];
  }
};

// Get a specific veterinary clinic by ID
export const getVeterinaryClinicById = async (clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('id', clinicId)
      .eq('is_approved', true)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting veterinary clinic by ID:', error);
    return null;
  }
};

// Search veterinary clinics by service
export const searchVetsByService = async (serviceName) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .textSearch('services', serviceName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching vets by service:', error);
    return [];
  }
};