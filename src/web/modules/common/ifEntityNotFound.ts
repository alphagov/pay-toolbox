import {EntityNotFoundError} from "../../../lib/errors";

export function ifEntityNotFound (callback: Function, necessaryConditions: boolean = true) {
    return (e: Error): null => {
        if (e instanceof EntityNotFoundError && necessaryConditions) {
            callback()
            return null
        } else {
            throw e
        }
    }
}