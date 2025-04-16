# ExamPro - Online Examination System

**ExamPro** is a secure and user-friendly online examination system designed to simplify the testing process for both teachers and students. It offers various features such as creating tests with multiple question types, setting time limits, automatic grading, and real-time countdown timers. The system ensures that only authorized users can access the tests, maintaining fairness and security.

### Table of Contents
1. [Project Description](#project-description)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Setup Instructions](#setup-instructions)
5. [Video Demonstration](#video-demonstration)
6. [Contributors](#contributors)

## Project Description

ExamPro allows teachers to create tests with different types of questions, including:
- **Multiple Choice**
- **True/False**
- **Short Answer**

It supports:
- **Time Limits** for each exam
- **Automatic Grading** for objective questions
- A **Countdown Timer** that helps students track their remaining time during the exam
- **Secure Test Access** with role-based user management to ensure fairness

A key feature of ExamPro is its integrated **email notification system**, which sends timely updates to both teachers and students regarding exam schedules, upcoming tests, and released results. This system is implemented using the **JavaMail API** within the **Spring Boot** framework, configured with SMTP server settings such as Gmail or SendGrid.

## Features

- **Role-Based Authentication**: User roles include `Admin`, `Super Admin`, `Teacher`, and `Student`, with specific permissions for each.
- **Test Creation**: Teachers can create tests with different question types and set time limits.
- **Automatic Grading**: Automatically grades objective questions and provides results to students.
- **Real-Time Countdown Timer**: Displays a countdown timer for each exam, showing remaining time.
- **Email Notifications**: Teachers and students receive timely updates about exam schedules, test results, and more.
- **Secure Access**: JWT-based authentication ensures only authorized users can access exams and related features.

## Technologies Used

- **Frontend**: (Frontend framework here, e.g., React, Angular, or Vue.js)
- **Backend**: 
  - **Spring Boot** for the backend
  - **JavaMail API** for email notifications
  - **JWT Authentication** for secure login and authorization
- **Database**: MySQL (for storing exam, user, and result data)
- **Other**: 
  - **Thymeleaf** for rendering HTML views (if applicable)
  - **Maven** for project management and dependency management

## Setup Instructions

### Prerequisites

Before running the project locally, ensure you have the following installed:
- **Java 17** or later
- **MySQL** database
- **Maven** (for building and managing the project)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/exampro.git
