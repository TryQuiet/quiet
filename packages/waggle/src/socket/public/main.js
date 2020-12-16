var socket = io('http://localhost:3000')
window.scrollTo(0,document.body.scrollHeight);
const inboxPeople = document.querySelector(".inbox__people");
const container = document.querySelector(".container");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");

let userName = "";

const newUserConnected = (user) => {
  userName = user || `User${Math.floor(Math.random() * 1000000)}`;
  socket.emit("new user", userName);
  addToUsersBox(userName);
};

const addToUsersBox = (userName) => {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }

  const userBox = `
    <div class="chat_ib ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  inboxPeople.innerHTML += userBox;
};

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
};

const loadAllMessages = (messages) => {
  messageBox.innerHTML = ``
  messages.map(el => {
    const date = new Date(el.timestamp)
    const formattedTime = date.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });
    const myMsg = `
    <div class="outgoing__message">
      <div class="sent__message">
        <p>${el.message}</p>
        <div class="message__info">
          <span class="message__author">${el.from}</span>
          <span class="time_date">${formattedTime}</span>
        </div>
      </div>
    </div>`;
    messageBox.innerHTML += myMsg
  })
  container.scrollIntoView(false)
  // container.scrollTop(container.scrollHeight)
}

// new user is created so we generate nickname and emit event
// newUserConnected();

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log(inputField.value)
  if (!inputField.value) {
    return;
  }
  socket.emit('sendMessage', {
    message: inputField.value
  });
  inputField.value = "";
});

socket.on("message", function (data) {
  addNewMessage({ user: data.from, message: data.message });
  container.scrollIntoView(false)
});

socket.on("fetchAllMessages", function (data) {
  console.log(data, 'data')
  loadAllMessages(data);
});