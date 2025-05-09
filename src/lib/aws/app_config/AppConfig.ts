import { AppConfigDataClient, StartConfigurationSessionCommand, GetLatestConfigurationCommand } from "@aws-sdk/client-appconfigdata"
import { AppConfigClient, CreateHostedConfigurationVersionCommand, StartDeploymentCommand, ListDeploymentsCommand } from "@aws-sdk/client-appconfig"

import logger from '../../logger'
import { FrontendConfig } from "./frontend/FrontendConfig"

const ENV = 'dev'

class AppConfigRetriever {
  private client
  private configurationToken: string
  private configuration: string
  private appId: string
  private profileId: string

  constructor(appId: string, profileId: string) {
    this.client = new AppConfigDataClient({
        region: 'eu-west-1'
    })
    this.appId = appId
    this.profileId = profileId
    this.configurationToken = null
    this.configuration = null
  }

  async getConfig() {
    if (!this.configurationToken) {
      const session = await this.client.send(
        new StartConfigurationSessionCommand({
          ApplicationIdentifier: this.appId,
          ConfigurationProfileIdentifier: this.profileId,
          EnvironmentIdentifier: ENV
        })
      )
      this.configurationToken = session.InitialConfigurationToken
    }

    const response = await this.client.send(
      new GetLatestConfigurationCommand({
        ConfigurationToken: this.configurationToken
      })
    )

    this.configurationToken = response.NextPollConfigurationToken

    const configFromApi = response.Configuration.transformToString()

    if (configFromApi) {
      this.configuration = configFromApi
      logger.debug('[GetLatestConfiguration] Contents have changed since the last call, updating configuration...')
    } else {
      logger.debug('[GetLatestConfiguration] No change')
    }

    return this.configuration
  }
}

class AppConfigUpdater {
  private client
  private appId: string
  private profileId: string
  private envId: string

  constructor(appId: string, profileId: string, envId: string) {
    this.client = new AppConfigClient({
      region: 'eu-west-1'
    })
    this.appId = appId
    this.profileId = profileId
    this.envId = envId
  }

  async getLastDeployment() {
    const input = {
      ApplicationId: this.appId,
      EnvironmentId: this.envId,
      MaxResults: 1
    };
    const command = new ListDeploymentsCommand(input)
    const result = await this.client.send(command)
    return result
  }

  async updateConfig(payload: FrontendConfig) {
    try {
        const data = {
            "flags": {
                "apple-pay": {
                    "name": "APPLE PAY"
                },
                "google-pay": {
                    "name": "GOOGLE PAY"
                }
            },
            "values": {
                "apple-pay": {
                    "enabled": payload.applePay === 'ON'
                },
                "google-pay": {
                    "enabled": payload.googlePay === 'ON'
                }
            },
            "version": "1"
        }

        const content = Buffer.from(JSON.stringify(data))
        const createParams = {
          ApplicationId: this.appId,
          ConfigurationProfileId: this.profileId,
          ContentType: 'application/json',
          Content: content
        }

        const newVersionResult = await this.client.send(
          new CreateHostedConfigurationVersionCommand(createParams)
        )

        logger.debug('Created new configuration version:', newVersionResult.VersionNumber)

        const deployParams = {
          ApplicationId: this.appId,
          ConfigurationProfileId: this.profileId,
          ConfigurationVersion: newVersionResult.VersionNumber.toString(),
          EnvironmentId: this.envId,
          DeploymentStrategyId: 'AppConfig.AllAtOnce'
        }

        const deployResult = await this.client.send(
          new StartDeploymentCommand(deployParams)
        )

        logger.debug('Configuration deployment started:', deployResult.DeploymentNumber)
        return deployResult
      } catch (error) {
        logger.error('Error updating configuration:', error)
        throw error
      }
  }
}

export {
    AppConfigRetriever,
    AppConfigUpdater
}
