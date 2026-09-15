import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearAulaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;
}
