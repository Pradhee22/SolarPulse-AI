☀️ SolarPulse AI
AI-Powered Solar Panel Monitoring, Thermal Inspection & Predictive Maintenance Support
SolarPulse AI is an intelligent solar-panel monitoring platform designed to help solar operators detect abnormal panel conditions earlier, understand performance degradation, and prioritize maintenance.
The platform combines solar telemetry, environmental monitoring, thermal inspection, analytics, alerts, and maintenance workflows in a single industrial-style dashboard.
Hackathon Prototype: The current version demonstrates the monitoring and thermal-inspection workflow using simulated telemetry and a representative thermal image. The architecture is designed for integration with physical sensors and a trained computer-vision model.

🌍 Problem Statement
Solar photovoltaic installations can experience performance degradation due to thermal hotspots, dust accumulation, leaf obstruction, bird droppings, water-related effects, and changing environmental conditions.
For large solar installations, manually inspecting every panel can be time-consuming and difficult to scale.
Solar operators therefore need a system that can:
- Monitor panel performance continuously
- Identify abnormal conditions quickly
- Support thermal inspection
- Prioritize panels requiring attention
- Convert detected anomalies into maintenance actions

💡 Solution
SolarPulse AI provides a centralized monitoring and inspection platform combining:
- ⚡ Electrical monitoring
- 🌤️ Environmental monitoring
- 🌡️ Thermal inspection
- 🤖 AI-assisted fault detection workflow
- 📊 Performance analytics
- 🚨 Intelligent alerts
- 🔧 Maintenance management
The goal is to help solar operators move from reactive inspection toward smarter, data-driven maintenance.

🤖 AI Thermal Inspection
Thermal inspection is a key component of SolarPulse AI.
Thermal images can reveal abnormal temperature regions that may indicate potential solar-panel faults.
The prototype demonstrates this workflow using a representative thermal image containing a visible hotspot.
AI Workflow
Thermal Image
      ↓
Image Pre-processing
      ↓
Computer Vision / CNN Model
      ↓
Thermal Anomaly Detection
      ↓
Fault Classification
      ↓
Confidence Score
      ↓
Risk Assessment
      ↓
Alert Generation
      ↓
Maintenance Recommendation

Potential classifications include:
- Clean / Normal
- Hotspot
- Dust accumulation
- Leaf obstruction
- Bird droppings
- Water droplets
The current prototype demonstrates the thermal-inspection workflow using a sample thermal image and dashboard-based classification display. The architecture is designed for integration with a trained computer-vision model and real thermal-camera data.


             ## ⚙️ Technical Architecture

Solar PV Panel
      ↓
Electrical & Environmental Sensors
      ↓
ESP32 / IoT Edge Layer
      ↓
SolarPulse AI Platform
      ↓
Dashboard + Analytics + Thermal Inspection
      ↓
AI / Computer Vision
      ↓
Anomaly Detection
      ↓
Alerts & Maintenance Recommendations         
      

🔧 Technologies & Components
Software
- HTML5
- CSS3
- JavaScript
- Chart.js
- Material Symbols
- Responsive Web Design

Proposed Hardware Architecture
- ESP32
- INA226 voltage/current/power sensor
- Irradiance sensor
- BME280 environmental sensor
- MLX90640 thermal camera
- Raspberry Pi for thermal-image processing
The current dashboard operates in demonstration mode using simulated telemetry so the complete monitoring workflow can be demonstrated without physical sensor hardware.

📊 Dashboard Features
Dashboard
Provides an overview of:
- Voltage
- Current
- Power
- Efficiency
- Irradiance
- Temperature
- Humidity
- Pressure
- Solar Array Health

Analytics
Visualizes telemetry trends and performance information.
AI Scan

Displays:
- Thermal image
- Detected condition
- Confidence
- Risk level
- Panel identification
- Inspection information
Maintenance
Organizes detected issues into actionable maintenance information.
Alerts
Displays prioritized abnormal-condition notifications.
Settings
Provides dashboard configuration and interface controls.

🎯 Target Users
- Solar farm operators
- Solar plant maintenance teams
- Renewable-energy technicians
- Solar asset managers
- Solar inspection teams

🌱 Real-World Impact
SolarPulse AI is designed to support smarter solar maintenance by helping operators:
- Detect abnormal panel conditions earlier
- Reduce manual inspection effort
- Improve maintenance response
- Prioritize critical faults
- Reduce potential energy losses
- Scale monitoring across larger solar installations

💡 Innovation
SolarPulse AI combines:
Electrical Monitoring
        +
Environmental Monitoring
        +
Thermal Inspection
        +
AI-Based Classification
        +
Risk Prioritization
        +
Maintenance Workflow

Instead of displaying sensor values alone, the platform aims to turn measurements and thermal observations into actionable information for maintenance teams.
🔬 Current Prototype vs Future System
Feature	Current Prototype	Future Integration
Dashboard	✅ Implemented	—
Navigation	✅ Implemented	—
Telemetry	✅ Demo / Simulated	Real sensors
Analytics	✅ Implemented	Live historical data
Thermal Inspection UI	✅ Implemented	—
Thermal Image	✅ Demonstration image	Live thermal camera
AI Classification	🔄 Workflow demonstrated	Trained CNN
Alerts	✅ Implemented	Real-time sensor-triggered
Maintenance	✅ Implemented	Automated recommendations
ESP32	Architecture	Hardware integration
INA226	Architecture	Physical sensor
BME280	Architecture	Physical sensor
MLX90640	Architecture	Physical camera
Raspberry Pi	Architecture	Edge AI deployment


🚀 Future Scope
- Physical sensor integration
- Live ESP32 telemetry
- MLX90640 thermal-camera integration
- CNN-based thermal-image classification
- Edge AI using Raspberry Pi
- Predictive maintenance
- Multi-panel and multi-site monitoring
- Drone or rover-based thermal inspection
- Automated maintenance notifications
🏃 How to Run
1. Clone or download this repository.
2. Open the project folder.
3. Open index.html in a modern web browser.
4. The dashboard starts in demonstration mode.
5. Explore Dashboard, Analytics, AI Scan, Maintenance, Alerts, and Settings.
No backend server is required for the current prototype.
📁 Project Structure
SolarPulse-AI/
│
├── index.html
├── styles.css
├── app.js
├── thermal_scan.jpg
└── README.md

🏆 Hackathon
SolarPulse AI is a student hackathon project focused on applying AI and intelligent monitoring to a real-world renewable-energy challenge.
Track: AI + Climate
Vision
Sensors
   +
Thermal Cameras
   +
IoT
   +
Edge AI
   +
Computer Vision
   +
Predictive Analytics
        ↓
Smarter Solar Maintenance

SolarPulse AI — Turning solar monitoring data into smarter maintenance decisions.
