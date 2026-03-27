import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransfersTables1710000000000 implements MigrationInterface {
  name = 'CreateTransfersTables1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP NULL,
        "document_no" character varying(64) NOT NULL,
        "document_date" date NOT NULL,
        "status" character varying(32) NOT NULL,
        "note" text NULL,
        "completed_at" TIMESTAMPTZ NULL,
        CONSTRAINT "PK_transfers_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_transfers_document_no" ON "transfers" ("document_no") WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transfer_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP NULL,
        "transfer_id" uuid NOT NULL,
        "variant_id" uuid NOT NULL,
        "quantity" numeric(18,4) NOT NULL,
        "warehouse_id_from" uuid NOT NULL,
        "location_id_from" uuid NOT NULL,
        "warehouse_id_to" uuid NOT NULL,
        "location_id_to" uuid NOT NULL,
        CONSTRAINT "PK_transfer_lines_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IX_transfer_lines_transfer_id" ON "transfer_lines" ("transfer_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_transfer" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_variant" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT;
    `);

    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_wh_from" FOREIGN KEY ("warehouse_id_from") REFERENCES "warehouses"("id") ON DELETE RESTRICT;
    `);
    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_loc_from" FOREIGN KEY ("location_id_from") REFERENCES "locations"("id") ON DELETE RESTRICT;
    `);
    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_wh_to" FOREIGN KEY ("warehouse_id_to") REFERENCES "warehouses"("id") ON DELETE RESTRICT;
    `);
    await queryRunner.query(`
      ALTER TABLE "transfer_lines"
        ADD CONSTRAINT "FK_transfer_lines_loc_to" FOREIGN KEY ("location_id_to") REFERENCES "locations"("id") ON DELETE RESTRICT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_loc_to";`);
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_wh_to";`);
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_loc_from";`);
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_wh_from";`);
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_variant";`);
    await queryRunner.query(`ALTER TABLE "transfer_lines" DROP CONSTRAINT IF EXISTS "FK_transfer_lines_transfer";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IX_transfer_lines_transfer_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transfer_lines";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_transfers_document_no";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transfers";`);
  }
}

