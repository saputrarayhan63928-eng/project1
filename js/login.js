 const namainput = document.getElementById("nameinput")
const emaiinput = document.getElementById("inputemail")
const pwinput = document.getElementById("pwinput" )
const btnlogin = document.getElementById("btnlogin")
const msgnama = document.getElementById("namamsg")
const msgemail = document.getElementById("emailmsg")
const msgpw = document.getElementById("pwmsg")
const warna = document.querySelectorAll("a")
const datausers = JSON.parse(localStorage.getItem("users"))

const data = datausers.map((v) =>{
    return v
})

btnlogin.addEventListener("click", function(e){
    const email = emaiinput.value.trim()
    const pw = pwinput.value.trim()
    const users = namainput.value.trim()
    const cari = data.find(a => a.user === users)
    if(!email || !pw){
        msgpw.textContent = "Password wajib di isi"
        msgemail.textContent = "email wajib di isi"
        msgnama.textContent = "Username Wajib di isi"
    } else if(!(email === cari.email) || !(pw === cari.pw)){
        alert("Email atau Password Salah")
    } else{
        alert("Login Berhasil")
        e.preventDefault()
        window.location.href = "../web/main2.html"
    }
    // console.log(cari);
    
})
console.log("ini hasil dari var data");

console.log(data)