import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Comprobar que hay un usuario autenticado
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No estás autenticado." },
        { status: 401 }
      );
    }

    // Comprobar que el usuario actual es administrador
    const { data: esAdmin, error: errorAdmin } = await supabase.rpc(
      "es_admin"
    );

    if (errorAdmin) {
      console.error("Error comprobando administrador:", errorAdmin);

      return NextResponse.json(
        { error: "No se ha podido comprobar los permisos de administrador." },
        { status: 500 }
      );
    }

    if (!esAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos de administrador." },
        { status: 403 }
      );
    }

    // Obtener email
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "El email es obligatorio." },
        { status: 400 }
      );
    }

    // Variables de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Faltan variables de Supabase:", {
        tieneUrl: !!supabaseUrl,
        tieneSecretKey: !!supabaseSecretKey,
      });

      return NextResponse.json(
        {
          error:
            "La configuración del servidor de Supabase está incompleta.",
        },
        { status: 500 }
      );
    }

    // Cliente de Supabase con permisos de servidor
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    // Enviamos al usuario a la página de completar cuenta
    const redirectTo = origin;

    const { error } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo,
        }
      );

    if (error) {
      console.error("Error enviando invitación:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Error en /api/admin/invitar-usuario:", error);

    return NextResponse.json(
      {
        error: "No se ha podido enviar la invitación.",
      },
      { status: 500 }
    );
  }
}
