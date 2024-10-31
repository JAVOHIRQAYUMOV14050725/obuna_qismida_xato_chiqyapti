import {  IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEnrollmentDto {
    @IsNotEmpty({ message: 'courseId should not be empty' })
    @IsNumber()
    courseId: number;
}
