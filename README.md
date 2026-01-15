# KRAB.SCAN

A high-performance predictive intelligence platform for EVE Online, designed to identify high-value targets by monitoring NPC kill velocity and intensity.

## 🔭 Project Objective
Microservice designed to monitor (Delta-based activity tracking). By analyzing the change (Delta) in NPC kills between hourly snapshots, KRAB.SCAN identifies Capitals, Marauders, and CRAB Beacons *before* they become a killmail.

## 🏗️ Technical Architecture

### 1. The Brain (DeltaService)
Uses an optimized $O(1)$ Map-based lookup to compare 5,000+ star systems in milliseconds.
* **Velocity Tracking:** Measures the speed of NPC destruction to differentiate between standard ratting and Capital escalations.
* **Intensity Logic:** Classifies targets as "Stable," "Active," or "Whale" based on delta thresholds.

### 2. The Skin (DiscoveryService)
Provides a dynamic, high-fidelity HUD.
* **Dynamic Backgrounds:** Automated retrieval of screenshots harvested by RixxJavix via API microservice.
* **Filename Sanitization:** Real-time cleaning of API metadata into tactical HUD titles.

### 3. The HUD (Frontend)
A "Glassmorphism" tactical leaderboard optimized for dark-room fleet environments.
* **Whale Alerts:** Visual "glow" indicators for high-intensity spikes.
* **Monospace Alignment:** Tabular-num formatting for instant magnitude comparison.

## 🛠️ Stack
- **Runtime:** Node.js (Optimized for Premium CPU)
- **Data Ingestion:** ESI API / Axios
- **Frontend:** HTML5 / CSS3 (Grid & Backdrop-filters) / Vanilla JS
- **State Management:** JSON Snapshot Persistence

## 🎯 Tactical Indicators
| Indicator | Threshold | Tactical Conclusion |
| :--- | :--- | :--- |
| **Delta +300** | High Intensity | **Whale Spotted:** Likely a Capital or CRAB Beacon. |
| **Velocity High** | New Spike | **Fresh Drop:** Target is in the middle of a site. |
| **Delta 0** | Null State | **Safe:** No detectable activity in this system. |

---
*Developed by ScottishDex/Dexomus Viliana*