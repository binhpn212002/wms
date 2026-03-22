import { PartialType } from '@nestjs/swagger';
import { CreateInboundDto } from './create-inbound.dto';

export class UpdateInboundDto extends PartialType(CreateInboundDto) {}
