# Copyright (c) 2024, Gatura Njenga and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime
import pytz

class Assist(Document):
	
    def on_submit(self):
        realtime_notification(self)
        # self.save()
        
    def on_update_after_submit(self):
        update_responded_by(self)

     # Check if the document has been escalated and send a notification
        if self.progress_status == "Escalated" and self.escalated_to:
            realtime_notification(self, escalate=True)
            
        # check if document is ready to close and send a notification
        if self.progress_status == "Ready to Close":
            ready_to_close_notification(self)


def realtime_notification(self, escalate=False):
    # Check if the notification is for escalation
    if escalate:
        user = self.escalated_to
        message_subject = f'Assist: {self.name} {self.subject} has been escalated to you'
        message_content = f'The Assist document {self.name} {self.subject} has been escalated to you.'
    else:
        user = self.assigned_to
        message_subject = f'You have been assigned to Assist: {self.name} {self.subject}'
        message_content = f'You have been assigned to Assist: {self.name} {self.subject}'
    
    # If user exists, trigger the notification
    if user:
        # Publish real-time notification
        frappe.publish_realtime(
            event="assist_notification",
            message={
                'docname': self.name,
                'subject': self.subject,
                'message': message_content
            },
            user=user
        )
        
        # Create notification for the bell icon
        notification = frappe.get_doc({
            'doctype': 'Notification Log',
            'subject': message_subject,
            'email_content': message_content,
            'for_user': user,
            'document_type': 'Assist',
            'document_name': self.name
        })
        
        notification.flags.notify_via_email = False
        notification.insert(ignore_permissions=True)

def ready_to_close_notification(self):
    user = self.raised_by
    message_subject = f'Assist: {self.name} {self.subject} is ready to be closed'
    message_content = f'Assist: {self.name} {self.subject} is ready to be closed'
    
    # Publish real-time notification
    if self.progress_status == "Ready to Close":
        frappe.publish_realtime(
            event="ready_to_close_notification",
            message={
                'docname': self.name,
                'subject': self.subject,
                'message': message_content
            },
            user=user
        )
        
        # Create notification for the bell icon
        notification = frappe.get_doc({
            'doctype': 'Notification Log',
            'subject': f'Assist: {self.name} is ready to be closed.',
            'email_content': f'Assist: {self.name} is ready to be closed.',
            'for_user': self.assigned_to,
            'document_type': 'Assist',
            'document_name': self.name
        })
        
        notification.flags.notify_via_email = False
        notification.insert(ignore_permissions=True)
        
def update_responded_by(self):
    # pass
    nairobi_tz = pytz.timezone("Africa/Nairobi")
    nairobi_datetime = datetime.now(nairobi_tz).strftime("%Y-%m-%d %H:%M:%S")
    
    # get current progress status and related fields
    progress_status = self.progress_status
    first_responded_on = self.first_responded_on
    resolved_on = self.resolved_on
    
    if progress_status == "In Progress" and not first_responded_on:
        self.first_responded_on = nairobi_datetime
        self.save()
    
    elif progress_status == "Closed" and not resolved_on:
        self.resolved_on = nairobi_datetime
        self.save()

