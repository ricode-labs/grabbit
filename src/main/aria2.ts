import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import ky from "ky"
import { getAria2Executable } from "./paths"
import type { JsonRpcFailure, JsonRpcSuccess } from "./types"
import { aria2StartupArgs } from "./aria2.conf"
import { createServer } from "node:net"
import { createMapping } from "node-portmapping"
let aria2Process: ChildProcessWithoutNullStreams | null = null

// export const isAria2Running = () => Boolean(aria2Process)

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close()
        reject(new Error("Failed to get available aria2 RPC port"))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

function mapPort(btPort: number) {
  const mapping = createMapping(btPort, (info) => {
    if (info.state == "Success") {
      console.log(`${info.externalHost}:${info.externalPort}`)
    }
  })
}

export async function callAria2<T = unknown>(
  method: string,
  params: unknown[] = []
): Promise<T> {
  const data = await ky
    .post(`http://127.0.0.1:${rpcPort}/jsonrpc`, {
      json: {
        id: crypto.randomUUID(),
        jsonrpc: "2.0",
        method,
        params: [`token:${rpcSecret}`, ...params],
      },
    })
    .json<JsonRpcSuccess<T> | JsonRpcFailure>()
  if ("error" in data) {
    throw new Error(data.error.message)
  }
  return data.result
}

export async function startAria2() {
  if (aria2Process) {
    return
  }

  let btPort: number
  const rpcPort = await getAvailablePort()
  do {
    btPort = await getAvailablePort()
  } while (rpcPort == btPort)
  const rpcSecret = crypto.randomUUID()
  const aria2Path = getAria2Executable()

  aria2Process = spawn(
    aria2Path,
    await aria2StartupArgs(rpcPort, rpcSecret, btPort),
    {
      stdio: "pipe",
    }
  )

  aria2Process.on("exit", () => {
    aria2Process = null
  })

  aria2Process.stderr.on("data", (chunk) => {
    console.error(`[aria2] ${chunk}`)
  })
}

export async function stopAria2() {
  if (!aria2Process) {
    return
  }

  try {
    await callAria2("aria2.saveSession")
  } catch (error) {
    console.error("Failed to save aria2 session", error)
  }

  aria2Process.kill()
  aria2Process = null
}
