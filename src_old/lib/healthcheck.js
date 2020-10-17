const response = function response(req, res) {
  // dropwizard like application ping response
  const context = {
    ping: { healthy: true, message: 'Healthy' }
  }
  res.status(200).json(context)
}

module.exports = { response }
