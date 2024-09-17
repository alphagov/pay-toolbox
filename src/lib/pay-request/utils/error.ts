import {EntityNotFoundError, RESTClientError} from "../../errors";
import {Charge} from "../services/connector/types";

export function handleEntityNotFound(entityName: string, entityId: string) {
  return (error: RESTClientError) => {
    if (error.data.response && error.data.response.status === 404) {
      throw new EntityNotFoundError(entityName, entityId)
    }
    throw error
  }
}

export function handleChargeNotFoundForParityCheck(entityName: string, entityId: string, parityCheck = false) {
  return (error: RESTClientError) => {
    if (error.data.response && error.data.response.status === 404) {
      if (parityCheck) {
        const chargeNotFound: Charge = { charge_id: 'Not found', amount: undefined, total_amount: undefined, fee: undefined, net_amount: undefined, description: undefined, reference: undefined, payment_provider: undefined }
        return chargeNotFound
      }
      throw new EntityNotFoundError(entityName, entityId)
    }
    throw error
  }
}
