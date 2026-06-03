import { generateWssSecret } from './jwt';
import { readSpaceFile, writeSpaceFile, listSpaceFiles } from '@/lib/api/huggingface';

interface PatchResult {
  success: boolean;
  message: string;
}

export async function patchSpaceWithWssAgent(
  token: string,
  spaceId: string
): Promise<PatchResult> {
  try {
    const secret = generateWssSecret();

    const files = await listSpaceFiles(token, spaceId);

    const hasDockerfile = files.some((f) => f.name.toLowerCase() === 'dockerfile');
    const hasStartSh = files.some((f) => f.name.toLowerCase() === 'start.sh');
    const hasRequirements = files.some((f) =>
      ['requirements.txt', 'packages.txt', 'apt.txt'].includes(f.name)
    );

    const agentContent = generateAgentContent(secret);

    let wrote = await writeSpaceFile(token, spaceId, 'wss_agent.py', agentContent);
    if (!wrote) return { success: false, message: 'Failed to write wss_agent.py' };

    if (hasDockerfile) {
      const dockerfile = await readSpaceFile(token, spaceId, 'Dockerfile');
      if (!dockerfile.includes('wss_agent.py')) {
        const patchedDocker = patchDockerfile(dockerfile);
        wrote = await writeSpaceFile(token, spaceId, 'Dockerfile', patchedDocker);
        if (!wrote) return { success: false, message: 'Failed to patch Dockerfile' };
      }
    } else if (hasStartSh) {
      const startSh = await readSpaceFile(token, spaceId, 'start.sh');
      if (!startSh.includes('wss_agent.py')) {
        const patchedStart = patchStartSh(startSh);
        wrote = await writeSpaceFile(token, spaceId, 'start.sh', patchedStart);
        if (!wrote) return { success: false, message: 'Failed to patch start.sh' };
      }
    }

    if (hasRequirements) {
      const reqFile = files.find((f) =>
        ['requirements.txt', 'packages.txt'].includes(f.name)
      );
      if (reqFile) {
        const reqContent = await readSpaceFile(token, spaceId, reqFile.name);
        if (!reqContent.includes('websockets') || !reqContent.includes('pyjwt')) {
          const patchedReq = reqContent + '\nwebsockets>=12.0\npyjwt>=2.8.0\n';
          await writeSpaceFile(token, spaceId, reqFile.name, patchedReq);
        }
      }
    }

    return {
      success: true,
      message: `WSS agent patched successfully. Secret: ${secret.slice(0, 8)}...`,
    };
  } catch (e) {
    return {
      success: false,
      message: `Patch failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

function generateAgentContent(secret: string): string {
  return `#!/usr/bin/env python3
"""WSS Agent for Management Dash"""
import asyncio, json, os, subprocess, sys, time
JWT_SECRET = "${secret}"
AGENT_PORT = int(os.environ.get("WSS_AGENT_PORT", "8765"))
async def verify_token(websocket):
    msg = await asyncio.wait_for(websocket.recv(), timeout=10)
    try:
        data = json.loads(msg)
        import jwt as pyjwt
        payload = pyjwt.decode(data.get("token",""), JWT_SECRET, algorithms=["HS256"])
        return payload.get("spaceId")
    except Exception as e:
        await websocket.send(json.dumps({"error":f"Auth failed: {str(e)}"}))
        return None
async def handle_command(websocket, cmd_id, command):
    try:
        proc = await asyncio.create_subprocess_shell(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True)
        while True:
            line = await proc.stdout.readline()
            if not line: break
            await websocket.send(json.dumps({"type":"output","commandId":cmd_id,"data":line.decode()}))
        await proc.wait()
        await websocket.send(json.dumps({"type":"done","commandId":cmd_id,"code":proc.returncode}))
    except Exception as e:
        await websocket.send(json.dumps({"type":"error","commandId":cmd_id,"error":str(e)}))
async def handle_connection(websocket):
    space_id = await verify_token(websocket)
    if not space_id: return
    await websocket.send(json.dumps({"type":"auth_ok","spaceId":space_id}))
    async for msg in websocket:
        try:
            data = json.loads(msg)
            if data.get("type")=="command":
                asyncio.create_task(handle_command(websocket, data.get("id",str(time.time())), data.get("command","")))
            elif data.get("type")=="ping":
                await websocket.send(json.dumps({"type":"pong"}))
        except: continue
async def main():
    async with websockets.serve(handle_connection, "0.0.0.0", AGENT_PORT):
        await asyncio.Future()
if __name__=="__main__":
    asyncio.run(main())
`;
}

function patchDockerfile(dockerfile: string): string {
  const lines = dockerfile.split('\n');
  const insertIndex = lines.findIndex(
    (l) => l.startsWith('CMD') || l.startsWith('ENTRYPOINT') || l.includes('supervisord')
  );
  const patch = `RUN pip install websockets pyjwt
COPY wss_agent.py /wss_agent.py
RUN echo "python /wss_agent.py &" >> /start.sh`;

  if (insertIndex >= 0) {
    lines.splice(insertIndex, 0, patch);
    return lines.join('\n');
  }
  return dockerfile + '\n' + patch;
}

function patchStartSh(startSh: string): string {
  const patch = `# WSS Agent for Management Dash
nohup python /app/wss_agent.py > /tmp/wss_agent.log 2>&1 &
`;
  if (startSh.startsWith('#!/')) {
    const firstNewline = startSh.indexOf('\n');
    return startSh.slice(0, firstNewline + 1) + '\n' + patch + startSh.slice(firstNewline + 1);
  }
  return patch + '\n' + startSh;
}
