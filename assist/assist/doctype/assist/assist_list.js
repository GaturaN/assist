frappe.listview_settings["Assist"] = {
  onload(listview) {
    // Check if the user has the System Manager role
    const isSystemManager = frappe.user_roles.includes("System Manager");

    // Apply filters if the user is not a System Manager
    if (!isSystemManager) {
      // Clear any existing filters
      listview.filter_area.clear();

      // Apply the combined filter using OR logic
      listview.filter_area.add([
        ["Assist", "raised_by", "=", frappe.session.user],
        ["Assist", "assigned_to", "=", frappe.session.user],
        ["Assist", "escalated_to", "=", frappe.session.user]
      ], "OR");

      // Disable filter area controls for non-System Managers
      listview.page.set_secondary_action = function () { };
      listview.filter_area.show = function () { };
      listview.filter_area.set_filter = function () { };
    }

    // Set interval to refresh the list every 10 seconds
    setInterval(() => {
      listview.refresh();
    }, 10000);
  },

  hide_name_column: true,

  before_render() {
    // Prevent filter modifications for non-System Managers
    if (!frappe.user_roles.includes("System Manager")) {
      frappe.listview_settings["Assist"].allow_delete = 0;
    }
  },

  get_filters_for_args() {
    // Apply filters for non-System Managers
    if (!frappe.user_roles.includes("System Manager")) {
      return [
        ["raised_by", "=", frappe.session.user],
        ["assigned_to", "=", frappe.session.user],
        ["escalated_to", "=", frappe.session.user]
      ];
    }
    return [];
  }
};
