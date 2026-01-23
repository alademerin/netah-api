import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskCategoryDto {
  @ApiProperty({
    example: 'Grocery Shopping',
    description: 'Task Category Name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name!: string;

  @ApiProperty({
    example: 'Description',
    description: 'Brief explanation of the task category',
  })
  @IsString()
  description: string;
}
