"use client";

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Users } from 'lucide-react';

export function OnlineUsersBadge() {
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: `badge-${Math.random().toString(36).substring(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const userCount = Object.keys(newState).length;
        setOnlineUsers(userCount);
      })
      .on('presence', { event: 'join' }, () => {
        const newState = channel.presenceState();
        const userCount = Object.keys(newState).length;
        setOnlineUsers(userCount);
      })
      .on('presence', { event: 'leave' }, () => {
        const newState = channel.presenceState();
        const userCount = Object.keys(newState).length;
        setOnlineUsers(userCount);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const newState = channel.presenceState();
          const userCount = Object.keys(newState).length;
          setOnlineUsers(userCount);
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-1 text-sm text-neutral-600">
      <Users className="h-4 w-4" />
      <span>{onlineUsers} онлайн</span>
    </div>
  );
}
