import {MigrationInterface, QueryRunner} from "typeorm";

export class migration1658719162707 implements MigrationInterface {
    name = 'migration1658719162707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shift" ADD "isPublished" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shift" DROP COLUMN "isPublished"`);
    }

}
