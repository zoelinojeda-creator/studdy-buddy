import { Body, ConflictException, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { Kysely } from 'kysely';
import { KYSELY_INSTANCE } from '../database/database.module';
import { Database } from '../database/database.types';
import { SupabaseAuthGuard, AuthenticatedRequest } from './supabase-auth.guard';

class SetRolDto {
  @IsIn(['alumno', 'profesor'])
  rol!: 'alumno' | 'profesor';
}

// Elegir el rol es cosa de una sola vez, en el registro. La cuenta se crea
// como 'alumno' (default de la columna); esto la promueve a 'profesor' si
// corresponde. Un trigger en Postgres (usuarios_rol_inmutable) rechaza el
// UPDATE si la cuenta ya tuvo alguna sesion — ese chequeo NO se duplica
// aca a proposito: es la base, no la app, la que tiene que garantizarlo,
// para que valga incluso si alguien pega directo a la API de Supabase.
@Controller('auth')
export class SetRolController {
  constructor(@Inject(KYSELY_INSTANCE) private readonly db: Kysely<Database>) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('rol')
  async setRol(@Req() request: AuthenticatedRequest, @Body() body: SetRolDto) {
    try {
      await this.db
        .updateTable('usuarios')
        .set({ rol: body.rol })
        .where('id', '=', request.userId as string)
        .execute();
    } catch {
      throw new ConflictException('No se puede establecer el rol en esta cuenta');
    }
    return { rol: body.rol };
  }
}
