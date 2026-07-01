# 🎓 Worqube
**Placement and TNP Management Platform**
Worqube is a comprehensive web application built to streamline the campus placement process. Designed to handle the rigorous demands of Training and Placement (TNP) cells at engineering institutions like Pune Institute of Computer Technology, Worqube increases operational efficiency, ensures data accuracy, and bridges the gap between students, college coordinators, and recruiters.
## 🚀 Tech Stack
**Frontend:** React

**Backend:** Node.js, Express

**Database:** MongoDB

**Authentication & Storage:** Supabase

## ✨ Key Features
**Centralized Data Management:** Securely manage student profiles, academic records, and placement data in one unified dashboard.

**Streamlined Workflows:** Automate job postings, student application tracking, and interview scheduling.

**Operational Efficiency:** Reduce manual paperwork and eliminate redundant data entry for TNP coordinators.

**Secure Access Control:** Robust role-based authentication backed by Supabase, ensuring data privacy for students and administrators.

## 🛠️ Installation & Setup
### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed on your machine. You will also need active MongoDB and Supabase projects.

### 1. Clone the repository
```git clone https://github.com/BhavarthPetare/worqube.git```

```cd worqube```

### 2. Install Dependencies
Install packages for both the client and server.

```cd client```

```npm install```

```cd ../server```

```npm install```

### 3. Environment Variables
Create a `.env` file in the root of both your `client` and `server` directories. You will need to configure the following variables:

**Server (`server/.env`):**

```env```
```PORT=5000```
```MONGO_URI=your_mongodb_connection_string```

**Client (`client/.env`):**

```env```
```REACT_APP_SUPABASE_URL=your_supabase_project_url```
```REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key```

### 4. Run the Application

```# Start the Express server (from the /server directory)```

```npm run dev```

```npm start```

## 👨‍💻 Author
**Bhavarth Petare**
GitHub: [@BhavarthPetare](https://github.com/BhavarthPetare)
