import { performance } from "node:perf_hooks";
const target = process.env.LOAD_TEST_URL ?? "http://127.0.0.1:3100/api/health/live";
const requests = Number(process.env.LOAD_TEST_REQUESTS ?? 100);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? 10);
const timings = []; let failures = 0; let cursor = 0;
async function worker() { while (cursor < requests) { cursor += 1; const start = performance.now(); try { const response = await fetch(target); if (!response.ok) failures += 1; } catch { failures += 1; } timings.push(performance.now() - start); } }
await Promise.all(Array.from({ length: concurrency }, worker));
timings.sort((a, b) => a - b);
const percentile = (p) => timings[Math.min(timings.length - 1, Math.ceil(timings.length * p) - 1)] ?? 0;
console.log(JSON.stringify({ target, requests, concurrency, p50Ms: Number(percentile(.5).toFixed(2)), p95Ms: Number(percentile(.95).toFixed(2)), errorRate: failures / requests }));
if (failures) process.exitCode = 1;
