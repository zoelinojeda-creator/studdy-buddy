import { IsString, Length } from 'class-validator';

export class UnirseAulaDto {
  @IsString()
  @Length(6, 6)
  codigo!: string;
}
