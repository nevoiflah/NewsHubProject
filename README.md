# NewsHub - Your Personalized News Portal

NewsHub is a comprehensive full-stack web application designed to provide users with a personalized news experience, community engagement, and AI-powered insights.

## 🚀 Features

### For Users
- **Personalized Feed**: Browse global headlines filtered by your interests.
- **Smart Summaries**: AI-powered 20-word summaries for quick reading.
- **Sentiment Analysis**: Understand the "vibe" of any news article before clicking.
- **Community Sharing**: Share articles with peers, add thoughts, and engage in discussions.
- **Social Interactions**: Follow users, like shared content, and comment on articles.
- **Progressive Tiers**: Earn points for activity and rank up from "Reader" to "Legend."
- **Saved News**: Maintain a personal library of articles for later reading.

### For Admins
- **Interactive Dashboard**: Real-time analytics on user distribution and content trends.
- **Data Visualization**: Dynamic charts showing activity levels and reporting statistics.
- **Content Moderation**: Resolve community reports and manage shared content.
- **User Management**: full control over user accounts and data integrity.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Indigo Theme), Bootstrap 5, JavaScript (jQuery), Chart.js.
- **Backend**: C# ASP.NET Core Web API (.NET 6.0).
- **Database**: SQL Server (MSSQL) with strictly enforced cascading integrity.
- **AI Integration**: Hugging Face API (Llama 3 / DistilBART).
- **Push Notifications**: Firebase Cloud Messaging (FCM).

## 📥 Getting Started

### Prerequisites
- Visual Studio 2022 or VS Code.
- .NET 6.0 SDK.
- SQL Server access.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/nevoiflah/NewsHubProject.git
    ```
2.  **Server Setup**:
    - Open `Server/appsettings.json`.
    - Configure your connection string and add your Hugging Face Token.
    - Run the API:
    ```bash
    cd Server
    dotnet run
    ```
3.  **Client Setup**:
    - Open `Client/pages/index.html` via Live Server or a standard browser.
    - Ensure the API is running at `http://localhost:5121`.

## 🛡️ Data Integrity
The project maintains a "Zero Orphan" policy. All deletions (Users, Articles) are handled via transactional stored procedures that cascade through all child relationships (Likes, Comments, Reports).

## 👥 Contributors
- **Nevo Iflah**
- **Liel Yardeni**

---
*Developed as part of the Ruppin Academic Center Server-Side Course.*
