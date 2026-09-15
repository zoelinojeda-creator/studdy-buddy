import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard, AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { RequireRolGuard } from '../auth/require-rol.guard';
import { RequireRol } from '../auth/require-rol.decorator';
import { AulasService } from './aulas.service';
import { CrearAulaDto } from './dto/crear-aula.dto';
import { UnirseAulaDto } from './dto/unirse-aula.dto';

@Controller('aulas')
@UseGuards(SupabaseAuthGuard, RequireRolGuard)
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Post()
  @RequireRol('profesor')
  crear(@Req() request: AuthenticatedRequest, @Body() body: CrearAulaDto) {
    return this.aulasService.crearAula(request.userId as string, body.nombre);
  }

  @Get('mias')
  @RequireRol('profesor')
  mias(@Req() request: AuthenticatedRequest) {
    return this.aulasService.misAulas(request.userId as string);
  }

  @Get(':id/alumnos')
  @RequireRol('profesor')
  alumnos(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.aulasService.alumnosDeAula(request.userId as string, id);
  }

  // Sin @RequireRol: lo puede ver el profesor dueño O un alumno miembro —
  // esa autorizacion mixta la resuelve el service, no un rol fijo.
  @Get(':id/ranking')
  ranking(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.aulasService.rankingDeAula(request.userId as string, id);
  }

  @Post('unirse')
  @RequireRol('alumno')
  unirse(@Req() request: AuthenticatedRequest, @Body() body: UnirseAulaDto) {
    return this.aulasService.unirseAula(request.userId as string, body.codigo);
  }

  @Get('mias-alumno')
  @RequireRol('alumno')
  miasAlumno(@Req() request: AuthenticatedRequest) {
    return this.aulasService.misAulasAlumno(request.userId as string);
  }
}
