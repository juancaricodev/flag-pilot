import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
