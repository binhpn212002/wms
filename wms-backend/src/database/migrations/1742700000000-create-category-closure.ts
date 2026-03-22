import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryClosure1742700000000 implements MigrationInterface {
  name = 'CreateCategoryClosure1742700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "category_closure" (
        "ancestor_id" uuid NOT NULL,
        "descendant_id" uuid NOT NULL,
        "depth" integer NOT NULL,
        CONSTRAINT "PK_category_closure" PRIMARY KEY ("ancestor_id", "descendant_id"),
        CONSTRAINT "FK_cc_ancestor" FOREIGN KEY ("ancestor_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cc_descendant" FOREIGN KEY ("descendant_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_cc_depth_nonnegative" CHECK ("depth" >= 0)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_closure_descendant" ON "category_closure" ("descendant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_closure_ancestor" ON "category_closure" ("ancestor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_category_closure_ancestor"`);
    await queryRunner.query(`DROP INDEX "IDX_category_closure_descendant"`);
    await queryRunner.query(`DROP TABLE "category_closure"`);
  }
}
