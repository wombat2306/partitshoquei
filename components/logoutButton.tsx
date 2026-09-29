"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="
        rounded-xl
        px-4 py-2
        text-sm
        font-medium
        text-red-600
        transition
        hover:bg-red-50
      "
    >
      Cerrar sesión
    </button>
  );
}