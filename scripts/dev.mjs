// Zero-dependency dev orchestrator: starts frontend (:3000) + backend (:4000),
// prefixes their logs, and kills the whole tree on Ctrl+C or when either exits.
import { spawn, execSync } from "node:child_process";

const SERVICES = [
  { name: "web", dir: "frontend", color: "\x1b[36m" }, // cyan
  { name: "api", dir: "backend", color: "\x1b[35m" }, // magenta
];

function killTree(p) {
  if (process.platform === "win32") {
    // npm.cmd runs a tree of shells; killing only the wrapper orphans node children
    try { execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: "ignore" }); } catch {}
  } else {
    p.kill("SIGTERM");
  }
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const { p } of SERVICES) killTree(p);
  setTimeout(() => process.exit(code), 300);
}

// kill leftover node dev servers still listening on our ports, so a stale
// previous run can't make this one exit (Next refuses to boot twice)
function freePort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync("netstat -ano -p tcp", { encoding: "utf8" });
    const pids = new Set(
      out
        .split("\n")
        .map((l) => l.trim().match(new RegExp(`^TCP\\s+\\S+:${port}\\s+\\S+:\\S+\\s+LISTENING\\s+(\\d+)$`)))
        .filter(Boolean)
        .map((m) => m[1])
    );
    for (const pid of pids) {
      try {
        const name = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: "utf8" });
        if (name.startsWith('"node.exe"')) {
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
          console.log(`[pre] freed :${port} — killed leftover node PID ${pid}`);
        }
      } catch {}
    }
  } catch {}
}

freePort(3000);
freePort(4000);

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const { name, dir, color } of SERVICES) {
  const p = spawn("npm run dev", { cwd: dir, shell: true });
  SERVICES.find((s) => s.name === name).p = p;
  const pipe = (from) => {
    let buf = "";
    from.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines)
        if (line.trim()) process.stdout.write(`${color}[${name}]\x1b[0m ${line}\n`);
    });
  };
  pipe(p.stdout);
  pipe(p.stderr);
  p.on("exit", (code) => {
    console.log(`[${name}] exited (${code ?? "?"})`);
    shutdown(1); // one down, stop all — no half-running dev sessions
  });
}

console.log("LocalLift dev: web → http://localhost:3000 · api → http://localhost:4000  (Ctrl+C stops both)");
