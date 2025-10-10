import React from 'react';
import { useUserRoleSubscription } from '../hooks/useUserRoleSubscription';

interface ConditionalRoleSubscriptionProps {
  userId: string;
  onRoleChange: (newRole: 'admin' | 'business' | 'general') => void;
  onError?: (error: string) => void;
}

export const ConditionalRoleSubscription: React.FC<ConditionalRoleSubscriptionProps> = ({
  userId,
  onRoleChange,
  onError
}) => {
  useUserRoleSubscription({
    userId,
    onRoleChange,
    onError
  });

  return null; // This component doesn't render anything
};
