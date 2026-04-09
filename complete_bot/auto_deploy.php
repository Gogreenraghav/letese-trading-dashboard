<?php
/**
 * Website Questionnaire Bot - Auto Deploy Script
 * Upload this to your server and visit it in browser
 * It will automatically deploy the complete bot
 */

// Configuration
$BOT_FILES = [
    'index.html' => '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Website Questionnaire Bot - Complete Solution</title>
    
    <!-- CDN Libraries -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mustache.js/4.2.0/mustache.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js"></script>
    
    <!-- Three.js for 3D -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <style>
        :root {
            --primary-color: #4CAF50;
            --secondary-color: #2196F3;
            --accent-color: #FF9800;
            --dark-color: #333;
            --light-color: #f8f9fa;
        }
        
        body {
            font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        
        .bot-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .bot-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .bot-header h1 {
            margin: 0;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .message {
            display: flex;
            margin-bottom: 20px;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .bot-message {
            flex-direction: row;
        }
        
        .user-message {
            flex-direction: row-reverse;
        }
        
        .avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
            margin: 0 10px;
        }
        
        .bot-avatar {
            background: var(--primary-color);
            color: white;
        }
        
        .user-avatar {
            background: var(--secondary-color);
            color: white;
        }
        
        .message-content {
            max-width: 70%;
            min-width: 200px;
        }
        
        .message-text {
            padding: 15px 20px;
            border-radius: 20px;
            position: relative;
            word-wrap: break-word;
        }
        
        .bot-message .message-text {
            background: white;
            border: 2px solid #e0e0e0;
            border-top-left-radius: 0;
        }
        
        .user-message .message-text {
            background: var(--primary-color);
            color: white;
            border-top-right-radius: 0;
        }
        
        .message-time {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
        
        .bot-message .message-time {
            text-align: left;
            margin-left: 10px;
        }
        
        .user-message .message-time {
            text-align: right;
            margin-right: 10px;
        }
        
        .options-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        }
        
        .option-btn {
            padding: 12px 20px;
            border: 2px solid #ddd;
            border-radius: 10px;
            background: white;
            text-align: left;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 16px;
        }
        
        .option-btn:hover {
            border-color: var(--primary-color);
            background: #f1f8e9;
            transform: translateX(5px);
        }
        
        .language-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        
        .language-btn {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }
        
        .language-btn:hover {
            border-color: var(--primary-color);
            transform: scale(1.05);
        }
        
        .language-btn.active {
            border-color: var(--primary-color);
            background: var(--primary-color);
            color: white;
        }
        
        .input-container {
            padding: 20px;
            background: white;
            border-top: 2px solid #e0e0e0;
            display: flex;
            gap: 10px;
        }
        
        .input-container input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
        }
        
        .input-container button {
            padding: 15px 30px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }
        
        .progress-bar {
            height: 6px;
            background: #e0e0e0;
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--primary-color);
            border-radius: 3px;
            transition: width 0.5s ease;
        }
        
        .question-counter {
            text-align: right;
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .summary-card {
            background: white;
            border: 2px solid var(--primary-color);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .summary-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .summary-item:last-child {
            border-bottom: none;
        }
        
        .download-btn {
            display: block;
            width: 100%;
            padding: 15px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .bot-container {
                height: 95vh;
                border-radius: 0;
            }
            
            .message-content {
                max-width: 85%;
            }
            
            .language-selector {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        .typing-indicator {
            display: flex;
            gap: 5px;
            padding: 10px;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
    </style>
</head>
<body>
    <div class="bot-container">
        <div class="bot-header">
            <h1>
                <i class="fas fa-robot"></i>
                Website Questionnaire Bot
                <span class="badge bg-light text-dark">v2.0</span>
            </h1>
            <p>Complete multilingual bot with 3D support</p>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <!-- Messages will be inserted here -->
            <div class="typing-indicator" id="typingIndicator" style="display: none;">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" id="userInput" placeholder="Type your message here..." disabled>
            <button id="sendButton" onclick="sendMessage()" disabled>
                <i class="fas fa-paper-plane"></i> Send
            </button>
        </div>
    </div>
    
    <!-- Templates -->
    <script id="languageTemplate" type="text/template">
        <div class="message bot-message">
            <div class="avatar bot-avatar">🌐</div>
            <div class="message-content">
                <div class="message-text">
                    <h4>Select Your Preferred Language</h4>
                    <p>Choose from 9 Indian languages:</p>
                    <div class="language-selector">
                        {{#languages}}
                        <button class="language-btn" data-lang="{{code}}" onclick="selectLanguage(\'{{code}}\')">
                            {{flag}} {{name}}<br>
                            <small>{{native}}</small>
                        </button>
                        {{/languages}}
                    </div>
                </div>
                <div class="message-time">{{time}}</div>
            </div>
        </div>
    </script>
    
    <script id="websiteTypeTemplate" type="text/template">
        <div class="message bot-message">
            <div class="avatar bot-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">
                    <h4>What type of website do you need?</h4>
                    <p>Choose one option:</p>
                    <div class="options-container">
                        {{#options}}
                        <button class="option-btn" data-value="{{value}}" onclick="selectWebsiteType(\'{{value}}\')">
                            <i class="{{icon}}"></i> {{title}}<br>
                            <small>{{description}}</small>
                        </button>
                        {{/options}}
                    </div>
                </div>
                <div class="message-time">{{time}}</div>
            </div>
        </div>
    </script>
    
    <script id="questionTemplate" type="text/template">
        <div class="message bot-message">
            <div class="avatar bot-avatar">❓</div>
            <div class="message-content">
                <div class="question-counter">
                    Question {{current}} of {{total}}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{progress}}%"></div>
                </div>
                <div class="message-text">
                    <h4>{{question}}</h4>
                    <div class="options-container">
                        {{#options}}
                        <button class="option-btn" data-value="{{value}}" onclick="answerQuestion(\'{{questionId}}\', \'{{value}}\')">
                            {{text}}
                        </button>
                        {{/options}}
                    </div>
                </div>
                <div class="message-time">{{time}}</div>
            </div>
        </div>
    </script>
    
    <script id="summaryTemplate" type="text/template">
        <div class="message bot-message">
            <div class="avatar bot-avatar">📊</div>
            <div class="message-content">
                <div class="message-text">
                    <div class="summary-card">
                        <h4>Questionnaire Complete! 🎉</h4>
                        <p>Here\'s your summary:</p>
                        
                        <div class="summary-item">
                            <strong>Business Name:</strong> {{businessName}}
                        </div>
                        <div class="summary-item">
                            <strong>Website Type:</strong> {{websiteType}}
                        </div>
                        <div class="summary-item">
                            <strong>Budget Range:</strong> {{budgetRange}}
                        </div>
                        <div class="summary-item">
                            <strong>Timeline:</strong> {{timeline}}
                        </div>
                        <div class="summary-item">
                            <strong>Languages:</strong> {{languages}}
                        </div>
                        
                        <button class="download-btn" onclick="generatePDF()">
                            <i class="fas fa-download"></i> Download PDF Report
                        </button>
                    </div>
                </div>
                <div class="message-time">{{time}}</div>
            </div>
        </div>
    </script>
    
    <script id="userMessageTemplate" type="text/template">
        <div class="message user-message">
            <div class="message-content">
                <div class="message-text">{{message}}</div>
                <div class="message-time">{{time}}</div>
            </div>
            <div class="avatar user-avatar">👤</div>
        </div>
    </script>
    
    <script>
        // Bot Configuration
        const config = {
            languages: [
                { code: \'hi\', name: \'Hindi\', native: \'हिंदी\', flag: \'🇮🇳\' },
                { code: \'en\', name: \'English\', native: \'English\', flag: \'🇺🇸\' },
                { code: \'ta\', name: \'Tamil\', native: \'தமிழ்\', flag: \'🇮🇳\' },
                { code: \'te\', name: \'Telugu\', native: \'తెలుగు\', flag: \'🇮🇳\' },
                { code: \'kn\', name: \'Kannada\', native: \'ಕನ್ನಡ\', flag: \'🇮🇳\' },
                { code: \'ml\', name: \'Malayalam\', native: \'മലയാളം\', flag: \'🇮🇳\' },
                { code: \'pa\', name: \'Punjabi\', native: \'ਪੰਜਾਬੀ\', flag: \'🇮🇳\' },
                { code: \'gu\', name: \'Gujarati\', native: \'ગુજરાતી\', flag: \'🇮🇳\' },
                { code: \'mr\', name: \'Marathi\', native: \'मराठी\', flag: \'🇮🇳\' }
            ],
            
            websiteTypes: [
                {
                    value: \'basic\',
                    title: \'Basic Static Website\',
                    description: \'5-10 pages, simple design\',
                    icon: \'fas fa-file-alt\'
                },
                {
                    value: \'dynamic\',
                    title: \'Dynamic Website\',
                    description: \'CMS, database, user login\',
                    icon: \'fas fa-cogs\'
                },
                {
                    value: \'3d\',
                    title: \'3D Interactive Website\',
                    description: \'WebGL, 3D models, VR/AR\',
                    icon: \'fas fa-cube\'
                }
            ],
            
            questionnaires: {
                basic: [
                    {
                        id: \'business_name\',
                        question: \'What is your business/organization name?\',
                        type: \'text\'
                    },
                    {
                        id: \'pages\',
                        question: \'What pages do you need?\',
                        type: \'checkbox\',
                        options: [\'Home\', \'About\', \'Services\', \'Portfolio\', \'Contact\', \'Blog\', \'Testimonials\']
                    },
                    {
                        id: \'