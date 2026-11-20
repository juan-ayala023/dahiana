import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/** Rutas accesibles sin sesión. */
const PUBLIC_PATHS = ["/login", "/entrar"];
/** Rutas de autenticación: si ya hay sesión, se redirige al inicio. */
const AUTH_ONLY_PATHS = ["/login"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Refresca la sesión de Supabase en cada petición y protege las rutas.
 * Importante: no agregar lógica entre createServerClient y getUser().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const redirectTo = (path: string, keepNext = false) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";
    if (keepNext && pathname !== "/") target.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(target);
    // Conserva las cookies de sesión refrescadas.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user && !matches(pathname, PUBLIC_PATHS)) {
    return redirectTo("/login", true);
  }

  if (user && (pathname === "/" || matches(pathname, AUTH_ONLY_PATHS))) {
    return redirectTo("/inicio");
  }

  return response;
}
