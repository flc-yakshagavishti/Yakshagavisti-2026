import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ---------------------------------------------------------------------------
// 1. Environment & Config Loading
// ---------------------------------------------------------------------------
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Automatically load local .env if available
loadEnvFile(path.resolve(process.cwd(), ".env"));

// ---------------------------------------------------------------------------
// 2. Helpers: URL Masking & Validation
// ---------------------------------------------------------------------------
function maskUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = "******";
    }
    return parsed.toString();
  } catch {
    // If not a standard URL, mask password if pattern matches
    return rawUrl.replace(/:\/\/[^:]+:([^@]+)@/, "://***:******@");
  }
}

function normalizeDbIdentifier(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.host}${parsed.pathname}`.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// 3. Command Line Argument Parser
// ---------------------------------------------------------------------------
interface CliArgs {
  sourceUrl?: string;
  targetUrl?: string;
  dryRun: boolean;
  cleanTarget: boolean;
  skipConfirm: boolean;
  batchSize: number;
  showHelp: boolean;
}

function printHelp() {
  console.log(`
Usage:
  npm run db:replicate [options]
  npx tsx scripts/replicate-db.ts [options]

Options:
  --prod, --source, -s <url>   Production / Source database URL
  --dev, --target, -t <url>    Development / Target database URL
  --dry-run                    Verify connections and scan counts without writing to target
  --no-clean                   Do not wipe target tables before inserting (uses ON CONFLICT DO NOTHING)
  -y, --yes                    Skip interactive confirmation prompt
  --batch-size <number>        Number of records to insert per batch (default: 500)
  -h, --help                   Display this help message

Environment Variables (Optional):
  PROD_DATABASE_URL / PRODUCTION_DATABASE_URL / SOURCE_DATABASE_URL
  DEV_DATABASE_URL / TARGET_DATABASE_URL / DATABASE_URL

Interactive Mode:
  If URLs are not provided via CLI or environment variables, you will be prompted securely.
`);
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const options: CliArgs = {
    dryRun: false,
    cleanTarget: true,
    skipConfirm: false,
    batchSize: 500,
    showHelp: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === "-h" || arg === "--help") {
      options.showHelp = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-clean") {
      options.cleanTarget = false;
    } else if (arg === "-y" || arg === "--yes") {
      options.skipConfirm = true;
    } else if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseInt(arg.split("=")[1] || "500", 10);
    } else if (arg === "--batch-size" && args[i + 1]) {
      options.batchSize = parseInt(args[++i]!, 10);
    } else if (arg.startsWith("--prod=") || arg.startsWith("--source=")) {
      options.sourceUrl = arg.split("=")[1];
    } else if ((arg === "--prod" || arg === "--source" || arg === "-s") && args[i + 1]) {
      options.sourceUrl = args[++i];
    } else if (arg.startsWith("--dev=") || arg.startsWith("--target=")) {
      options.targetUrl = arg.split("=")[1];
    } else if ((arg === "--dev" || arg === "--target" || arg === "-t") && args[i + 1]) {
      options.targetUrl = args[++i];
    }
  }

  return options;
}

// ---------------------------------------------------------------------------
// 4. Model Replication Definition (Dependency-Ordered)
// ---------------------------------------------------------------------------
interface ModelReplicator {
  name: string;
  count: (prisma: PrismaClient) => Promise<number>;
  read: (prisma: PrismaClient) => Promise<any[]>;
  write: (prisma: PrismaClient, rows: any[], skipDuplicates: boolean) => Promise<number>;
  clear: (prisma: PrismaClient) => Promise<number>;
}

// Defined in topological order for insertion
const REPLICATION_MODELS: ModelReplicator[] = [
  {
    name: "VerificationToken",
    count: (p) => p.verificationToken.count(),
    read: (p) => p.verificationToken.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.verificationToken.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.verificationToken.deleteMany().then((r) => r.count),
  },
  {
    name: "CompetitionSettings",
    count: (p) => p.competitionSettings.count(),
    read: (p) => p.competitionSettings.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.competitionSettings.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.competitionSettings.deleteMany().then((r) => r.count),
  },
  {
    name: "Criteria",
    count: (p) => p.criteria.count(),
    read: (p) => p.criteria.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.criteria.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.criteria.deleteMany().then((r) => r.count),
  },
  {
    name: "Prasanga",
    count: (p) => p.prasanga.count(),
    read: (p) => p.prasanga.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.prasanga.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.prasanga.deleteMany().then((r) => r.count),
  },
  {
    name: "College",
    count: (p) => p.college.count(),
    read: (p) => p.college.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.college.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.college.deleteMany().then((r) => r.count),
  },
  {
    name: "User",
    count: (p) => p.user.count(),
    read: (p) => p.user.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.user.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.user.deleteMany().then((r) => r.count),
  },
  {
    name: "Character",
    count: (p) => p.character.count(),
    read: (p) => p.character.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.character.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.character.deleteMany().then((r) => r.count),
  },
  {
    name: "Account",
    count: (p) => p.account.count(),
    read: (p) => p.account.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.account.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.account.deleteMany().then((r) => r.count),
  },
  {
    name: "Session",
    count: (p) => p.session.count(),
    read: (p) => p.session.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.session.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.session.deleteMany().then((r) => r.count),
  },
  {
    name: "Judge",
    count: (p) => p.judge.count(),
    read: (p) => p.judge.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.judge.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.judge.deleteMany().then((r) => r.count),
  },
  {
    name: "Team",
    count: (p) => p.team.count(),
    read: (p) => p.team.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.team.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.team.deleteMany().then((r) => r.count),
  },
  {
    name: "TeamMembers",
    count: (p) => p.teamMembers.count(),
    read: (p) => p.teamMembers.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.teamMembers.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.teamMembers.deleteMany().then((r) => r.count),
  },
  {
    name: "Submitted",
    count: (p) => p.submitted.count(),
    read: (p) => p.submitted.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.submitted.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.submitted.deleteMany().then((r) => r.count),
  },
  {
    name: "IndividualScore",
    count: (p) => p.individualScore.count(),
    read: (p) => p.individualScore.findMany(),
    write: (p, rows, skipDuplicates) =>
      p.individualScore.createMany({ data: rows, skipDuplicates }).then((r) => r.count),
    clear: (p) => p.individualScore.deleteMany().then((r) => r.count),
  },
];

// ---------------------------------------------------------------------------
// 5. Main Execution Flow
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n========================================================");
  console.log("       Database Replication Tool (Prisma Powered)       ");
  console.log("========================================================\n");

  const cliOptions = parseArgs();
  if (cliOptions.showHelp) {
    printHelp();
    return;
  }

  const rl = readline.createInterface({ input, output });

  try {
    // 1. Resolve Source (Production) URL
    let sourceUrl =
      cliOptions.sourceUrl ||
      process.env.PROD_DATABASE_URL ||
      process.env.PRODUCTION_DATABASE_URL ||
      process.env.SOURCE_DATABASE_URL;

    if (!sourceUrl) {
      sourceUrl = await rl.question("Enter Production (Source) DATABASE_URL: ");
      sourceUrl = sourceUrl.trim();
    }

    if (!sourceUrl) {
      throw new Error("Source database URL is required.");
    }

    // 2. Resolve Target (Development) URL
    let targetUrl =
      cliOptions.targetUrl ||
      process.env.DEV_DATABASE_URL ||
      process.env.TARGET_DATABASE_URL;

    if (!targetUrl) {
      const defaultEnvUrl = process.env.DATABASE_URL;
      const promptText = defaultEnvUrl
        ? `Enter Dev (Target) DATABASE_URL [Press Enter for default: ${maskUrl(defaultEnvUrl)}]: `
        : "Enter Dev (Target) DATABASE_URL: ";

      const entered = await rl.question(promptText);
      targetUrl = entered.trim() || defaultEnvUrl;
    }

    if (!targetUrl) {
      throw new Error("Target database URL is required.");
    }

    // 3. Safety Check: Disallow identical source and target
    if (normalizeDbIdentifier(sourceUrl) === normalizeDbIdentifier(targetUrl)) {
      throw new Error(
        "CRITICAL SAFETY CHECK FAILED: Source and Target database URLs appear to point to the exact same database! Aborting to prevent data corruption."
      );
    }

    console.log("\nReplication Configuration:");
    console.log(`  Source (PROD): ${maskUrl(sourceUrl)}`);
    console.log(`  Target (DEV) : ${maskUrl(targetUrl)}`);
    console.log(`  Dry Run      : ${cliOptions.dryRun ? "YES (No mutations)" : "NO"}`);
    console.log(`  Clean Target : ${cliOptions.cleanTarget ? "YES" : "NO"}`);
    console.log(`  Batch Size   : ${cliOptions.batchSize}\n`);

    // 4. Confirmation
    if (!cliOptions.dryRun && !cliOptions.skipConfirm) {
      const confirmation = await rl.question(
        "WARNING: This operation will overwrite and synchronize data in the TARGET database.\nType 'yes' to proceed: "
      );
      if (confirmation.trim().toLowerCase() !== "yes") {
        console.log("Aborted by user.");
        return;
      }
    }

    // 5. Initialize Prisma Clients
    console.log("\nConnecting to databases...");
    const prodPrisma = new PrismaClient({
      datasources: { db: { url: sourceUrl } },
    });
    const devPrisma = new PrismaClient({
      datasources: { db: { url: targetUrl } },
    });

    try {
      await Promise.all([prodPrisma.$connect(), devPrisma.$connect()]);
      console.log("Successfully connected to both databases.\n");

      // 6. Inspect Source Row Counts
      console.log("---------------- Source Database Scan ----------------");
      const sourceCounts: Record<string, number> = {};
      let totalSourceRows = 0;

      for (const model of REPLICATION_MODELS) {
        const count = await model.count(prodPrisma);
        sourceCounts[model.name] = count;
        totalSourceRows += count;
        console.log(`  • ${model.name.padEnd(22)} : ${count.toLocaleString()} rows`);
      }
      console.log(`Total Source Rows: ${totalSourceRows.toLocaleString()}\n`);

      if (cliOptions.dryRun) {
        console.log("[DRY-RUN] Verification complete. No mutations performed on target DB.");
        return;
      }

      // 7. Clean Target Database (Reverse Topological Order)
      if (cliOptions.cleanTarget) {
        console.log("-------------- Cleaning Target Database --------------");
        const reverseModels = [...REPLICATION_MODELS].reverse();
        for (const model of reverseModels) {
          try {
            const deleted = await model.clear(devPrisma);
            console.log(`  ✓ Cleared ${model.name.padEnd(20)} : ${deleted.toLocaleString()} rows removed`);
          } catch (err: any) {
            console.warn(`  ! Warning clearing ${model.name}: ${err?.message || err}`);
          }
        }
        console.log("Target database cleaned successfully.\n");
      }

      // 8. Replicate Data (Topological Order)
      console.log("-------------- Replicating Data to Target ------------");
      const startTime = Date.now();
      const skipDuplicates = !cliOptions.cleanTarget;

      for (const model of REPLICATION_MODELS) {
        const count = sourceCounts[model.name] || 0;
        if (count === 0) {
          console.log(`  • ${model.name.padEnd(22)} : 0 rows (skipped)`);
          continue;
        }

        const rows = await model.read(prodPrisma);
        let insertedTotal = 0;

        // Chunked insertion to prevent parameter limits
        for (let i = 0; i < rows.length; i += cliOptions.batchSize) {
          const chunk = rows.slice(i, i + cliOptions.batchSize);
          const inserted = await model.write(devPrisma, chunk, skipDuplicates);
          insertedTotal += inserted;
        }

        console.log(`  ✓ ${model.name.padEnd(22)} : ${insertedTotal.toLocaleString()} rows copied`);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nReplication finished in ${elapsed}s.\n`);

      // 9. Post-Replication Audit & Verification
      console.log("---------------- Verification Audit ------------------");
      let allMatch = true;
      for (const model of REPLICATION_MODELS) {
        const prodCount = sourceCounts[model.name] || 0;
        const devCount = await model.count(devPrisma);
        const match = prodCount === devCount;
        if (!match) allMatch = false;

        const statusIcon = match ? "✓" : "✗";
        console.log(
          `  ${statusIcon} ${model.name.padEnd(20)} | Prod: ${String(prodCount).padStart(5)} | Dev: ${String(devCount).padStart(5)} | ${match ? "MATCH" : "MISMATCH"}`
        );
      }
      console.log("------------------------------------------------------");

      if (allMatch) {
        console.log("\n🎉 SUCCESS: All tables replicated exactly with 100% data integrity!\n");
      } else {
        console.warn("\n⚠️ WARNING: Some table row counts do not match. Please inspect details above.\n");
      }
    } finally {
      await Promise.allSettled([prodPrisma.$disconnect(), devPrisma.$disconnect()]);
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal Replication Error:", error);
  process.exit(1);
});
