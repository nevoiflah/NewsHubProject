# NewsHub: A Comprehensive News Management and Community Platform

NewsHub is a sophisticated, full-stack web application designed for high-performance news aggregation, personalized user experiences, and robust community engagement. The platform integrates modern web technologies with AI-driven analysis to provide users with a streamlined and informative news portal.

## Core Features

### User Experience and Personalization
- **Personalized News Aggregation**: An automated news feed tailored to individual user interests and selected categories.
- **AI-Powered Content Analysis**: Integration with advanced Large Language Models to provide concise 20-word summaries and granular sentiment analysis for balanced information consumption.
- **Community Engagement Layer**: A peer-to-peer sharing system allowing users to distribute articles within the platform's internal network.
- **Dynamic Interaction System**: Full support for social interactions including followers, block-lists, article likes, and nested comment threads.
- **Gamified Activity Recognition**: A multi-tiered user progression system (Reader, Active, Expert, Master, Legend) based on calculated activity metrics within the database.
- **Persistent Personal Archives**: A secured "Saved News" repository for cross-session article management.

### Administrative Control and Analytics
- **Unified Admin Dashboard**: A specialized interface for platform oversight and operational management.
- **Real-time Analytics Suite**: Built-in data visualization using Chart.js to monitor user demographics, activity distributions, and platform-wide content trends.
- **Moderation Framework**: A comprehensive reporting system for identifying and resolving content violations.
- **Data Governance**: Full CRUD capability for user and content management, strictly adhering to relational database constraints.

## Technical Specifications

### Tech Stack
- **Frontend Architecture**: Traditional multi-page application (MPA) built with HTML5, Vanilla JavaScript, and Bootstrap 5.
- **Styling Framework**: A customized "Indigo" professional design system ensuring a consistent and premium user interface.
- **Backend Service Layer**: Developed using C# .NET 6.0 ASP.NET Core Web API, utilizing a RESTful architecture.
- **Data Persistence**: Microsoft SQL Server (MSSQL), emphasizing stored procedures for business logic isolation and performance.
- **AI Integration Hub**: External API connectivity with Hugging Face for natural language processing tasks.
- **Communication Infrastructure**: Firebase Cloud Messaging (FCM) for real-time browser notifications.

### Database Architecture
The database layer is designed for extreme data integrity through:
- **Relational Integrity**: Strict enforcement of Foreign Key constraints.
- **Transactional Safety**: All critical deletions (User/Article) are executed within SQL transactions to prevent partial state corruption.
- **Cascading Logic**: Dedicated stored procedures manage complex cascading deletions, ensuring the complete removal of all associated orphaned records (likes, follows, comments, and reports) during primary record deletion.

## Implementation Details
- **Security**: Token-based authentication and secure session management.
- **API Standardization**: Centralized API base URL configuration ensures seamless transitions between development and production environments.
- **Client-Server Communication**: Asynchronous data fetching via AJAX ensures a responsive user experience without frequent page reloads.

## Installation and Setup

### Prerequisites
- .NET 6.0 SDK or higher
- SQL Server Instance (Local or Remote)
- Modern Web Browser

### Deployment Steps
1. **Clone Repository**:
   ```bash
   git clone https://github.com/nevoiflah/NewsHubProject.git
   ```
2. **Server Configuration**:
   - Navigate to `Server/appsettings.json`.
   - Update the `ConnectionStrings` with your MSSQL credentials.
   - Configure the Hugging Face API token in the `HuggingFace` section.
3. **Initialize Services**:
   - Within the `Server` directory, execute:
     ```bash
     dotnet run
     ```
4. **Access Platform**:
   - Launch the application by opening `Client/pages/index.html` through a suitable local server or direct browser access.
   - Ensure the client-side configuration points to the active API listener (Default: Port 5121).

## Development Team
- Nevo Iflah
- Liel Yardeni

---
*Developed as a capstone project for the Server-Side Web Development curriculum at Ruppin Academic Center.*
