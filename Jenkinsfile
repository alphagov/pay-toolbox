pipeline { 
  // use the repository Dockerfile for building the environment image
  agent { dockerfile true }
  parameters { 
    booleanParam(name: 'SKIP_NPM_AUDIT', defaultValue: false, description: 'Run npm security audit. This should only ever be set to false if a known fix is not yet merged on a dependency.')
  }
  environment { 
    npm_config_cache = 'npm-cache'
    HOME="${env.WORKSPACE}"
  }
  stages { 
    stage('Setup') { 
      steps { 
        sh 'node --version'  
        sh 'npm --version' 
        sh 'npm ci'

        // @TODO(sfount) CI envrionment should be configured outside of direct Jenkinsfile call 
        sh 'scripts/generate-dev-environment'
      }
    }
    stage('Security audit') { 
      when { 
        not { expression { return params.SKIP_NPM_AUDIT } }
      }
      steps { 
        sh 'npm audit'
      }
    }
    stage('Lint') { 
      steps { 
        sh 'npm run lint'
      }
    }
    stage('Unit tests') { 
      steps { 
        sh 'npm run test:unit'
      }
    }
  }
}
