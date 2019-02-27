pipeline { 
  // use the repository Dockerfile for building the environment image
  agent { dockerfile true }
  stages { 
    stage('Setup development environment') { 
      steps { 
        sh 'node --version'  
        sh 'npm --version' 
        sh 'npm ci'
      }
    }
    stage('Lint') { 
      steps { 
        sh 'npm run lint'
      }
    }
  }
}
