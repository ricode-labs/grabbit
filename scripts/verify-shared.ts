import assert from "node:assert/strict"
import { buildAddTaskOptions, normalizeAria2Options, type AddTaskForm } from "../src/shared/grabbit"

const form: AddTaskForm = {
  uris: "https://example.com/file.zip",
  out: "file.zip",
  split: 8,
  dir: "/tmp/grabbit-downloads",
  userAgent: "GrabbitTest/1.0",
  authorization: "Basic abc123",
  referer: "https://example.com",
  cookie: "a=b",
  allProxy: "http://127.0.0.1:8080",
  showDownloading: true,
}

assert.deepEqual(buildAddTaskOptions(form), {
  out: "file.zip",
  split: 8,
  dir: "/tmp/grabbit-downloads",
  userAgent: "GrabbitTest/1.0",
  header: [
    "Authorization: Basic abc123",
    "Referer: https://example.com",
    "Cookie: a=b",
  ].join("\n"),
  allProxy: "http://127.0.0.1:8080",
})

assert.deepEqual(
  normalizeAria2Options({
    out: "file.zip",
    split: 8,
    dir: "/tmp/grabbit-downloads",
    userAgent: "GrabbitTest/1.0",
    header: "Referer: https://example.com",
    allProxy: "",
    dryRun: false,
    unused: undefined,
  }),
  {
    out: "file.zip",
    split: "8",
    dir: "/tmp/grabbit-downloads",
    "user-agent": "GrabbitTest/1.0",
    header: "Referer: https://example.com",
    "dry-run": "false",
  }
)

console.log("grabbit shared helpers OK")
