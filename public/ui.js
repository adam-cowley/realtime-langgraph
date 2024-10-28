const SESSION_ID = "_ID"

let id = window.localStorage.getItem(SESSION_ID)

if (id === undefined || id === null) {
  id = Math.random().toString()

  window.localStorage.setItem(SESSION_ID, id)
}

document.getElementById('conversation').innerHTML = id

document.getElementById("form").addEventListener('submit', async e => {
  e.preventDefault()

  // const controller = new AbortController()
  // const request = new Request(
  //   "/message",
  //   // { signal: controller.signal }
  //   { signal: AbortSignal.timeout(1000) }
  // )

  const res = await fetch('/message', {
    method: 'POST',
    body: JSON.stringify({
      message: document.getElementById('message').value
    }),
    headers: {
      'Content-type': 'application/json',
      "Accept": "text/event-stream",
      'x-thread-id': id,
    },
    signal: AbortSignal.timeout(2000),
  })

  const reader = res.body.getReader()

  const decoder = new TextDecoder("utf-8");
  let payload = null

  while (true) {
    const { value, done } = await reader.read();

    decoded = decoder.decode(value)
    console.log('decoded', JSON.stringify(decoded))

    // Empty
    if (decoded === '') {
      break
    }

    payload = JSON.parse(decoded)
    console.log('parsed as', payload)

    if (payload) {
      document.getElementById("stage").innerHTML = `${payload.stage || 'waiting'}: ${payload.message || '-'}`
    }

    if (done) {
      console.log('done', payload)
      break;
    }

  }

  document.getElementById("answer").innerHTML = payload.message
  document.getElementById("stage").innerHTML = "complete"
})
