import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

let db: ReturnType<typeof drizzle> | null = null;

try {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set. Database operations will fail.");
    console.error("Set it in .env file, e.g.: DATABASE_URL=mysql://user:password@localhost:3306/crm");
  } else {
    if (!global._mysqlPool) {
      global._mysqlPool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    db = drizzle(global._mysqlPool, { schema, mode: 'default' });
    console.log("Database connected successfully");
  }
} catch (e) {
  console.error("Failed to initialize database connection:", e);
}

export { db };
