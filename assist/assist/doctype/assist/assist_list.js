// looged in user should only view documents raised_by, assigned_to or escalated_to them.
frappe.listview_settings["Assist"] = {
  onload(listview) {
    // Check if the user has the System Manager role
    const isSystemManager = frappe.user_roles.includes("System Manager");

    // Apply filters if the user is not a System Manager
    if (!isSystemManager) {
      // Clear any existing filters first
      listview.filter_area.clear();

      // Add filters using standard filters
      listview.page.add_standard_filters();

      // Apply the combined filter
      frappe.db.get_list('Assist', {
        filters: [
          ['raised_by', '=', frappe.session.user],
          ['assigned_to', '=', frappe.session.user],
          ['escalated_to', '=', frappe.session.user]
        ],
        fields: ['name']
      }).then(result => {
        listview.filter_area.add([
          [
            "Assist",
            "name",
            "in",
            result.map(r => r.name)
          ]
        ]);
      });

      // Disable filter area controls
      listview.page.set_secondary_action = function() {};
      listview.filter_area.show = function() {};
      listview.filter_area.set_filter = function() {};
    }

    // Set interval to refresh the list every 10 seconds
    setInterval(() => {
      listview.refresh();
    }, 10000);
  },

  hide_name_column: true,

  before_render() {
    // Prevent filter modifications
    if (!frappe.user_roles.includes("System Manager")) {
      frappe.listview_settings["Assist"].allow_delete = 0;
    }
  },

  get_filters_for_args() {
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
