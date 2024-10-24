import { Express } from "express";
import { Server } from "socket.io";
import { createServer } from 'http'

let server
export let io: Server

export function initSocketServer(app: Express) {
  server = createServer(app)
  io = new Server(server)

  io.on('connect', socket => {
    let id: string

    console.log('user connected')

    socket.on('disconnect', () => {
      console.log('user', id, 'left')
    })

    socket.on('message', (a, b) => {
      if (a === 'IDENTIFY') {
        id = b.id

        socket.join(b.id)
        console.log('welcome', id)
        // io.to(b.id).emit('WELCOME')
        io.emit('WELCOME', b.id)
      }
    })
  })

  // io.on('message', e => {
  //   console.log('message', e)
  // })

  return { server, io }
}
