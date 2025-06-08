// services/supabase/index.js
// User service exports
export {
  saveUserData,
  updateUserData,
  getUserDataByAuthId,
  searchUsers,
  getUserById,
  subscribeToUserData
} from './userService';

// Pet service exports
export {
  getPetsByUserId,
  getPetById,
  savePetData,
  updatePetData,
  deletePetData,
  subscribeToPets,
  subscribeToPet
} from './petService';

// Vet service exports
export {
  saveVeterinaryClinicData,
  getVeterinaryClinics,
  getVeterinaryClinicById,
  searchVetsByService
} from './vetService';

// Common service exports
export {
  testSupabaseConnection
} from './commonService';

// Config export
export { supabase } from './config';