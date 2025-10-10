import { useEffect, useRef } from 'react';

interface UserRoleSubscriptionProps {
  userId: string;
  onRoleChange: (newRole: 'admin' | 'business' | 'general') => void;
  onError?: (error: string) => void;
}

export const useUserRoleSubscription = ({ 
  userId, 
  onRoleChange, 
  onError 
}: UserRoleSubscriptionProps) => {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log('🔍 useUserRoleSubscription: No userId provided (mock mode)');
      return;
    }

    console.log('🔍 useUserRoleSubscription: Setting up subscription for user:', userId);

    // Dynamically import Supabase client only when needed
    const setupSubscription = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        
        // Subscribe to changes in the users table for this specific user
        const subscription = supabase
          .channel(`user-role-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              console.log('🔔 Role change detected:', payload);
              
              const newRole = payload.new.role;
              if (newRole && ['admin', 'business', 'general'].includes(newRole)) {
                console.log('✅ Valid role change detected:', newRole);
                onRoleChange(newRole as 'admin' | 'business' | 'general');
              } else {
                console.log('❌ Invalid role change:', newRole);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to role changes for user:', userId);
            } else if (status === 'CHANNEL_ERROR') {
              const errorMsg = 'Failed to subscribe to role changes';
              console.error('❌', errorMsg);
              onError?.(errorMsg);
            }
          });

        subscriptionRef.current = subscription;
      } catch (error) {
        console.error('❌ Failed to setup subscription:', error);
        onError?.('Failed to setup subscription');
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('Unsubscribing from role changes');
        // Dynamically import supabase for cleanup
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }).catch(console.error);
      }
    };
  }, [userId, onRoleChange, onError]);

  // Return cleanup function for manual cleanup if needed
  return () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };
};
