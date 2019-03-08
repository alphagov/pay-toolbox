pipeline { 
  // use the repository Dockerfile for building the environment image
  agent { dockerfile true }
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
    stage('Cypress tests') { 
      agent { 
        docker { image 'cypress/base:8' }
      }
      steps { 
        sh 'npm ci' 
        sh 'node --version'
        sh 'npm run test:cypress'
      }
    }
  }
}
