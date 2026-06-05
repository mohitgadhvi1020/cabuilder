/**
 * Demo / offline Supabase mock client.
 *
 * Activated when `NEXT_PUBLIC_DEMO_MODE === "true"` and there is no real
 * Supabase project configured. It implements the small subset of the
 * supabase-js surface this app actually uses (auth + a chainable query builder
 * over `companies` / `reports` / `profiles`, plus a no-op storage bucket),
 * backed entirely by the browser's localStorage. This lets the full
 * user → customers → reports flow be demoed with NO backend.
 *
 * It is intentionally browser-only; on the server it falls back to empty data.
 */

type Row = Record<string, unknown>;
type Table = "companies" | "reports" | "profiles";
type DB = Record<string, Row[]>;

const DB_KEY = "cma-demo-db-v1";
const SESSION_KEY = "cma-demo-session-v1";

const isBrowser = typeof window !== "undefined";

function readDB(): DB {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "{}") as DB;
  } catch {
    return {};
  }
}
function writeDB(db: DB) {
  if (isBrowser) localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function tableRows(db: DB, t: string): Row[] {
  if (!db[t]) db[t] = [];
  return db[t];
}
function uid(): string {
  if (isBrowser && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.abs(Date.now() ^ Math.floor(Math.random() * 1e9)).toString(16);
}
function now(): string {
  return new Date().toISOString();
}

/* ----------------------------- auth ------------------------------ */
interface DemoUser {
  id: string;
  email: string;
  password?: string;
  user_metadata?: Row;
}
interface Session {
  user: { id: string; email: string; user_metadata?: Row };
}

function readSession(): Session | null {
  if (!isBrowser) return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Session | null;
  } catch {
    return null;
  }
}
function writeSession(s: Session | null) {
  if (!isBrowser) return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}
function currentUserId(): string | null {
  return readSession()?.user.id ?? null;
}

const ok = <T>(data: T) => ({ data, error: null });
const fail = (message: string) => ({ data: null, error: { message } });

const auth = {
  async getUser() {
    const s = readSession();
    return { data: { user: s?.user ?? null }, error: null };
  },
  async getSession() {
    return { data: { session: readSession() }, error: null };
  },
  async signUp(args: { email: string; password?: string; options?: { data?: Row } }) {
    const db = readDB();
    const users = tableRows(db, "users") as unknown as DemoUser[];
    const email = args.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) {
      return fail("A user with this email already exists. Try signing in.");
    }
    const user: DemoUser = {
      id: uid(),
      email,
      password: args.password,
      user_metadata: args.options?.data ?? {},
    };
    users.push(user);
    // seed a profile row from sign-up metadata
    const profiles = tableRows(db, "profiles");
    profiles.push({
      id: user.id,
      full_name: (args.options?.data?.full_name as string) ?? "",
      organization: (args.options?.data?.organization as string) ?? "",
      phone: (args.options?.data?.phone as string) ?? "",
      role: "ca",
    });
    writeDB(db);
    const session: Session = { user: { id: user.id, email, user_metadata: user.user_metadata } };
    writeSession(session); // auto-confirm in demo
    return ok({ user: session.user, session });
  },
  async signInWithPassword(args: { email: string; password?: string }) {
    const db = readDB();
    const users = tableRows(db, "users") as unknown as DemoUser[];
    const email = args.email.trim().toLowerCase();
    const user = users.find((u) => u.email === email);
    if (!user) return fail("No demo account with this email. Sign up first.");
    if (user.password && args.password && user.password !== args.password) {
      return fail("Incorrect password.");
    }
    const session: Session = { user: { id: user.id, email, user_metadata: user.user_metadata } };
    writeSession(session);
    return ok({ user: session.user, session });
  },
  async signOut() {
    writeSession(null);
    return { error: null };
  },
  async exchangeCodeForSession() {
    return ok({ session: readSession() });
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } };
  },
};

/* ------------------- chainable query builder --------------------- */
const USER_SCOPED: Record<string, string> = { companies: "user_id", reports: "user_id" };

class QueryBuilder<T = unknown> implements PromiseLike<{ data: T; error: { message: string } | null }> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: [string, unknown][] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private payload: Row | Row[] | null = null;
  private wantSingle = false;
  private table: string;

  constructor(table: Table | string) {
    this.table = table;
  }

  select(_cols?: string) {
    if (this.op !== "insert" && this.op !== "update") this.op = "select";
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, asc: opts?.ascending !== false };
    return this;
  }
  single() {
    this.wantSingle = true;
    return this.run();
  }
  maybeSingle() {
    this.wantSingle = true;
    return this.run();
  }

  then<R1 = { data: T; error: { message: string } | null }, R2 = never>(
    onfulfilled?: ((v: { data: T; error: { message: string } | null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled as never, onrejected as never);
  }

  private matches(row: Row): boolean {
    return this.filters.every(([c, v]) => row[c] === v);
  }

  private async run(): Promise<{ data: T; error: { message: string } | null }> {
    const db = readDB();
    const rows = tableRows(db, this.table);
    const scope = USER_SCOPED[this.table];
    const me = currentUserId();

    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const inserted = items.map((it) => {
        const row: Row = {
          id: it.id ?? uid(),
          created_at: it.created_at ?? now(),
          updated_at: it.updated_at ?? now(),
          ...it,
        };
        rows.push(row);
        return row;
      });
      writeDB(db);
      const data = this.wantSingle ? inserted[0] : inserted;
      return { data: data as T, error: null };
    }

    if (this.op === "update") {
      const targets = rows.filter((r) => this.matches(r));
      targets.forEach((r) => Object.assign(r, this.payload, { updated_at: now() }));
      writeDB(db);
      const data = this.wantSingle ? targets[0] ?? null : targets;
      return { data: data as T, error: null };
    }

    if (this.op === "delete") {
      const keep = rows.filter((r) => !this.matches(r));
      db[this.table] = keep;
      writeDB(db);
      return { data: null as T, error: null };
    }

    // select
    let out = rows.filter((r) => this.matches(r));
    if (scope && me) out = out.filter((r) => r[scope] === me); // mimic row-level security
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out = [...out].sort((a, b) => {
        const av = String(a[col] ?? "");
        const bv = String(b[col] ?? "");
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    const data = this.wantSingle ? out[0] ?? null : out;
    return { data: data as T, error: null };
  }
}

/* ----------------------------- storage --------------------------- */
const storage = {
  from(_bucket: string) {
    return {
      async upload(_path: string, _file: unknown) {
        return { data: { path: _path }, error: null };
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: path } };
      },
    };
  },
};

export interface MockClient {
  auth: typeof auth;
  from: (table: string) => QueryBuilder;
  storage: typeof storage;
}

/** Pre-seeded demo credentials shown on the login screen. */
export const DEMO_CREDENTIALS = { email: "demo@demo.com", password: "demo1234" };

/**
 * Idempotently seed a ready-to-use demo account with one sample customer and
 * report, so the login screen works out-of-the-box with DEMO_CREDENTIALS.
 */
function ensureDemoSeed() {
  if (!isBrowser) return;
  const db = readDB();
  const users = tableRows(db, "users") as unknown as DemoUser[];
  if (users.some((u) => u.email === DEMO_CREDENTIALS.email)) return;

  const userId = uid();
  users.push({
    id: userId,
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
    user_metadata: { full_name: "Demo CA", organization: "Demo & Co." },
  });
  tableRows(db, "profiles").push({
    id: userId,
    full_name: "Demo CA",
    organization: "Demo & Co.",
    phone: "",
    role: "ca",
  });
  const companyId = uid();
  tableRows(db, "companies").push({
    id: companyId,
    user_id: userId,
    name: "Galaxy Techno Forge (India) Pvt. Ltd.",
    address: "Rajkot, Gujarat",
    created_at: now(),
  });
  tableRows(db, "reports").push({
    id: uid(),
    company_id: companyId,
    user_id: userId,
    title: "CMA Report",
    status: "draft",
    form_data: null, // falsy -> edit page loads a fresh default snapshot
    created_at: now(),
    updated_at: now(),
  });
  writeDB(db);
}

export function createMockClient(): MockClient {
  ensureDemoSeed();
  return {
    auth,
    from: (table: string) => new QueryBuilder(table),
    storage,
  };
}
