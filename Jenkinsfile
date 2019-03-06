pipeline { 
  // use the repository Dockerfile for building the environment image
  /* agent none */
  agent { dockerfile true }
  /* agent { */ 
    /* docker { image 'cypress/base:8' } */
  /* } */
  stages { 
    stage('Setup') { 
      /* agent { dockerfile true } */
      steps { 
        sh 'node --version'  
        sh 'npm --version' 
        sh 'npm ci'

        // @TODO(sfount) CI envrionment should be configured outside of direct Jenkinsfile call 
        sh 'scripts/generate-dev-environment'
      }
    }
    stage('Security audit') { 
      /* agent { dockerfile true } */
      steps { 
        sh 'npm audit'
      }
    }
    stage('Lint') { 
      /* agent { dockerfile true } */
      steps { 
        sh 'npm run lint'
      }
    }
    stage('Unit tests') { 
      /* agent { dockerfile true } */
      steps { 
        sh 'npm run test:unit'
      }
    }
    stage('E2E tests') { 
      /* label 'docker' */
      agent { 
        docker {
          image 'cypress/base:8' 
        }
      }
      steps { 
        /* script { */  
          /* docker.image('cypress/base:8').withRun('') { c -> */ 
            /* docker.image('cypress/base:8').inside('') { */ 
              sh 'npm ci' 
              sh 'node --version'
              sh 'npm run test:cypress'
            /* } */
          /* } */
        /* } */
      }
    }
  }
}
