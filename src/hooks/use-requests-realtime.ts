import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Realtime changes on public.requests and invalidate the
 * listed React Query keys whenever a row changes.
 */
export function useRequestsRealtime(queryKeys: (readonly unknown[])[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`requests-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          queryKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
