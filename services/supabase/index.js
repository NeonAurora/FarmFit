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

// Connection Service exports
export {
    sendConnectionRequest,
    areUsersConnected,
    respondToConnectionRequest,
    getConnectionRequests,
    getConnectionStatus,
    getUserConnections,
    subscribeToConnections
} from './connectionService';

// Journal service exports
export {
  getJournalsByUserId,
  getJournalById,
  saveJournalData,
  updateJournalData,
  deleteJournalData,
  subscribeToJournals,
  getJournalStats
} from './journalService';

// Post service exports
export {
  getPostsFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  getPostsByPet,
  searchPosts,
  subscribeToPosts,
  subscribeToUserPosts,
  getUserPostStats
} from './postService';

// Comment service exports
export {
  getPostComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  getUserComments,
  getCommentReplies,
  subscribeToPostComments,
  subscribeToCommentReplies,
  getUserCommentStats,
  getBatchPostCommentCounts,
  getPostCommentCount
} from './commentService';

// Rating service exports
export {
  getClinicRatings,
  hasUserRatedClinic,
  getUserClinicRating,
  submitVetRating,
  getClinicRatingSummary,
} from './ratingService';

// Common service exports
export {
  testSupabaseConnection
} from './commonService';

// Config export
export { supabase } from './config';