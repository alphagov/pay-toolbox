import logger from "./../../../lib/logger";
import {broadcast} from "../../../lib/pay-request/typed_clients/client";
import {toFormattedDate} from "./../../../lib/format";

interface HealthCheckResult {
  name: string;
  healthCheckPassed: boolean;
}

const totalHealthyServices = function totalHealthyServices(serviceHealthCheckResults: HealthCheckResult[]) {
  return serviceHealthCheckResults
    .filter((healthCheckResult) => healthCheckResult.healthCheckPassed)
    .length
}

export async function healthCheck() {
  const results = await broadcast('healthcheck')
  const healthChecks: HealthCheckResult[] = results.map((result) => ({ name: result.app, healthCheckPassed: result.success }))
  const healthCheckCompleteTimestamp = toFormattedDate(new Date())
  logger.info(`Health check completed ${totalHealthyServices(healthChecks)}/${healthChecks.length} services responded.`)
  return {completedAt: healthCheckCompleteTimestamp, results: healthChecks}
}
