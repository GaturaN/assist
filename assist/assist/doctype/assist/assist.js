// Copyright (c) 2024, Gatura Njenga and contributors
// For license information, please see license.txt

frappe.ui.form.on("Assist", {
  refresh: function (frm) {
    // Call the function to toggle necessary fields on refresh
    toggle_necessary_fields(frm);
    custom_buttons(frm);

    // check if progress_status === Escalated, if yes toggle true
    if (frm.doc.progress_status === "Escalated") {
      frm.toggle_display("escalated_to", true);
    } else {
      frm.toggle_display("escalated_to", false);
    }
  },

  involves_customer: function (frm) {
    // Call the function when 'involves_customer' is changed
    toggle_necessary_fields(frm);
  },

  involves_supplier: function (frm) {
    // Call the function when 'involves_supplier' is changed
    toggle_necessary_fields(frm);
  },

  involves_item: function (frm) {
    // Call the function when 'involves_item' is changed
    toggle_necessary_fields(frm);
  },

  involves_payment: function (frm) {
    // Call the function when 'involves_payment' is changed
    toggle_necessary_fields(frm);
  },

  before_save: function (frm) {
    // Check if the form is new and set the 'raised_by' field to the current user
    if (frm.is_new()) {
      frm.set_value("raised_by", frappe.session.user);
    }
  },
});

// toggle_necessary_fields function
function toggle_necessary_fields(frm) {
  // Set field values from the form
  let involves_customer = frm.doc.involves_customer;
  let involves_supplier = frm.doc.involves_supplier;
  let involves_item = frm.doc.involves_item;
  let involves_payment = frm.doc.involves_payment;

  //  toggle lists
  let customer_fields = ["customer", "sales_order", "sales_invoice"];
  let supplier_fields = ["supplier", "purchase_order", "purchase_receipt", "purchase_invoice"];

  //   toggle customer fields
  if (involves_customer) {
    frm.toggle_display(customer_fields, true);
    console.log("working!!");
  } else {
    frm.toggle_display(customer_fields, false);
  }

  if (involves_supplier) {
    frm.toggle_display(supplier_fields, true);
  } else {
    frm.toggle_display(supplier_fields, false);
  }

  if (involves_item) {
    frm.toggle_display("item", true);
  } else {
    frm.toggle_display("item", false);
  }

  if (involves_payment) {
    frm.toggle_display("payment_entry", true);
  } else {
    frm.toggle_display("payment_entry", false);
  }
}

function custom_buttons(frm) {
  // check if document is submitted
  //   let submitted = frm.doc.docstatus === 1;
  let status = frm.doc.progress_status;
  let saved = frm.doc.docstatus === 1;

  if (status === "Open" && saved) {
    frm
      .add_custom_button("In Progress", () => {
        frm.set_value("progress_status", "In Progress");
        auto_update_document(frm);
      })
      .addClass("btn-primary");
  }

  if (status === "In Progress") {
    frm
      .add_custom_button("Close", () => {
        frm.set_value("progress_status", "Closed");
        auto_update_document(frm);
      })
      .addClass("btn-success")
      .removeClass("btn-default");
    frm
      .add_custom_button("Escalate", () => {
        frm.set_value("progress_status", "Escalated");
        auto_update_document(frm);
      })
      .addClass("btn-warning")
      .removeClass("btn-default");
  }

  if (status === "Escalated") {
    frm
      .add_custom_button("Close", () => {
        frm.set_value("progress_status", "Closed");
        auto_update_document(frm);
      })
      .addClass("btn-success")
      .removeClass("btn-default");
  }
}

// Function to automatically update the document
function auto_update_document(frm) {
  frappe.call({
    method: "frappe.desk.form.save.savedocs",
    args: {
      doc: frm.doc,
      action: "Update",
    },
    callback: function (response) {
      if (!response.exc) {
        // frappe.msgprint(__('Document has been updated automatically.'));
        frm.reload_doc();
      }
    },
  });
}

frappe.realtime.on("assist_assigned", function (data) {
  // Display the notification on the screen
  frappe.show_alert({
    message: data.message,
    indicator: "green", 
  });
});
