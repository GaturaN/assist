// Copyright (c) 2024, Gatura Njenga and contributors
// For license information, please see license.txt

frappe.ui.form.on("Assist", {
  refresh: function (frm) {
    // Call the function to toggle necessary fields on refresh
    toggle_necessary_fields(frm);
    custom_buttons(frm);

    // Show "escalated_to" if the status is not "Open" or if the field has a value, but hide if closed and empty
    frm.toggle_display("escalated_to", (frm.doc.progress_status !== "Open" || frm.doc.escalated_to) && !(frm.doc.progress_status === "Closed" && !frm.doc.escalated_to));

    // Show "solution_description" if it has been set or if progress_status is not "Open"
    frm.toggle_display("solution_description", frm.doc.solution_description || frm.doc.progress_status !== "Open");

    // Make solution_description read-only if ticket is closed
    frm.set_df_property("solution_description", "read_only", frm.doc.progress_status === "Closed");

    // start or resume countdown if the document is submitted and not closed
    if (frm.doc.docstatus === 1 && frm.doc.progress_status !== "Closed") {
      resumeCountdown(frm);
    } else if (frm.doc.progress_status === "Closed") {
      displayElapsedTime(frm);
    }
  },

  progress_status: function (frm) {
    // Prevent changing progress_status to "Escalated" unless "escalated_to" is set
    if (frm.doc.progress_status === "Escalated" && !frm.doc.escalated_to) {
      frappe.throw("Please set 'Escalated To' before changing status to 'Escalated'.");
      //   frappe.validated = false;
    }

    if (frm.doc.progress_status === "Escalated") {
      // make escalated_to mandatory
      frm.set_df_property("escalated_to", "reqd", 1);

      // Prevent saving until escalated_to is set
      if (!frm.doc.escalated_to) {
        frappe.msgprint("Please set 'Escalated To' before saving.");
        frappe.validated = false;
      }
    }

    // Make escalated_to read-only if status is Closed
    frm.set_df_property("escalated_to", "read_only", frm.doc.progress_status === "Closed");

    // Make "solution_description" mandatory if status is "Ready to Close" and it's not set
    if (frm.doc.progress_status === "Ready to Close" && !frm.doc.solution_description) {
      frm.set_df_property("solution_description", "reqd", 1);
      frappe.msgprint("Please provide a solution description before being ready to close.");
      frappe.validated = false;
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
    // Validate minimum word count for description
    if (countWords(frm.doc.description) < 10) {
      frappe.throw("Description must contain at least 10 words");
    }

    // Validate solution_description is set and has minimum word count when completing or ready to close
    if (frm.doc.progress_status === "Ready to Close" || frm.doc.__action === "Complete") {
      if (!frm.doc.solution_description || frm.doc.solution_description.trim() === "") {
        frappe.throw("Solution description is required before completing the ticket");
      }
      if (countWords(frm.doc.solution_description) < 10) {
        frappe.throw("Solution description must contain at least 10 words");
      }
    }

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

  escalated_to: function (frm) {
    // Check if user is trying to escalate to themselves
    if (frm.doc.escalated_to === frm.doc.assigned_to) {
      frm.set_value("escalated_to", "");
      frappe.throw(__("You cannot escalate a ticket to yourself. Please select a different user."));
      return;
    }

    // Auto-save when escalated_to is set
    if (frm.doc.escalated_to && frm.doc.progress_status === "Escalated") {
      frm.save();
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
  let loggedUser = frappe.session.user;
  let assignedTo = frm.doc.assigned_to;
  let raisedBy = frm.doc.raised_by;
  let escalatedTo = frm.doc.escalated_to;

  // Status: Open, only assigned user can see "In Progress" button
  if (status === "Open" && saved && loggedUser === assignedTo) {
    frm
      .add_custom_button("In Progress", function () {
        frm.set_value("progress_status", "In Progress");
        auto_update_document(frm);
      })
      .addClass("btn-primary");
  }

  // Status: In Progress, only assigned user can see "Complete" and "Escalate" buttons
  else if (status === "In Progress" && loggedUser === assignedTo) {
    frm
      .add_custom_button("Escalate", function () {
        // First check if escalated_to is set
        if (!frm.doc.escalated_to) {
          frappe.throw("Please set 'Escalated To' before escalating the ticket");
          return;
        }
        frm.set_value("progress_status", "Escalated");
        auto_update_document(frm);
      })
      .addClass("btn-warning")
      .removeClass("btn-default");

    frm
      .add_custom_button("Complete", function () {
        // Check if solution description exists and is detailed enough
        if (!frm.doc.solution_description || frm.doc.solution_description.trim() === "") {
          frappe.throw("Please provide a solution description before completing");
          return;
        }
        if (countWords(frm.doc.solution_description) < 10) {
          frappe.throw("Please provide a detailed solution description with at least 10 words before completing");
          return;
        }

        // Change status to Ready to Close
        frm.set_value("progress_status", "Ready to Close");
        auto_update_document(frm);

        // Hide all other buttons for the assigned user
        frm.clear_custom_buttons();
      })
      .addClass("btn-success")
      .removeClass("btn-default");
  }

  // Status: Escalated, only escalated user can see "Complete" button
  else if (status === "Escalated" && loggedUser === escalatedTo) {
    frm
      .add_custom_button("Complete", function () {
        // Check if solution description exists and is detailed enough
        if (!frm.doc.solution_description || frm.doc.solution_description.trim() === "") {
          frappe.throw("Please provide a solution description before completing");
          return;
        }
        if (countWords(frm.doc.solution_description) < 10) {
          frappe.throw("Please provide a detailed solution description with at least 10 words before completing");
          return;
        }

        frm.set_value("progress_status", "Ready to Close");
        auto_update_document(frm);
      })
      .addClass("btn-warning")
      .removeClass("btn-default");
  }

  // Status: Ready to Close, only raisedBy user can see "Close" button
  else if (status === "Ready to Close" && loggedUser === raisedBy) {
    frm
      .add_custom_button("Close", function () {
        frm.set_value("progress_status", "Closed");
        auto_update_document(frm);
      })
      .addClass("btn-success")
      .removeClass("btn-default");
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

frappe.realtime.on("assist_notification", function (data) {
  // Display the notification on the screen
  frappe.show_alert({
    message: data.message,
    indicator: "orange",
  });
});

frappe.realtime.on("ready_to_close_notification", function (data) {
  // Display the notification on the screen
  frappe.show_alert({
    message: data.message,
    indicator: "blue",
  });
});

// Helper function to check if the current time is within working hours and weekdays
function isWithinWorkingHours() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();   
  const currentTime = hours + minutes / 60;

  // Define working hours (8:00 AM to 5:00 PM, excluding 1:00 PM to 2:00 PM) and working days (Monday to Friday)
  const isWeekday = day >= 1 && day <= 5;
  const isBeforeLunch = currentTime >= 8 && currentTime < 13;
  const isAfterLunch = currentTime >= 14 && currentTime < 17;
  const isWithinHours = isBeforeLunch || isAfterLunch;

  return isWeekday && isWithinHours;
}

// Calculate the next working hour timestamp
function getNextWorkingTime() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours + minutes / 60;
  
  // If it's after work hours
  if (hours >= 17) {
    now.setHours(8, 0, 0, 0); // Set to next day 8 AM
    now.setDate(now.getDate() + 1);
  } 
  // If it's lunch hour
  else if (currentTime >= 13 && currentTime < 14) {
    now.setHours(14, 0, 0, 0); // Set to 2 PM today
  }
  // If it's before work hours
  else if (hours < 8) {
    now.setHours(8, 0, 0, 0); // Set to today 8 AM
  }
  
  // If it's weekend
  if (day === 0) { // Sunday
    now.setDate(now.getDate() + 1); // Move to Monday
  } else if (day === 6) { // Saturday
    now.setDate(now.getDate() + 2); // Move to Monday
  }
  
  return now.getTime();
}

// Start countdown function, saving the end time and start time to the document
function startCountdown(frm) {
  let durationInMinutes = frm.doc.duration * 60;
  let now = new Date().getTime();
  
  // Store the total duration in milliseconds
  frm.doc.total_duration_ms = durationInMinutes * 60 * 1000;
  frm.doc.remaining_duration_ms = frm.doc.total_duration_ms;
  
  // Set initial countdown times
  frm.set_value("countdown_start_time", now);
  frm.set_value("countdown_end_time", now + frm.doc.total_duration_ms);
  frm.set_value("last_pause_time", null);
  
  resumeCountdown(frm);
}

// Resume countdown or show "Closed In" if document is closed
function resumeCountdown(frm) {
  if (frm.doc.progress_status === "Closed") {
    displayElapsedTime(frm);
    return;
  }

  let interval = setInterval(function () {
    let now = new Date().getTime();

    // Check if countdown should pause
    if (!isWithinWorkingHours()) {
      if (!frm.doc.last_pause_time) {
        frm.doc.last_pause_time = now;
        frm.doc.remaining_duration_ms = frm.doc.countdown_end_time - now;
        
        // Save the document to persist the pause state
        frm.save().then(() => {
          clearInterval(interval);
          // Check again in 5 minutes
          setTimeout(() => resumeCountdown(frm), 300000);
        });
      } else {
        clearInterval(interval);
        // Check again in 5 minutes
        setTimeout(() => resumeCountdown(frm), 300000);
      }
      return;
    }

    // If we're resuming from a pause, adjust the end time
    if (frm.doc.last_pause_time) {
      let nextWorkingTime = getNextWorkingTime();
      let newEndTime = nextWorkingTime + frm.doc.remaining_duration_ms;
      
      frm.set_value("countdown_end_time", newEndTime);
      frm.set_value("last_pause_time", null);
      frm.save();
    }

    // Calculate the remaining distance
    let distance = frm.doc.countdown_end_time - now;

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

// Function to count words in a string
function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).length;
}
