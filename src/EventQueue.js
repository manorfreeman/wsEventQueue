const Queue = require('bull')
const uuid = require('uuid/v4')

/** Class representing an Event Queue backed by Redis */
class EventQueue {
  /**
   * Create an EventQueue
   * @param {string} queueName - The name of the queue.
   * @param {string} redisUrl - The Redis connection string.
   */
  constructor(queueName, redisURL) {
    this.eventQueue = new Queue(queueName, redisURL)
    // Define error listener to log errors that may occur outside event processor
    this.eventQueue.on('error', (error) => {
      console.log(`Error occurred with message: ${error.message || 'unavailable'}`)
    })
  }

  /**
   * @callback eventCallback callback function called when event is processed from queue
   * @param {Object} eventData - data supplied to callbackFunction when event is processed
   * @return {Promise<any>} - result of eventCallbackFn
   */
  /**
   * @callback stringifyFunction function for stringifying object
   * @param {Object} data - object to stringify
   * @returns {string} - string representation of object
   */
  /**
   * Defines processing function for events in EventQueue
   * @param {string} eventName - The name of the type of event for event processor
   * @param {eventCallback} callbackFn - The function for processing the event
   * @param {number} - [concurrency=1] - Specifies how to call handler in parallel respecting
   * this maximum value
   * @param {stringifyFunction} [eventDataStringifyFn] - Specifies how eventData should be
   * stringified for logging
   */
  addEventProcessor(
    eventName,
    callbackFn,
    concurrency = 1,
    eventDataStringifyFn = (eventData) => (`${JSON.stringify(eventData)}`),
  ) {
    const processor = async (job, done) => {
      // Note: generating uuid for logging event in processor instead of job.id
      // due to issue with combining custom job.id and repeatOptions
      // https://github.com/OptimalBits/bull/issues/961
      const jobUUID = uuid()
      const jobDescription = `(event: ${eventName}) (UUID: ${jobUUID})`
      try {
        console.log(`Event started processing: ${jobDescription} with data (EventData: ${eventDataStringifyFn(job.data)})`)
        const result = await callbackFn(job.data)
        console.log(`Event completed processing: ${jobDescription}`)
        done(null, result)
      } catch (error) {
        console.log(`Event failed processing: ${jobDescription} with message: ${error.message || 'message unavailable'}`)
        done(error)
      }
    }
    this.eventQueue.process(eventName, concurrency, processor)
  }

  /**
   * Enqueues event
   * @param {string} eventName - The name of the event being enqueued
   * @param {Object} eventData - The argument for the processing of the event
   * @param {Object} [repeatOptions] - (Optional) Repeat job according to a cron specification.
   * @param {string} [repeatOptions.cron] - Cron string
   * @param {string} [repeatOptions.tz] - Timezone
   * @param {Date | string | number} [repeatOptions.startDate] - Start date when the repeat job
   * should start repeating (only with cron).
   * @param {Date | string | number} [repeatOptions.endDate] - End date when the repeat job should
   * stop repeating.
   * @param {number} [repeatOptions.limit] - Number of times the job should repeat at max.
   * @return {Promise<Job>} - Returns job queued onto event queue
   * (https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#job)
   */
  async enqueueEvent(
    eventName,
    eventData,
    repeatOptions = undefined,
  ) {
    return this.eventQueue.add(eventName, eventData, {
      jobId: uuid(),
      removeOnComplete: true,
      repeat: repeatOptions,
    })
  }

  /**
   * Pauses processing of new jobs from queue
   * @param {boolean} [isLocal=false] - Specifies is pause is local or global to all workers
   * for given queue
   * @return {Promise} - Returns promise that resolves when queue is paused
   */
  async pause(isLocal = false) {
    return this.eventQueue.pause(isLocal)
  }

  /**
   * Resumes processing of new jobs from queue
   * @param {boolean} [isLocal=false] - Specifies if resume is local or global to all workers
   * for given queue
   * @return {Promise} - Returns promise that resolves when queue is resumed from being paused
   */
  async resume(isLocal = false) {
    return this.eventQueue.resume(isLocal)
  }

  /**
   * Closes the underlying redis client for graceful shutdown
   * @return {Promise} - Returns promise when client is closed
   */
  async close() {
    return this.eventQueue.close()
  }
}

module.exports = EventQueue
