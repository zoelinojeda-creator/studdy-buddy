import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ROL_KEY = 'requireRol';

// El JWT de Supabase solo trae el "sub" (ver SupabaseAuthGuard) — el rol no
// esta en el token, asi que RequireRolGuard lo resuelve contra la base.
export const RequireRol = (rol: 'alumno' | 'profesor') => SetMetadata(REQUIRE_ROL_KEY, rol);
