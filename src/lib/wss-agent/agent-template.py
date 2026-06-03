#!/usr/bin/env python3
"""WSS Agent for Management Dash - WebSocket remote terminal for HF Spaces.
Auto-injected by Management Dash. Do not edit manually."""

import asyncio
import json
import os
import subprocess
import sys
import time
import websockets

JWT_SECRET = "{{JWT_SECRET}}"
AGENT_PORT = int(os.environ.get("WSS_AGENT_PORT", "8765"))

async def verify_token(websocket):
    msg = await asyncio.wait_for(websocket.recv(), timeout=10)
    try:
        data = json.loads(msg)
        token = data.get("token", "")
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("spaceId")
    except Exception as e:
        await websocket.send(json.dumps({"error": f"Auth failed: {str(e)}"}))
        return None

async def handle_command(websocket, command_id, command):
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            cwd="/"
        )
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            await websocket.send(json.dumps({
                "type": "output",
                "commandId": command_id,
                "data": line.decode("utf-8", errors="replace")
            }))
        await proc.wait()
        await websocket.send(json.dumps({
            "type": "done",
            "commandId": command_id,
            "code": proc.returncode
        }))
    except Exception as e:
        await websocket.send(json.dumps({
            "type": "error",
            "commandId": command_id,
            "error": str(e)
        }))

async def handle_connection(websocket):
    space_id = await verify_token(websocket)
    if not space_id:
        return
    await websocket.send(json.dumps({"type": "auth_ok", "spaceId": space_id}))
    async for msg in websocket:
        try:
            data = json.loads(msg)
            if data.get("type") == "command":
                cmd = data.get("command", "")
                cmd_id = data.get("id", str(time.time()))
                asyncio.create_task(handle_command(websocket, cmd_id, cmd))
            elif data.get("type") == "ping":
                await websocket.send(json.dumps({"type": "pong"}))
        except json.JSONDecodeError:
            continue

async def main():
    print(f"[WSS Agent] Starting on port {AGENT_PORT}", flush=True)
    async with websockets.serve(handle_connection, "0.0.0.0", AGENT_PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[WSS Agent] Shutting down", flush=True)
