"use client";

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function UserPresence() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const userId = `user-${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: userId,
          });
        }
      });

    // Keep presence alive
    const interval = setInterval(() => {
      channel.track({
        online_at: new Date().toISOString(),
        user_id: userId,
      });
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      channel.untrack();
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
