# NUVA


Nuva is a privacy-first Chrome extension that uses on-device AI to restructure web content for improved cognitive accessibility, supporting neurodivergent users without summarizing or removing information.

The extension operates directly within the browser, enabling real-time, context-aware content restructuring while ensuring user data remains on-device.

---

## MVP Overview

This repository contains the **Minimum Viable Product (MVP)** of Nuva, developed as a **proof of concept** to validate the core functionality, workflow, and user experience.

Due to current access constraints on production-only models, the MVP uses **Gemini 2.5** for prototyping and functional validation. In a full production deployment, the same architecture is designed to transition to **Gemini Nano** for on-device inference, improved privacy, and lower latency.

---

## MVP Development Process

1. **Problem Identification**  
   Identified cognitive overload and accessibility challenges faced by neurodivergent users when consuming dense or poorly structured web content.

2. **Solution Design**  
   Designed a browser-native solution that restructures existing content (layout, hierarchy, spacing, and emphasis) without summarization or loss of information.

3. **Architecture Selection**  
   Chose a Chrome extension architecture to enable in-context interaction with web pages and minimize user friction.

4. **Model Selection (PoC Phase)**  
   Implemented Gemini 2.5 to validate AI-driven restructuring logic during rapid prototyping.

5. **MVP Implementation**  
   - Content scripts to analyze and restructure web pages  
   - Lightweight UI for user controls  
   - Privacy-first handling with no persistent data storage  

6. **Validation**  
   Tested the extension across multiple websites to ensure consistency, responsiveness, and accessibility improvements.

---

## Installation (MVP)

1. Clone or download this repository  
2. Open Chrome and navigate to `chrome://extensions`  
3. Enable **Developer Mode** (top-right)  
4. Click **Load unpacked**  
5. Select the project folder  

The Nuva MVP will now be installed locally.

---

## Notes

- This MVP is intended for evaluation and demonstration purposes  
- No user data is stored or transmitted  
- Production deployment will replace the prototype model with Gemini Nano for fully on-device processing
