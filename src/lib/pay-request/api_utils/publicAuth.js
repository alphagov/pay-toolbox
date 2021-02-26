const publicAuthMethods = function publicAuthMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const apiKeyTokens = function apiKeyTokens(id) {
    return axiosInstance.get(`/v1/frontend/auth/${id}`)
      .then(utilExtractData)
      .then((data) => data.tokens)
  }

  const createApiToken = function createApiToken(createTokenRequest) {
    return axiosInstance.post('/v1/frontend/auth', createTokenRequest).then(utilExtractData)
  }

  const deleteApiToken = function deleteApiToken(accountId, tokenId) {
    const payload = { token_link: tokenId }
    return axiosInstance.delete(`/v1/frontend/auth/${accountId}`, { data: payload })
  }

  return { apiKeyTokens, createApiToken, deleteApiToken }
}

module.exports = publicAuthMethods
