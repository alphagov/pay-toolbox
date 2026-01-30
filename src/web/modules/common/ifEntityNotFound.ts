import {EntityNotFoundError} from "../../../lib/errors";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
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