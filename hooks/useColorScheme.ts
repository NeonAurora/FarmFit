// hooks/useColorScheme.ts
import { Platform } from 'react-native';

// Platform-specific imports
if (Platform.OS === 'web') {
  module.exports = require('./useColorScheme.web');
} else {
  module.exports = require('./useColorScheme.native');
}