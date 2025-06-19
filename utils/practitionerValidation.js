// utils/practitionerValidation.js

// Simple validation function (following your existing patterns)
export const validatePractitionerProfile = (profileData) => {
  const errors = {};

  // Check required fields
  if (!profileData.full_name?.trim()) {
    errors.full_name = 'Full name is required';
  }

  if (!profileData.designation?.trim()) {
    errors.designation = 'Designation is required';
  }

  if (!profileData.bvc_registration_number?.trim()) {
    errors.bvc_registration_number = 'BVC registration number is required';
  }

  if (!profileData.contact_info?.trim()) {
    errors.contact_info = 'Contact information is required';
  }

  // Return validation result
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Bangladesh districts list for dropdown
export const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Barisal', 'Sylhet', 'Rangpur'
  // Add more districts as needed
];

// Common veterinary specializations
export const VETERINARY_EXPERTISE = [
  'Pet Animal Medicine',
  'Large Animal Medicine', 
  'Poultry Medicine',
  'Small Animal Surgery',
  'Emergency Medicine'
  // Add more as needed
];