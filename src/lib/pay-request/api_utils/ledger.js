import { EntityNotFoundError } from '../../errors'

const ledgerMethods = function ledgerMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = response => response.data
  const platformAdminQuery = 'override_account_id_restriction=true'

  const transaction = function transaction(id) {
    return axiosInstance.get(`/v1/transaction/${id}?${platformAdminQuery}`)
      .then(utilExtractData)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) throw new EntityNotFoundError('Transaction', id)
        throw error
      })
  }

  return { transaction }
}

module.exports = ledgerMethods
