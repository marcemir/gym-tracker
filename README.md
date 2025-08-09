# **Gym Tracker – Web App for Workout Tracking & Data Analysis**

## 🌐 Live Demo
[![Open App](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://marcemir.github.io/gym-tracker/)

A **lightweight, powerful, and 100% client-side** web application to log and analyze gym workouts.  
Built with **HTML, Tailwind CSS, and JavaScript ES6+**, it runs entirely in the browser **with no backend**, storing data locally via `localStorage`.

<img src="assets/Gym-Tracker-image.jpg" alt="Gym Tracker Image" width="900">
*(Real screenshot of the application)*

---

## ✨ **About This Project**

This project was fully developed using **Vibe Coding**, an innovative AI-assisted development approach.  
The AI acted as a *senior frontend developer*, following an iterative process of prompts and human reviews, enabling:

- **Rapid prototyping** and real-time refactoring.
- **Feature integration** with short validation cycles.
- **Human–AI collaboration** applicable to professional development and data environments.

Beyond being a functional fitness tool, Gym Tracker **generates structured datasets** ready for analysis in Excel, Google Sheets, or Python (pandas, NumPy), enabling performance tracking, trend analysis, and visualization.

---

## 🚀 **Key Features**

- **Custom Workout Management** – Create, edit, and delete workouts with exercises, sets, and parameters.
- **Detailed Workout Logging** – Reps, weight, and RPE (*Rate of Perceived Exertion*).
- **Integrated History View** – See previous workout sessions directly inside each routine.
- **History Editing & Deletion** – Maintain clean and accurate data records.
- **Local Data Persistence** – Stored in `localStorage`, no external servers required.
- **CSV Export** – Ready for BI tools or data analysis scripts.
- **Responsive UI & Dark Mode** – Works seamlessly on desktop and mobile.
- **Zero Dependencies** – Pure web standards, no build steps.

---

## 🛠 **Tech Stack**

- **HTML5** – Structure and semantics.
- **Tailwind CSS (CDN)** – Fast, utility-first styling.
- **Vanilla JavaScript (ES6+)** – Logic, DOM manipulation, and state management.
- **Vibe Coding** – Iterative AI-assisted development.

---

## 📊 **Data Applications**

Although it’s a fitness app, its **data-oriented design** allows for:

- Tracking strength/endurance progression over time.
- Exploratory analysis with Python (`pandas`, `matplotlib`, `seaborn`).
- Dashboard integration in Power BI or Tableau.
- Potential predictive modeling.

This makes it a **practical example of a full data pipeline** from capture to analysis.

---

## 🏃‍♂️ How to Run

**Locally**
```bash
git clone https://github.com/marcemir/gym-tracker.git
cd gym-tracker
# Open index.html in your browser
```

**Locally**
```bash
git clone https://github.com/marcemir/gym-tracker.git
cd gym-tracker
# Option A: open index.html directly
# Option B (recommended): start a local server
python -m http.server 8000
# visit http://localhost:8000


**Deploy to Static Hosting**  
Compatible with GitHub Pages, Netlify, or Vercel.  
Simply upload the files and publish.

---

## 📂 File Structure
```text
.
├─ assets/
│  └─ Gym-Tracker-Screenshot.png
├─ index.html       # Main structure
├─ index.js         # JavaScript logic 
└─ README.md        # Documentation
    
```
---

## 📊 Data Schema & Example

The application uses two main data objects, stored in `localStorage`.

### Routine Object

Describes a single workout routine template.

| Field       | Type           | Description                                       |
|-------------|----------------|---------------------------------------------------|
| `id`        | `Number`       | A unique identifier (timestamp).                  |
| `name`      | `String`       | The name of the routine (e.g., "Push Day").       |
| `exercises` | `Array<Object>`| A list of exercise objects within the routine.    |
| ↳ `name`    | `String`       | The name of the exercise (e.g., "Bench Press").   |
| ↳ `sets`    | `Number`       | The target number of sets for this exercise.      |

**Example:**
```json
{
  "id": 1678886400000,
  "name": "Push Day",
  "exercises": [
    { "name": "Bench Press", "sets": 4 },
    { "name": "Overhead Press", "sets": 3 },
    { "name": "Tricep Pushdown", "sets": 3 }
  ]
}
```

### Session Object

Stores the historical record of a completed workout session.

| Field           | Type           | Description                                                |
|-----------------|----------------|------------------------------------------------------------|
| `session_id`    | `String`       | A unique ID for the session (e.g., "sess_1678886400000").  |
| `date`          | `String`       | The date of the workout in `YYYY-MM-DD` format.            |
| `routineName`   | `String`       | The name of the routine that was performed.                |
| `workoutData`   | `Array<Object>`| The actual performance data for each exercise.             |
| ↳ `exerciseName`| `String`       | The name of the exercise performed.                        |
| ↳ `sets`        | `Array<Object>`| A list of set objects with performance data.               |
|   ↳ `set`       | `Number`       | The set number (e.g., 1, 2, 3).                            |
|   ↳ `reps`      | `Number`       | The number of repetitions completed.                       |
|   ↳ `weight`    | `Number`       | The weight used for the set (in kg).                       |
|   ↳ `rpe`       | `Number`       | The Rate of Perceived Exertion (1-10).                     |

**Example:**
```json
{
  "session_id": "sess_1678972800000",
  "date": "2023-03-16",
  "routineName": "Push Day",
  "workoutData": [
    {
      "exerciseName": "Bench Press",
      "sets": [
        { "set": 1, "reps": 8, "weight": 80, "rpe": 7 },
        { "set": 2, "reps": 8, "weight": 80, "rpe": 7.5 },
        { "set": 3, "reps": 7, "weight": 80, "rpe": 8 }
      ]
    },
    {
      "exerciseName": "Overhead Press",
      "sets": [
        { "set": 1, "reps": 10, "weight": 40, "rpe": 8 }
      ]
    }
  ]
}
```
---
## 📈 CSV Export Schema

When you export your history, the generated `.csv` file will have the following structure. Each row represents a single set performed. The headers are in Spanish, reflecting the application's primary language.

| Header                 | Description                                  |
|------------------------|----------------------------------------------|
| `Fecha`                | The date of the workout (`YYYY-MM-DD`).      |
| `Nombre de la Rutina`  | The name of the routine performed.           |
| `Nombre del Ejercicio` | The name of the exercise.                    |
| `Numero de Serie`      | The set number (1, 2, 3, etc.).              |
| `Repeticiones`         | The number of repetitions completed.         |
| `Peso (kg)`            | The weight used for the set.                 |
| `RPE`                  | The Rate of Perceived Exertion for the set.  |

**Example CSV Content:**
```csv
Fecha,Nombre de la Rutina,Nombre del Ejercicio,Numero de Serie,Repeticiones,Peso (kg),RPE
"2023-03-16","Push Day","Bench Press",1,8,80,7
"2023-03-16","Push Day","Bench Press",2,8,80,7.5
"2023-03-16","Push Day","Overhead Press",1,10,40,8
```
---
## 🧠 Skills Demonstrated
- Frontend Web Development with HTML, CSS, and Vanilla JavaScript.
- Responsive Design and UX/UI optimization.
- Client-side data persistence using `localStorage`.
- Structured data generation & export for analysis.
- Integration of generative AI in the development cycle (Vibe Coding).
- Documentation best practices & GitHub Pages deployment.
- Data-oriented thinking applicable to Data Science projects.

---

## 📄 License
MIT License – Free to use and modify.