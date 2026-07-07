import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPct?: number;
}
