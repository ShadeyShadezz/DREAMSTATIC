import { spawn } from 'node:child_process'
import net from 'node:net'

const DEV_PORT = Number(process.env.PORT || 3000)

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()

    socket.setTimeout(400)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      resolve(false)
    })

    socket.connect(port, '127.0.0.1')
  })
}

if (await isPortInUse(DEV_PORT)) {
  console.error(`Port ${DEV_PORT} is already in use. Stop the existing dev server before starting a new one.`)
  console.error('If you need a clean restart, run: npm run dev:reset')
  process.exit(1)
}

const env = {
  ...process.env,
  NEXT_DISABLE_WEBPACK_CACHE: '1',
}

const child = spawn(
  process.execPath,
  ['--max-old-space-size=4096', './node_modules/next/dist/bin/next', 'dev'],
  { stdio: 'inherit', env }
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
