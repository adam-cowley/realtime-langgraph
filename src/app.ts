import express, { static as static_} from 'express'
import { readFileSync } from 'fs'
import { json } from 'body-parser'

import { langgraph, State } from './graph';
import { initSocketServer, io } from './socket';

const app = express()

app.use(json())
app.use(static_('public'))

app.get('/', (req, res) => {
  const html = readFileSync('./public/index.html').toString()

  res.send(html)
})

app.post('/message', async (req, res) => {
  const thread_id = req.headers['x-thread-id'] as string

  res.header('Content-type', 'text/event-stream')
    .header('Cache-Control', 'no-cache')
    .flushHeaders()

    const output = langgraph.invoke(
      { input: req.body.message },
      {
        configurable: {
          thread_id,
          res,
        }
      }
    )
    .then((result: State) => {
      // Message sent at last checkpoint - no need to send it here
      /*
      const last = result.messages.pop()

      if (last && res.writable) {
        // res.write(JSON.stringify({
        //   stage: 'END',
        //   message: last.content,
        // }))
        console.log('end', res.writable)
        }
      */

        // End the stream
      res.end()
    })

  res.on('close', () => {
    res.end()
  })
})

app.post('/message-sockets', async (req, res) => {
  const thread_id = req.headers['x-thread-id'] as string

  res.send(thread_id)

  const output = await langgraph.invoke(
    { input: req.body.message },
    {
      configurable: {
        thread_id,
      }
    }
  )

  io.to(thread_id).emit("RESULT", {
    message: output.messages[ output.messages.length -1 ].content
  })
})

const { server } = initSocketServer(app)


server.listen(3001, () => {
  console.log('Server listening on http://localhost:3001');

  // langgraph.invoke({
  //   input: 'hello'
  // }, { configurable: { thread_id: '000'} })
  //   .then(res => console.log('p', res))

})
