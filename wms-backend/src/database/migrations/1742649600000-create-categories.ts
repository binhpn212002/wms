import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategories1742649600000 implements MigrationInterface {
  name = 'CreateCategories1742649600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(64) NOT NULL,
        "name" character varying(255) NOT NULL,
        "parent_id" uuid,
        "active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_categories_code_not_deleted" ON "categories" ("code") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_parent_id" ON "categories" ("parent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_categories_parent_id"`);
    await queryRunner.query(`DROP INDEX "UQ_categories_code_not_deleted"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
