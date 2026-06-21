import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator';

export class UpdateFlagDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whitelist?: string[];
}
