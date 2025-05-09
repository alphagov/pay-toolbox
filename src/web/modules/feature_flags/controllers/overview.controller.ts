import { Request, Response } from 'express'
import { AppConfigRetriever, AppConfigUpdater } from '../../../../lib/aws/app_config/AppConfig'
import { FrontendConfig } from '../../../../lib/aws/app_config/frontend/FrontendConfig'

const frontendConfig = new AppConfigRetriever('frontend', 'frontend-config')
const frontendConfigUpdater = new AppConfigUpdater('e8qohba', '60lbvoa', 'x749d7v')

const get = async (req: Request, res: Response) => {
	const config = new FrontendConfig(JSON.parse(await frontendConfig.getConfig()))
	const lastDeployment = await frontendConfigUpdater.getLastDeployment()
	res.render('feature_flags/views/overview', {
    flash: req.flash(),
    lastDeployment: lastDeployment.Items[0] ?? {},
		config
	})
}

export {
	get
}
