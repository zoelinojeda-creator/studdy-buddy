import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KYSELY_INSTANCE } from '../database/database.module';
import { Database } from '../database/database.types';

// Sin 0/O/1/I para que no se confundan al compartir el codigo de viva voz.
const CODIGO_ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODIGO_LARGO = 6;
const INTENTOS_CODIGO = 5;

function generarCodigo(): string {
  let codigo = '';
  for (let i = 0; i < CODIGO_LARGO; i++) {
    codigo += CODIGO_ALFABETO[Math.floor(Math.random() * CODIGO_ALFABETO.length)];
  }
  return codigo;
}

@Injectable()
export class AulasService {
  constructor(@Inject(KYSELY_INSTANCE) private readonly db: Kysely<Database>) {}

  async crearAula(profesorId: string, nombre: string) {
    for (let intento = 0; intento < INTENTOS_CODIGO; intento++) {
      const codigo = generarCodigo();
      const existe = await this.db
        .selectFrom('aulas')
        .select('id')
        .where('codigo', '=', codigo)
        .executeTakeFirst();
      if (existe) continue;

      const aula = await this.db
        .insertInto('aulas')
        .values({ profesor_id: profesorId, nombre, codigo })
        .returning(['id', 'nombre', 'codigo', 'created_at'])
        .executeTakeFirstOrThrow();
      return aula;
    }
    throw new Error('No se pudo generar un codigo de aula unico');
  }

  misAulas(profesorId: string) {
    return this.db
      .selectFrom('aulas')
      .select(['id', 'nombre', 'codigo', 'created_at'])
      .where('profesor_id', '=', profesorId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async unirseAula(alumnoId: string, codigo: string) {
    const aula = await this.db
      .selectFrom('aulas')
      .select(['id', 'nombre'])
      .where('codigo', '=', codigo)
      .executeTakeFirst();
    if (!aula) throw new NotFoundException('No existe un aula con ese codigo');

    // xp_inicial = XP del alumno justo al unirse, para poder calcular
    // despues "XP ganado en esta aula" (ver rankingDeAula). Si ya era
    // miembro, el onConflict lo deja intacto — no se puede re-empezar.
    const alumno = await this.db
      .selectFrom('usuarios')
      .select('xp')
      .where('id', '=', alumnoId)
      .executeTakeFirstOrThrow();

    await this.db
      .insertInto('aula_miembros')
      .values({ aula_id: aula.id, alumno_id: alumnoId, xp_inicial: alumno.xp })
      .onConflict((oc) => oc.columns(['aula_id', 'alumno_id']).doNothing())
      .execute();

    return { aulaId: aula.id, nombre: aula.nombre };
  }

  misAulasAlumno(alumnoId: string) {
    return this.db
      .selectFrom('aula_miembros')
      .innerJoin('aulas', 'aulas.id', 'aula_miembros.aula_id')
      .innerJoin('usuarios', 'usuarios.id', 'aulas.profesor_id')
      .where('aula_miembros.alumno_id', '=', alumnoId)
      .select([
        'aulas.id as id',
        'aulas.nombre as nombre',
        'aulas.codigo as codigo',
        'usuarios.username as profesorUsername',
      ])
      .execute();
  }

  async alumnosDeAula(profesorId: string, aulaId: string) {
    const aula = await this.db
      .selectFrom('aulas')
      .select('id')
      .where('id', '=', aulaId)
      .where('profesor_id', '=', profesorId)
      .executeTakeFirst();
    if (!aula) throw new NotFoundException('Aula no encontrada');

    const filas = await this.db
      .selectFrom('aula_miembros')
      .innerJoin('usuarios', 'usuarios.id', 'aula_miembros.alumno_id')
      .leftJoin(
        (eb) =>
          eb
            .selectFrom('historial')
            .select(['user_id', (eb2) => eb2.fn.countAll().as('completadas')])
            .groupBy('user_id')
            .as('h'),
        (join) => join.onRef('h.user_id', '=', 'usuarios.id'),
      )
      .where('aula_miembros.aula_id', '=', aulaId)
      .select([
        'usuarios.id as alumnoId',
        'usuarios.username as username',
        'usuarios.avatar as avatar',
        'usuarios.xp as xp',
        'usuarios.level as level',
        'usuarios.streak as streak',
        'h.completadas as completadas',
      ])
      .execute();

    return filas.map(({ completadas, ...fila }) => ({
      ...fila,
      actividadesCompletadas: Number(completadas ?? 0),
    }));
  }

  // Pesos del puntaje combinado. xpGanado pesa mas porque es la unica
  // metrica especifica de ESTA aula (racha y nivel son de la cuenta entera).
  // Facil de ajustar si hace falta — no depende de tocar el resto del calculo.
  private readonly PESOS_RANKING = { xpGanado: 0.5, racha: 0.3, nivel: 0.2 };

  async rankingDeAula(userId: string, aulaId: string) {
    const aula = await this.db
      .selectFrom('aulas')
      .select(['id', 'profesor_id'])
      .where('id', '=', aulaId)
      .executeTakeFirst();
    if (!aula) throw new NotFoundException('Aula no encontrada');

    if (aula.profesor_id !== userId) {
      const esMiembro = await this.db
        .selectFrom('aula_miembros')
        .select('id')
        .where('aula_id', '=', aulaId)
        .where('alumno_id', '=', userId)
        .executeTakeFirst();
      if (!esMiembro) throw new NotFoundException('Aula no encontrada');
    }

    const filas = await this.db
      .selectFrom('aula_miembros')
      .innerJoin('usuarios', 'usuarios.id', 'aula_miembros.alumno_id')
      .where('aula_miembros.aula_id', '=', aulaId)
      .select([
        'usuarios.id as alumnoId',
        'usuarios.username as username',
        'usuarios.avatar as avatar',
        'usuarios.streak as racha',
        'usuarios.level as nivel',
        'usuarios.xp as xpActual',
        'aula_miembros.xp_inicial as xpInicial',
      ])
      .execute();

    // XP ganado puede dar negativo si el alumno gasto mas XP (Ropero/
    // Cuidado) del que gano desde que se unio — clampeado a 0, gastar XP
    // en cosmeticos no deberia bajarlo del piso del ranking.
    const base = filas.map((f) => ({
      alumnoId: f.alumnoId,
      username: f.username,
      avatar: f.avatar,
      racha: f.racha,
      nivel: f.nivel,
      xpGanado: Math.max(0, f.xpActual - f.xpInicial),
    }));

    const normalizar = (valor: number, min: number, max: number) =>
      max > min ? ((valor - min) / (max - min)) * 100 : 100;
    const rango = (valores: number[]) => ({ min: Math.min(...valores), max: Math.max(...valores) });

    const rangoRacha = rango(base.map((b) => b.racha));
    const rangoNivel = rango(base.map((b) => b.nivel));
    const rangoXp = rango(base.map((b) => b.xpGanado));

    const conPuntaje = base
      .map((b) => {
        const puntaje =
          this.PESOS_RANKING.xpGanado * normalizar(b.xpGanado, rangoXp.min, rangoXp.max) +
          this.PESOS_RANKING.racha * normalizar(b.racha, rangoRacha.min, rangoRacha.max) +
          this.PESOS_RANKING.nivel * normalizar(b.nivel, rangoNivel.min, rangoNivel.max);
        return { ...b, puntaje: Math.round(puntaje * 10) / 10 };
      })
      .sort((a, b) => b.puntaje - a.puntaje);

    return conPuntaje.map((entry, i) => ({ posicion: i + 1, ...entry }));
  }
}
