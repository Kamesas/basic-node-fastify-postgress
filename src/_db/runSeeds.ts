import "dotenv/config";
import { db } from "./dbInstance";
import { seedUsers } from "./seeds/users";

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set in .env file");
  console.error("Please create a .env file with:");
  console.error(
    "DATABASE_URL=postgresql://username:password@localhost:5432/dbname"
  );
  process.exit(1);
}

async function runSeeds() {
  try {
    console.log("🌱 Starting seeds...");

    await seedUsers(db);

    console.log("✅ All seeds completed successfully");
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await db.destroy();
    process.exit(1);
  }
}

runSeeds().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
