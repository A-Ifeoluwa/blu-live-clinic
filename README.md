# BluClinic+ | Healthcare Portal

**BluClinic+** is a full-stack medical consultation and triage management system. It facilitates seamless communication between patients seeking medical advice and healthcare professionals, providing automated workflows for triage, diagnosis, and medical reporting.

---

## 🏥 Portal Overview

The application features three distinct user experiences:

### 1. Patient Portal
* **Virtual Consultation:** Submit symptoms, location, and age group for triage.
* **Medical Records:** Securely view assigned status and completed diagnoses.
* **Report Generation:** Download professional, computer-generated medical reports in `.txt` format.

### 2. Staff/Doctor Portal
* **Consultation Management:** View active assigned patients and symptoms.
* **Digital Diagnosis:** Integrated interface for inputting diagnosis and prescriptions.
* **History & Archive:** Searchable database of past patient assessments.

### 3. Triage Dashboard (Admin)
* **Resource Allocation:** Assign incoming patient requests to specific doctors.
* **System Administration:** Reset patient passwords and manage user records (CRUD).
* **Data Export:** Export the entire clinic activity log to `.csv` for administrative review.

---

## 🛠 Technical Stack

* **Frontend:** React.js (Hooks, Axios, State-driven UI)
* **Backend Connectivity:** REST API (hosted on OpenShift)
* **Styling:** Modern, responsive CSS-in-JS with a clean medical aesthetic.
* **Data Handling:** Real-time polling (5s intervals) to ensure triage data is always current.

---

## 📡 API Integration

The frontend communicates with a backend service at:
`http://backend-url-blu-live-clinic.apps.lab.ocp.bludive/api`

### Primary Endpoints:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/patients` | Fetch all patient records |
| `POST` | `/api/register` | Submit new consultation |
| `PUT` | `/api/assign` | Triage: Assign doctor to patient |
| `PUT` | `/api/diagnose` | Complete medical assessment |
| `PUT` | `/api/patients/:id` | Password reset/update |
| `DELETE`| `/api/patients/:id` | Remove patient record |

---

## 🚀 Deployment & Local Setup

### Installation
1.  **Clone the Repo:**
    ```bash
    git clone [https://github.com/your-username/blu-clinic-frontend.git](https://github.com/your-username/blu-clinic-frontend.git)
    cd blu-clinic-frontend
    ```
2.  **Install Packages:**
    ```bash
    npm install
    ```
3.  **Set Environment:**
    Ensure the `API` constant in `App.js` points to your active OpenShift route.
4.  **Launch:**
    ```bash
    npm start
    ```

### OpenShift Deployment
This app is optimized for the **ocp.bludive** environment. To deploy the frontend:
```bash
oc new-app [https://github.com/your-username/blu-clinic-frontend.git](https://github.com/your-username/blu-clinic-frontend.git) --name=bluclinic-ui
oc expose svc/bluclinic-ui