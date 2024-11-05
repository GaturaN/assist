// Copyright (c) 2024, Gatura Njenga and contributors
// For license information, please see license.txt

frappe.ui.form.on("Assist", {
  refresh: function (frm) {
    // Call the function to toggle necessary fields on refresh
    toggle_necessary_fields(frm);
    custom_buttons(frm);

    // Show "escalated_to" if the status is "Escalated" or if the field has a value
    frm.toggle_display("escalated_to", frm.doc.progress_status === "Escalated" || frm.doc.escalated_to);

    // start or resume countdown if the document is submitted and not closed
    if (frm.doc.docstatus === 1 && frm.doc.progress_status !== "Closed") {
      resumeCountdown(frm);
    } else if (frm.doc.progress_status === "Closed") {
      displayElapsedTime(frm);
    }
  },

  progress_status: function (frm) {
    if (frm.doc.progress_status === "Escalated") {
      // make escalated_to mandatory
      frm.set_df_property("escalated_to", "reqd", 1);
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

  validate: function (frm) {
    // check if is_customer is selected and customer is not set, make customer mandatory
    if (frm.doc.involves_customer && !frm.doc.customer) {
      frappe.throw("Please select a customer");
    }

    // check if is_supplier is selected and supplier is not set, make supplier mandatory
    if (frm.doc.involves_supplier && !frm.doc.supplier) {
      frappe.throw("Please select a supplier");
    }

    // check if is_item is selected and item is not set, make item mandatory
    if (frm.doc.involves_item && !frm.doc.item) {
      frappe.throw("Please select an item");
    }

    // check if is_payment is selected and payment is not set, make payment mandatory
    if (frm.doc.involves_payment && !frm.doc.payment_entry) {
      frappe.throw("Please select a payment");
    }
  },

  before_save: function (frm) {
    // Check if the form is new and set the 'raised_by' field to the current user
    if (frm.is_new()) {
      frm.set_value("raised_by", frappe.session.user);
    }

    // // Initialize countdown start and end times if not set and document is new
    // if (!frm.doc.countdown_start_time && frm.is_new()) {
    //   startCountdown(frm);
    // }
  },

  // start countdown on submit
  on_submit: function (frm) {
    if (frm.doc.progress_status !== "Closed") {
      startCountdown(frm);
    }

    auto_update_document(frm);
  },

  customer: function (frm) {
    // set query on sales order based on selected customer
    if (frm.doc.customer) {
      frm.set_query("sales_order", function () {
        return {
          filters: {
            customer: frm.doc.customer,
          },
        };
      });

      // set query for sales invoice based on selected customer
      frm.set_query("sales_invoice", function () {
        return {
          filters: {
            customer: frm.doc.customer,
          },
        };
      });
    }
  },

  supplier: function (frm) {
    // set query on purchase order based on selected supplier
    if (frm.doc.supplier) {
      frm.set_query("purchase_order", function () {
        return {
          filters: {
            supplier: frm.doc.supplier,
          },
        };
      });

      frm.set_query("purchase_invoice", function () {
        return {
          filters: {
            supplier: frm.doc.supplier,
          },
        };
      });

      frm.set_query("purchase_receipt", function () {
        return {
          filters: {
            supplier: frm.doc.supplier,
          },
        };
      });
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

  // Check for 'Escalated' status and 'escalated_to' field
  if (status === "Escalated") {
    if (frm.doc.escalated_to) {
      // Show "Close" button if 'escalated_to' is set
      frm
        .add_custom_button("Close", () => {
          frm.set_value("progress_status", "Closed");
          auto_update_document(frm);
        })
        .addClass("btn-success")
        .removeClass("btn-default");
    } else {
      // Ensure "Close" button is hidden if 'escalated_to' is not set
      frm.remove_custom_button("Close");
    }
  }
}

// Function to automatically update the document
function auto_update_document(frm) {
  if (frm.doc.progress_status === "Closed") {
    frm.set_value("closing_duration", new Date().getTime()); // Capture the exact closing time
  }

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

// Start countdown function, saving the end time and start time to the document
function startCountdown(frm) {
  let priority = frm.doc.priority;
  let durationInMinutes;

  // Set duration based on priority
  if (priority === "High") {
    durationInMinutes = 120; // 2 hours
  } else if (priority === "Medium") {
    durationInMinutes = 240; // 4 hours
  } else if (priority === "Low") {
    durationInMinutes = 480; // 8 hours
  } else {
    console.log("Invalid priority level");
    return;
  }

  let now = new Date().getTime();
  let countDownDate = now + durationInMinutes * 60 * 1000;
  frm.set_value("countdown_start_time", now);
  frm.set_value("countdown_end_time", countDownDate);
  //   auto_update_document(frm);

  resumeCountdown(frm);
}

// Resume countdown or show "Closed In" if document is closed
function resumeCountdown(frm) {
  if (frm.doc.progress_status === "Closed") {
    displayElapsedTime(frm);
    return; // Exit without starting a countdown interval
  }

  let countDownDate = frm.doc.countdown_end_time;
  let interval = setInterval(function () {
    let now = new Date().getTime();
    let distance = countDownDate - now;

    if (isNaN(distance) || typeof distance === "undefined") {
      clearInterval(interval);
      return;
    }

    let isNegative = distance < 0;
    distance = Math.abs(distance);

    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    let timeDisplay = isNegative ? `Overdue by: ${hours}h ${minutes}m ${seconds}s` : `Close In: ${hours}h ${minutes}m ${seconds}s`;

    if (frm.fields_dict["close_in"]) {
      frm.fields_dict["close_in"].$wrapper.html(timeDisplay);
    }

    if (frm.doc.progress_status === "Closed") {
      clearInterval(interval);
      displayElapsedTime(frm);
    }
  }, 1000);
}

// Update displayElapsedTime to use closing_time if available
function displayElapsedTime(frm) {
  let startTime = frm.doc.countdown_start_time;
  let closeTime = frm.doc.closing_duration || frm.doc.countdown_end_time; // Use closing_time if document is closed

  if (!startTime) {
    console.log("No start time available.");
    return;
  }

  let elapsed = closeTime - startTime;
  if (isNaN(elapsed) || elapsed < 0) return;

  let hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

  let timeDisplay = `Closed In: ${hours}h ${minutes}m ${seconds}s`;

  if (frm.fields_dict["close_in"]) {
    frm.fields_dict["close_in"].$wrapper.html(timeDisplay);
  }
}
