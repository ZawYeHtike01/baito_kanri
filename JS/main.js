let currentdate=new Date();

function createCalender(year,month){
    const monthyear=document.getElementById("monthyear");
    const firstday=new Date(year,month,1);
    const lastday=new Date(year,month+1,0);
    const calender=document.getElementById("cal_tb");

    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    monthyear.textContent = monthNames[month] + " " + year;

    let table="<tr>";
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    for(let d of days) table+="<th>"+d+"</th>";
    table+="</tr><tr>";

    for(let i=0;i<firstday.getDay();i++){
        table+="<td  class='td_none'></td>";
    }

    let total=0;
    for(let day=1;day<=lastday.getDate();day++){
        const today=new Date();
        const isToday=
        day===today.getDate() &&
        year===today.getFullYear() &&
        month===today.getMonth();
        let dts=dateToString(year,month,day);
        let checkdts=dateToString(year,month,day);
        const over=checkOverhours();
        const isOver=over.includes(checkdts);
        let caldata=getItem(dts);
        let shift=JSON.parse(localStorage.getItem("shifts") || "{}");
        let shiftDay=shift[checkdts];
        for (let job in shiftDay) {
                    const s = shiftDay[job].stat;
                    const e = shiftDay[job].end;
                    total += getHoursDifference(s, e);
        }
        table+=`<td onclick="openInputBox(${year},${month},${day})" class="${isToday ? 'td_today' : ''} ${isOver ? 'td_over' : ''}">
                            <h4>${day}</h4><div>`;
        for(let d in caldata){
            let jobtime=caldata[d];
            table+=`(${jobtime.stat}-${jobtime.end})`;
        }
        table+=`</div></td>`;

        if (new Date(year, month, day).getDay() === 6) {
            table += "</tr><tr>";
        }
       
    }
    let all=total.toFixed(2);
    b=`<p id="total_hour">This month total hours : ${all} hours</p>`;
     table+="</tr>";
    calender.innerHTML=table;
    document.getElementById("totalhour").innerHTML=b;
}

function closeweekinput(){
    const inputbox=document.getElementById("weekinput");
    inputbox.style.display='none';
}
function openweekinput(){
     const inputbox=document.getElementById("weekinput");
    inputbox.style.display='block';
        const clsid=document.getElementById("date_box");
    clsid.style.display="none";
}
function closeInputBox(){
    const inputbox=document.getElementById("input_box");
    inputbox.style.display='none';
}

function openInputBox(year,month,day){
    const inputbox=document.getElementById("input_box");
    inputbox.style.display='flex';
    const inputBody=document.getElementById('input_body');
    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    console.log("This is openInputBox"+day)

    let dts=dateToString(year,month,day);
    let data=getItem(dts);
    bodydata=`<h5>${monthNames[month]}  ${day}</h5>
            <ul>`;
    
    for(let d in data){
        let job=data[d];
        bodydata+=`<li><p>${d}</p><p>${job.stat}-${job.end}</p><p  onclick="deleteItem('${year}',${month},'${day}','${d}')"><i class="fa-solid fa-trash"></i></p></li>`;
    }
    bodydata+=`</ul>
        <button onclick="openMiniBox(${year},${month},${day})"><i class="fa-solid fa-plus"></i></button>
    `;
    
    inputBody.innerHTML=bodydata;
}

function dateToString(year,month,day){
    const newmonth=month+1;
    let dateToString=year+"-"+newmonth+"-"+day;
    return dateToString;
}

function nextMont(){
    currentdate.setMonth(currentdate.getMonth()+1);
    createCalender(currentdate.getFullYear(),currentdate.getMonth());
}
function opendDateBox(){
    const clsid=document.getElementById("date_box");
    clsid.style.display="flex";
    const inputBody=document.getElementById('date_body');
    bodydata=` <h5>Hour Management</h5>
            <ul>`;
    const dateflag=JSON.parse(localStorage.getItem("dateflags") || {});
    for(let date in dateflag){
        let da=dateflag[date];
        console.log(date);
        bodydata+=`<li><p>${da.startdate}-<br>${da.enddate}</p><p>${da.hour}hours</p><p onclick="deleteDate('${date}')" ><i class="fa-solid fa-trash"></i></p></li>`;
    }
    if(!Object.keys(dateflag).length>0){
          bodydata+=`</ul><button onclick="openweekinput()"><i class="fa-solid fa-plus"></i></button>`;
    }
   
    
    inputBody.innerHTML=bodydata;
}

document.getElementById("add_name").addEventListener('click',()=>{
    const val=document.getElementById("input_text");
    if(!val){
        alert("Please fill the work name");
        return;
    }
    let saveitem=val.value.trim();
    let work=JSON.parse(localStorage.getItem("worksname") || "{}");
    let id=Object.keys(work).length+1;
    let idKey = `id-${id}`;

    work[idKey] = { id: idKey, name: saveitem};
    localStorage.setItem('worksname',JSON.stringify(work));
    alert("add successfull");
    closeworkinput();
    const clsid=document.getElementById("mini_box");
    clsid.style.display="flex";
})
document.getElementById("close").addEventListener('click',()=>{
    closeworkinput();
    const clsid=document.getElementById("mini_box");
    clsid.style.display="flex";
})
function openworkinput(){
    const clsid=document.getElementById("input_workname");
    clsid.style.display="flex";
}

function closeworkinput(){
    const clsid=document.getElementById("input_workname");
    clsid.style.display="none";
}

function closeDateBox(){
    const clsid=document.getElementById("date_box");
    clsid.style.display="none";
}

function closeMiniBox(){
    const clsid=document.getElementById("mini_box");
    clsid.style.display="none";
}

function openMiniBox(year,month,day){
    const clsid=document.getElementById("mini_box");
    clsid.style.display="flex";
    const inputbox=document.getElementById("input_box");
    inputbox.style.display="none";
    let dts=dateToString(year,month,day);
    const addBtn=document.getElementById("add");
    const cancelBtn=document.getElementById("cancel");
    const textInput=document.getElementById("input_select");
    const statTime=document.getElementById("start_time");
    const endTime=document.getElementById("end_time");


    textInput.onchange=()=>{
        if(textInput.value==="other"){
            openworkinput();
            closeMiniBox();
        }
    }

    let work=JSON.parse(localStorage.getItem("worksname") || "{}");
    let dd=`<option value="">please select the work</option>`;
    for(let w in work){
        let wo=work[w];
        dd+=`<option value="${wo.name}">${wo.name}</option>`;
    }
    dd+=`<option value="other">other</option>`;
    textInput.innerHTML=dd;

    cancelBtn.onclick=()=>{
        textInput.value = "";
        statTime.value = "";
        endTime.value = "";
    }

    addBtn.onclick=()=>{
        let textvalue=textInput.value.trim();
        let startvalue=statTime.value.trim();
        let endvalue=endTime.value.trim();


        if (!textvalue || !startvalue || !endvalue) {
        alert("Please Fill The Blank!");
        return;
        }
        let flag=saveItem(dts,textvalue,startvalue,endvalue);
        if(flag){
            alert("Add Successfull");
            clsid.style.display = "none";
            textInput.value = "";
            statTime.value.trim() = "";
            endTime.value.trim() = "";
        }
        
    }
    textInput.value = "";
    flatpickr("#start_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
  });
  flatpickr("#end_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
  });
}

function saveDate(){
    const hour=document.getElementById("select").value;
    const startdate=document.getElementById("start_date").value;
    const enddate=document.getElementById("end_date").value;

    if(!hour || !startdate || !enddate){
        alert("please choose the date");
        return;
    }

    if (startdate > enddate) {
        alert("Start date cannot be after end date");
        return;
    }

    let dateflag=JSON.parse(localStorage.getItem("dateflags") || "{}");
    for (let key of Object.keys(dateflag)) {
        const df = dateflag[key];
        if (Number(df.hour) !== hour) continue;

        const existingStart = new Date(df.startdate);
        const existingEnd = new Date(df.enddate);

        console.log(existingStart+"--"+existingEnd);
        console.log(startdate+"--"+enddate);

        if (new Date(startdate)<= existingEnd && new Date(enddate) >= existingStart) {
            alert(`The selected range overlaps with existing ${hour}h date range!`);
            return;
        }
    }

    let id = Object.keys(dateflag).length + 1;
    console.log("This is"+id);
   
    let idString = `date-${id}`;
    dateflag[idString]={id:idString,hour,startdate,enddate};
    localStorage.setItem("dateflags",JSON.stringify(dateflag));
    alert("Add Successfull");
    closeweekinput();
    hour.value="";
    startdate.value="";
    enddate.value="";
    createCalender(currentdate.getFullYear(),currentdate.getMonth());
    opendDateBox();
}

function saveItem(date,jobname,stat,end){
    let shift=JSON.parse(localStorage.getItem("shifts") || "{}");
    let flag;
    if(stat>end){
        alert("Please select the right time");
        flag=false;
        return;
    }
    if(!shift[date]){
        shift[date]={};
    }
    shift[date][jobname]={stat,end};
    localStorage.setItem("shifts", JSON.stringify(shift));
    createCalender(currentdate.getFullYear(),currentdate.getMonth());
    flag=true;
    return flag;
    
}

function getItem(date){
    let shifts = JSON.parse(localStorage.getItem("shifts")) || {};
    return shifts[date] || {};
}

function deleteDate(id){
    let dateflags = JSON.parse(localStorage.getItem("dateflags") || "{}");

    if(!confirm("Are you sure you want to delete this date?")) return;

    if(dateflags[id]){
        delete dateflags[id];
        localStorage.setItem("dateflags", JSON.stringify(dateflags));
        alert("Deleted Successfully");
        opendDateBox(); 
    }
    createCalender(currentdate.getFullYear(),currentdate.getMonth());
}

function deleteItem(year,month,day,jobname){

    let date=dateToString(year,month,day);

    if(!confirm(`"Are you sure Delete ${jobname}"`)){
        return;
    }


    let shifts=JSON.parse(localStorage.getItem("shifts")) || {};
    if(shifts[date]  && shifts[date][jobname]){
        delete shifts[date][jobname];
    }
    
    if(shifts[date] && Object.keys(shifts[date]).length === 0){
        delete shifts[date];
    }
    
    localStorage.setItem("shifts",JSON.stringify(shifts));

    openInputBox(year,month,day);
    createCalender(currentdate.getFullYear(),currentdate.getMonth());

}

function checkOverhours() {
    let dateflags = JSON.parse(localStorage.getItem("dateflags") || "{}");
    let allshifts = JSON.parse(localStorage.getItem("shifts") || "{}");
    let overDates = [];

    for (let key of Object.keys(dateflags)) {
        const { startdate, enddate,hour: limitHours } = dateflags[key];
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
                const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                const shiftDay = allshifts[dateStr];
                if (!shiftDay) continue;

                for (let job in shiftDay) {
                    const s = shiftDay[job].stat;
                    const e = shiftDay[job].end;
                    total += getHoursDifference(s, e);
                }
            }
            if (total > limitHours) {
                for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                    const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                    if (!overDates.includes(dateStr)) overDates.push(dateStr);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    console.log("Over 28 hours:", overDates);
    return overDates;
}

function getHoursDifference(start, end) {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startTime = sH * 60 + sM;
    const endTime = eH * 60 + eM;
    return (endTime - startTime) / 60;
}

function prexMont(){
    currentdate.setMonth(currentdate.getMonth()-1);
     createCalender(currentdate.getFullYear(),currentdate.getMonth());
}

flatpickr("#start_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
  });
  flatpickr("#end_time", {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: "H:i",
    defaultDate: "none",
  });

checkOverhours();
// localStorage.removeItem("worksname");

createCalender(currentdate.getFullYear(),currentdate.getMonth());