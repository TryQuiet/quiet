import { jest, beforeEach, describe, it, expect, afterEach, beforeAll, test } from '@jest/globals'
import EventEmitter from 'node:events'

describe('Race', () => {

  let ns: number[] = []
  let n = 0

  const setN = (i: number) => {
    n = i
    ns.push(n)
    console.log('n: ', n)
  }

  //

  const asyncA = async () => {
    setN(1)
    await new Promise(r => setTimeout(r, 2000))
    setN(3)
  }

  const asyncB = async () => {
    setN(2)
    await new Promise(r => setTimeout(r, 1000))
    setN(4)
  }

  //

  const asyncA1 = async () => {
    setTimeout(() => { setN(3) }, 2000)
    setN(1)
  }

  const asyncB1 = async () => {
    setTimeout(() => { setN(4) }, 1000)
    setN(2)
  }

  //

  const asyncA2 = async () => {
    for (let i = 0; i < 100_000; i++) {
      if (i % 10_000 === 0) {
        console.log("Taking time")
      }
    }
    setN(1)
  }

  const asyncB2 = async () => {
    setN(2)
  }

  const asyncC2 = async () => {
    asyncA2()
    setN(3)
  }

  const asyncD2 = async () => {
    asyncB2()
    setN(4)
  }

  //

  beforeEach(() => {
    console.log('reset')
    ns = []
    setN(0)
  })

  test('1: await', async () => {
    console.log('test 1')
    // Even though asyncA takes longer to run than asyncB this code
    // still appears to run more-or-less synchronously, I think due to
    // await.
    await asyncA()
    await asyncB()

    expect(ns).toEqual([0, 1, 3, 2, 4])
  })

  test('2: async', async () => {
    console.log('test 2')
    // Here it appears that JS interleaves instructions from both of
    // these functions. It starts asyncA, then when it hits the await,
    // it transfers to asyncB, then when the first await returns, it
    // continues that.
    //
    // It looks like setTimeout is part of why it acts this way in
    // this test.
    asyncA()
    asyncB()

    await new Promise(r => setTimeout(r, 3000))
    expect(ns).toEqual([0, 1, 2, 4, 3])
  })

  test('3: async', async () => {
    console.log('test 3')
    // Similar as the previous test
    asyncA1()
    asyncB1()

    await new Promise(r => setTimeout(r, 3000))
    expect(ns).toEqual([0, 1, 2, 4, 3])
  })

  test('4: async', async () => {
    console.log('test 4')
    // Here without setTimeout, it runs all async functions in the
    // order they were called.
    asyncC2()
    asyncD2()

    await new Promise(r => setTimeout(r, 3000))
    expect(ns).toEqual([0, 1, 3, 2, 4])
  })
})

describe('Race events', () => {

  class MyEmitter extends EventEmitter {}
  const emitter = new MyEmitter()

  let ns: number[] = []
  let n = 0

  const setN = (i: number) => {
    n = i
    ns.push(n)
    console.log('n: ', n)
  }

  //

  const asyncA = async () => {
    setN(1)
    asyncC()
    emitter.emit('eventC')
  }

  const asyncB = async () => {
    setN(2)
    asyncC()
    emitter.emit('eventC')
  }

  const asyncC = async () => {
    setN(3)
  }

  beforeEach(() => {
    console.log('reset')
    ns = []
    setN(0)
  })

  test('5: event', async () => {
    console.log('test 5')

    // It looks like EventEmitter is synchronous
    //
    // https://www.codementor.io/@simenli/demystifying-asynchronous-programming-part-2-node-js-eventemitter-7r51ivby4

    emitter.on('eventA', async () => {
      asyncA()
    })

    emitter.on('eventB', async () => {
      asyncB()
    })

    emitter.on('eventC', async () => {
      setN(4)
    })

    for (let i = 0; i < 5; i++) {
      console.log('Emitting event A')
      emitter.emit('eventA')
    }
    console.log('Emitting event B')
    emitter.emit('eventB')

    await new Promise(r => setTimeout(r, 3000))
    expect(ns).toEqual([0, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 1, 3, 4, 2, 3, 4])
  })
})

describe('Misc', () => {

  let ns: number[] = []
  let n = 0

  const setN = (i: number) => {
    n = i
    ns.push(n)
    console.log('n: ', n)
  }

  //

  beforeEach(() => {
    console.log('reset')
    ns = []
    setN(0)
  })

  test('6: misc', async () => {
    Promise.resolve()
      .then(function () {
        setN(1)
      })
      .then(function () {
        setN(2)
      });

    setN(3)
    setN(4)

    await new Promise(r => setTimeout(r, 1000))
    expect(ns).toEqual([0, 3, 4, 1, 2])
  })

  test('7: misc', async () => {
    let p = async () => {

    }
    let y = async () => {
      setN(1)
    }
    let z = async () => {
      setN(2)
    }
    let x = async () => {
      await p()
      await y()
      await z()
    }

    x()

    setN(3)
    setN(4)

    await new Promise(r => setTimeout(r, 1000))
    expect(ns).toEqual([0, 3, 4, 1, 2])
  })

  test('8: misc', async () => {
    let y = async () => {
      setN(1)
    }
    let z = async () => {
      setN(2)
    }
    let x = async () => {
      await y()
      await z()
    }

    x()

    setN(3)
    setN(4)

    await new Promise(r => setTimeout(r, 1000))
    expect(ns).toEqual([0, 1, 3, 4, 2])
  })

  test('9: misc', async () => {
    let y = async () => {
      setN(1)
    }
    let z = async () => {
      setN(2)
    }
    let x = async () => {
      y()
      z()
    }

    x()

    setN(3)
    setN(4)

    await new Promise(r => setTimeout(r, 1000))
    expect(ns).toEqual([0, 1, 2, 3, 4])
  })

  test('10: misc', async () => {
    let a = async () => {
      console.log('a')
    }
    let b = async () => {
      console.log('b')
    }

    a()
    b()

    console.log('c')
  })

  test('11: misc', async () => {
    let p = async () => {
      console.log('p')
    }
    let a = async () => {
      console.log('a')
    }
    let b = async () => {
      console.log('b')
    }

    let all = async () => {
      await p()
      await a()
      await b()
    }

    all()

    console.log('c')
  })

  // p
  // c
  // a
  // b

  test('12: misc', async () => {
    let p = async () => {}
    let a1 = async () => {
      console.log('created cert')
    }
    let a = async () => {
      console.log('create cert')
      await p()
      await a1()
    }
    let b1 = async () => {
      console.log('saved cert')
    }
    let b = async () => {
      console.log('save cert')
      await p()
      await b1()
    }

    let all = async () => {
      await p()
      await a()
      await b()
    }


    class MyEmitter extends EventEmitter {}
    const emitter = new MyEmitter()

    emitter.on('all', async () => {
      await all()
    })

    emitter.emit('all')
    emitter.emit('all')

    all()
    all()

    console.log('c')
  })
)
