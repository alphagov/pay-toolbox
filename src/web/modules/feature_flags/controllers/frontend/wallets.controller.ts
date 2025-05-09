import { Request, Response } from 'express'
import { AppConfigRetriever, AppConfigUpdater } from '../../../../../lib/aws/app_config/AppConfig'
import { FrontendConfig } from '../../../../../lib/aws/app_config/frontend/FrontendConfig'
import logger from '../../../../../lib/logger'

const frontendConfigRetriever = new AppConfigRetriever('frontend', 'frontend-config')
const frontendConfigUpdater = new AppConfigUpdater('e8qohba', '60lbvoa', 'x749d7v')

const get = async (req: Request, res: Response) => {
  const config = new FrontendConfig(JSON.parse(await frontendConfigRetriever.getConfig()))
  logger.debug(JSON.stringify(config))
  res.render('feature_flags/views/frontend/index', {
    csrf: req.csrfToken(),
		config
	})
}

const post = async (req: Request, res: Response) => {
  const walletSettings = req.body.wallets as string[]
  const newFrontendConfig = new FrontendConfig({
    "apple-pay": {
      enabled: walletSettings !== undefined && walletSettings.includes('applepay')
    },
    "google-pay": {
      enabled: walletSettings !== undefined && walletSettings.includes('googlepay')
    }
  })
  logger.debug(newFrontendConfig)
  try {
    const result = await frontendConfigUpdater.updateConfig(newFrontendConfig)
    logger.debug(JSON.stringify(result))
    req.flash('generic', `Configuration change set deploying [deployment_number: ${result.DeploymentNumber} state: ${result.State}]`)
  } catch (err) {
    req.flash('error', 'There was a problem deploying the change set, consult the logs for more information')
  }
  res.redirect('/feature-flags')
}

export {
  get,
  post
}
