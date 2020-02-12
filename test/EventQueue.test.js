/* globals describe, test, expect, beforeAll, afterAll */
const EventQueue = require('../src/EventQueue.js')

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

describe('Event Queue:', () => {
  let eventQueue
  let counter

  beforeAll(async () => {
    eventQueue = new EventQueue('testEventQueue', REDIS_URL)
    counter = 0

    // add event to print date
    eventQueue.addEventProcessor(
      'printDate', // eventName
      () => { // eventCallback
        console.log(`Current Date: ${new Date().toLocaleString()}`)
      },
    )

    // add counter event with side affect
    eventQueue.addEventProcessor(
      'incrementCounter', // eventName
      () => { // eventCallback
        counter += 1
      },
    )

    // add event to sleep
    eventQueue.addEventProcessor(
      'sleep', // eventName
      async ({ ms }) => { // eventCallback
        console.log('sleep starting')
        await new Promise((r) => setTimeout(r, ms))
        console.log('sleep ending')
      },
      2, // concurrency limit
    )

    // add event to throw error
    eventQueue.addEventProcessor(
      'throwError', // eventName
      ({ message }) => { // eventCallback
        throw new Error(message)
      },
    )

    // add event that will sanitize eventData
    eventQueue.addEventProcessor(
      'sanitizeEventData', // eventName
      ({ login, secret }) => { // eventCallback
        console.log(`Should not print secret from logger for ${login}`)
        return secret
      },
      1, // concurrency limit
      // custom stringify function to only stringify login and omit secret
      ({ login }) => (JSON.stringify({ login })),
    )
  })

  afterAll(async () => {
    await eventQueue.close()
  })

  test('can run single job successfully', async () => {
    const job = await eventQueue.enqueueEvent('printDate', {})
    await expect(job.finished()).resolves.toBe(undefined)
  })

  test('can run repeating job successfully', async () => {
    const job = await eventQueue.enqueueEvent('incrementCounter', {}, {
      cron: '* * * * * *', // runs every second
      limit: 3, // runs maximum of 3
    })
    await expect(job.finished()).resolves.toBe(undefined)
    await new Promise((r) => setTimeout(r, 3000))
    expect(counter).toEqual(3)
  })

  test('can execute async events', async () => {
    const job = await eventQueue.enqueueEvent('sleep', { ms: 10 })
    await expect(job.finished()).resolves.toBe(undefined)
  })

  test('can handle errors', async () => {
    const job = await eventQueue.enqueueEvent('throwError', { message: 'Dummy Error' })
    await expect(job.finished()).rejects.toThrow()
  })

  test('can santize event data for logging', async () => {
    const secret = 'shhhhh....secret'
    const job = await eventQueue.enqueueEvent('sanitizeEventData', {
      login: 'public-login',
      secret,
    })
    await expect(job.finished()).resolves.toBe(secret)
  })
})
