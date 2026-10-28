const adminCredentials = {
  email: "admin@beautyplus.com",
  password: "admin123"
};

const storageKeys = {
  treatments: "beautyplus-treatments",
  therapists: "beautyplus-therapists",
  bookings: "beautyplus-bookings",
  schedule: "beautyplus-schedule"
};

const defaultTreatments = [
  { id: 1, name: "Eyelash Extension", price: 250000, status: "tersedia" },
  { id: 2, name: "Lash Lift / Lash Fillet", price: 180000, status: "tersedia" },
  { id: 3, name: "Nail Art", price: 200000, status: "tersedia" },
  { id: 4, name: "Manicure & Pedicure", price: 220000, status: "tersedia" }
];

const defaultTherapists = [
  { id: 1, name: "Sinta", specialty: "Lash", status: "tersedia" },
  { id: 2, name: "Dewi", specialty: "Nail Art", status: "tersedia" },
  { id: 3, name: "Alya", specialty: "Waxing", status: "tersedia" },
  { id: 4, name: "Nadia", specialty: "Beauty & Brow", status: "tersedia" }
];

const defaultBookings = [
  {
    code: "BP123456",
    name: "Rina",
    whatsapp: "081234567890",
    email: "rina@gmail.com",
    treatment: "Manicure & Pedicure",
    therapist: "Dewi",
    date: "2026-09-24",
    time: "10:00",
    notes: "Request therapist Dewi, ingin area kaki ditonjolkan lebih rapi.",
    status: "Menunggu Konfirmasi"
  },
  {
    code: "BP654321",
    name: "Mira",
    whatsapp: "081299988877",
    email: "mira@gmail.com",
    treatment: "Lash Lift / Lash Fillet",
    therapist: "Sinta",
    date: "2026-09-25",
    time: "13:00",
    notes: "Kondisi mata sensitif, tolong hati-hati.",
    status: "Dikonfirmasi"
  }
];

const defaultSchedule = {
  workDays: [1, 2, 3, 4, 5, 6],
  startTime: "09:00",
  endTime: "18:30",
  breakStart: "12:00",
  breakEnd: "13:00",
  leaves: []
};

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

let editingBookingCode = null;

window.addEventListener("DOMContentLoaded", () => {
  initDefaultData();
  bindEvents();
  renderDashboard();
  fillScheduleForm();
});

function initDefaultData() {
  setDefault(storageKeys.treatments, defaultTreatments);
  setDefault(storageKeys.therapists, defaultTherapists);
  setDefault(storageKeys.bookings, defaultBookings);
  setDefault(storageKeys.schedule, defaultSchedule);
}

function setDefault(key, value) {
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
}

function getData(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function bindEvents() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value.trim();

    if (email === adminCredentials.email && password === adminCredentials.password) {
      document.getElementById("login-page").classList.add("hidden");
      document.getElementById("admin-dashboard").classList.remove("hidden");
      renderDashboard();
    } else {
      alert("Username/email atau password salah.");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    document.getElementById("admin-dashboard").classList.add("hidden");
    document.getElementById("login-page").classList.remove("hidden");
    document.getElementById("login-form").reset();
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      const section = button.dataset.section;
      document.getElementById(section).classList.add("active");
      if (section === "schedule") renderSchedule();
      if (section === "bookings") renderBookingsAdmin();
    });
  });

  document.getElementById("treatment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("treatment-name").value.trim();
    const price = Number(document.getElementById("treatment-price").value);
    const status = document.getElementById("treatment-status").value;
    if (!name || price <= 0) return alert("Nama treatment dan harga harus diisi dengan benar.");

    const treatments = getData(storageKeys.treatments);
    treatments.push({ id: Date.now(), name, price, status });
    saveData(storageKeys.treatments, treatments);
    e.target.reset();
    renderDashboard();
  });

  document.getElementById("therapist-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("therapist-name").value.trim();
    const specialty = document.getElementById("therapist-specialty").value.trim();
    const status = document.getElementById("therapist-status").value;
    if (!name || !specialty) return alert("Nama therapist dan spesialis harus diisi.");

    const therapists = getData(storageKeys.therapists);
    therapists.push({ id: Date.now(), name, specialty, status });
    saveData(storageKeys.therapists, therapists);
    e.target.reset();
    renderDashboard();
  });

  document.getElementById("schedule-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const workDays = [...document.querySelectorAll('input[name="work-day"]:checked')].map((el) => Number(el.value));
    if (!workDays.length) return alert("Pilih minimal satu hari kerja.");

    const schedule = {
      workDays,
      startTime: document.getElementById("schedule-start").value,
      endTime: document.getElementById("schedule-end").value,
      breakStart: document.getElementById("schedule-break-start").value,
      breakEnd: document.getElementById("schedule-break-end").value,
      leaves: getData(storageKeys.schedule, defaultSchedule).leaves || []
    };

    if (schedule.startTime >= schedule.endTime) return alert("Jam mulai harus lebih awal dari jam selesai.");
    if (schedule.breakStart && schedule.breakEnd && schedule.breakStart >= schedule.breakEnd) {
      return alert("Jam istirahat tidak valid.");
    }

    saveData(storageKeys.schedule, schedule);
    alert("Jadwal kerja therapist berhasil disimpan.");
    renderSchedule();
  });

  document.getElementById("leave-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("leave-date").value;
    const therapist = document.getElementById("leave-therapist").value;
    const reason = document.getElementById("leave-reason").value.trim() || "Izin / Libur";
    if (!date) return alert("Pilih tanggal izin/libur.");

    const schedule = getData(storageKeys.schedule, defaultSchedule);
    schedule.leaves = schedule.leaves || [];
    schedule.leaves.push({ id: Date.now(), date, therapist: therapist || "Semua Therapist", reason });
    saveData(storageKeys.schedule, schedule);
    e.target.reset();
    renderSchedule();
  });

  document.getElementById("edit-booking-form").addEventListener("submit", saveEditedBooking);
  document.getElementById("cancel-edit-booking").addEventListener("click", closeBookingModal);
  document.getElementById("booking-edit-modal").addEventListener("click", (e) => {
    if (e.target.id === "booking-edit-modal") closeBookingModal();
  });

  document.getElementById("report-download-btn").addEventListener("click", downloadReport);
  document.getElementById("financial-download-btn").addEventListener("click", downloadFinancialReport);
}

function renderDashboard() {
  renderStats();
  renderTreatmentsAdmin();
  renderTherapistsAdmin();
  renderBookingsAdmin();
  renderCustomersAdmin();
  renderSchedule();
}

function renderStats() {
  const bookings = getData(storageKeys.bookings);
  const today = localDateString(new Date());
  const completedBookings = bookings.filter((b) => b.status === "Selesai");
  const uniqueCustomers = new Set(
    bookings
      .filter((b) => b.status !== "Dibatalkan")
      .map((b) => b.whatsapp || b.email || String(b.name || "").trim().toLowerCase())
      .filter(Boolean)
  ).size;
  const totalOmzet = completedBookings.reduce((sum, booking) => sum + getBookingPrice(booking), 0);

  document.getElementById("total-omzet").textContent = formatCurrency(totalOmzet);
  document.getElementById("total-customers").textContent = uniqueCustomers;
  document.getElementById("total-bookings").textContent = bookings.length;
  document.getElementById("today-bookings").textContent = bookings.filter((b) => b.date === today).length;
  document.getElementById("pending-bookings").textContent = bookings.filter((b) => b.status === "Menunggu Konfirmasi").length;
  document.getElementById("confirmed-bookings").textContent = bookings.filter((b) => b.status === "Dikonfirmasi").length;
  document.getElementById("completed-bookings").textContent = completedBookings.length;
  document.getElementById("cancelled-bookings").textContent = bookings.filter((b) => b.status === "Dibatalkan").length;
}

function renderTreatmentsAdmin() {
  const treatments = getData(storageKeys.treatments);
  const container = document.getElementById("treatment-list-admin");
  container.innerHTML = `
    <table><thead><tr><th>Nama</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${treatments.map((item) => `
      <tr><td>${esc(item.name)}</td><td>Rp ${formatRupiah(item.price)}</td><td>${esc(item.status)}</td>
      <td><button class="btn btn-small btn-danger" data-action="delete-treatment" data-id="${item.id}">Hapus</button></td></tr>`).join("")}</tbody></table>`;
  container.querySelectorAll('[data-action="delete-treatment"]').forEach((btn) => btn.addEventListener("click", () => {
    if (!confirm("Hapus treatment ini?")) return;
    saveData(storageKeys.treatments, treatments.filter((x) => String(x.id) !== btn.dataset.id));
    renderDashboard();
  }));
}

function renderTherapistsAdmin() {
  const therapists = getData(storageKeys.therapists);
  const container = document.getElementById("therapist-list-admin");
  container.innerHTML = `
    <table><thead><tr><th>Nama</th><th>Spesialis</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${therapists.map((item) => `
      <tr><td>${esc(item.name)}</td><td>${esc(item.specialty)}</td><td>${esc(item.status)}</td>
      <td><button class="btn btn-small btn-danger" data-action="delete-therapist" data-id="${item.id}">Hapus</button></td></tr>`).join("")}</tbody></table>`;
  container.querySelectorAll('[data-action="delete-therapist"]').forEach((btn) => btn.addEventListener("click", () => {
    if (!confirm("Hapus therapist ini?")) return;
    saveData(storageKeys.therapists, therapists.filter((x) => String(x.id) !== btn.dataset.id));
    renderDashboard();
  }));
}

function renderBookingsAdmin() {
  const bookings = getData(storageKeys.bookings);
  const container = document.getElementById("booking-list-admin");
  if (!bookings.length) {
    container.innerHTML = '<div class="empty-state">Belum ada data booking.</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-toolbar"><span>${bookings.length} booking</span><button class="btn btn-secondary btn-small" id="refresh-bookings">Refresh</button></div>
    <table><thead><tr><th>Kode</th><th>Customer</th><th>Treatment</th><th>Therapist</th><th>Jadwal</th><th>Catatan</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${bookings.map((item) => `
      <tr>
        <td><strong>${esc(item.code)}</strong><br><small>${esc(item.whatsapp || "-")}</small></td>
        <td>${esc(item.name)}<br><small>${esc(item.email || "-")}</small></td>
        <td>${esc(item.treatment)}</td>
        <td>${esc(item.therapist)}</td>
        <td>${esc(item.date)}<br>${esc(item.time)}</td>
        <td>${esc(item.notes || "-")}</td>
        <td><span class="status-badge ${statusClass(item.status)}">${esc(item.status)}</span></td>
        <td class="action-cell">
          <button class="btn btn-small btn-primary" data-action="edit-booking" data-code="${esc(item.code)}">Edit</button>
          ${item.status !== "Dikonfirmasi" && item.status !== "Selesai" && item.status !== "Dibatalkan" ? `<button class="btn btn-small btn-success" data-action="confirm-booking" data-code="${esc(item.code)}">Konfirmasi</button>` : ""}
          ${item.status !== "Dibatalkan" && item.status !== "Selesai" ? `<button class="btn btn-small btn-danger" data-action="cancel-booking" data-code="${esc(item.code)}">Batalkan</button>` : ""}
          ${item.status === "Dikonfirmasi" ? `<button class="btn btn-small btn-secondary" data-action="complete-booking" data-code="${esc(item.code)}">Selesai</button>` : ""}
        </td>
      </tr>`).join("")}</tbody></table>`;

  container.querySelectorAll('[data-action="edit-booking"]').forEach((btn) => btn.addEventListener("click", () => openBookingModal(btn.dataset.code)));
  container.querySelectorAll('[data-action="confirm-booking"]').forEach((btn) => btn.addEventListener("click", () => updateBookingStatus(btn.dataset.code, "Dikonfirmasi")));
  container.querySelectorAll('[data-action="cancel-booking"]').forEach((btn) => btn.addEventListener("click", () => updateBookingStatus(btn.dataset.code, "Dibatalkan")));
  container.querySelectorAll('[data-action="complete-booking"]').forEach((btn) => btn.addEventListener("click", () => updateBookingStatus(btn.dataset.code, "Selesai")));
  document.getElementById("refresh-bookings").addEventListener("click", renderDashboard);
}

function renderCustomersAdmin() {
  const bookings = getData(storageKeys.bookings);
  const grouped = new Map();
  bookings.forEach((b) => {
    const key = b.whatsapp || b.email || b.name;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(b);
  });

  document.getElementById("customer-list-admin").innerHTML = `
    <table><thead><tr><th>Nama</th><th>WhatsApp</th><th>Email</th><th>Jumlah Booking</th><th>Riwayat</th></tr></thead>
    <tbody>${[...grouped.values()].map((items) => {
      const first = items[0];
      return `<tr><td>${esc(first.name)}</td><td>${esc(first.whatsapp || "-")}</td><td>${esc(first.email || "-")}</td><td>${items.length}</td><td>${items.map((b) => `${esc(b.code)} — ${esc(b.date)} — ${esc(b.status)}`).join("<br>")}</td></tr>`;
    }).join("")}</tbody></table>`;
}

function fillScheduleForm() {
  const schedule = getData(storageKeys.schedule, defaultSchedule);
  document.querySelectorAll('input[name="work-day"]').forEach((el) => {
    el.checked = schedule.workDays.includes(Number(el.value));
  });
  document.getElementById("schedule-start").value = schedule.startTime;
  document.getElementById("schedule-end").value = schedule.endTime;
  document.getElementById("schedule-break-start").value = schedule.breakStart;
  document.getElementById("schedule-break-end").value = schedule.breakEnd;
  refreshLeaveTherapists();
}

function renderSchedule() {
  fillScheduleForm();
  const schedule = getData(storageKeys.schedule, defaultSchedule);
  const therapists = getData(storageKeys.therapists);
  const bookings = getData(storageKeys.bookings).filter((b) => b.status !== "Dibatalkan");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = localDateString(date);
    const working = schedule.workDays.includes(date.getDay());
    const dayLeaves = (schedule.leaves || []).filter((l) => l.date === dateStr);
    const dayBookings = bookings.filter((b) => b.date === dateStr);
    rows.push(`<tr><td>${formatDate(dateStr)}</td><td>${dayNames[date.getDay()]}</td><td>${working ? "Jam kerja" : "Libur"}</td><td>${dayLeaves.length ? dayLeaves.map((l) => `${esc(l.therapist)} (${esc(l.reason)})`).join("<br>") : "-"}</td><td>${dayBookings.length ? dayBookings.map((b) => `${esc(b.time)} — ${esc(b.therapist)} — ${esc(b.name)}`).join("<br>") : "Tidak ada booking"}</td></tr>`);
  }

  document.getElementById("schedule-calendar").innerHTML = `<table><thead><tr><th>Tanggal</th><th>Hari</th><th>Status</th><th>Izin/Libur</th><th>Booking Terisi</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;

  document.getElementById("therapist-schedule-list").innerHTML = `
    <table><thead><tr><th>Therapist</th><th>Status</th><th>Spesialis</th><th>Jam Kerja</th></tr></thead><tbody>
      ${therapists.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.status)}</td><td>${esc(t.specialty)}</td><td>${schedule.startTime} - ${schedule.endTime}</td></tr>`).join("")}
    </tbody></table>`;

  document.getElementById("leave-list").innerHTML = (schedule.leaves || []).length
    ? `<table><thead><tr><th>Tanggal</th><th>Therapist</th><th>Alasan</th><th>Aksi</th></tr></thead><tbody>${schedule.leaves.map((l) => `<tr><td>${formatDate(l.date)}</td><td>${esc(l.therapist)}</td><td>${esc(l.reason)}</td><td><button class="btn btn-small btn-danger" data-action="delete-leave" data-id="${l.id}">Hapus</button></td></tr>`).join("")}</tbody></table>`
    : `<div class="empty-state">Belum ada jadwal izin/libur.</div>`;

  document.querySelectorAll('[data-action="delete-leave"]').forEach((btn) => btn.addEventListener("click", () => {
    const next = getData(storageKeys.schedule, defaultSchedule);
    next.leaves = (next.leaves || []).filter((l) => String(l.id) !== btn.dataset.id);
    saveData(storageKeys.schedule, next);
    renderSchedule();
  }));
}

function refreshLeaveTherapists() {
  const select = document.getElementById("leave-therapist");
  const current = select.value;
  const therapists = getData(storageKeys.therapists);
  select.innerHTML = `<option value="">Semua Therapist</option>${therapists.map((t) => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("")}`;
  select.value = current;
}

function updateBookingStatus(code, status) {
  const bookings = getData(storageKeys.bookings);
  const booking = bookings.find((b) => b.code === code);
  if (!booking) return;
  const actionText = status === "Dikonfirmasi" ? "konfirmasi" : status === "Dibatalkan" ? "pembatalan" : "menandai selesai";
  if (!confirm(`Yakin ingin ${actionText} booking ${code}?`)) return;

  if (status === "Dikonfirmasi" && hasBookingConflict(booking, bookings, booking.code)) {
    alert("Jadwal bentrok dengan booking aktif lain untuk therapist tersebut. Edit jadwal terlebih dahulu.");
    return;
  }

  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  saveData(storageKeys.bookings, bookings);
  renderDashboard();
}

function openBookingModal(code) {
  const booking = getData(storageKeys.bookings).find((b) => b.code === code);
  if (!booking) return;
  editingBookingCode = code;

  document.getElementById("edit-booking-code").value = booking.code;
  document.getElementById("edit-booking-date").value = booking.date;
  document.getElementById("edit-booking-time").value = booking.time;
  document.getElementById("edit-booking-status").value = booking.status;
  const therapists = getData(storageKeys.therapists);
  document.getElementById("edit-booking-therapist").innerHTML = therapists.map((t) => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  document.getElementById("edit-booking-therapist").value = booking.therapist;
  document.getElementById("edit-booking-notes").value = booking.notes || "";
  document.getElementById("booking-customer-preview").textContent = `${booking.name} • ${booking.treatment}`;
  document.getElementById("booking-edit-modal").classList.remove("hidden");
}

function closeBookingModal() {
  editingBookingCode = null;
  document.getElementById("booking-edit-modal").classList.add("hidden");
}

function saveEditedBooking(e) {
  e.preventDefault();
  const bookings = getData(storageKeys.bookings);
  const booking = bookings.find((b) => b.code === editingBookingCode);
  if (!booking) return closeBookingModal();

  const next = {
    date: document.getElementById("edit-booking-date").value,
    time: document.getElementById("edit-booking-time").value,
    therapist: document.getElementById("edit-booking-therapist").value,
    status: document.getElementById("edit-booking-status").value,
    notes: document.getElementById("edit-booking-notes").value.trim() || "-"
  };

  if (!next.date || !next.time || !next.therapist) return alert("Tanggal, jam, dan therapist wajib diisi.");
  if (next.status === "Dikonfirmasi" && hasBookingConflict({ ...booking, ...next }, bookings, booking.code)) {
    return alert("Jadwal bentrok dengan booking aktif lain untuk therapist tersebut.");
  }

  Object.assign(booking, next, { updatedAt: new Date().toISOString() });
  saveData(storageKeys.bookings, bookings);
  closeBookingModal();
  renderDashboard();
  alert("Data booking berhasil diperbarui.");
}

function hasBookingConflict(candidate, bookings, ignoreCode) {
  if (candidate.status === "Dibatalkan") return false;
  return bookings.some((b) => b.code !== ignoreCode && b.status !== "Dibatalkan" && b.date === candidate.date && b.time === candidate.time && b.therapist === candidate.therapist);
}

function downloadReport() {
  const bookings = getData(storageKeys.bookings);
  const lines = [
    ["Kode", "Customer", "WhatsApp", "Treatment", "Therapist", "Tanggal", "Jam", "Harga", "Status"].join(";"),
    ...bookings.map((b) => [b.code, b.name, b.whatsapp || "", b.treatment, b.therapist, b.date, b.time, getBookingPrice(b), b.status].map(csvCell).join(";"))
  ];
  downloadCsv(lines, `laporan-booking-beautyplus-${localDateString(new Date())}.csv`);
}

function downloadFinancialReport() {
  const bookings = getData(storageKeys.bookings);
  const completed = bookings.filter((b) => b.status === "Selesai");
  const confirmed = bookings.filter((b) => b.status === "Dikonfirmasi");
  const cancelled = bookings.filter((b) => b.status === "Dibatalkan");
  const pending = bookings.filter((b) => b.status === "Menunggu Konfirmasi");
  const totalOmzet = completed.reduce((sum, b) => sum + getBookingPrice(b), 0);
  const potentialConfirmed = confirmed.reduce((sum, b) => sum + getBookingPrice(b), 0);
  const allBookingValue = bookings.reduce((sum, b) => sum + getBookingPrice(b), 0);
  const uniqueCustomers = new Set(
    bookings
      .filter((b) => b.status !== "Dibatalkan")
      .map((b) => b.whatsapp || b.email || String(b.name || "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  const lines = [
    ["LAPORAN KEUANGAN BEAUTYPLUS"].map(csvCell).join(";"),
    ["Tanggal Laporan", localDateString(new Date())].map(csvCell).join(";"),
    ["Total Omzet (Booking Selesai)", totalOmzet].map(csvCell).join(";"),
    ["Nilai Booking Dikonfirmasi", potentialConfirmed].map(csvCell).join(";"),
    ["Nilai Semua Booking", allBookingValue].map(csvCell).join(";"),
    ["Total Customer Unik", uniqueCustomers].map(csvCell).join(";"),
    ["Jumlah Booking Selesai", completed.length].map(csvCell).join(";"),
    ["Jumlah Booking Dikonfirmasi", confirmed.length].map(csvCell).join(";"),
    ["Jumlah Menunggu Konfirmasi", pending.length].map(csvCell).join(";"),
    ["Jumlah Dibatalkan", cancelled.length].map(csvCell).join(";"),
    [],
    ["DETAIL TRANSAKSI"].map(csvCell).join(";"),
    ["Kode", "Customer", "WhatsApp", "Treatment", "Therapist", "Tanggal", "Jam", "Harga", "Status", "Omzet Diakui"].join(";"),
    ...bookings.map((b) => [
      b.code, b.name, b.whatsapp || "", b.treatment, b.therapist, b.date, b.time,
      getBookingPrice(b), b.status, b.status === "Selesai" ? getBookingPrice(b) : 0
    ].map(csvCell).join(";"))
  ];

  downloadCsv(lines, `laporan-keuangan-beautyplus-${localDateString(new Date())}.csv`);
}

function downloadCsv(lines, filename) {
  const csv = "\ufeff" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getBookingPrice(booking) {
  if (Number.isFinite(Number(booking.price)) && Number(booking.price) > 0) return Number(booking.price);
  const treatments = getData(storageKeys.treatments);
  const treatment = treatments.find((t) => t.name === booking.treatment);
  return Number(treatment?.price) || 0;
}

function formatCurrency(value) {
  return `Rp ${formatRupiah(value)}`;
}

function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function localDateString(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatDate(value) { if (!value) return "-"; return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function statusClass(status) { if (status === "Menunggu Konfirmasi") return "pending"; if (status === "Dikonfirmasi") return "confirmed"; if (status === "Selesai") return "done"; if (status === "Dibatalkan") return "cancelled"; return "pending"; }
function formatRupiah(value) { return new Intl.NumberFormat("id-ID").format(Number(value) || 0); }
function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }
