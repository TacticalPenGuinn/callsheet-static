(function () {
  var data = window.CallSheetDemo;
  var calls = data.calls;
  var tones = {
    low: "alert-success",
    medium: "alert-warning",
    high: "alert-danger"
  };
  var panels = {
    low: document.getElementById("lowPnl"),
    medium: document.getElementById("medPnl"),
    high: document.getElementById("highPnl")
  };

  function techName(id) {
    var tech = data.techs.filter(function (item) { return item.id === id; })[0];
    return tech ? tech.name : "Unassigned";
  }

  function findCall(id) {
    return calls.filter(function (call) { return call.id === id; })[0];
  }

  function formatDay(iso) {
    if (!iso) {
      return "";
    }
    var parts = iso.split("-");
    return parts[1] + "-" + parts[2] + "-" + parts[0].slice(2);
  }

  function flash(message) {
    var box = document.getElementById("callMoveSuccess");
    box.querySelector("strong").textContent = message;
    box.style.display = "block";
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(function () {
      box.style.display = "none";
    }, 1800);
  }

  function cardTone(call) {
    if (call.partsOnOrder || call.partsWarranty) {
      return "alert-info";
    }
    return tones[call.priority];
  }

  function makeCard(call) {
    var card = document.createElement("div");
    card.className = "alert call " + cardTone(call) + " " + call.priority;
    card.draggable = true;
    card.dataset.id = String(call.id);

    var title = document.createElement("strong");
    title.className = "callHeading";
    title.textContent = call.customerName;

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn-default btn-xs edit";
    edit.title = "View call";
    edit.innerHTML = "<span class='glyphicon glyphicon-pencil'></span>";
    edit.addEventListener("click", function (event) {
      event.stopPropagation();
      openCall(call.id);
    });

    var move = document.createElement("span");
    move.className = "glyphicon glyphicon-move callMove";
    move.title = "Drag to another priority";

    var text = document.createElement("p");
    text.className = "callText";
    text.textContent = call.description;

    card.appendChild(title);
    card.appendChild(edit);
    card.appendChild(move);
    card.appendChild(text);

    card.addEventListener("dragstart", function (event) {
      if (event.target.closest && event.target.closest("button")) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", String(call.id));
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("grabbed");
    });
    card.addEventListener("dragend", function () {
      card.classList.remove("grabbed");
    });
    return card;
  }

  function renderBoard() {
    ["low", "medium", "high"].forEach(function (priority) {
      var panel = panels[priority];
      panel.innerHTML = "";
      var rows = calls.filter(function (call) {
        return call.active && call.priority === priority;
      }).sort(function (a, b) {
        return a.callDate.localeCompare(b.callDate);
      });
      if (!rows.length) {
        var empty = document.createElement("p");
        empty.className = "empty-col";
        empty.textContent = "No open calls";
        panel.appendChild(empty);
      }
      rows.forEach(function (call) {
        panel.appendChild(makeCard(call));
      });
    });
    document.getElementById("lblLowCount").textContent = calls.filter(function (call) {
      return call.active && call.priority === "low";
    }).length;
    document.getElementById("lblMedCount").textContent = calls.filter(function (call) {
      return call.active && call.priority === "medium";
    }).length;
    document.getElementById("lblHighCount").textContent = calls.filter(function (call) {
      return call.active && call.priority === "high";
    }).length;
  }

  function fillTechSelect(select, selected) {
    select.innerHTML = "";
    data.techs.forEach(function (tech) {
      var option = document.createElement("option");
      option.value = String(tech.id);
      option.textContent = tech.name;
      if (tech.id === selected) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function openCall(id) {
    var call = findCall(id);
    document.getElementById("hfVCallID").value = String(call.id);
    document.getElementById("vcHName").textContent = call.customerName;
    document.getElementById("vcHDate").textContent = formatDay(call.callDate);
    document.getElementById("tbVCDescription").value = call.description;
    document.getElementById("tbVCComments").value = call.comments;
    document.getElementById("tbVCPhone").value = call.phone;
    document.getElementById("tbVCustAddress").value = call.address + ", " + call.city;
    document.getElementById("dlVCPriority").value = call.priority;
    document.getElementById("tbParts").value = call.partsNote;
    document.getElementById("cbParts").checked = call.partsOnOrder || call.partsWarranty;
    document.getElementById("tbInvoice").value = call.invoice;
    fillTechSelect(document.getElementById("dlVCTech"), call.techId);
    $("#viewCallModal").modal("show");
  }

  function saveOpenCall() {
    var call = findCall(Number(document.getElementById("hfVCallID").value));
    var description = document.getElementById("tbVCDescription").value.trim();
    if (description.length < 4) {
      flash("Add a description of at least 4 characters.");
      return;
    }
    call.description = description;
    call.comments = document.getElementById("tbVCComments").value.trim();
    call.priority = document.getElementById("dlVCPriority").value;
    call.techId = Number(document.getElementById("dlVCTech").value);
    call.partsNote = document.getElementById("tbParts").value.trim();
    call.partsOnOrder = document.getElementById("cbParts").checked;
    call.invoice = document.getElementById("tbInvoice").value.trim();
    $("#viewCallModal").modal("hide");
    renderBoard();
    flash("Call saved in this browser tab. Reload to restore the sample.");
  }

  function closeOpenCall() {
    var call = findCall(Number(document.getElementById("hfVCallID").value));
    call.active = false;
    call.completedDate = new Date().toISOString().slice(0, 10);
    $("#viewCallModal").modal("hide");
    renderBoard();
    flash("Call closed for this visit. Reload to restore the sample.");
  }

  function addCall() {
    var name = document.getElementById("tbCustName").value.trim();
    var description = document.getElementById("tbAddDescription").value.trim();
    if (!name || description.length < 4) {
      flash("A customer name and a short description are required.");
      return;
    }
    var nextId = calls.reduce(function (max, call) {
      return Math.max(max, call.id);
    }, 100) + 1;
    calls.push({
      id: nextId,
      customerName: name,
      phone: document.getElementById("tbCustPhone").value.trim() || "555-0100",
      address: "Sample address",
      city: "Cedar Flats",
      state: "TX",
      zip: "00000",
      callDate: new Date().toISOString().slice(0, 10),
      completedDate: "",
      description: description,
      comments: "",
      partsWarranty: false,
      partsOnOrder: document.getElementById("cbAddParts").checked,
      partsNote: "",
      model: "",
      serial: "",
      active: true,
      voided: false,
      invoice: "",
      priority: document.getElementById("dlAddPriority").value,
      techId: Number(document.getElementById("dlAddTech").value)
    });
    document.getElementById("addCallForm").reset();
    $("#addCallModal").modal("hide");
    renderBoard();
    flash("Call added for this visit. Reload to restore the sample.");
  }

  function bindDrops() {
    Object.keys(panels).forEach(function (priority) {
      var panel = panels[priority];
      panel.addEventListener("dragover", function (event) {
        event.preventDefault();
        panel.classList.add("drop-target");
      });
      panel.addEventListener("dragleave", function () {
        panel.classList.remove("drop-target");
      });
      panel.addEventListener("drop", function (event) {
        event.preventDefault();
        panel.classList.remove("drop-target");
        var call = findCall(Number(event.dataTransfer.getData("text/plain")));
        if (!call || call.priority === priority) {
          return;
        }
        call.priority = priority;
        renderBoard();
        flash("Priority updated. Reload to restore the sample.");
      });
    });
  }

  function startClock() {
    var clock = document.getElementById("clock");
    function tick() {
      var now = new Date();
      var hours = now.getHours();
      var ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      var minutes = String(now.getMinutes()).padStart(2, "0");
      var seconds = String(now.getSeconds()).padStart(2, "0");
      clock.textContent = "Calls for: " + now.toDateString() + " " + hours + ":" + minutes + ":" + seconds + " " + ampm;
    }
    tick();
    window.setInterval(tick, 1000);
  }

  fillTechSelect(document.getElementById("dlAddTech"), 1);
  document.getElementById("saveViewCall").addEventListener("click", saveOpenCall);
  document.getElementById("btnCallComplete").addEventListener("click", closeOpenCall);
  document.getElementById("btnSaveNewCall").addEventListener("click", addCall);
  bindDrops();
  renderBoard();
  startClock();
})();
