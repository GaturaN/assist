# Copyright (c) 2024, Gatura Njenga and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Assist(Document):
	
    def on_submit(self):
        realtime_notification(self)
    

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

