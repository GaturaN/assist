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
    """
    Sends a real-time notification to the user. If the notification is for escalation,
    it alerts the user specified in 'escalated_to'. Otherwise, it alerts the user in 'assigned_to'.
    
    Parameters:
    - escalate (bool): Indicates if the notification is for an escalation.
    """
    # Check if the notification is for escalation
    if escalate:
        user = self.escalated_to
        message_subject = f'Assist: {self.name} {self.subject} has been escalated to you'
        message_content = f'The Assist document <a href="{frappe.utils.get_url_to_form("Assist", self.name)}">{self.name} {self.subject}</a> has been escalated to you.'
    else:
        user = self.assigned_to
        message_subject = f'You have been assigned to Assist: {self.name} {self.subject}'
        message_content = f'You have been assigned to Assist: <a href="{frappe.utils.get_url_to_form("Assist", self.name)}">{self.name} {self.subject}</a>'
    
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
        
        # notification.flags.notify_via_email = False
        notification.insert(ignore_permissions=True)

def ready_to_close_notification(self):
    """
    Sends a notification when the document is ready to be closed.
    It alerts the user who raised the issue and logs the notification.
    """
    original_requester = self.raised_by  # More descriptive variable name
    if not original_requester:
        frappe.throw('Raised by user is not set!')

    # Construct a URL to the assist document
    document_url = frappe.utils.get_url_to_form('Assist', self.name)

    message_subject = f'Assist: {self.name} {self.subject} is ready to be closed'
    # Make the assist name clickable by embedding it in a hyperlink
    message_content = f'<a href="{document_url}">Assist: {self.name} {self.subject}</a> is ready to be closed'

    frappe.log_error(f'Progress Status: {self.progress_status}', 'Ready to Close Notification Debug')
    frappe.log_error(f'Raised by: {original_requester}', 'Ready to Close Notification Debug')

    # Publish real-time notification to the user who raised the issue
    if self.progress_status == "Ready to Close":
        try:
            frappe.publish_realtime(
                event="ready_to_close_notification",
                message={
                    'docname': self.name,
                    'subject': self.subject,
                    'message': message_content
                },
                user=original_requester  # Using the descriptive variable name
            )
            frappe.log_error(f'Real-time message sent to user: {original_requester}', 'Ready to Close Notification Debug')
        except Exception as e:
            frappe.log_error(f'Error in publishing real-time: {str(e)}', 'Ready to Close Notification Error')

        # Create notification log for the bell icon for the same user
        try:
            notification = frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': message_subject,
                'email_content': message_content,
                'for_user': original_requester,  # Using the descriptive variable name
                'document_type': 'Assist',
                'document_name': self.name
            })
            notification.insert(ignore_permissions=True)
            frappe.log_error(f'Notification log created for user: {original_requester}', 'Ready to Close Notification Debug')
        except Exception as e:
            frappe.log_error(f'Error in creating notification log: {str(e)}', 'Ready to Close Notification Error')


        
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
