// Copyright (c) 2024, Gatura Njenga and contributors
// For license information, please see license.txt

frappe.ui.form.on("Assist Priority", {
   validate: function (frm) {
      // if the duration is null, raise error
      if (!frm.doc.duration) {
         frappe.throw("Duration is required");
      }
   },
});
