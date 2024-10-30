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

    // if (frm.doc.countdown_end_time && frm.doc.progress_status !== "Closed") {
    //   resumeCountdown(frm);
    // }

    // set query on sales order based on selected customer
  },

  //   on_submit: function (frm) {
  //     if (frm.doc.docstatus === 1 && frm.doc.status !== "Closed") {
  //       startCountdownForPriority(frm);
  //       console.log("countdown started");
  //     } else {
  //       // Clear the 'close_in' field if the document is not submitted or is closed
  //       if (frm.fields_dict["close_in"]) {
  //         frm.fields_dict["close_in"].$wrapper.html("No active countdown");
  //       }
  //     }
  //   },

  progress_status: function (frm) {
    // Check if the progress_status has changed to "Closed"
    if (frm.doc.progress_status === "Closed") {
      //   clearCountdown(frm);
      updateCloseInField(frm);
      console.log("countdown ended");
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

// // Start countdown function, saving the end time to the document
// function startCountdownForPriority(frm) {
//   let priority = frm.doc.priority;
//   let durationInMinutes;

//   // Set the countdown duration based on priority
//   if (priority === "High") {
//     durationInMinutes = 2 * 60; // 2 hours
//   } else if (priority === "Medium") {
//     durationInMinutes = 4 * 60; // 4 hours
//   } else if (priority === "Low") {
//     durationInMinutes = 8 * 60; // 8 hours
//   } else {
//     console.log("Invalid priority level");
//     return;
//   }

//   // Calculate the countdown end time
//   var countDownDate = new Date().getTime() + durationInMinutes * 60 * 1000; // Convert minutes to milliseconds
//   frm.set_value("countdown_end_time", countDownDate);
//   auto_update_document(frm);

//   // Start the countdown
//   resumeCountdown(frm);
// }

// function resumeCountdown(frm) {
//   var countDownDate = frm.doc.countdown_end_time;

//   if (!countDownDate) {
//     console.log("No countdown to resume.");
//     return;
//   }

//   // Update the countdown every 1 second
//   var x = setInterval(function () {
//     // Get current time
//     var now = new Date().getTime();

//     // Find the distance between now and the countdown end time
//     var distance = countDownDate - now;

//     // Determine whether the time is negative
//     let isNegative = distance < 0;
//     distance = Math.abs(distance); // Work with the absolute value to calculate time

//     // Time calculations for hours, minutes, and seconds
//     var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//     var seconds = Math.floor((distance % (1000 * 60)) / 1000);

//     // If the time is late, prepend a '-' sign to indicate negative time
//     var timeDisplay = "Close In: " + (isNegative ? "-" : "") + hours + "h " + minutes + "m " + seconds + "s";

//     // Display the result in the HTML field 'close_in'
//     if (frm.fields_dict["close_in"]) {
//       frm.fields_dict["close_in"].$wrapper.html(timeDisplay);
//     } else {
//       console.log("'close_in' field not found.");
//     }
//   }, 1000);
// }

// // Function to update the 'close_in' field when status is closed
// function updateCloseInField(frm) {
//   if (frm.doc.countdown_end_time) {
//     var now = new Date().getTime();
//     var distance = frm.doc.countdown_end_time - now;

//     // Calculate the absolute time difference
//     distance = Math.abs(distance);

//     // Time calculations for hours, minutes, and seconds
//     var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//     var seconds = Math.floor((distance % (1000 * 60)) / 1000);

//     // Display the result in the HTML field 'close_in'
//     if (frm.fields_dict["close_in"]) {
//       var timeDisplay = "Closed In: " + hours + "h " + minutes + "m " + seconds + "s";
//       frm.fields_dict["close_in"].$wrapper.html(timeDisplay);
//     } else {
//       console.log("'close_in' field not found.");
//     }
//   }
// }
