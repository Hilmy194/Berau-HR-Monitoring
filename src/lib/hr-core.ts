import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForHrCore = globalThis as unknown as {
  hrCorePool: Pool | undefined;
  hrCorePlainPool: Pool | undefined;
  hrCorePreferPlain: boolean | undefined;
};

export class HrCoreConfigurationError extends Error {
  constructor(message = "Konfigurasi koneksi HR Core belum lengkap.") {
    super(message);
    this.name = "HrCoreConfigurationError";
  }
}

export function isHrCoreConfigured() {
  return Boolean(
    process.env.HR_CORE_DATABASE_URL
      || (process.env.HR_CORE_HOST && process.env.HR_CORE_USER && process.env.HR_CORE_PASSWORD),
  );
}

function connectionString() {
  const configuredUrl = process.env.HR_CORE_DATABASE_URL?.trim();
  if (configuredUrl) {
    const url = new URL(configuredUrl);
    if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "prefer");
    if (url.searchParams.get("sslmode") === "prefer" && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  }

  const host = process.env.HR_CORE_HOST?.trim();
  const user = process.env.HR_CORE_USER?.trim();
  const password = process.env.HR_CORE_PASSWORD;
  if (!host || !user || !password) throw new HrCoreConfigurationError();

  const database = process.env.HR_CORE_DATABASE?.trim() || "hrcore";
  const port = process.env.HR_CORE_PORT?.trim() || "5432";
  const url = new URL("postgresql://localhost");
  url.hostname = host;
  url.port = port;
  url.pathname = `/${database}`;
  url.username = user;
  url.password = password;
  url.searchParams.set("sslmode", "prefer");
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

function createPool(disableSsl = false) {
  const url = new URL(connectionString());
  if (disableSsl) url.searchParams.set("sslmode", "disable");
  const pool = new Pool({
    connectionString: url.toString(),
    max: Math.min(20, Math.max(1, Number(process.env.HR_CORE_POOL_MAX ?? 5) || 5)),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    allowExitOnIdle: true,
    options: "-c default_transaction_read_only=on -c statement_timeout=15000 -c application_name=harmoni_hr_core",
  });

  pool.on("error", (error) => {
    console.error("[HR_CORE_POOL_ERROR]", error.message);
  });
  return pool;
}

export function getHrCorePool() {
  if (!isHrCoreConfigured()) throw new HrCoreConfigurationError();
  const pool = globalForHrCore.hrCorePool ?? createPool();
  globalForHrCore.hrCorePool = pool;
  return pool;
}

export async function queryHrCore<Row extends QueryResultRow>(text: string, values: readonly unknown[] = []) {
  const client = await connectHrCore();
  try {
    return await client.query<Row>(text, [...values]);
  } finally {
    client.release();
  }
}

export async function withReadOnlyHrCoreClient<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await connectHrCore();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function connectHrCore(): Promise<PoolClient> {
  if (globalForHrCore.hrCorePreferPlain) {
    const pool = globalForHrCore.hrCorePlainPool ?? createPool(true);
    globalForHrCore.hrCorePlainPool = pool;
    return pool.connect();
  }

  try {
    return await getHrCorePool().connect();
  } catch (error) {
    const sslMode = new URL(connectionString()).searchParams.get("sslmode");
    if (sslMode !== "prefer" || !(error instanceof Error) || error.message !== "The server does not support SSL connections") {
      throw error;
    }
    // pg does not automatically retry a non-TLS connection for libpq prefer.
    // Only fall back when the server explicitly reports no SSL support.
    globalForHrCore.hrCorePreferPlain = true;
    const pool = globalForHrCore.hrCorePlainPool ?? createPool(true);
    globalForHrCore.hrCorePlainPool = pool;
    return pool.connect();
  }
}
