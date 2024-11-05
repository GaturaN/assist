// looged in user should only view documents raised_by, assigned_to or escalated_to them.
frappe.listview_settings["Assist"] = {
  onload(listview) {
    // Check if the user has the System Manager role
    const isSystemManager = frappe.user_roles.includes("System Manager");

    // Apply filters if the user is not a System Manager
    if (!isSystemManager) {
      listview.filter_area.add(
        [
          ["Assist", "raised_by", "=", frappe.session.user],
          ["Assist", "assigned_to", "=", frappe.session.user],
          ["Assist", "escalated_to", "=", frappe.session.user],
        ],
        "OR"
      ); 
    }

    // Set interval to refresh the list every 10 seconds
    setInterval(() => {
      listview.refresh();
    }, 10000);
  },
};
