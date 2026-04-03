import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/** Create: attributeId và valueId cùng có (khác null) hoặc cùng không (omit/null). */
@ValidatorConstraint({ name: 'createVariantAttributePair', async: false })
export class CreateVariantAttributePairConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments): boolean {
    const o = args.object as { attributeId?: unknown; valueId?: unknown };
    const a = o.attributeId;
    const v = o.valueId;
    const hasA = a !== undefined && a !== null;
    const hasV = v !== undefined && v !== null;
    return hasA === hasV;
  }

  defaultMessage(): string {
    return 'attributeId và valueId phải cùng gửi hoặc cùng bỏ/cùng null';
  }
}
