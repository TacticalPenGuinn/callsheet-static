(function () {
  var data = window.CallSheetDemo;
  var invoiceFilter = "all";
  var statusFilter = "both";
  var dateOrder = "asc";

  function isoDate(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function formatDay(iso) {
    if (!iso) {
      return "";
    }
    var parts = iso.split("-");
    return parts[1] + "-" + parts[2] + "-" + parts[0].slice(2);
  }

  function techName(id) {
    var tech = data.techs.filter(function (item) { return item.id === id; })[0];
    return tech ? tech.name : "Unassigned";
  }

  function setGroup(button) {
    var group = button.parentNode;
    Array.prototype.forEach.call(group.querySelectorAll("button"), function (item) {
      item.classList.remove("btn-primary", "btn-danger", "active");
      item.classList.add("btn-default");
    });
    button.classList.remove("btn-default");
    button.classList.add("active");
    button.classList.add(button.dataset.filter === "void" ? "btn-danger" : "btn-primary");
  }

  function filteredCalls() {
    var fromDate = document.getElementById("fromDate").value;
    var toDate = document.getElementById("toDate").value;
    var nameQuery = document.getElementById("tbCustName").value.trim().toLowerCase();
    var invoiceQuery = document.getElementById("tbInvNum").value.trim().toLowerCase();
    var techId = document.getElementById("cbTech").checked ? document.getElementById("dlTech").value : "";

    return data.calls.filter(function (call) {
      if (fromDate && call.callDate < fromDate) {
        return false;
      }
      if (toDate && call.callDate > toDate) {
        return false;
      }
      if (nameQuery && call.customerName.toLowerCase().indexOf(nameQuery) === -1) {
        return false;
      }
      if (invoiceQuery && String(call.invoice).toLowerCase().indexOf(invoiceQuery) === -1) {
        return false;
      }
      if (techId && String(call.techId) !== techId) {
        return false;
      }
      if (statusFilter === "active" && !call.active) {
        return false;
      }
      if (statusFilter === "inactive" && call.active) {
        return false;
      }
      if (invoiceFilter === "invoiced" && (!call.invoice || call.invoice === "VOID")) {
        return false;
      }
      if (invoiceFilter === "none" && (call.invoice || call.voided)) {
        return false;
      }
      if (invoiceFilter === "void" && !call.voided) {
        return false;
      }
      return true;
    }).sort(function (a, b) {
      var order = a.callDate.localeCompare(b.callDate);
      return dateOrder === "asc" ? order : -order;
    });
  }

  function render() {
    var rows = filteredCalls();
    var body = document.getElementById("reportBody");
    body.innerHTML = "";
    document.getElementById("reportCount").textContent = rows.length + (rows.length === 1 ? " call" : " calls");
    document.getElementById("reportRange").textContent = "From " + formatDay(document.getElementById("fromDate").value) + " to " + formatDay(document.getElementById("toDate").value);

    if (!rows.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "No sample calls match these filters.";
      empty.appendChild(cell);
      body.appendChild(empty);
      return;
    }

    rows.forEach(function (call) {
      var row = document.createElement("tr");
      if (!call.active && !call.invoice) {
        row.className = "warning";
      }
      if (call.voided) {
        row.className = "danger";
      }
      var invoice = call.voided ? "VOID" : (call.invoice || (call.active ? "" : "NO INVOICE"));
      [invoice, call.customerName, formatDay(call.callDate), formatDay(call.completedDate), call.description, call.priority, techName(call.techId)].forEach(function (value) {
        var cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }

  var techSelect = document.getElementById("dlTech");
  data.techs.forEach(function (tech) {
    var option = document.createElement("option");
    option.value = String(tech.id);
    option.textContent = tech.name;
    techSelect.appendChild(option);
  });

  var today = new Date();
  var monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);
  document.getElementById("fromDate").value = isoDate(monthAgo);
  document.getElementById("toDate").value = isoDate(today);

  document.getElementById("invoiceGroup").addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) {
      return;
    }
    invoiceFilter = button.dataset.filter;
    setGroup(button);
    render();
  });
  document.getElementById("statusGroup").addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) {
      return;
    }
    statusFilter = button.dataset.filter;
    setGroup(button);
    render();
  });
  document.getElementById("orderGroup").addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) {
      return;
    }
    dateOrder = button.dataset.filter;
    setGroup(button);
    render();
  });

  ["fromDate", "toDate", "tbCustName", "tbInvNum", "dlTech", "cbTech"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", render);
    document.getElementById(id).addEventListener("change", render);
  });
  document.getElementById("btnPrintReport").addEventListener("click", function () {
    window.print();
  });

  render();
})();
