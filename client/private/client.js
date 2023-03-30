const greeting = document.getElementById("greeting");
const itemList = document.getElementById("itemList");
const itemSearch = document.getElementById("itemSearch");
const searchResults = document.getElementById("searchResults");

/**
 * @param {Array} items
 */
function renderItem(box, items) {
    box.innerHTML = "";
    let html = "";
    items.forEach(
        (x) => {
            html += `
                <form action="/item" method="post">
                    <input type="hidden" name="itemID" value="${x.name}">
                    <input type="submit" value="${x.name}" id="${x.name}">
                </form>
            `;
        }
    );
    box.innerHTML = html;
}

async function getAllItems() {
    try {
        const headerFields = { "Content-Type": "application/json" };
        const response = await fetch(
            `/postAllItemName`,
            {
                method: "POST",
                headers: headerFields
            }
        );
        const data = response.json();
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

async function handleKeyUp(event) {
    const value = event.target.value;
    // console.log(value);
    if (value.length >= 3) {
        try {
            const headerFields = { "Content-Type": "application/json" };
            let obj = { "name": value };
            const response = await fetch(
                `/searchItemByName`,
                {
                    method: "POST",
                    body: JSON.stringify(obj),
                    headers: headerFields
                }
            );
            const data = await response.json();
            renderItem(searchResults, data);
        }
        catch (error) {
            console.log(error);
        }
    }
}

async function main() {
    greeting.innerHTML = "Hi " + window.location.href.split("/").pop() + "👋";
    itemSearch.addEventListener("input", handleKeyUp);
    let allItems = await getAllItems();
    renderItem(itemList, allItems);
}

main();
