import { PartialType } from '@nestjs/swagger';
import { CreateProductImageDto } from './create-product.dto';

export class UpdateProductImageDto extends PartialType(CreateProductImageDto) {}
