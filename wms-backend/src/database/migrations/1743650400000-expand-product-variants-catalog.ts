import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandProductVariantsCatalog1743650400000 implements MigrationInterface {
  name = 'ExpandProductVariantsCatalog1743650400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "currency_code" character varying(3) NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "list_price" numeric(18,2) NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "cost_price" numeric(18,2) NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "image_urls" jsonb NOT NULL DEFAULT '[]'::jsonb;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "min_stock" numeric(18,3) NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "max_stock" numeric(18,3) NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IX_product_variants_product_id_active"
      ON "product_variants" ("product_id", "active")
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_prices_nonneg";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_stock_nonneg";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_max_ge_min";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "CHK_product_variants_prices_nonneg" CHECK (
          ("list_price" IS NULL OR "list_price" >= 0) AND
          ("cost_price" IS NULL OR "cost_price" >= 0)
        );
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "CHK_product_variants_stock_nonneg" CHECK (
          ("min_stock" IS NULL OR "min_stock" >= 0) AND
          ("max_stock" IS NULL OR "max_stock" >= 0)
        );
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "CHK_product_variants_max_ge_min" CHECK (
          ("min_stock" IS NULL OR "max_stock" IS NULL OR "max_stock" >= "min_stock")
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_max_ge_min";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_stock_nonneg";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "CHK_product_variants_prices_nonneg";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IX_product_variants_product_id_active";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "max_stock";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "min_stock";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "image_urls";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "cost_price";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "list_price";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "currency_code";
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "active";
    `);
  }
}
