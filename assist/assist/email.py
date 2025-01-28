import frappe

def flush():
    """
    Custom function to process the email queue.
    """
    unsent_emails = frappe.get_all(
        "Email Queue",
        filters={"status": "Not Sent"},
        fields=["name"]
    )
    for email in unsent_emails:
        try:
            frappe.get_doc("Email Queue", email.name).send()
        except Exception as e:
            frappe.log_error(f"Error sending email: {e}", "Email Queue Error")
