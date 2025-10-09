/**
 * Avatar Service Test
 * Simple test to verify avatar generation works correctly
 */

import { AvatarService } from '../services/avatarService';

export const testAvatarService = () => {
  console.log('🧪 Testing Avatar Service...');
  
  // Test 1: Basic avatar URL generation
  const testName = 'John Doe';
  const avatarUrl = AvatarService.getAppAvatarUrl(testName, 48);
  console.log('✅ Avatar URL generated:', avatarUrl);
  
  // Test 2: Initials generation
  const initials = AvatarService.generateInitials(testName);
  console.log('✅ Initials generated:', initials);
  
  // Test 3: Background color generation
  const bgColor = AvatarService.generateBackgroundColor(testName);
  console.log('✅ Background color generated:', bgColor);
  
  // Test 4: Fallback avatar
  const fallbackUrl = AvatarService.getFallbackAvatarUrl(48);
  console.log('✅ Fallback avatar URL:', fallbackUrl);
  
  // Test 5: Edge cases
  const emptyNameInitials = AvatarService.generateInitials('');
  console.log('✅ Empty name initials:', emptyNameInitials);
  
  const singleNameInitials = AvatarService.generateInitials('John');
  console.log('✅ Single name initials:', singleNameInitials);
  
  const longNameInitials = AvatarService.generateInitials('John Michael Doe Smith');
  console.log('✅ Long name initials:', longNameInitials);
  
  console.log('🎉 Avatar Service tests completed!');
  
  return {
    avatarUrl,
    initials,
    bgColor,
    fallbackUrl,
    emptyNameInitials,
    singleNameInitials,
    longNameInitials
  };
};

// Export for use in development
export default testAvatarService;
