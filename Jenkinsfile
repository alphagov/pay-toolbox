pipeline {
  agent any
  options { timestamps() }
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
      post { failure { postMetric("toolbox.docker-build.failure", 1) } }
    }
    stage('Docker CI') {
      agent { docker { image "govukpay/toolbox:${env.image}" } }
      stages {
        stage('Setup') {
          steps {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm ci'

            // @TODO(sfount) CI envrionment should be configured outside of direct Jenkinsfile call
            sh 'node scripts/generate-dev-environment.js'
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
   stage('Push and deploy') {
      stages {
        // @TODO(sfount) investigate using built-in Jenkins `docker.build()` and
        //               `docker.push()` commands in steps
        stage('Docker push') {
          steps {
            script {
              dockerTagWithMetrics { app = "toolbox" }
            }
          }
          post { failure { postMetric("toolbox.docker-tag.failure", 1) } }
        }
        stage('Deploy') {
          when {
            branch 'master'
          }
          steps {
            deployEcs("toolbox")
          }
        }
      }
    }
    stage('Tag deployment') {
      failFast true
      parallel {
        stage('Tag deployment') {
          when {
            branch 'master'
          }
          steps {
            tagDeployment("toolbox")
          }
        }
        stage('Deploy notification') {
          when {
            branch 'master'
          }
          steps {
            triggerGraphiteDeployEvent("toolbox")
          }
        }
      }
    }
  }
  post {
    // build wide post metrics
    failure { postMetric(appendBranchSuffix("toolbox") + ".failure", 1) }
    success { postSuccessfulMetrics(appendBranchSuffix("toolbox")) }
  }
}
