import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Kysely } from 'kysely';
import { KYSELY_INSTANCE } from '../database/database.module';
import { Database } from '../database/database.types';
import { AuthenticatedRequest } from './supabase-auth.guard';
import { REQUIRE_ROL_KEY } from './require-rol.decorator';

// Se usa despues de SupabaseAuthGuard: @UseGuards(SupabaseAuthGuard, RequireRolGuard)
// junto con @RequireRol('profesor' | 'alumno') en el handler.
@Injectable()
export class RequireRolGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(KYSELY_INSTANCE) private readonly db: Kysely<Database>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<'alumno' | 'profesor' | undefined>(
      REQUIRE_ROL_KEY,
      context.getHandler(),
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const row = await this.db
      .selectFrom('usuarios')
      .select('rol')
      .where('id', '=', request.userId as string)
      .executeTakeFirst();

    if (!row || row.rol !== required) {
      throw new ForbiddenException(`Esta accion requiere una cuenta de ${required}`);
    }
    return true;
  }
}
