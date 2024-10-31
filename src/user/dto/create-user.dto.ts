import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { User_Role } from '../../enums/user.role.enum';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    name: string;

    @IsNotEmpty()
    @IsEmail()
    @Length(1, 100)
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(6, 100) 
    password: string;

    @IsOptional()
    @IsEnum(User_Role)
    role: User_Role; 
}
