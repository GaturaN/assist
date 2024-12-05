# Assist App Documentation

## Overview
The Assist app is a Frappe/ERPNext application designed to manage and track assistance requests or tickets. It provides real-time notifications, escalation capabilities, and time tracking features.

## Key Features
1. Ticket Management
   - Automated ticket numbering (Format: AST-YYYY-####)
   - Subject and description tracking
   - Priority-based handling
   - Progress status tracking

2. Assignment System
   - Ticket assignment to specific users
   - Escalation capability to other users
   - Real-time notifications for assignments and escalations

3. Time Tracking
   - Automated countdown timer
   - Working hours consideration
   - Duration tracking
   - Pause/Resume functionality

4. Document Linking
   - Customer integration
   - Supplier integration
   - Item tracking
   - Payment entry linking
   - Sales/Purchase document connections

## Document Structure

### Core Fields
1. **Identification**
   - `naming_series`: Automatic numbering (AST-YYYY-####)
   - `subject`: Main ticket title
   - `description`: Detailed issue description

2. **Stakeholders**
   - `raised_by`: Ticket creator
   - `assigned_to`: Primary assignee
   - `escalated_to`: Secondary assignee for escalated cases

3. **Status Tracking**
   - `progress_status`: Current state of the ticket
   - `priority`: Ticket urgency level
   - `duration`: Time tracking
   - `close_in`: Expected closure time

4. **Linked Documents**
   - Customer-related: `customer`, `sales_order`, `sales_invoice`
   - Supplier-related: `supplier`, `purchase_order`, `purchase_receipt`, `purchase_invoice`
   - Item-related: `item`
   - Payment-related: `payment_entry`

## Core Functionality

### 1. Notification System
The app implements a real-time notification system that:
- Sends immediate alerts to assigned users
- Provides clickable links to the relevant documents
- Handles both regular assignments and escalations

### 2. Progress Management
- Status transitions from "Open" to "Closed"
- Mandatory solution description for closing tickets
- Escalation handling with required assignee
- Time tracking for resolution duration

### 3. Time Tracking System
- Automated countdown timer
- Working hours consideration
- Pause/Resume functionality
- Total duration calculation
- Elapsed time display

### 4. Document Validation
- Ensures proper assignment before status changes
- Validates required fields based on status
- Prevents invalid state transitions
- Maintains data integrity across linked documents

## Technical Implementation

### Backend (Python)
The backend implementation includes:
- Document class extending `frappe.model.document.Document`
- Real-time notification handling
- Status management
- Time tracking calculations

### Frontend (JavaScript)
The frontend implementation provides:
- Dynamic field visibility
- Custom button management
- Real-time updates
- Time tracking display
- Form validation
- Document linking functionality

## Best Practices
1. Always set an assignee before submitting
2. Provide detailed descriptions
3. Update solution description before closing
4. Use appropriate priority levels
5. Link relevant documents for context

## Integration Points
- Frappe Framework
- ERPNext (optional)
- Customer/Supplier records
- Sales/Purchase documents
- Payment entries
