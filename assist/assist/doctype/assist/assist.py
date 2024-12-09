# Copyright (c) 2024, Gatura Njenga and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime
import pytz

class Assist(Document):
    """
    Model for Assist documents.
    
    The methods on this class are hooks that are called by Frappe at different stages of the document's lifecycle.
    
    The on_submit method is called when the document is submitted. It sends a real-time notification to the assigned user.
    
    The on_update_after_submit method is called after the document is updated. It updates the first_responded_on and resolved_on fields.
    
    The on_update_after_submit method also checks if the document has been escalated and sends a notification. If the document is ready to be closed, it sends a notification to the user who raised the document.
    """
	
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


def realtime_notification(self):
    """
    Sends a real-time notification based on the document's progress status.
    - If progress_status == "Escalated", the notification is sent to the user in 'escalated_to'.
    - For all other statuses, the notification is sent to the user in 'assigned_to'.
    
    Only sends notification if progress_status is not "Ready to Close".
    """

    # Ensure progress_status is not "Ready to Close"
    if self.progress_status == "Ready to Close":
        return  

    # Determine notification type based on progress_status
    if self.progress_status == "Escalated":
        user = self.escalated_to
        message_subject = f'Assist: {self.name} {self.subject} has been escalated to you'
        message_content = (
            f'The Assist document <a href="{frappe.utils.get_url_to_form("Assist", self.name)}">'
            f'{self.name} {self.subject}</a> has been escalated to you.'
        )
    else:
        user = self.assigned_to
        message_subject = f'You have been assigned to Assist: {self.name} {self.subject}'
        message_content = (
            f'You have been assigned to Assist: <a href="{frappe.utils.get_url_to_form("Assist", self.name)}">'
            f'{self.name} {self.subject}</a>'
        )

    # Ensure the recipient user is set
    if not user:
        frappe.throw("Notification user is not set!")

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

    # Create a notification log for the user
    notification = frappe.get_doc({
        'doctype': 'Notification Log',
        'subject': message_subject,
        'email_content': message_content,
        'for_user': user,
        'document_type': 'Assist',
        'document_name': self.name
    })
    notification.insert(ignore_permissions=True)


def ready_to_close_notification(self):
    """
    Sends a notification to the user who raised the document when the progress status is "Ready to Close".
    This notification alerts the user that the document is ready to be closed.
    
    Only sends notification if progress_status == "Ready to Close".
    """

    # Ensure the document is in "Ready to Close" status
    if self.progress_status != "Ready to Close":
        return  # No notification if status is not "Ready to Close"

    # Ensure the raised_by user is set
    if not self.raised_by:
        frappe.throw('Raised by user is not set!')

    user = self.raised_by  
    document_url = frappe.utils.get_url_to_form('Assist', self.name)

    message_subject = f'Assist: {self.name} {self.subject} is ready to be closed'
    message_content = (
        f'<a href="{document_url}">Assist: {self.name} {self.subject}</a> is ready to be closed'
    )

    # Publish real-time notification
    frappe.publish_realtime(
        event="ready_to_close_notification",
        message={
            'docname': self.name,
            'subject': self.subject,
            'message': message_content
        },
        user=user
    )

    # Create a notification log for the user
    notification = frappe.get_doc({
        'doctype': 'Notification Log',
        'subject': message_subject,
        'email_content': message_content,
        'for_user': user,
        'document_type': 'Assist',
        'document_name': self.name
    })
    notification.insert(ignore_permissions=True)


        
def update_responded_by(self):
    """
    Updates the first_responded_on and resolved_on fields based on the progress status.
    
    If the progress status is "In Progress" and first_responded_on is empty, sets first_responded_on to the current datetime in the Africa/Nairobi timezone.
    
    If the progress status is "Closed" and resolved_on is empty, sets resolved_on to the current datetime in the Africa/Nairobi timezone.
    """
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
