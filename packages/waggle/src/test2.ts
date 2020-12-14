import * as fs from 'fs'

let test
const data = fs.readFile('newloggingfile28.11.json', (e, data)  => {
  console.log(data)
  test = JSON.parse(data.toString())
  // console.log(test)
  // console.log(test[0][1])
  let counter
  let testing = 0
  function countUnique(iterable) {
    const result = new Set(iterable)
    // console.log('unique messages ids', result)
    return new Set(iterable).size;
  }
  let number = 1
  for (const el of test) {
    console.log('peerId', el[1][1].messagePayload.id)
    const ids = el[1].map(el => {
      return el.messagePayload.count
    })
    console.log(countUnique(ids))
    number = number + 1
  }
  console.log('total nodes connected', number)
    // console.log(el.messagePayload, 'test')
    // if (el.messagePayload.count === testing) {
    //   console.log(el.messagePayload)
    //   testing = testing + 1
    // } else {
    //   // console.log('skiping')
    // }
  })
