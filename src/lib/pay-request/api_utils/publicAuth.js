const publicAuthMethods = function publicAuthMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = response => response.data

  const apiKeyTokens = function apiKeyTokens(id) {
    return axiosInstance.get(`/v1/frontend/auth/${id}`)
      .then(utilExtractData)
      .then(data => data.tokens)
  }

  const deleteApiToken = function deleteApiToken(accountId, tokenId) {
    const payload = { token_link: tokenId }
    return axiosInstance.delete(`/v1/frontend/auth/${accountId}`, { data: payload })
  }

  return { apiKeyTokens, deleteApiToken }
}

module.exports = publicAuthMethods
