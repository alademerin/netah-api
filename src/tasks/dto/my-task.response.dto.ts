export class MyTaskResponseDto {
  id: number;
  title: string;
  description: string;
  reward: number;
  status: string;
  bidCount: number;
  createdAt?: Date;
}
