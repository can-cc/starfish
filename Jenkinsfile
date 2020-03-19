pipeline {
    agent {
        docker {
            image 'node:12.16.0-stretch'
        }
    }
    triggers {
        pollSCM('*/1 * * * *')
    }
    environment {
        CI = 'true' 
        HOME = '.'
    }
    stages {
        stage('Npm install') {
            steps {
                sh 'npm install'
            }
        }
        stage('Test') { 
            steps {
                sh 'npm run test' 
            }
        }
    }
    post {
        always {
            rocketSend currentBuild.currentResult
        }
    }
}