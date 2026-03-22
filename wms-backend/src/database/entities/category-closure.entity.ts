import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Closure table: mọi cặp (ancestor → descendant) và độ sâu,
 * phục vụ truy vấn cây / hậu duệ mà không đệ quy SQL.
 */
@Entity('category_closure')
@Index('IDX_category_closure_descendant', ['descendantId'])
export class CategoryClosure {
  @PrimaryColumn({ name: 'ancestor_id', type: 'uuid' })
  ancestorId: string;

  @PrimaryColumn({ name: 'descendant_id', type: 'uuid' })
  descendantId: string;

  @Column({ name: 'depth', type: 'int' })
  depth: number;
}
