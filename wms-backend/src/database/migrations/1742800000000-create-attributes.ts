import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributes1742800000000 implements MigrationInterface {
  name = 'CreateAttributes1742800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attributes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(64) NOT NULL,
        "name" character varying(255) NOT NULL,
        "sort_order" integer,
        "active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attributes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_attributes_code_not_deleted" ON "attributes" ("code") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_attributes_sort_order_name" ON "attributes" ("sort_order" NULLS LAST, "name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_attributes_sort_order_name"`);
    await queryRunner.query(`DROP INDEX "UQ_attributes_code_not_deleted"`);
    await queryRunner.query(`DROP TABLE "attributes"`);
  }
}
