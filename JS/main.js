import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, collection, setDoc, addDoc, getDoc, getDocs, updateDoc, deleteField, deleteDoc, doc, query, where, documentId
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqFADtK5JDC6vDaQ7F4uV-v4xokYZ4BnE",
  authDomain: "fir-test-403f2.firebaseapp.com",
  projectId: "fir-test-403f2",
  storageBucket: "fir-test-403f2.firebasestorage.app",
  messagingSenderId: "334851316125",
  appId: "1:334851316125:web:fc5fc08ad06b894f7ff774",
  measurementId: "G-B5NXGV949T",
  databaseURL:"https://fir-test-403f2-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


let currentdate = new Date();

const monthCache = {};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("user email " + user.email);
    localStorage.setItem("user", JSON.stringify(user.uid));
    
    await checkOverhours();
    await createCalender(currentdate.getFullYear(), currentdate.getMonth());
  } else {
    alert("Please Login First");
    window.location.href = "./index.html";
  }
});

window.dateToString = (year, month, day) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

window.getHoursDifference = (start, end) => {
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  const startTime = sH * 60 + sM;
  const endTime = eH * 60 + eM;

  let dif = endTime - startTime;
  if (dif < 0) dif += 24 * 60;
  return dif / 60;
};


async function getMonthShifts(user, year, month) {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`; 
  if (monthCache[key]) return monthCache[key];

 
  const firstDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const lastDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2,'0')}`;

  try {
    const workshiftsCol = collection(doc(db, "shifts", user.uid), "workshifts");
    const q = query(workshiftsCol, where(documentId(), ">=", firstDate), where(documentId(), "<=", lastDate));
    const snap = await getDocs(q);

    const map = {};
    snap.forEach(d => map[d.id] = d.data());

    monthCache[key] = map;
    return map;
  } catch (e) {
    console.error("getMonthShifts error:", e);
    return {};
  }
}


window.getItem = async (date) => {
  const user = auth.currentUser;
  if (!user) return {};

  const [year, mm] = date.split("-");
  const monthIndex = Number(mm) - 1;
  const key = `${year}-${String(monthIndex + 1).padStart(2,'0')}`;

  if (monthCache[key]) {
    return monthCache[key][date] || {};
  }

  try {
    const dateref = doc(db, "shifts", user.uid, "workshifts", date);
    const getdata = await getDoc(dateref);
    if (getdata.exists()) {
      return getdata.data();
    }
    return {};
  } catch (e) {
    console.error("getItem error:", e);
    return {};
  }
};

window.saveItem = async (date, jobname, start, end) => {
  const user = auth.currentUser;
  if (!user) return window.location.href = "index.html";

  try {
    const userDocRef = doc(db, "shifts", user.uid);
    await setDoc(userDocRef, { userId: user.uid }, { merge: true });
    const workShiftRef = doc(collection(userDocRef, "workshifts"), date);

    const docSnap = await getDoc(workShiftRef);

    let shift = {};
    if (docSnap.exists()) {
      shift = docSnap.data();
    }

    let uniqueName = jobname;
    let count = 1;
    while (shift[uniqueName]) {
      uniqueName = `${jobname}_${count++}`;
    }

    shift[uniqueName] = { start: start, end: end };

    await setDoc(workShiftRef, shift, { merge: true });

    const [y, m] = date.split("-");
    const key = `${y}-${m}`;
    if (monthCache[key]) {
      monthCache[key][date] = shift;
    }
    await createCalender(currentdate.getFullYear(), currentdate.getMonth());
    return true;
  } catch (e) {
    console.error("saveItem error:", e);
    return false;
  }
};


window.deleteItem = async (year, month, day, jobname) => {
  const user = auth.currentUser;
  if (!user) return window.location.href = "index.html";
  const date = dateToString(year, month, day);
  const dateref = doc(db, "shifts", user.uid, "workshifts", date);
  if (!confirm(`Are you sure Delete ${jobname}?`)) return;

  try {
    await updateDoc(dateref, {
      [jobname]: deleteField()
    });

    
    const key = `${year}-${String(month + 1).padStart(2,'0')}`;
    if (monthCache[key] && monthCache[key][date]) {
      delete monthCache[key][date][jobname];
    }

    await openInputBox(year, month, day);
    await createCalender(currentdate.getFullYear(), currentdate.getMonth());
  } catch (e) {
    console.error("deleteItem error:", e);
  }
};

window.checkOverhours = async () => {
  const dateflags = JSON.parse(localStorage.getItem("dateflags") || "{}");
  const user = auth.currentUser;
  if (!user) return [];

  const keys = Object.keys(dateflags);
  if (!keys.length) return [];

  let minDate = null, maxDate = null;
  for (let k of keys) {
    const { startdate, enddate } = dateflags[k];
    if (!minDate || new Date(startdate) < new Date(minDate)) minDate = startdate;
    if (!maxDate || new Date(enddate) > new Date(maxDate)) maxDate = enddate;
  }

  try {
    const workshiftsCol = collection(doc(db, "shifts", user.uid), "workshifts");
    const q = query(workshiftsCol, where(documentId(), ">=", minDate), where(documentId(), "<=", maxDate));
    const snap = await getDocs(q);

    const allShifts = {};
    snap.forEach(d => allShifts[d.id] = d.data());

    const overDates = [];

    for (let k of keys) {
      const { startdate, enddate, hour: limitHours } = dateflags[k];
      const start = new Date(startdate);
      const end = new Date(enddate);

      let current = new Date(start);
      while (current <= end) {
        let weekStart = new Date(current);
        let weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd = new Date(end);

        let total = 0;
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = dateToString(d.getFullYear(), d.getMonth(), d.getDate());
          const shiftDay = allShifts[dateStr];
          if (!shiftDay) continue;

          for (let job in shiftDay) {
            if (!shiftDay[job].start || !shiftDay[job].end) continue;
            total += getHoursDifference(shiftDay[job].start, shiftDay[job].end);
          }
        }

        if (total > Number(limitHours)) {
          for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
            const ds = dateToString(d.getFullYear(), d.getMonth(), d.getDate());
            if (!overDates.includes(ds)) overDates.push(ds);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    return [...new Set(overDates)];
  } catch (e) {
    console.error("checkOverhours error:", e);
    return [];
  }
};


window.createCalender = async (year, month) => {
  const user = auth.currentUser;
  if (!user) return;

  const monthyear = document.getElementById("monthyear");
  const firstday = new Date(year, month, 1);
  const lastday = new Date(year, month + 1, 0);
  const calender = document.getElementById("cal_tb");

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  monthyear.textContent = monthNames[month] + " " + year;

  const over = await checkOverhours();
  const monthData = await getMonthShifts(user, year, month);

  let table = "<tr>";
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let d of days) table += "<th>" + d + "</th>";
  table += "</tr><tr>";

  for (let i = 0; i < firstday.getDay(); i++) {
    table += "<td class='td_none'></td>";
  }

  let total = 0;
  for (let day = 1; day <= lastday.getDate(); day++) {
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      year === today.getFullYear() &&
      month === today.getMonth();

    const dts = dateToString(year, month, day);
    const isOver = over.includes(dts);

    const caldata = monthData[dts] || {}; 
    for (let job in caldata) {
      if (!caldata[job].start || !caldata[job].end) continue;
      total += getHoursDifference(caldata[job].start, caldata[job].end);
    }

    table += `<td onclick="openInputBox(${year},${month},${day})" class="${isToday ? 'td_today' : ''} ${isOver ? 'td_over' : ''}">
                <h4>${day}</h4><div>`;
    for (let d in caldata) {
      let jobtime = caldata[d];
      if (!jobtime.start || !jobtime.end) continue;
      table += `(${jobtime.start}-${jobtime.end})`;
    }
    table += `</div></td>`;

    if (new Date(year, month, day).getDay() === 6) {
      table += "</tr><tr>";
    }
  }

  let all = total.toFixed(2);
  let b = `<p id="total_hour">This month total hours : ${all} hours</p>`;
  table += "</tr>";
  calender.innerHTML = table;
  const totalhourEl = document.getElementById("totalhour");
  if (totalhourEl) totalhourEl.innerHTML = b;
};

window.openInputBox = async (year, month, day) => {
  const inputbox = document.getElementById("input_box");
  if (inputbox) inputbox.classList.add('show');
  const inputBody = document.getElementById('input_body');

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  let dts = dateToString(year, month, day);
  let data = await getItem(dts);
  let bodydata = `<h5>${monthNames[month]}  ${day}</h5><ul>`;

  for (let d in data) {
    let job = data[d];
    if (!job.start || !job.end) continue;
    bodydata += `<li><p>${d}</p><p>${job.start}-${job.end}</p><p onclick="deleteItem('${year}',${month},'${day}','${d}')"><i class="fa-solid fa-trash"></i></p></li>`;
  }
  bodydata += `</ul>
    <button onclick="openMiniBox(${year},${month},${day})"><i class="fa-solid fa-plus"></i></button>
  `;

  if (inputBody) inputBody.innerHTML = bodydata;
};

window.openMiniBox = (year, month, day) => {
  const clsid = document.getElementById("mini_box");
  if (clsid) clsid.classList.add('show');
  const inputbox = document.getElementById("input_box");
  if (inputbox) inputbox.classList.remove('show');
  let dts = dateToString(year, month, day);
  const addBtn = document.getElementById("add");
  const cancelBtn = document.getElementById("cancel");
  const textInput = document.getElementById("input_select");
  const statTime = document.getElementById("start_time");
  const endTime = document.getElementById("end_time");

  if (textInput) {
    textInput.onchange = () => {
      if (textInput.value === "other") {
        openworkinput();
        closeMiniBox();
      }
    };
  }

  dropdown();

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (textInput) textInput.value = "";
      if (statTime) statTime.value = "";
      if (endTime) endTime.value = "";
    };
  }

  if (addBtn) {
    addBtn.onclick = async () => {
      let textvalue = textInput ? textInput.value.trim() : "";
      let startvalue = statTime ? statTime.value.trim() : "";
      let endvalue = endTime ? endTime.value.trim() : "";

      if (!textvalue || !startvalue || !endvalue) {
        alert("Please Fill The Blank!");
        return;
      }
      let flag = await saveItem(dts, textvalue, startvalue, endvalue);
      if (flag) {
        alert("Add Successfull");
        if (clsid) clsid.classList.remove('show');
        if (textInput) textInput.value = "";
        if (statTime) statTime.value = "";
        if (endTime) endTime.value = "";
      } else {
        alert("Add Failed - see console");
      }
    };
  }

  if (typeof flatpickr !== 'undefined') {
    flatpickr("#start_time", {
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: "H:i",
      defaultDate: "none",
      allowInput: true,
    });
    flatpickr("#end_time", {
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: "H:i",
      defaultDate: "none",
      allowInput: true,
    });
  }
};

window.dropdown = () => {
  const textInput = document.getElementById("input_select");
  let work = JSON.parse(localStorage.getItem("worksname") || "{}");
  let dd = `<option value="">please select the work</option>`;
  for (let w in work) {
    let wo = work[w];
    dd += `<option value="${wo.name}">${wo.name}</option>`;
  }
  dd += `<option value="other">other</option>`;
  if (textInput) textInput.innerHTML = dd;
};

window.openworkinput = () => {
  const clsid = document.getElementById("input_workname");
  if (clsid) clsid.classList.add('show');
};
window.closeworkinput = () => {
  const clsid = document.getElementById("input_workname");
  if (clsid) clsid.classList.remove('show');
};

window.closeMiniBox = () => {
  const clsid = document.getElementById("mini_box");
  if (clsid) clsid.classList.remove('show');
};

window.closeInputBox = () => {
  const inputbox = document.getElementById("input_box");
  if (inputbox) inputbox.classList.remove('show');
};

window.openweekinput = () => {
  const inputbox = document.getElementById("weekinput");
  if (inputbox) inputbox.classList.add('show');
  const clsid = document.getElementById("date_box");
  if (clsid) clsid.classList.remove('show');
};
window.closeweekinput = () => {
  const inputbox = document.getElementById("weekinput");
  if (inputbox) inputbox.classList.remove('show');
  const clsid = document.getElementById("date_box");
  if (clsid) clsid.classList.add('show');
  opendDateBox();
};

window.opendDateBox = () => {
  const clsid = document.getElementById("date_box");
  if (clsid) clsid.classList.add('show');
  const inputBody = document.getElementById('date_body');
  let bodydata = ` <h5>Hour Management</h5><ul>`;
  const dateflag = JSON.parse(localStorage.getItem("dateflags") || {});
  for (let date in dateflag) {
    let da = dateflag[date];
    bodydata += `<li><p>${da.startdate}-<br>${da.enddate}</p><p>${da.hour}hours</p><p onclick="deleteDate('${date}')" ><i class="fa-solid fa-trash"></i></p></li>`;
  }
  if (!Object.keys(dateflag).length > 0) {
    bodydata += `</ul><button onclick="openweekinput()"><i class="fa-solid fa-plus"></i></button>`;
  }
  if (inputBody) inputBody.innerHTML = bodydata;
};

window.deleteDate = async (id) => {
  let dateflags = JSON.parse(localStorage.getItem("dateflags") || "{}");
  if (!confirm("Are you sure you want to delete this date?")) return;
  if (dateflags[id]) {
    delete dateflags[id];
    localStorage.setItem("dateflags", JSON.stringify(dateflags));
    alert("Deleted Successfully");
    opendDateBox();
  }
  await createCalender(currentdate.getFullYear(), currentdate.getMonth());
};

window.saveDate = () => {
  const hour = document.getElementById("select").value;
  const startdate = document.getElementById("start_date").value;
  const enddate = document.getElementById("end_date").value;

  if (!hour || !startdate || !enddate) {
    alert("please choose the date");
    return;
  }
  if (startdate > enddate) {
    alert("Start date cannot be after end date");
    return;
  }

  let dateflag = JSON.parse(localStorage.getItem("dateflags") || "{}");
  for (let key of Object.keys(dateflag)) {
    const df = dateflag[key];
    if (Number(df.hour) !== Number(hour)) continue;

    const existingStart = new Date(df.startdate);
    const existingEnd = new Date(df.enddate);

    if (new Date(startdate) <= existingEnd && new Date(enddate) >= existingStart) {
      alert(`The selected range overlaps with existing ${hour}h date range!`);
      return;
    }
  }

  let id = Object.keys(dateflag).length + 1;
  let idString = `date-${id}`;
  dateflag[idString] = { id: idString, hour, startdate, enddate };
  localStorage.setItem("dateflags", JSON.stringify(dateflag));
  alert("Add Successfull");
  closeweekinput();
  createCalender(currentdate.getFullYear(), currentdate.getMonth());
  opendDateBox();
};

window.nextMont = () => {
  currentdate.setMonth(currentdate.getMonth() + 1);
  createCalender(currentdate.getFullYear(), currentdate.getMonth());
};
window.prexMont = () => {
  currentdate.setMonth(currentdate.getMonth() - 1);
  createCalender(currentdate.getFullYear(), currentdate.getMonth());
};

const addNameBtn = document.getElementById("add_name");
if (addNameBtn) {
  addNameBtn.addEventListener('click', () => {
    const val = document.getElementById("input_text");
    if (!val) {
      alert("Please fill the work name");
      return;
    }
    let saveitem = val.value.trim();
    let work = JSON.parse(localStorage.getItem("worksname") || "{}");
    let id = Object.keys(work).length + 1;
    let idKey = `id-${id}`;
    work[idKey] = { id: idKey, name: saveitem };
    localStorage.setItem('worksname', JSON.stringify(work));
    alert("add successfull");
    closeworkinput();
    dropdown();
    const clsid = document.getElementById("mini_box");
    if (clsid) clsid.classList.add('show');
  });
}

const closeBtn = document.getElementById("close");
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    closeworkinput();
    const clsid = document.getElementById("mini_box");
    if (clsid) clsid.classList.add('show');
  });
}

if (typeof flatpickr !== 'undefined') {
  flatpickr("#start_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
    allowInput: true,
  });
  flatpickr("#end_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
    allowInput: true,
  });
}
