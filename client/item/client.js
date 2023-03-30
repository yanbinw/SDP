const itemNameBox = document.getElementById("itemNameBox");
const itemButtonBox = document.getElementById("itemButtonBox");

const itemName = decodeURI(window.location.href.split("/").pop());
itemNameBox.innerHTML = itemName;

async function highlight(name) {
   try {
      const response = await fetch(`https://walldriver.umass-ece-sdp.tech/v0.1/highlight/access_id:${name},bins:\[00ffaa11\]`);
      const data = response.json();
      return data;
   }
   catch (error) {
      console.log(error);
   }
}

function renderTurnOnButton() {
   itemButtonBox.innerHTML = '';
   let html = `<div id="turnOnButton">Turn On</div>`;
   itemButtonBox.innerHTML = html;

   const turnOnButton = document.getElementById("turnOnButton");
   turnOnButton.addEventListener("click",
      async () => {
         renderLoading();
         let response = await highlight(itemName);
         console.log(response);
         let color = response.color;
         let bin = response.access_id;
         alert(`LED highlight ${color} at bin ${bin}`);
         renderTurnOffButton(color, bin);
      }
   );
}

function renderLoading() {
   itemButtonBox.innerHTML = '';
   let html = `<div id="message">Loading</div>`;
   itemButtonBox.innerHTML = html;
}

function renderTurnOffButton(color, bin) {
   itemButtonBox.innerHTML = '';
   let html = `<div id="message">LED highlight ${color} at bin ${bin}</div>`;
   itemButtonBox.innerHTML = html;

   // let html = `
   //    <div id="turnOffButton">Turn Off</div>
   // `;
   // itemButtonBox.innerHTML = html;

   // const turnOffButton = document.getElementById("turnOffButton");
   // turnOffButton.addEventListener("click",
   //    () => {
   //       renderTurnOnButton();
   //       // wait for turn off api
   //    }
   // );
}

renderTurnOnButton();
