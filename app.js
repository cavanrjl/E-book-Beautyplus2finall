const treatmentData = [
  { id: 1, name: "Eyelash Extension", category: "Beauty", price: 250000, duration: "60 min" },
  { id: 2, name: "Lash Lift / Lash Fillet", category: "Beauty", price: 180000, duration: "50 min" },
  { id: 3, name: "Nail Art", category: "Nail", price: 200000, duration: "75 min" },
  { id: 4, name: "Manicure & Pedicure", category: "Nail", price: 220000, duration: "90 min" },
  { id: 5, name: "Brazilian", category: "Waxing", price: 170000, duration: "45 min" },
  { id: 6, name: "Underarm", category: "Waxing", price: 80000, duration: "20 min" },
  { id: 7, name: "Legs", category: "Waxing", price: 180000, duration: "60 min" },
  { id: 8, name: "Hand", category: "Waxing", price: 70000, duration: "20 min" },
  { id: 9, name: "Brow", category: "Waxing", price: 90000, duration: "25 min" },
  { id: 10, name: "Brow Bomber", category: "Beauty", price: 150000, duration: "35 min" }
];

const therapists = [
  { id: 1, name: "Sinta", specialty: "Lash", available: true, treatments: [1, 2, 10] },
  { id: 2, name: "Dewi", specialty: "Nail Art", available: true, treatments: [3, 4] },
  { id: 3, name: "Alya", specialty: "Waxing", available: true, treatments: [5, 6, 7, 8, 9] },
  { id: 4, name: "Nadia", specialty: "Beauty & Brow", available: true, treatments: [1, 2, 9, 10] }
];

const availableSlots = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

const bookingState = {
  selectedTreatment: null,
  selectedDate: "",
  selectedTime: "",
  selectedTherapist: null,
  paymentMethod: "DP"
};

const localStorageKey = "beautyplus-bookings";
const scheduleStorageKey = "beautyplus-schedule";

document.addEventListener("DOMContentLoaded", () => {
  renderTreatments();
  initDateInput();
  initEventListeners();
  loadLatestBookingStatus();
});

function renderTreatments() {
  const container = document.getElementById("treatment-list");
  container.innerHTML = "";

  treatmentData.forEach((item) => {
    const card = document.createElement("button");
    card.className = "treatment-card";
    card.type = "button";
    card.innerHTML = `
      <span class="tag">${item.category}</span>
      <h3>${item.name}</h3>
      <p>${item.duration}</p>
      <div class="price">Rp ${formatRupiah(item.price)}</div>
    `;

    card.addEventListener("click", () => {
      bookingState.selectedTreatment = item;
      document.querySelectorAll(".treatment-card").forEach((el) => el.classList.remove("active"));
      card.classList.add("active");
      renderSummary();
      updateTimeSlots();
      updateTherapistList();
    });

    container.appendChild(card);
  });
}

function initDateInput() {
  const dateInput = document.getElementById("date");
  const today = new Date();
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  dateInput.min = formatDate(today);
  dateInput.value = formatDate(today);
  bookingState.selectedDate = dateInput.value;
  updateTimeSlots();
  updateTherapistList();
}

function initEventListeners() {
  document.getElementById("date").addEventListener("change", (e) => {
    bookingState.selectedDate = e.target.value;
    updateTimeSlots();
    updateTherapistList();
    renderSummary();
  });

  document.getElementById("confirm-booking").addEventListener("click", handleBookingConfirmation);

  document.getElementById("check-status").addEventListener("click", () => {
    const code = document.getElementById("booking-code-input").value.trim();
    const result = document.getElementById("status-result");

    if (!code) {
      result.innerHTML = "<p>Silakan masukkan kode booking.</p>";
      result.classList.add("show");
      return;
    }

    const bookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
    const found = bookings.find((booking) => booking.code === code);

    if (!found) {
      result.innerHTML = "<p>Kode booking tidak ditemukan.</p>";
      result.classList.add("show");
      return;
    }

    result.classList.add("show");
    result.innerHTML = `
      <h3>Status Booking</h3>
      <p><strong>Kode:</strong> ${escapeHtml(found.code)}</p>
      <p><strong>Nama:</strong> ${escapeHtml(found.name)}</p>
      <p><strong>Treatment:</strong> ${escapeHtml(found.treatment)}</p>
      <p><strong>Status:</strong> ${escapeHtml(found.status)}</p>
      <p><strong>Therapist:</strong> ${escapeHtml(found.therapist)}</p>
      <p><strong>Jadwal:</strong> ${escapeHtml(found.date)} • ${escapeHtml(found.time)}</p>
      <p><strong>Catatan:</strong> ${escapeHtml(found.notes || "-")}</p>
      ${found.status !== "Dibatalkan" && found.status !== "Selesai" ? '<button type="button" id="customer-cancel-booking" class="btn-cancel-booking">Batalkan Booking</button>' : ''}
    `;

    const cancelButton = document.getElementById("customer-cancel-booking");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        if (!confirm("Yakin ingin membatalkan booking ini?")) return;
        const currentBookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
        const target = currentBookings.find((booking) => booking.code === found.code);
        if (!target) return;
        target.status = "Dibatalkan";
        target.cancelledAt = new Date().toISOString();
        localStorage.setItem(localStorageKey, JSON.stringify(currentBookings));
        result.innerHTML = `<h3>Booking Dibatalkan</h3><p>Booking <strong>${escapeHtml(found.code)}</strong> berhasil dibatalkan.</p>`;
      });
    }
  });

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      bookingState.paymentMethod = e.target.value;
      renderSummary();
    });
  });

  document.getElementById("customer-name").addEventListener("input", renderSummary);
  document.getElementById("customer-wa").addEventListener("input", renderSummary);
  document.getElementById("customer-email").addEventListener("input", renderSummary);
  document.getElementById("notes").addEventListener("input", renderSummary);
}

function updateTimeSlots() {
  const container = document.getElementById("time-slots");
  container.innerHTML = "";

  const schedule = getCustomerSchedule();
  const selectedDate = bookingState.selectedDate;
  const dateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const dayOff = dateObj && !schedule.workDays.includes(dateObj.getDay());
  const leaveForAll = schedule.leaves.some((leave) => leave.date === selectedDate && leave.therapist === "Semua Therapist");

  if (dayOff || leaveForAll) {
    container.innerHTML = `<p class="slot-notice">${dayOff ? "Hari tersebut merupakan hari libur salon." : "Hari tersebut sedang ditutup / libur."}</p>`;
    bookingState.selectedTime = "";
    bookingState.selectedTherapist = null;
    updateTherapistList();
    return;
  }

  const bookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
  const activeBookings = bookings.filter((b) => b.date === selectedDate && b.status !== "Dibatalkan");

  availableSlots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-btn";
    button.textContent = slot;

    const outsideHours = slot < schedule.startTime || slot >= schedule.endTime;
    const inBreak = schedule.breakStart && schedule.breakEnd && slot >= schedule.breakStart && slot < schedule.breakEnd;
    const occupiedByAll = activeBookings.some((b) => b.time === slot && b.therapist === "Semua Therapist");
    const disabled = outsideHours || inBreak || occupiedByAll;

    if (disabled) {
      button.disabled = true;
      button.classList.add("disabled");
      if (inBreak) button.title = "Jam istirahat";
      else if (outsideHours) button.title = "Di luar jam kerja";
      else button.title = "Sudah terisi";
    }

    if (bookingState.selectedTime === slot && !disabled) button.classList.add("selected");

    button.addEventListener("click", () => {
      if (button.disabled) return;
      bookingState.selectedTime = slot;
      document.querySelectorAll(".slot-btn").forEach((el) => el.classList.remove("selected"));
      button.classList.add("selected");
      updateTherapistList();
      renderSummary();
    });

    container.appendChild(button);
  });
}

function getCustomerSchedule() {
  const fallback = {
    workDays: [1, 2, 3, 4, 5, 6],
    startTime: "09:00",
    endTime: "18:30",
    breakStart: "12:00",
    breakEnd: "13:00",
    leaves: []
  };
  try {
    return JSON.parse(localStorage.getItem(scheduleStorageKey) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getAdminTherapistStatus(name) {
  try {
    const list = JSON.parse(localStorage.getItem("beautyplus-therapists") || "[]");
    const found = list.find((t) => t.name === name);
    return found ? found.status === "tersedia" : true;
  } catch {
    return true;
  }
}

function isTherapistOnLeave(name, date) {
  const schedule = getCustomerSchedule();
  return schedule.leaves.some((leave) => leave.date === date && (leave.therapist === "Semua Therapist" || leave.therapist === name));
}

function updateTherapistList() {
  const container = document.getElementById("therapist-list");
  container.innerHTML = "";

  if (!bookingState.selectedTreatment || !bookingState.selectedDate || !bookingState.selectedTime) {
    container.innerHTML = "<p>Silakan pilih treatment, tanggal, dan jam terlebih dahulu.</p>";
    return;
  }

  const bookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
  const matchingTherapists = therapists.filter((therapist) => {
    const alreadyBooked = bookings.some((booking) =>
      booking.status !== "Dibatalkan" &&
      booking.date === bookingState.selectedDate &&
      booking.time === bookingState.selectedTime &&
      booking.therapist === therapist.name
    );
    return therapist.treatments.includes(bookingState.selectedTreatment.id)
      && therapist.available
      && getAdminTherapistStatus(therapist.name)
      && !isTherapistOnLeave(therapist.name, bookingState.selectedDate)
      && !alreadyBooked;
  });

  if (!matchingTherapists.length) {
    container.innerHTML = "<p>Tidak ada therapist yang tersedia untuk kombinasi tersebut.</p>";
    return;
  }

  matchingTherapists.forEach((therapist) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "therapist-card";
    card.innerHTML = `
      <strong>${therapist.name}</strong><br />
      <small>${therapist.specialty}</small>
    `;

    if (bookingState.selectedTherapist && bookingState.selectedTherapist.id === therapist.id) {
      card.classList.add("selected");
    }

    card.addEventListener("click", () => {
      bookingState.selectedTherapist = therapist;
      document.querySelectorAll(".therapist-card").forEach((el) => el.classList.remove("selected"));
      card.classList.add("selected");
      renderSummary();
    });

    container.appendChild(card);
  });
}

function renderSummary() {
  const summary = document.getElementById("booking-summary");
  const treatment = bookingState.selectedTreatment ? bookingState.selectedTreatment.name : "-";
  const therapist = bookingState.selectedTherapist ? bookingState.selectedTherapist.name : "-";
  const date = bookingState.selectedDate || "-";
  const time = bookingState.selectedTime || "-";
  const name = document.getElementById("customer-name").value || "-";
  const wa = document.getElementById("customer-wa").value || "-";
  const email = document.getElementById("customer-email").value || "-";
  const notes = document.getElementById("notes").value || "-";
  const paymentMethod = bookingState.paymentMethod;

  summary.innerHTML = `
    <div class="summary-item"><span>Treatment</span><strong>${treatment}</strong></div>
    <div class="summary-item"><span>Therapist</span><strong>${therapist}</strong></div>
    <div class="summary-item"><span>Tanggal</span><strong>${date}</strong></div>
    <div class="summary-item"><span>Jam</span><strong>${time}</strong></div>
    <div class="summary-item"><span>Nama</span><strong>${name}</strong></div>
    <div class="summary-item"><span>WhatsApp</span><strong>${wa}</strong></div>
    <div class="summary-item"><span>Email</span><strong>${email}</strong></div>
    <div class="summary-item"><span>Catatan</span><strong>${notes}</strong></div>
    <div class="summary-item"><span>Pembayaran</span><strong>${paymentMethod}</strong></div>
  `;
}

function handleBookingConfirmation() {
  const name = document.getElementById("customer-name").value.trim();
  const wa = document.getElementById("customer-wa").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!bookingState.selectedTreatment) {
    alert("Silakan pilih treatment terlebih dahulu.");
    return;
  }
  if (!bookingState.selectedDate || !bookingState.selectedTime) {
    alert("Silakan pilih tanggal dan jam booking.");
    return;
  }
  if (!bookingState.selectedTherapist) {
    alert("Silakan pilih therapist yang tersedia.");
    return;
  }
  if (!name || !wa) {
    alert("Nama dan nomor WhatsApp wajib diisi.");
    return;
  }

  const bookingCode = generateBookingCode();

  const newBooking = {
    code: bookingCode,
    treatment: bookingState.selectedTreatment.name,
    therapist: bookingState.selectedTherapist.name,
    date: bookingState.selectedDate,
    time: bookingState.selectedTime,
    name,
    whatsapp: wa,
    email,
    notes: notes || "-",
    paymentMethod: bookingState.paymentMethod,
    status: "Menunggu Konfirmasi"
  };

  const bookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
  bookings.push(newBooking);
  localStorage.setItem(localStorageKey, JSON.stringify(bookings));

  alert(`Booking berhasil dibuat. Kode booking Anda: ${bookingCode}`);

  const resultBox = document.getElementById("status-result");
  resultBox.classList.add("show");
  resultBox.innerHTML = `
    <h3>Booking Berhasil</h3>
    <p><strong>Kode Booking:</strong> ${bookingCode}</p>
    <p><strong>Status:</strong> ${newBooking.status}</p>
    <p><strong>Treatment:</strong> ${newBooking.treatment}</p>
    <p><strong>Therapist:</strong> ${newBooking.therapist}</p>
    <p><strong>Jadwal:</strong> ${newBooking.date} • ${newBooking.time}</p>
    <p><strong>Catatan:</strong> ${newBooking.notes}</p>
  `;
}

function generateBookingCode() {
  return "BP" + Math.floor(100000 + Math.random() * 900000);
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function loadLatestBookingStatus() {
  const bookings = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
  if (bookings.length) {
    const latest = bookings[bookings.length - 1];
    const result = document.getElementById("status-result");
    result.classList.add("show");
    result.innerHTML = `
      <h3>Booking Terakhir</h3>
      <p><strong>Kode:</strong> ${latest.code}</p>
      <p><strong>Status:</strong> ${latest.status}</p>
      <p><strong>Treatment:</strong> ${latest.treatment}</p>
      <p><strong>Catatan:</strong> ${latest.notes || "-"}</p>
    `;
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
}
