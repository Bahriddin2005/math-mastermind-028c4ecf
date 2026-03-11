import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js';

export interface MFAStatus {
  isEnabled: boolean;
  isVerified: boolean;
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  factors: Array<{
    id: string;
    friendlyName: string | null;
    factorType: string;
    status: string;
    createdAt: string;
  }>;
  loading: boolean;
  error: string | null;
}

export const useMFA = () => {
  const [status, setStatus] = useState<MFAStatus>({
    isEnabled: false,
    isVerified: false,
    currentLevel: null,
    nextLevel: null,
    factors: [],
    loading: true,
    error: null,
  });

  const checkMFAStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Get assurance level
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        throw aalError;
      }

      // Get enrolled factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactors = factorsData.totp.filter(f => f.status === 'verified');
      const isEnabled = verifiedFactors.length > 0;
      const needsVerification = aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1';

      setStatus({
        isEnabled,
        isVerified: aalData.currentLevel === 'aal2',
        currentLevel: aalData.currentLevel,
        nextLevel: aalData.nextLevel,
        factors: factorsData.totp.map(f => ({
          id: f.id,
          friendlyName: f.friendly_name,
          factorType: f.factor_type,
          status: f.status,
          createdAt: f.created_at,
        })),
        loading: false,
        error: null,
      });

      return { isEnabled, needsVerification };
    } catch (err: any) {
      console.error('MFA status check error:', err);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      return { isEnabled: false, needsVerification: false };
    }
  }, []);

  const unenrollFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;
      
      await checkMFAStatus();
      return { success: true };
    } catch (err: any) {
      console.error('MFA unenroll error:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    checkMFAStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMFAStatus();
    });

    return () => subscription.unsubscribe();
  }, [checkMFAStatus]);

  return {
    ...status,
    checkMFAStatus,
    unenrollFactor,
  };
};
