
const io_ = io();
const SESSION_ID = "_ID"

let id = window.localStorage.getItem(SESSION_ID)

if (id === undefined || id === null) {
  id = Math.random().toString()

  window.localStorage.setItem(SESSION_ID, id)
}

document.getElementById('conversation').innerHTML = id

io_.on('connect', () => {
  io_.send('IDENTIFY', {
    type: 'IDENTIFY',
    id,
  })

  io_.on('WELCOME', e => {
    console.log('welcomed', e)
  })

  io_.on('UPDATE', e => {
    document.getElementById("stage").innerHTML = `${e.stage}: ${e.message || '-'}`

    console.log('update', e)
  })

  io_.on('RESULT', e => {
    console.log('result', e)

    document.getElementById("answer").innerHTML = e.message
    document.getElementById("stage").innerHTML = "complete"
  })
})
