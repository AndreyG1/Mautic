'use strict'

/**
 * adonis-logger
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const prettyMs = require('pretty-ms')
const onFinished = require('on-finished')
const moment = require('moment')
const { get } = require('lodash')
const util = require('util')

/**
 * Logs http request using AdonisJs in built logger
 */
class Logger {
  constructor({ request, response }, Logger) {
    this.request = request
    this.res = response.response
    this.Logger = Logger
  }

  /**
   * Whether config is set to use JSON
   *
   * @method isJson
   *
   * @return {Boolean}
   */
  get isJson() {
    return this.Logger.driver.config && this.Logger.driver.config.json
  }

  /**
   * Returns the diff in milliseconds using process.hrtime. Started
   * at time is required
   *
   * @method _diffHrTime
   *
   * @param  {Array}    startedAt
   *
   * @return {Number}
   *
   * @private
   */
  _diffHrTime(startedAt) {
    const diff = process.hrtime(startedAt)
    return (diff[0] * 1e9 + diff[1]) / 1e6
  }

  /**
   * Returns the log level based on the status code
   *
   * @method _getLogLevel
   *
   * @param  {Number}     statusCode
   *
   * @return {String}
   *
   * @private
   */
  _getLogLevel(statusCode) {
    if (statusCode < 400) {
      return 'info'
    }

    if (statusCode >= 400 && statusCode < 500) {
      return 'warning'
    }

    return 'error'
  }

  /**
   * Logs http request using the Adonis inbuilt logger
   *
   * @method log
   *
   * @param  {String} url
   * @param  {String} method
   * @param  {Number} statusCode
   * @param  {Array} startedAt
   * @param  {String} code
   *
   * @return {void}
   */
  log(url, method, statusCode, startedAt, code, ip) {
    const ms = prettyMs(this._diffHrTime(startedAt))
    const logLevel = this._getLogLevel(statusCode)

    const dateStr = moment().format('MM.DD HH:mm:ss')
    /**
     * Log normally when json is not set to true
     */
    if (!this.isJson) {
      // if (statusCode === 404) {
      //   this.Logger.transport('notfound')[logLevel](
      //     util.format('[%s] %s %s %s (%s) %s', dateStr, method, statusCode, url, ip, ms)
      //   )
      //   return
      // }
      this.Logger[logLevel]('[%s] %s %s %s (%s) %s', dateStr, method, statusCode, url, ip, ms)
      return
    }

    const payload = { method, statusCode, url, ms }
    if (code) {
      payload.code = code
    }
    this.Logger[logLevel]('http request', payload)
  }

  /**
   * Binds the hook to listen for finish event
   *
   * @method hook
   *
   * @return {void}
   */
  hook() {
    const start = process.hrtime()
    const url = this.request.url()
    const method = this.request.method()
    const headers = this.request.headers()
    const ip = get(headers, 'x-real-ip') || this.request.ip()

    onFinished(this.res, (error, res) => {
      this.log(url, method, res.statusCode, start, error ? error.code : null, ip)
    })
  }
}

module.exports = Logger
