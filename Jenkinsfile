pipeline {
    agent any

    environment {
        BASE_URL = 'https://ai-youtube-summarizer-zdia.vercel.app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }
        stage('Run Playwright Tests') {
            steps {
                sh 'npx playwright test'
            }
        }
    }

    post {
        always {
            script {
                // Disable Jenkins CSP (Content Security Policy) to allow styling, screenshots, and traces 
                // in the Playwright HTML report rendered by HTML Publisher.
                System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
            }
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report',
                reportTitles: 'AI YouTube Summarizer E2E Test Report'
            ])
        }
    }
}
