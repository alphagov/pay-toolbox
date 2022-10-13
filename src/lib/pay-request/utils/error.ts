import {EntityNotFoundError, RESTClientError} from "../../errors";

export function handleEntityNotFound(entityName: string, entityId: string) {
  return (error: RESTClientError) => {
    if (error.data.response && error.data.response.status === 404) {
      throw new EntityNotFoundError(entityName, entityId)
    }
    throw error
  }
}
