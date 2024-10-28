import express, { static as static_} from 'express'
import { readFileSync } from 'fs'
import { json } from 'body-parser'

import { langgraph, State } from './graph';
import { initSocketServer, io } from './socket';

import { BaseMessage } from '@langchain/core/messages';

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

  const controller = new AbortController();

  res.on('close', () => {
    controller.abort('Connection Closed')
    res.end()
  })

  try {

    for await (
      const { messages, stage } of await langgraph.stream(
        { input: req.body.message },
        {
          configurable: { thread_id, },
          streamMode: "values",
          signal: controller.signal,
        })
    ) {
      if (messages?.length) {
        const last = (messages as BaseMessage[]).pop()

        res.write(JSON.stringify({
          stage,
          message: last?.content})
        )
      }
    }

    res.end()
  }
  catch (e) {
    console.log(e)
  }
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
