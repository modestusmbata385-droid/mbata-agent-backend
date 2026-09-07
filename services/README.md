# models/

Data-access layer mapped to the entities in blueprint Section 27
(users, profiles, assets, boss_connections, payments, finance tables,
business tables, academic tables, notifications, ai_conversations,
media_files, audit_logs). No ORM has been chosen yet — this skeleton
assumes raw SQL via `config/db.js`'s pg pool, but Prisma/Knex/Sequelize
can be dropped in here later without touching controllers.

