pipeline { 
  // use the repository Dockerfile for building the environment image
  agent { dockerfile true }
  stages { 
    stage('Setup') { 
      steps { 
        sh 'node --version'  
        sh 'npm --version' 
        sh 'npm ci'
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
    stage('E2E tests') { 
      steps { 
        sh 'npm run test:cypress'
      }
    }
  }
}
