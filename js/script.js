async function getapi() {
    try{
        let response = await fetch("https://dummyjson.com/products")
        let ambildata = await response.json()
        return ambildata
    }
    catch{

    }
}

console.log(await getapi())