const namainput = document.getElementById("nameinput")
const emailinput = document.getElementById("inputemail")
const paswordinput = document.getElementById("pwinput")
const btnregister = document.getElementById("btnregister")
const msgnama = document.getElementById("namamsg")
const msgemail = document.getElementById("emailmsg")
const msgpw = document.getElementById("pwmsg")
const warnatext = document.querySelectorAll("warna")

const database = []

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key) {
  return JSON.parse(localStorage.getItem(key));
}
btnregister.addEventListener("click",function(e) {
    const nama = namainput.value.trim()
    const email = emailinput.value.trim()
    const pw = paswordinput.value.trim()
    if(!nama || !email || !pw ){
        msgnama.textContent = "Nama Wajib di isi"
        msgemail.textContent = "Email Wajib di isi"
        msgpw.textContent = "Password Wajib di isi"
    } else if(pw.length < 8){
        msgpw.textContent = "Password minimal 8"
    } else{
        let  hasil = {user:nama,email:email,pw:pw}
        database.unshift(hasil)
        save("users",database)
        alert("Data Berhasil di ambil")
        e.preventDefault()
    }
    window.location.href = "../web/login.html"
})

function tesdata(key){
    let data =JSON.parse(localStorage.getItem(key))
    console.log(data);
    
}
