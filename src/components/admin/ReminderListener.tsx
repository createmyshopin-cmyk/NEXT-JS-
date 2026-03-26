'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ReminderListener() {
  const { tenantId } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We create a lightweight audio instance for the notification sound
    // A standard short 'ding' or notification sound is expected at /sounds/notification.mp3
    // You can add this file to your public folder later.
    audioRef.current = new Audio('/sounds/notification.mp3');
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('admin-reminders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_reminders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newReminder = payload.new;
          
          // Play sound if possible (browsers might block it if no user interaction has occurred)
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play blocked by browser', e));
          }

          toast({
            title: 'Booking Reminder',
            description: newReminder.message,
            action: (
              <ToastAction altText="View" onClick={() => router.push('/admin/bookings')}>
                View
              </ToastAction>
            ),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, toast, router]);

  return null;
}
