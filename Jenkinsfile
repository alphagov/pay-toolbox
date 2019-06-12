pipeline {
  // use the repository Dockerfile for building the environment image
  // agent { dockerfile true }
  agent any
  options { timestamps() }
  parameters {
    booleanParam(name: 'SKIP_NPM_AUDIT', defaultValue: false, description: 'Run npm security audit. This should only ever be set to false if a known fix is not yet merged on a dependency.')
  }
  libraries { lib("pay-jenkins-library@master") }
  environment {
    npm_config_cache = 'npm-cache'
  }
  stages {
    stage('Prepare tagged docker container') {
      steps {
        script {
          env.image = "${gitCommit()}-${env.BUILD_NUMBER}"
          buildAppWithMetrics { app = "toolbox" }
        }
      }
    }
    stage('Docker CI') {
      agent { docker { image "govukpay/toolbox:${env.image}" } }
      stages {
        stage('Setup') {
          // agent { docker { image "govukpay/toolbox:${env.GIT_COMMIT}-${env.BUILD_NUMBER}" } }
          steps {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm ci'

            // @TODO(sfount) CI envrionment should be configured outside of direct Jenkinsfile call
            sh 'scripts/generate-dev-environment'
          }
        }
        stage('Security audit') {
          // agent { docker { image "govukpay/toolbox:${env.GIT_COMMIT}-${env.BUILD_NUMBER}" } }
          when {
            not { expression { return params.SKIP_NPM_AUDIT } }
          }
          steps {
            sh 'npm audit'
          }
        }
        stage('Lint') {
          // agent { docker { image "govukpay/toolbox:${env.GIT_COMMIT}-${env.BUILD_NUMBER}" } }
          steps {
            sh 'npm run lint'
          }
        }
        stage('Unit tests') {
          // agent { docker { image "govukpay/toolbox:${env.GIT_COMMIT}-${env.BUILD_NUMBER}" } }
          steps {
            sh 'npm run test:unit'
          }
        }
      }
    }
    // stage('Build') {
    //   steps {
    //     script {
    //       env.GIT_COMMIT = gitCommit()
    //       buildAppWithMetrics {
    //         app = "toolbox"
    //       }
    //     }
    //   }
    // }

    stage('Build and deploy') {
      stages {
        // @TODO(sfount) investigate using built-in Jenkins `docker.build()` and
        //               `docker.push()` commands in steps
        stage('Docker push') {
          steps {
            script {
              dockerTagWithMetrics { app = "toolbox" }
            }
          }
        }
        stage('Deploy') {
          when {
            branch 'master'
          }
          steps {
            deployEcs("toolbox")
          }
        }
        stage('Tag deployment') {
          when {
            branch 'master'
          }
          steps {
            tagDeployment("toolbox")
          }
        }
      }
    }
  }
}