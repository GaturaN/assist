# Copyright (c) 2024, Gatura Njenga and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime
import pytz

class Assist(Document):
	
    def on_submit(self):
        realtime_notification(self)
        
    def on_update_after_submit(self):
        update_responded_by(self)
    

def realtime_notification(self):
    # Get the user assigned to the ticket
    user = self.assigned_to
    
    # If assigned user, trigger notification
    if user:
        # Publish real-time notification
        frappe.publish_realtime(
            event="assist_assigned",
            message={
                'docname': self.name,
                'subject': self.subject,
                'message': f'You have been assigned to Assist: {self.name}'
            },
            user=user
        )
        
        # Create notification for the bell icon
        notification = frappe.get_doc({
            'doctype': 'Notification Log',
            'subject': f'You have been assigned to Assist: {self.name}',
            'email_content': f'You have been assigned to Assist: {self.name}',
            'for_user': user,
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
    
    elif progress_status == "Closed" and not resolved_on: #this should be able to change any time the status changes to closed
        self.resolved_on = nairobi_datetime
        self.save()

