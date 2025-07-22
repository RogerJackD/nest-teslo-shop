import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto{

    @IsOptional()
    @IsPositive()
    @Type( () => Number ) //enambleImplicitConversions=true
    limit?: number;

    @IsOptional()
    @IsPositive()
    @Min(0)
    @Type( () => Number )
    offset?: number;
}