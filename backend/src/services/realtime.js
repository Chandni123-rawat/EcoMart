import { Server } from 'socket.io'
import { db } from './db.js'

const studentRoom = id => 'student:' + id

export function startRealtime(server, origin) {
  const io = new Server(server, { cors: { origin } })
  io.use(async (socket, next) => {
    const id = socket.handshake.auth?.student
    if (typeof id !== 'string' || !id) return next(new Error('Choose a demo student.'))
    try {
      const student = await db.user.findUnique({ where: { id }, select: { id: true } })
      if (!student) return next(new Error('Unknown demo student.'))
      socket.data.studentId = student.id
      next()
    } catch {
      next(new Error('Live updates are temporarily unavailable.'))
    }
  })
  io.on('connection', socket => socket.join(studentRoom(socket.data.studentId)))
  return io
}

// Controllers publish only after their database transaction commits.
export function publishRequest(req, result, { notify, message, availabilityChanged = false }) {
  const io = req.app.locals.io
  const participants = [result.buyerId, result.listing.sellerId]
  io.to(participants.map(studentRoom)).emit('requests:changed')
  for (const id of notify) {
    io.to(studentRoom(id)).emit('requests:notice', { message, requestId: result.id })
  }
  if (availabilityChanged) io.emit('listings:changed')
}
