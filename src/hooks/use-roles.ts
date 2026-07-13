import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "manager" | "employee" | "user";

export function useRoles() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "roles"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { userId: null, roles: [] as AppRole[] };
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return {
        userId: user.id,
        roles: (rows ?? []).map((r) => r.role as AppRole),
      };
    },
    staleTime: 60_000,
  });

  const roles = data?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isEmployee = roles.includes("employee");
  return {
    userId: data?.userId ?? null,
    roles,
    isAdmin,
    isManager,
    isEmployee,
    isStaff: isAdmin || isManager || isEmployee,
    loading: isLoading,
  };
}
