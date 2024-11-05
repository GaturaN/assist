# Assist App

**Assist** is a powerful, in-house ticketing system designed specifically for organizational use. Built on the Frappe framework, it enables employees to efficiently collaborate, raise tickets for assistance, and streamline issue resolution across departments. The app is intended for internal usage, where customers or external parties do not interact with the system.

## Key Features

### 1. **Internal Ticket Management**

- **Multi-Department Support**: Employees from different departments can create tickets for assistance, ensuring smooth communication between various teams.
- **Custom Doctypes**: Includes doctypes such as `Customer`, `Supplier`, `Sales Order`, `Purchase Order`, `Item Price`, and `Payment Entry`, which can be linked to tickets for better context.

### 2. **Priority-Based Countdown Timer**

- **Time Tracking by Priority**: Each ticket can be assigned a priority (High, Medium, Low), which determines the countdown timer displayed.
- **Dynamic Countdown**: The timer is shown in an HTML field called `close_in`, allowing employees to track time remaining or overdue counts.
- **Configurable Times**: High-priority tickets count down from 2 hours, Medium from 4 hours, and Low from 8 hours.
- **Negative Time Display**: When the countdown expires, the timer can display negative counts to indicate overdue status.

### 3. **Real-Time Notifications**

- **Instant Assignment Alerts**: Employees receive real-time UI notifications and alerts via the notification bell whenever they are assigned to an Assist. Email notifications are disabled by default to keep notifications within the app environment.
- **Seamless Updates**: Notification logic is integrated into the app’s backend (`assist.py` and `assist.js`) to provide an immediate response when a ticket is updated or assigned.

### 4. **Field-Based Logic Display**

- **Status-Driven Fields**: The `escalated_to` field is dynamically shown based on the status of the ticket, allowing for better tracking of escalated issues.
- **Conditional Logic**: Custom JavaScript (`assist.js`) ensures fields appear or hide depending on the current status of the ticket, improving user interaction and data visibility.

### 5. **Filtered Data Views**

- **Relevant Sales Order Display**: When managing a ticket linked to a customer, only sales orders specific to that customer are displayed. This feature ensures that users can quickly locate and associate relevant information.
- **Optimized UI**: The filtering logic simplifies data management by displaying only what is necessary for the ticket at hand.

## Core Logic and Implementation

### **Backend Logic (`assist.py`)**

- Manages core processing, including ticket assignment notifications and real-time status updates.
- Implements validation and update mechanisms for ticket statuses and countdown timers.

### **Frontend Logic (`assist.js`)**

- Handles UI interactions, including the dynamic display of fields based on status.
- Integrates real-time updates to keep users informed without refreshing the page.

### **Countdown Timer Logic**

- The countdown timer is implemented using a background job that updates the `close_in` HTML field.
- Logic ensures that as time progresses, the timer updates visually for users to see the remaining time or overdue status.

### **Notification Management**

- UI notifications are triggered when a ticket is assigned or updated, enhancing user engagement without relying on emails.
- Custom Frappe notification methods are employed to control the behavior of alerts and ensure they align with the app's real-time nature.

## Use Cases

- **Inter-Department Problem Resolution**: Employees in different departments can request assistance and share relevant details, enabling collaborative problem-solving.
- **Time Management for Critical Tasks**: Countdown timers help prioritize and address tickets based on urgency, reducing response times.
- **Task Escalation and Tracking**: Automatically shows escalation fields when issues are marked as needing higher-level attention, streamlining escalation handling.
- **Filtered Ticket Context**: Ensures that only relevant data such as sales orders for a selected customer is displayed, simplifying user workflows.
