'use strict';

/**
 * Migration: Alter users.role ENUM from (admin, user) → (EMP, RM, APE, CFO)
 *
 * PostgreSQL does NOT support ALTER TYPE … DROP VALUE, so the safe approach is:
 *   1. Add a new ENUM type with the correct values.
 *   2. Change the column to use the new type (via USING cast).
 *   3. Drop the old type.
 *
 * The `down` migration reverses the process.
 *
 * ⚠️  If the table already has data, the USING cast will FAIL for any row
 *     whose role value is not in the target ENUM.  Truncate or migrate data
 *     before running this migration in an environment with existing users.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // 1. Create the new ENUM type
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_users_role_new" AS ENUM ('EMP', 'RM', 'APE', 'CFO');`,
        { transaction: t }
      );

      // 2. Remove the default so we can safely change the type
      await queryInterface.sequelize.query(
        `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;`,
        { transaction: t }
      );

      // 3. Change the column type using the new ENUM, casting existing values
      await queryInterface.sequelize.query(
        `ALTER TABLE "users"
           ALTER COLUMN "role"
           TYPE "enum_users_role_new"
           USING (
             CASE "role"::text
               WHEN 'admin' THEN 'CFO'::"enum_users_role_new"
               WHEN 'user'  THEN 'EMP'::"enum_users_role_new"
               ELSE 'EMP'::"enum_users_role_new"
             END
           );`,
        { transaction: t }
      );

      // 4. Drop the old ENUM type
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_users_role";`,
        { transaction: t }
      );

      // 5. Rename new type to the canonical name Sequelize expects
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";`,
        { transaction: t }
      );

      // 6. Re-apply the default
      await queryInterface.sequelize.query(
        `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMP';`,
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_users_role_old" AS ENUM ('admin', 'user');`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "users"
           ALTER COLUMN "role"
           TYPE "enum_users_role_old"
           USING (
             CASE "role"::text
               WHEN 'CFO' THEN 'admin'::"enum_users_role_old"
               ELSE 'user'::"enum_users_role_old"
             END
           );`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `DROP TYPE "enum_users_role";`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";`,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';`,
        { transaction: t }
      );
    });
  },
};
